/* ── LE MONETE ──
   Un mucchietto, non una moneta sola: una moneta sola sembra un
   bottone. Tre dischi sfalsati con il taglio visibile di lato, e
   quella in cima gira piano su sé stessa — è il modo più corto per
   dire «questo si prende». */
import { tondo } from '../comune.js'
import { raccolta } from './attrezzi.js'

export function moneta(p, cosa, S = p.S) {
  const oro = '#f7c945', bordo = '#a8842c', luce = '#ffe9a0'
  const t = p.tempo || 0
  raccolta(p, cosa, S, 1, (q, s) => {
    // le due sotto, ferme e appena sfalsate
    for (const [dx, dy] of [[-1.6, 1.4], [1.4, 0.9]]) {
      tondo(q, dx * s, dy * s, 2.5 * s, 1.7 * s, oro, bordo, 0.6 * s)
      tondo(q, dx * s, dy * s - 0.2 * s, 1.4 * s, 0.9 * s, luce)
    }
    // quella in cima gira: la larghezza è il coseno dell'angolo
    const larg = Math.abs(Math.cos(t * 1.6 + cosa.x * 0.05))
    const w = Math.max(0.22, larg) * 2.6 * s
    tondo(q, 0, -1.6 * s, w, 2.5 * s, oro, bordo, 0.6 * s)
    if (larg > 0.4) tondo(q, 0, -1.6 * s, w * 0.5, 1.3 * s, luce)
  })
}
