/* ── LA SCALA ──
   Piatta, e la sola cosa che deve dire è **da che parte si va**: `su`
   ha i gradini che si schiariscono salendo, `giu` che si spengono nel
   buio. La freccia non serve: il gradiente la fa da solo, e una
   freccia in più su una mappa già piena è rumore. */
import { mescola } from '../comune.js'
import { LATO } from './attrezzi.js'

export function scala(p, cosa, S = p.S) {
  const { x, y, verso = 'giu', lato = LATO } = cosa
  const L = lato * S, h = L / 2
  const giu = verso === 'giu'
  const c = p.ctx
  p.rett(x - h, y - h, L, L, giu ? '#141a1e' : '#5c5343')
  const n = 5
  for (let i = 0; i < n; i++) {
    // il gradino più lontano è il più stretto: è tutta la prospettiva
    // che serve a 36 px
    const f = i / (n - 1)
    const q = giu ? f : 1 - f
    const w = h * (1 - q * 0.32)
    const gy = y - h + i * (L / n)
    const col = mescola('#a49a86', giu ? '#0e1216' : '#efe6d2', q * 0.85)
    p.rett(x - w, gy, w * 2, L / n * 0.78, col)
    p.rett(x - w, gy, w * 2, L / n * 0.2, mescola(col, '#ffffff', 0.28))
    p.rett(x - w, gy + L / n * 0.78, w * 2, L / n * 0.22, mescola(col, '#000000', 0.4))
  }
  // le due spalle laterali, in ombra
  p.velo(0.45, () => {
    c.fillStyle = '#000000'
    c.beginPath(); c.moveTo(x - h, y - h); c.lineTo(x - h * 0.68, y + h); c.lineTo(x - h, y + h)
    c.closePath(); c.fill()
    c.beginPath(); c.moveTo(x + h, y - h); c.lineTo(x + h * 0.68, y + h); c.lineTo(x + h, y + h)
    c.closePath(); c.fill()
  })
}
