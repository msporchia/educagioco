// Una partita a una tappa (o alla 🏁, o al 📦 cassetto): quale domanda
// viene dopo, e cosa succede a una risposta. Non sa di monete né di
// schermo: dice `paga` e cosa segnare nello SRS, e chi la usa lo fa.
// Vedi docs/lingue/mondi.md («L'interfaccia per la vista»).
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
// i tipi per una parola: senza figure dove l'argomento non le vuole (dati/argomenti.js)
export function tipiDellaParola(chiave) {
  const t = tappaCheInsegna(chiave)
  return t && ARGOMENTI[t.argomento].figure === false ? TIPI_PAROLE.filter(x => !TIPI[x].figure) : TIPI_PAROLE
}
export const RIPESCATE = 3            // frasi dei mondi prima, di una forma debole
export const FORMA_DEBOLE = 2
export const RISCALDO = 8             // in una tappa di frasi, le parole ancora nuove che le frasi usano

// le chiavi delle parole (e dei verbi) di una frase
const paroleDi = f => [...new Set(f.en.split(/\s+/).map(chiaveDi).filter(k => k && !k.startsWith('frase:')))]

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
    // il primo giro: dalla più debole, e alla 🏁 non tutto il mondo. Le frasi
    // non ci stanno: entrano quando le loro parole sono state indovinate (pronta)
    const giro = voci.slice(0, tappa.bandiera ? 16 : voci.length).map(v => v.chiave)
    this.primoGiro = giro.filter(k => !k.startsWith('frase:'))
    this.pool = voci.map(v => v.chiave)
    this.indovinate = new Set()

    // una tappa di frasi comincia dalle parole che le sue frasi usano e che
    // il bambino non sa ancora (chi arriva da un mondo «passato» non le ha giocate)
    if (tappa.frasi) {
      const nuove = [...new Set(frasiDi(tappa).flatMap(paroleDi))].filter(k => this.forzaDi(k) < 1)
      this.primoGiro.push(...nuove.slice(0, RISCALDO))
      this.pool.push(...nuove.slice(0, RISCALDO))
    }

    // una forma debole ripesca le sue frasi dai mondi già fatti: solo dove si
    // ripassano le frasi (una tappa di frasi, la 🏁), mai in una di parole
    const m = tappa.cassetto ? null : mondoDellaTappa(tappa.id)
    if (m && (tappa.frasi || tappa.bandiera)) {
      const prima = garantiti(m.id)
      const deboli = FRASI.filter(f => prima.has(f.mondo) &&
        this.forzaDi(chiaveForma(f.forma)) < FORMA_DEBOLE && this.forzaDi('frase:' + f.id) < 4)
      this.pool.push(...deboli.slice(0, RIPESCATE).map(f => 'frase:' + f.id))
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
      const ctx = this.contestoDi(frase)
      return costruisci(frase, formatoPerForza(forza), ctx, { forza })
    }
    const v = voceDi(chiave)
    if (!v) return null
    const tipo = scegliTipo(v, { aperti: tipiDellaParola(chiave), forza, haVoce: this.haVoce })
    if (!tipo) return null
    // le risposte sbagliate vengono dall'argomento della parola, mai da tutta la lingua
    return { ...componi(v, tipo, 'inglese', { fonti: fontiDi(chiave, voceDi) }), genere: 'parola', formato: tipo }
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
    else this.errori++
    this.picker.afterAnswer(d.chiave, esito.giusta)
    return esito
  }
}
