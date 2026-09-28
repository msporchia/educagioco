// Tarare le ondate: ogni ondata ha la sua vita, cercata giocandola per
// davvero con una bisezione (chi spende tutto deve arrivare quasi al
// castello, mai vincere comodo). Vedi docs/castello/taratura.md.
//   npm run tara                 # tara tutto e riscrive il file dati
//   npm run tara -- --prova      # tara e stampa, senza scrivere niente
//   npm run tara -- --da 0.6 --bersaglio 0.85
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { TAPPE, LIBERE, ONDATE_TARATE, firmaEquilibrio, vitaDiOnda, chiaveTappa }
  from '../src/data/castello.js'
import { Ondate } from '../src/motore/castello/ondate.js'
import { gioca, PROFILI } from './simula-castello.mjs'

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..')

const argv = process.argv.slice(2)
const prova = argv.includes('--prova')
const iB = argv.indexOf('--bersaglio')
// La frazione del limite a cui si gioca, crescente lungo la tappa: 0,60
// nella prima ondata, 0,85 nell'ultima (non 0,55→0,95: con le tappe corte
// di oggi una rampa che arriva al 95% faceva scattare l'anello di sicurezza
// su troppe tappe). Vedi docs/castello/taratura.md.
const iD = argv.indexOf('--da')
const DA = iD >= 0 ? Number(argv[iD + 1]) : 0.6
const A = iB >= 0 ? Number(argv[iB + 1]) : 0.85
const vicinanzaDi = (o, ondate, a = A) => DA + (a - DA) * ((o - 1) / Math.max(1, ondate - 1))

// L'anello di sicurezza: si tara al massimo della tensione, si prova col
// `pasticcione` (tre semi), e se non passa si abbassano solo le ondate dove
// perde cuori (mai tutta la rampa insieme, o pasticcione e pigro cadrebbero
// insieme). Vedi docs/castello/taratura.md.
const SEMI = [7, 13, 29]
const GIU_MAX = 0.3, GIRI_ANELLO = 16

// Il limite: la vita più bassa che fa entrare almeno un nemico, trovata
// per bisezione.
function limiteDi(tappa, onda, istantanea, opzioni) {
  let tiene = 4, cede = 60000
  for (let giro = 0; giro < 16; giro++) {
    const v = (tiene + cede) / 2
    tappa.vite[onda - 1] = v
    const r = gioca(tappa, { ...opzioni, da: istantanea, finoA: onda })
    const corsa = r.storia[r.storia.length - 1]
    if ((corsa?.persi || 0) > 0 || r.esito === 'persa') cede = v; else tiene = v
  }
  return cede
}

function vitaDiTaratura(tappa, onda, istantanea, opzioni, giù) {
  const vicinanza = vicinanzaDi(onda, tappa.ondate) - giù
  const limite = limiteDi(tappa, onda, istantanea, opzioni)
  const vita = Math.max(5, Math.round(limite * vicinanza))
  tappa.vite[onda - 1] = vita
  const r = gioca(tappa, { ...opzioni, da: istantanea, finoA: onda })
  const corsa = r.storia[r.storia.length - 1]
  return { vita, limite: Math.round(limite), vicinanza,
           avanzata: corsa?.avanzata || 0, persi: corsa?.persi || 0, esito: r.esito }
}

// Una tappa, ondata per ondata, in ordine: ogni ondata parte dalla difesa
// che chi spende tutto ha in campo dopo le precedenti.
function taraTappa(tappa, giù) {
  const t = { ...tappa, vite: [] }
  const righe = []
  for (let o = 1; o <= tappa.ondate; o++) {
    const istantanee = new Map()
    // si rigioca dall'inizio con le vite già fissate, per fotografare la
    // partita così com'è davvero quando l'ondata `o` sta per partire
    gioca(t, { ...PROFILI.misura, finoA: o - 1, istantanee })
    const foto = istantanee.get(o)
    // il metro non ci è arrivato vivo: si tara «alla cieca», con la vita di
    // quella prima
    if (!foto) {
      t.vite[o - 1] = t.vite[o - 2] || 42
      righe.push({ onda: o, vita: t.vite[o - 1], cieca: true })
      continue
    }
    const r = vitaDiTaratura(t, o, foto, PROFILI.misura, giù[o - 1] || 0)
    t.vite[o - 1] = r.vita
    righe.push({ onda: o, ...r, torri: foto.torri.map(x => x.lv).join(''),
                 energia: Math.round(foto.stato.energia), chi: chiDi(tappa, o) })
  }
  return { vite: spiana(t.vite, tappa), righe }
}

