// Le trame delle stoffe e della carta da parati disegnate su un canvas 2D (righe, quadri, pois, fiori, cuori, stelle), senza three: le
// usano i mobili (scena3d/mobili.js), le pareti della casa (scena3d/casa3d.js) e i campioni del foglio (viste/Casa.vue).
// Vedi docs/fattoria3d/casa.md.

const canali = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const esa = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
export const chiaro = (hex, k) => esa(canali(hex).map(v => v + (255 - v) * k))
export const scuro = (hex, k) => esa(canali(hex).map(v => v * (1 - k)))
/** Il disegno di una trama su un canvas 2D di lato `n`: lo usa la stoffa e (viste/Casa.vue) il campione del foglio. */
export function disegnaTrama(x, n, fondo, trama) {
  x.fillStyle = fondo; x.fillRect(0, 0, n, n)
  const segno = trama === 'righe' || trama === 'quadri' ? chiaro(fondo, 0.45) : chiaro(fondo, 0.7)
  x.fillStyle = segno
  const u = n / 8
  if (trama === 'righe') for (let k = 0; k < 8; k += 2) x.fillRect(k * u, 0, u, n)
  else if (trama === 'quadri') { x.globalAlpha = 0.55; for (let k = 0; k < 8; k += 2) { x.fillRect(k * u, 0, u, n); x.fillRect(0, k * u, n, u) } x.globalAlpha = 1 }
  else if (trama === 'pois') for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { x.beginPath(); x.arc((a + (b % 2) * 0.5 + 0.25) * 2 * u, (b + 0.5) * 2 * u, u * 0.45, 0, Math.PI * 2); x.fill() }
  else if (trama === 'fiori') for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
    const cx = (a * 4 + 2 + (b % 2) * 2) * u, cy = (b * 4 + 2) * u
    for (let p = 0; p < 5; p++) { const t = p / 5 * Math.PI * 2; x.beginPath(); x.arc(cx + Math.cos(t) * u * 0.8, cy + Math.sin(t) * u * 0.8, u * 0.55, 0, Math.PI * 2); x.fill() }
    x.fillStyle = '#f6d36b'; x.beginPath(); x.arc(cx, cy, u * 0.45, 0, Math.PI * 2); x.fill(); x.fillStyle = segno
  } else if (trama === 'cuori') for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
    const cx = (a * 4 + 2 + (b % 2) * 2) * u, cy = (b * 4 + 1.6) * u, r = u * 0.75
    x.beginPath(); x.arc(cx - r * 0.7, cy, r, Math.PI, 0); x.arc(cx + r * 0.7, cy, r, Math.PI, 0); x.lineTo(cx, cy + r * 2.3); x.closePath(); x.fill()
  } else if (trama === 'stelle') for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
    const cx = (a * 4 + 2 + (b % 2) * 2) * u, cy = (b * 4 + 2) * u
    x.beginPath()
    for (let p = 0; p < 10; p++) { const t = -Math.PI / 2 + p * Math.PI / 5, r = p % 2 ? u * 0.55 : u * 1.3; x.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r) }
    x.closePath(); x.fill()
  }
}
