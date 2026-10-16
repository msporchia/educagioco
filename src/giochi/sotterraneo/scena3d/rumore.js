// Gli attrezzi delle trame generate: un caso col seme, il rumore che si ripete senza giunte, la normal map dall'altezza,
// e la DataTexture già pronta. Tutto su array, una volta sola quando nasce un piano di uno scenario nuovo.
import { DataTexture, RGBAFormat, SRGBColorSpace, RepeatWrapping, NearestFilter, LinearMipmapLinearFilter } from 'three'

export function caso(seme) {
  let a = seme >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// rumore a valori su una griglia che si ripete (così la trama si affianca senza giunte)
function rumore(lato, celle, seme) {
  const r = caso(seme)
  const g = Array.from({ length: celle * celle }, r)
  const at = (x, y) => g[((y % celle + celle) % celle) * celle + ((x % celle + celle) % celle)]
  return (px, py) => {
    const fx = px / lato * celle, fy = py / lato * celle
    const x0 = Math.floor(fx), y0 = Math.floor(fy)
    const tx = fx - x0, ty = fy - y0
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx
    return a + (b - a) * sy
  }
}
export function frattale(lato, seme, ottave = 4, base = 4) {
  const strati = Array.from({ length: ottave }, (_, i) => rumore(lato, base << i, seme + i * 97))
  return (x, y) => { let s = 0, a = 0.5, t = 0; for (const f of strati) { s += f(x, y) * a; t += a; a *= 0.5 } return s / t }
}

// dall'altezza alla normal map (spazio tangente). `ingiu`: la riga 0 è in alto (canvas, flipY)
export function normaliDa(alt, w, h, forza, ripete = true, ingiu = false) {
  const dati = new Uint8ClampedArray(w * h * 4)
  const at = (x, y) => {
    if (ripete) { x = (x + w) % w; y = (y + h) % h } else { x = Math.max(0, Math.min(w - 1, x)); y = Math.max(0, Math.min(h - 1, y)) }
    return alt[y * w + x]
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const gx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1))
    const gy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1))
    let nx = -gx * forza, ny = (ingiu ? gy : -gy) * forza, nz = 1
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l
    const i = (y * w + x) * 4
    dati[i] = (nx * 0.5 + 0.5) * 255; dati[i + 1] = (ny * 0.5 + 0.5) * 255; dati[i + 2] = (nz * 0.5 + 0.5) * 255; dati[i + 3] = 255
  }
  return dati
}

export function sfoca(a, w, h, r, ripete) {
  const t = new Float32Array(w * h), o = new Float32Array(w * h)
  const at = (arr, x, y) => ripete ? arr[((y + h) % h) * w + ((x + w) % w)] : arr[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))]
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let k = -r; k <= r; k++) s += at(a, x + k, y); t[y * w + x] = s / (2 * r + 1) }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let k = -r; k <= r; k++) s += at(t, x, y + k); o[y * w + x] = s / (2 * r + 1) }
  return o
}

export function trama(dati, w, h, { srgb = false, ripete = true, vicino = false, ingiu = false } = {}) {
  const t = new DataTexture(dati, w, h, RGBAFormat)
  t.needsUpdate = true
  t.flipY = ingiu
  if (srgb) t.colorSpace = SRGBColorSpace
  if (ripete) t.wrapS = t.wrapT = RepeatWrapping
  if (vicino) t.magFilter = NearestFilter
  t.generateMipmaps = true
  t.minFilter = LinearMipmapLinearFilter
  t.anisotropy = 4
  return t
}
