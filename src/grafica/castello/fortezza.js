/* ═══════════════════════════════════════════════════════════════════
   LA FORTEZZA — quella che si difende.

   Sta in fondo alla strada e non fa niente: è il posto dove i nemici
   non devono arrivare. Largo com'è, sul bordo destro gli si taglierebbe
   una torre e sembrerebbe un pezzo di muro, quindi resta dentro il
   campo per forza.
   ═══════════════════════════════════════════════════════════════════ */
export function castello(p, { x, y }) {
  const s = p.S * 1.15
  x = Math.min(p.W - 34 * s, x)
  const mur = '#d7cdbb', omb = '#b6ab97', tet = '#8b3d5e'
  p.ellisse(x, y + 6 * s, 30 * s, 9 * s, '#00000028')
  for (const dx of [-21, 21]) {
    const cx = x + dx * s
    p.rett(cx - 7 * s, y - 30 * s, 14 * s, 34 * s, mur)
    p.rett(cx + 3 * s, y - 30 * s, 4 * s, 34 * s, omb)
    p.figura([[cx - 9.5 * s, y - 30 * s], [cx + 9.5 * s, y - 30 * s], [cx, y - 45 * s]], tet)
    p.figura([[cx - 9.5 * s, y - 30 * s], [cx, y - 30 * s], [cx, y - 45 * s]], '#ffffff2a')
    p.rett(cx - 2 * s, y - 23 * s, 4 * s, 6 * s, '#5b4a3a')
  }
  p.rett(x - 15 * s, y - 23 * s, 30 * s, 27 * s, mur)
  p.rett(x + 7 * s, y - 23 * s, 8 * s, 27 * s, omb)
  for (let i = 0; i < 4; i++) p.rett(x - 15 * s + i * 8.4 * s, y - 28 * s, 5 * s, 5.6 * s, mur)
  // portone a tutto sesto con le sue assi
  p.ctx.fillStyle = '#6b4a2e'; p.ctx.beginPath()
  p.ctx.moveTo(x - 6.5 * s, y + 4 * s); p.ctx.lineTo(x - 6.5 * s, y - 7 * s)
  p.ctx.arc(x, y - 7 * s, 6.5 * s, Math.PI, 0); p.ctx.lineTo(x + 6.5 * s, y + 4 * s)
  p.ctx.closePath(); p.ctx.fill()
  for (let i = -1; i <= 1; i++) p.rett(x + i * 4 * s - 0.6 * s, y - 12.5 * s, 1.2 * s, 16.5 * s, '#4a3220')
  p.linea([{ x, y: y - 28 * s }, { x, y: y - 41 * s }], '#6b5f52', 1.4 * s)
  p.figura([[x, y - 41 * s], [x + 12 * s, y - 37.5 * s], [x, y - 34 * s]], '#ffd76a')
}
