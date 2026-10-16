// Il suolo del mondo di sopra (puro): l'altezza del terreno in un punto, quella sul piano dei ponti, il caso col seme e il rumore
// liscio (dal prototipo poc/mondo-sopra/caso.js, che li aveva dalle terre selvagge). Lo usano tutti i pezzi per posarsi a terra.
import { LIVELLO_ACQUA } from '../../motore/mondo-aperto.js'

export { LIVELLO_ACQUA }

export function caso(seme) {
  let s = (seme >>> 0) || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}
const scarta = (x, y, s) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
// rumore di valore, liscio: `passo` è quanto è larga una macchia, in celle
export function rumore(x, y, seme, passo) {
  const gx = x / passo, gy = y / passo, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
  const a = scarta(x0, y0, seme), b = scarta(x0 + 1, y0, seme), c = scarta(x0, y0 + 1, seme), d = scarta(x0 + 1, y0 + 1, seme)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
export const fbm = (x, y, seme, passo, ottave = 3) => {
  let s = 0, a = 0.5, t = 0, p = passo
  for (let i = 0; i < ottave; i++) { s += rumore(x, y, seme + i * 101, p) * a; t += a; a *= 0.5; p /= 2 }
  return s / t
}

// l'altezza del terreno (interpolata fra i centri delle celle)
export function quotaTerreno(m, x, z) {
  const fx = Math.min(m.W - 1.001, Math.max(0, x - 0.5)), fz = Math.min(m.H - 1.001, Math.max(0, z - 0.5))
  const x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0
  const q = m.quota, W = m.W
  const a = q[z0 * W + x0], b = q[z0 * W + x0 + 1], c = q[(z0 + 1) * W + x0], d = q[(z0 + 1) * W + x0 + 1]
  return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz
}

// i ponti: il tratto da riva a riva (lungo x per chi va a est, lungo z per chi va a sud), la quota del piano e l'arco
const PONTI = new WeakMap()
export function pontiDi(m) {
  if (PONTI.has(m)) return PONTI.get(m)
  const l = new Map()
  for (const q of m.passaggi) {
    if (q.tipo !== 'ponte' || !q.celle || !q.celle.length) continue
    const xs = q.celle.map(c => c.x), ys = q.celle.map(c => c.y)
    l.set(q.id, { q, lungoX: q.verso === 'est', x0: Math.min(...xs), x1: Math.max(...xs) + 1, y0: Math.min(...ys), y1: Math.max(...ys) + 1,
                  quota: q.quota, arco: q.arco, modello: q.modello })
  }
  PONTI.set(m, l)
  return l
}
// l'altezza dove si cammina: sul ponte il suo piano, altrove il terreno
export function quotaA(m, x, z) {
  const cx = Math.floor(x), cy = Math.floor(z)
  if (cx >= 0 && cy >= 0 && cx < m.W && cy < m.H) {
    const id = m.ponte[cy * m.W + cx]
    if (id >= 0) {
      const p = pontiDi(m).get(id)
      if (p) {
        const t = p.lungoX ? (x - p.x0) / (p.x1 - p.x0) : (z - p.y0) / (p.y1 - p.y0)
        return p.quota + p.arco * Math.sin(Math.PI * Math.min(1, Math.max(0, t)))
      }
    }
  }
  return quotaTerreno(m, x, z)
}
