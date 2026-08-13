/* ═══════════════════════════════════════════════════════════════════
   QUANDO SENTI — non aspetta: arma un ascolto e passa oltre

   È quello che dà a un piano DUE punti d'ingresso senza annidare
   niente: la fila principale prosegue, e da qualche parte resta scritto
   che se arriva quel segnale parte un'altra fila.

   Non costa un battito, e non si arma due volte: la seconda volta che
   ci si passa sopra — dentro un ciclo, per esempio — l'ascolto c'è già.

   Un ascolto armato DENTRO un'azione comincia a valere solo quando
   quell'azione viene chiamata: è il modo di non sentire un segnale
   prima di essere nel punto in cui quel segnale vuol dire qualcosa.
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'
import { Esito } from './esiti.js'

export class Ascolta extends Ordine {
  static parola = 'quando'
  constructor (via, bersaglio, allora) { super(via, bersaglio); this.allora = allora }
  /* la fila che parte al segnale è un piano a sé: dentro, le posizioni
     ripartono da capo, perché a schermo è una colonna sua */
  static compila (dato, via, fila) {
    return new Ascolta(via, dato.complemento,
                       fila(Array.isArray(dato.allora) ? dato.allora : [], []))
  }

  azzera () { super.azzera(); this.armato = false; this.allora.azzera() }
  figli () { return [this.allora] }
  aPortata () { return true }

  /* ── L'ELENCO DEGLI ASCOLTI È DEL PERSONAGGIO ──
     Non del mondo: il mondo propaga i messaggi e basta, e chi decide
     se un messaggio lo riguarda è chi lo riceve. Da qui in poi il
     personaggio ha un filo in più — che parte quando quel segnale
     arriva, e solo se in quel momento è libero. */
  fa (contesto, cosa) {
    if (this.armato) return Esito.finitoSubito()
    this.armato = true
    contesto.chi.mettiInAscolto(cosa.id, this.allora, `quando «${cosa.nome}»`)
    this.dice(contesto, `sto in ascolto di «${cosa.nome}»`, 'resta in ascolto')
    return Esito.finitoSubito()
  }
}
