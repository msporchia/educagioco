/* ── IL PONTE ──
   Piatto: assi di traverso e due travi ai lati. `verso` dice per dove
   si cammina, e le assi si mettono **di traverso al cammino** — un
   ponte con le assi per il lungo non si legge come un ponte. */
import { LATO, LEGNO, asse } from './attrezzi.js'
import { tondo } from '../comune.js'

export function ponte(p, cosa, S = p.S) {
  const { x, y, verso = 'orizzontale', lato = LATO } = cosa
  const L = lato * S, h = L / 2
  const c = p.ctx
  c.save(); c.translate(x, y)
  if (verso !== 'orizzontale') c.rotate(Math.PI / 2)
  // il vuoto sotto, appena accennato ai due bordi
  p.velo(0.4, () => { p.rett(-h, -h, L, L * 0.14, '#000000'); p.rett(-h, h * 0.86, L, L * 0.14, '#000000') })
  const n = 5
  for (let i = 0; i < n; i++) {
    const w = L / n
    asse(p, -h + i * w + w * 0.06, -h * 0.92, w * 0.88, L * 0.92,
         i % 2 ? LEGNO.medio : LEGNO.chiaro, LEGNO.bordo, Math.max(0.8, L * 0.02))
  }
  // le due travi lungo i bordi e i chiodi
  for (const v of [-1, 1]) {
    p.rett(-h, v * h * 0.82 - L * 0.05, L, L * 0.1, LEGNO.scuro)
    for (let i = 0; i < n; i++)
      tondo(p, -h + (i + 0.5) * L / n, v * h * 0.82, L * 0.015, L * 0.015, LEGNO.ferroL)
  }
  c.restore()
}
