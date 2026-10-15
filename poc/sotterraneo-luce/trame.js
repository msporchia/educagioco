// Le trame: generate a codice (pietre, mattoni) o ritagliate dall'atlante, e per ognuna la sua
// normal map ricavata dall'altezza. Tutto su <canvas>, una volta sola all'avvio.
import * as THREE from 'three'
import { caso } from './mappa.js'

// rumore a valori su una griglia che si ripete (così la trama si affianca senza giunte)
function rumore (lato, celle, seme) {
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
function frattale (lato, seme, ottave = 4, base = 4) {
  const strati = Array.from({ length: ottave }, (_, i) => rumore(lato, base << i, seme + i * 97))
  return (x, y) => { let s = 0, a = 0.5, t = 0; for (const f of strati) { s += f(x, y) * a; t += a; a *= 0.5 } return s / t }
}

// dall'altezza alla normal map (spazio tangente, v verso l'alto dell'immagine)
// `ingiu`: la riga 0 è in alto (canvas, flipY); se no la riga 0 è v = 0 (DataTexture senza flipY)
function normaliDa (alt, w, h, forza, ripete = true, ingiu = false) {
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

function trama (dati, w, h, { srgb = false, ripete = true, vicino = false, ingiu = false } = {}) {
  const t = new THREE.DataTexture(dati, w, h, THREE.RGBAFormat)
  t.needsUpdate = true
  t.flipY = ingiu
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  if (ripete) t.wrapS = t.wrapT = THREE.RepeatWrapping
  if (vicino) { t.magFilter = THREE.NearestFilter }
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.anisotropy = 8
  return t
}

// ── lastre di pietra per il pavimento: una trama copre 2×2 celle ──
export function pavimentoHD (lato = 512, seme = 3) {
  const r = caso(seme)
  const fbm = frattale(lato, seme, 5, 4), fine = frattale(lato, seme + 50, 3, 32)
  const alt = new Float32Array(lato * lato), col = new Uint8ClampedArray(lato * lato * 4), rug = new Uint8ClampedArray(lato * lato * 4)
  // file di lastre di altezza fissa e larghezza a caso, sfalsate
  const file = 4, hf = lato / file
  const tagli = []
  for (let f = 0; f < file; f++) {
    const xs = [0]; let x = 0
    while (x < lato) { x += hf * (0.8 + r() * 1.1); xs.push(Math.min(lato, x)) }
    if (lato - xs[xs.length - 2] < hf * 0.4) xs.splice(xs.length - 2, 1)
    tagli.push({ xs, sfasa: Math.floor(r() * lato), tinte: xs.map(() => [r(), r(), r()]) })
  }
  for (let y = 0; y < lato; y++) {
    const f = Math.floor(y / hf), fy = y - f * hf
    const { xs, sfasa, tinte } = tagli[f]
    for (let x0 = 0; x0 < lato; x0++) {
      const x = (x0 + sfasa) % lato
      let k = 0; while (xs[k + 1] <= x) k++
      const bordo = Math.min(x - xs[k], xs[k + 1] - x, fy, hf - fy)
      const n = fbm(x0, y), nf = fine(x0, y)
      const bisello = Math.min(1, bordo / 9)
      const lastra = bisello * bisello * (3 - 2 * bisello)
      const crepa = Math.abs(n - 0.5) < 0.012 ? 0.5 : 0
      const h = lastra * (0.75 + 0.25 * n) + nf * 0.08 - crepa * 0.3
      const i = y * lato + x0
      alt[i] = h
      const [a, b, c] = tinte[k]
      const fuga = lastra < 0.2
      const v = fuga ? 0.13 + nf * 0.05 : (0.36 + a * 0.12) * (0.8 + n * 0.35) * (0.9 + nf * 0.2) * (1 - crepa * 0.6)
      // pietra grigio-bruna, un velo di muschio freddo nelle fughe
      col[i * 4] = 255 * v * (1.0 + b * 0.08)
      col[i * 4 + 1] = 255 * v * (0.96 + (fuga ? 0.06 : 0))
      col[i * 4 + 2] = 255 * v * (0.9 + c * 0.1)
      col[i * 4 + 3] = 255
      // rugosità nel verde (roughnessMap legge G); le lastre lisce luccicano un poco
      const ru = fuga ? 1 : 0.55 + (1 - n) * 0.35
      rug[i * 4] = 255; rug[i * 4 + 1] = ru * 255; rug[i * 4 + 2] = 0; rug[i * 4 + 3] = 255
    }
  }
  return { map: trama(col, lato, lato, { srgb: true }), normalMap: trama(normaliDa(alt, lato, lato, 3.2), lato, lato), roughnessMap: trama(rug, lato, lato), celle: 2 }
}

// ── mattoni per le facce dei muri: una trama per faccia (1 di largo × alto) ──
export function muroHD (alto = 1.25, lato = 256, seme = 11) {
  const w = lato, h = Math.round(lato * alto)
  const r = caso(seme)
  const fbm = frattale(w, seme, 5, 4), fine = frattale(w, seme + 7, 3, 32)
  const alt = new Float32Array(w * h), col = new Uint8ClampedArray(w * h * 4), rug = new Uint8ClampedArray(w * h * 4)
  const hm = Math.round(h / 7)
  const tinte = Array.from({ length: 64 }, () => [r(), r()])
  for (let y = 0; y < h; y++) {
    const f = Math.floor(y / hm), fy = y - f * hm
    const lm = w / 2, sf = (f % 2) * lm * 0.5
    for (let x = 0; x < w; x++) {
      const xx = (x + sf) % w, k = Math.floor(xx / lm), fx = xx - k * lm
      const bordo = Math.min(fx, lm - fx, fy, hm - fy)
      const b = Math.min(1, bordo / 6)
      const mattone = b * b * (3 - 2 * b)
      const n = fbm(x, y % w), nf = fine(x, y % w)
      const sbecco = n > 0.68 ? (n - 0.68) * 3 : 0
      const i = y * w + x
      alt[i] = mattone * (0.8 + 0.2 * n) - sbecco * mattone + nf * 0.1
      const [a, c] = tinte[(f * 2 + k) % 64]
      const fuga = mattone < 0.25
      const v = fuga ? 0.1 + nf * 0.04 : (0.3 + a * 0.14) * (0.8 + n * 0.3) * (0.92 + nf * 0.16) * (1 - sbecco * 0.4)
      // in basso il muro è più scuro e umido
      const umido = Math.max(0, (0.25 - y / h) * 2.5)   // la riga 0 è il piede della faccia
      col[i * 4] = 255 * v * (1.02 + c * 0.06) * (1 - umido * 0.35)
      col[i * 4 + 1] = 255 * v * 0.95 * (1 - umido * 0.3)
      col[i * 4 + 2] = 255 * v * 0.88 * (1 - umido * 0.2)
      col[i * 4 + 3] = 255
      const ru = fuga ? 1 : 0.7 + (1 - n) * 0.25 - umido * 0.35
      rug[i * 4] = 255; rug[i * 4 + 1] = Math.max(0.2, ru) * 255; rug[i * 4 + 2] = 0; rug[i * 4 + 3] = 255
    }
  }
  return { map: trama(col, w, h, { srgb: true }), normalMap: trama(normaliDa(alt, w, h, 3.5), w, h), roughnessMap: trama(rug, w, h) }
}

// ── la stessa cosa partendo da un pezzo dell'atlante (pixel art): ingrandito senza sfumare,
// l'altezza è la luminosità, un poco ammorbidita perché i pixel abbiano lo spigolo smussato ──
export function daPezzo (immagine, [px, py, pw, ph], scala = 8, forza = 2.2) {
  const c = document.createElement('canvas'); c.width = pw * scala; c.height = ph * scala
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false
  g.drawImage(immagine, px, py, pw, ph, 0, 0, c.width, c.height)
  const { data } = g.getImageData(0, 0, c.width, c.height)
  const w = c.width, h = c.height
  const lum = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) lum[i] = (data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11) / 255
  const morbida = sfoca(lum, w, h, Math.max(1, scala >> 2), true)
  const col = new Uint8ClampedArray(data)
  const rug = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) { rug[i * 4] = 255; rug[i * 4 + 1] = (0.95 - lum[i] * 0.4) * 255; rug[i * 4 + 3] = 255 }
  return {
    map: trama(col, w, h, { srgb: true, vicino: true, ingiu: true }),
    normalMap: trama(normaliDa(morbida, w, h, forza, true, true), w, h, { ingiu: true }),
    roughnessMap: trama(rug, w, h, { ingiu: true }),
    celleX: pw / 16, celleY: ph / 16,
  }
}

