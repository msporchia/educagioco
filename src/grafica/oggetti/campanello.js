/* ── IL CAMPANELLO D'ALLARME ──
   È il «messaggio» del linguaggio del gioco: il colore deve gridare.
   Cupola piena della tinta, base di ferro, e quando suona trema e
   butta fuori due archi per parte. */
import { buio, capsula, tondo } from '../comune.js'

const ALLARMI = {
  rosso:  { vivo: '#f03c2e', scuro: '#a5211a' },
  blu:    { vivo: '#2f8ce8', scuro: '#1b559c' },
  verde:  { vivo: '#2fbd52', scuro: '#187a35' },
  giallo: { vivo: '#f7c50a', scuro: '#b48800' },
}
export const COLORI_ALLARME = Object.keys(ALLARMI)

export function campanello(p, cosa, S = p.S) {
  const { x, y, colore = 'rosso', suona = false } = cosa
  const s = S * 1.1, t = p.tempo || 0
  const A = ALLARMI[colore] || ALLARMI.rosso
  const scossa = suona ? Math.sin(t * 22) * 0.22 : 0
  p.ellisse(x, y, 5 * s, 1.8 * s, '#00000030')
  // il palo e il basamento
  p.rett(x - 0.9 * s, y - 8 * s, 1.8 * s, 8 * s, '#5a5044')
  p.ellisse(x, y - 0.4 * s, 3.6 * s, 1.5 * s, '#6f6455')
  p.in(x, y - 8.4 * s, q => {
    const b = buio(A.scuro, 0.45)
    q.ctx.beginPath()
    q.ctx.moveTo(-4.2 * s, 0)
    q.ctx.quadraticCurveTo(-4 * s, -6.4 * s, 0, -6.8 * s)
    q.ctx.quadraticCurveTo(4 * s, -6.4 * s, 4.2 * s, 0)
    q.ctx.closePath()
    q.ctx.fillStyle = A.vivo; q.ctx.fill()
    q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.8 * s; q.ctx.stroke()
    capsula(q, 0, 0.2 * s, 4.8 * s, 0.9 * s, 0.7 * s, A.scuro, b, 0.8 * s)
    tondo(q, 0, 1.4 * s, 1.1 * s, 1.1 * s, A.scuro, b, 0.8 * s)      // batacchio
    q.ctx.beginPath()                                                // luce sulla campana
    q.ctx.moveTo(-2.6 * s, -0.6 * s)
    q.ctx.quadraticCurveTo(-2.6 * s, -5 * s, -0.9 * s, -5.6 * s)
    q.ctx.quadraticCurveTo(-1.6 * s, -3.4 * s, -1.4 * s, -0.6 * s)
    q.ctx.closePath(); q.ctx.fillStyle = '#ffffff77'; q.ctx.fill()
    tondo(q, 0, -7.2 * s, 0.9 * s, 0.9 * s, '#8b8071', b, 0.7 * s)
  }, scossa)
  if (!suona) return
  const f = (t * 2.4) % 1
  p.velo(1 - f, () => {
    for (const v of [-1, 1]) for (let i = 0; i < 2; i++) {
      const r = (5 + i * 2.6 + f * 3) * s
      p.ctx.strokeStyle = A.vivo; p.ctx.lineWidth = 1.1 * s
      p.ctx.beginPath()
      p.ctx.arc(x, y - 11 * s, r, v > 0 ? -0.7 : Math.PI - 0.7, v > 0 ? 0.7 : Math.PI + 0.7)
      p.ctx.stroke()
    }
  })
}
