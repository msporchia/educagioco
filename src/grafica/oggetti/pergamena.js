/* ── LA PERGAMENA ──
   Il rotolo chiuso, col nastro. È il fratello arrotolato della mappa:
   quella si apre e mostra qualcosa, questa no — e la differenza si
   deve vedere a colpo d'occhio, perché in un livello vorranno dire
   due cose diverse. */
import { mescola, capsula, tondo } from '../comune.js'
import { raccolta } from './attrezzi.js'

export function pergamena(p, cosa, S = p.S) {
  const carta = '#efe2bf', bordo = '#8a734a', nastro = '#b8332c'
  raccolta(p, cosa, S, 1, (q, s) => {
    q.ctx.save(); q.ctx.rotate(-0.3)
    capsula(q, 0, 0, 4.4 * s, 1.5 * s, 1.2 * s, carta, bordo, 0.6 * s)
    capsula(q, 0, -0.5 * s, 4.2 * s, 0.5 * s, 0.4 * s, mescola(carta, '#ffffff', 0.5))
    // i due tondi alle estremità: sono loro a dire «è arrotolata»
    for (const v of [-1, 1]) {
      tondo(q, v * 4.2 * s, 0, 1 * s, 1.5 * s, mescola(carta, '#000000', 0.12), bordo, 0.6 * s)
      tondo(q, v * 4.2 * s, 0, 0.4 * s, 0.6 * s, mescola(carta, '#000000', 0.3))
    }
    q.rett(-0.7 * s, -1.7 * s, 1.4 * s, 3.4 * s, nastro)
    q.rett(-0.7 * s, -1.7 * s, 1.4 * s, 0.6 * s, mescola(nastro, '#ffffff', 0.3))
    q.ctx.restore()
  })
}
