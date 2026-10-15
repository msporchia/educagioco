// Le trame generate a codice, nel colore dell'ambientazione (scena3d/aspetti.js): le lastre del pavimento, i mattoni dei muri,
// il legno delle botti, e la normal map finta dell'atlante (ogni figura un cuscino smussato ai bordi). Una volta per scenario.
import { CanvasTexture, LinearFilter } from 'three'
import { caso, frattale, normaliDa, trama } from './rumore.js'

// ── lastre di pietra per il pavimento: una trama copre 2×2 celle; `braci` accende le crepe (fornace, inferno) ──
export function pavimento(asp, lato = 512, seme = 3) {
  const r = caso(seme)
  const fbm = frattale(lato, seme, 5, 4), fine = frattale(lato, seme + 50, 3, 32)
  const alt = new Float32Array(lato * lato), col = new Uint8ClampedArray(lato * lato * 4), rug = new Uint8ClampedArray(lato * lato * 4)
  const em = asp.braci ? new Uint8ClampedArray(lato * lato * 4) : null
  const macchie = frattale(lato, seme + 90, 2, 2)
  const [pr, pg, pb] = asp.pietra, [fr, fg, fb] = asp.fuga
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
      const i = y * lato + x0
      alt[i] = lastra * (0.75 + 0.25 * n) + nf * 0.08 - crepa * 0.3
      const [a, b, c] = tinte[k]
      const fuga = lastra < 0.2
      const q = i * 4
      if (fuga) {
        const v = 1 + nf * 0.4
        col[q] = 255 * fr * v; col[q + 1] = 255 * (fg + asp.muschio) * v; col[q + 2] = 255 * fb * v
      } else {
        const v = (0.36 + a * 0.12) * (0.8 + n * 0.35) * (0.9 + nf * 0.2) * (1 - crepa * 0.6)
        col[q] = 255 * v * pr * (1.0 + b * 0.08); col[q + 1] = 255 * v * pg * 0.96; col[q + 2] = 255 * v * pb * (0.9 + c * 0.1)
      }
      col[q + 3] = 255
      const ru = fuga ? 1 : 0.55 + (1 - n) * 0.35
      rug[q] = 255; rug[q + 1] = ru * 255; rug[q + 2] = 0; rug[q + 3] = 255
      if (em) {
        // le braci: solo in qualche crepa (una macchia di rumore largo decide quali), dal rosso cupo all'arancio
        const brace = crepa && macchie(x0, y) > 0.58 ? 1 : 0
        const e = brace * asp.braci
        em[q] = 255 * e; em[q + 1] = 255 * e * 0.32; em[q + 2] = 255 * e * 0.06; em[q + 3] = 255
      }
    }
  }
  return {
    map: trama(col, lato, lato, { srgb: true }), normalMap: trama(normaliDa(alt, lato, lato, 3.2), lato, lato),
    roughnessMap: trama(rug, lato, lato), emissiveMap: em ? trama(em, lato, lato, { srgb: true }) : null, celle: 2,
  }
}

// ── mattoni per le facce dei muri: una trama per faccia (1 di largo × alto), più scuri e umidi al piede ──
export function muro(asp, alto = 1.25, lato = 256, seme = 11) {
  const w = lato, h = Math.round(lato * alto)
  const r = caso(seme)
  const fbm = frattale(w, seme, 5, 4), fine = frattale(w, seme + 7, 3, 32)
  const alt = new Float32Array(w * h), col = new Uint8ClampedArray(w * h * 4), rug = new Uint8ClampedArray(w * h * 4)
  const [mr, mg, mb] = asp.muro
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
      const umido = Math.max(0, (0.25 - y / h) * 2.5)   // la riga 0 è il piede della faccia
      const q = i * 4
      col[q] = 255 * v * mr * (1.02 + c * 0.06) * (1 - umido * 0.35)
      col[q + 1] = 255 * v * mg * 0.95 * (1 - umido * 0.3)
      col[q + 2] = 255 * v * mb * 0.88 * (1 - umido * 0.2)
      col[q + 3] = 255
      const ru = fuga ? 1 : 0.7 + (1 - n) * 0.25 - umido * 0.35
      rug[q] = 255; rug[q + 1] = Math.max(0.2, ru) * 255; rug[q + 2] = 0; rug[q + 3] = 255
    }
  }
  return { map: trama(col, w, h, { srgb: true }), normalMap: trama(normaliDa(alt, w, h, 3.5), w, h), roughnessMap: trama(rug, w, h) }
}

// ── il legno delle botti: venature, nodi, le fughe fra le doghe ──
export function legno() {
  const f = frattale(256, 21, 4, 4)
  const alt = new Float32Array(256 * 256), col = new Uint8ClampedArray(256 * 256 * 4)
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const vena = Math.sin((x + f(x, y) * 60) * 0.35) * 0.5 + 0.5, nodo = f(x * 2 % 256, y) > 0.72 ? 0.25 : 0
    const asse = (x % 64) < 2 ? 0.25 : 1
    const v = (0.32 + vena * 0.12 - nodo) * asse
    const i = y * 256 + x; alt[i] = v
    col[i * 4] = 255 * v; col[i * 4 + 1] = 255 * v * 0.74; col[i * 4 + 2] = 255 * v * 0.5; col[i * 4 + 3] = 255
  }
  return { map: trama(col, 256, 256, { srgb: true }), normalMap: trama(normaliDa(alt, 256, 256, 3), 256, 256) }
}

// ── la normal map finta di tutto l'atlante: ogni figura diventa un cuscino (alta nel mezzo, smussata ai bordi della sagoma)
// più un poco di rilievo dalla luminosità. Pixel per pixel, stessa misura dell'atlante ──
export function normaliAtlante(immagine) {
  const w = immagine.width, h = immagine.height
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(immagine, 0, 0)
  const { data } = g.getImageData(0, 0, w, h)
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
  const cc = document.createElement('canvas'); cc.width = w; cc.height = h
  cc.getContext('2d').putImageData(new ImageData(n, w, h), 0, 0)
  const t = new CanvasTexture(cc)
  t.magFilter = t.minFilter = LinearFilter; t.generateMipmaps = false
  return t
}
