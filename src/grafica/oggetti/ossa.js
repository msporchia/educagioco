/* ── LE OSSA ──
   Un teschio e due ossa, per terra. Le stesse regole dello scheletro
   che cammina: **buffo, non macabro** — il teschio ha le occhiaie
   tonde e grandi, non due fessure, e sorride appena. In una cripta
   dice «qui è successo qualcosa» senza spaventare nessuno. */
import { mescola, capsula, tondo } from '../comune.js'
import { ombra } from './attrezzi.js'

export function ossa(p, cosa, S = p.S) {
  const { x, y } = cosa
  const s = S
  const osso = '#e2dccb', bordo = '#8a8272', buco = '#3a3229'
  ombra(p, x, y, 5.4 * s, 1.6 * s)
  // le due ossa lunghe, incrociate dietro
  for (const [dx, dy, a] of [[-1.4, -0.6, 0.45], [0.8, -0.2, -0.35]]) {
    p.in(x + dx * s, y + dy * s, q => {
      capsula(q, 0, 0, 3.4 * s, 0.7 * s, 0.6 * s, mescola(osso, '#000000', 0.08), bordo, 0.5 * s)
      for (const v of [-1, 1]) {
        tondo(q, v * 3.4 * s, -0.7 * s, 0.9 * s, 0.9 * s, osso, bordo, 0.5 * s)
        tondo(q, v * 3.4 * s, 0.7 * s, 0.9 * s, 0.9 * s, osso, bordo, 0.5 * s)
      }
    }, a)
  }
  // il teschio, davanti e un po' storto
  p.in(x + 1.4 * s, y - 1.6 * s, q => {
    tondo(q, 0, 0, 3.2 * s, 2.9 * s, osso, bordo, 0.6 * s)
    q.rett(-1.7 * s, 2.2 * s, 3.4 * s, 1.4 * s, osso)
    q.ctx.strokeStyle = bordo; q.ctx.lineWidth = 0.5 * s
    q.ctx.strokeRect(-1.7 * s, 2.2 * s, 3.4 * s, 1.4 * s)
    // le occhiaie tonde e grandi: sono loro a togliere il macabro
    for (const v of [-1, 1]) tondo(q, v * 1.3 * s, -0.3 * s, 1.1 * s, 1.2 * s, buco)
    tondo(q, 0, 1.4 * s, 0.5 * s, 0.6 * s, buco)
    // i dentini
    for (const dx of [-1, 0, 1]) q.rett(dx * s - 0.15 * s, 2.4 * s, 0.3 * s, 1 * s, bordo)
  }, 0.25)
}
