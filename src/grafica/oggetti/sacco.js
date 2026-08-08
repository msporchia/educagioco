/* ── IL SACCO ──
   Panciuto in basso, strozzato in cima dalla corda, e una toppa: sono
   le tre cose che lo fanno leggere come stoffa e non come pietra. */
import { capsula, poligono } from '../comune.js'
import { LEGNO, ombra } from './attrezzi.js'

export function sacco(p, cosa, S = p.S) {
  const { x, y } = cosa
  const s = S
  const tela = cosa.colore || '#c9a877', telaS = '#a4854f', corda = '#6a4222'
  ombra(p, x, y, 4.6 * s, 1.8 * s)
  p.in(x, y - 0.4 * s, q => {
    const c = q.ctx
    c.beginPath()
    c.moveTo(-4.4 * s, 0)
    c.quadraticCurveTo(-5.2 * s, -4.4 * s, -1.6 * s, -6.2 * s)
    c.lineTo(1.6 * s, -6.2 * s)
    c.quadraticCurveTo(5.2 * s, -4.4 * s, 4.4 * s, 0)
    c.closePath()
    c.fillStyle = tela; c.fill()
    c.strokeStyle = LEGNO.bordo; c.lineWidth = 0.75 * s; c.lineJoin = 'round'; c.stroke()
    // l'ombra dentro la piega e la toppa
    c.save(); c.clip()
    q.ellisse(3 * s, -1 * s, 3 * s, 5 * s, telaS)
    q.rett(-3 * s, -3.4 * s, 2.4 * s, 2.2 * s, telaS)
    c.restore()
    // la strozzatura e il collo che si apre a ventaglio
    capsula(q, 0, -6.4 * s, 1.9 * s, 0.7 * s, 0.6 * s, corda, LEGNO.bordo, 0.6 * s)
    poligono(q, [[-1.7 * s, -6.8 * s], [1.7 * s, -6.8 * s], [2.6 * s, -9 * s], [-2.6 * s, -9 * s]],
             tela, LEGNO.bordo, 0.7 * s)
    poligono(q, [[0, -6.8 * s], [1.7 * s, -6.8 * s], [2.6 * s, -9 * s], [0.4 * s, -9 * s]], telaS)
  })
}
