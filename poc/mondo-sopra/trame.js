// Le trame, tutte generate su <canvas> all'avvio (niente file): erba, terra battuta, sabbia, roccia per il terreno; pietra a
// blocchi, legno, intonaco, tegole, paglia, ciottoli, il campo arato e la stoffa per il kit. Si ripetono senza giunte (il
// rumore è periodico). Dalla luminosità una normal map, per il terreno e i muri. Copiato e ridotto da poc/sotterraneo-luce/trame.js.
import * as THREE from 'three'
import { caso } from './caso.js'

function periodico (lato, celle, seme) {
  const r = caso(seme)
  const g = Array.from({ length: celle * celle }, r)
  const at = (x, y) => g[((y % celle + celle) % celle) * celle + ((x % celle + celle) % celle)]
  return (px, py) => {
    const fx = px / lato * celle, fy = py / lato * celle
    const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx
    return a + (b - a) * sy
  }
}
function frattale (lato, seme, ottave = 4, base = 4) {
  const strati = Array.from({ length: ottave }, (_, i) => periodico(lato, base << i, seme + i * 97))
  return (x, y) => { let s = 0, a = 0.5, t = 0; for (const f of strati) { s += f(x, y) * a; t += a; a *= 0.5 } return s / t }
}

function normaliDa (alt, w, h, forza) {
  const dati = new Uint8ClampedArray(w * h * 4)
  const at = (x, y) => alt[((y + h) % h) * w + ((x + w) % w)]
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const gx = at(x + 1, y) - at(x - 1, y), gy = at(x, y + 1) - at(x, y - 1)
    let nx = -gx * forza, ny = gy * forza, nz = 1
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l
    const i = (y * w + x) * 4
    dati[i] = (nx * 0.5 + 0.5) * 255; dati[i + 1] = (ny * 0.5 + 0.5) * 255; dati[i + 2] = (nz * 0.5 + 0.5) * 255; dati[i + 3] = 255
  }
  return dati
}
function aTrama (dati, w, h, srgb) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  c.getContext('2d').putImageData(new ImageData(dati, w, h), 0, 0)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter
  return t
}
// da una funzione (x, y) → [r, g, b, altezza] (0..1) alle due trame
function dipingi (lato, f, forza = 2) {
  const col = new Uint8ClampedArray(lato * lato * 4), alt = new Float32Array(lato * lato)
  for (let y = 0; y < lato; y++) for (let x = 0; x < lato; x++) {
    const [r, g, b, a] = f(x, y), i = y * lato + x
    col[i * 4] = r * 255; col[i * 4 + 1] = g * 255; col[i * 4 + 2] = b * 255; col[i * 4 + 3] = 255
    alt[i] = a
  }
  return { map: aTrama(col, lato, lato, true), normalMap: forza ? aTrama(normaliDa(alt, lato, lato, forza), lato, lato, false) : null }
}
const mix = (a, b, t) => a + (b - a) * t

// ── il terreno: quattro trame chiare (il colore della regione le tinge) ──
export function trameDelTerreno (L = 256) {
  const n1 = frattale(L, 11, 5, 4), n2 = frattale(L, 12, 3, 32), n3 = frattale(L, 13, 2, 64)
  const erba = dipingi(L, (x, y) => {
    const a = n1(x, y), b = n2(x, y), c = n3(x, y)
    const fili = Math.pow(c, 3) * 0.9
    const v = 0.62 + (a - 0.5) * 0.5 + (b - 0.5) * 0.3 + fili * 0.35
    return [v * 0.78, v, v * 0.6, b * 0.6 + c * 0.4]
  }, 1.2)
  const terra = dipingi(L, (x, y) => {
    const a = n1(x + 50, y), b = n2(x, y + 30), c = n3(x + 7, y)
    const sasso = c > 0.78 ? (c - 0.78) * 4 : 0
    const v = 0.6 + (a - 0.5) * 0.35 + (b - 0.5) * 0.25 + sasso * 0.4
    return [v, v * 0.82, v * 0.62, a * 0.5 + b * 0.3 + sasso]
  }, 2.2)
  const sabbia = dipingi(L, (x, y) => {
    const a = n1(x, y + 90), c = n3(x, y)
    const v = 0.78 + (a - 0.5) * 0.2 + (c - 0.5) * 0.15
    return [v, v * 0.93, v * 0.76, a * 0.4 + c * 0.6]
  }, 1.4)
  const n4 = frattale(L, 14, 5, 8)
  const roccia = dipingi(L, (x, y) => {
    const a = n4(x, y), b = n2(x + 3, y), c = n3(x, y)
    const strato = Math.abs(Math.sin((y + a * 60) * 0.11)) < 0.08 ? 0.75 : 1
    const crepa = Math.abs(a - 0.5) < 0.015 ? 0.55 : 1
    const v = (0.55 + (a - 0.5) * 0.6 + (b - 0.5) * 0.3) * strato * crepa
    return [v * 0.98, v * 0.96, v * 0.92, a * 0.8 + c * 0.2 - (crepa < 1 ? 0.2 : 0)]
  }, 3)
  return { erba, terra, sabbia, roccia }
}

