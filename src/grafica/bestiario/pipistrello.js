/* ═════ IL PIPISTRELLO ═════
   Sta per aria, e si vede da due cose: le ali che battono e il fatto
   che il corpo è **piccolo in mezzo a un'apertura larga**. Chi lo
   disegna grosso col le ali corte ottiene un topo con le pinne.

   Il battito è lento apposta. A frequenza vera sarebbe uno sfarfallio
   che stanca l'occhio; qui serve a dire «è in volo», non a simulare
   un pipistrello. */
import { mescola, tondo } from '../comune.js'
import { occhi } from '../segni.js'
import { ala } from './comune.js'

export const PIPISTRELLO = {
  quadrupede: true, taglia: 0.94,
  col: {
    pelo: '#5b4a76', peloS: '#3d3054', membrana: '#4b3a63',
    orecchio: '#3d3054', zanne: '#f7f4ea', bordo: '#1e1530',
  },
  disegna(q, s, C, dir, sw, stato) {
    const t = q.tempo || 0
    const b = C.bordo, sp = 0.7 * s
    const battito = 0.7 + Math.sin(t * 3.2) * 0.3
    for (const v of [-1, 1])
      ala(q, s, v, { lungo: 10.5, alto: 7, col: C.membrana, bordo: b,
                     apertura: battito, x: v * 1.4 * s, y: -4 * s })
    tondo(q, 0, -3.4 * s, 3 * s, 3.6 * s, C.pelo, b, sp)           // il corpo
    for (const v of [-1, 1])                                        // i piedini aggrappati
      q.linea([{ x: v * 1.2 * s, y: -0.4 * s }, { x: v * 1.8 * s, y: 1.4 * s }], C.peloS, 0.7 * s)
    for (const v of [-1, 1])                                        // le orecchie a punta
      q.figura([[v * 1.2 * s, -6.6 * s], [v * 3.2 * s, -11 * s], [v * 2.8 * s, -5.8 * s]], C.orecchio)
    tondo(q, 0, -6.6 * s, 2.8 * s, 2.5 * s, C.pelo, b, sp)          // la testa
    occhi(q, s, 1.2, -7, 0.66, stato)
    tondo(q, 0, -5.4 * s, 0.7 * s, 0.55 * s, mescola(C.peloS, '#000000', 0.3))
    if (stato !== 'ko')                                             // le due zanne
      for (const v of [-1, 1])
        q.figura([[v * 0.5 * s, -4.9 * s], [v * 1.2 * s, -4.9 * s], [v * 0.85 * s, -3.6 * s]], C.zanne)
  },
}