function sfoca (a, w, h, r, ripete) {
  const t = new Float32Array(w * h), o = new Float32Array(w * h)
  const at = (arr, x, y) => ripete ? arr[((y + h) % h) * w + ((x + w) % w)] : arr[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))]
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let k = -r; k <= r; k++) s += at(a, x + k, y); t[y * w + x] = s / (2 * r + 1) }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let k = -r; k <= r; k++) s += at(t, x, y + k); o[y * w + x] = s / (2 * r + 1) }
  return o
}

// ── la normal map finta di tutto l'atlante: ogni figura diventa un cuscino (alta nel mezzo,
// smussata ai bordi della sagoma) più un poco di rilievo dalla luminosità. Pixel per pixel,
// stessa misura dell'atlante, così si legge con le stesse coordinate ──
export function normaliAtlante (immagine) {
  const w = immagine.width, h = immagine.height
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const g = c.getContext('2d'); g.drawImage(immagine, 0, 0)
  const { data } = g.getImageData(0, 0, w, h)
  // distanza dal bordo della sagoma (smusso a quattro pixel), due passate alla chamfer
  const INF = 99, d = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) d[i] = data[i * 4 + 3] > 40 ? INF : 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!d[i]) continue
    if (x > 0) d[i] = Math.min(d[i], d[i - 1] + 1)
    if (y > 0) d[i] = Math.min(d[i], d[i - w] + 1)
    if (x > 0 && y > 0) d[i] = Math.min(d[i], d[i - w - 1] + 1.414)
    if (x < w - 1 && y > 0) d[i] = Math.min(d[i], d[i - w + 1] + 1.414)
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x; if (!d[i]) continue
    if (x < w - 1) d[i] = Math.min(d[i], d[i + 1] + 1)
    if (y < h - 1) d[i] = Math.min(d[i], d[i + w] + 1)
    if (x < w - 1 && y < h - 1) d[i] = Math.min(d[i], d[i + w + 1] + 1.414)
    if (x > 0 && y < h - 1) d[i] = Math.min(d[i], d[i + w - 1] + 1.414)
  }
  const alt = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const k = Math.min(d[i], 4) / 4
    const lum = (data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11) / 255
    alt[i] = Math.sqrt(k) * 0.8 + lum * 0.25 * (d[i] > 0 ? 1 : 0)
  }
  const n = normaliDa(alt, w, h, 0.9, false, true)
  // l'immagine sta col sopra in alto (flipY), quindi la normal map va scritta allo stesso modo
  const cc = document.createElement('canvas'); cc.width = w; cc.height = h
  const gg = cc.getContext('2d'); gg.putImageData(new ImageData(n, w, h), 0, 0)
  const t = new THREE.CanvasTexture(cc)
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false
  return t
}

// ── per le cose della vetrina: da un <canvas> già dipinto (colore, e alfa se serve) e un'altezza
// (Float32Array, una per pixel; se manca, la luminosità) alle tre trame ──
export function daCanvas (tela, { altezza = null, forza = 2, ripete = true, rugosita = null } = {}) {
  const w = tela.width, h = tela.height
  const { data } = tela.getContext('2d').getImageData(0, 0, w, h)
  let alt = altezza
  if (!alt) { alt = new Float32Array(w * h); for (let i = 0; i < w * h; i++) alt[i] = (data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11) / 255 }
  const col = new Uint8ClampedArray(data)
  const fuori = {
    map: trama(col, w, h, { srgb: true, ripete, ingiu: true }),
    normalMap: trama(normaliDa(sfoca(alt, w, h, 1, ripete), w, h, forza, ripete, true), w, h, { ripete, ingiu: true }),
  }
  if (rugosita) {
    const rug = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < w * h; i++) { rug[i * 4] = 255; rug[i * 4 + 1] = rugosita(i % w, (i / w) | 0) * 255; rug[i * 4 + 3] = 255 }
    fuori.roughnessMap = trama(rug, w, h, { ripete, ingiu: true })
  }
  return fuori
}
export { frattale, caso as casoTrame }
