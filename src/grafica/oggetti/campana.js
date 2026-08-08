/* ── LA CAMPANA A MANO ──
   Da prendere, non da suonare a muro: quella appesa è il
   `campanello`, questa sta in una mano. Se `suona`, trema e butta
   fuori due archi — lo stesso segno del campanello d'allarme, così un
   bambino che ha imparato uno ha imparato tutti e due. */
import { mescola, capsula, tondo } from '../comune.js'
import { LEGNO, raccolta } from './attrezzi.js'

export function campana(p, cosa, S = p.S) {
  const oro = '#e0b53c', bordo = '#7a5a14'
  const t = p.tempo || 0
  const scossa = cosa.suona ? Math.sin(t * 22) * 0.16 : 0
  raccolta(p, cosa, S, 1, (q, s) => {
    q.ctx.save(); q.ctx.rotate(scossa)
    const c = q.ctx
    c.beginPath()
    c.moveTo(-3 * s, 2 * s)
    c.quadraticCurveTo(-2.8 * s, -3 * s, 0, -3.4 * s)
    c.quadraticCurveTo(2.8 * s, -3 * s, 3 * s, 2 * s)
    c.closePath()
    c.fillStyle = oro; c.fill()
    c.strokeStyle = bordo; c.lineWidth = 0.65 * s; c.lineJoin = 'round'; c.stroke()
    capsula(q, 0, 2.2 * s, 3.4 * s, 0.7 * s, 0.5 * s, mescola(oro, '#000000', 0.2), bordo, 0.6 * s)
    tondo(q, 0, 3.2 * s, 0.8 * s, 0.8 * s, mescola(oro, '#000000', 0.3))   // il batacchio
    q.rett(-0.6 * s, -5 * s, 1.2 * s, 1.8 * s, LEGNO.medio)                // il manico
    // il lume sul bronzo
    c.beginPath()
    c.moveTo(-1.8 * s, 1.4 * s)
    c.quadraticCurveTo(-1.8 * s, -2.2 * s, -0.6 * s, -2.8 * s)
    c.quadraticCurveTo(-1.2 * s, -1 * s, -1 * s, 1.4 * s)
    c.closePath(); c.fillStyle = '#ffffff66'; c.fill()
    q.ctx.restore()
    if (!cosa.suona) return
    const f = (t * 2.4) % 1
    q.velo(1 - f, () => {
      for (const v of [-1, 1]) for (let i = 0; i < 2; i++) {
        c.strokeStyle = '#fff3c4'; c.lineWidth = 0.9 * s
        c.beginPath()
        c.arc(0, -1 * s, (4 + i * 2 + f * 2.4) * s, v > 0 ? -0.7 : Math.PI - 0.7,
              v > 0 ? 0.7 : Math.PI + 0.7)
        c.stroke()
      }
    })
  })
}
