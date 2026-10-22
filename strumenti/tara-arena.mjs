// Tarare Castle Battle: ogni tappa ha la sua scheda del nemico, cercata giocando
// per davvero con una bisezione su una manopola sola (`d`: 0 = nemico quasi inerme,
// 1 = pari al giocatore bravo). Due promesse: il «bambino» di prova vince almeno la
// quota della tappa, e chi non sbaglia mai («misura») non vince più della sua (da `LIVELLI`,
// un livello di difficoltà ciascuno). Vale la più dura. Vedi docs/arena/taratura.md.
//   npm run tara:arena                  # tara i tre livelli (facile, medio, difficile) e riscrive dati/taratura.js
//   npm run tara:arena -- --prova       # tara e stampa, senza scrivere niente
//   npm run tara:arena -- --livello medio   # solo quel livello (gli altri restano com'erano); con --misura, contro quel livello
//   npm run tara:arena -- --livello medio --da 0.9 --a 0.5 --volte 150   # la rampa del bambino, per quel livello
//   npm run tara:arena -- --duelli      # le truppe a duello, squadre uguali in campo aperto
//   npm run tara:arena -- --duelli --budget 120   # ...a parità di monete (quante squadre si comprano con 120)
//   npm run tara:arena -- --misura      # i giocatori finti contro la taratura di adesso, senza ritarare
//   npm run tara:arena -- --misura --d 1 --furbizia 0   # contro un nemico fisso (la furbizia forzata)
//   npm run tara:arena -- --misura --ricco 1.3   # nemico con il 30% di monete e di forza in più
//   npm run tara:arena -- --misura --draghi   # e anche chi fa solo draghi, senza miniera
//   npm run tara:arena -- --infinita    # i giocatori finti nella battaglia infinita, un livello e un terreno alla volta (--livello: uno solo; non tara niente)
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CAMPAGNA, sfidaDi, sfidaInfinita } from '../src/giochi/arena/dati/campagna.js'
import { PILOTI, caso } from '../src/giochi/arena/motore/banco.js'
import { misuraParallela as misura, chiudiBanco } from './banco-parallelo.mjs'
import { Partita } from '../src/giochi/arena/motore/partita.js'
import { TRUPPE, GIOCATORE, TERRENI } from '../src/giochi/arena/dati/regole.js'
import { firmaEquilibrio } from '../src/giochi/arena/motore/firma.js'
import { NEMICO, NEMICO_PER_LIVELLO } from '../src/giochi/arena/dati/taratura.js'

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const prova = argv.includes('--prova')
const opz = (nome, def) => { const i = argv.indexOf(nome); return i >= 0 ? Number(argv[i + 1]) : def }
/* I tre livelli di difficoltà: per ognuno la rampa del bambino di prova (la quota di vittorie nella prima tappa e
   nell'ultima) e il tetto di chi non sbaglia mai (`misura`), che conta dalla tappa `dalla` (da 1) e scende da `da` ad `a`.
   Facile non ha tetto: il nemico lo regola solo il bambino. Il nemico non diventa più ricco ma più bravo (`nemicoDi`). */
