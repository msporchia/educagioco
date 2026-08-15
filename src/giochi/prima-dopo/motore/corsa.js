/* ═══════════════════════════════════════════════════════════════════
   UNA CORSA — la tappa come fila di storie

   Come la Corsa del Codice Segreto: una tappa non è una storia sola,
   sono `quante` storie rimesse in fila una dopo l'altra. La Corsa sa
   quali storie sono idonee, ne pesca una, genera il quesito, e tiene il
   conto di quante ne restano, di quanti errori sono serviti e di quante
   monete si sono guadagnate.

   Un errore **non fa perdere la storia**: `registraErrore()` conta il
   colpo, e chi coordina (`Gioco.vue`) accende un istante la fila
   giusta; poi `riprova()` genera un nuovo quesito sulla stessa
   storia, per riprovarla senza che sia rimasta bloccata nello stesso
   stato sbagliato. Le stelle raccontano quanto è filata liscia, non se
   è stata portata a casa: qui non si perde mai.
   ═══════════════════════════════════════════════════════════════════ */
import { STORIE } from '../dati/storie.js'
import { CHIAVI_VERBI, verbo as datiVerbo } from '../dati/verbi.js'
import { generaQuesito } from './quesito.js'

/* Le storie che un verbo, in una tappa, può usare: della categoria
   giusta, abbastanza lunghe, e — negli scalini facili — mai quelle che
   lette al contrario avrebbero comunque senso: lì la freccia del tempo
   deve essere ovvia. Fuori dalla classe perché anche il banco di prova
   e i test la chiamano senza dover giocare una corsa intera. */
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
    /* le ultime storie proposte: solo per non rifare subito la stessa,
       non è una regola del gioco ma un accorgimento di varietà */
    this.recenti = []
    this.verbo = null
    this.quesito = null
    this.pescaStoria()
  }

  get finita() { return this.fatte >= this.richieste }

  /* Il verbo di un giro: fisso per quasi tutte le tappe, sorteggiato a
     ogni giro solo nella tappa finale, dove si mescolano tutti e sei. */
  sceglieVerbo() {
    if (this.tappa.verbo !== 'mescolato') return datiVerbo(this.tappa.verbo)
    return datiVerbo(CHIAVI_VERBI[Math.floor(this.rnd() * CHIAVI_VERBI.length)])
  }

  idonee(v) { return storieIdonee(this.tappa, v, this.storie) }

  pescaStoria() {
    const v = this.sceglieVerbo()
    const idonee = this.idonee(v)
    /* si evita, quando si può, di ripetere una storia appena fatta */
    const fresche = idonee.filter(s => !this.recenti.includes(s.chiave))
    const pool = fresche.length ? fresche : idonee
    const storia = pool[Math.floor(this.rnd() * pool.length)]
    this.recenti = [storia.chiave, ...this.recenti].slice(0, 2)

    const altre = idonee.filter(s => s.chiave !== storia.chiave)
    this.verbo = v
    this.quesito = generaQuesito(v, storia, altre, this.rnd)
    return this.quesito
  }

  /* Un colpo sbagliato: si conta e basta. Chi coordina fa lampeggiare
     la fila giusta e poi chiama `riprova()`. */
  registraErrore() {
    this.errori++
  }

  /* La stessa storia, un quesito nuovo: rifare vedere esattamente lo
     stesso stato già sbagliato non insegnerebbe niente di più. */
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

  /* La storia dopo. Non si chiama a tappa finita: là si va al cartello. */
  avanti() {
    if (this.finita) return null
    return this.pescaStoria()
  }

  /* Tre stelle senza nemmeno un errore, due fino a due errori, una
     sempre — qui non si perde mai, e la stella più bassa non manca. */
  get stelle() {
    if (this.errori === 0) return 3
    if (this.errori <= 2) return 2
    return 1
  }
}
