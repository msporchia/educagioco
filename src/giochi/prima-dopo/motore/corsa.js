// Una tappa è `quante` storie rimesse in fila una dopo l'altra: la Corsa
// pesca le storie idonee, genera il quesito e tiene il conto di errori
// e monete. Un errore non fa perdere la storia: `registraErrore()` la
// conta e poi `riprova()` genera un nuovo quesito sulla stessa storia.
import { STORIE } from '../dati/storie.js'
import { CHIAVI_VERBI, verbo as datiVerbo } from '../dati/verbi.js'
import { generaQuesito } from './quesito.js'

// Le storie che un verbo, in una tappa, può usare: della categoria
// giusta, abbastanza lunghe, e — negli scalini facili — mai ambigue al
// contrario. Fuori dalla classe perché banco di prova e test la chiamano
// senza dover giocare una corsa intera.
export function storieIdonee(tappa, v, storie = STORIE) {
  return storie.filter(s =>
    tappa.categorie.includes(s.categoria) &&
    s.passi.length >= v.minPassi &&
    (tappa.scalino !== 'facile' || !s.ambiguaAlContrario))
}

export class Corsa {
  static perTappa(t, opzioni = {}) {
    return new Corsa(t, opzioni)
  }

  constructor(tappa, { rnd = Math.random, storie = STORIE } = {}) {
    this.tappa = tappa
    this.rnd = rnd
    this.storie = storie
    this.richieste = tappa.quante
    this.fatte = 0
    this.errori = 0
    this.monete = 0
    this.recenti = []   // ultime storie proposte, solo per varietà
    this.verbo = null
    this.quesito = null
    this.pescaStoria()
  }

  get finita() { return this.fatte >= this.richieste }

  // Il verbo di un giro: fisso per quasi tutte le tappe, sorteggiato a
  // ogni giro solo nella tappa finale, dove si mescolano tutti e sei.
  sceglieVerbo() {
    if (this.tappa.verbo !== 'mescolato') return datiVerbo(this.tappa.verbo)
    return datiVerbo(CHIAVI_VERBI[Math.floor(this.rnd() * CHIAVI_VERBI.length)])
  }

  idonee(v) { return storieIdonee(this.tappa, v, this.storie) }

  pescaStoria() {
    const v = this.sceglieVerbo()
    const idonee = this.idonee(v)
    const fresche = idonee.filter(s => !this.recenti.includes(s.chiave))
    const pool = fresche.length ? fresche : idonee
    const storia = pool[Math.floor(this.rnd() * pool.length)]
    this.recenti = [storia.chiave, ...this.recenti].slice(0, 2)

    const altre = idonee.filter(s => s.chiave !== storia.chiave)
    this.verbo = v
    this.quesito = generaQuesito(v, storia, altre, this.rnd)
    return this.quesito
  }

  registraErrore() {
    this.errori++
  }

  riprova() {
    const storia = this.quesito.storia
    const altre = this.idonee(this.verbo).filter(s => s.chiave !== storia.chiave)
    this.quesito = generaQuesito(this.verbo, storia, altre, this.rnd)
    return this.quesito
  }

  registraSuccesso() {
    this.fatte++
    this.monete += 2
  }

  avanti() {
    if (this.finita) return null
    return this.pescaStoria()
  }

  get stelle() {
    if (this.errori === 0) return 3
    if (this.errori <= 2) return 2
    return 1
  }
}
