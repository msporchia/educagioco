/* ═══════════════════════════════════════════════════════════════════
   APRI — ci si arriva, e poi decide la cosa

   Questo verbo non sa che esistono le porte. Chiede al mondo la cosa
   che si chiama così e le dice «apriti»: se ci vuole una chiave, se si
   sfonda, quanto ci vuole e che rumore fa lo sa lei. Il giorno che si
   aprirà un baule, o una grata, o il coperchio di un pozzo, qui non
   cambia una riga — mentre un verbo che va a cercare in `mondo.porte` è
   un verbo che ha imparato in che cassetto si guarda.

   E non decide da fermo che «tanto era già aperto»: se una cosa è già
   come la volevi, a dirlo è lei quando gliela chiedi.
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'

export class Apri extends Ordine {
  static parola = 'apri'
  fa (contesto, cosa) { return contesto.consegna(this, cosa, 'apri') }
  raccontaIlMoto (cosa) { return `vado ad aprire ${cosa.nome}` }
}
