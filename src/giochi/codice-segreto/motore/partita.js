// Le regole di una partita, a classi e senza schermo. Il caso si passa da
// fuori (`rnd`) così una partita si può rifare identica: è quello che
// permette al banco di prova di giocarne migliaia.
import { scaglione, stellePer, quantiCodici } from '../dati/difficolta.js'
import { tema } from '../dati/temi.js'
import { confronta } from './indizi.js'

export class Regole {
  static perTappa(t) {
    return new Regole(scaglione(t.difficolta), tema(t.tema))
  }

  // Il gioco libero, dove difficoltà e tema si scelgono a mano: una chiave
  // che non esiste torna al predefinito invece di una schermata bianca.
  static libere(chiaveDifficolta, chiaveTema) {
    return new Regole(scaglione(chiaveDifficolta), tema(chiaveTema))
  }

  constructor(voce, vestito) {
    const { chiave, nome, icona, caselle, simboli, prove, ripetizioni, premio,
            perfetto, bene } = voce
    this.chiave = chiave
    this.nome = nome
    this.icona = icona
    this.caselle = caselle
    this.prove = prove
    this.ripetizioni = ripetizioni
    this.premio = premio
    this.perfetto = perfetto
    this.bene = bene
    this.tema = vestito
    this.pool = vestito.simboli.slice(0, simboli)

    if (this.pool.length < simboli)
      throw new Error(`codice segreto: il tema "${vestito.nome}" ha ${vestito.simboli.length} disegni, "${chiave}" ne chiede ${simboli}`)
    if (!ripetizioni && this.pool.length < caselle)
      throw new Error(`codice segreto: "${chiave}" senza doppioni non riempie ${caselle} caselle`)
  }

  get accento() { return this.tema.accento }

  get quantiCodici() {
    return quantiCodici({ simboli: this.pool.length, caselle: this.caselle,
                          ripetizioni: this.ripetizioni })
  }

  generaCodice(rnd = Math.random) {
    if (this.ripetizioni)
      return Array.from({ length: this.caselle },
                        () => this.pool[Math.floor(rnd() * this.pool.length)])
    const mazzo = this.pool.slice()
    const codice = []
    for (let i = 0; i < this.caselle; i++)
      codice.push(...mazzo.splice(Math.floor(rnd() * mazzo.length), 1))
    return codice
  }
}

export class Prova {
  constructor(simboli, pieni, vuoti) {
    this.simboli = simboli
    this.pieni = pieni
    this.vuoti = vuoti
  }
  get muta() { return this.pieni === 0 && this.vuoti === 0 }
  get giusta() { return this.pieni === this.simboli.length }
}

export class Partita {
  // `codice` si può imporre da fuori: serve al banco di prova e alla
  // dimostrazione, dove non deve essere una sorpresa.
  constructor(regole, { rnd = Math.random, codice = null } = {}) {
    this.regole = regole
    this.codice = codice ? codice.slice() : regole.generaCodice(rnd)
    this.prove = []
    this.corrente = Array(regole.caselle).fill(null)
    this.esito = null
    this.saltata = false      // data per vinta dal tasto dei grandi: non vale monete
  }

  get finita() { return this.esito !== null }
  get vinta() { return this.esito === 'vinta' }
  get usate() { return this.prove.length }
  get rimaste() { return this.regole.prove - this.prove.length }
  get piena() { return !this.corrente.includes(null) }
  get prossima() { return this.corrente.indexOf(null) }

  // Torna l'indice della buca, o `false` se la riga era già piena.
  posa(simbolo) {
    if (this.finita) return false
    const buca = this.corrente.indexOf(null)
    if (buca < 0) return false
    this.corrente[buca] = simbolo
    return buca
  }

  togli(indice) {
    if (this.finita || this.corrente[indice] == null) return false
    this.corrente.splice(indice, 1)
    this.corrente.push(null)
    return true
  }

  svuota() {
    if (this.finita) return false
    this.corrente = Array(this.regole.caselle).fill(null)
    return true
  }

  // Torna la Prova appena nata (o null se la riga non era completa).
  conferma() {
    if (this.finita || !this.piena) return null
    const simboli = this.corrente.slice()
    const { pieni, vuoti } = confronta(this.codice, simboli)
    const prova = new Prova(simboli, pieni, vuoti)
    this.prove.push(prova)
    this.corrente = Array(this.regole.caselle).fill(null)

    if (pieni === this.codice.length) this.esito = 'vinta'
    else if (this.prove.length >= this.regole.prove) this.esito = 'persa'
    return prova
  }

  /* Il tasto «salta» dei grandi (docs/core/comandi.md): il codice è dato per
     indovinato alla prima riga. Conta come una vittoria per andare avanti, ma
     `monete` è zero e Gioco.vue non segna nessun contatore. */
  salta() {
    if (this.finita) return null
    const prova = new Prova(this.codice.slice(), this.codice.length, 0)
    this.prove.push(prova)
    this.corrente = Array(this.regole.caselle).fill(null)
    this.esito = 'vinta'
    this.saltata = true
    return prova
  }

  get stelle() {
    if (!this.vinta) return 0
    return stellePer(this.regole, this.usate)
  }

  get monete() { return this.vinta && !this.saltata ? this.regole.premio * this.stelle : 0 }

  // Sempre `regole.prove` righe: quelle non ancora giocate vuote, una
  // sola attiva. Il conto si fa qui e non dentro un template.
  get righe() {
    const attiva = this.finita ? -1 : this.prove.length
    return Array.from({ length: this.regole.prove }, (_, r) => {
      const fatta = this.prove[r] || null
      return {
        n: r,
        fatta,
        attiva: r === attiva,
        ultima: fatta != null && r === this.prove.length - 1,
        simboli: fatta ? fatta.simboli
               : r === attiva ? this.corrente.slice()
               : Array(this.regole.caselle).fill(null),
      }
    })
  }
}
