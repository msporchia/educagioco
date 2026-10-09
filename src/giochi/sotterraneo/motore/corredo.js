// La roba dell'avventuriero: gemme, quello che ha addosso, le sei tasche, le torce. Una per avventura (una per
// eroe), e resta fra una discesa e l'altra (docs/sotterraneo/la-roba-che-resta.md). Qui
// le regole che valgono sotto e sopra: cosa si porta, dove va un'arma, cosa vale, come si compra e si vende.
// La discesa (motore/corsa.js) e i mercanti di sopra (motore/bottega.js) la estendono; gira in Node.
import { TASCHE, TASCHE_EXTRA_MAX, prezzoTasca } from '../dati/mondo.js'
import { eroeDi, DI_PARTENZA, portaLa, nonLaPorta, FAMIGLIE, requisitoDi } from '../dati/eroi.js'
import { COSE, STANZE_TORCIA, aLivello } from '../dati/cose.js'
import { GEMME_PER_FORTUNA, ATT_PER_PUNTO, SCHIVATA_PER_DESTREZZA, ENERGIA_PER_INTELLIGENZA } from '../dati/livelli.js'
import { valoreDelLivello } from '../dati/pezzi.js'
import { rileggiCrescita, piuDellaCrescita, caratteristica, chiTrattiene, puntiDaDare, riassegna, costoDelRiassegnare }
  from './crescita.js'
import { CARATTERISTICHE } from '../dati/livelli.js'
import { NODI, ENERGIA, aGrado } from '../dati/abilita.js'
import { gradoDi, impara, metti, dimentica, costoDelDimenticare } from './abilita.js'

// la forma di `cfg.avventure[eroe].roba` nel profilo: sale se un campo cambia significato (docs/core/ripresa.md)
export const VERSIONE_ROBA = 1

// le abilità che il confronto di un pezzo mette in riga: un'abilità nuova si aggiunge qui, in `addosso()` e
// in `ABILITA` di viste/pezzo.js (un test controlla che le due liste coincidano)
export const ABILITA_CONFRONTATE = ['att', 'dif', 'vita', 'rigenera', 'fuoco', 'schivata', 'gemme', 'fortuna', 'pozioni',
                                    'luce', 'torcia']

// quanto vale un'abilità quando il gioco sceglie da sé cosa mettersi addosso (per terra, comprando, il banco di prova):
// un punto di difesa vale due di attacco (si para a ogni scambio), la vita un quarto. Pesi da giocatore, non da
// contabile: servono a dire «meglio» o «peggio» quando un pezzo dà più cose insieme
const PESI = { att: 2, dif: 4, vita: 0.4, rigenera: 1, fuoco: 1.6, schivata: 0.12, gemme: 3, fortuna: 0.4, pozioni: 0.03,
               luce: 0.6, torcia: 0.2 }
// la schivata ha un tetto: oltre, i mostri non toccherebbero più
export const SCHIVATA_MASSIMA = 60
const CASELLE = ['mano', 'mancina', 'corpo', 'dito']

// Le pozioni dello stesso tipo stanno nella stessa tasca (l'utente, 9 ottobre): «Pozione ×3» è un posto solo. Lo zaino resta
// una lista di chiavi, una per pezzo; i posti si contano e si mostrano raggruppando. Solo le pozioni (le torce non vanno in
// tasca): ogni altra cosa, anche due spade uguali, occupa il suo.
export const impilabile = k => !!(COSE[k] && ['cura', 'energia', 'cresci'].includes(COSE[k].usa))
// [{ k, n, i }]: una voce per tasca, nell'ordine in cui compaiono; `i` è il primo posto di quella cosa nella lista
export function tascheDello(zaino) {
  const fuori = []
  zaino.forEach((k, i) => {
    const gia = impilabile(k) && fuori.find(t => t.k === k)
    if (gia) gia.n++
    else fuori.push({ k, n: 1, i })
  })
  return fuori
}
export const postiDello = zaino => tascheDello(zaino).length

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
    zaino: (Array.isArray(dato.zaino) ? dato.zaino : []).filter(k => COSE[k]).slice(0, 64),
    mano: vera(dato.mano), mancina: vera(dato.mancina), corpo: vera(dato.corpo), dito: vera(dato.dito),
    torcia: numero(dato.torcia), torce: numero(dato.torce),
  }
}

