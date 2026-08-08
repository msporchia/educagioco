/* ── LA FONTANA ──
   Vasca tonda, colonnina in mezzo, e l'acqua che ricade in tre fili.
   È il contrario del pozzo: il pozzo è un buco scuro dove l'acqua sta
   ferma in fondo, la fontana è una vasca chiara dove l'acqua si
   muove — e per questo è la cosa più «viva» che si può mettere in una
   sala nobile. */
import { mescola, tondo } from '../comune.js'
import { PIETRA, ombra } from './attrezzi.js'

export function fontana(p, cosa, S = p.S) {
  const { x, y } = cosa
  const s = S, t = p.tempo || 0
  const acqua = '#4a9ec0', chiaro = '#bfe8ef'
  ombra(p, x, y, 8 * s, 2.8 * s)
  // la vasca: il bordo, il fianco, l'acqua dentro
  p.in(x, y - 1 * s, q => {
    q.rett(-7 * s, -3 * s, 14 * s, 3 * s, PIETRA.scura)
    tondo(q, 0, 0, 7 * s, 2.4 * s, PIETRA.scura)
    tondo(q, 0, -3 * s, 7 * s, 2.6 * s, PIETRA.media, PIETRA.bordo, 0.8 * s)
    tondo(q, 0, -3 * s, 5.6 * s, 2 * s, acqua)
    // i cerchi dell'acqua: due, che si allargano e svaniscono
    for (let i = 0; i < 2; i++) {
      const u = (t * 0.5 + i * 0.5) % 1
      q.velo((1 - u) * 0.6, () => {
        q.ctx.strokeStyle = chiaro; q.ctx.lineWidth = 0.5 * s
        q.ctx.beginPath()
        q.ctx.ellipse(0, -3 * s, 1.4 * s + u * 4 * s, 0.5 * s + u * 1.4 * s, 0, 0, 6.29)
        q.ctx.stroke()
      })
    }
  })
  // la colonnina e la coppa in cima
  p.rett(x - 1.4 * s, y - 12 * s, 2.8 * s, 8 * s, PIETRA.media)
  p.rett(x - 1.4 * s, y - 12 * s, 1 * s, 8 * s, PIETRA.chiara)
  tondo(p, x, y - 12.6 * s, 4 * s, 1.5 * s, PIETRA.chiara, PIETRA.bordo, 0.7 * s)
  tondo(p, x, y - 12.8 * s, 3 * s, 1 * s, acqua)
  // i tre fili d'acqua che ricadono nella vasca
  for (const dx of [-3, 0, 3]) {
    const w = 0.5 + 0.2 * Math.sin(t * 6 + dx)
    p.velo(0.75, () => {
      p.ctx.strokeStyle = chiaro; p.ctx.lineWidth = w * s; p.ctx.lineCap = 'round'
      p.ctx.beginPath()
      p.ctx.moveTo(x + dx * 1.1 * s, y - 12.4 * s)
      p.ctx.quadraticCurveTo(x + dx * 1.5 * s, y - 8 * s, x + dx * 1.6 * s, y - 4.4 * s)
      p.ctx.stroke()
    })
  }
}
