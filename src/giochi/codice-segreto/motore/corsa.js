// Una tappa è `partite` codici da indovinare in fila, con lo stesso
// vestito e le stesse regole. Un codice sbagliato non toglie niente e non
// fa arretrare: le stelle della tappa sono quelle della partita andata
// peggio.
import { Partita, Regole } from './partita.js'

export class Corsa {
  static perTappa(t, opzioni = {}) {
    return new Corsa(Regole.perTappa(t), t.partite, opzioni)
  }

  constructor(regole, richieste = 1, { rnd = Math.random, codici = null } = {}) {
    this.regole = regole
    this.richieste = richieste
    this.rnd = rnd
    this.codici = codici          // codici imposti da fuori, per il banco di prova
    this.vinte = 0
    this.giocate = 0
    this.monete = 0
    this.peggiore = 3             // le stelle della partita andata peggio
    this.partita = this.nuovaPartita()
  }

  nuovaPartita() {
    const imposto = this.codici ? this.codici[this.giocate % this.codici.length] : null
    return new Partita(this.regole, { rnd: this.rnd, codice: imposto })
  }

  get finita() { return this.vinte >= this.richieste }
  get rimaste() { return Math.max(0, this.richieste - this.vinte) }
  get stelle() { return this.finita ? this.peggiore : 0 }

  // La partita in corso è finita: si tira la riga. Torna `true` se anche
  // la tappa è finita qui.
  registra() {
    const p = this.partita
    if (!p.finita) return false
    this.giocate++
    if (p.vinta) {
      this.vinte++
      this.monete += p.monete
      this.peggiore = Math.min(this.peggiore, p.stelle)
    } else {
      this.peggiore = Math.min(this.peggiore, 1)
    }
    return this.finita
  }

  avanti() {
    if (this.finita) return null
    this.partita = this.nuovaPartita()
    return this.partita
  }
}
