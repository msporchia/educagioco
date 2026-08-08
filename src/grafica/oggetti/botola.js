/* ── LA BOTOLA ──
   Piatta, nel pavimento. `apertura` da 0 a 1: le due ante si sollevano
   e sotto compare il buco, che è lo stesso vuoto sfumato del portone —
   in un gioco visto dall'alto «il buio in mezzo» è l'unico modo di
   dire «qui si scende». */
import { mescola } from '../comune.js'
import { LATO, LEGNO } from './attrezzi.js'

export function botola(p, cosa, S = p.S) {
  const { x, y, apertura = 0, lato = LATO } = cosa
  const L = lato * S, h = L / 2
  const a = Math.max(0, Math.min(1, apertura))
  const c = p.ctx
  // il telaio di pietra incassato
  p.rett(x - h * 0.92, y - h * 0.86, L * 0.92, L * 0.86, '#5c5343')
  p.rett(x - h * 0.92, y - h * 0.86, L * 0.92, L * 0.12, '#7a705c')
  if (a > 0.02) {
    const vg = c.createRadialGradient(x, y, h * 0.05, x, y, h * 0.82)
    vg.addColorStop(0, '#080a0d'); vg.addColorStop(0.65, '#080a0dee'); vg.addColorStop(1, '#080a0d00')
    c.fillStyle = vg
    c.beginPath(); c.ellipse(x, y, h * 0.82, h * 0.7, 0, 0, 6.29); c.fill()
    // i pioli della scaletta che scende: due trattini bastano
    p.velo(0.5, () => {
      for (const dy of [0.1, 0.34])
        p.rett(x - h * 0.3, y + h * dy, h * 0.6, L * 0.045, '#8a6136')
    })
  }
  // le due ante: si aprono verso l'alto e verso il basso, in scorcio
  for (const v of [-1, 1]) {
    const alt = h * 0.78 * (1 - a * 0.82)
    const y0 = y + v * h * 0.78 - (v > 0 ? alt : 0)
    p.rett(x - h * 0.86, y0, L * 0.86, alt, v < 0 ? LEGNO.medio : LEGNO.chiaro)
    p.rett(x - h * 0.86, y0, L * 0.86, Math.min(alt, L * 0.06),
           mescola(LEGNO.chiaro, '#ffffff', 0.24))
    for (let i = 1; i < 3; i++)
      p.rett(x - h * 0.86 + i * L * 0.28, y0, L * 0.02, alt, LEGNO.scuro)
    c.strokeStyle = LEGNO.bordo; c.lineWidth = Math.max(1, L * 0.03)
    c.strokeRect(x - h * 0.86, y0, L * 0.86, alt)
    // l'anello per tirarla
    if (alt > L * 0.12) {
      c.strokeStyle = LEGNO.ferro; c.lineWidth = Math.max(1, L * 0.035)
      c.beginPath(); c.arc(x, y0 + (v < 0 ? alt * 0.55 : alt * 0.45), L * 0.07, 0, 6.29); c.stroke()
    }
  }
}
