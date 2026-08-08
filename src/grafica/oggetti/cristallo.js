/* ── IL CRISTALLO ──
   Tre schegge che spuntano dalla roccia, con l'alone intorno. È
   l'unico oggetto di scena che **fa luce da fermo**: in una miniera
   buia è il premio che si vede da lontano, e per questo non ce ne
   devono essere tanti. */
import { mescola, poligono, tondo } from '../comune.js'

export function cristallo(p, cosa, S = p.S) {
  const { x, y, colore = '#7fd8e0' } = cosa
  const s = S, t = p.tempo || 0
  const scuro = mescola(colore, '#000000', 0.45), chiaro = mescola(colore, '#ffffff', 0.5)
  // l'alone: pulsa piano, ed è quello che lo fa «prezioso»
  const puls = 0.5 + 0.5 * Math.sin(t * 2 + x * 0.05)
  p.velo(0.18 + 0.12 * puls, () => p.ellisse(x, y - 3 * s, 9 * s, 6 * s, colore))
  p.ellisse(x, y + 0.6 * s, 4.6 * s, 1.4 * s, '#00000033')
  const scheggia = (dx, h, w, col) => {
    poligono(p, [[x + (dx - w) * s, y], [x + dx * s, y - h * s], [x + (dx + w) * s, y]],
             col, scuro, 0.55 * s)
    poligono(p, [[x + (dx - w * 0.3) * s, y], [x + dx * s, y - h * s],
                 [x + (dx + w * 0.35) * s, y - h * 0.3 * s]], chiaro)
  }
  scheggia(-2.6, 4.4, 1.5, mescola(colore, '#000000', 0.15))
  scheggia(2.4, 5.4, 1.6, mescola(colore, '#000000', 0.08))
  scheggia(0, 7.6, 1.9, colore)
  tondo(p, x - 0.6 * s, y - 5.4 * s, 0.5 * s, 0.8 * s, '#ffffff')
}
