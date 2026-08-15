/* ═════ IL ROSPO ═════
   Largo più che alto, accovacciato, con gli occhi che sporgono in cima
   alla testa e la gola che si gonfia e si sgonfia. È il gonfiarsi a
   renderlo vivo: un rospo fermo è un sasso verde.

   Le zampe di dietro stanno piegate ai lati come molle caricate — è
   quello che dice «salta» senza farlo saltare per davvero. */
import { mescola, tondo, capsula, poligono } from '../comune.js'
import { occhi } from '../segni.js'

export const RANA = {
  quadrupede: true, taglia: 1,
  col: {
    pelle: '#5c9e4a', pelleS: '#3d7133', pancia: '#d5d98a',
    gola: '#8fc06a', verruca: '#3d7133', bordo: '#1c3a18',
  },
  disegna(q, s, C, dir, sw, stato) {
    const t = q.tempo || 0
    const b = C.bordo, sp = 0.8 * s
    const gonfia = 1 + Math.max(0, Math.sin(t * 1.9)) * 0.22
    for (const v of [-1, 1]) {                                       // le cosce a molla
      poligono(q, [[v * 2.6 * s, -3.4 * s], [v * 6.6 * s, -2.4 * s],
                   [v * 6 * s, 1.6 * s], [v * 2.4 * s, 0.6 * s]], C.pelleS, b, sp)
      // i piedi palmati, tre dita larghe
      for (const d of [-0.8, 0, 0.8])
        poligono(q, [[v * 5.4 * s, 1.4 * s], [v * (7.6 + d * 0.6) * s, (2 + d * 1.4) * s],
                     [v * 5.2 * s, 2.2 * s]], C.pelle, b, sp * 0.7)
    }
    tondo(q, 0, -2.4 * s, 5.4 * s, 4 * s, C.pelle, b, sp)            // il corpo accovacciato
    tondo(q, 0, -0.6 * s, 3.4 * s, 2.2 * s, C.pancia)
    // la gola che si gonfia: è il respiro, e qui si vede invece di intuirsi
    tondo(q, 0, 0.4 * s, 3 * s * gonfia, 2 * s * gonfia, C.gola, b, sp * 0.8)
    for (const [dx, dy] of [[-3.4, -4.4], [3.2, -3.8], [-1.6, -5.6], [2, -5.4]])  // le verruche
      tondo(q, dx * s, dy * s, 0.7 * s, 0.55 * s, C.verruca)
    for (const v of [-1, 1]) {                                       // gli occhi sporgenti
      tondo(q, v * 2.4 * s, -6.4 * s, 1.9 * s, 1.9 * s, C.pelle, b, sp)
      if (stato !== 'ko') {
        q.cerchio(v * 2.4 * s, -6.4 * s, 1.2 * s, '#f2c94c')
        q.ellisse(v * 2.4 * s, -6.4 * s, 0.4 * s, 1.1 * s, '#1b1430')
      }
    }
    if (stato === 'ko') occhi(q, s, 2.4, -6.4, 0.9, stato)
    q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.85 * s; q.ctx.lineCap = 'round'
    q.ctx.beginPath()                                                // la bocca larghissima
    q.ctx.moveTo(-4.2 * s, -3 * s)
    q.ctx.quadraticCurveTo(0, -1 * s, 4.2 * s, -3 * s)
    q.ctx.stroke()
  },
}
