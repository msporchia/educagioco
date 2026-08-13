/* ═══════════════════════════════════════════════════════════════════
   POSA — il gemello di `prendi`, e senza di lui mezzo gioco non si dice

   `prendi` mette una cosa nello zaino e da lì non esce più: finché
   c'era solo lui, una chiave presa era una chiave tolta dal mondo, e
   dare qualcosa a qualcun altro non si poteva scrivere.

   Con `posa` l'oggetto torna a essere un posto: lo lasci dove sei, e
   chi passa di lì lo trova. Da qui nascono tre mosse che prima non
   esistevano — passare una chiave a chi sa scassinare, lasciare una
   cosa dove serve invece di portarsela dietro, e liberarsi le mani.

   Come `prendi`, non decide niente: dice all'oggetto «lasciami», e cosa
   voglia dire lo sa lui. Ed è già a portata per definizione, perché ce
   l'hai addosso: non si cammina per posare.
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'

export class Posa extends Ordine {
  static parola = 'posa'

  /* quello che hai in mano è già a portata: sei tu */
  aPortata () { return true }

  fa (contesto, cosa) { return contesto.consegna(this, cosa, 'posa') }
}
