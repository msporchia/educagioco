/* ── LA CORDA ──
   Una matassa: tre giri sovrapposti e il capo che pende. I giri
   disegnati come ellissi concentriche sarebbero un bersaglio; sfalsati
   di poco, invece, sembrano avvolti. */
import { mescola } from '../comune.js'
import { raccolta } from './attrezzi.js'

export function corda(p, cosa, S = p.S) {
  const canapa = '#c9a877', scuro = '#8a6b40'
  raccolta(p, cosa, S, 1, (q, s) => {
    const c = q.ctx
    c.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = i % 2 ? scuro : canapa
      c.lineWidth = 1.3 * s
      c.beginPath()
      c.ellipse(0, i * 0.9 * s - 0.9 * s, 3.4 * s - i * 0.3 * s, 1.5 * s, 0.1, 0, 6.29)
      c.stroke()
    }
    // il capo che scende, con il nodino in fondo
    c.strokeStyle = canapa; c.lineWidth = 1.1 * s
    c.beginPath()
    c.moveTo(2.8 * s, 0.6 * s)
    c.quadraticCurveTo(4.4 * s, 2 * s, 3.4 * s, 3.4 * s)
    c.stroke()
    c.strokeStyle = mescola(canapa, '#ffffff', 0.3); c.lineWidth = 0.4 * s
    c.beginPath(); c.ellipse(-0.4 * s, -1.4 * s, 2.2 * s, 0.9 * s, 0.1, 3.4, 5.6); c.stroke()
  })
}
