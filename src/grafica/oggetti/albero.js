/* ── L'ALBERO ──
   Tronco e chioma a tre ciuffi. Serve **fuori dal bosco**: dentro il
   bosco gli alberi sono la muratura e stanno nel fondale, ma un albero
   solo in mezzo a un cortile è un oggetto, e va messo dove il livello
   vuole. `secco` toglie la chioma e lascia i rami: è lo stesso albero
   in una stanza morta. */
import { mescola, tondo } from '../comune.js'
import { LEGNO, ombra } from './attrezzi.js'

export function albero(p, cosa, S = p.S) {
  const { x, y, secco = false, colore = '#3f7a3a' } = cosa
  const s = S
  const chiaro = mescola(colore, '#ffffff', 0.22), scuro = mescola(colore, '#000000', 0.28)
  ombra(p, x, y, 7 * s, 2.4 * s)
  // il tronco, che si allarga in basso
  const c = p.ctx
  c.beginPath()
  c.moveTo(x - 3 * s, y)
  c.quadraticCurveTo(x - 1.4 * s, y - 6 * s, x - 1.6 * s, y - 14 * s)
  c.lineTo(x + 1.6 * s, y - 14 * s)
  c.quadraticCurveTo(x + 1.4 * s, y - 6 * s, x + 3 * s, y)
  c.closePath()
  c.fillStyle = '#6a4f30'; c.fill()
  c.strokeStyle = '#3a2a18'; c.lineWidth = 0.7 * s; c.lineJoin = 'round'; c.stroke()
  c.beginPath()
  c.moveTo(x - 1.4 * s, y - 1 * s); c.lineTo(x - 0.9 * s, y - 13 * s)
  c.strokeStyle = '#8a6b45'; c.lineWidth = 0.8 * s; c.stroke()
  if (secco) {
    // i rami nudi: quattro linee spesse che si assottigliano
    for (const [dx, dy, dx2, dy2] of [[-1, -13, -6, -19], [1, -13, 6, -18],
                                      [-0.5, -15, -3, -22], [0.8, -15, 3.4, -21]]) {
      c.strokeStyle = '#6a4f30'; c.lineWidth = 1.1 * s; c.lineCap = 'round'
      c.beginPath()
      c.moveTo(x + dx * s, y + dy * s)
      c.quadraticCurveTo(x + dx2 * 0.6 * s, y + dy2 * 0.8 * s, x + dx2 * s, y + dy2 * s)
      c.stroke()
    }
    return
  }
  // la chioma: tre ciuffi tondi, il più grande dietro
  for (const [dx, dy, r, col] of [[0, -20, 8, scuro], [-4.4, -17, 5.6, colore],
                                  [4.2, -17.4, 5.4, colore], [-1.4, -22.4, 5, chiaro]])
    tondo(p, x + dx * s, y + dy * s, r * s, r * 0.86 * s, col, '#1d3a24', 0.7 * s)
  tondo(p, x - 4.4 * s, y - 21 * s, 2 * s, 1.4 * s, mescola(chiaro, '#ffffff', 0.3))
}
