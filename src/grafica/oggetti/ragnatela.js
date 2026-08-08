/* ── LA RAGNATELA ──
   Sta in un angolo, piatta, e non deve fare massa: è **un velo**. I
   giri sono un po' cascanti apposta — l'arco perfetto sembra un
   mirino. Il ragnetto (`ragno: true`) è tondo e ha due occhi: anche
   qui, buffo e non schifoso. */
import { tondo } from '../comune.js'
import { LATO } from './attrezzi.js'

export function ragnatela(p, cosa, S = p.S) {
  const { x, y, angolo = 'no', ragno = false, lato = LATO } = cosa
  const L = lato * S, h = L / 2
  const g = { no: [1, 1], ne: [-1, 1], so: [1, -1], se: [-1, -1] }[angolo] || [1, 1]
  const ox = x - g[0] * h * 0.92, oy = y - g[1] * h * 0.92
  const c = p.ctx
  const R = L * 0.92
  p.velo(0.42, () => {
    c.strokeStyle = '#e8e4d8'; c.lineWidth = Math.max(0.7, L * 0.018)
    const a0 = Math.atan2(g[1], 0), a1 = Math.atan2(0, g[0])
    for (let k = 0; k <= 5; k++) {
      const a = a1 + (a0 - a1) * k / 5
      c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(a) * R, oy + Math.sin(a) * R); c.stroke()
    }
    for (let n = 1; n <= 4; n++) {
      const r = R * n / 4.4
      c.beginPath()
      for (let k = 0; k <= 5; k++) {
        const a = a1 + (a0 - a1) * k / 5
        const rr = r * (k % 2 ? 0.9 : 1)
        const px = ox + Math.cos(a) * rr, py = oy + Math.sin(a) * rr
        k ? c.lineTo(px, py) : c.moveTo(px, py)
      }
      c.stroke()
    }
  })
  if (!ragno) return
  const t = p.tempo || 0
  const rx = ox + g[0] * R * 0.42, ry = oy + g[1] * R * 0.42 + Math.sin(t * 1.6) * L * 0.02
  const s = L / 20
  for (const v of [-1, 1]) {
    c.strokeStyle = '#2a2b33'; c.lineWidth = 0.5 * s; c.lineCap = 'round'
    for (const dy of [-1, 0.4]) {
      c.beginPath(); c.moveTo(rx, ry + dy * s)
      c.quadraticCurveTo(rx + v * 2.4 * s, ry + dy * s - 1.4 * s, rx + v * 3 * s, ry + dy * s + 1 * s)
      c.stroke()
    }
  }
  tondo(p, rx, ry, 1.6 * s, 1.4 * s, '#3a3b45', '#2a2b33', 0.5 * s)
  for (const v of [-1, 1]) tondo(p, rx + v * 0.6 * s, ry - 0.4 * s, 0.34 * s, 0.34 * s, '#ffffff')
}
