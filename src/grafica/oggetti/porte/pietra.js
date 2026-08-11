/* ── LA PORTA DI PIETRA ──
   Una lastra che **scorre di lato** dentro il muro. Non ha cardini,
   non ha maniglia e non si apre spingendo: si apre perché qualcosa
   l'ha fatta aprire — una leva, una piastra, una parola. Per questo
   ha la runa incisa in mezzo, e la runa **si accende** quando la porta
   sta per cedere: è l'unico modo di dire «questa non si apre con le
   mani» senza scriverlo.

   `apertura` da 0 (chiusa) a 1 (rientrata nel muro a sinistra). */
import { mescola } from '../../comune.js'
import { LATO, PIETRA, SIGILLI } from '../attrezzi.js'

export function pietraPorta(p, cosa, S = p.S) {
  const { x, y, apertura = 0, lato = LATO, runa = '#7fe0ff', sigillo } = cosa
  const L = lato * S, h = L / 2
  const a = Math.max(0, Math.min(1, apertura))
  const t = p.tempo || 0
  const c = p.ctx
  // la runa è il sigillo di questa porta: se ne ha uno dichiarato si
  // tinge di quello, la stessa tinta della chiave che la fa cedere —
  // non un lucchetto appoggiato sopra, è incisa nella pietra stessa
  const tintaRuna = (sigillo && SIGILLI[sigillo]) || runa

  // la guida: due binari di pietra sopra e sotto
  p.rett(x - h, y - h * 0.92, L, L * 0.92, mescola(PIETRA.scura, '#000000', 0.35))
  for (const v of [-1, 1])
    p.rett(x - h, y + v * h * 0.78 - L * 0.05, L, L * 0.1, PIETRA.scura)

  // il vuoto che si scopre man mano
  if (a > 0.03) {
    const vg = c.createRadialGradient(x + h * 0.4, y, h * 0.05, x + h * 0.4, y, h * 0.9)
    vg.addColorStop(0, '#08090d'); vg.addColorStop(0.7, '#08090dee'); vg.addColorStop(1, '#08090d00')
    c.fillStyle = vg
    c.beginPath(); c.ellipse(x + h * 0.3, y, h * 0.86, h * 0.66, 0, 0, 6.29); c.fill()
  }

  /* la lastra: parte larga quanto la cella e sparisce dentro il muro a
     sinistra. Resta sempre un dito in vista, se no la porta «non c'è
     più» e nessuno capisce che è una porta. */
  const largh = L * (1 - a * 0.86)
  const x0 = x - h
  c.save()
  c.beginPath(); c.rect(x0, y - h * 0.86, Math.max(L * 0.12, largh), L * 0.86 * 2); c.clip()
  p.rett(x0, y - h * 0.86, L, L * 1.72, PIETRA.media)
  p.rett(x0, y - h * 0.86, L, L * 0.12, mescola(PIETRA.chiara, '#ffffff', 0.2))
  p.rett(x0, y + h * 0.7, L, L * 0.16, mescola(PIETRA.scura, '#000000', 0.2))
  // i tre solchi verticali: danno spessore alla lastra
  for (const dx of [0.26, 0.5, 0.74])
    p.rett(x0 + L * dx, y - h * 0.86, L * 0.02, L * 1.72, mescola(PIETRA.scura, '#000000', 0.25))
  // la runa: un occhio dentro un rombo, e pulsa
  const puls = 0.55 + 0.45 * Math.sin(t * 2.4)
  const cx = x0 + L * 0.5
  p.velo(0.25 + 0.35 * puls, () => p.ellisse(cx, y, L * 0.3, L * 0.3, tintaRuna))
  c.strokeStyle = tintaRuna; c.lineWidth = Math.max(1, L * 0.035); c.lineJoin = 'round'
  c.beginPath()
  c.moveTo(cx, y - L * 0.18); c.lineTo(cx + L * 0.13, y)
  c.lineTo(cx, y + L * 0.18); c.lineTo(cx - L * 0.13, y)
  c.closePath(); c.stroke()
  c.beginPath(); c.arc(cx, y, L * 0.05, 0, 6.29)
  c.fillStyle = mescola(tintaRuna, '#ffffff', 0.4); c.fill()
  c.restore()

  // il bordo della lastra dove entra nel muro: una riga netta
  c.strokeStyle = mescola(PIETRA.scura, '#000000', 0.5)
  c.lineWidth = Math.max(1, L * 0.04)
  c.beginPath()
  c.moveTo(x0 + Math.max(L * 0.12, largh), y - h * 0.86)
  c.lineTo(x0 + Math.max(L * 0.12, largh), y + h * 0.86)
  c.stroke()
}
