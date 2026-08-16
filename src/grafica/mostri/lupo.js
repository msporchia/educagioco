/* Il lupo — Bosco, resiste alle frecce (corre a zig-zag).
   Orecchie a punta e muso allungato: la sagoma di un cane che caccia
   in branco, non di un mostro tondo. Grigio-blu, senza pelo dipinto
   a ciocche — a distanza di telefono si perderebbe. */
import { occhi } from './comune.js'

export const lupo = (p, s) => {
  // orecchie strette e dritte in cima, non spalancate ai lati: allargate
  // sembravano le ali del pipistrello invece che un muso da cane
  p.figura([[-2.6 * s, -5 * s], [-4.2 * s, -9.6 * s], [-0.6 * s, -5.8 * s]], '#3f3f4d')
  p.figura([[2.6 * s, -5 * s], [4.2 * s, -9.6 * s], [0.6 * s, -5.8 * s]], '#3f3f4d')
  p.ellisse(0, 0.4 * s, 6.4 * s, 6 * s, '#5a5a68')
  p.ellisse(-1.6 * s, -1.6 * s, 2.6 * s, 2.1 * s, '#7d7d8c')
  // il muso: un blocco scuro grande, non un accenno, con tartufo e dente
  p.figura([[-2.6 * s, 1.4 * s], [2.6 * s, 1.4 * s], [1.6 * s, 6.6 * s], [-1.6 * s, 6.6 * s]], '#2f2f3a')
  p.cerchio(0, 6 * s, 1 * s, '#1b1430')
  p.figura([[-1 * s, 5.6 * s], [1 * s, 5.6 * s], [0, 7.6 * s]], '#f7f4ea')
  occhi(p, s, 2.4, true)
}
