/* ── L'ACQUA ──
   Una tessera piatta che riempie la cella: fondo scuro, riflessi che
   ondeggiano, schiuma sul bordo. Serve alle fogne e ai fossati, e va
   messa **sotto** tutto il resto (`strato: -1`), se no i riflessi
   passano sopra i piedi di chi guada. */
import { mescola, capsula } from '../comune.js'
import { LATO } from './attrezzi.js'

export function acqua(p, cosa, S = p.S) {
  const { x, y, lato = LATO, tinta = '#1d3b42', chiaro = '#7fd8e0' } = cosa
  const L = lato * S, h = L / 2, t = p.tempo || 0
  const c = p.ctx
  p.rett(x - h, y - h, L, L, tinta)
  p.velo(0.5, () => p.rett(x - h, y - h, L, L * 0.16, mescola(tinta, '#000000', 0.5)))
  // i riflessi: tre righe orizzontali che si allungano e si accorciano
  for (let i = 0; i < 3; i++) {
    const f = Math.sin(t * 1.1 + i * 2.1 + x * 0.03)
    const w = L * (0.16 + 0.12 * (1 + f))
    p.velo(0.22 + 0.12 * (1 + f), () =>
      capsula(p, x + f * L * 0.16 + (i - 1) * L * 0.16, y + (i - 1) * L * 0.22,
              w, L * 0.02, L * 0.02, chiaro))
  }
  // il bordo: una riga di schiuma appena visibile, e la cella smette di
  // sembrare un buco quadrato
  p.velo(0.3, () => {
    c.strokeStyle = chiaro; c.lineWidth = Math.max(1, L * 0.03)
    c.strokeRect(x - h + L * 0.02, y - h + L * 0.02, L * 0.96, L * 0.96)
  })
}

/* ── LA POZZANGHERA ──
   L'acqua che non riempie la cella: una macchia sola, bassa, col
   riflesso chiaro. Dove l'acqua è un tratto del pavimento e non un
   ostacolo. */
export function pozzanghera(p, cosa, S = p.S) {
  const { x, y, taglia = 1 } = cosa
  const s = S * taglia, t = p.tempo || 0
  p.velo(0.55, () => p.ellisse(x, y, 6 * s, 2.4 * s, '#0d1418'))
  p.velo(0.4, () => p.ellisse(x - 1 * s, y - 0.4 * s, 3.2 * s, 0.9 * s, '#9fd8ff'))
  p.velo(0.3 + 0.1 * Math.sin(t * 1.4 + x * 0.05), () => {
    p.ctx.strokeStyle = '#c9e8ff'; p.ctx.lineWidth = 0.5 * s
    p.ctx.beginPath(); p.ctx.ellipse(x, y, 6 * s, 2.4 * s, 0, 0, 6.29); p.ctx.stroke()
  })
}
