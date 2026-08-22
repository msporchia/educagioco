#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   LE 24 TAPPE, PORTATE DENTRO L'EDITOR

   Le campagne del Generale stanno in `src/data/campagne-generale.js`:
   ventiquattro tappe già progettate — titolo, storia, concetto da
   insegnare, cassetta, par, e le tre scene descritte a parole — tutte
   con `mappa: null`, in attesa che qualcuno le disegni.

   L'editor però si apre col doppio click, da `file://`, e da lì un
   modulo ES non si carica: niente `import`, niente `fetch`. Quindi il
   dato va portato dentro in un file che si legge con un tag <script>
   normale — è la stessa ragione per cui `nucleo.js` non ha né `import`
   né `export`.

   Questo comando fa quel viaggio, una volta sola:

     node strumenti/mappe/estrai-campagne.mjs           riscrive campagne.js
     node strumenti/mappe/estrai-campagne.mjs --prova   dice solo se è vecchio

   `strumenti/mappe/campagne.js` è **generato, non si scrive a mano**,
   come `src/data/taratura-castello.js`. E come quello ha una firma: il
   test `unita/mappe` la confronta con il dato vero e diventa rosso il
   giorno che qualcuno aggiunge una tappa e si dimentica di rilanciarlo.

   Qui si traduce anche la cassetta: le campagne sono state progettate
   con un vocabolario più fine di quello dei livelli («fai un passo»,
   «attacca», «difendi»), e la tabella che mette in fila le due lingue
   sta in `nucleo.js`, non qui.
   ═══════════════════════════════════════════════════════════════════ */
import './nucleo.js'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createHash } from 'node:crypto'

const { DA_CAMPAGNA, stampa } = globalThis.MAPPE
const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '../..')
const FUORI = resolve(QUI, 'campagne.js')

/* Quello che serve a chi disegna, e nient'altro: la parte di regole
   (sblocchi, stelle, monete) non c'entra con una mappa. */
export function estrai(dati) {
  const campagne = dati.CAMPAGNE.map(c => ({
    id: c.id, nome: c.nome, emoji: c.emoji, sottotitolo: c.sottotitolo,
    tappe: c.tappe.map((t, n) => {
      const concetto = dati.CONCETTO[t.concetto] || {}
      const cassetta = [], scartati = []
      for (const o of t.cassetta || []) {
        const d = DA_CAMPAGNA[o]
        if (d && d.verbo) { if (!cassetta.includes(d.verbo)) cassetta.push(d.verbo) }
        else scartati.push({ ordine: o, perche: (d && d.perche) || 'non è un verbo di questo formato' })
      }
      return {
        n: n + 1, id: t.id, nome: t.nome, emoji: t.emoji || '',
        storia: t.storia || '', dritta: t.dritta || '',
        concetto: { id: t.concetto, nome: concetto.nome || '', cosa: concetto.cosa || '' },
        idea: t.nuovaIdea || '',
        cassetta, scartati,
        par: t.par, unita: t.unita || 1,
        attori: t.attori || [], nemico: t.nemico || null,
        scene: t.varianti || [],
        haMappa: !!t.mappa,
      }
    }),
  }))
  return { campagne }
}

/* La firma dice se il ritratto è ancora somigliante. Non è del file
   generato: è di quello che ci sta dentro, così riformattarlo non fa
   diventare rosso un test. */
export const firmaDi = quadro => createHash('sha1')
  .update(JSON.stringify(quadro.campagne)).digest('hex').slice(0, 12)

export const firmaScritta = () => {
  if (!existsSync(FUORI)) return null
  const m = readFileSync(FUORI, 'utf8').match(/firma: '([0-9a-f]+)'/)
  return m ? m[1] : null
}

/* ── da qui in giù solo quando è chiamato a mano: importarlo (lo fa il
      test, per rifare il ritratto e confrontarlo) non deve riscrivere
      niente ── */
if (import.meta.url !== pathToFileURL(process.argv[1]).href) { /* importato: basta così */ } else {

const dati = await import(pathToFileURL(resolve(RADICE, 'src/data/campagne-generale.js')).href)
const quadro = estrai(dati)
const firma = firmaDi(quadro)
const quante = quadro.campagne.reduce((n, c) => n + c.tappe.length, 0)

if (process.argv.includes('--prova')) {
  const vecchia = firmaScritta()
  if (vecchia === firma) console.log(`✅ campagne.js è fresco — ${quante} tappe, firma ${firma}`)
  else console.log(`⚠️  campagne.js è vecchio (dice ${vecchia}, il dato dice ${firma}): ` +
                   'rilancia `node strumenti/mappe/estrai-campagne.mjs`')
  process.exit(vecchia === firma ? 0 : 1)
}

const testa = `/* ═══════════════════════════════════════════════════════════════════
   LE CAMPAGNE DEL GENERALE, PER L'EDITOR — FILE GENERATO

   Non si scrive a mano: esce da \`node strumenti/mappe/estrai-campagne.mjs\`,
   che lo ricava da \`src/data/campagne-generale.js\`. Serve perché
   l'editor si apre da \`file://\`, dove un modulo ES non si carica.

   Rilancialo quando cambiano le tappe: il test \`unita/mappe\` confronta
   la firma e diventa rosso se questo file è di ieri.

   ${quante} tappe, firma ${firma}.
   ═══════════════════════════════════════════════════════════════════ */
globalThis.CAMPAGNE_MAPPE = {
  firma: '${firma}',
  campagne: `

writeFileSync(FUORI, testa + stampa(quadro.campagne, '  ') + ',\n}\n')
console.log(`✅ scritto strumenti/mappe/campagne.js — ${quante} tappe in ` +
            `${quadro.campagne.length} campagne, firma ${firma}`)
for (const c of quadro.campagne) {
  const fatte = c.tappe.filter(t => t.haMappa).length
  console.log(`   ${c.emoji} ${c.nome}: ${fatte}/${c.tappe.length} con la mappa`)
}
const persi = new Map()
for (const c of quadro.campagne) for (const t of c.tappe) for (const s of t.scartati) persi.set(s.ordine, s.perche)
if (persi.size) {
  console.log('   ordini della campagna che nel formato non sono verbi:')
  for (const [o, perche] of persi) console.log(`     · «${o}» — ${perche}`)
}

}
