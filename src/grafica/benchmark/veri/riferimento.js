// L'ultima misura vera del Redmi Note 7 a cui la verifica compatta si confronta (docs/core/vecchio-telefono-veri.md, «La verifica»):
// i valori chiave del secondo log (strumenti/vecchio-telefono/log/redmi-note7-veri-22ott-2.txt, riga DATI). Si aggiorna quando
// c'è una misura vera nuova da prendere per buona: si cambia `quando`, `versione` e le scene, e basta.
export const RIFERIMENTO = {
  quando: '22/10',
  versione: '2026.10.22.1802-7505ba6f',
  // id → { ms, p95, js, gpu, deriva } (il lavoro del fotogramma e la deriva del calore di quel giro); lo zaino { tot, max }
  scene: {
    'cal-1': { ms: 107.7, p95: 165.5, js: 57.9, gpu: 48.1, deriva: 1 },
    'sot-1': { ms: 83.1, p95: 115.9, js: 35.9, gpu: 45.8, deriva: 1.13 },
    'sot-3': { ms: 92.1, p95: 131.9, js: 41.8, gpu: 49.4, deriva: 1.13 },
    'sot-6': { ms: 113, p95: 162.3, js: 54.4, gpu: 56.9, deriva: 1.13 },
    'per-8': { ms: 46.8, p95: 58, js: 22.4, gpu: 23.7, deriva: 1.11 },
    'mos-8': { ms: 77.7, p95: 94.6, js: 49, gpu: 28.2, deriva: 1.11 },
    'zaino-15': { tot: 1875, max: 433 },
    'cal-2': { ms: 107.5, p95: 190.4, js: 58.7, gpu: 48.2, deriva: 1.11 },
  },
  // scene che il log di riferimento non ha: la retta fra due che ha (a `t` fra la prima e la seconda), dichiarato nella riga
  interpolate: { 'v-sot-4': ['sot-3', 'sot-6', 1 / 3] },
}

const scala = (x, d) => (x != null && d && Math.abs(d - 1) > 0.05 ? x / d : x)   // come `corretta` di log-veri.js: tolto il calore
const t1 = x => Math.round(x * 10) / 10
const misura = (s, k) => scala(s[k], s.deriva)

/** La scena di riferimento di un id (anche interpolata), coi ms già tolto il calore; null se non c'è. */
export function dellaScena(id) {
  const s = RIFERIMENTO.scene[id]
  if (s) return s.tot != null ? { ...s } : { ms: t1(misura(s, 'ms')), p95: t1(misura(s, 'p95')), js: t1(misura(s, 'js')), gpu: t1(misura(s, 'gpu')) }
  const i = RIFERIMENTO.interpolate[id]
  const a = i && dellaScena(i[0]), b = i && dellaScena(i[1])
  if (!a || !b) return null
  const mix = k => t1(a[k] + (b[k] - a[k]) * i[2])
  return { ms: mix('ms'), p95: mix('p95'), js: mix('js'), gpu: mix('gpu'), interpolata: `${i[0]}/${i[1]}` }
}

/**
 * La scena di oggi (già tolto il calore) contro l'ultima misura vera: le differenze (negative = meglio) in ms e in %, e il giudizio per
 * ogni misura (`meglio`, `peggio`, `uguale`: sotto 3 ms o il 5% sta nel rumore). null se la scena non ha un riferimento.
 */
export function confronta(r) {
  const v = dellaScena(r.id)
  if (!v || r.errore || r.salta) return null
  const giudizio = (d, base) => (Math.abs(d) < Math.max(3, 0.05 * base) ? 'uguale' : d < 0 ? 'meglio' : 'peggio')
  const voce = (nuovo, vecchio) => (nuovo == null || vecchio == null ? null : { d: t1(nuovo - vecchio), pct: Math.round(100 * (nuovo - vecchio) / Math.max(0.1, vecchio)), g: giudizio(nuovo - vecchio, vecchio) })
  if (v.tot != null) return { id: r.id, tot: voce(r.tot, v.tot), max: voce(r.max, v.max), ms: voce(r.tot, v.tot) }
  return { id: r.id, ms: voce(r.ms, v.ms), p95: voce(r.p95, v.p95), js: voce(r.js, v.js), gpu: voce(r.gpu, v.gpu), interpolata: v.interpolata }
}

const segno = d => (d < 0 ? '−' : '+') + Math.abs(d)
/** «−12 ms (−11%)» / «+4 ms (+5%)». */
export const dif = v => `${segno(v.d)} ms (${segno(v.pct)}%)`
