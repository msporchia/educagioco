/* ── IL CORNO ──
   Da soffiarci dentro: un corno curvo con le due fasce d'ottone e la
   cinghia. È il segnale che si sente da lontano — e in una campagna
   futura sarà quello che chiama i rinforzi. */
import { mescola, tondo } from '../comune.js'
import { LEGNO, raccolta } from './attrezzi.js'

export function corno(p, cosa, S = p.S) {
  const osso = '#e2d6bd', bordo = '#7a6a4a'
  raccolta(p, cosa, S, 1, (q, s) => {
    const c = q.ctx
    // il corno: due archi che si stringono verso la punta
    c.beginPath()
    c.moveTo(-4.4 * s, -1.6 * s)
    c.quadraticCurveTo(1.4 * s, -3.6 * s, 4.2 * s, 0.6 * s)
    c.quadraticCurveTo(1.2 * s, -0.6 * s, -4 * s, 1.6 * s)
    c.closePath()
    c.fillStyle = osso; c.fill()
    c.strokeStyle = bordo; c.lineWidth = 0.6 * s; c.lineJoin = 'round'; c.stroke()
    c.beginPath()
    c.moveTo(-4 * s, -1.2 * s)
    c.quadraticCurveTo(1 * s, -2.8 * s, 3.4 * s, 0.2 * s)
    c.strokeStyle = mescola(osso, '#ffffff', 0.55); c.lineWidth = 0.5 * s; c.stroke()
    // la bocca larga e le due fasce
    tondo(q, -4.2 * s, 0, 0.9 * s, 2 * s, mescola(osso, '#000000', 0.18), bordo, 0.6 * s)
    for (const [dx, dy] of [[-2, -0.3], [1.4, -0.9]])
      q.rett(dx * s, dy * s - 1 * s, 0.8 * s, 2.2 * s, LEGNO.oro)
    // la cinghia
    c.strokeStyle = '#8a5a30'; c.lineWidth = 0.55 * s
    c.beginPath()
    c.moveTo(-1.8 * s, 0.4 * s)
    c.quadraticCurveTo(-1 * s, 3.6 * s, 1.8 * s, 0.2 * s)
    c.stroke()
  })
}
