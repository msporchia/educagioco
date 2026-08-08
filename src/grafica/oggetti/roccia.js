/* ── IL MASSO ──
   Un sasso grosso, con la faccia in luce in alto a sinistra come tutto
   il resto del gioco. `taglia` da 0.6 a 1.4 per non averli tutti
   uguali: tre massi identici in fila sono peggio di nessun masso. */
import { mescola, poligono } from '../comune.js'
import { PIETRA, ombra } from './attrezzi.js'

export function roccia(p, cosa, S = p.S) {
  const { x, y, taglia = 1, tinta } = cosa
  const s = S * taglia
  const col = tinta || PIETRA.media
  const chiaro = mescola(col, '#ffffff', 0.24), scuro = mescola(col, '#000000', 0.26)
  ombra(p, x, y, 6 * s, 2 * s)
  // il masso: un poligono irregolare, mai un cerchio
  const pt = [[-5.4, 0], [-4.4, -4], [-1.6, -6.4], [2, -6], [4.8, -3.4], [5.2, 0]]
  poligono(p, pt.map(([dx, dy]) => [x + dx * s, y + dy * s]), col, PIETRA.bordo, 0.75 * s)
  poligono(p, [[x - 4.4 * s, y - 4 * s], [x - 1.6 * s, y - 6.4 * s], [x + 2 * s, y - 6 * s],
               [x + 0.4 * s, y - 3.4 * s], [x - 2.6 * s, y - 3 * s]], chiaro)
  poligono(p, [[x + 4.8 * s, y - 3.4 * s], [x + 5.2 * s, y], [x + 1 * s, y],
               [x + 1.6 * s, y - 2.6 * s]], scuro)
  // una crepa: due segmenti, e il masso smette di essere una macchia
  p.ctx.strokeStyle = scuro; p.ctx.lineWidth = 0.5 * s; p.ctx.lineCap = 'round'
  p.ctx.beginPath()
  p.ctx.moveTo(x - 1 * s, y - 5.6 * s); p.ctx.lineTo(x + 0.4 * s, y - 3 * s)
  p.ctx.lineTo(x - 0.4 * s, y - 0.6 * s)
  p.ctx.stroke()
}
