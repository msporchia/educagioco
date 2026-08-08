/* ── IL CARRELLO DA MINIERA ──
   Cassone di ferro su quattro ruote, sul binario. `pieno` lo riempie
   di sassi e cristalli: è il carico a dire se la miniera lavora
   ancora o se è stata abbandonata, e sono due storie diverse. */
import { mescola, poligono, tondo } from '../comune.js'
import { LEGNO, ombra } from './attrezzi.js'

export function carrello(p, cosa, S = p.S) {
  const { x, y, pieno = true } = cosa
  const s = S
  ombra(p, x, y, 6.4 * s, 2 * s)
  // le ruote: due davanti, due appena dietro e più piccole
  for (const [dx, dy, r] of [[-3.6, -1.2, 1.5], [3.6, -1.2, 1.5], [-3, -2.4, 1.1], [3, -2.4, 1.1]]) {
    tondo(p, x + dx * s, y + dy * s, r * s, r * s, LEGNO.ferroS, LEGNO.bordo, 0.55 * s)
    tondo(p, x + dx * s, y + dy * s, r * 0.35 * s, r * 0.35 * s, LEGNO.ferroL)
  }
  // il cassone: più largo in alto, come tutti i cassoni da ribaltare
  poligono(p, [[x - 5.4 * s, y - 9.4 * s], [x + 5.4 * s, y - 9.4 * s],
               [x + 4.2 * s, y - 2.4 * s], [x - 4.2 * s, y - 2.4 * s]],
           LEGNO.ferro, LEGNO.bordo, 0.75 * s)
  p.rett(x - 5.4 * s, y - 9.4 * s, 10.8 * s, 1 * s, LEGNO.ferroL)
  for (const dx of [-2.4, 0, 2.4])
    p.rett(x + dx * s - 0.3 * s, y - 9.2 * s, 0.6 * s, 6.8 * s, mescola(LEGNO.ferroS, '#000000', 0.15))
  // il carico
  if (pieno) {
    for (const [dx, dy, r] of [[-2.8, -9.8, 1.6], [0, -10.4, 1.9], [2.6, -9.8, 1.5]])
      tondo(p, x + dx * s, y + dy * s, r * s, r * 0.8 * s, '#6b6153', LEGNO.bordo, 0.5 * s)
    tondo(p, x + 1 * s, y - 11 * s, 0.9 * s, 0.9 * s, '#7fd8e0')
  } else {
    p.rett(x - 4.6 * s, y - 9 * s, 9.2 * s, 1.4 * s, mescola(LEGNO.ferroS, '#000000', 0.35))
  }
}
