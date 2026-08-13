/* ═══════════════════════════════════════════════════════════════════
   PASSATI — «sono passati abbastanza battiti»

   L'unica domanda che non guarda il mondo ma sé stessa: conta quante
   volte gliel'hanno fatta. Sembra un trucco e invece è il pezzo che
   mancava per far aspettare qualcuno senza inventare un verbo nuovo —
   «corri dov'è il rumore, **aspetta un po'**, e se non c'è nessuno
   torna al tuo giro» si scrive con l'attesa che c'è già.

   Chi la usa dentro un ciclo la ritrova azzerata a ogni giro, perché
   l'azione che la contiene si azzera: «aspetta cinque» vuol dire cinque
   ogni volta, non cinque in tutta la partita.
   ═══════════════════════════════════════════════════════════════════ */
import { Domanda } from './domanda.js'

export class Passati extends Domanda {
  constructor (quanti) { super(null); this.quanti = quanti ?? 1; this.visti = 0 }
  static parola = 'passati'
  static compila (c) { return new Passati(c.n) }

  valuta () { return ++this.visti >= this.quanti }
  valutabile () { return true }
  azzera () { this.visti = 0 }
  testo () { return this.quanti <= 1 ? 'passi un momento' : `passano ${this.quanti} momenti` }
  testoNegato () { return 'non è ancora ora' }
  get chiave () { return `passati|${this.quanti}` }
}
