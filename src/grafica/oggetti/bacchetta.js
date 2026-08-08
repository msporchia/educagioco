/* ── LA BACCHETTA ──
   Il bastone del mago in piccolo, da raccogliere. La punta è accesa e
   pulsa: è l'unico oggetto raccoglibile che fa luce da solo, e quel
   luccichio dice «magia» prima ancora della forma. */
import { capsula, tondo } from '../comune.js'
import { raccolta } from './attrezzi.js'

export function bacchetta(p, cosa, S = p.S) {
  const legno = '#8a6136', bordo = '#3a2312', gemma = '#7fe0ff'
  const t = p.tempo || 0
  raccolta(p, cosa, S, 1, (q, s) => {
    q.ctx.save(); q.ctx.rotate(-0.7)
    capsula(q, 0, 0.6 * s, 0.7 * s, 4.4 * s, 0.6 * s, legno, bordo, 0.55 * s)
    q.rett(-0.7 * s, 2.4 * s, 1.4 * s, 1.6 * s, '#5b4022')       // l'impugnatura
    // l'alone e la gemma in punta
    const puls = 0.6 + 0.4 * Math.sin(t * 4)
    q.velo(0.4 * puls, () => tondo(q, 0, -4.6 * s, 3.4 * s, 3.4 * s, gemma))
    tondo(q, 0, -4.6 * s, 1.3 * s, 1.3 * s, gemma, '#2f7f99', 0.5 * s)
    tondo(q, -0.4 * s, -5 * s, 0.5 * s, 0.4 * s, '#ffffff')
    q.ctx.restore()
  })
}
