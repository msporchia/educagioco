/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DI PROVA DEI MODULI DI QUIZ

   Un modulo di quiz è una fabbrica di domande, e una fabbrica non si
   collauda a mano: si tirano mille pezzi e si guarda quanti escono
   storti. Questo banco fa girare ogni modulo della cartella per ogni
   grado, senza browser, e dice cosa non va:

     · la forma della domanda (`nucleo/domanda.js` la conosce);
     · le risposte doppie, che è come si scopre una domanda con due
       risposte giuste o un distrattore uguale alla buona;
     · le scene senza pittore;
     · la VARIETÀ: se in trecento tiri escono venti domande diverse,
       quel modulo si impara a memoria in tre partite e non serve a
       niente — è il guasto che nessuno vedrebbe giocando una volta;
     · il caso ripetibile: stesso seme, stessa domanda. Un modulo che
       chiama `Math.random()` di nascosto qui si vede subito.

     node strumenti/quiz/banco.mjs                 tutti
     node strumenti/quiz/banco.mjs orologio        uno solo
     node strumenti/quiz/banco.mjs --tiri 2000     più a fondo
     node strumenti/quiz/banco.mjs --mostra 3      stampa 3 domande per grado

   I moduli si raccolgono dalla cartella: aggiungerne uno non vuol dire
   toccare questo file, e nessun modulo può dimenticarsi di essere
   provato.
   ═══════════════════════════════════════════════════════════════════ */

import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import { guastiDi } from '../../src/quiz/nucleo/domanda.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const MODULI = resolve(QUI, '../../src/quiz/moduli')

const MATERIE = ['italiano', 'matematica', 'spazio', 'tempo', 'logica', 'scienze']

/* l'impronta di una domanda: due domande con la stessa impronta sono la
   stessa domanda, anche se le risposte sono mescolate diversamente */
function impronta(d) {
  const r = d.risposte.map(x =>
    x.testo ?? x.emoji ?? JSON.stringify(x.scena)).slice().sort().join('|')
  const s = d.soggetto ? (d.soggetto.testo ?? d.soggetto.emoji ?? JSON.stringify(d.soggetto.scena)) : ''
  return `${d.testo}§${s}§${r}`
}

export function provaModulo(modulo, { tiri = 600, mostra = 0 } = {}) {
  const guasti = []
  const dice = (c, m) => { if (!c) guasti.push(m) }

  /* ── la carta d'identità ── */
  dice(/^[a-z][a-z0-9-]*$/.test(modulo.id || ''), `id malformato: ${modulo.id}`)
  dice(!!modulo.nome, 'manca il nome')
  dice(!!modulo.icona, 'manca l\'icona')
  dice(MATERIE.includes(modulo.materia), `materia sconosciuta: ${modulo.materia} (una fra ${MATERIE.join(', ')})`)
  dice(!!modulo.chiaro, 'manca «chiaro»: cosa allena, detto a un genitore')
  dice(Array.isArray(modulo.scaletta) && modulo.scaletta.length >= 3,
    `la scaletta vuole almeno 3 gradi, ne ha ${modulo.scaletta?.length}`)
  if (guasti.length) return { guasti, righe: [] }

  const righe = []
  const chiaviTutte = new Set()
  const esempi = []

  for (let grado = 1; grado <= modulo.gradi; grado++) {
    const viste = new Set()
    const chiavi = new Set()
    const posizioni = new Map()
    let quante = 0

    for (let t = 0; t < tiri; t++) {
      const sorte = new Sorte(grado * 100003 + t)
      let d
      try { d = modulo.chiedi(grado, sorte) } catch (e) {
        guasti.push(`grado ${grado}, seme ${t}: è esploso — ${e.message}`)
        break
      }
      const g = guastiDi(d, { pittori: modulo.pittori })
      if (g.length && guasti.length < 12) guasti.push(`grado ${grado}, seme ${t}: ${g.join('; ')} → «${d?.testo}»`)
      if (g.length) continue

      viste.add(impronta(d))
      chiavi.add(d.chiave)
      chiaviTutte.add(d.chiave)
      posizioni.set(d.giusta, (posizioni.get(d.giusta) || 0) + 1)
      quante++

      /* il caso ripetibile: rigenerata con lo stesso seme dev'essere
         identica, altrimenti il banco non prova niente */
      if (t < 30) {
        const bis = modulo.chiedi(grado, new Sorte(grado * 100003 + t))
        if (JSON.stringify(bis) !== JSON.stringify(d))
          guasti.push(`grado ${grado}, seme ${t}: non è ripetibile (Math.random di nascosto?)`)
      }
      if (esempi.length < mostra * modulo.gradi && t < mostra) esempi.push({ grado, d })
    }

    const varieta = quante ? viste.size / quante : 0
    dice(viste.size >= 25, `grado ${grado}: solo ${viste.size} domande diverse su ${quante} tiri — troppo poche, si impara a memoria`)
    /* la giusta non deve stare quasi sempre nello stesso posto */
    const massima = Math.max(0, ...posizioni.values())
    dice(!quante || massima / quante < 0.75,
      `grado ${grado}: la risposta giusta è nella stessa posizione ${Math.round(massima / quante * 100)}% delle volte`)

    righe.push({ grado, dice: modulo.scaletta[grado - 1], diverse: viste.size, tiri: quante, varieta, chiavi: chiavi.size })
  }

  dice(chiaviTutte.size >= 2, `una chiave sola (${[...chiaviTutte]}) — non si potrà dosare il ripasso`)
  dice(chiaviTutte.size <= 25, `${chiaviTutte.size} chiavi: sono concetti o istanze? la chiave è il concetto`)

  return { guasti, righe, chiavi: [...chiaviTutte].sort(), esempi }
}

