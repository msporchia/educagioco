/* ── GLI STIVALI ──
   Due, uno appena dietro l'altro. Un paio di stivali per terra è la
   cosa più buffa che si possa lasciare in un dungeon, e in un gioco
   di ordini firmati vorrà dire «vai più veloce». */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { raccolta } from './attrezzi.js'

export function stivali(p, cosa, S = p.S) {
  const cuoio = cosa.colore || '#8a5a30', bordo = '#2e1d0f', fibbia = '#e8c569'
  raccolta(p, cosa, S, 0.95, (q, s) => {
    const uno = (dx, dy, col) => {
      // il gambale e il piede: una L morbida
      capsula(q, dx, dy - 1.6 * s, 1.5 * s, 2.6 * s, 0.8 * s, col, bordo, 0.6 * s)
      poligono(q, [[dx - 1.5 * s, dy + 0.6 * s], [dx + 1.5 * s, dy + 0.6 * s],
                   [dx + 3.4 * s, dy + 1.4 * s], [dx + 3.2 * s, dy + 2.2 * s],
                   [dx - 1.5 * s, dy + 2.2 * s]], col, bordo, 0.6 * s)
      q.rett(dx - 1.6 * s, dy - 3.8 * s, 3.2 * s, 0.9 * s, mescola(col, '#ffffff', 0.2))
      tondo(q, dx + 0.2 * s, dy - 0.4 * s, 0.55 * s, 0.55 * s, fibbia)
    }
    uno(-1.6 * s, 0.4 * s, mescola(cuoio, '#000000', 0.22))
    uno(1.4 * s, 1.2 * s, cuoio)
  })
}
