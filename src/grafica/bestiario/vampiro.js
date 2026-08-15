/* ═════ IL VAMPIRO ═════
   Il capo di piano elegante: il mantello alzato dietro le spalle è
   tutta la sagoma, e si riconosce a occhi chiusi. Dentro il gioco fa
   la parte del nemico che sta un gradino sopra i mostri normali senza
   essere ancora il padrone di casa — quindi curato, non enorme.

   Colletto alto, pallore, due zanne piccole. Niente sangue: le zanne
   bastano, e si vedono solo quando è vivo. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const VAMPIRO = {
  spalle: 5.4, taglia: 1.04, arti: 0.85,
  col: {
    pelle: '#e6dcd4', pelleS: '#c4b6ae',
    manica: '#2a2438', manicaS: '#1e1a2a',
    gambe: '#241f33', gambeS: '#1a1626',
    scarpe: '#15121f', scarpeS: '#0f0d17',
    mantello: '#7d1f2e', mantelloS: '#5a1420',
    colletto: '#2a2438', zanne: '#f7f4ea', bordo: '#120e1e',
  },
  dietro(q, s, C) {
    const t = q.tempo || 0
    const b = C.bordo
    // il mantello aperto dietro: due ali di stoffa che respirano. È
    // disegnato *prima* del corpo, così il vampiro ci sta davanti
    const apre = 1 + Math.sin(t * 1.2) * 0.12
    for (const v of [-1, 1]) {
      q.ctx.fillStyle = v < 0 ? C.mantello : C.mantelloS
      q.ctx.beginPath()
      q.ctx.moveTo(v * 2 * s, -13.4 * s)
      q.ctx.quadraticCurveTo(v * 12 * s * apre, -11 * s, v * 10.4 * s * apre, -0.6 * s)
      q.ctx.quadraticCurveTo(v * 6 * s, -3.4 * s, v * 1.6 * s, -4.6 * s)
      q.ctx.closePath(); q.ctx.fill()
      q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.55 * s; q.ctx.stroke()
    }
  },
  tronco(q, s, C) {
    const b = C.bordo, sp = 0.8 * s
    capsula(q, 0, -9.4 * s, 4.6 * s, 4.6 * s, 1.6 * s, C.manica, b, sp)
    // il panciotto chiaro e il fiocco: è il dettaglio che dice
    // «elegante» e lo separa dagli stracci dello zombi
    poligono(q, [[-2 * s, -13.4 * s], [2 * s, -13.4 * s], [0, -6.4 * s]], '#e6dcd4', b, sp * 0.7)
    for (const v of [-1, 1])
      poligono(q, [[0, -12.4 * s], [v * 2 * s, -13.4 * s], [v * 2 * s, -11.4 * s]], C.mantello)
    q.rett(-2.6 * s, -6.6 * s, 5.2 * s, 1.4 * s, '#15121f')
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.8 * s, R = 4 * s
    // il colletto alto dietro la nuca, che incornicia la testa
    for (const v of [-1, 1])
      poligono(q, [[v * 1.4 * s, 3 * s], [v * 5.4 * s, -3.6 * s], [v * 1.6 * s, -1 * s]],
               C.mantello, b, sp * 0.8)
    tondo(q, 0, 0, R * 0.88, R, C.pelle, b, sp)
    // i capelli neri con la punta in mezzo alla fronte: la seconda cosa
    // che si riconosce dopo il mantello
    q.ctx.fillStyle = '#1a1626'
    q.ctx.beginPath()
    q.ctx.moveTo(-R * 0.9, -1.2 * s)
    q.ctx.quadraticCurveTo(0, -R * 1.45, R * 0.9, -1.2 * s)
    q.ctx.lineTo(R * 0.6, -2 * s); q.ctx.lineTo(0, -0.4 * s); q.ctx.lineTo(-R * 0.6, -2 * s)
    q.ctx.closePath(); q.ctx.fill()
    if (stato === 'ko') { occhi(q, s, 1.6, 0.4, 0.7, stato); return }
    for (const v of [-1, 1]) {                     // occhi rossi, piccoli
      q.cerchio(v * 1.6 * s, 0.4 * s, 0.85 * s, '#f2e4e4')
      q.cerchio(v * 1.6 * s, 0.5 * s, 0.42 * s, '#b52d3a')
    }
    q.ctx.strokeStyle = '#1a1626'; q.ctx.lineWidth = 0.6 * s; q.ctx.lineCap = 'round'
    q.ctx.beginPath()                               // le sopracciglia all'insù
    q.ctx.moveTo(-2.8 * s, -1.4 * s); q.ctx.lineTo(-0.8 * s, -0.6 * s)
    q.ctx.moveTo(2.8 * s, -1.4 * s); q.ctx.lineTo(0.8 * s, -0.6 * s)
    q.ctx.stroke()
    // il ghigno e le due zanne
    q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.6 * s
    q.ctx.beginPath(); q.ctx.moveTo(-1.6 * s, 2.2 * s); q.ctx.quadraticCurveTo(0, 3.2 * s, 1.6 * s, 2.2 * s)
    q.ctx.stroke()
    for (const v of [-1, 1])
      poligono(q, [[v * 0.7 * s, 2.4 * s], [v * 1.4 * s, 2.4 * s], [v * 1.05 * s, 3.8 * s]], C.zanne)
  },
}
