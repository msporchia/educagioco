/* «la leva è stata premuta». Come `aperta`, ma per i congegni: chi
   risponde è il congegno, e questa domanda non sa se sia una leva o un
   totem. */
import { Domanda } from './domanda.js'

export class Premuto extends Domanda {
  static parola = 'premuto'
  valuta (mondo, chi) {
    const congegno = mondo.laCosa(this.di, chi)
    return !!(congegno && typeof congegno.chiedi === 'function' && congegno.chiedi('premuto'))
  }
  testo (mondo) { return `${this.nomeDi(mondo)} è stata premuta` }
  testoNegato (mondo) { return `${this.nomeDi(mondo)} non è stata premuta` }
}
