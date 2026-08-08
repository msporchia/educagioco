/* ── IL BINARIO ──
   Una cella di rotaie, da mettere dove il binario del fondale non
   arriva: `verso` orizzontale o verticale. Serve a **collegare** —
   nella miniera i binari sono già dipinti nel pavimento, ma un raccordo
   o un tratto che entra in una stanza diversa si mette a mano. */
import { mescola } from '../comune.js'
import { LATO } from './attrezzi.js'

export function binario(p, cosa, S = p.S) {
  const { x, y, verso = 'orizzontale', lato = LATO } = cosa
  const L = lato * S, h = L / 2
  const c = p.ctx
  c.save(); c.translate(x, y)
  if (verso !== 'orizzontale') c.rotate(Math.PI / 2)
  // le traversine
  for (let i = 0; i < 3; i++) {
    const tx = -h + i * (L / 3) + L * 0.04
    const col = mescola('#6a4a2c', '#3f2a16', (i * 7 % 5) / 5)
    p.rett(tx, -h * 0.64, L * 0.25, L * 0.64 * 2, col)
    p.rett(tx, -h * 0.64, L * 0.25, L * 0.12, mescola(col, '#ffffff', 0.14))
  }
  // le due rotaie
  for (const d of [-1, 1]) {
    p.rett(-h, d * L * 0.24 - L * 0.05, L, L * 0.1, '#5c6470')
    p.rett(-h, d * L * 0.24 - L * 0.05, L, L * 0.035, '#8f9aa8')
  }
  c.restore()
}
