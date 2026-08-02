import { newItem, record, strength, overdue, weight, isMastered, IVL, SRS, createPicker }
  from './src/store/srs.js'

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

console.log('\nsalita forza:', JSON.stringify(salita))
console.log('decadimento :', JSON.stringify(decadimento, null, 0))
console.log('errore      : forza', primaErrore, '->', dopoErrore)
console.log('ritorni dopo errore ai turni:', ritorni.slice(0, 4))
