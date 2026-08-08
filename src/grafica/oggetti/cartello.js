/* ── IL CARTELLO ──
   Una tavola su un palo con la freccia incisa. Niente lettere: chi
   gioca ha sei anni e non tutte le parole si leggono — **una freccia
   si capisce sempre**, e in tutte le lingue. `verso` è dove punta. */
import { poligono } from '../comune.js'
import { LEGNO, asse, ombra } from './attrezzi.js'

export function cartello(p, cosa, S = p.S) {
  const { x, y, verso = 'dx' } = cosa
  const s = S
  const ang = { dx: 0, sx: Math.PI, su: -Math.PI / 2, giu: Math.PI / 2 }[verso] ?? 0
  ombra(p, x, y, 3 * s, 1.4 * s)
  p.rett(x - 0.9 * s, y - 11 * s, 1.8 * s, 11 * s, LEGNO.scuro)
  p.rett(x - 0.9 * s, y - 11 * s, 0.6 * s, 11 * s, LEGNO.medio)
  p.in(x, y - 13.6 * s, q => {
    for (let i = 0; i < 2; i++)
      asse(q, -6.4 * s, -3 * s + i * 3 * s, 12.8 * s, 3 * s,
           i ? LEGNO.medio : LEGNO.chiaro, LEGNO.bordo, 0.65 * s)
    // la freccia incisa, girata dove serve
    q.in(0, 0, r => {
      poligono(r, [[-3.4 * s, -0.8 * s], [1 * s, -0.8 * s], [1 * s, -2.4 * s], [4 * s, 0],
                   [1 * s, 2.4 * s], [1 * s, 0.8 * s], [-3.4 * s, 0.8 * s]], LEGNO.molto)
    }, ang)
  }, Math.sin(x * 0.13) * 0.05)
}
