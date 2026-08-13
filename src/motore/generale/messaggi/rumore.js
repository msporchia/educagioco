/* ═══════════════════════════════════════════════════════════════════
   RUMORE — si sente fin dove arriva, e i muri non lo fermano

   La misura è in linea d'aria, e questa è tutta la differenza con la
   vista: **il muro ferma gli occhi, non le orecchie**. Senza, chi si
   chiude dietro una porta non saprebbe più niente del mondo — e invece
   è proprio lì che il gioco vuole portarlo: cieco, e in ascolto.

   L'intensità sta sul SEGNALE, non su chi lo manda: un fracasso arriva
   più lontano di un cigolio perché è un fracasso, non perché a farlo
   sia stato un orco grosso. Così «che rumore fai» diventa una proprietà
   di quello che è successo — sfondare una porta o aprirla con la
   chiave — e il bambino può leggerla sulla mappa invece di indovinarla.
   ═══════════════════════════════════════════════════════════════════ */
import { Messaggio } from './messaggio.js'
import { InAria } from '../distanze/in-aria.js'

export class Rumore extends Messaggio {
  constructor (segnale, da, quantoLontano) {
    super(segnale, da)
    this.raggio = new InAria(quantoLontano)
  }

  arrivaA (mondo, chi) { return this.raggio.arriva(mondo, this, chi) }
  get eRumore () { return true }
}
