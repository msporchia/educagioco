/* ═══════════════════════════════════════════════════════════════════
   PREMI — un verbo solo per ogni congegno

   Una leva e un totem non si dicono in due modi diversi (`tira`,
   `gira`, `accendi` sono stati scartati apposta): `premi` basta per
   tutti e due, e cosa succede quando arrivi a zero — o a `tacche` — lo
   decide il congegno che lo riceve.
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'

export class Premi extends Ordine {
  static parola = 'premi'
  fa (contesto, cosa) { return contesto.consegna(this, cosa, 'premi') }
  raccontaIlMoto (cosa) { return `vado a premere ${cosa.nome}` }
}
