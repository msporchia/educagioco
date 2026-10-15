// Tarare Castle Battle: ogni tappa ha la sua scheda del nemico, cercata giocando
// per davvero con una bisezione su una manopola sola (`d`: 0 = nemico quasi inerme,
// 1 = pari al giocatore bravo). Due promesse: il «bambino» di prova vince almeno la
// quota della tappa, e chi non sbaglia mai e risponde svelto («misura») non vince più
// della sua: in cima il nemico è quasi imbattibile. Vale la più dura. Vedi docs/arena/taratura.md.
//   npm run tara:arena                  # tara tutto e riscrive dati/taratura.js
//   npm run tara:arena -- --prova       # tara e stampa, senza scrivere niente
//   npm run tara:arena -- --da 0.9 --a 0.5 --volte 150   # la rampa del bambino
//   npm run tara:arena -- --bravo-da 0.8 --bravo-a 0.5 --bravo-dalla 10   # e quella di chi non sbaglia
//   npm run tara:arena -- --duelli      # le truppe a duello, squadre uguali in campo aperto
//   npm run tara:arena -- --misura      # i giocatori finti contro la taratura di adesso, senza ritarare
//   npm run tara:arena -- --misura --d 1 --furbizia 0   # contro un nemico fisso (la furbizia forzata)
//   npm run tara:arena -- --infinita    # i giocatori finti nella battaglia infinita, un terreno alla volta (non tara niente)
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CAMPAGNA, sfidaDi, sfidaInfinita } from '../src/giochi/arena/dati/campagna.js'
import { PILOTI, caso } from '../src/giochi/arena/motore/banco.js'
import { misuraParallela as misura, chiudiBanco } from './banco-parallelo.mjs'
import { Partita } from '../src/giochi/arena/motore/partita.js'
import { TRUPPE, GIOCATORE, TERRENI } from '../src/giochi/arena/dati/regole.js'
import { firmaEquilibrio } from '../src/giochi/arena/motore/firma.js'
import { NEMICO } from '../src/giochi/arena/dati/taratura.js'

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const prova = argv.includes('--prova')
const opz = (nome, def) => { const i = argv.indexOf(nome); return i >= 0 ? Number(argv[i + 1]) : def }
const DA = opz('--da', 0.9)         // la quota di vittorie del bambino nella prima tappa
const A = opz('--a', 0.3)          // e nell'ultima (nella lava decide il bravo, e il bambino scende sotto)
const BRAVO_DALLA = opz('--bravo-dalla', 10)  // la prima tappa (da 1) in cui conta anche il bravo: la lava
const BRAVO_DA = opz('--bravo-da', 0.8)  // le vittorie massime di chi non sbaglia mai, in quella tappa
const BRAVO_A = opz('--bravo-a', 0.5)    // e nell'ultima: in cima si vince solo rispondendo bene e svelti
const VOLTE = opz('--volte', 120)
const GIRI = 8
const D_MAX = 2

/* la manopola: da un nemico che quasi non gioca a uno bravo quanto il giocatore. Monete e forza
   delle truppe salgono fino a pari (d = 1) e non oltre: più su il nemico non diventa più ricco ma
   più svelto a pensare e più furbo (docs/arena/nemico.md) */
export const nemicoDi = d => {
  const pari = Math.min(d, 1)
  return {
    d: +d.toFixed(3),
    moneteAlSecondo: +(GIOCATORE.moneteAlSecondo * (0.45 + 0.55 * pari)).toFixed(3),
    pensa: +(3.0 - 2.2 * Math.min(d, D_MAX) / D_MAX).toFixed(2),
    forza: +(0.6 + 0.4 * pari).toFixed(3),
    furbizia: +Math.min(1, Math.max(0, (d - 0.5) / (D_MAX - 0.5))).toFixed(3),
  }
}

const vinte = async (tappa, d, pilota, volte = VOLTE) =>
  (await misura({ volte, sfida: { ...sfidaDi(tappa), nemico: nemicoDi(d) }, pilota })).vinte / volte

/* I duelli: tre squadre per parte, allo stesso livello, in campo aperto (niente porte né
   caserme, castelli che non cadono). Dice chi batte chi, e se una truppa batte tutte: la
   calibrazione di vita e danno si guarda qui (docs/arena/regole.md). Il golem non duella:
   ignora le truppe. */
if (argv.includes('--duelli')) {
  const ids = Object.keys(TRUPPE).filter(id => TRUPPE[id].bers !== 'torri')
  const duello = (a, b, seme) => {
    const p = new Partita({ rnd: caso(seme) })
    p.muri = []; p.caserme = []
    for (const c of p.castelli) { c.hp = c.max = 1e7; c.liv = 0 }
    p.muoviCastello = () => {}                                   // i castelli non sparano: conta solo chi duella
    p.pensa = 1e9; p.nemicoCfg = { ...p.nemicoCfg, pensa: 1e9 }     // e il nemico non gioca
    for (const x of [140, 180, 220]) { p.schiera('io', a, x, 330); p.schiera('nem', b, x, 210) }
    for (let t = 0; t < 120; t += 0.5) {
      p.avanza(0.5)
      const vivi = l => p.unita.filter(u => u.lato === l && u.hp > 0)
      if (!vivi('io').length || !vivi('nem').length) break
    }
    const resta = l => p.unita.filter(u => u.lato === l).reduce((s, u) => s + u.hp / u.max, 0)
    return Math.sign(resta('io') - resta('nem'))
  }
  console.log('chi sta nella riga batte chi sta nella colonna (su 10)\n')
  console.log(''.padEnd(12) + ids.map(b => TRUPPE[b].nome.slice(0, 6).padStart(7)).join(''))
  for (const a of ids) {
    let vinte = 0
    const celle = ids.map(b => {
      if (a === b) return '     · '
      let v = 0
      for (let s = 1; s <= 10; s++) v += duello(a, b, s) > 0 ? 1 : 0
      vinte += v
      return String(v).padStart(6) + ' '
    })
    console.log(TRUPPE[a].nome.padEnd(12) + celle.join('') + `   ${Math.round(vinte / (10 * (ids.length - 1)) * 100)}%`)
  }
  process.exit(0)
}

