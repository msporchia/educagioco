/* ═══════════════════════════════════════════════════════════════════
   UNA CORSA — la tappa come fila di domande

   Una tappa è `partite` domande da rispondere di seguito, con lo stesso
   mondo e lo stesso verbo. Una risposta sbagliata **non fa perdere
   niente e non fa avanzare**: resta la stessa domanda, si conta insieme
   e si riprova — è la vista (`Gioco.vue`) a decidere quando, dopo
   l'animazione del «conta insieme», far ripartire il tentativo.

   Qui non c'è niente da vincere o perdere: c'è solo il conto degli
   errori, che decide le stelle alla fine. A quattro anni la tappa
   aspetta finché non riesce, sempre.
   ═══════════════════════════════════════════════════════════════════ */
import { generaDomanda } from './scena.js'

export class Corsa {
  static perTappa(t, opzioni = {}) { return new Corsa(t, opzioni) }

  constructor(tappa, { rnd = Math.random } = {}) {
    this.tappa = tappa
    this.rnd = rnd
    this.richieste = tappa.partite
    this.indice = 0      // quante domande già risposte giuste
    this.errori = 0      // errori in tutta la tappa: decidono le stelle
    this.domanda = generaDomanda(tappa, rnd)
  }

  get finita() { return this.indice >= this.richieste }
  get rimaste() { return Math.max(0, this.richieste - this.indice) }

  /* Controlla una risposta. Torna `true` se giusta. Se giusta e la
     tappa non è finita, la prossima domanda è già pronta — se sbagliata
     la domanda resta la stessa: non se ne genera un'altra, si ricomincia
     da qui. */
  rispondi(valore) {
    const giusta = Object.is(valore, this.domanda.rispostaGiusta)
    if (giusta) {
      this.indice++
      if (!this.finita) this.domanda = generaDomanda(this.tappa, this.rnd)
    } else {
      this.errori++
    }
    return giusta
  }

  /* Sempre almeno una stella: qui non si perde, si conta soltanto
     quanto è filato liscio. */
  get stelle() {
    if (!this.finita) return 0
    if (this.errori === 0) return 3
    if (this.errori <= 2) return 2
    return 1
  }
}
