/* ═══════════════════════════════════════════════════════════════════
   FILA — una lista di azioni, una dopo l'altra

   È il contenitore da cui viene tutto il resto: il corpo di un ciclo è
   una fila, un ramo di un bivio è una fila, il piano di un personaggio
   è una fila, quello che fa quando reagisce a qualcosa è una fila. E
   siccome una fila è a sua volta un'azione, si contengono a vicenda
   senza che nessuno abbia scritto da nessuna parte quanto in fondo si
   può andare.

   NON SA COSA CONTIENE. Chiama `esegui` e guarda l'esito: quello è
   tutto il contratto.
   ═══════════════════════════════════════════════════════════════════ */
import { Azione } from './azione.js'
import { Esito } from './esiti.js'

/* quante azioni «a costo zero» si attraversano dentro lo stesso battito
   prima di dire che di lì non si esce */
const A_VUOTO = 40

export class Fila extends Azione {
  constructor (azioni, via) {
    super(via)
    this.azioni = azioni || []
    this.i = 0
    this.daCapo = true
  }

  azzera () {
    super.azzera()
    this.i = 0
    this.daCapo = true
    this.azioni.forEach(a => a.azzera())
  }

  figli () { return this.azioni }
  get vuota () { return !this.azioni.length }
  get finita () { return this.i >= this.azioni.length }
  /* l'azione su cui sta adesso, per chi guarda da fuori */
  get ora () { return this.azioni[this.i] || null }

  esegui (contesto) {
    let giri = 0
    /* se in questa chiamata non si è speso niente — solo dichiarazioni,
       ascolti armati, ordini già compiuti — la fila non deve far
       passare un battito: sarebbe un piano che parte più tardi perché
       l'hai scritto con due righe in più in cima */
    let speso = false
    while (giri++ < A_VUOTO) {
      if (this.finita) return speso ? Esito.finito() : Esito.finitoSubito()
      const azione = this.azioni[this.i]
      if (this.daCapo) { this.daCapo = false; azione.azzera() }
      /* dove sta il dito adesso: la vista ci accende la riga. Lo scrive
         la fila più interna, e quella vince — che è giusto, perché è
         l'azione che sta davvero girando. */
      contesto.chi.ordineOra = { unita: contesto.chi.id,
                                 ...contesto.registro.posto(contesto, azione) }
      const esito = azione.esegui(contesto)
      if (!esito.finito) return esito              // in corso, o in attesa
      if (esito.rotto) return esito                // e la fila si ferma con lei
      this.i++
      this.daCapo = true
      /* non ha speso il battito: si prosegue subito, nello stesso */
      if (!esito.speso) continue
      speso = true
      /* l'ha speso: si torna a chi ci contiene, dicendogli se questa
         fila è arrivata in fondo o no */
      return this.finita ? Esito.finito() : Esito.inCorso()
    }
    return this.siRompe(contesto, 'giro a vuoto fra i miei ordini')
  }
}
