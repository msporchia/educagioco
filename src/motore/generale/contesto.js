/* ═══════════════════════════════════════════════════════════════════
   CONTESTO — il turno di un personaggio

   Quello che un'azione ha sottomano mentre gira: il mondo, chi la sta
   eseguendo, il registro su cui raccontarsi, e il nome della fila in
   cui si trova. Era un oggettino anonimo con dentro `m` e `u`, e non si
   capiva cosa fossero.

   Ci stanno anche i pochi servizi che un'azione usa e che non
   appartengono a nessuna delle due parti — parlare a una cosa del campo
   e riceverne la risposta — così un verbo non deve importarsi mezzo
   motore per dire «apriti» a una porta.
   ═══════════════════════════════════════════════════════════════════ */
import { Esito } from './azioni/esiti.js'

export class Contesto {
  constructor (mondo, chi, registro, filo, profondita = 0) {
    this.mondo = mondo
    this.chi = chi
    this.registro = registro
    /* come si chiama la fila che si sta eseguendo: «principale»,
       «quando "un rumore"», il nome di un'azione. Serve solo al
       registro, per accendere la riga giusta a schermo. */
    this.filo = filo || 'principale'
    /* quante chiamate si sono impilate: un'azione che ne chiama
       un'altra all'infinito va fermata dicendolo */
    this.profondita = profondita
  }

  /* scendere dentro un'altra fila, con lo stesso personaggio */
  dentroA (filo) {
    return new Contesto(this.mondo, this.chi, this.registro, filo, this.profondita + 1)
  }

  /* ── PARLARE A UNA COSA DEL CAMPO ──
     La serratura, le spallate, il fracasso, il coperchio del forziere:
     la cosa risponde da sé, e qui la sua risposta diventa una riga di
     registro e un esito. Quattro verbi fanno esattamente questo, e
     nessuno di loro sa com'è fatta una porta. */
  consegna (azione, cosa, comando) {
    if (typeof cosa.ricevi !== 'function')
      return azione.nonVa(this, `${cosa.nome} non è una cosa a cui si possa dire «${comando}»`)
    const risposta = cosa.ricevi(comando, this.chi, this)
    if (!risposta) return Esito.finitoSubito()
    const { esito, penso, siVede } = risposta
    if (esito.rotto) return azione.siRompe(this, penso)
    if (!esito.finito && !esito.speso) return azione.aspettando(this, penso, risposta.quanto)
    /* ── «NON SI PUÒ, MA VAI AVANTI» È UN TERZO CASO ──
       Una porta che rifiuta la chiave sbagliata non è un guasto — chi ha
       chiesto resta in piedi e prova un'altra strada — ma non è nemmeno
       riuscita: scriverla verde come un'apertura vorrebbe dire che il
       registro racconta una cosa che non è successa, e il registro è
       l'unico posto dove un bambino va a capire perché il piano non ha
       retto. `riuscito: false` la fa rossa senza fermare la fila.
       (È quello che il vecchio motore chiamava `salta`, ed era l'unico
       pezzo del suo vocabolario che il nuovo non sapeva ancora dire.) */
    if (risposta.riuscito === false) return azione.nonVa(this, penso, siVede)
    if (penso) this.registro.fatto(this, azione, penso, siVede)
    return esito
  }
}
