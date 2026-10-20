// Il suolo del mondo di sopra (puro): l'altezza del terreno in un punto, quella sul piano dei ponti, il caso col seme e il rumore
// liscio (dal prototipo poc/mondo-sopra/caso.js, che li aveva dalle terre selvagge). Lo usano tutti i pezzi per posarsi a terra.
// Il mondo è quello a percorso (motore/mondo-percorso.js): le celle di una zona mai caricata si leggono dalla loro base pura.
import { LIVELLO_ACQUA, ERBA, ACQUA, ROCCIA, baseDi } from '../../motore/mondo-percorso.js'

export { LIVELLO_ACQUA, ERBA, ACQUA, ROCCIA }

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

// Le celle di una zona che non si è mai caricata non sono scritte (`zona` −1): per chi le disegna valgono la loro base pura
// (baseDi), tenuta qui a mano a mano che serve. Una zona caricata una volta resta scritta anche scaricata
const BASI = new WeakMap()
function laBase(m, k) {
  let b = BASI.get(m)
  if (!b) {
    const N = m.W * m.H
    b = { quota: new Float32Array(N), terreno: new Uint8Array(N).fill(255), strada: new Uint8Array(N), ponte: new Int8Array(N), reg: new Uint8Array(N) }
    BASI.set(m, b)
  }
  if (b.terreno[k] === 255) {
    const x = k % m.W, y = (k / m.W) | 0, c = baseDi(m, x, y)
    b.quota[k] = c.quota; b.terreno[k] = c.terreno; b.strada[k] = c.strada; b.ponte[k] = c.ponte; b.reg[k] = regioneDellaBase(m, x, y, c)
  }
  return b
}
// il luogo di una cella non scritta: il villaggio, o quello della sua zona lungo la strada maestra
function regioneDellaBase(m, x, y, c) {
  const v = m.villaggio
  if (v && x >= v.x - 2 && y >= v.y - 2 && x < v.x + v.w + 2 && y < v.y + v.h + 2) return 0
  let r = 0
  for (let i = 1; i < m.regioni.length; i++) { const q = m.regioni[i]; if (q.zona !== c.zona) continue; r = i; if (c.arco < q.s1) break }
  return r
}
export const scritta = (m, k) => m.zona[k] >= 0
export const quotaDellaCella = (m, k) => (m.zona[k] >= 0 ? m.quota[k] : laBase(m, k).quota[k])
// quello che serve al disegno di una cella: terreno, strada, campo, ponte, isola e l'habitat del suo luogo
export function cellaDaDisegnare(m, k, out = {}) {
  if (m.zona[k] >= 0) {
    out.terreno = m.terreno[k]; out.strada = m.strada[k]; out.campo = m.campo[k]; out.ponte = m.ponte[k]; out.isola = m.isola[k]
    out.habitat = (m.regioni[m.reg[k]] || m.regioni[0]).habitat
  } else {
    const b = laBase(m, k)
    out.terreno = b.terreno[k]; out.strada = b.strada[k]; out.campo = 0; out.ponte = b.ponte[k]; out.isola = 0
    out.habitat = m.regioni[b.reg[k]].habitat
  }
  return out
}
// il luogo di una cella (l'indice in `m.regioni`), anche non scritta: per le etichette e l'annuncio
export const regioneDellaCella = (m, k) => (m.zona[k] >= 0 ? m.reg[k] : laBase(m, k).reg[k])

// l'altezza del terreno (interpolata fra i centri delle celle)
export function quotaTerreno(m, x, z) {
  const fx = Math.min(m.W - 1.001, Math.max(0, x - 0.5)), fz = Math.min(m.H - 1.001, Math.max(0, z - 0.5))
  const x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0, W = m.W, k = z0 * W + x0
  const a = quotaDellaCella(m, k), b = quotaDellaCella(m, k + 1), c = quotaDellaCella(m, k + W), d = quotaDellaCella(m, k + W + 1)
  return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz
}

// i ponti dei confini fra le zone: il tratto da riva a riva (lungo x per chi va a est, lungo z per chi va a sud), la quota del
// piano e l'arco. Nelle celle `ponte` c'è l'indice del confine (`i`)
const PONTI = new WeakMap()
export function pontiDi(m) {
  if (PONTI.has(m)) return PONTI.get(m)
  const l = new Map()
  for (const q of m.confini) {
    if (q.tipo !== 'ponte' || !q.celle || !q.celle.length) continue
    const xs = q.celle.map(c => c.x), ys = q.celle.map(c => c.y)
    l.set(q.i, { q, lungoX: q.verso === 'est', x0: Math.min(...xs), x1: Math.max(...xs) + 1, y0: Math.min(...ys), y1: Math.max(...ys) + 1,
                 quota: q.quota, arco: q.arco, modello: q.modello })
  }
  PONTI.set(m, l)
  return l
}
// l'altezza dove si cammina: sul ponte il suo piano, altrove il terreno
export function quotaA(m, x, z) {
  const cx = Math.floor(x), cy = Math.floor(z)
  if (cx >= 0 && cy >= 0 && cx < m.W && cy < m.H) {
    const k = cy * m.W + cx, id = m.zona[k] >= 0 ? m.ponte[k] : laBase(m, k).ponte[k]
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
