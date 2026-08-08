/* ── L'ALTARE ──
   Un blocco di pietra con il piano più largo della base, due candele
   accese e una coppa. È il posto dove **si mette qualcosa**: in un
   livello futuro sarà «porta la gemma qui», e per questo il piano è
   vuoto in mezzo e ben illuminato. */
import { mescola, poligono, tondo } from '../comune.js'
import { PIETRA, LEGNO, fiamma, pozzaLuce, ombra } from './attrezzi.js'

export function altare(p, cosa, S = p.S) {
  const { x, y, acceso = true } = cosa
  const s = S, t = p.tempo || 0
  if (acceso) pozzaLuce(p, x, y - 4 * s, 13 * s, '#ffd88a', 0.45)
  ombra(p, x, y, 7.4 * s, 2.4 * s)
  // il basamento e il fusto, poi il piano che sporge
  poligono(p, [[x - 6.4 * s, y], [x + 6.4 * s, y], [x + 5 * s, y - 2 * s], [x - 5 * s, y - 2 * s]],
           PIETRA.scura, PIETRA.bordo, 0.7 * s)
  p.rett(x - 4.4 * s, y - 8 * s, 8.8 * s, 6 * s, PIETRA.media)
  p.rett(x - 4.4 * s, y - 8 * s, 2.4 * s, 6 * s, PIETRA.chiara)
  // le due scanalature del fusto: senza, è un parallelepipedo
  for (const dx of [-1.6, 1.6])
    p.rett(x + dx * s, y - 7.4 * s, 0.5 * s, 5.4 * s, mescola(PIETRA.scura, '#000000', 0.2))
  poligono(p, [[x - 6.4 * s, y - 8 * s], [x + 6.4 * s, y - 8 * s], [x + 5.6 * s, y - 10 * s],
               [x - 5.6 * s, y - 10 * s]], PIETRA.chiara, PIETRA.bordo, 0.7 * s)
  p.rett(x - 6.4 * s, y - 8.6 * s, 12.8 * s, 0.7 * s, mescola(PIETRA.chiara, '#ffffff', 0.3))
  // la coppa in mezzo
  tondo(p, x, y - 10.2 * s, 2.2 * s, 0.9 * s, LEGNO.oro, LEGNO.oroS, 0.6 * s)
  tondo(p, x, y - 10.4 * s, 1.4 * s, 0.55 * s, mescola(LEGNO.oro, '#ffffff', 0.4))
  // le due candele
  for (const v of [-1, 1]) {
    const cx = x + v * 4.4 * s
    p.rett(cx - 0.7 * s, y - 13.4 * s, 1.4 * s, 3.6 * s, '#efe7d0')
    p.rett(cx - 0.7 * s, y - 13.4 * s, 0.5 * s, 3.6 * s, '#ffffff')
    if (acceso) {
      p.velo(0.92, () => fiamma(p, cx, y - 13.6 * s, 0.8 * s, t, v * 2.1))
      p.velo(0.22, () => p.ellisse(cx, y - 14.6 * s, 2.4 * s, 3 * s, '#ffd88a'))
    }
  }
}
