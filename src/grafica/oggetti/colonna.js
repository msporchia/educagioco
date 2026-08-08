/* ── LA COLONNA ──
   Va messa su una cella di muro (là non ci cammina nessuno) e serve a
   spezzare una sala grande. Alta il doppio di un personaggio: è
   l'unica cosa del gioco che lo è, e per questo una fila di colonne si
   legge subito come «sala nobile». */
import { mescola, poligono } from '../comune.js'

export function colonna(p, cosa, S = p.S) {
  const { x, y, tinta = '#e2d9c4' } = cosa
  const s = S
  const chiaro = mescola(tinta, '#ffffff', 0.25), scuro = mescola(tinta, '#000000', 0.28)
  p.ellisse(x, y + 1 * s, 6.4 * s, 2.4 * s, '#00000045')
  // la base, il fusto scanalato, il capitello
  poligono(p, [[x - 5.6 * s, y + 1 * s], [x + 5.6 * s, y + 1 * s], [x + 4.4 * s, y - 3 * s],
               [x - 4.4 * s, y - 3 * s]], scuro, '#00000055', 0.8 * s)
  p.rett(x - 4 * s, y - 30 * s, 8 * s, 27 * s, tinta)
  for (const dx of [-2.6, -0.9, 0.8, 2.5])
    p.rett(x + dx * s, y - 30 * s, 0.5 * s, 27 * s, scuro)
  p.rett(x - 4 * s, y - 30 * s, 1.6 * s, 27 * s, chiaro)
  poligono(p, [[x - 5.6 * s, y - 30 * s], [x + 5.6 * s, y - 30 * s], [x + 4.4 * s, y - 33.4 * s],
               [x - 4.4 * s, y - 33.4 * s]], chiaro, '#00000055', 0.8 * s)
  p.rett(x - 6 * s, y - 34.6 * s, 12 * s, 1.6 * s, tinta)
  p.rett(x - 6 * s, y - 34.6 * s, 12 * s, 0.6 * s, chiaro)
}
