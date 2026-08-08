/* ── L'ARGANO ──
   Il rullo di legno con la manovella e la corda che scende. `avvolta`
   da 0 a 1 dice quanta corda è già stata tirata su: a 0 la corda
   pende lunga, a 1 è tutta arrotolata. Serve ai ponti levatoi e alle
   saracinesche — e serve che si veda **a che punto è**, se no è solo
   un pezzo d'arredo. */
import { mescola, capsula, tondo } from '../comune.js'
import { LEGNO, ombra } from './attrezzi.js'

export function argano(p, cosa, S = p.S) {
  const { x, y, avvolta = 0.5 } = cosa
  const s = S
  const a = Math.max(0, Math.min(1, avvolta))
  ombra(p, x, y, 6 * s, 2 * s)
  // i due cavalletti
  for (const v of [-1, 1]) {
    p.rett(x + v * 4.4 * s - 0.8 * s, y - 8 * s, 1.6 * s, 8 * s, LEGNO.scuro)
    p.rett(x + v * 4.4 * s - 0.8 * s, y - 8 * s, 0.6 * s, 8 * s, LEGNO.medio)
  }
  // il rullo, con la corda avvolta sopra
  capsula(p, x, y - 8.4 * s, 4.6 * s, 1.6 * s, 0.8 * s, LEGNO.chiaro, LEGNO.bordo, 0.65 * s)
  p.ctx.strokeStyle = '#c9a877'; p.ctx.lineWidth = 0.9 * s
  const giri = Math.round(2 + a * 5)
  for (let i = 0; i < giri; i++) {
    const gx = x - 3.8 * s + i * 1.1 * s
    p.ctx.beginPath(); p.ctx.moveTo(gx, y - 9.8 * s); p.ctx.lineTo(gx, y - 7 * s); p.ctx.stroke()
  }
  // la manovella
  p.in(x + 5.4 * s, y - 8.4 * s, q => {
    q.rett(-0.5 * s, -3.4 * s, 1 * s, 3.6 * s, LEGNO.ferroS)
    q.rett(-0.5 * s, -3.8 * s, 3 * s, 1 * s, LEGNO.ferroS)
    tondo(q, 2.6 * s, -3.3 * s, 0.9 * s, 0.9 * s, LEGNO.medio, LEGNO.bordo, 0.55 * s)
  }, a * 4)
  // la corda che pende: più è avvolta, più è corta
  p.ctx.strokeStyle = '#c9a877'; p.ctx.lineWidth = 0.7 * s
  p.ctx.beginPath()
  p.ctx.moveTo(x - 2 * s, y - 7 * s)
  p.ctx.lineTo(x - 2 * s, y - 1 * s - a * 5 * s)
  p.ctx.stroke()
  tondo(p, x - 2 * s, y - 1 * s - a * 5 * s, 0.8 * s, 0.8 * s,
        mescola('#c9a877', '#000000', 0.2))
}
