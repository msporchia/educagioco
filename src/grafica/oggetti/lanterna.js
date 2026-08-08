/* ── LA LANTERNA ──
   Il lume chiuso nel vetro: non guizza come una torcia, **pulsa**
   piano. È la differenza fra un fuoco all'aria e un fuoco protetto, e
   si vede: la luce della lanterna è ferma, quindi in un livello
   sotterraneo è quella che si può portare in giro senza che si spenga. */
import { mescola, poligono, tondo } from '../comune.js'
import { LEGNO, pozzaLuce, raccolta } from './attrezzi.js'

export function lanterna(p, cosa, S = p.S) {
  const accesa = cosa.accesa !== false
  const t = p.tempo || 0
  const puls = 0.85 + 0.15 * Math.sin(t * 2.6 + cosa.x * 0.05)
  if (accesa) pozzaLuce(p, cosa.x, cosa.y, 11 * S, '#ffd88a', 0.5 * puls)
  raccolta(p, cosa, S, 1, (q, s) => {
    // il cappello, il fondo e i quattro montanti
    poligono(q, [[-3 * s, -2.6 * s], [3 * s, -2.6 * s], [2.2 * s, -4 * s], [-2.2 * s, -4 * s]],
             LEGNO.ferroS, LEGNO.bordo, 0.6 * s)
    q.rett(-2.6 * s, 2.4 * s, 5.2 * s, 1 * s, LEGNO.ferroS)
    // il vetro
    q.rett(-2.2 * s, -2.6 * s, 4.4 * s, 5 * s, accesa ? '#ffe9a0' : '#5f6a72')
    if (accesa) {
      tondo(q, 0, 0.4 * s, 1.3 * s, 1.7 * s, '#ff9a3c')
      q.velo(0.5 * puls, () => tondo(q, 0, 0, 3.4 * s, 3.8 * s, '#ffe9a0'))
    }
    for (const v of [-1, 1]) q.rett(v * 2.2 * s - 0.3 * s, -2.6 * s, 0.6 * s, 5 * s, LEGNO.ferro)
    q.ctx.strokeStyle = LEGNO.bordo; q.ctx.lineWidth = 0.55 * s
    q.ctx.strokeRect(-2.2 * s, -2.6 * s, 4.4 * s, 5 * s)
    // il manico
    q.ctx.strokeStyle = LEGNO.ferro; q.ctx.lineWidth = 0.5 * s
    q.ctx.beginPath()
    q.ctx.moveTo(-1.6 * s, -4 * s); q.ctx.quadraticCurveTo(0, -7.4 * s, 1.6 * s, -4 * s)
    q.ctx.stroke()
  })
}
