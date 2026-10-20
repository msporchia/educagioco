/* La Fattoria 3D: le regole, senza schermo (niente DOM, niente three, niente Vue) e senza sapere cos'è il profilo: le monete
   passano da una `borsa` che si passa da fuori ({ quante(), paga(n) }, paga(-n) incassa), e l'orologio da `ora()`.
   Tutto ciò che può non riuscire torna { ok: false, motivo } e non cambia niente; quello che riesce torna { ok: true, … }.
   Gli eventi (`prendiEventi()`) dicono cosa è successo, per i contatori. L'esperienza è la spesa in monete fatta qui dentro
   (terra, pezzi, edifici, strade; non gli spostamenti, e i rimborsi non la riducono): da lei il livello, che apre le cose. Vedi docs/fattoria3d/regole.md. */
import { GW, GH, LIM, LOTTI, idx, dentro, lottoDi, lottoPerId, lottiDelPosto, vicinoDi, FISSI, stradeDiSerie } from '../dati/mondo.js'
import { PEZZI, EDIFICI, quotaDelPezzo } from '../dati/catalogo.js'
import { COLTURE, TESSERE } from '../dati/colture.js'
import { RICETTE, MACCHINE, TIPI_DI_MACCHINA } from '../dati/ricette.js'
import { livelloPer, livelloDelPezzo, livelloDellaColtura, livelloDellaRicetta } from '../dati/livelli.js'
import { COSTI, PECORE } from '../dati/regole.js'
import { generaAlberi } from '../dati/alberi.js'
import { generaOstacoli } from '../dati/ostacoli.js'
import { ANIMALI, CORTILE, LANA, prezzoDellaBestia } from '../dati/animali.js'
import { normalizza, nuoveTessere } from './stato.js'
import { percorso } from './percorso.js'
import { POSTI, RIPOSO_MS, LIVELLO_BANCO, PEZZI_DEL_BANCO, clienteDi, tipoDelOrdine } from '../dati/ordini.js'
import { nuovoOrdine } from './ordini.js'
import { vistaDellaMongolfiera, caricaLaCassa, partiLaMongolfiera, aggiornaMongolfiera } from './mongolfiera.js'

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
    this.bloccoFisso = new Uint8Array(GW * GH)     // fienile, casa, gli alberi in piedi e i sassi e cespugli ancora lì
    for (const f of FISSI) for (let a = 0; a < f.w; a++) for (let b = 0; b < f.d; b++) this.bloccoFisso[idx(f.i + a, f.j + b)] = 1
    this.tagliati = new Set(this.s.tagliati)
    for (const a of this.alberi) {
      if (this.tagliati.has(a.n)) a.tagliato = true
      else if (!a.tagliato && dentro(a.i, a.j)) this.bloccoFisso[idx(a.i, a.j)] = 1
    }
    this.ostacoli = generaOstacoli()
    this.tolti = new Set(this.s.ostacoli)
    for (const o of this.ostacoli) {
      if (this.tolti.has(o.id)) o.tolto = true
      else this.bloccoFisso[o.id] = 1
    }
    this.cellaEdificio = new Uint8Array(GW * GH)   // i posti degli edifici unici, comprati o no
    for (const e of Object.values(EDIFICI)) for (let a = 0; a < e.w; a++) for (let b = 0; b < e.d; b++) this.cellaEdificio[idx(e.slot.i + a, e.slot.j + b)] = 1
    this.cellaCosa = new Int32Array(GW * GH)       // l'id della cosa che sta su una cella, 0 = niente
    this.cellaPasso = new Float32Array(GW * GH)    // > 0 dove sta un pezzo calpestabile (ponte, passerella): di quanto alza chi ci cammina
    this.prove = []                                // le cose «di prova» (stress): non si salvano
    for (const c of this.s.cose) {
      if (c.tipo === 'recinto' && !c.pecore) c.pecore = this.pecoreIniziali()
      if (ANIMALI[c.tipo] && !c.bestie) c.bestie = this.bestieIniziali()
      this._occupa(c, c.id)
    }
    // un salvataggio di prima può avere un pezzo o una strada dove ora c'è un sasso: il sasso sparisce (gratis, e per sempre)
    for (const o of this.ostacoli) if (!o.tolto && (this.cellaCosa[o.id] || this.strada[o.id])) this._togliSenzaPagare(o)
    this.tick()
  }

  // ── la borsa ──
  monete() { return this.borsa.quante() }
  _paga(n) { if (n <= 0) return true; if (this.monete() < n) return false; return this.borsa.paga(n) !== false }
  /** Paga e, se è una spesa «vera» (non uno spostamento), la conta nell'esperienza; sale di livello se serve. */
  _spendi(n) {
    if (!this._paga(n)) return false
    if (n > 0) this._guadagna(n)
    return true
  }
  /** L'esperienza sale (di una spesa o di una consegna); se passa una soglia c'è l'evento `livello`. */
  _guadagna(n) {
    const prima = this.livello()
    this.s.esperienza += n
    const dopo = this.livello()
    if (dopo > prima) this._evento('livello', { livello: dopo })
  }
  _rimborsa(n) { if (n > 0) this.borsa.paga(-n) }
  _evento(tipo, extra = {}) { this.eventi.push({ ...extra, tipo }) }          // il `tipo` dell'evento vince su un campo omonimo (prima 'pezzo' diventava 'campo' e il contatore non saliva)
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
  /** Il passo: come `blocca`, ma un pezzo calpestabile (ponte, passerella) non ferma chi cammina. Il costruire usa `blocca`. */
  libera(i, j) {
    if (!dentro(i, j)) return false
    const k = idx(i, j)
    return this.cellaPasso[k] > 0 ? this.cellaPropria(i, j) : !this.blocca(i, j)
  }
  /** Una cella dove si cammina in fretta: la strada, o un pezzo calpestabile (conta come strada nel percorso). */
  sullaStrada(i, j) { return dentro(i, j) && (this.strada[idx(i, j)] > 0 || this.cellaPasso[idx(i, j)] > 0) }
  /** Di quanto si alza chi sta in quel punto (0 per terra, > 0 su un ponte o una passerella). */
  quotaPasso(x, z) { const i = Math.floor(x), j = Math.floor(z); return dentro(i, j) ? this.cellaPasso[idx(i, j)] : 0 }
  cosaSu(i, j) { const id = dentro(i, j) ? this.cellaCosa[idx(i, j)] : 0; return id ? this.cosa(id) : null }
  _occupa(c, id) {
    const d = PEZZI[c.tipo]
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) { this.cellaCosa[idx(c.i + a, c.j + b)] = id; this.cellaPasso[idx(c.i + a, c.j + b)] = quotaDelPezzo(d, a, b) }
  }
  /** Il percorso (celle) da una cella alla più vicina delle mete, o null. */
  percorsoVerso(da, mete) { return percorso((i, j) => this.libera(i, j), (i, j) => this.sullaStrada(i, j), da, mete) }

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
    if (ANIMALI[tipo]) c.bestie = this.bestieIniziali()
    this.s.magazzino[tipo]--
    if (!this.s.magazzino[tipo]) delete this.s.magazzino[tipo]
    this.s.cose.push(c); this._occupa(c, c.id)
    this._evento('pezzo', { pezzo: tipo })
    return { ok: true, cosa: c }
  }
  /** Quanto costa mettere ora un pezzo di quel tipo: 0 se è già pagato (nel magazzino). */
  costoDiMettere(tipo) { return this.nelMagazzino(tipo) > 0 ? 0 : this.prezzoPezzo(tipo) }
  /** Si può pagare e mettere qui? Come `puoMettere`, più il livello e le monete: per il fantasma rosso. */
  puoCompraEMettere(tipo, i, j) {
    const p = this.puoMettere(tipo, i, j)
    if (!p.ok) return p
    const chiuso = this._chiusa(livelloDelPezzo(tipo))
    if (chiuso) return chiuso
    const costo = this.costoDiMettere(tipo)
    if (costo > this.monete()) return { ok: false, motivo: 'poche-monete', costo }
    return { ok: true, costo }
  }
  /** Compra (se non è già nel magazzino) e mette in un solo gesto. Se qualcosa non va non cambia niente e non si paga. */
  compraEMetti(tipo, i, j) {
    const p = this.puoCompraEMettere(tipo, i, j)
    if (!p.ok) return p
    if (!(this.nelMagazzino(tipo) > 0)) {
      const c = this.compraPezzo(tipo)
      if (!c.ok) return c
    }
    const r = this.mettiPezzo(tipo, i, j)
    return r.ok ? { ...r, costo: p.costo } : r
  }
  bestieIniziali() { return [{ fine: null }] }          // una gallina o una mucca sono nel prezzo, con fame
  pecoreIniziali() { return [{ eta: 'adulta', t0: null }] }                      // una pecora è nel prezzo del recinto, con fame come una gallina nel pollaio
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
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) { this.cellaCosa[idx(c.i + a, c.j + b)] = 0; this.cellaPasso[idx(c.i + a, c.j + b)] = 0 }
  }
  /** Rimette un pezzo nel magazzino. Un campo che sta crescendo e un recinto con le pecore non si mettono via. */
  mettiVia(id, { gratis = false, forza = false } = {}) {
    const c = this.cosa(id)
    if (!c) return { ok: false, motivo: 'sconosciuto' }
    if (!forza && c.tile && c.tile.some(t => t !== null)) return { ok: false, motivo: 'sta-crescendo' }
    if (!forza && c.pecore) return { ok: false, motivo: 'ha-le-pecore' }
    if (!forza && c.bestie) return { ok: false, motivo: 'ha-le-bestie' }
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
    this._evento('pezzo', { pezzo: tipo })
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
  /** Un colpo d'ascia costa `COSTI.albero`: senza monete rifiuta e non cambia niente. */
  abbatti(n) {
    const p = this.puoAbbattere(n)
    if (!p.ok) return p
    if (!this._spendi(COSTI.albero)) return { ok: false, motivo: 'poche-monete', costo: COSTI.albero }
    const a = this.alberi[n]
    a.tagliato = true; this.tagliati.add(n); this.s.tagliati.push(n)
    this.bloccoFisso[idx(a.i, a.j)] = 0
    this._evento('albero')
    return { ok: true, costo: COSTI.albero }
  }
  alberiNelTerreno() { return this.alberi.filter(a => a.tagliabile && !a.tagliato && this.cellaPropria(a.i, a.j)) }

  // ── i sassi e i cespugli: pochi per lotto, restano anche dopo l'acquisto; si tolgono toccandoli, 🪙 1 l'uno ──
  ostacoloSu(i, j) { const o = dentro(i, j) ? this.ostacoli.find(x => x.id === idx(i, j)) : null; return o && !o.tolto ? o : null }
  puoTogliere(n) {
    const o = this.ostacoli[n]
    if (!o) return { ok: false, motivo: 'sconosciuto' }
    if (o.tolto) return { ok: false, motivo: 'gia-tolto' }
    if (!this.cellaPropria(o.i, o.j)) return { ok: false, motivo: 'fuori-terreno' }
    return { ok: true }
  }
  togliOstacolo(n) {
    const p = this.puoTogliere(n)
    if (!p.ok) return p
    if (!this._spendi(COSTI.ostacolo)) return { ok: false, motivo: 'poche-monete', costo: COSTI.ostacolo }
    const o = this.ostacoli[n]
    this._togliSenzaPagare(o)
    this._evento('sasso')
    return { ok: true, costo: COSTI.ostacolo, tipo: o.tipo }
  }
  _togliSenzaPagare(o) { o.tolto = true; this.tolti.add(o.id); if (!this.s.ostacoli.includes(o.id)) this.s.ostacoli.push(o.id); this.bloccoFisso[o.id] = 0 }
  ostacoliNelTerreno() { return this.ostacoli.filter(o => !o.tolto && this.cellaPropria(o.i, o.j)) }

  // ── le pecore: dopo la tosa hanno fame (`t0: null`); il pasto fa partire la lana (`t0` = quando ha mangiato) ──
  lanaPronta(c) { const t = this.ora(); return c.pecore.filter(p => p.eta === 'adulta' && p.t0 != null && t - p.t0 >= PECORE.laneMs) }
  /** Le adulte tosate che aspettano da mangiare (senza lana in crescita). */
  pecoreAffamate(c) { return c.pecore.filter(p => p.eta === 'adulta' && p.t0 == null) }
  _adulte(c) { return c.pecore.filter(p => p.eta === 'adulta').length }
  _pastoAlRecinto(c) { return c.pecore.some(p => p.eta === 'agnello') || (this._adulte(c) >= 2 && c.pecore.length < PECORE.max) }
  curaNecessaria(c) {
    return this.lanaPronta(c).length > 0 || this.pecoreAffamate(c).length > 0 || this._pastoAlRecinto(c)
  }
  /** Cosa si farebbe toccando il recinto: prima si tosa, poi si nutre (le affamate, poi l'agnello o la nascita, se c'è un raccolto). Niente cambia. */
  provaCura(id) {
    const c = this.cosa(id)
    if (!c || c.tipo !== 'recinto') return { azione: null, motivo: 'sconosciuto' }
    if (this.lanaPronta(c).length) return { azione: 'tosa' }
    const fame = this.pecoreAffamate(c).length
    if (fame) {
      const quante = Math.min(fame, Math.floor(this.totScorte() / PECORE.pastiPerLana))
      return quante ? { azione: 'nutri', n: quante } : { azione: null, motivo: 'manca-raccolto' }
    }
    if (this._pastoAlRecinto(c)) return this.totScorte() >= 1 ? { azione: 'nutri' } : { azione: null, motivo: 'manca-raccolto' }
    const t = this.ora(), resti = c.pecore.filter(p => p.eta === 'adulta' && p.t0 != null).map(p => PECORE.laneMs - (t - p.t0))
    return resti.length ? { azione: null, motivo: 'lana-ricresce', secondi: Math.ceil(Math.max(0, Math.min(...resti)) / 1000) } : { azione: null, motivo: 'sazie' }
  }
  /** La tosa: la lana passa alla scorta e la pecora ha fame (`t0: null`) finché non mangia. */
  tosa(id) {
    const c = this.cosa(id), pronte = c ? this.lanaPronta(c) : []
    if (!pronte.length) return { ok: false, motivo: 'non-pronta' }
    for (const p of pronte) p.t0 = null
    this.s.lana += pronte.length
    this._evento('tosa', { n: pronte.length })
    return { ok: true, n: pronte.length }
  }
  /** Un pasto: alle tosate (ognuna, finché c'è da mangiare: parte la lana); poi l'agnello cresce dopo due, due adulte ne fanno nascere uno. Torna cosa è successo. */
  nutri(id) {
    const c = this.cosa(id)
    const p = this.provaCura(id)
    if (!c || p.azione !== 'nutri') return { ok: false, motivo: p.motivo || 'niente-da-fare' }
    if (this.pecoreAffamate(c).length) {
      let n = 0
      for (const x of this.pecoreAffamate(c)) {
        if (!this.consuma(PECORE.pastiPerLana)) break
        x.t0 = this.ora(); n++
      }
      return n ? { ok: true, evento: 'lana', n } : { ok: false, motivo: 'manca-raccolto' }
    }
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

  // ── gli animali da cortile: il pollaio (uova) e la stalla (latte). Una bestia nutrita fa il suo prodotto dopo un tempo e
  //    poi lo tiene finché non lo si raccoglie; niente muore, niente marcisce (docs/fattoria3d/animali.md) ──
  /** La bestia è al lavoro (`fine` nel futuro), pronta (`fine` passata) o ha fame (`fine` null). */
  statoBestia(b) { return b.fine === null ? 'fame' : b.fine <= this.ora() ? 'pronta' : 'lavora' }
  bestiePronte(c) { return c.bestie.filter(b => this.statoBestia(b) === 'pronta') }
  bestieAffamate(c) { return c.bestie.filter(b => b.fine === null) }
  /** Cosa c'è da mangiare per questa bestia: i raccolti che mangia, sommati. */
  scortaDaMangiare(tipo) { return ANIMALI[tipo].mangia.reduce((n, k) => n + this.s.merci[k], 0) }
  /** Toglie n raccolti fra quelli che mangia la bestia, dalla scorta più grande. */
  _consumaTra(chiavi, n) {
    if (chiavi.reduce((a, k) => a + this.s.merci[k], 0) < n) return false
    for (let k = 0; k < n; k++) { const c = chiavi.slice().sort((a, b) => this.s.merci[b] - this.s.merci[a])[0]; this.s.merci[c]-- }
    return true
  }
  /** Cosa si farebbe toccando il pollaio o la stalla: prima si raccoglie, poi si nutre. Niente cambia. */
  provaCuraBestie(id) {
    const c = this.cosa(id)
    if (!c || !c.bestie) return { azione: null, motivo: 'sconosciuto' }
    const A = ANIMALI[c.tipo], pronte = this.bestiePronte(c).length
    if (pronte) return { azione: 'raccogli', n: pronte }
    const fame = this.bestieAffamate(c).length
    if (fame) {
      const quante = Math.min(fame, Math.floor(this.scortaDaMangiare(c.tipo) / A.pasti))
      return quante ? { azione: 'nutri', n: quante } : { azione: null, motivo: 'manca-raccolto', servono: A.pasti, mangia: A.mangia.slice() }
    }
    const t = this.ora(), resto = Math.min(...c.bestie.map(b => b.fine - t))
    return { azione: null, motivo: 'lavora', secondi: Math.ceil(Math.max(0, resto) / 1000) }
  }
  /** Dà da mangiare a tutte le bestie che hanno fame, finché c'è da mangiare: ognuna comincia il suo lavoro. */
  nutriBestie(id) {
    const p = this.provaCuraBestie(id)
    if (p.azione !== 'nutri') return { ok: false, motivo: p.motivo || 'niente-da-fare', ...(p.servono ? { servono: p.servono, mangia: p.mangia } : {}) }
    const c = this.cosa(id), A = ANIMALI[c.tipo], t = this.ora()
    let n = 0
    for (const b of this.bestieAffamate(c)) {
      if (!this._consumaTra(A.mangia, A.pasti)) break
      b.fine = t + A.ms; n++
    }
    return { ok: true, n }
  }
  /** Raccoglie ciò che le bestie hanno fatto: va in dispensa (`prodotti`), le bestie hanno di nuovo fame. */
  raccogliProdotti(id) {
    const c = this.cosa(id)
    if (!c || !c.bestie) return { ok: false, motivo: 'sconosciuto' }
    const pronte = this.bestiePronte(c)
    if (!pronte.length) return { ok: false, motivo: 'niente' }
    const A = ANIMALI[c.tipo]
    for (const b of pronte) b.fine = null
    this.s.prodotti[A.prodotto] = (this.s.prodotti[A.prodotto] || 0) + pronte.length
    this._evento(A.evento, { n: pronte.length })
    return { ok: true, n: pronte.length, prodotto: A.prodotto }
  }
  // ── le bestie, una sola API per recinto (pecore), pollaio (galline) e stalla (mucche): una è nel prezzo del pezzo, le altre si
  //    comprano quando si vuole, ognuna più cara della precedente, fino alla capienza dell'edificio. Il livello apre il pezzo,
  //    non i posti (docs/fattoria3d/animali.md) ──
  /** Quante bestie ha un pezzo (0 se non ne tiene). */
  numeroBestie(c) { return c.pecore ? c.pecore.length : c.bestie ? c.bestie.length : 0 }
  /** Il quadro delle bestie di un pezzo: { tipo, bestia, bestie, emoji, n, max, pieno, prezzo (null se pieno) }, o null. */
  infoBestie(c) {
    const A = c && CORTILE[c.tipo]
    if (!A || !(c.pecore || c.bestie)) return null
    const n = this.numeroBestie(c)
    return { tipo: c.tipo, bestia: A.bestia, bestie: A.bestie, emoji: A.emoji, n, max: A.posti, pieno: n >= A.posti, prezzo: prezzoDellaBestia(c.tipo, n) }
  }
  /** Compra un'altra bestia per il recinto, il pollaio o la stalla (senza conferma): { ok, costo, n } o un rifiuto
      (`sconosciuto`, `pieno`, `poche-monete` con `costo`). Conta come esperienza. */
  compraBestia(id) {
    const c = this.cosa(id), q = c && this.infoBestie(c)
    if (!q) return { ok: false, motivo: 'sconosciuto' }
    if (q.pieno) return { ok: false, motivo: 'pieno' }
    if (!this._spendi(q.prezzo)) return { ok: false, motivo: 'poche-monete', costo: q.prezzo }
    if (c.pecore) c.pecore.push({ eta: 'adulta', t0: null })     // arriva con fame: il giro di pappa qui sotto le dà il primo pasto
    else c.bestie.push({ fine: null })
    this._evento('bestia', { tipo: c.tipo })
    // ogni acquisto porta anche un giro di pappa (se c'è da mangiare): le bestie affamate, o un pasto al recinto
    const pappa = c.pecore ? this.nutri(id) : this.nutriBestie(id)
    return { ok: true, costo: q.prezzo, n: q.n + 1, pappa: !!pappa.ok }
  }
  /** Quante uova o quanto latte aspettano in tutta la fattoria (per un cartello). */
  prodottiDelCortile() {
    let n = 0
    for (const c of this.cose) if (c.bestie) n += this.bestiePronte(c).length
    return n
  }

  // ── le macchine: mulino, pastificio (id pasticceria), panificio, caseificio, cucina (id conserviera), gelateria. Tre posti nel forno, si cuoce uno alla volta ──
  /** Cosa c'è in scorta per una ricetta: un raccolto (merci) o il prodotto di un'altra macchina (prodotti). */
  scortaDi(k) { return COLTURE[k] ? this.s.merci[k] : LANA[k] ? this.s.lana : (this.s.prodotti[k] || 0) }
  _togli(k, n) { if (COLTURE[k]) this.s.merci[k] -= n; else if (LANA[k]) this.s.lana -= n; else { this.s.prodotti[k] -= n; if (!this.s.prodotti[k]) delete this.s.prodotti[k] } }
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

  // ── la mongolfiera: la nave, tre file di casse da riempire un po' alla volta (docs/fattoria3d/mongolfiera.md) ──
  /** Tutto quello che il foglio vuole sapere: lo stato (`non-tua`, `terra`, `viaggio`, `vuota`), le file con le casse e i conti. */
  vistaMongolfiera() { return vistaDellaMongolfiera(this) }
  /** Mette sulla mongolfiera la cassa `c` della fila `i`: { ok, xp, bonusFila, bonusTutto, sorpresa, pieno } o { ok: false, motivo, mancano? }. */
  caricaCassa(i, c) { return caricaLaCassa(this, i, c) }
  /** «Parti!» a metà: restano i ⭐ delle casse messe, niente bonus del tutto. */
  partiMongolfiera() { return partiLaMongolfiera(this) }

  // ── il banco: gli ordini (vedi docs/fattoria3d/ordini.md). Pagano esperienza, mai monete; niente scade ──
  /** Il banco chiede solo da livello 2 e solo se c'è una bacheca (o una bancarella, che apre lo stesso banco) messa su un terreno tuo. */
  bancoAperto() { return this.livello() >= LIVELLO_BANCO && this.s.cose.some(c => PEZZI_DEL_BANCO.includes(c.tipo)) }
  /** I posti crescono col livello (dati/ordini.js `POSTI`); un elenco più lungo (uno stato letto) non si accorcia mai. Torna quanti sono. */
  _allungaPosti() {
    const O = this.s.ordini, posti = Math.max(O.aperti.length, POSTI(this.livello()))
    while (O.aperti.length < posti) O.aperti.push(null)
    while (O.riprende.length < posti) O.riprende.push(null)
    return posti
  }
  /** Riempie i posti vuoti il cui riposo è finito (un posto mai riempito o appena consegnato non ha riposo). */
  _riempiOrdini() {
    if (!this.bancoAperto()) return false
    const O = this.s.ordini, t = this.ora(); let cambiato = false
    const posti = this._allungaPosti()
    for (let k = 0; k < posti; k++) {
      if (O.aperti[k] || (O.riprende[k] !== null && t < O.riprende[k])) continue
      const occupati = O.aperti.filter(Boolean).map(o => o.cliente)
      O.aperti[k] = nuovoOrdine(this.livello(), this.rnd, O.prossimoId++, occupati)
      O.riprende[k] = null; cambiato = true
    }
    return cambiato
  }
  /** Gli ordini del banco, un elemento per posto: l'ordine con cosa chiede, cosa si ha e se si può consegnare, oppure
      { idx, attesa: true, restoMs } per un posto che riposa. Banco chiuso: []. */
  ordini() {
    this._riempiOrdini()
    if (!this.bancoAperto()) return []
    const t = this.ora()
    return this.s.ordini.aperti.map((o, idx) => {
      if (!o) return { idx, attesa: true, restoMs: Math.max(0, (this.s.ordini.riprende[idx] || t) - t) }
      const chiede = Object.entries(o.chiede).map(([k, n]) => {
        const r = COLTURE[k] || RICETTE[k], ha = this.scortaDi(k)
        return { k, n, nome: r.nome, emoji: r.emoji, ha: Math.min(ha, n), manca: Math.max(0, n - ha), prodotto: !COLTURE[k] }
      })
      return { idx, id: o.id, cliente: clienteDi(o.cliente), chiede, premio: o.premio, liv: o.liv, tipo: tipoDelOrdine(o.chiede), pronto: chiede.every(c => !c.manca) }
    })
  }
  /** Cosa manca per consegnare l'ordine di quel posto: { chiave: quanti }, vuoto se si può. */
  mancanoPerOrdine(idx) {
    const o = this.s.ordini.aperti[idx], out = {}
    if (o) for (const [k, n] of Object.entries(o.chiede)) if (this.scortaDi(k) < n) out[k] = n - this.scortaDi(k)
    return out
  }
  /** Consegna l'ordine: toglie la roba dalle scorte, dà l'esperienza (e il livello, se sale) e riempie subito il posto. */
  consegna(idx) {
    if (!this.bancoAperto()) return { ok: false, motivo: 'banco-chiuso' }
    const o = this.s.ordini.aperti[idx]
    if (!o) return { ok: false, motivo: 'sconosciuto' }
    const mancano = this.mancanoPerOrdine(idx)
    if (Object.keys(mancano).length) return { ok: false, motivo: 'mancano', mancano }
    for (const [k, n] of Object.entries(o.chiede)) this._togli(k, n)
    this.s.ordini.aperti[idx] = null; this.s.ordini.riprende[idx] = null
    this._guadagna(o.premio)
    this._evento('consegna', { cliente: o.cliente, premio: o.premio, chiede: { ...o.chiede } })
    this._riempiOrdini()
    return { ok: true, premio: o.premio, cliente: clienteDi(o.cliente) }
  }
  /** Manda via un ordine che non si vuole fare: gratis, ma il posto resta vuoto per RIPOSO_MS (un ordine in più non si compra). */
  rifiuta(idx) {
    if (!this.bancoAperto()) return { ok: false, motivo: 'banco-chiuso' }
    if (!this.s.ordini.aperti[idx]) return { ok: false, motivo: 'sconosciuto' }
    this.s.ordini.aperti[idx] = null; this.s.ordini.riprende[idx] = this.ora() + RIPOSO_MS
    this._evento('rifiuto')
    return { ok: true, restoMs: RIPOSO_MS }
  }
  cambia(idx) { return this.rifiuta(idx) }

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
    if (aggiornaMongolfiera(this)) cambiato = true
    if (this._riempiOrdini()) cambiato = true
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
      if (ANIMALI[tipo]) c.bestie = Array.from({ length: ANIMALI[tipo].posti }, (_, k) => ({ fine: k % 2 ? null : this.ora() - 1 }))
      this.prove.push(c); this._occupa(c, c.id); fatti++
    }
    return fatti
  }
  togliProve() { for (const c of this.prove) this._libera(c); const n = this.prove.length; this.prove = []; return n }

  // ── il salvataggio ──
  serializza() {
    const s = this.s
    this.tick()
    this._allungaPosti()                     // così la lettura rifà lo stesso stato (`normalizza` allunga allo stesso modo)
    s.strade = []
    for (let k = 0; k < this.strada.length; k++) if (this.strada[k] === 1) s.strade.push(k)
    return JSON.parse(JSON.stringify(s))
  }
}

