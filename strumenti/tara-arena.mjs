// Tarare Castle Battle: ogni tappa ha la sua scheda del nemico, cercata giocando
// per davvero con una bisezione su una manopola sola (`d`: 0 = nemico quasi inerme,
// 1 = pari al giocatore bravo) finché il «bambino» di prova vince la quota che la
// tappa promette. Vedi docs/arena/taratura.md.
//   npm run tara:arena                  # tara tutto e riscrive dati/taratura.js
//   npm run tara:arena -- --prova       # tara e stampa, senza scrivere niente
//   npm run tara:arena -- --da 0.9 --a 0.5 --volte 150
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CAMPAGNA, sfidaDi } from '../src/giochi/arena/dati/campagna.js'
import { misura, PILOTI } from '../src/giochi/arena/motore/banco.js'
import { firmaEquilibrio } from '../src/giochi/arena/motore/firma.js'

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const prova = argv.includes('--prova')
const opz = (nome, def) => { const i = argv.indexOf(nome); return i >= 0 ? Number(argv[i + 1]) : def }
const DA = opz('--da', 0.9)         // la quota di vittorie del bambino nella prima tappa
const A = opz('--a', 0.45)         // e nell'ultima
const VOLTE = opz('--volte', 120)
const GIRI = 8
const D_MAX = 1.6

/* la manopola: da un nemico che quasi non gioca a uno più bravo del giocatore */
export const nemicoDi = d => ({
  d: +d.toFixed(3),
  moneteAlSecondo: +(0.12 + 0.62 * d).toFixed(3),
  pensa: +(3.0 - 1.6 * d).toFixed(2),
  forza: +(0.5 + 0.55 * d).toFixed(3),
})

const vinte = (tappa, d, pilota, volte = VOLTE) =>
  misura({ volte, sfida: { ...sfidaDi(tappa), nemico: nemicoDi(d) }, pilota }).vinte / volte

const bersaglio = i => DA + (A - DA) * (i / Math.max(1, CAMPAGNA.length - 1))
const risultati = {}
for (const [i, t] of CAMPAGNA.entries()) {
  const mira = bersaglio(i)
  // la manopola non è vincolata a salire: con più truppe a disposizione anche il
  // nemico è più forte a parità di `d`, e la rampa la fa la quota di vittorie
  let basso = 0, alto = D_MAX
  if (vinte(t, basso, PILOTI.bambino) < mira) { risultati[t.chiave] = basso } else {
    for (let g = 0; g < GIRI; g++) {
      const m = (basso + alto) / 2
      if (vinte(t, m, PILOTI.bambino) >= mira) basso = m; else alto = m
    }
    risultati[t.chiave] = (basso + alto) / 2
  }
  const d = risultati[t.chiave]
  const riga = Object.entries(PILOTI).map(([n, p]) => `${n} ${Math.round(vinte(t, d, p, 80) * 100)}%`).join(' · ')
  console.log(`${String(i + 1).padStart(2)} ${t.chiave.padEnd(12)} d=${d.toFixed(2)}  (bersaglio ${Math.round(mira * 100)}%)  ${riga}`)
}

if (!prova) {
  const righe = CAMPAGNA.map(t => `  ${t.chiave}: ${JSON.stringify(nemicoDi(risultati[t.chiave])).replace(/"(\w+)":/g, '$1: ').replace(/,/g, ', ').replace(/\{/, '{ ').replace(/\}/, ' }')},`)
  const file = join(RADICE, 'src/giochi/arena/dati/taratura.js')
  const intestazione = `/* GENERATO da strumenti/tara-arena.mjs (\`npm run tara:arena\`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, trovata giocando: \`forza\` (le sue truppe
   rispetto alle tue), \`moneteAlSecondo\` e \`pensa\` (ogni quanti secondi decide)
   sono funzione di una sola manopola \`d\` (0 = quasi inerme, 1 = pari al giocatore
   bravo), cercata per bisezione perché il bambino di prova vinca la quota
   che la tappa promette. Vedi docs/arena/taratura.md. */
`
  writeFileSync(file, `${intestazione}export const NEMICO = {\n${righe.join('\n')}\n}\n// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura\nexport const FIRMA = '${firmaEquilibrio()}'\n`)
  console.log(`\nscritto ${file}`)
}
