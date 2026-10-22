// Le trame del mondo di sopra, generate su <canvas> (niente file): erba, terra battuta, sabbia, roccia per il terreno; pietra a
// blocchi, legno, intonaco, tegole, paglia, ciottoli, il campo arato e la stoffa per il kit; la macchia morbida del fumo. Si
// ripetono senza giunte (il rumore è periodico); dalla luminosità una normal map. Dal prototipo (poc/mondo-sopra/trame.js). I
// pixel si dipingono una volta per pagina: tornando dalla discesa si rifanno solo le trame della scheda video.
import { CanvasTexture, SRGBColorSpace, RepeatWrapping, LinearMipmapLinearFilter } from 'three'
import { caso } from './suolo.js'

function periodico(lato, celle, seme) {
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
function frattale(lato, seme, ottave = 4, base = 4) {
  const strati = Array.from({ length: ottave }, (_, i) => periodico(lato, base << i, seme + i * 97))
  return (x, y) => { let s = 0, a = 0.5, t = 0; for (const f of strati) { s += f(x, y) * a; t += a; a *= 0.5 } return s / t }
}
function normaliDa(alt, w, h, forza) {
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
// da una funzione (x, y) → [r, g, b, altezza] (0..1) ai pixel delle due trame
function dipingi(lato, f, forza = 2) {
  const col = new Uint8ClampedArray(lato * lato * 4), alt = new Float32Array(lato * lato)
  for (let y = 0; y < lato; y++) for (let x = 0; x < lato; x++) {
    const [r, g, b, a] = f(x, y), i = y * lato + x
    col[i * 4] = r * 255; col[i * 4 + 1] = g * 255; col[i * 4 + 2] = b * 255; col[i * 4 + 3] = 255
    alt[i] = a
  }
  return { lato, col, nor: forza ? normaliDa(alt, lato, lato, forza) : null }
}

// I due punti più vicini a (x, y) fra quelli di un reticolo n×n che si ripete (uno per casella, a 0,2–0,8 della casella) e quel che porta
// il più vicino: si guardano solo le 5×5 caselle attorno, non tutti i punti con le nove copie (900 distanze a pixel: tre secondi
// all'apertura del mondo sul telefono lento, docs/sotterraneo/prestazioni-3d.md). Il più vicino dista al più 1,13 caselle, uno fuori
// dalle 5×5 almeno 2,2: il bordo dei ciottoli (d2 − d1 sotto i 6 px) viene uguale
export function dueVicini(punti, n, L, x, y) {
  const c = L / n, ci = Math.floor(x / c), cj = Math.floor(y / c)
  let d1 = 1e9, d2 = 1e9, t = 0
  for (let j = cj - 2; j <= cj + 2; j++) for (let i = ci - 2; i <= ci + 2; i++) {
    const ii = ((i % n) + n) % n, jj = ((j % n) + n) % n, [px, py, pt] = punti[jj * n + ii]
    const d = Math.hypot(x - px - (i - ii) * c, y - py - (j - jj) * c)
    if (d < d1) { d2 = d1; d1 = d; t = pt } else if (d < d2) d2 = d
  }
  return [d1, d2, t]
}

let pixel = null
function pixelDelleTrame(L = 256) {
  if (pixel) return pixel
  const n1 = frattale(L, 11, 5, 4), n2 = frattale(L, 12, 3, 32), n3 = frattale(L, 13, 2, 64), n4 = frattale(L, 14, 5, 8)
  const r = caso(21), k1 = frattale(L, 23, 4, 4), k2 = frattale(L, 22, 3, 32), k3 = frattale(L, 24, 2, 64)
  const tinte = Array.from({ length: 64 }, () => r())
  const p = {
    erba: dipingi(L, (x, y) => {
      const a = n1(x, y), b = n2(x, y), c = n3(x, y), fili = Math.pow(c, 3) * 0.9
      const v = 0.62 + (a - 0.5) * 0.5 + (b - 0.5) * 0.3 + fili * 0.35
      return [v * 0.78, v, v * 0.6, b * 0.6 + c * 0.4]
    }, 1.2),
    terra: dipingi(L, (x, y) => {
      const a = n1(x + 50, y), b = n2(x, y + 30), c = n3(x + 7, y), sasso = c > 0.78 ? (c - 0.78) * 4 : 0
      const v = 0.6 + (a - 0.5) * 0.35 + (b - 0.5) * 0.25 + sasso * 0.4
      return [v, v * 0.82, v * 0.62, a * 0.5 + b * 0.3 + sasso]
    }, 2.2),
    sabbia: dipingi(L, (x, y) => {
      const a = n1(x, y + 90), c = n3(x, y), v = 0.78 + (a - 0.5) * 0.2 + (c - 0.5) * 0.15
      return [v, v * 0.93, v * 0.76, a * 0.4 + c * 0.6]
    }, 1.4),
    roccia: dipingi(L, (x, y) => {
      const a = n4(x, y), b = n2(x + 3, y), c = n3(x, y)
      const strato = Math.abs(Math.sin((y + a * 60) * 0.11)) < 0.08 ? 0.75 : 1, crepa = Math.abs(a - 0.5) < 0.015 ? 0.55 : 1
      const v = (0.55 + (a - 0.5) * 0.6 + (b - 0.5) * 0.3) * strato * crepa
      return [v * 0.98, v * 0.96, v * 0.92, a * 0.8 + c * 0.2 - (crepa < 1 ? 0.2 : 0)]
    }, 3),
    pietra: dipingi(L, (x, y) => {
      const fh = L / 4, f = Math.floor(y / fh), fy = y - f * fh, lw = L / 3, sf = (f % 2) * lw / 2, xx = (x + sf) % L, k = Math.floor(xx / lw), fx = xx - k * lw
      const b = Math.min(1, Math.min(fx, lw - fx, fy, fh - fy) / 7), blocco = b * b * (3 - 2 * b)
      const v = blocco < 0.25 ? 0.42 : (0.72 + tinte[(f * 3 + k) % 64] * 0.2) * (0.85 + k2(x, y) * 0.3)
      return [v, v * 0.97, v * 0.92, blocco * 0.8 + k2(x, y) * 0.2]
    }, 3),
    legno: dipingi(L, (x, y) => {
      const tw = L / 5, k = Math.floor(x / tw), fx = x - k * tw, giunta = fx < 3 || fx > tw - 2
      const ven = Math.sin((x + k1(x, y) * 40) * 0.6 + k * 3) * 0.5 + 0.5
      const v = giunta ? 0.4 : 0.68 + ven * 0.12 + (tinte[k] - 0.5) * 0.15 + (k3(x, y) - 0.5) * 0.1
      return [v, v * 0.78, v * 0.55, giunta ? 0 : 0.6 + ven * 0.2]
    }, 2),
    intonaco: dipingi(L, (x, y) => {
      const a = k1(x, y), b = k3(x, y), macchia = a > 0.68 ? (a - 0.68) * 1.2 : 0, v = 0.9 + (b - 0.5) * 0.1 - macchia
      return [v, v * 0.97, v * 0.9, b * 0.5 + a * 0.2]
    }, 0.8),
    tegole: dipingi(L, (x, y) => {
      const fh = L / 8, f = Math.floor(y / fh), fy = (y - f * fh) / fh, tw = L / 8, sf = (f % 2) * tw / 2, xx = (x + sf) % L, fx = ((xx % tw) / tw) - 0.5
      const curva = Math.sqrt(Math.max(0, 1 - (fx * 2) ** 2)), ombra = fy > 0.85 ? 0.55 : 1
      const v = (0.62 + curva * 0.3) * ombra * (0.9 + k2(x, y) * 0.2) * (0.9 + tinte[(f * 8 + Math.floor(xx / tw)) % 64] * 0.15)
      return [v, v, v, curva * (1 - fy * 0.5)]
    }, 2.5),
    paglia: dipingi(L, (x, y) => {
      const fil = Math.sin(x * 1.3 + k1(x, y) * 30) * 0.5 + 0.5, fh = L / 6, fy = (y % fh) / fh
      const v = (0.72 + fil * 0.2) * (fy > 0.82 ? 0.7 : 1) * (0.9 + k3(x, y) * 0.2)
      return [v, v * 0.86, v * 0.55, fil * 0.6 + (1 - fy) * 0.4]
    }, 2),
    campo: dipingi(L, (x, y) => {
      const s = Math.sin(x / L * Math.PI * 2 * 8) * 0.5 + 0.5, v = (0.45 + s * 0.25) * (0.85 + k2(x, y) * 0.3)
      return [v, v * 0.75, v * 0.5, s]
    }, 2.5),
    stoffa: dipingi(L, (x, y) => [Math.floor(x / (L / 6)) % 2, 0.9 + (k3(x, y) - 0.5) * 0.15, 0, 0.5], 0),
  }
  // i ciottoli della piazza: celle di Voronoi da un reticolo che si ripete
  const punti = []
  for (let j = 0; j < 10; j++) for (let i = 0; i < 10; i++) punti.push([(i + 0.2 + r() * 0.6) * L / 10, (j + 0.2 + r() * 0.6) * L / 10, r()])
  p.ciottoli = dipingi(L, (x, y) => {
    const [d1, d2, t] = dueVicini(punti, 10, L, x, y)
    const bordo = Math.min(1, (d2 - d1) / 6), v = bordo < 0.3 ? 0.4 : (0.66 + t * 0.2) * (0.9 + k3(x, y) * 0.2)
    return [v, v * 0.95, v * 0.88, bordo]
  }, 3)
  pixel = p
  return p
}

function aTrama(dati, w, h, srgb) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  c.getContext('2d').putImageData(new ImageData(dati, w, h), 0, 0)
  const t = new CanvasTexture(c)
  if (srgb) t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.anisotropy = 4
  t.generateMipmaps = true; t.minFilter = LinearMipmapLinearFilter
  return t
}
// le trame della scheda video: tutte, una volta per mondo costruito; `via()` le butta
export function creaTrame() {
  const p = pixelDelleTrame(), fatte = {}
  for (const [k, v] of Object.entries(p)) fatte[k] = { map: aTrama(v.col, v.lato, v.lato, true), normalMap: v.nor ? aTrama(v.nor, v.lato, v.lato, false) : null }
  fatte.macchia = macchia()
  fatte.via = () => { for (const v of Object.values(fatte)) if (v && v.map) { v.map.dispose(); if (v.normalMap) v.normalMap.dispose() } else if (v && v.dispose) v.dispose() }
  return fatte
}

// un cerchio morbido (il fumo, gli spruzzi, l'ombra a contatto delle figure)
function macchia(L = 64) {
  const c = document.createElement('canvas'); c.width = c.height = L
  const g = c.getContext('2d')
  const gr = g.createRadialGradient(L / 2, L / 2, 0, L / 2, L / 2, L / 2)
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr; g.fillRect(0, 0, L, L)
  return new CanvasTexture(c)
}
