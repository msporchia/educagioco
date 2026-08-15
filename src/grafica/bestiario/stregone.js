/* ═════ LO STREGONE ═════
   Il mago del Generale è un eroe: cappello a punta azzurro e barba
   bianca. Questo è il suo contrario e va letto come tale — cappuccio
   calato al posto del cappello, faccia in ombra, viola scuro invece
   che blu. Stessa stazza, lettura opposta.

   Il bastone con la pietra che pulsa dice che picchia da lontano, ed è
   il modo di raccontare un mago senza fargli tirare niente: qui non ci
   sono proiettili, ci sono domande. */
import { mescola, capsula, poligono, tondo } from '../comune.js'

export const STREGONE = {
  spalle: 5, taglia: 1.06, arti: 0.8,
  col: {
    pelle: '#6d5b8a', pelleS: '#54446d',
    manica: '#3f2a5e', manicaS: '#2e1e46',
    gambe: '#33224d', gambeS: '#241738',
    scarpe: '#1d1329', scarpeS: '#150e1f',
    saio: '#4a2f6e', orlo: '#c9a227', gemma: '#7ce8c4', bordo: '#160e24',
  },
  tronco(q, s, C) {
    const b = C.bordo, sp = 0.8 * s
    const t = q.tempo || 0
    // il saio: largo in fondo, che si allarga con un'onda lenta —
    // una veste ferma è un cono di cartone
    const onda = Math.sin(t * 1.1) * 0.5 * s
    q.ctx.fillStyle = C.saio
    q.ctx.beginPath()
    q.ctx.moveTo(-4.6 * s, -13.4 * s); q.ctx.lineTo(4.6 * s, -13.4 * s)
    q.ctx.quadraticCurveTo(6.4 * s + onda, -6 * s, 7 * s + onda, -0.4 * s)
    q.ctx.quadraticCurveTo(0, 1.4 * s, -7 * s - onda, -0.4 * s)
    q.ctx.quadraticCurveTo(-6.4 * s - onda, -6 * s, -4.6 * s, -13.4 * s)
    q.ctx.closePath(); q.ctx.fill()
    q.ctx.strokeStyle = b; q.ctx.lineWidth = sp; q.ctx.stroke()
    // l'orlo dorato e la cintura di corda
    q.ctx.strokeStyle = C.orlo; q.ctx.lineWidth = 0.7 * s
    q.ctx.beginPath()
    q.ctx.moveTo(-6.6 * s - onda, -0.9 * s)
    q.ctx.quadraticCurveTo(0, 0.6 * s, 6.6 * s + onda, -0.9 * s)
    q.ctx.stroke()
    q.rett(-4 * s, -7.4 * s, 8 * s, 1.2 * s, '#8a6a3e')
    for (const [dx, dy] of [[-2.6, -11.4], [2.4, -10.4], [0.4, -12.6]])   // le rune sul petto
      tondo(q, dx * s, dy * s, 0.55 * s, 0.55 * s, C.orlo)
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.8 * s, R = 4 * s
    // il cappuccio: una goccia con la punta all'indietro. Dentro non si
    // vede la faccia, solo due luci — ed è quello a farne un nemico
    q.ctx.fillStyle = C.saio
    q.ctx.beginPath()
    q.ctx.moveTo(-R * 1.05, 3 * s)
    q.ctx.quadraticCurveTo(-R * 1.2, -R * 1.1, 0, -R * 1.35)
    q.ctx.quadraticCurveTo(R * 1.2, -R * 1.1, R * 1.05, 3 * s)
    q.ctx.quadraticCurveTo(0, 4.4 * s, -R * 1.05, 3 * s)
    q.ctx.closePath(); q.ctx.fill()
    q.ctx.strokeStyle = b; q.ctx.lineWidth = sp; q.ctx.stroke()
    // l'ombra dentro il cappuccio
    q.ctx.fillStyle = '#120b1c'
    q.ctx.beginPath(); q.ctx.ellipse(0, 0.6 * s, R * 0.72, R * 0.82, 0, 0, 6.29); q.ctx.fill()
    if (stato === 'ko') return
    const pulsa = 0.75 + Math.sin((q.tempo || 0) * 2.6) * 0.25
    for (const v of [-1, 1]) {
      q.velo(0.5, () => q.cerchio(v * 1.4 * s, 0.4 * s, 1.2 * s * pulsa, C.gemma))
      q.cerchio(v * 1.4 * s, 0.4 * s, 0.5 * s * pulsa, '#ffffff')
    }
  },
  arma(q, s, C, dir, sw, mani) {
    const b = C.bordo
    const pulsa = 0.8 + Math.sin((q.tempo || 0) * 2.2) * 0.2
    q.in(mani.dx.x + 0.6 * s, mani.dx.y, r => {
      capsula(r, 0, -4 * s, 0.55 * s, 8.4 * s, 0.5 * s, '#5c3f22', b, 0.6 * s)
      // la pietra in cima, con l'alone che pulsa
      r.velo(0.4, () => r.cerchio(0, -12.4 * s, 2.8 * s * pulsa, C.gemma))
      tondo(r, 0, -12.4 * s, 1.4 * s, 1.5 * s, C.gemma, b, 0.6 * s)
      tondo(r, -0.4 * s, -12.9 * s, 0.5 * s, 0.55 * s, '#ffffff')
    }, 0.12)
  },
}
