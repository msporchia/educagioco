/* ── LA RUOTA ──
   Il volante di ferro da girare, con le sue quattro maniglie. `giro`
   in radianti: chi la fa girare è il gioco, qui si disegna e basta —
   ed è il motivo per cui una ruota che gira di continuo (una macchina
   accesa) e una che gira quando la tocchi sono lo stesso disegno. */
import { mescola, tondo } from '../comune.js'
import { LEGNO, ombra } from './attrezzi.js'

export function ruota(p, cosa, S = p.S) {
  const { x, y, giro = 0 } = cosa
  const s = S
  ombra(p, x, y, 4.4 * s, 1.6 * s)
  // il piedistallo
  p.rett(x - 1.4 * s, y - 6 * s, 2.8 * s, 6 * s, LEGNO.ferroS)
  p.rett(x - 1.4 * s, y - 6 * s, 0.9 * s, 6 * s, LEGNO.ferro)
  p.in(x, y - 8 * s, q => {
    const c = q.ctx
    // il cerchio esterno e i quattro raggi
    c.strokeStyle = LEGNO.ferro; c.lineWidth = 1.3 * s
    c.beginPath(); c.arc(0, 0, 4.4 * s, 0, 6.29); c.stroke()
    c.strokeStyle = LEGNO.ferroL; c.lineWidth = 0.5 * s
    c.beginPath(); c.arc(0, -0.3 * s, 4.4 * s, 3.4, 5.9); c.stroke()
    c.strokeStyle = LEGNO.ferroS; c.lineWidth = 1 * s
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * 6.29
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 4.4 * s, Math.sin(a) * 4.4 * s); c.stroke()
    }
    // le maniglie sporgenti: sono loro a dire «si gira»
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * 6.29 + 0.78
      tondo(q, Math.cos(a) * 5.2 * s, Math.sin(a) * 5.2 * s, 1 * s, 1 * s,
            mescola(LEGNO.medio, '#000000', 0.1), LEGNO.bordo, 0.55 * s)
    }
    tondo(q, 0, 0, 1.4 * s, 1.4 * s, LEGNO.ferroL, LEGNO.bordo, 0.6 * s)
  }, giro)
}
