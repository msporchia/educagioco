/* ═══════════════════════════════════════════════════════════════════
   L'ELENCO DELLE CLASSI, ORDINATE PER LIVELLO

       npm run quiz:livelli          riscrive docs/livelli-delle-domande.md

   Una classe è una terna **modulo · grado · tipologia**: è l'unità con
   cui `nucleo/classi.js` pesca, e quindi l'unica cosa che decide se una
   domanda arriva a un bambino o no. Il documento le mette in fila per
   livello — la scala comune 0..100, dodici punti e mezzo per anno — così
   si vede a colpo d'occhio dove il mazzo è fitto e dove è vuoto.

   PERCHÉ È GENERATO. Prima era scritto a mano, ed è invecchiato al
   primo modulo nuovo: diceva 162 classi su 17 moduli quando i moduli
   erano già 18. Un elenco che si ricava dal codice e che qualcuno
   ricopia è un elenco che prima o poi mente, e questo mente su
   *l'unico numero* che decide chi vede cosa.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

import { anniDelLivello } from '../../src/quiz/nucleo/classi.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const CARTELLA = resolve(QUI, '../../src/quiz/moduli')
const FUORI = resolve(QUI, '../../docs/livelli-delle-domande.md')

/* I moduli si leggono dalla cartella, non dal registro: `registro.js`
   li raccoglie con `import.meta.glob`, che è di Vite e in Node puro
   torna una lista vuota — cioè un documento vuoto senza un errore.
   È lo stesso modo del banco (`banco.mjs`), ed è l'unico che funziona
   da riga di comando. */
const MODULI = []
for (const f of readdirSync(CARTELLA).filter(f => f.endsWith('.js')).sort()) {
  const m = (await import(pathToFileURL(resolve(CARTELLA, f)).href)).default
  if (m) MODULI.push(m)
}
if (!MODULI.length) { console.error('nessun modulo caricato: non riscrivo niente'); process.exit(1) }

/* una riga per ogni terna modulo·grado·tipologia che esiste davvero */
const classi = []
for (const m of MODULI) {
  for (let g = 1; g <= m.gradi; g++) {
    const qui = m.tipi.filter(t => t.gradi?.[g] > 0)
    /* un modulo senza tipologie dichiarate ha una classe per grado, e
       la riga porta la sua riga di scaletta */
    if (!qui.length) {
      classi.push({ m, g, nome: m.scaletta[g - 1], livello: m.livelli[g - 1], suo: false })
      continue
    }
    for (const t of qui)
      classi.push({ m, g, nome: t.nome, livello: m.livelloDelTipo(t, g),
        suo: Number.isFinite(t.livello) })
  }
}

/* per livello, e dentro lo stesso livello per nome di modulo e grado:
   l'ordine dev'essere stabile o ogni rigenerazione sporca il diff */
classi.sort((a, b) => a.livello - b.livello ||
  a.m.nome.localeCompare(b.m.nome) || a.g - b.g || a.nome.localeCompare(b.nome))

/* l'età si arrotonda a un decimale, e il decimale sparisce se è zero:
   «circa 5 anni», non «circa 5.0 anni» */
const anni = l => {
  const a = Math.round(anniDelLivello(l) * 10) / 10
  return Number.isInteger(a) ? String(a) : a.toFixed(1)
}

const righe = [
  '# I livelli delle domande',
  '',
  'Una riga per classe (modulo · grado · tipologia), ordinate per **livello**: un',
  'numero da 0 a 100 sulla stessa scala per tutte le materie — 0 è il primo giorno',
  'di materna, 100 la fine della primaria, dodici punti e mezzo per anno di scuola.',
  "Fra parentesi l'età che corrisponde, che è come si legge nella schermata dei grandi.",
  '',
  'Il livello dice **quanto è complicata**, non a chi arriva: quello lo decide la',
  'finestra di chi gioca (16 punti sotto la sua età, 20 sopra, allargata quando il',
  'mazzo è magro). Le righe con ⚑ hanno un livello dichiarato sulla tipologia,',
  'diverso da quello del suo grado.',
  '',
  '**Questo file è generato** da `npm run quiz:livelli`: non si scrive a mano.',
  '',
]

let ultimo = null
for (const c of classi) {
  if (c.livello !== ultimo) {
    righe.push('', `## ${c.livello}  ·  circa ${anni(c.livello)} anni`, '')
    ultimo = c.livello
  }
  righe.push(`- ${c.suo ? '⚑ ' : ''}${c.m.icona} **${c.m.nome}** g${c.g} — ${c.nome}`)
}

righe.push('', '---', '',
  `Totale: ${classi.length} classi su ${MODULI.length} moduli.`, '')

writeFileSync(FUORI, righe.join('\n'))
console.log(`${classi.length} classi da ${MODULI.length} moduli → docs/livelli-delle-domande.md`)
