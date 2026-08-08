/* ── IL MARTELLO ──
   Manico di legno e testa di ferro squadrata. Insieme al piccone fa
   la coppia degli attrezzi: si somigliano apposta (stesso manico) e
   si distinguono per la testa — **squadrata** qui, a punta là. */
import { capsula, tondo } from '../comune.js'
import { LEGNO, raccolta } from './attrezzi.js'

export function martello(p, cosa, S = p.S) {
  raccolta(p, cosa, S, 1, (q, s) => {
    q.ctx.save(); q.ctx.rotate(-0.5)
    capsula(q, 0, 1.6 * s, 0.75 * s, 3.6 * s, 0.6 * s, LEGNO.medio, LEGNO.bordo, 0.55 * s)
    q.rett(-0.5 * s, 3.4 * s, 1 * s, 1.4 * s, LEGNO.scuro)
    // la testa: un blocco e la penna dall'altra parte
    q.rett(-2.6 * s, -3.4 * s, 5.2 * s, 2.4 * s, LEGNO.ferro)
    q.rett(-2.6 * s, -3.4 * s, 5.2 * s, 0.7 * s, LEGNO.ferroL)
    q.rett(2.4 * s, -3.2 * s, 1.4 * s, 2 * s, LEGNO.ferroS)
    q.ctx.strokeStyle = LEGNO.bordo; q.ctx.lineWidth = 0.6 * s
    q.ctx.strokeRect(-2.6 * s, -3.4 * s, 5.2 * s, 2.4 * s)
    tondo(q, 0, -2.2 * s, 0.5 * s, 0.5 * s, LEGNO.ferroS)
    q.ctx.restore()
  })
}
