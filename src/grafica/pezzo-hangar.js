// Un pezzo dell'hangar da solo: un colore, un disegno sulla nave, uno stemma.
// Riceve l'aspetto già deciso (motore/asteroidi/hangar.js `aspettoDi`).
import { disegnaNave } from './spazio.js'
import { disegnaStemma, disegnaPacco } from './livrea.js'

const TAU = Math.PI * 2

export function disegnaPezzo(ctx, a, x, y, s, t = 0) {
  if (!a) return
  if (a.tipo === 't') {
    ctx.beginPath(); ctx.arc(x, y, s * 0.42, 0, TAU)
    ctx.fillStyle = a.colore; ctx.fill()
    if (a.lucida) {               // il riflesso del metallo, che passa piano
      ctx.save(); ctx.clip()
      const q = ((t * 0.4) % 1.6) - 0.3
      const g = ctx.createLinearGradient(x - s * 0.5, y - s * 0.5, x + s * 0.5, y + s * 0.5)
      const in01 = v => Math.max(0, Math.min(1, v))     // addColorStop fuori da 0..1 lancia
      g.addColorStop(in01(q - 0.15), '#ffffff00'); g.addColorStop(in01(q), '#ffffffaa')
      g.addColorStop(in01(q + 0.15), '#ffffff00')
      ctx.fillStyle = g; ctx.fillRect(x - s, y - s, 2 * s, 2 * s)
      ctx.restore()
    }
    ctx.lineWidth = Math.max(1.5, s * 0.04); ctx.strokeStyle = '#00000088'; ctx.stroke()
  } else if (a.tipo === 'd') {
    disegnaNave(ctx, { x, y: y + s * 0.02, r: s * 0.36, lv: 3, t, mira: -Math.PI / 2, livrea: a.livrea })
  } else if (a.tipo === 's') {
    disegnaStemma(ctx, a.id, x, y, s * 0.34, a.colore)
  }
}

// il pacco aperto col pezzo che ne esce: per «hai ottenuto»
export function disegnaRegalo(ctx, a, W, H, t) {
  const s = Math.min(W, H)
  disegnaPacco(ctx, W / 2, H * 0.78, s * 0.2, true, t)
  const su = Math.min(1, t * 1.5)
  disegnaPezzo(ctx, a, W / 2, H * 0.78 - s * 0.38 * su, s * 0.5 * (0.5 + su * 0.5), t)
}