// I numeri di chi scende con la roba addosso, per le carte che lo mostrano fuori dalla discesa (la scelta delle
// avventure, la carta sulla terra di sopra): sono quelli che userà la Corsa, calcolati dallo stesso Corredo, e
// per una roba vuota restano quelli di base dell'eroe (docs/sotterraneo/avventure.md). `mano`, `mancina`,
// `corpo` e `dito` sono le chiavi di quello che c'è addosso adesso, dopo aver messo da parte quello che la classe non porta
export function schedaConLaRoba(eroe, roba = null, crescita = null) {
  const c = new Corredo({ eroe, roba, crescita })
  c.sistemaIlCorredo()
  const gemme = c.addosso('gemme'), luce = c.addosso('luce')
  const tratti = []
  if (gemme) tratti.push(`💎 ×${(Math.round((1 + gemme) * 100) / 100).toString().replace('.', ',')}`)
  if (luce) tratti.push('🔦 vedi più lontano')
  return {
    vita: c.vitaConLaRoba, att: c.att, dif: c.dif, gemme: c.gemme, tasche: c.postiUsati(),
    mano: c.mano, mancina: c.mancina, corpo: c.corpo, dito: c.dito, tratti, livello: c.livelloEroe, energiaMax: c.energiaMax,
  }
}

