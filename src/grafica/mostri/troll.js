/* Il troll — Sotterraneo, resiste alla magia (testa dura come il resto).
   Alto e allampanato, orecchie grandi e un naso enorme e chiaro: il
   contrario dell'orco, che è largo e basso con le zanne in vista.
   Grigio-salvia, per non confondersi col verde acceso dell'orco e
   del goblin — sono tre creature verdi, ma tre verdi diversi. */
import { occhi } from './comune.js'

export const troll = (p, s) => {
  p.ellisse(-6.2 * s, 4.2 * s, 2.8 * s, 4.6 * s, '#63715f')        // braccia lunghe
  p.ellisse(6.2 * s, 4.2 * s, 2.8 * s, 4.6 * s, '#63715f')
  p.figura([[-5.6 * s, 7 * s], [-5 * s, -2 * s], [-2.6 * s, -6.6 * s],
            [2.6 * s, -6.6 * s], [5 * s, -2 * s], [5.6 * s, 7 * s]], '#7a8a7e')
  p.figura([[-4.4 * s, -3 * s], [-8 * s, -4.8 * s], [-4.2 * s, -0.6 * s]], '#63715f')   // orecchio, grande
  p.figura([[4.4 * s, -3 * s], [8 * s, -4.8 * s], [4.2 * s, -0.6 * s]], '#63715f')
  p.figura([[0, -3 * s], [2.6 * s, 2.8 * s], [0, 4.2 * s], [-2.6 * s, 2.8 * s]], '#b6c4ac')  // naso, grande e chiaro
  occhi(p, s, 3, true)
}
