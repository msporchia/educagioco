/* ── IL SECCHIO ──
   Due stati che servono tutti e due: `pieno` mostra l'acqua e il suo
   riflesso, vuoto mostra il fondo. È il primo oggetto del catalogo che
   **cambia da dentro** senza cambiare forma, e un giorno vorrà dire
   qualcosa (portare l'acqua, spegnere un fuoco). */
import { mescola, tondo, poligono } from '../comune.js'
import { LEGNO, raccolta } from './attrezzi.js'

export function secchio(p, cosa, S = p.S) {
  const pieno = cosa.pieno !== false
  raccolta(p, cosa, S, 1, (q, s) => {
    // il tronco di cono
    poligono(q, [[-2.8 * s, -2.6 * s], [2.8 * s, -2.6 * s], [2.2 * s, 2.6 * s],
                 [-2.2 * s, 2.6 * s]], LEGNO.chiaro, LEGNO.bordo, 0.65 * s)
    q.rett(-2.7 * s, -1.4 * s, 5.4 * s, 0.7 * s, LEGNO.ferro)
    q.rett(-2.4 * s, 1 * s, 4.8 * s, 0.7 * s, LEGNO.ferro)
    // dentro: acqua o fondo
    tondo(q, 0, -2.6 * s, 2.8 * s, 1 * s, pieno ? '#2f6f8a' : mescola(LEGNO.scuro, '#000000', 0.4),
          LEGNO.bordo, 0.6 * s)
    if (pieno) {
      tondo(q, 0, -2.7 * s, 2.4 * s, 0.8 * s, '#4a97ad')
      tondo(q, -0.9 * s, -2.9 * s, 1 * s, 0.3 * s, '#bfe8ef')
    }
    // il manico: un arco di ferro
    q.ctx.strokeStyle = LEGNO.ferroS; q.ctx.lineWidth = 0.5 * s
    q.ctx.beginPath()
    q.ctx.moveTo(-2.7 * s, -2.6 * s)
    q.ctx.quadraticCurveTo(0, -6.4 * s, 2.7 * s, -2.6 * s)
    q.ctx.stroke()
  })
}
