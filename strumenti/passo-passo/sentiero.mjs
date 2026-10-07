/* Misura i sentieri senza fine: per ogni famiglia, tanti posti fatti dal
   generatore, e di ognuno **il programma più corto in carte** con le carte
   che il bambino ha in mano (motore/programmi.js), quante mosse esegue, se
   si vince dentro lo zaino senza il ciclo, senza il se, senza il «fino a»;
   e poi la strada più corta senza carota (in frecce sciolte), le regole
   usate, le pecore, la forma, e quanto ci ha messo a nascere. I numeri di
   docs/passo-passo/sentiero.md vengono da qui. Le ricerche dei programmi
   girano su più processi (`--processi`).

     node strumenti/passo-passo/sentiero.mjs              mille posti per famiglia, e un giro di mille per sentiero
     node strumenti/passo-passo/sentiero.mjs --quanti=200
     node strumenti/passo-passo/sentiero.mjs --seme=7     un'altra fila di semi
     node strumenti/passo-passo/sentiero.mjs --mano=ripeti   chi ha solo il ciclo (anche: fino, tutte, nessuna)
     node strumenti/passo-passo/sentiero.mjs --ms=1500    quanto cercare un programma, per domanda
     node strumenti/passo-passo/sentiero.mjs --solo=cane  un sentiero solo */
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { cpus } from 'node:os'
import { generaSentiero, caso, ricordoDi, INGREDIENTI, SENTIERI, DI_BASE } from '../../src/giochi/passo-passo/motore/generatore.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { risolvi } from '../../src/giochi/passo-passo/motore/risolutore.js'
import { risolviSvelto, vaBene } from '../../src/giochi/passo-passo/motore/svelto.js'
import { esegui } from '../../src/giochi/passo-passo/motore/mondo.js'
import { esamina } from '../../src/giochi/passo-passo/motore/programmi.js'

const argomenti = process.argv.slice(2)
const opzione = (nome, di) => {
  const a = argomenti.find(x => x.startsWith(`--${nome}=`))
  return a ? a.split('=')[1] : di
}
const QUANTI = Number(opzione('quanti', 1000))
const SEME = Number(opzione('seme', 1))
const MS = Number(opzione('ms', 1500))
const PROCESSI = Number(opzione('processi', Math.max(1, cpus().length - 2)))
const SOLO = opzione('solo', null)
/* le mani: cosa ha finito il bambino */
const MANI = {
  nessuna: [...DI_BASE, 'cane'],
  ripeti: [...DI_BASE, 'cane', 'ripeti'],
  fino: [...DI_BASE, 'cane', 'ripeti', 'fino'],
  tutte: Object.values(INGREDIENTI),
}
const MANO = opzione('mano', 'tutte')
const SBLOCCATI = MANI[MANO]

const pct = (l, p) => { const s = l.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))] }
const media = l => l.reduce((n, x) => n + x, 0) / Math.max(1, l.length)
const conta = l => Object.entries(l.reduce((c, x) => ({ ...c, [x]: (c[x] || 0) + 1 }), {}))
  .sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')
const quota = (l, f) => `${Math.round(100 * l.filter(f).length / Math.max(1, l.length))}%`
const scala = l => (l.length ? `min ${Math.min(...l)} · 10% ${pct(l, 0.1)} · mediana ${pct(l, 0.5)} · 90% ${pct(l, 0.9)} · max ${Math.max(...l)}` : '—')

/* le cose del mondo che un posto mette in scena, lette dalla mappa */
function cose(t) {
  const m = t.mappa.join('')
  const c = []
  if (t.salti) c.push('salto')
  if (/[*CMO]/.test(m)) c.push('ghiaccio')
  if (/[mM]/.test(m)) c.push('massi')
  if (/[123]/.test(m)) c.push('buche')
  if (/[rug]/.test(m)) c.push('lastre')
  return c
}
const sciolta = (liv, carota = false) => (vaBene(liv) ? risolviSvelto(liv, { carota, limite: 200000 })
  : risolvi(liv, { carota, limite: 200000 }))

/* ── il programma di un posto ──
   Senza zaino il bambino ha solo le frecce: il programma è la strada più
   corta, e si vince senza tutto. Con lo zaino: il più corto con le carte
   in mano (arrivando a casa, anche senza la carota), e le tre domande
   dentro lo zaino. */
