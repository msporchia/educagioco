/* Il balestriere — Mura, resiste alle bombe (al fischio si butta dietro il pavese).
   Il cappuccio in ombra e la balestra che sporge di lato: l'unico
   mostro con un'arma in mano, gli altri colpiscono col corpo. Cuoio
   bruno, lontano dal grigio metallico del corazziere anche se
   condividono il terreno. */
import { occhi } from './comune.js'

export const balestriere = (p, s) => {
  p.figura([[-5.6 * s, 5.6 * s], [-6.2 * s, -1 * s], [-3 * s, -6.4 * s],
            [3 * s, -6.4 * s], [6.2 * s, -1 * s], [5.6 * s, 5.6 * s]], '#5c4a34')
  p.ellisse(0, -1.4 * s, 4.6 * s, 4.4 * s, '#3a2e20')                              // ombra sotto il cappuccio
  p.figura([[6 * s, -2.4 * s], [11.4 * s, -4 * s], [11.4 * s, 1 * s], [6 * s, 1.6 * s]], '#4a3a28')  // balestra
  p.linea([{ x: 7.4 * s, y: -4.6 * s }, { x: 7.4 * s, y: 3 * s }], '#8c7550', 1 * s)  // arco della balestra
  occhi(p, s, 2, true)
}
