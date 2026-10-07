// La roba dell'avventuriero: gemme, quello che ha addosso, le sei tasche, le torce. Una sola, qualunque eroe
// scenda, e resta fra una discesa e l'altra (docs/sotterraneo/regole.md, "Fra una discesa e l'altra"). Qui
// le regole che valgono sotto e sopra: cosa si porta, dove va un'arma, cosa vale, come si compra e si vende.
// La discesa (motore/corsa.js) e i mercanti di sopra (motore/bottega.js) la estendono; gira in Node.
import { TASCHE } from '../dati/mondo.js'
import { eroeDi, DI_PARTENZA, portaLa, nonLaPorta } from '../dati/eroi.js'
import { COSE, STANZE_TORCIA } from '../dati/cose.js'

// la forma di `cfg.roba` nel profilo: sale se un campo cambia significato (docs/core/ripresa.md, la stessa regola)
export const VERSIONE_ROBA = 1

export const ROBA_VUOTA = () => ({
  v: VERSIONE_ROBA, gemme: 0, zaino: [], mano: null, mancina: null, corpo: null, dito: null,
  torcia: 0, torce: 0,
})

// un id sparito si butta (una casella che non si può nemmeno togliere); un dato storto è uno zaino vuoto
export function rileggiRoba(dato) {
  if (!dato || typeof dato !== 'object' || dato.v !== VERSIONE_ROBA) return null
  const vera = k => (typeof k === 'string' && COSE[k] ? k : null)
  const numero = n => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0)
  return {
    v: VERSIONE_ROBA,
    gemme: numero(dato.gemme),
    zaino: (Array.isArray(dato.zaino) ? dato.zaino : []).filter(k => COSE[k]).slice(0, TASCHE),
    mano: vera(dato.mano), mancina: vera(dato.mancina), corpo: vera(dato.corpo), dito: vera(dato.dito),
    torcia: numero(dato.torcia), torce: numero(dato.torce),
  }
}

export class Corredo {
  constructor({ eroe = DI_PARTENZA, roba = null } = {}) {
    // la scheda dice braccio e difesa di partenza; il resto non sa che esistano quattro eroi
    this.chiEro = eroe
    this.io = eroeDi(eroe)
    this.gemme = 0
    this.zaino = []
    this.mano = null
    this.mancina = null   // seconda arma leggera, o l'ombra di una a due mani (vedi `mani` in dati/cose.js)
    this.corpo = null
    this.dito = null
    // `torciaResta`: stanze davanti alla torcia accesa (0 = spenta). `torceInScorta`: quante aspettano alla cintura
    this.torciaResta = 0
    this.torceInScorta = 0
    this.avvisi = []            // le righe da far comparire a schermo, in coda
    if (roba) this.indossa(roba)
  }

  // quello che si porta su: il resto (vita, piano, mappa) è della discesa e resta giù
  get roba() {
    return {
      v: VERSIONE_ROBA, gemme: this.gemme, zaino: [...this.zaino],
      mano: this.mano, mancina: this.mancina, corpo: this.corpo, dito: this.dito,
      torcia: this.torciaResta, torce: this.torceInScorta,
    }
  }

  indossa(dato) {
    const r = rileggiRoba(dato) || ROBA_VUOTA()
    this.gemme = r.gemme
    this.zaino = r.zaino
    this.mano = r.mano
    this.mancina = r.mancina
    this.corpo = r.corpo
    this.dito = r.dito
    this.torciaResta = r.torcia
    this.torceInScorta = r.torce
  }

  // una copia senza discesa intorno: serve a provare un acquisto prima di farlo (compra)
  copia() { return new Corredo({ eroe: this.chiEro, roba: this.roba }) }

  get att() { return this.io.att + this.addosso('att') }   // unico posto dove si sommano
  get dif() { return this.io.dif + this.addosso('dif') }
  get torciaAccesa() { return this.torciaResta > 0 }

  // metà arrotondata per eccesso: due armi non fanno il doppio, o le pesanti non si prenderebbe più nessuno
  get attaccoMancino() {
    const c = COSE[this.mancina]
    return c ? Math.ceil((c.att || 0) / 2) : 0
  }

  // quanto picchierebbero due mani messe così: per decidere dove mettere un'arma trovata, non tocca niente
  attaccoDelleMani(destra, sinistra) {
    const d = COSE[destra] ? (COSE[destra].att || 0) : 0
    const s = COSE[sinistra] ? Math.ceil((COSE[sinistra].att || 0) / 2) : 0
    return d + s
  }

  aDueMani(k) { return !!(COSE[k] && COSE[k].mani === 2) }

