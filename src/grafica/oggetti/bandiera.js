/* ── LA BANDIERA ──
   Un'asta e un drappo che sventola: l'onda è una funzione del tempo,
   quindi non c'è nessuno stato da tenere. Serve a marcare un posto —
   «di qui si comincia», «questa torre è nostra» — e il colore lo dice
   il livello, perché due bandiere di colore diverso vogliono dire due
   squadre diverse senza spiegazioni. */
import { mescola, tondo } from '../comune.js'
import { LEGNO, ombra } from './attrezzi.js'

export function bandiera(p, cosa, S = p.S) {
  const { x, y, colore = '#c0392f' } = cosa
  const s = S, t = p.tempo || 0
  const scuro = mescola(colore, '#000000', 0.3)
  ombra(p, x, y, 3 * s, 1.3 * s)
  p.rett(x - 0.7 * s, y - 22 * s, 1.4 * s, 22 * s, LEGNO.scuro)
  p.rett(x - 0.7 * s, y - 22 * s, 0.5 * s, 22 * s, LEGNO.medio)
  tondo(p, x, y - 22.6 * s, 1.1 * s, 1.1 * s, LEGNO.oro, LEGNO.oroS, 0.6 * s)
  // il drappo: due onde sfasate, una per il bordo di sopra e una per
  // quello di sotto — è lo sfasamento a farlo sembrare stoffa
  const c = p.ctx
  const onda = (dy, f) => Math.sin(t * 2.4 + dy * 0.5 + f) * 1.2 * s
  c.beginPath()
  c.moveTo(x + 0.6 * s, y - 21.4 * s)
  c.quadraticCurveTo(x + 5 * s + onda(0, 0), y - 20.4 * s, x + 9.4 * s + onda(0, 1.4), y - 21 * s)
  c.lineTo(x + 9.4 * s + onda(0, 1.4), y - 14.4 * s)
  c.quadraticCurveTo(x + 5 * s + onda(2, 0.6), y - 13.4 * s, x + 0.6 * s, y - 14.6 * s)
  c.closePath()
  c.fillStyle = colore; c.fill()
  c.strokeStyle = mescola(scuro, '#000000', 0.3); c.lineWidth = 0.6 * s
  c.lineJoin = 'round'; c.stroke()
  // la piega scura al centro: dà volume senza disegnare niente
  c.beginPath()
  c.moveTo(x + 4.4 * s + onda(0, 0.3), y - 20.6 * s)
  c.lineTo(x + 4.4 * s + onda(2, 0.9), y - 13.8 * s)
  c.lineTo(x + 6.4 * s + onda(2, 1.1), y - 13.6 * s)
  c.lineTo(x + 6.4 * s + onda(0, 0.5), y - 20.8 * s)
  c.closePath()
  c.fillStyle = scuro; c.fill()
}
