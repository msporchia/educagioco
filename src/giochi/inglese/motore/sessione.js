// Una partita a una tappa (o alla 🏁, o al 📦 cassetto): quale domanda
// viene dopo, e cosa succede a una risposta. Non sa di monete né di
// schermo: dice `paga` e cosa segnare nello SRS, e chi la usa lo fa.
// Vedi docs/lingue/frasi.md («La partita» e «L'interfaccia per la vista»).
import { createPicker, strength, overdue } from '../../../store/srs.js'
import { scegliTipo, componi, TIPI } from '../../../data/domande.js'
import { ARGOMENTI } from '../dati/argomenti.js'
import { voceDi } from '../../../data/lessico.js'
import { chiaveForma } from '../dati/forme.js'
import { FRASI, fraseDi } from '../dati/frasi.js'
import { mondoDellaTappa, frasiDi, garantiti, fontiDi, tappaCheInsegna } from './grafo.js'
import { ripresa } from './grado.js'
import { costruisci, giudica, contesto, formatoPerForza } from './formati.js'
import { chiaveDi } from './lessico.js'

export const TIPI_PAROLE = ['figura', 'ascoltoFigura', 'tradIt', 'ascoltoIt', 'tradStra']
// dalla quinta i disegnini non insegnano più niente: la parola si chiede in italiano o in inglese
export const ETA_SENZA_FIGURE = 10

// i tipi per una parola: senza figure dove l'argomento non le vuole (dati/argomenti.js) o per i grandi
export function tipiDellaParola(chiave, { figure = true } = {}) {
  const t = tappaCheInsegna(chiave)
  const senza = !figure || (t && ARGOMENTI[t.argomento].figure === false)
  return senza ? TIPI_PAROLE.filter(x => !TIPI[x].figure) : TIPI_PAROLE
}
export const RIPESCATE = 3            // frasi dei mondi prima, di una forma debole
export const FORMA_DEBOLE = 2

// le chiavi delle parole (e dei verbi) di una frase
const paroleDi = f => [...new Set(f.en.split(/\s+/).map(chiaveDi).filter(k => k && !k.startsWith('frase:')))]

export class Sessione {
  constructor({ tappa, itemDi, ora = () => Date.now(), rnd = Math.random, haVoce = () => false,
                bersaglio = null, eta = null, partenza = 0 }) {
    this.tappa = tappa
    this.itemDi = itemDi
    this.ora = ora
    this.rnd = rnd
    this.haVoce = haVoce
    this.figure = !(eta >= ETA_SENZA_FIGURE)
    this.partenza = partenza
    this.sbagliate = new Set()
    this.forzaDi = k => strength(itemDi(k), ora())
    this.giuste = 0
    this.errori = 0
    this.fatte = 0

    const { grado, voci } = ripresa(tappa, this.forzaDi)
    this.gradoIniziale = grado
    // il primo giro: dalla più debole, e alla 🏁 non tutto il mondo. Le frasi
    // non ci stanno: entrano quando le loro parole sono state indovinate (pronta)
    const giro = voci.slice(0, tappa.bandiera ? 16 : voci.length).map(v => v.chiave)
    this.primoGiro = giro.filter(k => !k.startsWith('frase:'))
    this.pool = voci.map(v => v.chiave)
    this.indovinate = new Set()
    // una tappa di frasi non chiede parole: una parola che non sa si tocca (docs/lingue/frasi.md)

    // una forma debole ripesca le sue frasi dai mondi già fatti: solo dove si
    // ripassano le frasi (una tappa di frasi, la 🏁), mai in una di parole
    const m = tappa.cassetto ? null : mondoDellaTappa(tappa.id)
    if (m && (tappa.frasi || tappa.bandiera)) {
      const prima = garantiti(m.id)
      // debole è una forma vista e poi calata: una mai vista (un anno passato per età) non si ripesca
      const vista = f => !!itemDi(chiaveForma(f.forma)).last
      const deboli = FRASI.filter(f => prima.has(f.mondo) && vista(f) &&
        this.forzaDi(chiaveForma(f.forma)) < FORMA_DEBOLE && this.forzaDi('frase:' + f.id) < 4)
      const mescolate = deboli.map(f => [rnd(), f]).sort((a, b) => a[0] - b[0]).map(x => x[1])
      this.pool.push(...mescolate.slice(0, RIPESCATE).map(f => 'frase:' + f.id))
    }
    this.altre = m ? frasiDi(tappa) : []
    this.bersaglio = bersaglio ?? (tappa.bersaglio || Math.min(20, giro.length + 4))
    this.picker = createPicker({ getItem: itemDi, pausaDopo: 3 })
  }

  get finita() { return this.giuste >= this.bersaglio }

  // la prossima domanda, pronta da mostrare
  prossima() {
    for (let tentativi = 0; tentativi < 12; tentativi++) {
      let chiave
      if (this.primoGiro.length) { chiave = this.primoGiro.shift(); this.picker.annota(chiave) }
      else {
        const pronte = this.pool.filter(k => this.pronta(k))
        chiave = this.picker.pick(pronte.length ? pronte : this.pool, this.ora())
      }
      const d = this.domandaPer(chiave)
      if (d) { this.fatte++; return d }
    }
    return null
  }

  // una frase è pronta quando ogni sua parola è già saputa o indovinata in questa partita
  pronta(chiave) {
    if (!chiave.startsWith('frase:')) return true
    const frase = fraseDi(chiave.slice(6))
    if (!frase) return false
    return paroleDi(frase).every(k => this.indovinate.has(k) || this.forzaDi(k) >= 1)
  }

  domandaPer(chiave) {
    const forza = this.forzaDi(chiave)
    if (chiave.startsWith('frase:')) {
      const frase = fraseDi(chiave.slice(6))
      if (!frase) return null
      const g = this.gradino(chiave, frase)
      return costruisci(frase, formatoPerForza(g), this.contestoDi(frase), { forza: g })
    }
    const v = voceDi(chiave)
    if (!v) return null
    const tipo = scegliTipo(v, { aperti: tipiDellaParola(chiave, { figure: this.figure }), forza,
                                haVoce: this.haVoce })
    if (!tipo) return null
    // le risposte sbagliate vengono dall'argomento della parola, mai da tutta la lingua
    return { ...componi(v, tipo, 'inglese', { fonti: fontiDi(chiave, voceDi) }), genere: 'parola', formato: tipo }
  }

  // Il gradino del formato: la forza della frase, ma chi sa già la struttura
  // (la forma sale a ogni frase giusta) monta anche le frasi nuove, e in un
  // mondo passato o con tutto aperto si parte da «scegli». Una frase
  // sbagliata in questa partita torna alla sua forza. Vedi docs/lingue/frasi.md.
  gradino(chiave, frase) {
    const forza = this.forzaDi(chiave)
    if (this.sbagliate.has(chiave)) return forza
    return Math.max(forza, this.forzaDi(chiaveForma(frase.forma)) - 1, this.partenza)
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
    if (esito.giusta && d.genere !== 'frase' && d.chiave) this.indovinate.add(d.chiave)
    if (esito.giusta) this.giuste++
    else { this.errori++; if (d.genere === 'frase') this.sbagliate.add(d.chiave) }
    this.picker.afterAnswer(d.chiave, esito.giusta)
    return esito
  }
}
