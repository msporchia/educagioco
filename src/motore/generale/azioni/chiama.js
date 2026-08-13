/* ═══════════════════════════════════════════════════════════════════
   ESEGUI — chiamare un pezzo di piano che hai scritto tu

   L'unico verbo che non punta a una cosa del mondo: punta a un'AZIONE,
   cioè a una fila di ordini con un nome. Serve a spezzare un piano in
   pezzi che stanno in piedi da soli, e soprattutto a mettere una
   domanda dove una domanda non ci starebbe: dentro il ramo di un bivio
   non entra un altro bivio, ma ci entra un `esegui`.

   NON PARTE NIENTE DI NUOVO e non si sdoppia nessuno: è lo stesso
   personaggio che va a leggere un altro pezzo del suo piano, e quando
   ha finito torna qui.

   ── PERCHÉ UNA COPIA PROPRIA ──
   Il corpo dell'azione è scritto una volta sola, ma **due chiamate sono
   due esecuzioni**: se condividessero l'oggetto, due unità che chiamano
   la stessa azione si calpesterebbero il segnaposto, e una che la
   chiama due volte pure. Ognuno compila la sua la prima volta che ci
   arriva, e poi la riusa azzerandola.
   ═══════════════════════════════════════════════════════════════════ */
import { Ordine } from './ordine.js'
import { Esito } from './esiti.js'

/* quante chiamate si possono impilare prima di dire che non si torna
   più indietro. Non è una misura di memoria: è la soglia oltre la quale
   quello che succede a schermo non lo spiega più nessun piano. */
const PROFONDITA = 12

export class Chiama extends Ordine {
  static parola = 'esegui'

  azzera () { super.azzera(); if (this.dentro) this.dentro.azzera() }
  figli () { return this.dentro ? [this.dentro] : [] }
  aPortata () { return true }

  fa (contesto, cosa) {
    if (!this.dentro) {
      this.dentro = contesto.mondo.filaDellAzione(cosa.id)
      if (!this.dentro || this.dentro.vuota) {
        this.dentro = null
        return this.nonVa(contesto, `${cosa.nome} non ha ancora niente dentro`, 'si guarda intorno')
      }
      this.dentro.azzera()
      /* entrare costa un battito, e non è un dettaglio contabile: è
         quello che rende scrivibile «riprova». Un'azione che richiama
         sé stessa diventa un'attesa attiva, e nel frattempo il mondo si
         muove; senza il battito sarebbe un giro a vuoto dentro lo
         stesso istante, cioè un blocco del gioco. */
      this.dice(contesto, `faccio ${cosa.nome}`, 'si mette al lavoro')
      return Esito.inCorso()
    }
    if (contesto.profondita >= PROFONDITA)
      return this.siRompe(contesto, `${cosa.nome} chiama e richiama e non si torna più indietro`)
    return this.dentro.esegui(contesto.dentroA(cosa.id))
  }
}
