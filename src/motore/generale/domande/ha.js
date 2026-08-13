/* «hai la chiave» — quello che si ha addosso. Con `di_chi` diventa «la
   ladra ha il tesoro», ed è così che quasi ogni livello dichiara la
   vittoria: la domanda che si fa un personaggio e quella che si fa il
   livello sono la stessa cosa. */
import { Domanda } from './domanda.js'

export class Ha extends Domanda {
  constructor (di, diChi) { super(di); this.diChi = diChi || null }
  static parola = 'hai'
  static compila (c) { return new Ha(c.complemento, c.chi) }

  /* senza `diChi` parla di chi sta facendo la domanda */
  chiParla (mondo, chi) { return this.diChi ? mondo.perId[this.diChi] : chi }
  valuta (mondo, chi) {
    const u = this.chiParla(mondo, chi)
    return !!(u && u.ha(this.di))
  }
  testo (mondo) { return `hai ${this.nomeDi(mondo)}` }
  testoNegato (mondo) { return `non hai ${this.nomeDi(mondo)}` }
  get chiave () { return `hai|${this.di || ''}|${this.diChi || ''}` }
}
