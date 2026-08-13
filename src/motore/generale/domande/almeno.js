/* «il totem è a 3 o più». L'unica domanda con un numero, e il numero
   sta QUI e non nel totem: il totem conta le pressioni, quanto bastino
   lo decide chi chiede. */
import { Domanda } from './domanda.js'

export class Almeno extends Domanda {
  constructor (di, quanto) { super(di); this.quanto = quanto || 0 }
  static parola = 'almeno'
  static compila (c) { return new Almeno(c.complemento, c.n) }

  valuta (mondo, chi) {
    const congegno = mondo.laCosa(this.di, chi)
    const quante = congegno && typeof congegno.chiedi === 'function' ? congegno.chiedi('almeno') : null
    return quante != null && quante >= this.quanto
  }
  testo (mondo) { return `${this.nomeDi(mondo)} è almeno a ${this.quanto}` }
  testoNegato (mondo) { return `${this.nomeDi(mondo)} non arriva a ${this.quanto}` }
  get chiave () { return `almeno|${this.di || ''}|${this.quanto}` }
}
