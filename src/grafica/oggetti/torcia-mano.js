/* ── LA TORCIA DA MANO ──
   La sorella piccola di quella a muro: si raccoglie, quindi ondeggia
   come tutte le cose da prendere, e la sua pozza di luce è **stretta**
   — chi la porta illumina un passo, non una stanza. Spenta è un
   bastone con la punta nera: è la differenza che un giorno vorrà dire
   «cercati un fuoco». */
import { capsula, tondo } from '../comune.js'
import { LEGNO, fiamma, pozzaLuce, raccolta } from './attrezzi.js'

export function torciaMano(p, cosa, S = p.S) {
  const accesa = cosa.accesa !== false
  const t = p.tempo || 0
  const f = (cosa.x * 0.09) % 6.28
  if (accesa) pozzaLuce(p, cosa.x, cosa.y, 9 * S, '#ffb45a', 0.45 + 0.08 * Math.sin(t * 6 + f))
  raccolta(p, cosa, S, 1, (q, s) => {
    q.ctx.save(); q.ctx.rotate(0.35)
    capsula(q, 0, 1.6 * s, 0.75 * s, 4 * s, 0.6 * s, LEGNO.scuro, LEGNO.bordo, 0.55 * s)
    // la fasciatura di stracci in cima
    capsula(q, 0, -2.6 * s, 1.4 * s, 1.6 * s, 0.6 * s, '#6a5a3a', LEGNO.bordo, 0.55 * s)
    if (accesa) {
      q.velo(0.9, () => fiamma(q, 0, -4 * s, 1.4 * s, t, f))
      q.velo(0.22, () => tondo(q, 0, -5.4 * s, 3.4 * s, 4 * s, '#ffb45a'))
    } else {
      tondo(q, 0, -4 * s, 1.2 * s, 0.8 * s, '#2b2723')
    }
    q.ctx.restore()
  })
}
