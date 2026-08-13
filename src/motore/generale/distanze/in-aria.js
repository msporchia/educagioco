/* ═══════════════════════════════════════════════════════════════════
   IN LINEA D'ARIA — la misura delle orecchie

   I muri non la fermano, e questa è tutta la differenza col cammino:
   **il muro ferma gli occhi, non le orecchie**. Si spiega a un bambino
   in una frase, e senza di essa il principio del gioco crollerebbe —
   chi si chiude dietro una porta diventa cieco e resta in ascolto, ed è
   l'unico modo che ha di sapere cosa succede di là.

   Si misura ad area, non a quadrato e non a rombo: un rumore si sente
   in tondo, e il cerchio è anche l'unica forma che un bambino può
   rifare a occhio guardando la mappa.
   ═══════════════════════════════════════════════════════════════════ */
import { Raggio } from './raggio.js'

export class InAria extends Raggio {
  distanza (mondo, da, a) {
    if (!a || a.x == null || !da || da.x == null) return Infinity
    return Math.hypot(a.x - da.x, a.y - da.y)
  }

  get comeSiLegge () { return `${this.limite} in linea d'aria` }
}
