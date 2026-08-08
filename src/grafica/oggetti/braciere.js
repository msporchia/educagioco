/* ── IL BRACIERE ──
   Il fratello per terra della torcia: sta in mezzo alla stanza, quindi
   ha il treppiede e l'ombra, e la sua pozza di luce è tutt'intorno
   invece che davanti. Spento resta la coppa con la cenere — e in un
   livello «accendi i tre bracieri» è esattamente quello che serve. */
import { mescola, poligono, tondo } from '../comune.js'
import { LEGNO, fiamma, pozzaLuce, ombra } from './attrezzi.js'

export function braciere(p, cosa, S = p.S) {
  const { x, y, acceso = true } = cosa
  const s = S, t = p.tempo || 0
  const f = (x * 0.05 + y * 0.09) % 6.28
  if (acceso) pozzaLuce(p, x, y - 1 * s, 17 * s, '#ffa63c', 0.6 + 0.1 * Math.sin(t * 5 + f))
  ombra(p, x, y, 5.4 * s, 2 * s)
  // il treppiede: tre gambe, quella dietro più corta perché è lontana
  for (const [dx, h] of [[-3.4, 7], [3.4, 7], [0, 6]]) {
    p.ctx.strokeStyle = LEGNO.ferroS; p.ctx.lineWidth = 1.2 * s; p.ctx.lineCap = 'round'
    p.ctx.beginPath(); p.ctx.moveTo(x + dx * s, y - 0.4 * s); p.ctx.lineTo(x + dx * 0.35 * s, y - h * s)
    p.ctx.stroke()
  }
  p.in(x, y - 7 * s, q => {
    poligono(q, [[-4.6 * s, -2.6 * s], [4.6 * s, -2.6 * s], [3.2 * s, 1.4 * s], [-3.2 * s, 1.4 * s]],
             LEGNO.ferro, LEGNO.bordo, 0.7 * s)
    q.rett(-4.8 * s, -3.2 * s, 9.6 * s, 1 * s, LEGNO.ferroL)
    tondo(q, 0, -2.9 * s, 4.4 * s, 1.1 * s, acceso ? '#7a2a12' : '#3a3630')
    if (!acceso) { tondo(q, 0, -3.1 * s, 3 * s, 0.8 * s, '#2b2723'); return }
    // la brace: tre carboni accesi che pulsano
    for (const [dx, dy, r] of [[-2, -3.2, 1.2], [0.4, -3.4, 1.4], [2.2, -3, 1.1]])
      tondo(q, dx * s, dy * s, r * s, r * 0.5 * s,
            mescola('#ff6a1e', '#ffe27a', 0.3 + 0.3 * Math.sin(t * 4 + dx + f)))
  })
  if (!acceso) return
  p.velo(0.92, () => {
    fiamma(p, x - 1.4 * s, y - 10.4 * s, 1.6 * s, t, f + 1.4)
    fiamma(p, x + 1.6 * s, y - 10.6 * s, 1.7 * s, t, f + 3.1)
    fiamma(p, x, y - 10.8 * s, 2.4 * s, t, f)
  })
  p.velo(0.26 + 0.07 * Math.sin(t * 6 + f), () => p.ellisse(x, y - 13 * s, 6.4 * s, 7 * s, '#ffa63c'))
}
