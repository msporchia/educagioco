/* ── LA CATENA ──
   Piatta, per terra, con l'anello a muro a un capo. `lunghezza` in
   celle e `verso` per dove corre. Non serve a niente da sola: serve a
   dire che **qualcosa era legato qui** — e in un livello futuro sarà
   il segno che quel qualcosa si è liberato. */
import { mescola, tondo } from '../comune.js'
import { LATO, LEGNO } from './attrezzi.js'

export function catena(p, cosa, S = p.S) {
  const { x, y, verso = 'dx', lunghezza = 1, lato = LATO } = cosa
  const L = lato * S
  const ang = { dx: 0, sx: Math.PI, su: -Math.PI / 2, giu: Math.PI / 2 }[verso] ?? 0
  p.in(x, y, q => {
    const n = Math.max(3, Math.round(lunghezza * 7))
    const passo = lunghezza * L / n
    // gli anelli: uno di taglio e uno di faccia, alternati — è
    // l'alternanza a farli sembrare agganciati
    for (let i = 0; i < n; i++) {
      const cx = i * passo
      const dritto = i % 2 === 0
      q.ctx.strokeStyle = i % 2 ? LEGNO.ferroS : LEGNO.ferro
      q.ctx.lineWidth = Math.max(1, L * 0.045)
      q.ctx.beginPath()
      q.ctx.ellipse(cx, Math.sin(i * 1.7) * L * 0.03, passo * 0.62,
                    dritto ? passo * 0.4 : passo * 0.16, 0, 0, 6.29)
      q.ctx.stroke()
    }
    // l'anello a muro
    tondo(q, -passo * 0.4, 0, L * 0.09, L * 0.09, mescola(LEGNO.ferroS, '#000000', 0.3),
          LEGNO.bordo, L * 0.02)
  }, ang)
}
