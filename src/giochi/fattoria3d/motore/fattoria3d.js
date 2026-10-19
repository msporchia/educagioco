/* La Fattoria 3D: le regole, senza schermo (niente DOM, niente three, niente Vue) e senza sapere cos'è il profilo: le monete
   passano da una `borsa` che si passa da fuori ({ quante(), paga(n) }, paga(-n) incassa), e l'orologio da `ora()`.
   Tutto ciò che può non riuscire torna { ok: false, motivo } e non cambia niente; quello che riesce torna { ok: true, … }.
   Gli eventi (`prendiEventi()`) dicono cosa è successo, per i contatori. L'esperienza è la spesa in monete fatta qui dentro
   (terra, pezzi, edifici, strade; non gli spostamenti, e i rimborsi non la riducono): da lei il livello, che apre le cose. Vedi docs/fattoria3d/regole.md. */
import { GW, GH, LIM, LOTTI, idx, dentro, lottoDi, lottoPerId, lottiDelPosto, vicinoDi, FISSI, stradeDiSerie } from '../dati/mondo.js'
import { PEZZI, EDIFICI } from '../dati/catalogo.js'
import { COLTURE, TESSERE } from '../dati/colture.js'
import { RICETTE, MACCHINE, TIPI_DI_MACCHINA } from '../dati/ricette.js'
import { livelloPer, livelloDelPezzo, livelloDellaColtura, livelloDellaRicetta } from '../dati/livelli.js'
import { COSTI, LEGNA_PER_ALBERO, PECORE, MONGOLFIERA } from '../dati/regole.js'
import { generaAlberi } from '../dati/alberi.js'
import { normalizza, nuoveTessere } from './stato.js'
import { percorso } from './percorso.js'

export class Fattoria3d {
  constructor({ stato = null, borsa, ora = Date.now, rnd = Math.random } = {}) {
    this.s = normalizza(stato)
    this.borsa = borsa
    this.ora = ora
    this.rnd = rnd
    this.eventi = []
    this.alberi = generaAlberi()
    this.strada = new Uint8Array(GW * GH)          // 0 niente, 1 disegnata, 2 di serie
    for (const k of stradeDiSerie()) this.strada[k] = 2
    for (const k of this.s.strade) if (!this.strada[k]) this.strada[k] = 1
    this.bloccoFisso = new Uint8Array(GW * GH)     // fienile, casa e gli alberi in piedi
    for (const f of FISSI) for (let a = 0; a < f.w; a++) for (let b = 0; b < f.d; b++) this.bloccoFisso[idx(f.i + a, f.j + b)] = 1
    this.tagliati = new Set(this.s.tagliati)
    for (const a of this.alberi) {
      if (this.tagliati.has(a.n)) a.tagliato = true
      else if (!a.tagliato && dentro(a.i, a.j)) this.bloccoFisso[idx(a.i, a.j)] = 1
    }
    this.cellaEdificio = new Uint8Array(GW * GH)   // i posti degli edifici unici, comprati o no
    for (const e of Object.values(EDIFICI)) for (let a = 0; a < e.w; a++) for (let b = 0; b < e.d; b++) this.cellaEdificio[idx(e.slot.i + a, e.slot.j + b)] = 1
    this.cellaCosa = new Int32Array(GW * GH)       // l'id della cosa che sta su una cella, 0 = niente
    this.prove = []                                // le cose «di prova» (stress): non si salvano
    for (const c of this.s.cose) {
      if (c.tipo === 'recinto' && !c.pecore) c.pecore = this.pecoreIniziali()
      this._occupa(c, c.id)
    }
    this.tick()
  }