/* ── da riga di comando ── */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const num = (nome, difetto) => {
    const i = args.indexOf('--' + nome)
    return i >= 0 ? Number(args[i + 1]) : difetto
  }
  const tiri = num('tiri', 600)
  const mostra = num('mostra', 0)
  const filtro = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))[0]

  const files = readdirSync(MODULI).filter(f => f.endsWith('.js')).sort()
    .filter(f => !filtro || f.includes(filtro))
  if (!files.length) { console.error('nessun modulo' + (filtro ? ` per «${filtro}»` : '')); process.exit(1) }

  let guasti = 0
  for (const f of files) {
    /* un modulo che non si importa nemmeno non deve fermare gli altri:
       è un guasto suo, e gli altri vanno provati lo stesso */
    let mod = null
    try { mod = (await import(pathToFileURL(resolve(MODULI, f)).href)).default }
    catch (e) { console.log(`\n✗ ${f}: non si importa — ${e.message.split('\n')[0]}`); guasti++; continue }
    if (!mod) { console.log(`✗ ${f}: non esporta un modulo di default`); guasti++; continue }
    const r = provaModulo(mod, { tiri, mostra })
    const capo = `${mod.icona || '?'} ${mod.nome || f} (${mod.materia})`
    if (r.guasti.length) {
      guasti++
      console.log(`\n✗ ${capo}`)
      r.guasti.slice(0, 12).forEach(g => console.log('   · ' + g))
    } else {
      console.log(`\n✓ ${capo}`)
    }
    for (const g of r.righe)
      console.log(`   grado ${g.grado} — ${String(g.dice).padEnd(34)} ${String(g.diverse).padStart(5)} domande diverse, ${g.chiavi} chiavi`)
    if (r.chiavi?.length) console.log('   chiavi: ' + r.chiavi.join(' '))
    /* la consegna può andare a capo (le premesse della logica stanno
       una per riga): qui va tutto su una riga sola, o l'elenco degli
       esempi diventa illeggibile */
    for (const e of r.esempi || [])
      console.log(`   ‹${e.grado}› ${e.d.testo.replace(/\s*\n\s*/g, ' ')}  →  ` +
        e.d.risposte.map((x, i) => (i === e.d.giusta ? '[' : '') + (x.testo ?? x.emoji ?? '🖼') + (i === e.d.giusta ? ']' : '')).join('  '))
  }
  console.log('')
  process.exit(guasti ? 1 : 0)
}
