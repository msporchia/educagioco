// I mercanti di sopra: la roba dell'avventuriero (Corredo) davanti a un banco. Ogni mercante pesca il suo
// banco una volta per giro (fra una discesa finita e l'altra) e quello che si compra se ne va; le cose che non
// finiscono (le cure, la torcia) stanno in cima. L'armaiolo e il rigattiere portano la riga della storia con cui
// si entra nella prossima discesa (motore/storia.js). Gira in Node: il giocatore finto ci fa la spesa (banco.js).
// Le regole: docs/sotterraneo/roba.md, "I mercanti di sopra".
import { Corredo, ABILITA_CONFRONTATE } from './corredo.js'
import { COSE, pescaMerce } from '../dati/cose.js'
import { mercanteDi, vendeLa, righeDi, profonditaDelBanco } from '../dati/mercanti.js'
import { bancoDelPasso, vetrinaDelPasso } from './storia.js'

export class Bottega extends Corredo {
  // `finite`: discese finite (avanza.tappa). `banchi`: quello che è già stato pescato in questo giro
  // ({ armaiolo: ['spada', …] }, le botteghe dell'avventura); senza, si pesca alla prima apertura
  constructor({ eroe, roba = null, finite = 0, banchi = null, rnd = Math.random } = {}) {
    super({ eroe, roba })
    this.finite = finite
    this.rnd = rnd
    this.banchi = {}
    for (const [k, v] of Object.entries(banchi || {}))
      if (Array.isArray(v)) this.banchi[k] = [...v]
  }

  // pescato una volta e scritto (nell'avventura): un banco che cambiasse a ogni apertura sarebbe una slot machine.
  // Quello che si ha già non si offre, come faceva il mercante delle discese, tranne quello che si consuma
  banco(chiave) {
    const m = mercanteDi(chiave)
    if (!m) return null
    if (!this.banchi[chiave]) {
      const ammessa = k => vendeLa(m, k) && !m.sempre.includes(k) && !this.possiedo(k)
      this.banchi[chiave] = m.passo
        ? bancoDelPasso(m, this, this.finite, { rnd: this.rnd, ammessa })
        : pescaMerce(profonditaDelBanco(this.finite), {
          quante: righeDi(m, this.finite), rnd: this.rnd, ammessa, tua: k => this.posso(k),
        })
    }
    return { roba: this.banchi[chiave], sempre: m.sempre }
  }

  // le righe sul banco: quelle che non finiscono prima (`sempre`), poi le pescate
  mercanzia(chiave) {
    const b = this.banco(chiave)
    if (!b) return []
    return [
      ...b.sempre.map(k => ({ chiave: k, sempre: true })),
      ...b.roba.map(k => ({ chiave: k, sempre: false })),
    ]
  }

  // i pezzi più su che il banco non porta ancora: si vedono spenti, con la discesa che li fa arrivare
  vetrina(chiave) {
    const m = mercanteDi(chiave)
    const b = this.banco(chiave)
    return m && m.passo ? vetrinaDelPasso(m, this, this.finite, { banco: b.roba }) : []
  }

  // roba che non alza nessun numero di quello che si ha addosso non si mostra (resta pescata: il banco non
  // cambia, cambia cosa si vede). Una seconda arma leggera nella mano libera alza il braccio, quindi si vede
  sottoAddosso(k) {
    const c = COSE[k]
    if (!c || !c.dove || !this.posso(k) || !this.casella(c.dove)) return false
    const p = this.seLoMetto(k)
    if (!p || !p.prima) return false
    return !ABILITA_CONFRONTATE.some(n => p.dopo[n] > p.prima[n])
  }

  compraDa(chiave, k) {
    const b = this.banco(chiave)
    return b ? this.compra(k, b) : null
  }

  // compra solo chi lo dice (il rigattiere): gli altri vendono e basta
  vendiA(chiave, i) {
    const m = mercanteDi(chiave)
    return m && m.compra ? this.vendi(i) : null
  }

  // sopra non c'è buio: una torcia comprata aspetta alla cintura, e si accende scendendo (Corsa)
  accendi(k) {
    this.torceInScorta++
    this.dilloDi(k, ` alla cintura · ne hai ${this.quanteNeHo(k)}`)
    return true
  }
}