  addosso(campo) {
    let n = 0
    for (const k of [this.mano, this.corpo, this.dito])
      if (k && COSE[k]) n += COSE[k][campo] || 0
    // la seconda arma vale piena per tutto il resto (la luce illumina uguale in qualunque mano), metà solo per il braccio
    if (this.mancina && COSE[this.mancina])
      n += campo === 'att' ? this.attaccoMancino : (COSE[this.mancina][campo] || 0)
    return n
  }

  // il limite è sull'indossare, mai sul prendere: `posso` non blocca la raccolta, solo il vestirsi da sé
  posso(k) { return portaLa(this.io, COSE[k]) }
  perchéNo(k) { return nonLaPorta(this.io, COSE[k]) }

  dillo(testo) { this.avvisi.push(testo) }

  // l'avviso porta la chiave (non una stringa già scritta), così a schermo compare lo sprite vero e non l'emoji di ripiego
  dilloDi(k, coda = '') {
    const c = COSE[k]
    if (!c) return
    this.avvisi.push({ cosa: k, testo: c.nome + coda })
  }

  casella(dove) {
    if (dove === 'mano') return this.mano
    if (dove === 'mancina') return this.mancina
    if (dove === 'corpo') return this.corpo
    return this.dito
  }

  metti(dove, k) {
    if (dove === 'mano') this.mano = k
    else if (dove === 'mancina') this.mancina = k
    else if (dove === 'corpo') this.corpo = k
    else this.dito = k
  }

  // dove va una cosa che non trova posto in tasca: nella discesa per terra (Corsa), qui in tasca comunque —
  // chi compra prova prima su una copia (compra) e non arriva mai a sforare
  nonCiSta(k) { this.zaino.push(k) }

  // in tasca se c'è posto, se no dove dice nonCiSta
  inTasca(k) {
    if (this.zaino.length < TASCHE) this.zaino.push(k)
    else this.nonCiSta(k)
  }

  // un salvataggio vecchio, o un eroe cambiato sulla mappa, può avere addosso cose che la classe non porta
  sistemaIlCorredo() {
    for (const dove of ['mano', 'mancina', 'corpo', 'dito']) {
      const k = this.casella(dove)
      if (!k || this.posso(k)) continue
      this.metti(dove, null)
      this.inTasca(k)
      this.dillo(`${COSE[k].em} ${COSE[k].nome}: ${this.perchéNo(k).toLowerCase()}`)
    }
  }

  // stessa domanda in tre posti (per terra, comprato, banco di prova): vuota e non impegnata dall'altra mano
  mancinaLibera() { return !this.mancina && !this.aDueMani(this.mano) }

  // un'arma a due mani sfratta la sinistra, che non si perde: torna in tasca o per terra
  sistemaLeMani() {
    if (!this.mancina) return
    // l'arma rimasta di là col pugno vuoto ci passa: è la stessa arma che cambia mano, niente da sfrattare
    if (!this.mano && COSE[this.mancina] && COSE[this.mancina].dove === 'mano') {
      this.mano = this.mancina
      this.mancina = null
      return
    }
    if (this.aDueMani(this.mano) || this.aDueMani(this.mancina)) {
      const sfrattata = this.mancina
      this.mancina = null
      this.inTasca(sfrattata)
      this.dillo(`${COSE[sfrattata].em} ${COSE[sfrattata].nome}: serve l'altra mano`)
    }
  }

  // si provano le sistemazioni possibili e si tiene la migliore
  postoDellArma(k) {
    const ora = this.attaccoDelleMani(this.mano, this.mancina)
    const scelte = [{
      dove: 'mano',
      att: this.attaccoDelleMani(k, this.aDueMani(k) ? null : this.mancina),
    }]
    // la mano debole si riempie da sola solo se è vuota: fra "più braccio" e "più pelle" non c'è un più forte
    if (!this.aDueMani(k) && this.mano && !this.aDueMani(this.mano) && !this.mancina)
      scelte.push({ dove: 'mancina', att: this.attaccoDelleMani(this.mano, k) })
    const meglio = scelte.sort((a, b) => b.att - a.att)[0]
    return { dove: meglio.dove, delta: meglio.att - ora }
  }

  // rispetto a quella che si ha già addosso: il motore lo sa, chi disegna non deve sommare niente
  confronto(k) {
    const c = COSE[k]
    if (!c || !c.dove) return null
    // le armi hanno due caselle: il confronto è col totale delle mani, non "uguale a quella che hai"
    if (c.dove === 'mano') {
      const posto = this.postoDellArma(k)
      return { dove: posto.dove, campo: 'att', addosso: this.casella(posto.dove), delta: posto.delta }
    }
    const campo = c.dove === 'corpo' || c.dove === 'mancina' ? 'dif' : 'dono'
    const addosso = this.casella(c.dove)
    // `?.`: un salvataggio vecchio può avere una chiave che non esiste più, e non deve spegnersi su una schermata nera
    const mio = addosso ? (COSE[addosso]?.[campo] || 0) : 0
    return { dove: c.dove, campo, addosso, delta: (c[campo] || 0) - mio }
  }

