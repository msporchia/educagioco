/* ── L'ARCO CON LA TENDA ──
   Il passaggio che **non ha battenti**: due stipiti e un telo pesante
   appeso. Chiuso, il telo cade a pieghe e nasconde quello che c'è di
   là; aperto, è legato ai due lati con le sue corde.

   Serve dove una porta di legno sarebbe troppo: l'ingresso di una
   tenda, una stanza da letto, il fondo di un mercato. E in una
   campagna dice una cosa diversa da un portone — di qui **si può
   passare**, basta scostarlo.

   `apertura` da 0 (telo disteso) a 1 (telo raccolto ai lati). */
import { mescola } from '../../comune.js'
import { LATO, PIETRA } from '../attrezzi.js'

export function arco(p, cosa, S = p.S) {
  const { x, y, apertura = 0, lato = LATO, colore = '#8a3a4a' } = cosa
  const L = lato * S, h = L / 2
  const a = Math.max(0, Math.min(1, apertura))
  const scuro = mescola(colore, '#000000', 0.35), chiaro = mescola(colore, '#ffffff', 0.16)
  const c = p.ctx

  // la soglia e i due stipiti: la stessa pietra del portone, così i
  // varchi di una stanza si somigliano fra loro anche se sono diversi
  p.velo(0.4, () => p.ellisse(x, y + L * 0.05, h * 1.02, h * 0.7, '#000000'))
  p.rett(x - h, y - h * 0.9, L, L * 0.9, PIETRA.scura)
  p.rett(x - h, y - h * 0.9, L, L * 0.16, mescola(PIETRA.media, '#ffffff', 0.2))
  for (const v of [-1, 1]) {
    p.rett(x + v * h * 0.86 - L * 0.07, y - h * 0.9, L * 0.14, L * 0.9, PIETRA.media)
    p.rett(x + v * h * 0.86 - L * 0.07, y - h * 0.9, L * 0.05, L * 0.9, PIETRA.chiara)
  }
  // il vuoto dietro al telo
  const vg = c.createRadialGradient(x, y, h * 0.06, x, y, h * 0.9)
  vg.addColorStop(0, '#0d0b12'); vg.addColorStop(0.7, '#0d0b12ee'); vg.addColorStop(1, '#0d0b1200')
  c.fillStyle = vg
  c.beginPath(); c.ellipse(x, y, h * 0.86, h * 0.66, 0, 0, 6.29); c.fill()

  // il bastone in cima, sempre visibile
  p.rett(x - h * 0.94, y - h * 0.82, L * 0.94, L * 0.09, '#6a4222')

  /* il telo: cinque teli verticali che si stringono verso i lati
     mentre si apre. Le pieghe sono l'unica cosa che lo fa stoffa —
     un rettangolo pieno sarebbe una porta dipinta di rosso. */
  const n = 5
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n - 0.5                 // da −0.4 a 0.4
    const versoBordo = f < 0 ? -1 : 1
    // aperto, ogni telo scivola verso il suo lato e si accorcia
    const cx = x + (f + versoBordo * a * 0.42) * L * 0.9
    const w = L * (0.11 - a * 0.04)
    const alt = L * (0.82 - a * 0.3)
    const col = i % 2 ? colore : chiaro
    c.beginPath()
    c.moveTo(cx - w, y - h * 0.78)
    c.lineTo(cx + w, y - h * 0.78)
    c.lineTo(cx + w * 1.2, y - h * 0.78 + alt)
    c.quadraticCurveTo(cx, y - h * 0.78 + alt + L * 0.05, cx - w * 1.2, y - h * 0.78 + alt)
    c.closePath()
    c.fillStyle = col; c.fill()
    c.strokeStyle = mescola(scuro, '#000000', 0.3); c.lineWidth = Math.max(1, L * 0.018)
    c.stroke()
    // la piega scura sul fianco destro di ogni telo
    p.velo(0.5, () => p.rett(cx + w * 0.3, y - h * 0.78, w * 0.7, alt, scuro))
  }
  // le due corde che tengono i teli quando è aperto
  if (a > 0.3) for (const v of [-1, 1]) {
    c.strokeStyle = '#e8c569'; c.lineWidth = Math.max(1, L * 0.03)
    c.beginPath()
    c.arc(x + v * h * 0.62, y - h * 0.2, L * 0.07, 0, 6.29)
    c.stroke()
  }
}