/* Quanto vince ogni giocatore finto contro il nemico scritto adesso: per guardare una regola
   nuova (il rush contro l'economia, il pigro) prima di ritarare. */
if (argv.includes('--misura')) {
  const fisso = argv.includes('--d') ? nemicoDi(opz('--d', 1)) : null
  const furbo = argv.includes('--furbizia') ? { furbizia: opz('--furbizia', 0) } : {}
  for (const [i, t] of CAMPAGNA.entries()) {
    const sfida = { ...sfidaDi(t), nemico: { ...(fisso || NEMICO[t.chiave]), ...furbo } }
    // con la durata media: verso i 180 secondi si vince ai punti, molto meno abbattendo il castello
    const riga = (await Promise.all(Object.entries(PILOTI).map(async ([n, p]) => { const r = await misura({ volte: 80, sfida, pilota: p }); return `${n} ${Math.round(r.vinte / 80 * 100)}% ${r.secondi}s` }))).join(' · ')
    console.log(`${String(i + 1).padStart(2)} ${t.chiave.padEnd(12)} d=${sfida.nemico.d.toFixed(2)}  ${riga}`)
  }
  process.exit(0)
}

/* La battaglia infinita: il nemico dell'ultima tappa e le truppe di ogni terreno, senza timer. Dice quanto vincono
   i giocatori finti e in quanto tempo finisce; se una battaglia resta in piedi oltre il limite (30 minuti di partita)
   finisce fra le «aperte»: un nemico che non si batte e non batte. Non scrive niente. */
if (argv.includes('--infinita')) {
  const LIMITE = 1800
  for (const terreno of TERRENI) {
    const sfida = sfidaInfinita(terreno)
    const riga = (await Promise.all(Object.entries(PILOTI).map(async ([n, p]) => {
      const r = await misura({ volte: 30, sfida, pilota: p, limite: LIMITE })
      return `${n} ${Math.round(r.vinte / 30 * 100)}% ${r.secondi}s${r.pari ? ` (${r.pari} aperte)` : ''}`
    }))).join(' · ')
    console.log(`${terreno.padEnd(7)} ${riga}`)
  }
  process.exit(0)
}

const rampa = (da, a) => i => da + (a - da) * (i / Math.max(1, CAMPAGNA.length - 1))
const bersaglio = rampa(DA, A)
const tettoBravo = i => {
  const da = BRAVO_DALLA - 1, quante = CAMPAGNA.length - 1 - da
  return i < da ? 1 : BRAVO_DA + (BRAVO_A - BRAVO_DA) * ((i - da) / Math.max(1, quante))
}

/* il `d` più alto a cui `pilota` vince ancora almeno `quota` (le vittorie scendono col `d`) */
async function finoA(t, pilota, quota) {
  let basso = 0, alto = D_MAX
  if (await vinte(t, basso, pilota) < quota) return basso
  if (await vinte(t, alto, pilota) >= quota) return alto
  for (let g = 0; g < GIRI; g++) {
    const m = (basso + alto) / 2
    if (await vinte(t, m, pilota) >= quota) basso = m; else alto = m
  }
  return (basso + alto) / 2
}

const risultati = {}
for (const [i, t] of CAMPAGNA.entries()) {
  const mira = bersaglio(i), tetto = tettoBravo(i)
  // la manopola non è vincolata a salire: con più truppe a disposizione anche il
  // nemico è più forte a parità di `d`, e la rampa la fa la quota di vittorie.
  // Il bambino dà il nemico più forte che gli lascia la quota; se a quel nemico il
  // bravo vince più del suo tetto, si sale finché non ci sta (e il bambino scende)
  const dBambino = await finoA(t, PILOTI.bambino, mira)
  const dBravo = tetto >= 1 ? 0 : await finoA(t, PILOTI.misura, tetto + 0.001)
  const d = risultati[t.chiave] = Math.max(dBambino, dBravo)
  const chi = d > dBambino ? 'il bravo' : 'il bambino'
  const riga = (await Promise.all(Object.entries(PILOTI).map(async ([n, p]) => `${n} ${Math.round(await vinte(t, d, p, 80) * 100)}%`))).join(' · ')
  console.log(`${String(i + 1).padStart(2)} ${t.chiave.padEnd(12)} d=${d.toFixed(2)}  (bambino ≥ ${Math.round(mira * 100)}%, bravo ≤ ${Math.round(tetto * 100)}%: decide ${chi})  ${riga}`)
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
chiudiBanco()
