/* ── I FUNGHI ──
   Tre, di misura diversa, col cappello a puntini. Nel fondale i
   funghi ci sono già come dettaglio sparso: questi sono più grossi e
   li mette il livello — in una grotta buia un ciuffo di funghi chiari
   è un punto di riferimento, e in una campagna futura sarà qualcosa da
   raccogliere. */
import { mescola, tondo } from '../comune.js'
import { ombra } from './attrezzi.js'

export function fungo(p, cosa, S = p.S) {
  const { x, y, colore = '#c05a4a' } = cosa
  const s = S
  const gambo = '#efe7d0', scuro = mescola(colore, '#000000', 0.3)
  ombra(p, x, y, 5 * s, 1.6 * s)
  const uno = (dx, h, r) => {
    p.rett(x + dx * s - r * 0.28 * s, y - h * s, r * 0.56 * s, h * s, gambo)
    p.rett(x + dx * s - r * 0.28 * s, y - h * s, r * 0.22 * s, h * s, '#ffffff')
    // il cappello: una mezza ellisse, non un cerchio — un fungo tondo
    // sembra un lecca-lecca
    const c = p.ctx
    c.beginPath()
    c.ellipse(x + dx * s, y - h * s, r * s, r * 0.85 * s, 0, Math.PI, 0)
    c.closePath()
    c.fillStyle = colore; c.fill()
    c.strokeStyle = scuro; c.lineWidth = 0.55 * s; c.stroke()
    for (const [px, py] of [[-0.4, -0.5], [0.35, -0.6], [0, -0.25]])
      tondo(p, x + (dx + px * r) * s, y + (-h + py * r) * s, r * 0.16 * s, r * 0.13 * s, '#ffeedd')
  }
  uno(-3, 3.4, 2)
  uno(2.6, 2.6, 1.6)
  uno(-0.2, 5.4, 2.8)
}
