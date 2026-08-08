/* ── LA POZIONE ──
   Boccetta panciuta, tappo di sughero, e il liquido che **non arriva
   in cima**: è il vuoto sopra il livello a far sembrare che dentro ci
   sia un liquido e non della vernice. Quattro colori, e ognuno un
   giorno vorrà dire qualcosa. */
import { mescola, capsula, tondo, poligono } from '../comune.js'
import { raccolta } from './attrezzi.js'

const TINTE = {
  rossa: '#e0453f', verde: '#4fe08a', azzurra: '#5ab8ff', viola: '#c07ae0',
}
export const COLORI_POZIONE = Object.keys(TINTE)

export function pozione(p, cosa, S = p.S) {
  const col = TINTE[cosa.colore] || TINTE.rossa
  const vetro = '#cfe4ea', bordo = '#3e4a52'
  raccolta(p, cosa, S, 1, (q, s) => {
    // il collo e il tappo
    q.rett(-0.9 * s, -5.4 * s, 1.8 * s, 2.4 * s, vetro)
    capsula(q, 0, -5.8 * s, 1.2 * s, 0.9 * s, 0.4 * s, '#b98a52', bordo, 0.5 * s)
    // la pancia
    tondo(q, 0, -0.6 * s, 3 * s, 3 * s, vetro, bordo, 0.6 * s)
    // il liquido: solo i due terzi in basso
    q.ctx.save()
    q.ctx.beginPath(); q.ctx.ellipse(0, -0.6 * s, 2.6 * s, 2.6 * s, 0, 0, 6.29); q.ctx.clip()
    q.rett(-3 * s, -0.4 * s, 6 * s, 4 * s, col)
    q.rett(-3 * s, -0.4 * s, 6 * s, 0.5 * s, mescola(col, '#ffffff', 0.4))
    q.ctx.restore()
    // il lume sul vetro: una virgola bianca, e la boccetta diventa vetro
    poligono(q, [[-1.8 * s, -1.8 * s], [-0.9 * s, -2.2 * s], [-1.4 * s, -0.2 * s],
                 [-2 * s, -0.6 * s]], '#ffffffaa')
  })
}
