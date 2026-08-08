/* ── LA LEVA ──
   `tirata` da 0 (in su, da tirare) a 1 (giù, tirata). Il pomello è
   rosso quando è da tirare e verde quando è tirata: a sei anni il
   colore si legge prima della posizione dell'asta, e il numero fra 0 e
   1 invece di un vero/falso serve perché un giorno la si vedrà
   scendere piano. */
import { buio, capsula, poligono, tondo } from '../comune.js'
import { LEGNO, ombra } from './attrezzi.js'

export function leva(p, cosa, S = p.S) {
  const { x, y, tirata = 0 } = cosa
  const s = S
  const t = Math.max(0, Math.min(1, tirata))
  ombra(p, x, y, 4 * s, 1.6 * s)
  // la base: un ceppo di ferro con la fessura
  poligono(p, [[x - 3.4 * s, y], [x + 3.4 * s, y], [x + 2.6 * s, y - 3 * s], [x - 2.6 * s, y - 3 * s]],
           LEGNO.ferroS, LEGNO.bordo, 0.7 * s)
  p.rett(x - 2.6 * s, y - 3.2 * s, 5.2 * s, 0.8 * s, LEGNO.ferro)
  p.rett(x - 0.8 * s, y - 3.4 * s, 1.6 * s, 1.2 * s, '#14171f')
  // l'asta: gira intorno al perno, da −0.9 a +0.9 radianti
  const ang = -0.9 + t * 1.8
  p.in(x, y - 3 * s, q => {
    capsula(q, 0, -5 * s, 0.85 * s, 5.4 * s, 0.7 * s, LEGNO.ferroL, LEGNO.bordo, 0.7 * s)
    const col = t > 0.5 ? '#3fbd5a' : '#e0453f'
    tondo(q, 0, -10.4 * s, 2 * s, 2 * s, col, buio(col, 0.4), 0.8 * s)
    tondo(q, -0.6 * s, -11 * s, 0.8 * s, 0.6 * s, '#ffffff88')
  }, ang)
  tondo(p, x, y - 3 * s, 0.9 * s, 0.9 * s, LEGNO.ferro, LEGNO.bordo, 0.6 * s)   // il perno
}
