/* ═════ LA SERPE ═════
   Tutta collo: le spire per terra e la testa alzata a mezz'aria, che è
   la posa di chi sta per scattare. Una serpe disegnata distesa è una
   corda; è l'alzata che la rende una minaccia.

   La lingua esce a intervalli e non di continuo — una lingua sempre
   fuori è un pupazzo che fa la linguaccia. */
import { mescola, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const SERPE = {
  quadrupede: true, taglia: 1,
  col: {
    pelle: '#4f9a52', pelleS: '#33703c', pancia: '#cfd88a',
    macchia: '#25502c', lingua: '#e0526b', bordo: '#15301c',
  },
  disegna(q, s, C, dir, sw, stato) {
    const t = q.tempo || 0
    const b = C.bordo, sp = 0.75 * s
    const onda = Math.sin(t * 1.5) * 0.9 * s
    // le spire per terra: due ellissi sovrapposte, la seconda più stretta
    tondo(q, 0, 1.4 * s, 6.4 * s, 2.4 * s, C.pelleS, b, sp)
    tondo(q, 0.6 * s, 0.2 * s, 4.6 * s, 1.9 * s, C.pelle, b, sp)
    // il collo che sale: una fascia che si assottiglia, curvata dall'onda
    q.ctx.strokeStyle = C.pelle; q.ctx.lineWidth = 3.4 * s; q.ctx.lineCap = 'round'
    q.ctx.beginPath()
    q.ctx.moveTo(0, 0)
    q.ctx.quadraticCurveTo(-2.6 * s + onda, -4.4 * s, -0.4 * s + onda, -8 * s)
    q.ctx.stroke()
    q.ctx.strokeStyle = C.pancia; q.ctx.lineWidth = 1.2 * s
    q.ctx.beginPath()
    q.ctx.moveTo(0.4 * s, 0)
    q.ctx.quadraticCurveTo(-1.8 * s + onda, -4.4 * s, 0.2 * s + onda, -7.6 * s)
    q.ctx.stroke()
    q.in(-0.4 * s + onda, -9.4 * s, r => {
      tondo(r, 0, 0, 3.2 * s, 2.5 * s, C.pelle, b, sp)              // la testa a cuneo
      tondo(r, 0, 1 * s, 2 * s, 1.4 * s, mescola(C.pelle, '#ffffff', 0.14))
      for (const v of [-1, 1])                                       // le macchie sul capo
        tondo(r, v * 1.4 * s, -1.2 * s, 0.9 * s, 0.7 * s, C.macchia)
      occhi(r, s, 1.5, -0.2, 0.62, stato)
      if (stato === 'ko') return
      if (Math.sin(t * 2.4) > 0.4) {                                 // la lingua biforcuta
        r.ctx.strokeStyle = C.lingua; r.ctx.lineWidth = 0.5 * s
        r.ctx.beginPath()
        r.ctx.moveTo(0, 2.2 * s); r.ctx.lineTo(0, 4 * s)
        r.ctx.moveTo(0, 4 * s); r.ctx.lineTo(-0.9 * s, 5 * s)
        r.ctx.moveTo(0, 4 * s); r.ctx.lineTo(0.9 * s, 5 * s)
        r.ctx.stroke()
      }
    })
  },
}
