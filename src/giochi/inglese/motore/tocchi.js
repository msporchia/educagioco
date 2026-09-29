// La parola da toccare: ogni parola inglese a schermo mostra la sua
// traduzione. Gratis 3 volte in tutto finché la parola è nuova; dopo, la
// domanda non paga (lo si dice prima di rispondere) e la parola conta come
// non saputa. Nel capitolo ogni tocco a pagamento toglie il guadagno di una
// domanda sola. Vedi docs/lingue/mondi.md.
//
// Il conto dei tocchi gratis sta sull'elemento SRS della parola
// (`items['en:dog'].tocchi`): è di quella parola, e lì non cresce niente.
import { strength } from '../../../store/srs.js'
import { traduci } from './lessico.js'

export const TOCCHI_GRATIS = 3
export const NUOVA_FINO_A = 1          // forza efficace: 0..1 è «appena conosciuta»

// Il tocco di una domanda. `itemDi(chiave)` dà l'elemento SRS (lo crea se
// manca), `ora()` l'istante.
export class Tocchi {
  constructor({ itemDi, ora = () => Date.now() }) {
    this.itemDi = itemDi
    this.ora = ora
    this.toccate = new Map()           // chiave (o parola) -> { gratis }
  }

  tocca(parola) {
    const t = traduci(parola)
    const k = t.chiave || 'struttura:' + t.parola.toLowerCase()
    if (this.toccate.has(k)) return { ...t, ...this.toccate.get(k), ancora: true }
    let gratis = true
    if (t.chiave) {
      const it = this.itemDi(t.chiave)
      const nuova = strength(it, this.ora()) <= NUOVA_FINO_A
      gratis = nuova && (it.tocchi || 0) < TOCCHI_GRATIS
      if (gratis) it.tocchi = (it.tocchi || 0) + 1
    }
    const esito = { gratis, conta: !!t.chiave }
    this.toccate.set(k, esito)
    return { ...t, ...esito }
  }

  // tocchi che costano: nella domanda basta uno a togliere il guadagno
  get aPagamento() { return [...this.toccate.values()].filter(x => !x.gratis).length }
  get paga() { return this.aPagamento === 0 }

  // le parole chieste: nello SRS contano come non sapute
  get nonSapute() { return [...this.toccate.entries()].filter(([, x]) => x.conta).map(([k]) => k) }

  // da aggiungere a quello che il giudizio vuole segnare: una parola chiesta
  // non si rafforza anche se la risposta è giusta
  correggi(registra) {
    const via = new Set(this.nonSapute)
    return [...registra.filter(r => !via.has(r.chiave)), ...this.nonSapute.map(chiave => ({ chiave, correct: false }))]
  }
}

// Nel capitolo: quante domande pagano, date le giuste e i tocchi a pagamento
export const domandeCheLPagano = (giuste, aPagamento) => Math.max(0, giuste - aPagamento)
