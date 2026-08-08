/* ── IL CESPUGLIO ──
   Quattro ciuffi tondi e qualche bacca. È l'albero in piccolo, e serve
   allo stesso modo: a rompere il vuoto di una stanza senza fare da
   muro. Basso apposta — un personaggio ci deve passare **davanti** e
   sembrare più alto. */
import { mescola, tondo } from '../comune.js'
import { ombra } from './attrezzi.js'

export function cespuglio(p, cosa, S = p.S) {
  const { x, y, colore = '#3f7a3a', bacche = true } = cosa
  const s = S
  const chiaro = mescola(colore, '#ffffff', 0.24), scuro = mescola(colore, '#000000', 0.24)
  ombra(p, x, y, 6 * s, 2 * s)
  for (const [dx, dy, r] of [[-3, -2.4, 3.6], [3, -2.6, 3.4], [0, -4.4, 4], [-1.6, -6, 2.8]])
    tondo(p, x + dx * s, y + dy * s, r * s, r * 0.85 * s,
          dy < -4 ? chiaro : (dx < 0 ? colore : scuro), '#1d3a24', 0.65 * s)
  tondo(p, x - 2.6 * s, y - 5.4 * s, 1.4 * s, 1 * s, mescola(chiaro, '#ffffff', 0.35))
  if (bacche)
    for (const [dx, dy] of [[2, -4], [-2.4, -2.6], [1, -6.4]])
      tondo(p, x + dx * s, y + dy * s, 0.8 * s, 0.8 * s, '#c0453f', '#7a2019', 0.4 * s)
}
