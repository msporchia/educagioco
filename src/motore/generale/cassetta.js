/* ═══════════════════════════════════════════════════════════════════
   LA CASSETTA — quali verbi si offrono, qui e a questo personaggio

   Tre righe, e stanno in un file loro per una ragione sola: rispondere
   vuol dire guardare INSIEME il mondo (che cose ci sono da nominare) e
   le domande (`aspetta che…` si offre solo dove una domanda si può
   fare). Se stessero nel mondo, il mondo dovrebbe conoscere le
   condizioni; se stessero nelle condizioni, sarebbero fuori posto. Qui
   sopra tutti e due, e nessuno dei due deve sapere dell'altro.
   ═══════════════════════════════════════════════════════════════════ */
import { condizioniDi } from './domande/quali.js'

export const verbiDi = mondo => mondo.verbi(condizioniDi(mondo))
export const verbiPer = (mondo, id) => mondo.verbiPer(id, condizioniDi(mondo, id))
export const nonSa = (mondo, id) => mondo.nonSa(id, condizioniDi(mondo, id))
