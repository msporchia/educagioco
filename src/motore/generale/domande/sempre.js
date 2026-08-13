/* la domanda che risponde sempre di sì. Non si offre a nessuno
   nell'interfaccia: serve dove il motore vuole una domanda e il livello
   non ne ha una da dare. */
import { Domanda } from './domanda.js'

export class Sempre extends Domanda {
  static parola = 'sempre'
  valuta () { return true }
  valutabile () { return true }
  testo () { return 'sempre' }
  testoNegato () { return 'mai' }
}
