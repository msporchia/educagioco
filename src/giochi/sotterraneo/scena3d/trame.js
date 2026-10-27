// Le trame generate a codice, nel colore dell'ambientazione (scena3d/aspetti.js): il pavimento e le pareti dello stile,
// il legno delle botti, e la normal map finta dell'atlante (ogni figura un cuscino smussato ai bordi). Una volta per scenario.
import { CanvasTexture, LinearFilter, Color, SRGBColorSpace } from 'three'
import { frattale, normaliDa, trama } from './rumore.js'
import { PAVIMENTI, MURI } from './pitture.js'

// ── il pavimento e le pareti: il disegno dello stile del paesaggio (scena3d/pitture.js), fatto trama. A pezzi (il disegno, il rilievo,
// le trame: un `yield` fra l'uno e l'altro) per l'entrata a passi (indice.js, cantiereDi); `pavimento` e `muro` tutto insieme ──
function* fatte(t) {
  const n = normaliDa(t.alt, t.w, t.h, 3.2)
  yield 'rilievo'
  return {
    map: trama(t.col, t.w, t.h, { srgb: true }), normalMap: trama(n, t.w, t.h),
    roughnessMap: trama(t.rug, t.w, t.h), emissiveMap: t.em ? trama(t.em, t.w, t.h, { srgb: true }) : null,
  }
}
export function* pavimentoAPassi(asp) {
  const t = (PAVIMENTI[asp.pav] || PAVIMENTI.cesto)(asp)
  yield 'disegno'
  return { ...(yield* fatte(t)), celle: t.celle }
}
export function* muroAPassi(asp) {
  const t = (MURI[asp.trama] || MURI.mattoni)(asp)
  yield 'disegno'
  return yield* fatte(t)
}
// il colore medio di una trama generata (lineare), una volta per trama: il terreno e l'arredo semplici lo usano al posto della trama
const medi = new WeakMap()
export function colorMedio(tex) {
  if (medi.has(tex)) return medi.get(tex)
  const d = tex.image.data, s = [0, 0, 0]
  let n = 0
  for (let i = 0; i < d.length; i += 4 * 13) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; n++ }
  const c = new Color().setRGB(s[0] / n / 255, s[1] / n / 255, s[2] / n / 255, SRGBColorSpace)
  medi.set(tex, c)
  return c
}
const tutto = g => { for (;;) { const r = g.next(); if (r.done) return r.value } }
export const pavimento = asp => tutto(pavimentoAPassi(asp))
export const muro = asp => tutto(muroAPassi(asp))

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
