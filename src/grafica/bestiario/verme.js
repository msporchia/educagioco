/* ═════ IL VERMONE ═════
   Un anellide grosso quanto un braccio, uscito per metà dal terreno.
   È fatto di segmenti che si stringono e si allargano a onda: quella è
   tutta la sua animazione, e senza sarebbe un tubo.

   La bocca è un anello di denti, non una faccia. Non ha occhi apposta
   — è la cosa che lo rende inquietante a un bambino senza mostrare
   niente di cruento: quello che non ti guarda è peggio. */
import { mescola, tondo } from '../comune.js'

export const VERME = {
  quadrupede: true, taglia: 1,
  col: {
    pelle: '#c98a86', pelleS: '#a15f61', anello: '#8d4b50',
    bocca: '#5d2530', denti: '#f0e4d0', bordo: '#4a2226',
  },
  disegna(q, s, C, dir, sw, stato) {
    const t = q.tempo || 0
    const b = C.bordo
    // il corpo: sette anelli in fila che salgono curvando, ognuno con
    // la sua onda sfasata — è lo sfasamento a farlo strisciare
    const SEGMENTI = 7
    for (let i = SEGMENTI - 1; i >= 0; i--) {
      const d = i / (SEGMENTI - 1)
      const onda = Math.sin(t * 2.4 - i * 0.8)
      const x = Math.sin(d * 2.2) * 2.6 * s + onda * 0.5 * s
      const y = (1.6 - d * 10) * s
      const r = (2.2 + d * 1.9 + onda * 0.28) * s
      tondo(q, x, y, r, r * 0.86, i % 2 ? C.pelleS : C.pelle, b, 0.7 * s)
    }
    // la testa in cima: la bocca tonda coi denti tutt'intorno
    const cima = { x: Math.sin(2.2) * 2.6 * s, y: -8.4 * s }
    tondo(q, cima.x, cima.y, 4.4 * s, 4 * s, C.pelle, b, 0.8 * s)
    if (stato === 'ko') {                                            // da morto la bocca si chiude
      q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.9 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath(); q.ctx.moveTo(cima.x - 2 * s, cima.y); q.ctx.lineTo(cima.x + 2 * s, cima.y)
      q.ctx.stroke()
      return
    }
    tondo(q, cima.x, cima.y, 2.6 * s, 2.4 * s, C.bocca)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.28 + t * 0.6
      const dentro = 1.9 * s, fuori = 2.9 * s
      q.figura([[cima.x + Math.cos(a) * fuori, cima.y + Math.sin(a) * fuori * 0.92],
                [cima.x + Math.cos(a + 0.34) * fuori, cima.y + Math.sin(a + 0.34) * fuori * 0.92],
                [cima.x + Math.cos(a + 0.17) * dentro, cima.y + Math.sin(a + 0.17) * dentro * 0.92]],
               C.denti)
    }
  },
}