export function programmaDi(t, ms = MS) {
  const liv = Livello.da(t)
  if (!t.zaino) {
    const s = sciolta(liv)
    const n = s ? s.length : 0
    return { zaino: 0, carte: n, passi: n, ciclo: false, se: false, fino: false, finito: true }
  }
  const e = esamina(liv, { ms })
  const scritta = esegui(liv, t.soluzioni[0], { eventi: false }).passi.length
  return {
    zaino: t.zaino, carte: e.minimo.carte ?? t.zaino, passi: e.minimo.passi ?? scritta, passiScritta: scritta,
    ciclo: !e.senzaCiclo.vince, se: !!e.senzaSe && !e.senzaSe.vince, fino: !!e.senzaFino && !e.senzaFino.vince,
    seFinito: !e.senzaSe || e.senzaSe.finito,
    conSe: liv.carte.includes('se'),
    finito: e.minimo.finito && e.senzaCiclo.finito && (!e.senzaSe || e.senzaSe.finito) && (!e.senzaFino || e.senzaFino.finito),
    corto: e.minimo.fila && e.minimo.carte < t.zaino ? e.minimo.fila.join(' ') : null,
  }
}

/* un posto della famiglia, numero k, sempre lo stesso per lo stesso seme */
function posto(strada, famiglia, k, seme) {
  const rnd = caso(seme * 100003 + k * 7919)
  const t0 = performance.now()
  const t = generaSentiero(k, rnd, { sbloccati: SBLOCCATI, famiglia, strada })
  return { t, ms: performance.now() - t0 }
}
/* un posto del giro: in fila, col ricordo di quello di prima */
function giroDi(strada, quanti, seme) {
  let prima = null
  const fuori = []
  for (let k = 0; k < quanti; k++) {
    const t0 = performance.now()
    const t = generaSentiero(k, caso(seme * 7 + k * 1009), { sbloccati: SBLOCCATI, prima, strada })
    fuori.push({ t, ms: performance.now() - t0, ricordo: ricordoDi(t), prima })
    prima = ricordoDi(t)
  }
  return fuori
}

function riga({ t, ms }) {
  const liv = Livello.da(t)
  const corta = sciolta(liv)
  return { ms, corta: corta ? corta.length : 0, riserva: !t.misure, forma: t.forma || t.sagoma || t.famiglia,
           famiglia: t.famiglia, regole: cose(t), pecore: liv.pecore.length, carte: t.zaino || 0,
           dev: t.misure && t.misure.deviazione != null ? t.misure.deviazione : null,
           programma: programmaDi(t), mappa: t.mappa }
}

function stampaProgrammi(r) {
  const p = r.map(x => x.programma)
  const z = p.filter(x => x.zaino)
  console.log(`  programma più corto (carte): ${scala(p.map(x => x.carte))}`)
  console.log(`  mosse che esegue: ${scala(p.map(x => x.passi))}`)
  /* il se: solo dove la ricerca è arrivata in fondo (quella che non
     finisce non smentisce il posto, e si conta a parte) */
  const f = p.filter(x => x.seFinito !== false)
  console.log(`  chiede il ciclo ${quota(p, x => x.ciclo)} · il se ${quota(f, x => x.se)} · il «fino a» ${quota(p, x => x.fino)}` +
              ` · tutti e due (ciclo e se) ${quota(f, x => x.ciclo && x.se)} · almeno 15 mosse ${quota(p, x => x.passi >= 15)}` +
              ` · almeno 8 carte ${quota(p, x => x.carte >= 8)}`)
  if (z.length) console.log(`  con lo zaino ${z.length}: più corto dello scritto ${z.filter(x => x.carte < x.zaino).length}` +
                            ` · ricerche non finite ${z.filter(x => !x.finito).length} (del se: ${p.length - f.length})`)
  const corti = z.filter(x => x.corto).slice(0, 3)
  for (const c of corti) console.log(`    ✂️  ${c.zaino} → ${c.carte}: ${c.corto}`)
}

function stampa(titolo, r) {
  if (!r.length) return
  const ms = r.map(x => x.ms), corte = r.map(x => x.corta)
  console.log(`\n── ${titolo}: ${r.length} posti`)
  stampaProgrammi(r)
  console.log(`  strada più corta senza carota (frecce): ${scala(corte)}`)
  const dev = r.map(x => x.dev).filter(x => x != null)
  if (dev.length) console.log(`  deviazione della carota: min ${Math.min(...dev)} · mediana ${pct(dev, 0.5)}`)
  console.log(`  regole del mondo per posto: media ${media(r.map(x => x.regole.length)).toFixed(2)} · ${conta(r.map(x => x.regole.length))}`)
  console.log(`  quali: ${conta(r.flatMap(x => x.regole))}`)
  if (r.some(x => x.pecore)) console.log(`  pecore: ${conta(r.map(x => x.pecore))}`)
  if (r.some(x => x.carte)) console.log(`  carte nello zaino: ${conta(r.map(x => x.carte))}`)
  const forme = new Set(r.map(x => x.forma))
  console.log(`  forme: ${forme.size} · ${conta(r.map(x => x.forma))}`)
  console.log(`  riserve: ${r.filter(x => x.riserva).length}`)
  console.log(`  tempo per nascere (ms): media ${media(ms).toFixed(1)} · mediana ${pct(ms, 0.5).toFixed(1)} · 95% ${pct(ms, 0.95).toFixed(1)} · 99% ${pct(ms, 0.99).toFixed(1)} · max ${Math.max(...ms).toFixed(1)}`)
}

