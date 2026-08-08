/* ── LE STALAGMITI ──
   Tre punte di roccia che salgono dal pavimento della grotta, alte
   diverse. Sono l'unico ostacolo «naturale» del catalogo: non le ha
   messe lì nessuno, ci sono cresciute — e per questo non hanno né
   spigoli né simmetria. */
import { mescola, poligono } from '../comune.js'
import { PIETRA, ombra } from './attrezzi.js'

export function stalagmite(p, cosa, S = p.S) {
  const { x, y, tinta } = cosa
  const s = S
  const col = tinta || '#6b6153'
  const chiaro = mescola(col, '#ffffff', 0.26), scuro = mescola(col, '#000000', 0.3)
  ombra(p, x, y, 5.4 * s, 1.8 * s)
  // le tre punte: la più alta in mezzo-dietro, le altre ai lati
  const punta = (dx, h, w) => {
    poligono(p, [[x + (dx - w) * s, y], [x + dx * s, y - h * s], [x + (dx + w) * s, y]],
             col, PIETRA.bordo, 0.65 * s)
    poligono(p, [[x + (dx - w * 0.5) * s, y], [x + dx * s, y - h * s], [x + dx * s, y]], chiaro)
    poligono(p, [[x + (dx + w) * s, y], [x + dx * s, y - h * s], [x + (dx + w * 0.4) * s, y]], scuro)
  }
  punta(-3, 6, 2)
  punta(3.2, 7.4, 2.2)
  punta(0.2, 11, 2.6)
}
