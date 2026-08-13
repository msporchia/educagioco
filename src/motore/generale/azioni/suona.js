/* ═══════════════════════════════════════════════════════════════════
   SUONA — fare rumore, e il rumore ha un posto

   Il segnale porta con sé DA DOVE è partito. A chi lo ascolta e basta
   serve solo per sapere che è successo; a chi è fatto per accorrere
   serve eccome: corre lì. È così che «fai rumore lontano da dove devi
   passare» diventa una mossa scrivibile — prima solo il grido di un
   nemico aveva una posizione, e il diversivo lo si poteva sperare, non
   organizzare.

   E SI VEDE: un segnale mandato è una cosa che succede sulla mappa, nel
   punto in cui succede. Finiva solo nel registro — cioè dietro un
   tasto — e chi guardava la scena vedeva un personaggio fermarsi un
   battito senza motivo apparente.
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'
import { Esito } from './esiti.js'

export class Suona extends Ordine {
  static parola = 'suona'

  /* non si va da nessuna parte per gridare: si grida da dove si è, ed è
     tutto il punto — dove lo fai decide dove lui non sarà */
  aPortata () { return true }

  fa (contesto, cosa) {
    contesto.mondo.faiRumore(contesto.chi, cosa.id)
    this.dice(contesto, `suono «${cosa.nome}»`, 'fa un segnale')
    return Esito.finito()
  }
}