function stampaGiro(strada, r) {
  const ms = r.map(x => x.ms)
  let stesse = 0, stessaFamiglia = 0
  for (const x of r) {
    if (x.prima && x.prima === x.ricordo) stesse++
    if (x.prima && x.prima.split(':')[0] === x.famiglia) stessaFamiglia++
  }
  console.log(`\n══ giro del ${strada}: ${r.length} posti di fila, mano «${MANO}»`)
  stampaProgrammi(r)
  console.log(`  famiglie: ${conta(r.map(x => x.famiglia))}`)
  console.log(`  forme: ${new Set(r.map(x => x.forma)).size} · ${conta(r.map(x => x.forma))}`)
  console.log(`  la stessa forma di fila: ${stesse} · la stessa famiglia di fila: ${stessaFamiglia}`)
  console.log(`  tempo per nascere (ms): media ${media(ms).toFixed(1)} · mediana ${pct(ms, 0.5).toFixed(1)} · 95% ${pct(ms, 0.95).toFixed(1)} · 99% ${pct(ms, 0.99).toFixed(1)} · max ${Math.max(...ms).toFixed(1)}`)
}

/* ── i lavori: un pezzo di famiglia (o di giro) per processo ── */
function lavora({ che, strada, famiglia, da, a, seme, posti }) {
  if (che === 'giro') return posti.map(x => ({ ...riga(x), ricordo: x.ricordo, prima: x.prima }))
  const fuori = []
  for (let k = da; k < a; k++) {
    const x = posto(strada, famiglia, k, seme)
    if (x.t.famiglia !== famiglia) continue
    fuori.push(riga(x))
  }
  return fuori
}

if (!isMainThread) {
  parentPort.postMessage(lavora(workerData))
} else if (import.meta.url === `file://${process.argv[1]}`) {
  const lavori = []
  const fette = n => Array.from({ length: Math.ceil(n / 50) }, (_, i) => [i * 50, Math.min(n, (i + 1) * 50)])
  for (const [strada, { famiglie }] of Object.entries(SENTIERI)) {
    if (SOLO && SOLO !== strada) continue
    for (const famiglia of famiglie) for (const [da, a] of fette(QUANTI)) lavori.push({ che: 'famiglia', strada, famiglia, da, a, seme: SEME })
    /* il giro va in fila (il ricordo), qui e senza nessun altro al lavoro:
       i suoi tempi sono quelli buoni; i programmi si cercano a pezzi */
    const giro = giroDi(strada, QUANTI, SEME)
    for (const [da, a] of fette(QUANTI)) lavori.push({ che: 'giro', strada, posti: giro.slice(da, a) })
  }
  const risultati = new Array(lavori.length)
  let prossimo = 0
  const partito = Date.now()
  await new Promise((fatto, guasto) => {
    let attivi = 0
    const lancia = () => {
      if (prossimo >= lavori.length) { if (!attivi) fatto(); return }
      const i = prossimo++
      attivi++
      const w = new Worker(new URL(import.meta.url), { workerData: lavori[i], argv: process.argv.slice(2) })
      w.on('message', m => { risultati[i] = m })
      w.on('error', guasto)
      w.on('exit', () => { attivi--; lancia() })
    }
    for (let k = 0; k < PROCESSI; k++) lancia()
  })
  console.log(`mano «${MANO}», ${QUANTI} posti per famiglia, ${MS} ms per domanda, ${((Date.now() - partito) / 1000).toFixed(0)} s in tutto`)
  const di = (che, strada, famiglia) => lavori.flatMap((l, i) =>
    (l.che === che && l.strada === strada && (!famiglia || l.famiglia === famiglia) ? risultati[i] : []))
  for (const [strada, { famiglie }] of Object.entries(SENTIERI)) {
    if (SOLO && SOLO !== strada) continue
    for (const f of famiglie) stampa(`${strada} · ${f}`, di('famiglia', strada, f))
  }
  for (const strada of Object.keys(SENTIERI)) if (!SOLO || SOLO === strada) stampaGiro(strada, di('giro', strada))
}
