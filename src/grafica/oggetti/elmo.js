/* ── L'ELMO ──
   Vuoto, appoggiato per terra, di tre quarti: la calotta, la feritoia
   nera e il nasale. La feritoia buia è quello che dice «non c'è
   nessuno dentro» — con due occhi accesi sarebbe un personaggio. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { raccolta } from './attrezzi.js'

export function elmo(p, cosa, S = p.S) {
  const ferro = '#cfd8e6', ferroS = '#98a4bb', bordo = '#241b33'
  const cresta = cosa.colore || '#e0453f'
  raccolta(p, cosa, S, 1, (q, s) => {
    tondo(q, 0, 0, 3.8 * s, 3.6 * s, ferro, bordo, 0.7 * s)
    capsula(q, 0, 2.4 * s, 3.4 * s, 0.9 * s, 0.7 * s, ferroS, bordo, 0.6 * s)
    q.rett(-2.6 * s, -0.6 * s, 5.2 * s, 1.5 * s, '#20222e')       // la feritoia
    q.rett(-0.5 * s, -1.4 * s, 1 * s, 3.6 * s, ferroS)            // il nasale
    // il ciuffo, appiattito perché l'elmo è per terra
    poligono(q, [[-1.4 * s, -3 * s], [1.4 * s, -3 * s], [1.8 * s, -4.4 * s],
                 [0, -5 * s], [-1.8 * s, -4.4 * s]], cresta, bordo, 0.6 * s)
    poligono(q, [[-1.4 * s, -3 * s], [0, -3 * s], [0, -5 * s], [-1.8 * s, -4.4 * s]],
             mescola(cresta, '#ffffff', 0.28))
    tondo(q, -1.6 * s, -1.4 * s, 1 * s, 0.7 * s, '#ffffff66')
  })
}
