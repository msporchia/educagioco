/* «la ladra è arrivata al rifugio». Serve quasi solo ai livelli, per
   dichiarare la vittoria quando non basta avere una cosa in mano ma
   bisogna anche essere tornati da qualche parte. */
import { Domanda } from './domanda.js'

export class Qui extends Domanda {
  constructor (di, diChi) { super(di); this.diChi = diChi || null }
  static parola = 'qui'
  static compila (c) { return new Qui(c.complemento, c.chi) }

  /* ── VALE ANCHE PER UNA COSA, NON SOLO PER CHI CAMMINA ──
     «la ladra è al rifugio» e «la farina è in cucina» sono la stessa
     domanda: qualcosa sta in un posto. Finché guardava solo le unità,
     una storia fatta di roba da portare da una parte all'altra non
     aveva modo di dichiarare la vittoria — `posa` restava un verbo
     senza obiettivo che lo premiasse.
     Una cosa in mano a qualcuno «non è» da nessuna parte: si conta solo
     quando è per terra, che è esattamente ciò che vuol dire posarla. */
  valuta (mondo, chi) {
    const p = mondo.posti[this.di]
    if (!p) return false
    const u = this.diChi ? mondo.perId[this.diChi] : chi
    if (u) return !!(u.eInPiedi() && u.x === p.x && u.y === p.y)
    const cosa = this.diChi && mondo.cose && mondo.cose[this.diChi]
    if (!cosa || cosa.preso) return false
    return cosa.x === p.x && cosa.y === p.y
  }
  testo (mondo) { return `${mondo.nomeDi(this.diChi)} è a ${this.nomeDi(mondo)}` }
  testoNegato (mondo) { return `${mondo.nomeDi(this.diChi)} non è a ${this.nomeDi(mondo)}` }
  get chiave () { return `qui|${this.di || ''}|${this.diChi || ''}` }
}
