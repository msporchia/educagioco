/* ── IL POZZO ──
   Alto, con l'arco e il secchio: è uno dei pochi oggetti che si vede
   da lontano in una stanza, e serve proprio a quello — a dare un
   punto di riferimento in mezzo a un cortile. */
import { mescola, poligono, tondo } from '../comune.js'
import { LEGNO, PIETRA, ombra } from './attrezzi.js'

export function pozzo(p, cosa, S = p.S) {
  const { x, y } = cosa
  const s = S
  ombra(p, x, y, 7 * s, 2.6 * s)
  // la vera del pozzo: il cilindro di pietra e l'acqua nera dentro
  p.in(x, y - 1 * s, q => {
    q.rett(-6.2 * s, -5 * s, 12.4 * s, 5 * s, PIETRA.scura)
    tondo(q, 0, 0, 6.2 * s, 2.2 * s, PIETRA.scura)
    tondo(q, 0, -5 * s, 6.2 * s, 2.3 * s, PIETRA.media, '#4d4738', 0.8 * s)
    tondo(q, 0, -5 * s, 4.8 * s, 1.7 * s, '#151a1e')
    tondo(q, -1.4 * s, -5.4 * s, 2 * s, 0.6 * s, '#2f4a56')          // il riflesso
    // i conci: cinque trattini, e la vera smette di essere un tubo
    for (let i = -2; i <= 2; i++)
      q.rett(i * 2.4 * s, -4.6 * s, 0.4 * s, 4.6 * s, mescola(PIETRA.scura, '#000000', 0.2))
  })
  // i due montanti e la trave, poi la corda e il secchio
  for (const v of [-1, 1])
    p.rett(x + v * 5 * s - 0.7 * s, y - 17 * s, 1.4 * s, 11 * s, LEGNO.scuro)
  p.rett(x - 6.4 * s, y - 18.4 * s, 12.8 * s, 1.6 * s, LEGNO.medio)
  p.rett(x - 6.4 * s, y - 18.4 * s, 12.8 * s, 0.5 * s, LEGNO.chiaro)
  poligono(p, [[x - 6.4 * s, y - 18.4 * s], [x, y - 21 * s], [x + 6.4 * s, y - 18.4 * s]],
           LEGNO.scuro, LEGNO.bordo, 0.7 * s)                        // il tettuccio
  p.linea([{ x, y: y - 17.6 * s }, { x, y: y - 13 * s }], '#8a7a5e', 0.6 * s)
  poligono(p, [[x - 1.8 * s, y - 13 * s], [x + 1.8 * s, y - 13 * s], [x + 1.4 * s, y - 9.6 * s],
               [x - 1.4 * s, y - 9.6 * s]], LEGNO.chiaro, LEGNO.bordo, 0.7 * s)
  p.rett(x - 1.8 * s, y - 12.4 * s, 3.6 * s, 0.5 * s, LEGNO.ferro)
}
