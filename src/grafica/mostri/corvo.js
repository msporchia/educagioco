/* Il corvo — Bosco, vola, resiste alle frecce (vira a ogni battito).
   Ali piumate strette contro il corpo, becco corto: una sagoma da
   uccello, non da pipistrello — niente dita, niente membrana. Nero
   quasi puro: sul prato chiaro è il mostro più netto di tutti. */
import { occhi } from './comune.js'

export const corvo = (p, s) => {
  for (const v of [-1, 1])
    p.figura([[0, -0.6 * s], [v * 8.4 * s, -3.6 * s], [v * 7 * s, 1.6 * s], [v * 2.4 * s, 2 * s]], '#241f30')
  p.ellisse(0, 0, 5.4 * s, 5.6 * s, '#332c40')
  p.ellisse(-1.4 * s, -1.6 * s, 2.2 * s, 1.8 * s, '#463c56')
  p.figura([[0, 0.4 * s], [3 * s, 1.6 * s], [0, 2.6 * s]], '#e8a23c')  // becco
  occhi(p, s, 1.8, true)
}
