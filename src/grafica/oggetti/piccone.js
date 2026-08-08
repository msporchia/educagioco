/* ── IL PICCONE ──
   L'attrezzo della miniera. Stesso manico del martello, testa a due
   punte curve: quella curva è la firma, e a 36 px è l'unica cosa che
   si vede. */
import { capsula } from '../comune.js'
import { LEGNO, raccolta } from './attrezzi.js'

export function piccone(p, cosa, S = p.S) {
  raccolta(p, cosa, S, 1, (q, s) => {
    q.ctx.save(); q.ctx.rotate(-0.5)
    capsula(q, 0, 1.6 * s, 0.75 * s, 4 * s, 0.6 * s, LEGNO.medio, LEGNO.bordo, 0.55 * s)
    // la testa: un arco spesso che scavalca il manico
    const c = q.ctx
    c.beginPath()
    c.moveTo(-4.4 * s, -1.4 * s)
    c.quadraticCurveTo(0, -4.8 * s, 4.4 * s, -1.4 * s)
    c.quadraticCurveTo(0, -3.4 * s, -4.4 * s, -1.4 * s)
    c.closePath()
    c.fillStyle = LEGNO.ferro; c.fill()
    c.strokeStyle = LEGNO.bordo; c.lineWidth = 0.6 * s; c.lineJoin = 'round'; c.stroke()
    c.beginPath()
    c.moveTo(-3.6 * s, -1.8 * s)
    c.quadraticCurveTo(0, -4.2 * s, 3.6 * s, -1.8 * s)
    c.strokeStyle = LEGNO.ferroL; c.lineWidth = 0.5 * s; c.stroke()
    q.rett(-1 * s, -2.8 * s, 2 * s, 1.8 * s, LEGNO.scuro)      // l'occhio del manico
    q.ctx.restore()
  })
}
