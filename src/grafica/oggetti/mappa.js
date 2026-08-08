/* ── LA MAPPA ──
   Il foglio aperto, con la strada tratteggiata e la X. Nessuna
   scritta: una X e un tratteggio si leggono a sei anni e in tutte le
   lingue, una legenda no. */
import { mescola, poligono } from '../comune.js'
import { raccolta } from './attrezzi.js'

export function mappa(p, cosa, S = p.S) {
  const carta = '#efe2bf', bordo = '#8a734a'
  raccolta(p, cosa, S, 1, (q, s) => {
    q.ctx.save(); q.ctx.rotate(-0.12)
    // il foglio: i lati non sono paralleli, così sembra tenuto in mano
    poligono(q, [[-4.6 * s, -3.4 * s], [4.6 * s, -3.8 * s], [4.4 * s, 3.4 * s],
                 [-4.4 * s, 3.8 * s]], carta, bordo, 0.6 * s)
    poligono(q, [[-4.6 * s, -3.4 * s], [0, -3.6 * s], [0, 3.6 * s], [-4.4 * s, 3.8 * s]],
             mescola(carta, '#ffffff', 0.35))
    // la piega verticale: una mappa piegata è una mappa usata
    q.ctx.strokeStyle = mescola(carta, '#000000', 0.22); q.ctx.lineWidth = 0.35 * s
    q.ctx.beginPath(); q.ctx.moveTo(0, -3.6 * s); q.ctx.lineTo(0, 3.6 * s); q.ctx.stroke()
    // la strada tratteggiata e la croce del tesoro
    q.ctx.strokeStyle = '#8a5a30'; q.ctx.lineWidth = 0.45 * s
    q.ctx.setLineDash([0.7 * s, 0.7 * s])
    q.ctx.beginPath()
    q.ctx.moveTo(-3.4 * s, 2.4 * s)
    q.ctx.quadraticCurveTo(-0.4 * s, 1 * s, 2.4 * s, -1.8 * s)
    q.ctx.stroke()
    q.ctx.setLineDash([])
    q.ctx.strokeStyle = '#b8332c'; q.ctx.lineWidth = 0.7 * s; q.ctx.lineCap = 'round'
    q.ctx.beginPath()
    q.ctx.moveTo(1.8 * s, -2.4 * s); q.ctx.lineTo(3.2 * s, -1.2 * s)
    q.ctx.moveTo(3.2 * s, -2.4 * s); q.ctx.lineTo(1.8 * s, -1.2 * s)
    q.ctx.stroke()
    q.ctx.restore()
  })
}
