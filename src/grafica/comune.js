// Il fondo del cassetto: colore e forme, per tutti. Vedi docs/core/grafica.md.
import { trama } from './materia.js'

const canale = (c, i) => parseInt(c.slice(i, i + 2), 16)

export function mescola(a, b, q) {
  return '#' + [1, 3, 5].map(i =>
    Math.round(canale(a, i) + (canale(b, i) - canale(a, i)) * q)
      .toString(16).padStart(2, '0')).join('')
}

export const buio = (c, q = 0.34) => mescola(c, '#1a1226', q)

export function tinge(pal, col, q) {
  if (q <= 0) return pal
  const out = {}
  for (const k in pal) {
    const v = pal[k]
    out[k] = (typeof v === 'string' && v[0] === '#' && v.length === 7)
      ? mescola(v, col, q) : v
  }
  return out
}

// il volume: fillStyle prende sempre un gradiente, mai una tinta piatta. Vedi docs/core/grafica.md.
const CHIARO = '#ffffff', SCURO = '#0a0616'

const tinta = c => typeof c === 'string' && c.length === 7 && c[0] === '#'

// curva con un "ginocchio" (non lineare): un gradiente diritto sbiadisce invece di sembrare tondo
function volume(c, col, alto, basso) {
  if (!tinta(col)) return col
  const g = c.createLinearGradient(0, alto, 0, basso)
  g.addColorStop(0, mescola(col, CHIARO, 0.46))     // il colmo
  g.addColorStop(0.16, mescola(col, CHIARO, 0.22))  // il ginocchio
  g.addColorStop(0.42, col)                         // il tono pieno
  g.addColorStop(1, mescola(col, SCURO, 0.34))      // il sottosquadro
  return g
}

// va chiamata col tracciato della forma ancora in mano: la trama viaggia con la figura (le sue coordinate)
function posaMateria(c, materia, x, y, w, h) {
  if (!materia) return
  const t = trama(c, materia)
  if (!t) return
  c.save()
  c.clip()
  c.fillStyle = t
  c.fillRect(x - w, y - h, w * 2, h * 2)
  c.restore()
}

// il contorno scuro non è un vezzo: a 36px è l'unica cosa che tiene staccato un personaggio dal pavimento
export function capsula(q, x, y, w, h, r, col, bordo, sp, materia) {
  const c = q.ctx
  r = Math.min(r, w, h)
  c.beginPath()
  c.moveTo(x - w + r, y - h)
  c.arcTo(x + w, y - h, x + w, y + h, r)
  c.arcTo(x + w, y + h, x - w, y + h, r)
  c.arcTo(x - w, y + h, x - w, y - h, r)
  c.arcTo(x - w, y - h, x + w, y - h, r)
  c.closePath()
  c.fillStyle = volume(c, col, y - h, y + h); c.fill()
  posaMateria(c, materia, x, y, w + 2, h + 2)
  if (bordo) { c.strokeStyle = bordo; c.lineWidth = sp; c.lineJoin = 'round'; c.stroke() }
}

export function poligono(q, punti, col, bordo, sp, materia) {
  const c = q.ctx
  c.beginPath()
  punti.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y))
  c.closePath()
  let alto = Infinity, basso = -Infinity
  for (const [, y] of punti) { if (y < alto) alto = y; if (y > basso) basso = y }
  c.fillStyle = volume(c, col, alto, basso); c.fill()
  if (materia) {
    let sx = Infinity, dx = -Infinity
    for (const [x] of punti) { if (x < sx) sx = x; if (x > dx) dx = x }
    posaMateria(c, materia, (sx + dx) / 2, (alto + basso) / 2,
                (dx - sx) / 2 + 2, (basso - alto) / 2 + 2)
  }
  if (bordo) { c.strokeStyle = bordo; c.lineWidth = sp; c.lineJoin = 'round'; c.stroke() }
}

export function tondo(q, x, y, rx, ry, col, bordo, sp, materia) {
  const c = q.ctx
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.29)
  c.fillStyle = volume(c, col, y - ry, y + ry); c.fill()
  posaMateria(c, materia, x, y, rx + 2, ry + 2)
  if (bordo) { c.strokeStyle = bordo; c.lineWidth = sp; c.stroke() }
}


export const rett = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h) }

export const ell = (c, x, y, rx, ry, col) => {
  c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.29); c.fill()
}

export const velo = (c, q, fn) => { const a = c.globalAlpha; c.globalAlpha = a * q; fn(); c.globalAlpha = a }

export function poly(c, punti, col, bordo, sp) {
  c.beginPath()
  punti.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y))
  c.closePath(); c.fillStyle = col; c.fill()
  if (bordo) { c.strokeStyle = bordo; c.lineWidth = sp; c.lineJoin = 'round'; c.stroke() }
}

// numero deterministico 0..1 dai tre interi: nessuno stato, nessun ordine di chiamata
export function dado(a, b = 0, c = 0) {
  let t = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791)) >>> 0
  t = Math.imul(t ^ t >>> 15, 0x85ebca6b)
  t = Math.imul(t ^ t >>> 13, 0xc2b2ae35)
  return ((t ^ t >>> 16) >>> 0) / 4294967296
}