export class Corredo {
  constructor({ eroe = DI_PARTENZA, roba = null, crescita = null } = {}) {
    // la scheda dice braccio e difesa di partenza; il resto non sa che esistano quattro eroi
    this.chiEro = eroe
    this.io = eroeDi(eroe)
    // l'esperienza e i punti dati (motore/crescita.js): stanno nell'avventura come la roba, e salgono con lei
    this.crescita = rileggiCrescita(crescita, this.io.chiave)
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
  copia() { return new Corredo({ eroe: this.chiEro, roba: this.roba, crescita: this.crescita }) }

  // quello che la crescita aggiunge (docs/sotterraneo/livelli.md); ricalcolato quando cambia l'esperienza o un punto
  get piu() {
    const cr = this.crescita
    const firma = `${cr.esp}|${cr.forza}|${cr.destrezza}|${cr.intelligenza}|${cr.tempra}`
    if (this._piu && this._piuFirma === firma) return this._piu
    this._piuFirma = firma
    this._piu = piuDellaCrescita(this.io, this.crescita)
    return this._piu
  }
  get livelloEroe() { return this.piu.livello }

  // l'attacco: il braccio della classe, quanto è salita la caratteristica dell'arma in mano, la roba. Unico posto dove
  // si sommano. A mani nude e con un'arma senza famiglia (i pezzi dei grossi, la mazza) conta la caratteristica più
  // alta: provato con la forza, il mago con la Mazza di Grumo (e a mani nude nella scalinata) non picchiava più
  get carDellArma() {
    const c = COSE[this.mano] || COSE[this.mancina]
    const f = c && c.dove === 'mano' && FAMIGLIE[c.famiglia]
    if (f && f.car) return f.car
    return ['forza', 'destrezza', 'intelligenza'].reduce((a, k) => (this.piu.sopra[k] > this.piu.sopra[a] ? k : a))
  }
  get att() { return this.io.att + this.piu.sopra[this.carDellArma] * ATT_PER_PUNTO + this.addosso('att') }
  get dif() { return this.io.dif + this.piu.dif + this.addosso('dif') }
  // il valore di una caratteristica adesso (partenza, punti, dote): i requisiti delle armi e la pagina dell'eroe
  car(k) { return caratteristica(this.io, this.crescita, k) }
  // il massimo di vita con questa roba e questo livello, a inizio discesa: Corsa parte da qui e poi lo fa crescere (vitaPiu)
  get vitaConLaRoba() { return this.io.vita + this.piu.vita + this.addosso('vita') + this.sempre('vitaPiu') }
  get fortuna() { return this.addosso('fortuna') }   // solo dai pezzi: non è più una caratteristica
  // quanto vale una gemma raccolta: gli anelli, le abilità e la fortuna
  get valoreGemme() { return 1 + this.addosso('gemme') + GEMME_PER_FORTUNA * this.fortuna }
  get schivata() {
    return Math.min(SCHIVATA_MASSIMA, this.addosso('schivata') + this.sempre('schivata') + this.piu.sopra.destrezza * SCHIVATA_PER_DESTREZZA)
  }
  // l'energia delle abilità (docs/sotterraneo/abilita.md): la base, l'intelligenza (il mago parte da dieci, il
  // cavaliere da sei) e i nodi che la alzano
  get energiaMax() { return ENERGIA + this.car('intelligenza') * ENERGIA_PER_INTELLIGENZA + this.sempre('energiaPiu') }

  // L'albero delle abilità: il grado di un nodo, e quanto danno insieme i nodi «sempre» imparati per un campo
  // (colpoPiu, vitaPiu, schivata…). Un nodo che vuole un'arma vale solo con quell'arma in mano: «Filo affilato»
  // senza spada non affila niente. `ha(campo)` dice se c'è almeno un nodo, anche quando vale zero (il primo tiro)
  grado(id) { return gradoDi(this.crescita, id) }
  nodiSempre() {
    const firma = `${JSON.stringify(this.crescita.albero)}|${this.mano}|${this.mancina}`
    if (this._sempre && this._sempreFirma === firma) return this._sempre
    this._sempreFirma = firma
    this._sempre = Object.entries(this.crescita.albero || {})
      .map(([id, g]) => ({ nodo: NODI[id], g }))
      .filter(x => x.nodo && x.nodo.sempre && this.haLArma(x.nodo.arma))
    return this._sempre
  }
  sempre(campo) { return this.nodiSempre().reduce((n, x) => n + (Number(aGrado(x.nodo, campo, x.g)) || 0), 0) }
  ha(campo) { return this.nodiSempre().some(x => x.nodo[campo] != null) }
  // `arma` di un ramo (dati/abilita.js): le famiglie che vuole in mano, o uno scudo nella mancina; null = niente
  haLArma(arma) {
    if (!arma) return true
    if (arma.scudo) return !!(this.mancina && COSE[this.mancina] && COSE[this.mancina].dove === 'mancina')
    return [this.mano, this.mancina].some(k => k && COSE[k] && arma.famiglie.includes(COSE[k].famiglia))
  }
  // i nodi «sempre» dello stesso ramo di un'abilità che la rinforzano (Fiamma viva: il fuoco passa la difesa)
  delRamo(nodo, campo) {
    if (!nodo) return 0
    let v = 0
    for (const x of this.nodiSempre())
      if (x.nodo.ramo === nodo.ramo && x.nodo.rami) v += campo === 'passa' ? (x.nodo.rami.passa ? 1 : 0) : (aGrado(x.nodo.rami, 'piu', x.g) || 0)
    return v
  }
  // Riassegnare i punti delle caratteristiche o dell'albero: tornano da dare, e si paga in gemme (GEMME_PER_RIASSEGNARE
  // a punto). Quello che non si può più indossare torna in tasca (sistemaIlCorredo). Torna false senza gemme o senza punti
  get costoRiassegnare() { return costoDelRiassegnare(this.crescita) }
  get costoDimenticare() { return costoDelDimenticare(this.crescita) }
  riassegnaPunti() {
    const n = riassegna(this.crescita)
    if (!n || this.gemme < this.costoRiassegnare) return false
    this.gemme -= this.costoRiassegnare
    this.crescita = n
    this.sistemaIlCorredo()
    return true
  }
  dimenticaAlbero() {
    const n = dimentica(this.crescita)
    if (!n || this.gemme < this.costoDimenticare) return false
    this.gemme -= this.costoDimenticare
    this.crescita = n
    return true
  }

  // un punto all'albero, e un'abilità messa in una delle caselle dello scontro (motore/abilita.js)
  impara(id) {
    const n = impara(this.crescita, this.io.chiave, id)
    if (!n) return false
    this.crescita = n
    return true
  }
  mettiInCasella(i, id) {
    const n = metti(this.crescita, i, id)
    if (!n) return false
    this.crescita = n
    return true
  }
  get torciaAccesa() { return this.torciaResta > 0 }
  // una torcia nuova: le stanze di sempre, e quelle in più dei pezzi ⏳
  get stanzeTorcia() { return STANZE_TORCIA + this.addosso('torcia') }

  // quanto cura una pozione: cresce col livello dell'eroe (un decimo a livello), e coi pezzi 🧪
  curaDi(k) {
    const c = COSE[k]
    if (!c || !c.cura) return 0
    return Math.round(c.cura * (1 + 0.1 * (this.livelloEroe - 1)) * (1 + this.addosso('pozioni') / 100))
  }

  // La pagina dell'eroe: le quattro caratteristiche, quanto valgono e cosa cambierebbe dando un punto (prima → dopo):
  // l'attacco se è la caratteristica dell'arma in mano, la difesa quando la tempra arriva al punto che la alza, la vita,
  // la schivata, l'energia.
  // `trattenuta`: il «+» è spento perché quella caratteristica (`dietro`) è rimasta troppo indietro (chiTrattiene);
  // `indietro`: è lei, quella che trattiene un'altra, e chiede un punto prima
  caratteristiche() {
    const tetto = this.vitaMax ?? this.vitaConLaRoba
    const dare = puntiDaDare(this.crescita) > 0
    const dietro = Object.fromEntries(CARATTERISTICHE.map(c => [c.chiave, dare ? chiTrattiene(this.crescita, c.chiave) : null]))
    const fermate = new Set(Object.values(dietro).filter(Boolean))
    return CARATTERISTICHE.map(c => {
      const prova = this.copia()
      prova.crescita = { ...this.crescita, [c.chiave]: (this.crescita[c.chiave] || 0) + 1 }
      const cambia = []
      if (prova.att !== this.att) cambia.push({ em: '⚔️', prima: this.att, dopo: prova.att })
      if (prova.dif !== this.dif) cambia.push({ em: '🛡️', prima: this.dif, dopo: prova.dif })
      const piu = prova.vitaConLaRoba - this.vitaConLaRoba
      if (piu) cambia.push({ em: '❤️', prima: tetto, dopo: tetto + piu })
      if (prova.schivata !== this.schivata) cambia.push({ em: '🌀', prima: `${this.schivata}%`, dopo: `${prova.schivata}%` })
      if (prova.energiaMax !== this.energiaMax) cambia.push({ glifo: 'energia', prima: this.energiaMax, dopo: prova.energiaMax })
      return { ...c, valore: caratteristica(this.io, this.crescita, c.chiave), dati: this.crescita[c.chiave] || 0, cambia,
               trattenuta: !!dietro[c.chiave], dietro: dietro[c.chiave], indietro: fermate.has(c.chiave) }
    })
  }

  // quanto vale tutto quello che si ha addosso, per scegliere da sé (PESI)
  punteggio() {
    let n = 0
    for (const [campo, peso] of Object.entries(PESI)) n += peso * (campo === 'att' ? this.att : campo === 'dif' ? this.dif : this.addosso(campo))
    return n
  }

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
  // `porta`: la classe lo porta (il bottino lo predilige). `posso`: anche il requisito della caratteristica è raggiunto,
  // quindi si indossa (l'utente, 9 ottobre: rigido). `requisito`: { car, serve, ha } o null
  porta(k) { return portaLa(this.io, COSE[k]) }
  requisito(k) {
    const r = requisitoDi(COSE[k])
    return r ? { ...r, ha: this.car(r.car) } : null
  }
  posso(k) {
    if (!this.porta(k)) return false
    const r = this.requisito(k)
    return !r || r.ha >= r.serve
  }
  // il livello più alto, fino a L, a cui l'eroe impugna il pezzo `k`: il mercante e la storia propongono quello, non
  // un'arma da guardare e basta (il requisito sale col livello del pezzo)
  livelloPortabile(k, L) {
    for (let l = Math.max(1, L); l > 1; l--) if (this.posso(aLivello(k, l))) return l
    return 1
  }
  perchéNo(k) {
    const classe = nonLaPorta(this.io, COSE[k])
    if (classe) return classe
    const r = this.requisito(k)
    if (!r || r.ha >= r.serve) return ''
    const nome = (CARATTERISTICHE.find(c => c.chiave === r.car) || { nome: r.car }).nome
    return `Serve ${nome} ${r.serve} (hai ${r.ha})`
  }

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

  // quante tasche ci sono: sei, e quelle comprate con le gemme (crescita.tasche, fino a TASCHE_EXTRA_MAX)
  get capienza() { return TASCHE + Math.min(TASCHE_EXTRA_MAX, (this.crescita && this.crescita.tasche) || 0) }
  // quante sono occupate (le pozioni uguali fanno un posto solo), e la lista per tasca: [{ k, n, i }]
  postiUsati(zaino = this.zaino) { return postiDello(zaino) }
  tasche() { return tascheDello(this.zaino) }
  // il posto della lista che sta sotto la tasca `t` della griglia (null se la tasca è vuota)
  indiceDellaTasca(t) { const x = this.tasche()[t]; return x ? x.i : null }
  // la tasca in più: quanto costa (null al tetto), e comprarla
  get costoTasca() { const e = (this.crescita && this.crescita.tasche) || 0; return e >= TASCHE_EXTRA_MAX ? null : prezzoTasca(e) }
  compraTasca() {
    const costo = this.costoTasca
    if (costo == null || this.gemme < costo) return false
    this.gemme -= costo
    this.crescita = { ...this.crescita, tasche: ((this.crescita && this.crescita.tasche) || 0) + 1 }
    return true
  }
  // c'è posto per `k`? Una pozione uguale a una che c'è già ci sta sempre
  cista(k) { return this.postiUsati([...this.zaino, k]) <= this.capienza }

  // in tasca se c'è posto, se no dove dice nonCiSta
  inTasca(k) {
    if (this.cista(k)) this.zaino.push(k)
    else this.nonCiSta(k)
  }

  // un salvataggio vecchio, o la roba di prima delle avventure, può avere addosso cose che la classe non porta
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
  // `delta` è il numero principale (braccio per un'arma, difesa per scudi e armature), `meglio` quanto cambia tutto
  // insieme (punteggio): un pezzo magico può parare uguale e dare vita in più
  confronto(k) {
    const c = COSE[k]
    if (!c || !c.dove) return null
    // le armi hanno due caselle: il confronto è col totale delle mani, non "uguale a quella che hai"
    const dove = c.dove === 'mano' ? this.postoDellArma(k).dove : c.dove
    const campo = c.dove === 'mano' ? 'att' : c.dove === 'corpo' || c.dove === 'mancina' ? 'dif' : 'dono'
    const prova = this.copia()
    prova.metti(dove, k)
    prova.sistemaLeMani()
    return {
      dove, campo, addosso: this.casella(dove),
      delta: campo === 'dono' ? 0 : prova[campo] - this[campo],
      meglio: Math.round((prova.punteggio() - this.punteggio()) * 100) / 100,
    }
  }

  // I numeri prima e dopo essersi messi `k` addosso, nel posto che sceglierebbe `usa` (il pannello della bottega e
  // dello zaino: «⚔️ 3 → 5»). Si prova su una copia; `bloccata` è l'arma a due mani che non lascia posto allo scudo.
  // `cambio` è il confronto pezzo contro pezzo: `toglie` sono i pezzi che il nuovo manda via dalle caselle (uno,
  // nessuno se il posto è vuoto, due se un'arma a due mani sfratta lo scudo), `vecchi` e `nuovi` quanto danno
  // all'eroe, abilità per abilità, le caselle toccate prima e dopo (la mano debole vale metà braccio)
  seLoMetto(k) {
    const c = COSE[k]
    if (!c || !c.dove || !this.posso(k)) return null
    if (c.dove === 'mancina' && this.aDueMani(this.mano)) return { dove: 'mancina', bloccata: this.mano }
    const prova = this.copia()
    const dove = c.dove === 'mano' ? prova.postoDellArma(k).dove : c.dove
    const fuori = prova.casella(dove)
    prova.metti(dove, k)
    prova.sistemaLeMani()
    // la vita è il tetto: nella discesa cresce coi piani (vitaMax), sopra è quella con la roba
    const tetto = this.vitaMax ?? this.vitaConLaRoba
    // braccio e difesa sono quelli dell'eroe (con la roba), gli altri solo quello che dà la roba
    const numeri = (x, vita) => {
      const n = {}
      for (const campo of ABILITA_CONFRONTATE)
        n[campo] = campo === 'vita' ? vita : campo === 'att' ? x.att : campo === 'dif' ? x.dif : x.addosso(campo)
      return n
    }
    return {
      dove, fuori: fuori === k ? null : fuori,
      prima: numeri(this, tetto),
      dopo: numeri(prova, tetto + prova.addosso('vita') - this.addosso('vita')),
      cambio: this.cambioCon(prova, dove),
    }
  }

  // le caselle che cambiano da qui alla copia `prova` (più `dove`, anche se il pezzo è lo stesso): chi c'era e
  // quanto dà, chi arriva e quanto dà. Le altre caselle fanno da base, così la somma delle righe è il totale che cambia
  cambioCon(prova, dove) {
    const posti = CASELLE.filter(d => d === dove || this.casella(d) !== prova.casella(d))
    const base = this.copia()
    for (const d of posti) base.metti(d, null)
    const lato = x => {
      const n = {}
      for (const campo of ABILITA_CONFRONTATE) n[campo] = x.addosso(campo) - base.addosso(campo)
      return n
    }
    return {
      dove,
      toglie: posti.map(d => this.casella(d)).filter(Boolean),
      vecchi: lato(this), nuovi: lato(prova),
    }
  }

  // una cosa migliore di quella addosso si mette da sé (vale per terra e al banco); uno scudo solo a mano libera
  vaAddosso(k) {
    const c = COSE[k]
    if (!c || !c.dove || !this.posso(k)) return false
    if (c.dove === 'mancina' && !this.mancinaLibera()) return false
    const conf = this.confronto(k)
    if (!conf.addosso) return true
    // fra due gioielli non c'è un più forte: è una scelta, e la fa chi gioca
    return c.dove !== 'dito' && conf.meglio > 0
  }

  // la torcia non va in tasca: la prima si accende, le altre aspettano alla cintura senza tetto (docs/sotterraneo/roba.md)
  accendi(k) {
    const quante = this.stanzeTorcia
    if (this.torciaAccesa) {
      this.torceInScorta++
      this.dilloDi(k, ` alla cintura · ne hai ${this.torceInScorta} di scorta`)
      return true
    }
    this.torciaResta = quante
    this.luceCambiata()
    this.dilloDi(k, ` accesa · dura ${quante} stanze`)
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
    return c && c.prezzo ? Math.max(1, Math.floor(this.prezzoDi(k) / 2)) : 0
  }

  // il prezzo pieno: un pezzo lo porta scritto (livello e rarità, dati/cose.js); una cura costa di più quanto più
  // cura, cioè col livello dell'eroe
  prezzoDi(k) {
    const c = COSE[k]
    if (!c || !c.prezzo) return 0
    return c.usa === 'cura' ? Math.round(c.prezzo * valoreDelLivello(this.livelloEroe)) : c.prezzo
  }

  // una cosa entrata adesso (comprata): addosso se è meglio, se no in tasca; la torcia si accende o va alla cintura
  prendi(k) {
    const c = COSE[k]
    if (c.usa === 'luce') { this.accendi(k); return { che: 'comprato', cosa: k, addosso: true } }
    if (this.vaAddosso(k)) {
      const conf = this.confronto(k)
      const vecchio = this.casella(conf.dove)
      // `postoDellArma` può aver scelto la mano debole: si mette lì
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
    const costa = this.quantoCosta(k)
    if (this.gemme < costa) return { che: 'niente' }
    if (this.nonCiStarebbe(k)) { this.dillo('⚠️ lo zaino è pieno'); return { che: 'pieno' } }
    this.gemme -= costa
    if (scorta) banco.roba.splice(banco.roba.indexOf(k), 1)   // il pescato è unico e se ne va; una cura no
    return this.prendi(k)
  }

  // quanto si paga al banco: il prezzo della cosa (la Bottega ci aggiunge il sovrapprezzo dei pezzi più avanti)
  quantoCosta(k) { return this.prezzoDi(k) }

  nonCiStarebbe(k) {
    const prova = this.copia()
    prova.prendi(k)
    return prova.postiUsati() > this.capienza
  }

  // dalla tasca addosso, nello zaino di sotto e in quello di sopra: quello che si aveva addosso torna in tasca, non
  // sparisce; per un'arma il posto lo sceglie `postoDellArma`. Torna null se la tasca non tiene niente da mettersi
  indossaDallaTasca(i) {
    const k = this.zaino[i]
    const c = COSE[k]
    if (!c || !c.dove) return null
    // rete sotto (chi disegna già sa `posso` e lo scrive sulla tasca): il tasto dice perché no, mai muto
    if (!this.posso(k)) { this.dillo(this.perchéNo(k)); return { che: 'niente' } }
    if (c.dove === 'mancina' && this.aDueMani(this.mano)) {
      this.dillo(`✋ ${COSE[this.mano].nome} vuole tutte e due le mani`)
      return { che: 'niente' }
    }
    const dove = c.dove === 'mano' ? this.postoDellArma(k).dove : c.dove
    const vecchio = this.casella(dove)
    this.metti(dove, k)
    this.zaino.splice(i, 1)
    if (vecchio) this.zaino.push(vecchio)
    this.sistemaLeMani()   // si vede addosso: niente avviso
    return { che: 'addosso', cosa: k }
  }

  // da addosso in tasca, se c'è posto
  riponi(dove) {
    const k = this.casella(dove)
    if (!k) return null
    if (!this.cista(k)) { this.dillo('⚠️ lo zaino è pieno'); return { che: 'pieno' } }
    this.metti(dove, null)
    this.zaino.push(k)
    return { che: 'riposta', cosa: k }
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
