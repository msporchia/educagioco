import { newItem, record, strength, overdue, weight, isMastered, IVL, SRS,
         createPicker, activeSet } from '../../src/store/srs.js'

const GIORNO = 86400000
const t0 = Date.UTC(2026, 0, 1)

// --- 1. la forza sale con le risposte giuste e l'intervallo si allunga ---
const it = newItem()
const salita = []
for (let i = 0; i < 6; i++) {
  record(it, { correct: true, now: t0 + i * GIORNO * 5 })
  salita.push({ forza: it.s, ripassoFraGiorni: IVL[it.s] })
}

// --- 2. DECADIMENTO: senza toccarla, una parola imparata si indebolisce ---
const f = newItem()
for (let i = 0; i < 5; i++) record(f, { correct: true, now: t0 + i * GIORNO * 4 })
const quandoImparata = t0 + 4 * GIORNO * 4
const decadimento = [0, 3, 10, 25, 60, 120].map(g => ({
  giorniDopo: g,
  forzaEfficace: strength(f, quandoImparata + g * GIORNO),
  ancoraImparata: isMastered(f, quandoImparata + g * GIORNO),
  peso: +weight(f, quandoImparata + g * GIORNO).toFixed(2),
}))

// --- 3. un errore fa crollare la forza ---
const e = newItem()
for (let i = 0; i < 5; i++) record(e, { correct: true, now: t0 + i * GIORNO })
const primaErrore = e.s
record(e, { correct: false, now: t0 + 5 * GIORNO })
const dopoErrore = e.s

// --- 4. DISTANZA MINIMA sotto stress: pochi elementi, tanti turni ---
const stato = new Map()
const getItem = k => { if (!stato.has(k)) stato.set(k, newItem()); return stato.get(k) }
for (const n of [8, 10, 20]) {
  const pool = Array.from({ length: n }, (_, i) => 'x' + i)
  const p = createPicker({ getItem })
  const visti = []
  for (let i = 0; i < 600; i++) {
    const id = p.pick(pool, t0)
    visti.push(id)
    record(getItem(id), { correct: Math.random() > 0.25, now: t0 })
    p.afterAnswer(id, true)
  }
  let min = 999; const ultima = new Map()
  visti.forEach((v, i) => { if (ultima.has(v)) min = Math.min(min, i - ultima.get(v)); ultima.set(v, i) })
  console.log(`pool ${String(n).padStart(2)} elementi -> distanza minima fra ripetizioni: ${min}` +
              `   (richiesta: >= ${SRS.minGap})   ${min >= SRS.minGap ? 'OK' : 'VIOLATA'}`)
}

// --- 5. dopo un errore l'elemento torna, ma non subito ---
const pool2 = Array.from({ length: 12 }, (_, i) => 'y' + i)
const p2 = createPicker({ getItem })
const seq = []
for (let i = 0; i < 40; i++) {
  const id = p2.pick(pool2, t0)
  seq.push(id)
  const sbagliato = i === 0
  record(getItem(id), { correct: !sbagliato, now: t0 })
  p2.afterAnswer(id, !sbagliato)
}
const primo = seq[0]
const ritorni = seq.map((v, i) => v === primo ? i : -1).filter(i => i > 0)

// --- 6. RIPOSO: chi lo sa esce di scena e lascia il posto a chi non lo sa ---
//     come nel gioco, l'insieme si allarga di quanti sono andati a riposo
const tutti = Array.from({ length: 40 }, (_, i) => 'z' + i)
const p3 = createPicker({ getItem, pausaDopo: 3 })
const conteggio = new Map()
for (let i = 0; i < 100; i++) {
  const id = p3.pick(tutti.slice(0, 10 + p3.riposati), t0)
  conteggio.set(id, (conteggio.get(id) || 0) + 1)
  record(getItem(id), { correct: true, now: t0 })
  p3.afterAnswer(id, true)          // sempre giusto: dopo 3 di fila va a riposo
}
const massimoRipetizioni = Math.max(...conteggio.values())
const quantiDiversi = conteggio.size

// --- 7. INSIEME ATTIVO A GRUPPI: ogni gruppo scelto deve essere rappresentato ---
//     dieci tabelline, i calcoli banali (×1 e ×10) messi in fondo apposta
const calcoli = [], gruppiDi = k => k.split('x').map(Number)
for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) calcoli.push(a + 'x' + b)
const durezza = n => (n === 1 || n === 10) ? 0 : (n === 2 || n === 3 || n === 5) ? 1 : 2
const ordineMate = k => { const [lo, hi] = gruppiDi(k)
  return (lo === 1 || hi === 10) ? 9 : durezza(lo) + durezza(hi) + (lo * hi) / 200 }
const vuoti = new Map(calcoli.map(k => [k, newItem()]))
const senzaGruppi = activeSet(calcoli, k => vuoti.get(k), ordineMate, t0, 15).learning
const conGruppi = activeSet(calcoli, k => vuoti.get(k), ordineMate, t0, 15, gruppiDi).learning
const copertura = sc => new Set(sc.flatMap(gruppiDi)).size

console.log('\nsalita forza:', JSON.stringify(salita))
console.log('decadimento :', JSON.stringify(decadimento, null, 0))
console.log('errore      : forza', primaErrore, '->', dopoErrore)
console.log('ritorni dopo errore ai turni:', ritorni.slice(0, 4))
console.log(`riposo      : 100 turni sempre giusti -> ${quantiDiversi} elementi diversi,`,
            `nessuno chiesto più di ${massimoRipetizioni} volte`,
            massimoRipetizioni <= 3 && quantiDiversi >= 30 ? 'OK' : 'DA GUARDARE')
console.log('insieme 15 su 55 calcoli:')
console.log('   senza gruppi ->', senzaGruppi.join(' '), `(tabelline toccate: ${copertura(senzaGruppi)}/10)`)
console.log('   con gruppi   ->', conGruppi.join(' '), `(tabelline toccate: ${copertura(conGruppi)}/10)`,
            copertura(conGruppi) === 10 ? 'OK' : 'INCOMPLETO')