  // una cosa migliore di quella addosso si mette da sé (vale per terra e al banco); uno scudo solo a mano libera
  vaAddosso(k) {
    const c = COSE[k]
    if (!c || !c.dove || !this.posso(k)) return false
    if (c.dove === 'mancina' && !this.mancinaLibera()) return false
    const conf = this.confronto(k)
    return !conf.addosso || conf.delta > 0
  }

  // la torcia non va in tasca: la prima si accende, le altre aspettano alla cintura senza tetto (docs/sotterraneo/roba.md)
  accendi(k) {
    const quante = (COSE[k] && COSE[k].stanze) || STANZE_TORCIA
    if (this.torciaAccesa) {
      this.torceInScorta++
      this.dilloDi(k, ` alla cintura · ne hai ${this.torceInScorta} di scorta`)
      return true
    }
    this.torciaResta = quante
    this.luceCambiata()
    this.dilloDi(k, ` accesa · si vede più lontano · ${quante} stanze`)
    return true
  }

  luceCambiata() {}   // nella discesa si ricalcola la luce (Corsa)

  // ce l'ho già? Addosso o in tasca è lo stesso: una seconda spada uguale non serve. Pozioni fanno eccezione
  possiedo(k) {
    return this.mano === k || this.mancina === k || this.corpo === k ||
           this.dito === k || this.zaino.includes(k)
  }

  quanteNeHo(k) {
    // la torcia non sta in nessuna tasca: quella che brucia più quelle alla cintura
    if (COSE[k] && COSE[k].usa === 'luce')
      return (this.torciaAccesa ? 1 : 0) + this.torceInScorta
    return this.zaino.filter(x => x === k).length +
           (this.mano === k || this.corpo === k || this.dito === k ? 1 : 0)
  }

  // a metà prezzo: comprare e rivendere è una perdita, non un modo di fare gemme girando in tondo (docs/sotterraneo/roba.md)
  quantoVale(k) {
    const c = COSE[k]
    return c && c.prezzo ? Math.max(1, Math.floor(c.prezzo / 2)) : 0
  }

  // una cosa entrata adesso (comprata): addosso se è meglio, se no in tasca; la torcia si accende o va alla cintura
  prendi(k) {
    const c = COSE[k]
    if (c.usa === 'luce') { this.accendi(k); return { che: 'comprato', cosa: k, addosso: true } }
    if (this.vaAddosso(k)) {
      const conf = this.confronto(k)
      const vecchio = this.casella(conf.dove)
      this.metti(conf.dove, k)
      if (vecchio) this.inTasca(vecchio)
      this.sistemaLeMani()
      const segno = conf.campo === 'att' ? '⚔️' : conf.campo === 'dif' ? '🛡️' : ''
      this.dilloDi(k, conf.delta > 0 && segno ? ` ${segno} +${conf.delta}` : '')
      return { che: 'comprato', cosa: k, addosso: true }
    }
    this.zaino.push(k)
    this.dilloDi(k)
    return { che: 'comprato', cosa: k }
  }

  // `banco` = { roba: [pescati, unici], sempre: [che non finiscono] }. Lo zaino pieno ferma solo quello che
  // non trova posto: si prova prima su una copia (un'arma a due mani può sfrattare anche la mano debole)
  compra(k, banco) {
    const c = COSE[k]
    const scorta = !!banco && (banco.roba || []).includes(k)
    if (!c || !(scorta || (banco && (banco.sempre || []).includes(k)))) return null
    // comprare quello che non si può impugnare sarebbe l'unico modo di perdere gemme senza guadagnare niente
    if (c.dove && !this.posso(k)) { this.dillo(this.perchéNo(k)); return { che: 'niente' } }
    if (this.gemme < c.prezzo) return { che: 'niente' }
    if (this.nonCiStarebbe(k)) { this.dillo('🎒 lo zaino è pieno'); return { che: 'pieno' } }
    this.gemme -= c.prezzo
    if (scorta) banco.roba.splice(banco.roba.indexOf(k), 1)   // il pescato è unico e se ne va; una cura no
    return this.prendi(k)
  }

  nonCiStarebbe(k) {
    const prova = this.copia()
    prova.prendi(k)
    return prova.zaino.length > TASCHE
  }

  vendi(i) {
    const k = this.zaino[i]
    if (!k) return null
    const preso = this.quantoVale(k)
    if (!preso) return null
    this.zaino.splice(i, 1)
    this.gemme += preso
    this.dillo(`💎 +${preso}`)
    return { che: 'venduto', cosa: k, gemme: preso }
  }
}
