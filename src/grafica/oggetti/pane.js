/* ── IL PANE ──
   Una pagnotta con i tre tagli sopra. In un gioco per bambini il cibo
   non è un dettaglio: è la cosa che si capisce senza spiegazioni —
   «questo si mangia, quindi fa bene». */
import { mescola, tondo } from '../comune.js'
import { raccolta } from './attrezzi.js'

export function pane(p, cosa, S = p.S) {
  const crosta = '#c98f4a', chiaro = '#e8c17a', bordo = '#7a4a1e'
  raccolta(p, cosa, S, 1, (q, s) => {
    tondo(q, 0, 0, 4 * s, 2.8 * s, crosta, bordo, 0.65 * s)
    tondo(q, -0.6 * s, -0.8 * s, 2.6 * s, 1.4 * s, chiaro)
    // i tre tagli del fornaio: sono loro a farlo pane e non un sasso
    q.ctx.strokeStyle = bordo; q.ctx.lineWidth = 0.5 * s; q.ctx.lineCap = 'round'
    for (const dx of [-1.6, 0, 1.6]) {
      q.ctx.beginPath()
      q.ctx.moveTo(dx * s - 0.5 * s, -1.2 * s)
      q.ctx.lineTo(dx * s + 0.5 * s, 0.4 * s)
      q.ctx.stroke()
    }
    tondo(q, -1.4 * s, -1.6 * s, 1 * s, 0.4 * s, mescola(chiaro, '#ffffff', 0.4))
  })
}