export const LIVELLI = {
  facile:    { da: 0.95, a: 0.6,  bravo: null },
  medio:     { da: 0.8,  a: 0.3,  bravo: { dalla: 2, da: 0.8,  a: 0.4 } },
  difficile: { da: 0.7,  a: 0.15, bravo: { dalla: 3, da: 0.7,  a: 0.2 } },
}
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
  const BUDGET = opz('--budget', 0)   // se c'è: ogni parte spende quelle monete in squadre della stessa truppa (a parità di prezzo, non di squadre)
  const ids = Object.keys(TRUPPE).filter(id => TRUPPE[id].bers !== 'torri')
  const duello = (a, b, seme) => {
    const p = new Partita({ rnd: caso(seme) })
    p.muri = []; p.caserme = []
    for (const c of p.castelli) { c.hp = c.max = 1e7; c.liv = 0 }
    p.muoviCastello = () => {}                                   // i castelli non sparano: conta solo chi duella
    p.pensa = 1e9; p.nemicoCfg = { ...p.nemicoCfg, pensa: 1e9 }     // e il nemico non gioca
    const squadre = t => Math.max(1, Math.floor(BUDGET / TRUPPE[t].costo))
    const mettile = (lato, t, y0, dy) => { for (let k = 0; k < squadre(t); k++) p.schiera(lato, t, 40 + (k % 9) * 28, y0 + dy * Math.floor(k / 9) * 14) }
    if (BUDGET) { mettile('io', a, 330, 1); mettile('nem', b, 210, -1) }
    else for (const x of [140, 180, 220]) { p.schiera('io', a, x, 330); p.schiera('nem', b, x, 210) }
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
  // chi gioca come il bambino di casa: solo draghi (`--draghi`), tutto in truppe e mai la miniera; non entra nella firma
  const EXTRA = argv.includes('--draghi') ? { draghi: { ...PILOTI.rush, truppa: 'drago' } } : {}
  const fisso = argv.includes('--d') ? nemicoDi(opz('--d', 1)) : null
  const livelloMisura = argv.includes('--livello') ? argv[argv.indexOf('--livello') + 1] : 'medio'
  const furbo = argv.includes('--furbizia') ? { furbizia: opz('--furbizia', 0) } : {}
  const ricco = opz('--ricco', 1)   // monete e forza del nemico moltiplicate (1 = come scritto): quanto vantaggio serve contro chi non sbaglia
  for (const [i, t] of CAMPAGNA.entries()) {
    const base = { ...(fisso || NEMICO_PER_LIVELLO[livelloMisura][t.chiave]), ...furbo }
    const sfida = { ...sfidaDi(t), nemico: { ...base, moneteAlSecondo: +(base.moneteAlSecondo * ricco).toFixed(3), forza: +(base.forza * ricco).toFixed(3) } }
    // con la durata media: verso i 180 secondi si vince ai punti, molto meno abbattendo il castello
    const riga = (await Promise.all(Object.entries({ ...PILOTI, ...EXTRA }).map(async ([n, p]) => { const r = await misura({ volte: 80, sfida, pilota: p }); return `${n} ${Math.round(r.vinte / 80 * 100)}% ${r.secondi}s` }))).join(' · ')
    console.log(`${String(i + 1).padStart(2)} ${t.chiave.padEnd(12)} d=${sfida.nemico.d.toFixed(2)}  ${riga}`)
  }
  process.exit(0)
}

/* La battaglia infinita: il nemico dell'ultima tappa e le truppe di ogni terreno, senza timer. Dice quanto vincono
   i giocatori finti e in quanto tempo finisce; se una battaglia resta in piedi oltre il limite (30 minuti di partita)
   finisce fra le «aperte»: un nemico che non si batte e non batte. Non scrive niente. */
if (argv.includes('--infinita')) {
  const LIMITE = 1800
  const livelli = argv.includes('--livello') ? [argv[argv.indexOf('--livello') + 1]] : Object.keys(LIVELLI)
  for (const livello of livelli) for (const terreno of TERRENI) {
    const sfida = sfidaInfinita(terreno, livello)
    const riga = (await Promise.all(Object.entries(PILOTI).map(async ([n, p]) => {
      const r = await misura({ volte: 30, sfida, pilota: p, limite: LIMITE })
      return `${n} ${Math.round(r.vinte / 30 * 100)}% ${r.secondi}s${r.pari ? ` (${r.pari} aperte)` : ''}`
    }))).join(' · ')
    console.log(`${livello.padEnd(9)} ${terreno.padEnd(7)} ${riga}`)
  }
  process.exit(0)
}

const rampa = (da, a) => i => da + (a - da) * (i / Math.max(1, CAMPAGNA.length - 1))

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

