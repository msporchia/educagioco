// Una tappa è `partite` domande da rispondere in fila, con lo stesso
// mondo e verbo (o due verbi che si danno il cambio, se la tappa
// dichiara `alterna`). Una risposta sbagliata non fa perdere niente e
// non fa avanzare: resta la stessa domanda, si conta insieme e si
// riprova — è `Gioco.vue` a decidere quando far ripartire il tentativo.
import { generaDomanda } from './scena.js'

export class Corsa {
  static perTappa(t, opzioni = {}) { return new Corsa(t, opzioni) }

  // Una tappa lasciata a metà (motore/sosta.js): la domanda aperta resta
  // quella, non se ne genera un'altra.
  static ripresa(t, { indice, errori, domanda, ...opzioni }) {
    return new Corsa(t, { ...opzioni, indice, errori, domanda })
  }

  constructor(tappa, { rnd = Math.random, indice = 0, errori = 0, domanda = null } = {}) {
    this.tappa = tappa
    this.rnd = rnd
    this.richieste = tappa.partite
    this.indice = indice      // quante domande già risposte giuste
    this.errori = errori      // errori in tutta la tappa: decidono le stelle
    this.domanda = domanda || generaDomanda(tappa, rnd)
  }

  get finita() { return this.indice >= this.richieste }
  get rimaste() { return Math.max(0, this.richieste - this.indice) }

  // Torna `true` se giusta. Se sbagliata la domanda resta la stessa: non
  // se ne genera un'altra.
  rispondi(valore) {
    const giusta = Object.is(valore, this.domanda.rispostaGiusta)
    if (giusta) {
      this.indice++
      // la domanda che se ne va è l'unico contesto della prossima: dice
      // che verbo e che specie sono appena passati, così la tappa non
      // ripete quattro volte la stessa domanda con lo stesso animale
      if (!this.finita) this.domanda = generaDomanda(this.tappa, this.rnd, this.domanda)
    } else {
      this.errori++
    }
    return giusta
  }

  // Sempre almeno una stella: qui non si perde, si conta solo quanto è
  // filato liscio.
  get stelle() {
    if (!this.finita) return 0
    if (this.errori === 0) return 3
    if (this.errori <= 2) return 2
    return 1
  }
}
