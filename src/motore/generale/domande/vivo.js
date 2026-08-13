/* «l'orco è in piedi». Non è percezione — è lo stato di una battaglia,
   e serve soprattutto rovesciata: `se.caduto(...)` è la condizione di
   sconfitta di mezzo tutorial. */
import { Domanda } from './domanda.js'

export class Vivo extends Domanda {
  static parola = 'vivo'
  valuta (mondo) {
    return mondo.vivi().some(u => u.id === this.di || u.fazione === this.di)
  }
  testo (mondo) { return `${this.nomeDi(mondo)} è in piedi` }
  testoNegato (mondo) { return `${this.nomeDi(mondo)} è fuori combattimento` }
}
