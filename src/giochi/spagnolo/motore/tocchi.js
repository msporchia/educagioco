// La parola da toccare: ogni parola spagnola a schermo mostra la sua
// traduzione. Gratis 3 volte in tutto finché la parola è nuova; dopo, la
// domanda non paga (lo si dice prima di rispondere) e la parola conta come
// non saputa. Nel capitolo ogni tocco a pagamento toglie il guadagno di una
// domanda sola. Un tocco che costa si chiede prima (`prova`). Vedi
// docs/lingue/mondi.md.
//
// Il conto dei tocchi gratis sta sull'elemento SRS della parola
// (`items['es:perro'].tocchi`): è di quella parola, e lì non cresce niente.
import { strength } from '../../../store/srs.js'
import { traduci } from './lessico.js'

export const TOCCHI_GRATIS = 3
export const NUOVA_FINO_A = 1          // forza efficace: 0..1 è «appena conosciuta»

const chiaveTocco = t => t.chiave || 'struttura:' + t.parola.toLowerCase()

// Il tocco di una domanda. `itemDi(chiave)` dà l'elemento SRS (lo crea se
// manca), `ora()` l'istante.
export class Tocchi {
  constructor({ itemDi, ora = () => Date.now() }) {
    this.itemDi = itemDi
    this.ora = ora
    this.toccate = new Map()           // chiave (o parola) -> { gratis }
  }

  // Toccarla costerebbe? Non segna niente: se costa, la vista chiede prima
  // al bambino. `volte` sono i tocchi gratis già usati, `nuova` se lo è ancora.
  prova(parola) {
    const t = traduci(parola)
    if (!t.chiave || this.toccate.has(chiaveTocco(t))) return { costa: false, volte: 0, nuova: true }
    const it = this.itemDi(t.chiave)
    const volte = it.tocchi || 0
    const nuova = strength(it, this.ora()) <= NUOVA_FINO_A
    return { costa: !(nuova && volte < TOCCHI_GRATIS), volte, nuova }
  }

  tocca(parola) {
    const t = traduci(parola)
    const k = chiaveTocco(t)
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

// La domanda prima di un tocco che costa, dato l'esito di `prova`: perché
// costa, cosa si chiede, e cosa si perde (nel libro una domanda sola).
export function domandaDelTocco({ volte, nuova }, { libro = false } = {}) {
  const perche = volte >= TOCCHI_GRATIS ? `Hai già chiesto questa parola ${volte} volte.`
    : nuova ? '' : 'Questa parola la conosci già.'
  return { perche, chiede: 'Vuoi che ti dica cosa vuol dire?',
           costo: libro ? 'Una domanda del libro non ti darà monete.' : 'Questa domanda non ti darà monete.' }
}

// Nel capitolo: quante domande pagano, date le giuste e i tocchi a pagamento
export const domandeCheLPagano = (giuste, aPagamento) => Math.max(0, giuste - aPagamento)
