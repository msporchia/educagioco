// Il mondo a pezzi (puro): un pezzo è un riquadro di 32×28 celle, e di ogni pezzo si sa cosa ci sta. Dallo scheletro del mondo
// a percorso (motore/mondo-percorso.js) i posti e i ponti, sempre; dalle zone caricate le case, i campi e il decoro, che se ne
// vanno con la zona. Si costruiscono i nove attorno all'eroe, al più uno per fotogramma, il più vicino prima, e solo quando le
// zone attorno all'eroe che ci stanno sono caricate; si buttano a due pezzi di distanza, o quando una loro zona si carica o si
// scarica. Il resto lo disegna il mondo lontano (lontano.js). docs/sotterraneo/mondo-3d.md, «Quanto costa».
import { zonaDi } from '../../motore/mondo-percorso.js'

export const PEZZO = { largo: 32, alto: 28 }

export function grigliaDi(m) {
  const nx = Math.ceil(m.W / PEZZO.largo), nz = Math.ceil(m.H / PEZZO.alto)
  return { nx, nz, n: nx * nz }
}
// il pezzo di un punto (in celle)
export function pezzoDi(m, x, z) {
  const { nx, nz } = grigliaDi(m)
  const i = Math.min(nx - 1, Math.max(0, Math.floor(x / PEZZO.largo))), j = Math.min(nz - 1, Math.max(0, Math.floor(z / PEZZO.alto)))
  return j * nx + i
}
export const rettangoloDi = (m, p) => {
  const { nx } = grigliaDi(m), i = p % nx, j = Math.floor(p / nx)
  const x0 = i * PEZZO.largo, z0 = j * PEZZO.alto
  return { i, j, x0, z0, x1: Math.min(m.W, x0 + PEZZO.largo), z1: Math.min(m.H, z0 + PEZZO.alto) }
}
// quanto dista un pezzo da un altro, a scacchiera (0 lo stesso, 1 uno dei vicini)
export function distanzaPezzi(m, a, b) {
  const { nx } = grigliaDi(m)
  return Math.max(Math.abs((a % nx) - (b % nx)), Math.abs(Math.floor(a / nx) - Math.floor(b / nx)))
}

// i nove attorno all'eroe, dal più vicino (al centro del pezzo) al più lontano
export function pezziAttorno(m, x, z) {
  const { nx, nz } = grigliaDi(m), q = pezzoDi(m, x, z), i0 = q % nx, j0 = Math.floor(q / nx), l = []
  for (let j = j0 - 1; j <= j0 + 1; j++) for (let i = i0 - 1; i <= i0 + 1; i++) {
    if (i < 0 || j < 0 || i >= nx || j >= nz) continue
    const p = j * nx + i, r = rettangoloDi(m, p)
    l.push({ p, d: Math.hypot((r.x0 + r.x1) / 2 - x, (r.z0 + r.z1) / 2 - z) })
  }
  return l.sort((a, b) => a.d - b.d).map(v => v.p)
}

// le zone che hanno celle nel pezzo (dalla base: anche quelle non caricate), una volta per pezzo
const ZONE = new WeakMap()
export function zoneDelPezzo(m, p) {
  let c = ZONE.get(m)
  if (!c) ZONE.set(m, c = new Map())
  if (c.has(p)) return c.get(p)
  const r = rettangoloDi(m, p), s = new Set()
  for (let y = r.z0; y < r.z1; y++) for (let x = r.x0; x < r.x1; x++) { const z = zonaDi(m, x, y); if (z >= 0) s.add(z) }
  const l = [...s].sort((a, b) => a - b)
  c.set(p, l)
  return l
}
// si può costruire il pezzo: le sue zone fra quelle `attorno` all'eroe sono caricate (le altre, oltre una cresta, si disegnano
// dalla base, senza decoro), e almeno una lo è
export function costruibile(m, p, attorno) {
  const z = zoneDelPezzo(m, p)
  return z.some(k => m.zonaCaricata[k]) && z.every(k => !attorno.includes(k) || m.zonaCaricata[k])
}
// cosa fare a questo fotogramma: il prossimo da costruire (o null) e quelli da buttare (a due pezzi o più dall'eroe).
// `puo(p)`: se il pezzo si può costruire adesso (le sue zone caricate)
export function lavoroDeiPezzi(m, costruiti, x, z, puo = () => true) {
  const qui = pezzoDi(m, x, z)
  const butta = [...costruiti].filter(p => distanzaPezzi(m, p, qui) >= 2)
  const costruisci = pezziAttorno(m, x, z).find(p => !costruiti.has(p) && puo(p)) ?? null
  return { costruisci, butta }
}

// cosa sta in ogni pezzo dallo scheletro (i posti, le città no: sono un lotto intero; i ponti dei confini). Ogni cosa va nel
// pezzo del suo centro
const SCHELETRO = new WeakMap()
export function dividiPerPezzo(m) {
  if (SCHELETRO.has(m)) return SCHELETRO.get(m)
  const { n } = grigliaDi(m)
  const pezzi = Array.from({ length: n }, () => ({ posti: [], ponti: [] }))
  for (const p of m.posti) if (p.tipo !== 'citta') pezzi[pezzoDi(m, p.x + p.w / 2, p.y + p.h / 2)].posti.push(p)
  for (const q of m.confini) {
    const c = q.celle || []
    if (q.tipo !== 'ponte' || !c.length) continue
    const cx = c.reduce((s, v) => s + v.x, 0) / c.length + 0.5, cz = c.reduce((s, v) => s + v.y, 0) / c.length + 0.5
    pezzi[pezzoDi(m, cx, cz)].ponti.push(q)
  }
  SCHELETRO.set(m, pezzi)
  return pezzi
}
// quello che una zona caricata mette in ogni pezzo (le liste di `m.carico[k]`): pezzo → { case, campi, decoro }. Si rifà se la
// zona si ricarica (un `carico` nuovo)
const ZONA = new WeakMap()
export function dividiLaZona(m, k) {
  const c = m.carico[k]
  if (!c) return new Map()
  if (ZONA.has(c)) return ZONA.get(c)
  const l = new Map()
  const metti = (lista, cosa, x, z) => {
    const p = pezzoDi(m, x, z)
    if (!l.has(p)) l.set(p, { case: [], campi: [], decoro: [] })
    l.get(p)[lista].push(cosa)
  }
  for (const q of c.case) metti('case', q, q.x + q.w / 2, q.y + q.h / 2)
  for (const q of c.campi) metti('campi', q, q.x + q.w / 2, q.y + q.h / 2)
  for (const d of c.decoro) metti('decoro', d, d.x, d.y)
  ZONA.set(c, l)
  return l
}
// tutto quello che sta nel pezzo adesso: lo scheletro e le zone caricate. `carichi`: i carichi da cui viene (per sapere quando
// rifarlo)
export function contenutoDelPezzo(m, p) {
  const s = dividiPerPezzo(m)[p], fuori = { posti: s.posti, ponti: s.ponti, case: [], campi: [], decoro: [], carichi: [] }
  for (const k of zoneDelPezzo(m, p)) {
    fuori.carichi.push(m.carico[k])
    const q = dividiLaZona(m, k).get(p)
    if (q) { fuori.case.push(...q.case); fuori.campi.push(...q.campi); fuori.decoro.push(...q.decoro) }
  }
  return fuori
}
// le zone del pezzo sono ancora caricate come quando lo si è costruito?
export const ancoraUguale = (m, p, carichi) => zoneDelPezzo(m, p).every((k, i) => m.carico[k] === carichi[i])
