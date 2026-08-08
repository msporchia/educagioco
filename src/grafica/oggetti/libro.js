/* ── IL LIBRO ──
   Chiuso, in piedi sul dorso, con la borchia e il segnalibro. Il
   dorso in vista serve a distinguerlo dalla pergamena anche a 36 px:
   il libro è **un blocco**, la pergamena un tubo. */
import { mescola, tondo } from '../comune.js'
import { raccolta } from './attrezzi.js'

export function libro(p, cosa, S = p.S) {
  const cop = cosa.colore || '#7a3a52', bordo = '#2e1d2a', oro = '#e8c569'
  raccolta(p, cosa, S, 1, (q, s) => {
    q.ctx.save(); q.ctx.rotate(-0.08)
    // le pagine, poi la copertina sopra: due strati e si vede lo spessore
    q.rett(-3 * s, -3.6 * s, 5.8 * s, 7.2 * s, '#efe7d0')
    for (let i = 1; i < 4; i++)
      q.rett(-3 * s, -3.6 * s + i * 1.8 * s, 5.8 * s, 0.25 * s, '#cfc5ab')
    q.rett(-3.4 * s, -4 * s, 6 * s, 8 * s, cop)
    q.rett(-3.4 * s, -4 * s, 6 * s, 1 * s, mescola(cop, '#ffffff', 0.2))
    q.rett(-3.4 * s, -4 * s, 1.5 * s, 8 * s, mescola(cop, '#000000', 0.3))   // il dorso
    q.ctx.strokeStyle = bordo; q.ctx.lineWidth = 0.6 * s
    q.ctx.strokeRect(-3.4 * s, -4 * s, 6 * s, 8 * s)
    tondo(q, 0.4 * s, 0, 1.2 * s, 1.2 * s, oro, '#a8842c', 0.5 * s)          // la borchia
    q.rett(2 * s, -4 * s, 0.9 * s, 9.6 * s, '#c0453f')                       // il segnalibro
    q.ctx.restore()
  })
}
