/* ═══════════════════════════════════════════════════════════════════
   UNA CORSA — la tappa come fila di partite

   Una tappa non è un codice: sono `partite` codici da indovinare di
   seguito, con lo stesso vestito e le stesse regole. La Corsa è quello
   che sta in mezzo — sa quante ne mancano, quante monete si sono
   guadagnate finora e quante stelle vale la tappa alla fine.

   Un codice sbagliato **non toglie niente e non fa arretrare**: si
   ricomincia da un altro codice e la tappa resta lì che aspetta. A sei
   anni la punizione non insegna, insegna il giro dopo. Quello che una
   partita persa costa è la stella: le stelle della tappa sono le stelle
   della partita andata peggio, quindi tre stelle vogliono dire «tutte e
   tre indovinate presto», non «una fortunata su tre».
   ═══════════════════════════════════════════════════════════════════ */
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

  /* Le stelle valgono solo a tappa portata a casa: una corsa lasciata a
     metà non ha un voto, ha solo un altro giorno per riprovare. */
  get stelle() { return this.finita ? this.peggiore : 0 }

  /* La partita in corso è finita: si tira la riga. Torna `true` se la
     tappa è finita qui. */
  registra() {
    const p = this.partita
    if (!p.finita) return false
    this.giocate++
    if (p.vinta) {
      this.vinte++
      this.monete += p.monete
      this.peggiore = Math.min(this.peggiore, p.stelle)
    } else {
      /* una persa non fa arretrare, ma la tappa non sarà da tre stelle */
      this.peggiore = Math.min(this.peggiore, 1)
    }
    return this.finita
  }

  /* Il codice dopo. Non si chiama a tappa finita: là si va al cartello. */
  avanti() {
    if (this.finita) return null
    this.partita = this.nuovaPartita()
    return this.partita
  }
}
