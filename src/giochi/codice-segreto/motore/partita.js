/* ═══════════════════════════════════════════════════════════════════
   UNA PARTITA — un codice da indovinare

   Le regole, a classi e senza schermo. Il caso si passa da fuori
   (`rnd`) così una partita si può rifare identica: è quello che permette
   al banco di prova di giocarne diecimila e dire se una tappa è dura o
   solo fortunata.

     Regole   uno scaglione di difficoltà applicato a un tema
     Prova    una riga già giocata: i disegni e i due numeri di risposta
     Partita  il codice nascosto, la riga in composizione, l'esito
   ═══════════════════════════════════════════════════════════════════ */
import { scaglione, stellePer, quantiCodici } from '../dati/difficolta.js'
import { tema } from '../dati/temi.js'
import { confronta } from './indizi.js'

export class Regole {
  /* Il modo normale di farne una: una tappa della campagna porta con sé
     sia la difficoltà sia il vestito. */
  static perTappa(t) {
    return new Regole(scaglione(t.difficolta), tema(t.tema))
  }

  /* Il gioco libero, dove le due cose si scelgono a mano. Una chiave che
     non esiste non è una schermata bianca: si torna al predefinito. */
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
    this.perfetto = perfetto      // entro quante prove vale tre stelle
    this.bene = bene              // …e due
    this.tema = vestito
    this.pool = vestito.simboli.slice(0, simboli)

    if (this.pool.length < simboli)
      throw new Error(`codice segreto: il tema "${vestito.nome}" ha ${vestito.simboli.length} disegni, "${chiave}" ne chiede ${simboli}`)
    if (!ripetizioni && this.pool.length < caselle)
      throw new Error(`codice segreto: "${chiave}" senza doppioni non riempie ${caselle} caselle`)
  }

  get accento() { return this.tema.accento }

  /* Quanti codici diversi esistono con queste regole: il metro con cui si
     dice che uno scaglione è più duro di un altro davvero. */
  get quantiCodici() {
    return quantiCodici({ simboli: this.pool.length, caselle: this.caselle,
                          ripetizioni: this.ripetizioni })
  }

  generaCodice(rnd = Math.random) {
    if (this.ripetizioni)
      return Array.from({ length: this.caselle },
                        () => this.pool[Math.floor(rnd() * this.pool.length)])
    /* senza doppioni: si pesca dal mazzo e non si rimette dentro */
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
  /* «ho risposto, e la risposta è niente»: il tabellone deve mostrare
     qualcosa anche qui, o la riga sembra rimasta senza risposta */
  get muta() { return this.pieni === 0 && this.vuoti === 0 }
  get giusta() { return this.pieni === this.simboli.length }
}

export class Partita {
  /* `codice` si può imporre da fuori: serve al banco di prova e alla
     dimostrazione, dove il codice non deve essere una sorpresa. */
  constructor(regole, { rnd = Math.random, codice = null } = {}) {
    this.regole = regole
    this.codice = codice ? codice.slice() : regole.generaCodice(rnd)
    this.prove = []                                   // [Prova]
    this.corrente = Array(regole.caselle).fill(null)  // la riga in composizione
    this.esito = null                                 // null | 'vinta' | 'persa'
  }

  get finita() { return this.esito !== null }
  get vinta() { return this.esito === 'vinta' }
  get usate() { return this.prove.length }
  get rimaste() { return this.regole.prove - this.prove.length }
  get piena() { return !this.corrente.includes(null) }
  get prossima() { return this.corrente.indexOf(null) }

  /* Posa un disegno nella prima buca libera; torna l'indice della buca,
     o `false` se la riga era già piena — chi coordina lo usa per far
     tremare il tasto invece di ingoiare il dito senza dire niente. */
  posa(simbolo) {
    if (this.finita) return false
    const buca = this.corrente.indexOf(null)
    if (buca < 0) return false
    this.corrente[buca] = simbolo
    return buca
  }

  /* Si toglie e si compatta a sinistra: le buche in mezzo confondono. */
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

  /* La riga si consegna. Torna la Prova appena nata (o null se non era
     completa), e da qui in poi l'esito è deciso. */
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

  /* Quante stelle vale come è finita: la tabella sta in `difficolta.js`,
     qui c'è solo il conto. Perdere vale zero, e non toglie niente. */
  get stelle() {
    if (!this.vinta) return 0
    return stellePer(this.regole, this.usate)
  }

  get monete() { return this.vinta ? this.regole.premio * this.stelle : 0 }

  /* Il tabellone come lo vuole chi disegna: sempre `regole.prove` righe,
     quelle non ancora giocate vuote, una sola attiva. Il conto si fa qui
     e non dentro un template. */
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