  // ── la borsa ──
  monete() { return this.borsa.quante() }
  _paga(n) { if (n <= 0) return true; if (this.monete() < n) return false; return this.borsa.paga(n) !== false }
  /** Paga e, se è una spesa «vera» (non uno spostamento), la conta nell'esperienza; sale di livello se serve. */
  _spendi(n) {
    if (!this._paga(n)) return false
    if (n > 0) {
      const prima = this.livello()
      this.s.esperienza += n
      const dopo = this.livello()
      if (dopo > prima) this._evento('livello', { livello: dopo })
    }
    return true
  }
  _rimborsa(n) { if (n > 0) this.borsa.paga(-n) }
  _evento(tipo, extra = {}) { this.eventi.push({ tipo, ...extra }) }
  prendiEventi() { const e = this.eventi; this.eventi = []; return e }

  // ── il livello ──
  esperienza() { return this.s.esperienza }
  livello() { return livelloPer(this.s.esperienza) }
  /** Il rifiuto di una cosa non ancora arrivata, o null se si può. */
  _chiusa(liv) { return liv > this.livello() ? { ok: false, motivo: 'non-sbloccato', liv } : null }

  // ── il terreno ──
  posseduto(l) { return !!this.s.lotti[l.id] }
  cellaPropria(i, j) { const l = lottoDi(i, j); return !!l && this.posseduto(l) }
  confina(l) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const n = vicinoDi(l, a, b); return !!n && this.posseduto(n) }) }
  prezzoLotto() { return COSTI.lottoBase + COSTI.lottoRincaro * (Object.keys(this.s.lotti).length - 9) }
  lottiMiei() { return LOTTI.filter(l => this.posseduto(l)) }
  compraLotto(id) {
    const l = lottoPerId(id)
    if (!l) return { ok: false, motivo: 'sconosciuto' }
    if (this.posseduto(l)) return { ok: false, motivo: 'gia-tuo' }
    if (!this.confina(l)) return { ok: false, motivo: 'non-confina' }
    const costo = this.prezzoLotto()
    if (!this._spendi(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this.s.lotti[l.id] = true
    this._evento('terra')
    return { ok: true, costo, lotto: l }
  }

  // ── la griglia: cosa blocca il passo e il costruire ──
  eStrada(i, j) { return dentro(i, j) ? this.strada[idx(i, j)] : 0 }
  blocca(i, j, ignora = 0) {
    if (!dentro(i, j)) return true
    const k = idx(i, j)
    if (!this.cellaPropria(i, j)) return true      // ci si chiude dentro il recinto: il terreno non tuo non si calpesta
    if (this.bloccoFisso[k] || this.cellaEdificio[k]) return true
    const c = this.cellaCosa[k]
    return c !== 0 && c !== ignora
  }
  libera(i, j) { return !this.blocca(i, j) }
  cosaSu(i, j) { const id = dentro(i, j) ? this.cellaCosa[idx(i, j)] : 0; return id ? this.cosa(id) : null }
  _occupa(c, id) {
    const d = PEZZI[c.tipo]
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) this.cellaCosa[idx(c.i + a, c.j + b)] = id
  }
  /** Il percorso (celle) da una cella alla più vicina delle mete, o null. */
  percorsoVerso(da, mete) { return percorso((i, j) => this.libera(i, j), (i, j) => this.eStrada(i, j), da, mete) }

  // ── le strade ──
  disegnaStrada(i, j, { gratis = false } = {}) {
    if (!dentro(i, j) || this.strada[idx(i, j)]) return { ok: false, motivo: 'qui-no' }
    if (this.blocca(i, j)) return { ok: false, motivo: 'occupato' }
    if (!gratis && !this._spendi(COSTI.strada)) return { ok: false, motivo: 'poche-monete', costo: COSTI.strada }
    this.strada[idx(i, j)] = 1
    this._evento('strada')
    return { ok: true, costo: gratis ? 0 : COSTI.strada }
  }
  togliStrada(i, j) {
    if (!dentro(i, j) || this.strada[idx(i, j)] !== 1) return { ok: false, motivo: 'qui-no' }
    this.strada[idx(i, j)] = 0
    return { ok: true }
  }

  // ── i pezzi ──
  get cose() { return [...this.s.cose, ...this.prove] }
  cosa(id) { return this.s.cose.find(c => c.id === id) || this.prove.find(c => c.id === id) || null }
  misure(tipo) { return PEZZI[tipo] || EDIFICI[tipo] }
  prezzoPezzo(tipo) {
    const d = PEZZI[tipo]
    return d.prezzo + d.rincaro * (this.s.cose.filter(c => c.tipo === tipo).length + (this.s.magazzino[tipo] || 0))
  }
  nelMagazzino(tipo) { return this.s.magazzino[tipo] || 0 }
  compraPezzo(tipo) {
    if (!PEZZI[tipo]) return { ok: false, motivo: 'sconosciuto' }
    const chiuso = this._chiusa(livelloDelPezzo(tipo))
    if (chiuso) return chiuso
    const costo = this.prezzoPezzo(tipo)
    if (!this._spendi(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this.s.magazzino[tipo] = this.nelMagazzino(tipo) + 1
    return { ok: true, costo }
  }
  /** Si può mettere un pezzo di quel tipo con l'angolo in (i, j)? `ignora`: l'id della cosa che si sta spostando. */
  puoMettere(tipo, i, j, ignora = 0) {
    const d = PEZZI[tipo]
    if (!d) return { ok: false, motivo: 'sconosciuto' }
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) {
      if (!this.cellaPropria(i + a, j + b)) return { ok: false, motivo: 'fuori-terreno' }
      if (this.blocca(i + a, j + b, ignora)) return { ok: false, motivo: 'occupato' }
    }
    return { ok: true }
  }
  mettiPezzo(tipo, i, j) {
    if (!(this.nelMagazzino(tipo) > 0)) return { ok: false, motivo: 'non-in-magazzino' }
    const p = this.puoMettere(tipo, i, j)
    if (!p.ok) return p
    const c = { id: this.s.prossimoId++, tipo, i, j }
    if (tipo === 'campo') c.tile = nuoveTessere()
    if (tipo === 'recinto') { c.pecore = this.pecoreIniziali(); c.cibo = 0 }
    this.s.magazzino[tipo]--
    if (!this.s.magazzino[tipo]) delete this.s.magazzino[tipo]
    this.s.cose.push(c); this._occupa(c, c.id)
    this._evento('pezzo', { tipo })
    return { ok: true, cosa: c }
  }
  pecoreIniziali() { return [{ eta: 'adulta', t0: this.ora() }, { eta: 'agnello', cibo: 0 }] }
  spostaPezzo(id, i, j, { gratis = false } = {}) {
    const c = this.cosa(id)
    if (!c) return { ok: false, motivo: 'sconosciuto' }
    if (c.i === i && c.j === j) return { ok: true, costo: 0 }
    const p = this.puoMettere(c.tipo, i, j, id)
    if (!p.ok) return p
    const costo = gratis || c.prova ? 0 : COSTI.spostare
    if (!this._paga(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this._libera(c); c.i = i; c.j = j; this._occupa(c, c.id)
    return { ok: true, costo }
  }
  _libera(c) {
    const d = PEZZI[c.tipo]
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) this.cellaCosa[idx(c.i + a, c.j + b)] = 0
  }
  /** Rimette un pezzo nel magazzino. Un campo che sta crescendo e un recinto con le pecore non si mettono via. */
  mettiVia(id, { gratis = false, forza = false } = {}) {
    const c = this.cosa(id)
    if (!c) return { ok: false, motivo: 'sconosciuto' }
    if (!forza && c.tile && c.tile.some(t => t !== null)) return { ok: false, motivo: 'sta-crescendo' }
    if (!forza && c.pecore) return { ok: false, motivo: 'ha-le-pecore' }
    const costo = gratis ? 0 : COSTI.spostare
    if (!this._paga(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this._libera(c)
    this.s.cose = this.s.cose.filter(x => x.id !== id)
    this.prove = this.prove.filter(x => x.id !== id)
    this.s.magazzino[c.tipo] = this.nelMagazzino(c.tipo) + 1
    return { ok: true, costo }
  }
  /** Il rimborso di un'azione annullata (la monetina dello spostamento). */
  rimborsa(n) { this._rimborsa(n) }

  // ── gli edifici unici ──
  edificio(tipo) { return { tipo, ...EDIFICI[tipo], posseduto: !!this.s.posseduti[tipo] } }
  /** I lotti che il posto dell'edificio tocca e che non sono ancora tuoi (da comprare prima). */
  lottiMancanti(tipo) {
    const e = EDIFICI[tipo]
    return e ? lottiDelPosto(e.slot.i, e.slot.j, e.w, e.d).filter(l => !this.posseduto(l)).map(l => l.id) : []
  }
  compraEdificio(tipo) {
    const e = EDIFICI[tipo]
    if (!e) return { ok: false, motivo: 'sconosciuto' }
    if (this.s.posseduti[tipo]) return { ok: false, motivo: 'gia-tuo' }
    const chiuso = this._chiusa(e.liv)
    if (chiuso) return chiuso
    const lotti = this.lottiMancanti(tipo)
    if (lotti.length) return { ok: false, motivo: 'lotto-non-tuo', lotti, costo: e.prezzo }
    if (!this._spendi(e.prezzo)) return { ok: false, motivo: 'poche-monete', costo: e.prezzo }
    this.s.posseduti[tipo] = true
    this._evento('pezzo', { tipo })
    return { ok: true, costo: e.prezzo }
  }

  // ── i raccolti e le scorte ──
  totScorte() { return Object.values(this.s.merci).reduce((a, n) => a + n, 0) }
  /** Toglie n raccolti qualsiasi, dalla scorta più grande: per tutto ciò che «mangia» un raccolto. */
  consuma(n) {
    if (this.totScorte() < n) return false
    for (let k = 0; k < n; k++) { const [c] = Object.entries(this.s.merci).sort((a, b) => b[1] - a[1])[0]; this.s.merci[c]-- }
    return true
  }

  // ── i campi ──
  msDi(c) { return COLTURE[c.coltura || 'grano'].ms }
  /** Quattro numeri: -1 vuota, 0..1 cresce, 1 matura. */
  crescita(c) { const t = this.ora(); return c.tile.map(x => x === null ? -1 : Math.max(0, Math.min(1, (t - x) / this.msDi(c)))) }
  campoVuoto(c) { return c.tile.every(x => x === null) }
  campoMaturo(c) { return this.crescita(c).some(x => x >= 1) }
  restoSecondi(c) {
    const cr = this.crescita(c).filter(x => x >= 0)
    return cr.length ? Math.ceil((1 - Math.max(...cr)) * this.msDi(c) / 1000) : 0
  }
  semina(id, coltura) {
    const c = this.cosa(id)
    if (!c || c.tipo !== 'campo') return { ok: false, motivo: 'sconosciuto' }
    if (!COLTURE[coltura]) return { ok: false, motivo: 'coltura' }
    if (!this.campoVuoto(c)) return { ok: false, motivo: 'non-vuoto' }
    const chiuso = this._chiusa(livelloDellaColtura(coltura))
    if (chiuso) return chiuso
    const t = this.ora()
    c.coltura = coltura; c.tile = Array.from({ length: TESSERE }, () => t)
    return { ok: true }
  }
  seminaCampo(id, coltura) { return this.semina(id, coltura) }
  colturaSbloccata(coltura) { return livelloDellaColtura(coltura) <= this.livello() }
  raccogliTessera(id, k) {
    const c = this.cosa(id)
    if (!c || c.tipo !== 'campo' || c.tile[k] === null) return { ok: false, motivo: 'vuota' }
    if (this.crescita(c)[k] < 1) return { ok: false, motivo: 'non-matura' }
    const coltura = c.coltura || 'grano'
    c.tile[k] = null; this.s.merci[coltura]++
    this._evento('raccolto', { coltura })
    return { ok: true, coltura }
  }

  // ── gli alberi ──
  puoAbbattere(n) {
    const a = this.alberi[n]
    if (!a) return { ok: false, motivo: 'sconosciuto' }
    if (!a.tagliabile) return { ok: false, motivo: 'bosco' }
    if (a.tagliato) return { ok: false, motivo: 'gia-tagliato' }
    if (!this.cellaPropria(a.i, a.j)) return { ok: false, motivo: 'fuori-terreno' }
    return { ok: true }
  }
  abbatti(n) {
    const p = this.puoAbbattere(n)
    if (!p.ok) return p
    const a = this.alberi[n]
    a.tagliato = true; this.tagliati.add(n); this.s.tagliati.push(n)
    this.bloccoFisso[idx(a.i, a.j)] = 0
    this.s.legna += LEGNA_PER_ALBERO
    this._evento('albero')
    return { ok: true, legna: LEGNA_PER_ALBERO }
  }
  alberiNelTerreno() { return this.alberi.filter(a => a.tagliabile && !a.tagliato && this.cellaPropria(a.i, a.j)) }

  // ── le pecore ──
  lanaPronta(c) { const t = this.ora(); return c.pecore.filter(p => p.eta === 'adulta' && t - p.t0 >= PECORE.laneMs) }
  _adulte(c) { return c.pecore.filter(p => p.eta === 'adulta').length }
  curaNecessaria(c) {
    return this.lanaPronta(c).length > 0 || c.pecore.some(p => p.eta === 'agnello') || (this._adulte(c) >= 2 && c.pecore.length < PECORE.max)
  }
  /** Cosa si farebbe toccando il recinto: prima si tosa, poi si nutre (se c'è da nutrire e un raccolto). Niente cambia. */
  provaCura(id) {
    const c = this.cosa(id)
    if (!c || c.tipo !== 'recinto') return { azione: null, motivo: 'sconosciuto' }
    if (this.lanaPronta(c).length) return { azione: 'tosa' }
    if (c.pecore.some(p => p.eta === 'agnello') || (this._adulte(c) >= 2 && c.pecore.length < PECORE.max)) {
      return this.totScorte() >= 1 ? { azione: 'nutri' } : { azione: null, motivo: 'manca-raccolto' }
    }
    const t = this.ora(), resti = c.pecore.filter(p => p.eta === 'adulta').map(p => PECORE.laneMs - (t - p.t0))
    return resti.length ? { azione: null, motivo: 'lana-ricresce', secondi: Math.ceil(Math.min(...resti) / 1000) } : { azione: null, motivo: 'sazie' }
  }
  tosa(id) {
    const c = this.cosa(id), pronte = c ? this.lanaPronta(c) : []
    if (!pronte.length) return { ok: false, motivo: 'non-pronta' }
    const t = this.ora()
    for (const p of pronte) p.t0 = t
    this.s.lana += pronte.length
    this._evento('tosa', { n: pronte.length })
    return { ok: true, n: pronte.length }
  }
  /** Un pasto: l'agnello cresce dopo due, due adulte ne fanno nascere uno. Torna cosa è successo. */
  nutri(id) {
    const c = this.cosa(id)
    const p = this.provaCura(id)
    if (!c || p.azione !== 'nutri') return { ok: false, motivo: p.motivo || 'niente-da-fare' }
    if (!this.consuma(1)) return { ok: false, motivo: 'manca-raccolto' }
    const agnello = c.pecore.find(x => x.eta === 'agnello')
    if (agnello) {
      agnello.cibo = (agnello.cibo || 0) + 1
      if (agnello.cibo >= PECORE.pastiPerCrescere) { agnello.eta = 'adulta'; agnello.t0 = this.ora(); delete agnello.cibo; return { ok: true, evento: 'cresciuta' } }
      return { ok: true, evento: 'pasto' }
    }
    c.cibo = (c.cibo || 0) + 1
    if (c.cibo >= PECORE.pastiPerNascere) { c.cibo = 0; c.pecore.push({ eta: 'agnello', cibo: 0 }); return { ok: true, evento: 'nata' } }
    return { ok: true, evento: 'cuore' }
  }

  // ── le macchine: pasticceria, mulino, panificio, conserviera, gelateria. Tre posti nel forno, si cuoce uno alla volta ──
  /** Cosa c'è in scorta per una ricetta: un raccolto (merci) o il prodotto di un'altra macchina (prodotti). */
  scortaDi(k) { return COLTURE[k] ? this.s.merci[k] : (this.s.prodotti[k] || 0) }
  _togli(k, n) { if (COLTURE[k]) this.s.merci[k] -= n; else { this.s.prodotti[k] -= n; if (!this.s.prodotti[k]) delete this.s.prodotti[k] } }
  ingredientiOk(ric) { return Object.entries(RICETTE[ric].ing).every(([k, n]) => this.scortaDi(k) >= n) }
  /** Quel che manca per una ricetta: { chiave: quanti }. */
  mancano(ric) {
    const out = {}
    for (const [k, n] of Object.entries(RICETTE[ric].ing)) if (this.scortaDi(k) < n) out[k] = n - this.scortaDi(k)
    return out
  }
  /** La macchina di un tipo: i posti, la coda e i pronti (vivi: sono lo stato). */
  macchina(tipo) {
    const m = MACCHINE[tipo]
    if (!m) return null
    const q = this.s.macchine[tipo]
    return { tipo, posti: m.posti, posseduta: !!this.s.posseduti[tipo], coda: q.coda, pronti: q.pronti }
  }
  /** Le ricette di una macchina, con il livello vero, se sono aperte e se ora si possono avviare. */
  ricetteDi(tipo) {
    const m = MACCHINE[tipo]
    if (!m) return []
    return Object.entries(m.ricette).map(([id, r]) => {
      const liv = livelloDellaRicetta(id)
      return { id, nome: r.nome, emoji: r.emoji, ing: r.ing, ms: r.ms, liv, sbloccata: liv <= this.livello(), ingredienti: this.ingredientiOk(id), mancano: this.mancano(id) }
    })
  }
  avviaRicettaIn(tipo, ric) {
    const m = MACCHINE[tipo], r = RICETTE[ric]
    if (!m || !r || r.dove !== tipo) return { ok: false, motivo: 'sconosciuta' }
    if (!this.s.posseduti[tipo]) return { ok: false, motivo: 'non-tua' }
    const chiuso = this._chiusa(livelloDellaRicetta(ric))
    if (chiuso) return chiuso
    const Q = this.s.macchine[tipo]
    if (Q.coda.length >= m.posti) return { ok: false, motivo: 'forno-pieno' }
    if (!this.ingredientiOk(ric)) return { ok: false, motivo: 'mancano-ingredienti', mancano: this.mancano(ric) }
    for (const [k, n] of Object.entries(r.ing)) this._togli(k, n)
    Q.coda.push({ ric, fine: null })
    this.tick()
    return { ok: true }
  }
  /** La ricetta, nella macchina a cui appartiene. */
  avviaRicetta(ric) { return RICETTE[ric] ? this.avviaRicettaIn(RICETTE[ric].dove, ric) : { ok: false, motivo: 'sconosciuta' } }
  ritiraDa(tipo) {
    const Q = this.s.macchine[tipo]
    if (!Q) return { ok: false, motivo: 'sconosciuta' }
    let n = 0
    for (const [k, q] of Object.entries(Q.pronti)) { this.s.prodotti[k] = (this.s.prodotti[k] || 0) + q; n += q; this._evento('prodotto', { ric: k, n: q, macchina: tipo }) }
    Q.pronti = {}
    return n ? { ok: true, n } : { ok: false, motivo: 'niente' }
  }
  prontiIn(tipo) { return Object.values(this.s.macchine[tipo].pronti).reduce((a, n) => a + n, 0) }
  // le vecchie chiamate della pasticceria, che la scena e la vista usano ancora
  prepara(ric) { return this.avviaRicettaIn('pasticceria', ric) }
  ritira() { return this.ritiraDa('pasticceria') }
  prontiInForno() { return this.prontiIn('pasticceria') }

  // ── la mongolfiera ──
  carica() {
    const M = this.s.mongolfiera
    if (!this.s.posseduti.mongolfiera) return { ok: false, motivo: 'non-tua' }
    if (M.cassa) return { ok: false, motivo: 'cassa-da-ritirare' }
    if (M.fine) return { ok: false, motivo: 'in-viaggio' }
    if (!this.consuma(MONGOLFIERA.carico)) return { ok: false, motivo: 'manca-raccolto' }
    M.fine = this.ora() + MONGOLFIERA.viaggioMs
    return { ok: true }
  }
  ritiraCassa() {
    const M = this.s.mongolfiera
    if (!M.cassa) return { ok: false, motivo: 'niente' }
    M.cassa = false; this.s.lana += MONGOLFIERA.premioLana
    return { ok: true, lana: MONGOLFIERA.premioLana }
  }

  // ── il tempo: la cottura che avanza e la mongolfiera che torna (si può chiamare quando si vuole) ──
  tick() {
    const t = this.ora(); let cambiato = false
    for (const tipo of TIPI_DI_MACCHINA) {
      const Q = this.s.macchine[tipo]
      while (Q.coda.length && Q.coda[0].fine && Q.coda[0].fine <= t) {
        const r = Q.coda.shift(); Q.pronti[r.ric] = (Q.pronti[r.ric] || 0) + 1; cambiato = true
        if (Q.coda[0]) Q.coda[0].fine = r.fine + RICETTE[Q.coda[0].ric].ms     // il successivo parte quando finisce il precedente
      }
      if (Q.coda[0] && !Q.coda[0].fine) Q.coda[0].fine = t + RICETTE[Q.coda[0].ric].ms
    }
    const M = this.s.mongolfiera
    if (M.fine && t >= M.fine) { M.fine = null; M.cassa = true; cambiato = true }
    return cambiato
  }

  /** Quante cose aspettano semina e raccolta: i numeri sui tasti. */
  daFare() {
    let semina = 0, raccogli = 0
    for (const c of this.s.cose) if (c.tipo === 'campo') { if (this.campoVuoto(c)) semina++; else if (this.campoMaturo(c)) raccogli++ }
    return { semina, raccogli }
  }

  // ── le prove di stress: tante cose in più, che non si salvano ──
  aggiungiProve(tipo, n) {
    const d = PEZZI[tipo]
    if (!d) return 0
    const posti = []
    for (let i = LIM.i0 + 1; i + d.w < LIM.i1; i += d.w + 1) for (let j = LIM.j0 + 1; j + d.d < LIM.j1; j += d.d + 1) posti.push([i, j])
    posti.sort(() => this.rnd() - 0.5)
    let fatti = 0
    for (const [i, j] of posti) {
      if (fatti >= n) break
      let ok = true
      for (let a = -1; a <= d.w && ok; a++) for (let b = -1; b <= d.d && ok; b++) if (this.blocca(i + a, j + b)) ok = false
      if (!ok) continue
      const c = { id: this.s.prossimoId++, tipo, i, j, prova: true }
      if (tipo === 'campo') {
        const col = Object.keys(COLTURE)[Math.floor(this.rnd() * Object.keys(COLTURE).length)], t0 = this.ora() - this.rnd() * COLTURE[col].ms * 1.1
        c.coltura = col; c.tile = Array.from({ length: TESSERE }, () => t0)
      }
      if (tipo === 'recinto') { c.pecore = this.pecoreIniziali(); c.cibo = 0 }
      this.prove.push(c); this._occupa(c, c.id); fatti++
    }
    return fatti
  }
  togliProve() { for (const c of this.prove) this._libera(c); const n = this.prove.length; this.prove = []; return n }

  // ── il salvataggio ──
  serializza() {
    const s = this.s
    this.tick()
    s.strade = []
    for (let k = 0; k < this.strada.length; k++) if (this.strada[k] === 1) s.strade.push(k)
    return JSON.parse(JSON.stringify(s))
  }
}