const soloQuesto = argv.includes('--livello') ? argv[argv.indexOf('--livello') + 1] : null
const tutti = {}
for (const [livello, spec] of Object.entries(LIVELLI)) {
  if (soloQuesto && soloQuesto !== livello) { tutti[livello] = NEMICO_PER_LIVELLO[livello]; continue }
  const bersaglio = rampa(opz('--da', spec.da), opz('--a', spec.a))
  const b = spec.bravo
  const tettoBravo = i => {
    if (!b) return 1
    const da = b.dalla - 1, quante = CAMPAGNA.length - 1 - da
    return i < da ? 1 : b.da + (b.a - b.da) * ((i - da) / Math.max(1, quante))
  }
  console.log(`\n── ${livello}: bambino ${Math.round(spec.da * 100)}% → ${Math.round(spec.a * 100)}%${b ? `, chi non sbaglia ≤ ${Math.round(b.da * 100)}% (il rush +10) → ${Math.round(b.a * 100)}% dalla tappa ${b.dalla}` : ''}`)
  const risultati = tutti[livello] = {}
  for (const [i, t] of CAMPAGNA.entries()) {
    const mira = bersaglio(i), tetto = tettoBravo(i)
    // la manopola non è vincolata a salire: con più truppe a disposizione anche il
    // nemico è più forte a parità di `d`, e la rampa la fa la quota di vittorie.
    // Il bambino dà il nemico più forte che gli lascia la quota; se a quel nemico il
    // bravo vince più del suo tetto, si sale finché non ci sta (e il bambino scende)
    const dBambino = await finoA(t, PILOTI.bambino, mira)
    const dBravo = tetto >= 1 ? 0 : await finoA(t, PILOTI.misura, tetto + 0.001)
    // anche chi mette tutto in truppe e non fa mai miniera (come i bambini che vincono «solo con i draghi») ha il suo tetto
    // se nemmeno col nemico al massimo il rush scende sotto il tetto (la palude: le mummie battono tutto quello che c'è) non
    // si guasta la taratura di chi gioca davvero: il tetto del rush non conta e il log lo dice
    const dRushVero = tetto >= 1 ? 0 : await finoA(t, PILOTI.rush, Math.min(1, tetto + 0.1) + 0.001)
    const dRush = dRushVero >= D_MAX ? 0 : dRushVero
    const d = Math.max(dBambino, dBravo, dRush)
    risultati[t.chiave] = nemicoDi(d)
    const chi = d > dBambino ? (d > dBravo ? 'il rush' : 'il bravo') : 'il bambino'
    const riga = (await Promise.all(Object.entries(PILOTI).map(async ([n, p]) => `${n} ${Math.round(await vinte(t, d, p, 80) * 100)}%`))).join(' · ')
    console.log(`${String(i + 1).padStart(2)} ${t.chiave.padEnd(12)} d=${d.toFixed(2)}  (bambino ≥ ${Math.round(mira * 100)}%, bravo ≤ ${Math.round(tetto * 100)}%: decide ${chi}${dRushVero >= D_MAX ? '; IL RUSH NON SI FERMA' : ''})  ${riga}`)
  }
}

if (!prova) {
  const scheda = r => `{\n${CAMPAGNA.map(t => `    ${t.chiave}: ${JSON.stringify(r[t.chiave]).replace(/"(\w+)":/g, '$1: ').replace(/,/g, ', ').replace(/\{/, '{ ').replace(/\}/, ' }')},`).join('\n')}\n  }`
  const file = join(RADICE, 'src/giochi/arena/dati/taratura.js')
  const intestazione = `/* GENERATO da strumenti/tara-arena.mjs (\`npm run tara:arena\`) — non si scrive a mano.

   La scheda del nemico di ogni tappa, per ognuno dei tre livelli di difficoltà (facile, medio, difficile): \`forza\`
   (le sue truppe rispetto alle tue), \`moneteAlSecondo\` e \`pensa\` (ogni quanti secondi decide) sono funzione di una
   sola manopola \`d\` (0 = quasi inerme, 1 = pari al giocatore bravo), cercata per bisezione perché il bambino di
   prova vinca la quota che il livello promette in quella tappa. Vedi docs/arena/taratura.md. */
`
  const corpo = Object.keys(LIVELLI).map(l => `  ${l}: ${scheda(tutti[l])},`).join('\n')
  writeFileSync(file, `${intestazione}export const NEMICO_PER_LIVELLO = {\n${corpo}\n}\n// quello di mezzo è la scheda di sempre\nexport const NEMICO = NEMICO_PER_LIVELLO.medio\n// la firma dell'equilibrio al momento della taratura (motore/firma.js): se non torna, rilancia la taratura\nexport const FIRMA = '${firmaEquilibrio()}'\n`)
  console.log(`\nscritto ${file}`)
}
chiudiBanco()
