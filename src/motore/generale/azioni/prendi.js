/* ═══════════════════════════════════════════════════════════════════
   PRENDI — e cosa voglia dire raccoglierlo lo sa l'oggetto

   Prima non camminava: l'azione riusciva solo da vicino, e il bambino
   doveva mettere un `vai` davanti. Provato col dito non regge — tocchi
   una cosa lontana, non succede niente, e non si capisce perché. Il
   prerequisito che resta, e che è più vero, non è la POSIZIONE ma il
   POSSESSO: al portone ci si arriva sempre, e senza la chiave non si
   apre lo stesso.

   Chi decide se l'oggetto si lascia prendere, e chi registra il
   passaggio di mano, è l'oggetto.
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'

export class Prendi extends Ordine {
  static parola = 'prendi'
  fa (contesto, cosa) { return contesto.consegna(this, cosa, 'prendi') }
  raccontaIlMoto (cosa, dove) {
    return dove.ricordo ? `vado dove ho visto ${cosa.nome}` : `vado a prendere ${cosa.nome}`
  }
}
