/* ── LA TENDA ──
   L'accampamento: due teli a spiovente, i picchetti, l'ingresso buio.
   Insieme al fuoco da campo fa il posto dove i personaggi si fermano —
   e siccome il triangolo è la forma più diversa da tutte le altre del
   catalogo (tutte tonde o squadrate), si riconosce da lontanissimo. */
import { mescola, poligono } from '../comune.js'
import { LEGNO, ombra } from './attrezzi.js'

export function tenda(p, cosa, S = p.S) {
  const { x, y, colore = '#b8894a' } = cosa
  const s = S
  const scuro = mescola(colore, '#000000', 0.3), chiaro = mescola(colore, '#ffffff', 0.16)
  ombra(p, x, y, 9 * s, 2.4 * s)
  // il telo: due falde, quella di destra in ombra
  poligono(p, [[x - 8 * s, y], [x, y - 14 * s], [x + 1.4 * s, y - 14 * s], [x - 6.6 * s, y]],
           chiaro, LEGNO.bordo, 0.7 * s)
  poligono(p, [[x + 8 * s, y], [x + 1.4 * s, y - 14 * s], [x, y - 14 * s], [x + 6.6 * s, y]],
           scuro, LEGNO.bordo, 0.7 * s)
  poligono(p, [[x - 6.6 * s, y], [x + 0.7 * s, y - 14 * s], [x + 6.6 * s, y]],
           colore, LEGNO.bordo, 0.7 * s)
  // l'ingresso: un triangolo scuro con i due lembi aperti
  poligono(p, [[x - 2.6 * s, y], [x + 0.7 * s, y - 8.4 * s], [x + 2.6 * s, y]], '#1c1a18')
  poligono(p, [[x - 2.6 * s, y], [x + 0.7 * s, y - 8.4 * s], [x - 0.6 * s, y]], scuro)
  poligono(p, [[x + 2.6 * s, y], [x + 0.7 * s, y - 8.4 * s], [x + 1.4 * s, y]], chiaro)
  // il palo che sporge in cima e i due picchetti
  p.rett(x + 0.2 * s, y - 16 * s, 1 * s, 2.4 * s, LEGNO.scuro)
  for (const v of [-1, 1]) {
    p.ctx.strokeStyle = LEGNO.scuro; p.ctx.lineWidth = 0.7 * s; p.ctx.lineCap = 'round'
    p.ctx.beginPath()
    p.ctx.moveTo(x + v * 7.4 * s, y - 0.6 * s)
    p.ctx.lineTo(x + v * 9.6 * s, y + 1 * s)
    p.ctx.stroke()
  }
}
