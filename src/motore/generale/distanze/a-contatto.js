/* ═══════════════════════════════════════════════════════════════════
   A CONTATTO — la misura delle mani

   Si conta a caselle, senza diagonali: essere sulla stessa cella o
   attaccati. È la misura di chi mena e di chi tocca una cosa per
   usarla, ed è la ragione per cui prima di ogni azione si dice `vai`.

   Non guarda i muri, e va bene così: alla distanza di una cella, un
   muro fra due caselle vuol dire che non ci si arriva a camminare, e
   chi ci prova non ci arriva mai — il passo lo decide `vai`, non
   questo.
   ═══════════════════════════════════════════════════════════════════ */
import { Raggio } from './raggio.js'

export class AContatto extends Raggio {
  constructor (limite) { super(limite ?? 1) }
  distanza (mondo, da, a) {
    if (!a || a.x == null || !da || da.x == null) return Infinity
    return Math.abs(a.x - da.x) + Math.abs(a.y - da.y)
  }
  get comeSiLegge () { return this.limite <= 1 ? 'corpo a corpo' : `${this.limite} caselle` }
}
