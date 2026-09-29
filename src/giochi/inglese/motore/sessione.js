// Una partita a una tappa (o alla 🏁, o al 📦 cassetto): quale domanda
// viene dopo, e cosa succede a una risposta. Non sa di monete né di
// schermo: dice `paga` e cosa segnare nello SRS, e chi la usa lo fa.
// Vedi docs/lingue/mondi.md («L'interfaccia per la vista»).
import { createPicker, strength, overdue } from '../../../store/srs.js'
import { scegliTipo, componi } from '../../../data/domande.js'
import { voceDi } from '../../../data/lessico.js'
import { chiaveForma } from '../dati/forme.js'
import { FRASI, fraseDi } from '../dati/frasi.js'
import { mondoDellaTappa, frasiDi, garantiti } from './grafo.js'
import { ripresa } from './grado.js'
import { costruisci, giudica, contesto, formatoPerForza } from './formati.js'

export const TIPI_PAROLE = ['figura', 'ascoltoFigura', 'tradIt', 'ascoltoIt', 'tradStra']
export const RIPESCATE = 3            // frasi dei mondi prima, di una forma debole
export const FORMA_DEBOLE = 2

export class Sessione {
  constructor({ tappa, itemDi, ora = () => Date.now(), rnd = Math.random, haVoce = () => false,
                bersaglio = null }) {
    this.tappa = tappa
    this.itemDi = itemDi
    this.ora = ora
    this.rnd = rnd
    this.haVoce = haVoce
    this.forzaDi = k => strength(itemDi(k), ora())
    this.giuste = 0
    this.errori = 0
    this.fatte = 0

    const { grado, voci } = ripresa(tappa, this.forzaDi)
    this.gradoIniziale = grado
    // il primo giro: dalla più debole, e alla 🏁 non tutto il mondo
    this.primoGiro = voci.slice(0, tappa.bandiera ? 16 : voci.length).map(v => v.chiave)
    this.pool = voci.map(v => v.chiave)

    // una forma debole ripesca le sue frasi dai mondi già fatti
    const m = tappa.cassetto ? null : mondoDellaTappa(tappa.id)
    if (m) {
      const prima = garantiti(m.id)
      const deboli = FRASI.filter(f => prima.has(f.mondo) &&
        this.forzaDi(chiaveForma(f.forma)) < FORMA_DEBOLE && this.forzaDi('frase:' + f.id) < 4)
      this.pool.push(...deboli.slice(0, RIPESCATE).map(f => 'frase:' + f.id))
    }
    this.altre = m ? frasiDi(tappa) : []
    this.bersaglio = bersaglio ?? (tappa.bersaglio || Math.min(20, this.primoGiro.length + 4))
    this.picker = createPicker({ getItem: itemDi, pausaDopo: 3 })
  }

  get finita() { return this.giuste >= this.bersaglio }

  // la prossima domanda, pronta da mostrare
  prossima() {
    for (let tentativi = 0; tentativi < 12; tentativi++) {
      let chiave
      if (this.primoGiro.length) { chiave = this.primoGiro.shift(); this.picker.annota(chiave) }
      else chiave = this.picker.pick(this.pool, this.ora())
      const d = this.domandaPer(chiave)
      if (d) { this.fatte++; return d }
    }
    return null
  }

  domandaPer(chiave) {
    const forza = this.forzaDi(chiave)
    if (chiave.startsWith('frase:')) {
      const frase = fraseDi(chiave.slice(6))
      if (!frase) return null
      const ctx = this.contestoDi(frase)
      return costruisci(frase, formatoPerForza(forza), ctx, { forza })
    }
    const v = voceDi(chiave)
    if (!v) return null
    const tipo = scegliTipo(v, { aperti: TIPI_PAROLE, forza, haVoce: this.haVoce })
    if (!tipo) return null
    return { ...componi(v, tipo, 'inglese'), genere: 'parola', formato: tipo }
  }

  contestoDi(frase) {
    const tappa = this.tappa.cassetto ? null : this.tappa
    return contesto(frase, { tappa, altre: this.altre.length ? this.altre : FRASI.filter(f => f.mondo === frase.mondo),
                             forzaForma: id => this.forzaDi(chiaveForma(id)), rnd: this.rnd })
  }

  /* La risposta. `risposta` è l'opzione toccata o gli id delle tessere in
     fila; `tocchi` è il Tocchi della domanda (motore/tocchi.js), se c'è.
     Torna { giusta, paga, registra, perche, siFa, … }: `registra` va
     passato a store/profile.js `answer` voce per voce. */
  rispondi(d, risposta, { tocchi = null } = {}) {
    const scadutaDi = k => { const it = this.itemDi(k); return !!it.last && overdue(it, this.ora()) >= 0 }
    let esito
    if (d.genere === 'frase') {
      const frase = fraseDi(d.frase)
      esito = giudica(frase, d, risposta, { scadutaDi, ctx: this.contestoDi(frase) })
    } else {
      const giusta = !!(risposta && risposta.giusta)
      esito = { giusta, registra: [{ chiave: d.chiave, correct: giusta }], perche: null, siFa: null }
    }
    if (tocchi) esito.registra = tocchi.correggi(esito.registra)
    esito.paga = esito.giusta && (!tocchi || tocchi.paga)
    if (esito.giusta) this.giuste++
    else this.errori++
    this.picker.afterAnswer(d.chiave, esito.giusta)
    return esito
  }
}