// ── il kit ──
export function trameDelKit (L = 256) {
  const r = caso(21), n2 = frattale(L, 22, 3, 32), n1 = frattale(L, 23, 4, 4), n3 = frattale(L, 24, 2, 64)
  // pietra a blocchi sfalsati (per muri, torri, archi, pozzi): quattro file, chiare, la tinta la dà il pezzo
  const tinte = Array.from({ length: 64 }, () => r())
  const pietra = dipingi(L, (x, y) => {
    const fh = L / 4, f = Math.floor(y / fh), fy = y - f * fh
    const lw = L / 3, sf = (f % 2) * lw / 2, xx = (x + sf) % L, k = Math.floor(xx / lw), fx = xx - k * lw
    const bordo = Math.min(fx, lw - fx, fy, fh - fy)
    const b = Math.min(1, bordo / 7), blocco = b * b * (3 - 2 * b)
    const t = tinte[(f * 3 + k) % 64]
    const v = blocco < 0.25 ? 0.42 : (0.72 + t * 0.2) * (0.85 + n2(x, y) * 0.3)
    return [v, v * 0.97, v * 0.92, blocco * 0.8 + n2(x, y) * 0.2]
  }, 3)
  // legno a tavole verticali, con le venature
  const legno = dipingi(L, (x, y) => {
    const tw = L / 5, k = Math.floor(x / tw), fx = x - k * tw
    const giunta = fx < 3 || fx > tw - 2
    const ven = Math.sin((x + n1(x, y) * 40) * 0.6 + k * 3) * 0.5 + 0.5
    const v = giunta ? 0.4 : 0.68 + ven * 0.12 + (tinte[k] - 0.5) * 0.15 + (n3(x, y) - 0.5) * 0.1
    return [v, v * 0.78, v * 0.55, giunta ? 0 : 0.6 + ven * 0.2]
  }, 2)
  const intonaco = dipingi(L, (x, y) => {
    const a = n1(x, y), b = n3(x, y)
    const macchia = a > 0.68 ? (a - 0.68) * 1.2 : 0
    const v = 0.9 + (b - 0.5) * 0.1 - macchia
    return [v, v * 0.97, v * 0.9, b * 0.5 + a * 0.2]
  }, 0.8)
  // tegole: file di coppi a squame
  const tegole = dipingi(L, (x, y) => {
    const fh = L / 8, f = Math.floor(y / fh), fy = (y - f * fh) / fh
    const tw = L / 8, sf = (f % 2) * tw / 2, xx = (x + sf) % L, fx = ((xx % tw) / tw) - 0.5
    const curva = Math.sqrt(Math.max(0, 1 - (fx * 2) ** 2))
    const ombra = fy > 0.85 ? 0.55 : 1
    const v = (0.62 + curva * 0.3) * ombra * (0.9 + n2(x, y) * 0.2) * (0.9 + tinte[(f * 8 + Math.floor(xx / tw)) % 64] * 0.15)
    return [v, v, v, curva * (1 - fy * 0.5)]
  }, 2.5)
  const paglia = dipingi(L, (x, y) => {
    const fil = Math.sin(x * 1.3 + n1(x, y) * 30) * 0.5 + 0.5
    const fh = L / 6, fy = (y % fh) / fh
    const v = (0.72 + fil * 0.2) * (fy > 0.82 ? 0.7 : 1) * (0.9 + n3(x, y) * 0.2)
    return [v, v * 0.86, v * 0.55, fil * 0.6 + (1 - fy) * 0.4]
  }, 2)
  // i ciottoli della piazza: celle di Voronoi da un reticolo che si ripete
  const punti = []
  for (let j = 0; j < 10; j++) for (let i = 0; i < 10; i++) punti.push([(i + 0.2 + r() * 0.6) * L / 10, (j + 0.2 + r() * 0.6) * L / 10, r()])
  const ciottoli = dipingi(L, (x, y) => {
    let d1 = 1e9, d2 = 1e9, t = 0
    for (const [px, py, pt] of punti) for (const ox of [-L, 0, L]) for (const oy of [-L, 0, L]) {
      const d = Math.hypot(x - px - ox, y - py - oy)
      if (d < d1) { d2 = d1; d1 = d; t = pt } else if (d < d2) d2 = d
    }
    const bordo = Math.min(1, (d2 - d1) / 6)
    const v = bordo < 0.3 ? 0.4 : (0.66 + t * 0.2) * (0.9 + n3(x, y) * 0.2)
    return [v, v * 0.95, v * 0.88, bordo]
  }, 3)
  // il campo arato: solchi lungo y
  const campo = dipingi(L, (x, y) => {
    const s = Math.sin(x / L * Math.PI * 2 * 8) * 0.5 + 0.5
    const v = (0.45 + s * 0.25) * (0.85 + n2(x, y) * 0.3)
    return [v, v * 0.75, v * 0.5, s]
  }, 2.5)
  // la stoffa del tendone: una maschera di righe (1 bianca, 0 del colore del pezzo: kit.js le mescola) e la trama nel verde
  const stoffa = dipingi(L, (x, y) => {
    const riga = Math.floor(x / (L / 6)) % 2
    return [riga, 0.9 + (n3(x, y) - 0.5) * 0.15, 0, 0.5]
  }, 0)
  return { pietra, legno, intonaco, tegole, paglia, ciottoli, campo, stoffa }
}

// un cerchio morbido (per il fumo, gli spruzzi, la polvere)
export function macchia (L = 64) {
  const c = document.createElement('canvas'); c.width = c.height = L
  const g = c.getContext('2d')
  const gr = g.createRadialGradient(L / 2, L / 2, 0, L / 2, L / 2, L / 2)
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr; g.fillRect(0, 0, L, L)
  return new THREE.CanvasTexture(c)
}
export { frattale, mix }