// chi arriva all'ondata `o`: il mostro, «capo» o «mista»
function chiDi(tappa, o) {
  const b = new Ondate(tappa).bestiaDi(o)
  return b.capo ? 'capo' : b.con ? 'mista' : b.id
}

// Spiana verso il basso, ma dentro ogni mostro (non tutta la fila): un
// golem non torna mai più mite di quello prima, ma può avere meno vita di
// un pipistrello, perché lo apre una torre sola. Le miste fanno gruppo a sé,
// come il capo. Vedi docs/castello/taratura.md.
function spiana(vite, tappa) {
  const out = vite.slice()
  const chi = vite.map((_, i) => chiDi(tappa, i + 1))
  for (let i = out.length - 2; i >= 0; i--) {
    const dopo = chi.indexOf(chi[i], i + 1)
    if (dopo > 0) out[i] = Math.min(out[i], out[dopo])
  }
  return out
}

function taraFinchePassa(tappa) {
  const giù = new Array(tappa.ondate).fill(0)
  let ultimo = null
  for (let giro = 0; giro < GIRI_ANELLO; giro++) {
    const { vite, righe } = taraTappa(tappa, giù)
    const prove = SEMI.map(s => gioca({ ...tappa, vite }, { ...PROFILI.pasticcione, s }))
    ultimo = { vite, righe, giù: giù.slice(), prove }
    if (prove.every(r => r.esito === 'vinta')) return ultimo
    // le ondate dove ha perso cuori, in una qualunque delle tre partite; se
    // non ne ha persi e non ha vinto lo stesso, quella dove si è fermato
    const dove = new Set()
    for (const r of prove) {
      for (const s of r.storia) if (s.persi) dove.add(s.onda)
      if (r.esito !== 'vinta' && !r.storia.some(s => s.persi)) dove.add(Math.max(1, Math.min(r.onda, tappa.ondate)))
    }
    let mosso = false
    for (const o of dove) if (giù[o - 1] < GIU_MAX - 1e-9) {
      giù[o - 1] = Math.round((giù[o - 1] + 0.05) * 100) / 100; mosso = true
    }
    if (!mosso) break
  }
  return ultimo          // non ce l'ha fatta nemmeno larghissima: lo dirà il collaudo
}

// Il collaudo: come se la cava la tappa coi quattro bambini di `PROFILI`.
function collauda(tappa) {
  const esiti = {}
  for (const [nome, p] of Object.entries(PROFILI)) esiti[nome] = gioca(tappa, p)
  return esiti
}

const vinta = r => r.esito === 'vinta'
const riga = r => `${(vinta(r) ? 'superata' : r.esito === 'persa' ? `persa o${r.onda}` : r.esito).padEnd(11)}` +
                  ` ${r.cuori}❤ [${r.livelli.join(',')}] speso ${r.speso}/${r.guadagnato}⚡` +
                  ` (in tasca ${(r.inTasca * 100).toFixed(0)}%)`

// Le partite libere non finiscono mai: si tarano le prime venti ondate come
// una tappa, una per una (un anello e una Y non perdonano allo stesso modo),
// poi la vita continua a salire con `OLTRE[chiave]`. Vedi libere.md.
const ONDATE_LIBERE = ONDATE_TARATE
// `regali: false`: si tara il pavimento (la prima partita di chi apre la
// modalità), non un giocatore con già dei regali in tasca — quel muro
// crescerebbe a ogni ritaratura.
const libere = LIBERE.map(l => ({ ...l, ondate: ONDATE_LIBERE, regali: false }))

// Il passo con cui la vita cresce oltre la tabella: una retta sui logaritmi
// dei limiti della seconda metà, con un pavimento a OLTRE_MINIMO (il patto
// della modalità, non una misura: prima o poi vince lei). Vedi libere.md.
const OLTRE_MINIMO = 1.3
function passoOltre(righe) {
  // il capo e le miste non contano: fermano un'altra difesa e il loro
  // limite farebbe un gradino che la retta leggerebbe come pendenza
  const meta = righe.filter(r => r.limite > 0 && r.onda > ONDATE_LIBERE / 2 &&
                                r.chi !== 'capo' && r.chi !== 'mista')
  if (meta.length < 3) return 1.2
  const xs = meta.map(r => r.onda), ys = meta.map(r => Math.log(r.limite))
  const mx = xs.reduce((s, x) => s + x, 0) / xs.length
  const my = ys.reduce((s, y) => s + y, 0) / ys.length
  const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const var_ = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
  return Math.max(OLTRE_MINIMO, Math.round(Math.exp(cov / var_) * 100) / 100)
}
const chiaveDi = t => t.chiave || chiaveTappa(t)

const fatte = {}
const oltre = {}
console.log(`si gioca dal ${(DA * 100).toFixed(0)}% del limite nella prima ondata ` +
            `al ${(A * 100).toFixed(0)}% nell'ultima\n`)
for (const [i, tappa] of [...TAPPE.entries(), ...libere.map((l, k) => [TAPPE.length + k, l])]) {
  const via = Date.now()
  const { vite, righe, giù, prove } = taraFinchePassa(tappa)
  fatte[chiaveDi(tappa)] = vite
  const reggono = prove.filter(r => r.esito === 'vinta').length
  console.log(`${i + 1}. ${tappa.nome} — ${tappa.ondate} ondate · ${tappa.posti} posti · ` +
              `cap ${tappa.cap} · fino al ${(A * 100).toFixed(0)}% del limite` +
              `${giù.some(g => g > 0) ? ` (allargata in ${giù.map((g, k) => g > 0 ? `o${k + 1} −${Math.round(g * 100)}` : '')
                .filter(Boolean).join(', ')}: il pasticcione ci perdeva cuori)` : ''}` +
              ` · ${((Date.now() - via) / 1000).toFixed(1)}s`)
  if (reggono < SEMI.length)
    console.log(`   ⚠ il pasticcione la finisce solo ${reggono} volte su ${SEMI.length}`)
  for (const r of righe)
    console.log(`   o${String(r.onda).padStart(2)} ${String(r.chi || '').padEnd(11)} vita ${String(r.vita).padStart(5)}` +
                ` (era ${String(Math.round(vitaDiOnda(r.onda, tappa.durezza))).padStart(4)})` +
                `  limite ${String(r.limite).padStart(5)} × ${(r.vicinanza * 100).toFixed(0)}%` +
                `  torri [${r.torri || '—'}] ⚡${String(r.energia ?? '').padStart(3)}` +
                `  arrivati al ${((r.avanzata ?? 0) * 100).toFixed(0)}%` +
                `${r.persi ? ' · −' + r.persi + '❤' : ''}`)
  let suoOltre = tappa.oltre
  if (tappa.chiave) {
    suoOltre = passoOltre(righe)
    oltre[tappa.chiave] = suoOltre
    console.log(`   oltre l'ondata ${ONDATE_LIBERE} la vita continua a salire di ×${suoOltre} per ondata`)
  }
  // il collaudo si fa sulla tappa con le vite appena trovate
  const esiti = collauda({ ...tappa, vite, oltre: suoOltre })
  for (const [nome, r] of Object.entries(esiti)) console.log(`   ${nome.padEnd(12)} ${riga(r)}`)
  console.log()
}

if (prova) {
  console.log('— prova: il file dei dati non è stato toccato')
} else {
  const corpo = `/* GENERATO da \`npm run tara\` — non si scrive a mano.

   La vita dei nemici di ogni ondata di ogni tappa, trovata giocando la
   tappa migliaia di volte con il motore vero (\`strumenti/tara-castello.mjs\`).
   Il criterio: ogni ondata vale una frazione del suo limite — la vita
   oltre la quale chi spende tutto non ce la fa più — e la frazione va
   dal ${(DA * 100).toFixed(0)}% della prima ondata al ${(A * 100).toFixed(0)}% dell'ultima.
   La \`FIRMA\` è l'impronta dei numeri da cui è stata ricavata: se prezzi,
   torri o tappe cambiano, il test se ne accorge e chiede di rifarla. */
export const VITE = {
${Object.entries(fatte).map(([nome, v]) =>
    `  ${JSON.stringify(nome)}: [${v.join(', ')}],`).join('\n')}
}
/* di quanto cresce la vita in ogni partita libera dopo l'ultima ondata
   tarata: da lì in poi non c'è tabella, c'è questa progressione */
export const OLTRE = ${JSON.stringify(oltre)}
export const FIRMA = ${JSON.stringify(firmaEquilibrio())}
export const BERSAGLIO = [${DA}, ${A}]
`
  writeFileSync(join(RADICE, 'src/data/taratura-castello.js'), corpo)
  console.log('scritto src/data/taratura-castello.js — ora rilancia i test')
}
