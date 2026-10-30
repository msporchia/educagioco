/* La Fattoria 3D: le regole, senza schermo (niente DOM, niente three, niente Vue) e senza sapere cos'è il profilo: le monete
   passano da una `borsa` che si passa da fuori ({ quante(), paga(n) }, paga(-n) incassa), e l'orologio da `ora()`.
   Tutto ciò che può non riuscire torna { ok: false, motivo } e non cambia niente; quello che riesce torna { ok: true, … }.
   Gli eventi (`prendiEventi()`) dicono cosa è successo, per i contatori. L'esperienza è la spesa in monete fatta qui dentro
   (terra, pezzi, edifici, strade; non gli spostamenti, e i rimborsi non la riducono): da lei il livello, che apre le cose. Vedi docs/fattoria3d/regole.md. */
import { LIM, chiave, cellaDa, lottoDaChiave, cellaDaId, idCella, dentro, lotto, lottoDi, lottoPerId, vicinoDi, VICINI_4, LOTTI_INIZIALI, FISSI, POSTI_STORICI, stradeDiSerie } from '../dati/mondo.js'
import { PEZZI, EDIFICI, quotaDelPezzo, edificiDaCostruire } from '../dati/catalogo.js'
import { ruotabile, misureGirate } from '../dati/rotazione.js'
import { COLTURE, TESSERE } from '../dati/colture.js'
import { RICETTE, MACCHINE, TIPI_DI_MACCHINA } from '../dati/ricette.js'
import { POSTI_MASSIMI, postiInForma, prezzoDelPosto } from '../dati/posti.js'
import { livelloPer, livelloDelPezzo, livelloDellaColtura, livelloDellaRicetta } from '../dati/livelli.js'
import { COSTI, PECORE, prezzoDelLotto } from '../dati/regole.js'
import { SILOS, TIPI_DI_SILO, siloDi, postiPerMerce, prezzoDelPasso, siloDelPezzo, PASSI_PER_EDIFICIO, EDIFICI_PER_SILO, edificiPerPassi, tagliaDelEdificio } from '../dati/silos.js'
import { generaLotto } from '../dati/lotti.js'
import { biomaDiGen, acquaDelLotto, tipoAcqua } from '../dati/biomi.js'
import { provaPesca, lanciaLenza, ritiraPesca, bancoDi, lenzeInAcqua, ripulisciPesca, riesaminaPesca, postiDiPesca } from './pesca.js'
import { ANIMALI, CORTILE, LANA, prezzoDellaBestia } from '../dati/animali.js'
import { normalizza, nuoveTessere } from './stato.js'
import { percorso } from './percorso.js'
import { POSTI, RIPOSO_MS, LIVELLO_BANCO, PEZZI_DEL_BANCO, clienteDi, tipoDelOrdine } from '../dati/ordini.js'
import { nuovoOrdine } from './ordini.js'
import { Cura } from './cura.js'
import { vistaDellaMongolfiera, caricaLaCassa, partiLaMongolfiera, aggiornaMongolfiera } from './mongolfiera.js'
import { vistaDellaBottega, consegnaInBottega, rifiutaInBottega, aggiornaLeBotteghe, daConsegnareIn, daConsegnareOvunque } from './botteghe.js'

export class Fattoria3d {
  constructor({ stato = null, borsa, ora = Date.now, rnd = Math.random, magazzini = true } = {}) {
    this.s = normalizza(stato)
    this.magazzini = magazzini                     // falso nella fattoria di un vicino: i suoi magazzini non nascono da soli
    this.borsa = borsa
    this.ora = ora
    this.rnd = rnd
    this.eventi = []
    this.cura = new Cura(this)                     // le bestie di casa: bisogni, ciotola, coccole, nomi (docs/fattoria3d/bestie-di-casa.md)
    this._comprabili = null
    this.propri = new Set()                        // le chiavi dei lotti tuoi
    for (const id of Object.keys(this.s.lotti)) { const l = lottoPerId(id); if (l) this.propri.add(l.k) }
    this.strada = new Map()                        // cella (chiave) → 1 disegnata, 2 di serie
    for (const k of stradeDiSerie()) this.strada.set(k, 2)
    for (const id of this.s.strade) { const c = cellaDaId(id); if (c && !this.strada.has(chiave(c[0], c[1]))) this.strada.set(chiave(c[0], c[1]), 1) }
    this.bloccoFisso = new Set()                   // fienile, casa, gli alberi in piedi e i sassi e cespugli ancora lì
    for (const f of FISSI) for (let a = 0; a < f.w; a++) for (let b = 0; b < f.d; b++) this.bloccoFisso.add(chiave(f.i + a, f.j + b))
    this.tagliati = new Set(this.s.tagliati)
    this.tolti = new Set(this.s.ostacoli)
    this.cellaCosa = new Map()                     // l'id della cosa che sta su una cella
    this.cellaPasso = new Map()                    // di quanto alza chi cammina su un pezzo calpestabile (ponte, passerella)
    this.cellaAcqua = new Map()                    // l'id dello stagno o del laghetto costruito che sta su una cella: a parte da `cellaCosa`, così un ponte ci sta sopra
    this.prove = []                                // le cose «di prova» (stress): non si salvano
    for (const c of this.s.cose) {
      if (c.tipo === 'recinto' && !c.pecore) c.pecore = this.pecoreIniziali()
      if (ANIMALI[c.tipo] && !c.bestie) c.bestie = this.bestieIniziali()
      this._occupa(c, c.id)
    }
    // i lotti con dentro qualcosa (alberi, sassi, acqua): i tuoi e quelli entro due lotti da un tuo, generati a richiesta
    this.alberi = []; this.ostacoli = []           // le liste degli oggetti in scena (nell'ordine in cui i lotti sono stati aperti)
    this.alberiPerId = new Map(); this.ostacoliPerId = new Map(); this.ostacoloPerCella = new Map()
    this.lottiAperti = new Map()                   // chiave del lotto → { l, dati }
    this._acquaCache = new Map()
    this.vecchi = new Set(this.s.vecchi)           // i lotti comprati prima della geografia grande dove ora c'è il mare o un lago: si generano alla vecchia (generazione 0)
    this.vecchi1 = new Set(this.s.vecchi1)         // i lotti comprati con i laghetti-pozzanghera, dove ora c'è un lago naturale: restano pozzanghere (generazione 1; docs/fattoria3d/laghi.md)
    for (const k of this.propri) this._apriAnello(lottoDaChiave(k))
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

  // ── il terreno: lotti con coordinate intere qualunque, nessun confine ──
  posseduto(l) { return this.propri.has(l.k) }
  cellaPropria(i, j) { return this.propri.has(lottoDi(i, j).k) }
  confina(l) { return VICINI_4.some(([a, b]) => this.propri.has(vicinoDi(l, a, b).k)) }
  prezzoLotto() { return prezzoDelLotto(Object.keys(this.s.lotti).length - Object.keys(LOTTI_INIZIALI).length) }
  /** I lotti che si possono comprare adesso: quelli che confinano con uno tuo. */
  lottiComprabili() {
    if (this._comprabili) return this._comprabili
    const out = new Map()
    for (const k of this.propri) { const l = lottoDaChiave(k); for (const [a, b] of VICINI_4) { const v = vicinoDi(l, a, b); if (!this.propri.has(v.k)) out.set(v.k, v) } }
    return (this._comprabili = [...out.values()])
  }
  /** Il bioma di un lotto, come lo vede il motore (un lotto di un salvataggio di prima resta quello di prima). */
  /** La generazione di un lotto: 0 e 1 per i lotti di un salvataggio vecchio che restano com'erano, 2 per gli altri. */
  genDi(l) { return this.vecchi.has(l.id) ? 0 : this.vecchi1.has(l.id) ? 1 : 2 }
  biomaDi(l) { return biomaDiGen(l.a, l.b, this.genDi(l)) }
  /** Apre (genera) i lotti entro due lotti da `l`: alberi, sassi, acqua. Vale per i lotti tuoi e per l'anello che si vede davanti. */
  _apriAnello(l) {
    for (let db = -2; db <= 2; db++) for (let da = -2; da <= 2; da++) {
      const v = lotto(l.a + da, l.b + db)
      if (!this.lottiAperti.has(v.k)) this._apri(v)
    }
  }
  _apri(l) {
    const dati = generaLotto(l.a, l.b, { vecchio: this.genDi(l) })
    this.lottiAperti.set(l.k, { l, dati })
    for (const a of dati.alberi) {
      if (this.tagliati.has(a.n)) a.tagliato = true
      else if (!a.tagliato) this.bloccoFisso.add(chiave(a.i, a.j))
      this.alberi.push(a); this.alberiPerId.set(a.n, a)
    }
    for (const o of dati.ostacoli) {
      if (this.tolti.has(o.id)) o.tolto = true
      else this.bloccoFisso.add(chiave(o.i, o.j))
      this.ostacoli.push(o); this.ostacoliPerId.set(o.n, o); this.ostacoloPerCella.set(chiave(o.i, o.j), o)
      // un salvataggio di prima può avere un pezzo o una strada dove ora c'è un sasso: il sasso sparisce (gratis, e per sempre)
      if (!o.tolto && (this.cellaCosa.has(chiave(o.i, o.j)) || this.cellaAcqua.has(chiave(o.i, o.j)) || this.strada.has(chiave(o.i, o.j)))) this._togliSenzaPagare(o)
    }
    return dati
  }
  /** I lotti aperti (con alberi, sassi e acqua) che la scena può disegnare: { l, dati }. */
  lottiVisibili() { return this.lottiAperti.values() }
  compraLotto(id) {
    const l = lottoPerId(id)
    if (!l) return { ok: false, motivo: 'sconosciuto' }
    if (this.posseduto(l)) return { ok: false, motivo: 'gia-tuo' }
    if (!this.confina(l)) return { ok: false, motivo: 'non-confina' }
    const costo = this.prezzoLotto()
    if (!this._paga(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this._guadagna(Math.min(costo, COSTI.lottoEsperienzaMax))          // la terra fa salire di livello fino a un tetto: oltre, il prezzo frena e basta
    this.s.lotti[l.id] = true
    this.propri.add(l.k); this._comprabili = null
    this._apriAnello(l)
    this._evento('terra')
    return { ok: true, costo, lotto: l }
  }
  // ── l'acqua: i laghetti. Non si cammina e non si costruisce, tranne con un ponte o una passerella (`suAcqua`) ──
  _acquaDi(l) {
    let a = this._acquaCache.get(l.k)
    if (a === undefined) {
      const celle = acquaDelLotto(l, this.genDi(l))
      a = celle.length ? new Set(celle.map(([i, j]) => chiave(i, j))) : null
      this._acquaCache.set(l.k, a)
    }
    return a
  }
  /** Acqua: un lago del mondo, o le celle di uno stagno/laghetto costruito (`ignora`: l'id di quello che si sta spostando, che non conta). */
  acqua(i, j, ignora = 0) {
    const k = chiave(i, j), s = this.cellaAcqua.get(k)
    if (s && s !== ignora) return true
    const a = this._acquaDi(lottoDi(i, j)); return !!a && a.has(k)
  }
  /** Se il pezzo `c` è uno stagno/laghetto con un ponte (o una passerella) sopra: finché c'è, non si sposta né si mette via. */
  _ponteSopra(c) {
    const d = PEZZI[c.tipo]
    if (!d || !d.acqua) return false
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) if (this.cellaCosa.has(chiave(c.i + a, c.j + b))) return true
    return false
  }

  // ── la griglia: cosa blocca il passo e il costruire ──
  eStrada(i, j) { return this.strada.get(chiave(i, j)) || 0 }
  stradaSu(i, j) { return this.strada.get(chiave(i, j)) || 0 }
  /** Una cella è occupata da qualcosa che si vede (strada, pezzo, edificio, albero, sasso): per i ciuffi d'erba. */
  occupata(i, j) { const k = chiave(i, j); return this.strada.has(k) || this.cellaCosa.has(k) || this.bloccoFisso.has(k) }
  _bloccaSenzaAcqua(i, j, ignora = 0) {
    if (!this.cellaPropria(i, j)) return true      // ci si chiude dentro il recinto: il terreno non tuo non si calpesta
    const k = chiave(i, j)
    if (this.bloccoFisso.has(k)) return true
    const c = this.cellaCosa.get(k) || 0
    return c !== 0 && c !== ignora
  }
  blocca(i, j, ignora = 0) { return this._bloccaSenzaAcqua(i, j, ignora) || this.acqua(i, j, ignora) }
  /** Il passo: come `blocca`, ma un pezzo calpestabile (ponte, passerella) non ferma chi cammina, nemmeno sull'acqua. Il costruire usa `blocca`. */
  libera(i, j) {
    const p = this.cellaPasso.get(chiave(i, j))
    return p > 0 ? this.cellaPropria(i, j) : !this.blocca(i, j)
  }
  /** Una cella dove si cammina in fretta: la strada, o un pezzo calpestabile (conta come strada nel percorso). */
  sullaStrada(i, j) { const k = chiave(i, j); return this.strada.has(k) || this.cellaPasso.has(k) }
  /** Di quanto si alza chi sta in quel punto (0 per terra, > 0 su un ponte o una passerella). */
  quotaPasso(x, z) { return this.cellaPasso.get(chiave(Math.floor(x), Math.floor(z))) || 0 }
  /** La cosa su una cella: il pezzo che sta sopra (un ponte) prima, poi lo stagno sotto. */
  cosaSu(i, j) { const k = chiave(i, j), id = this.cellaCosa.get(k) || this.cellaAcqua.get(k) || 0; return id ? this.cosa(id) : null }
  _occupa(c, id) {
    const d = this.misureCosa(c)
    if (d.acqua) {          // l'acqua costruita non occupa `cellaCosa` (ci va il ponte); una strada disegnata lì sotto sparisce
      for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) { const k = chiave(c.i + a, c.j + b); this.cellaAcqua.set(k, id); if (this.strada.get(k) === 1) this.strada.delete(k) }
      return
    }
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) { const k = chiave(c.i + a, c.j + b); this.cellaCosa.set(k, id); const q = quotaDelPezzo(d, a, b); if (q > 0) this.cellaPasso.set(k, q); else this.cellaPasso.delete(k) }
  }
  /** Il percorso (celle) da una cella alla più vicina delle mete, o null. Cammina solo sul terreno tuo: l'insieme è finito. */
  percorsoVerso(da, mete) { return percorso((i, j) => this.libera(i, j), (i, j) => this.sullaStrada(i, j), da, mete) }

  // ── le strade ──
  disegnaStrada(i, j, { gratis = false } = {}) {
    if (!dentro(i, j) || this.strada.has(chiave(i, j))) return { ok: false, motivo: 'qui-no' }
    if (this.blocca(i, j)) return { ok: false, motivo: 'occupato' }
    if (!gratis && !this._spendi(COSTI.strada)) return { ok: false, motivo: 'poche-monete', costo: COSTI.strada }
    this.strada.set(chiave(i, j), 1)
    this._evento('strada')
    return { ok: true, costo: gratis ? 0 : COSTI.strada }
  }
  togliStrada(i, j) {
    if (!dentro(i, j) || this.strada.get(chiave(i, j)) !== 1) return { ok: false, motivo: 'qui-no' }
    this.strada.delete(chiave(i, j))
    return { ok: true }
  }

  // ── i pezzi ──
  get cose() { return [...this.s.cose, ...this.prove] }
  cosa(id) { return this.s.cose.find(c => c.id === id) || this.prove.find(c => c.id === id) || null }
  /** Le misure di un tipo; `rot` (0–3, quarti di giro) le scambia se è dispari: un pezzo girato di 90° occupa d×w (docs/fattoria3d/rotazione.md). */
  misure(tipo, rot = 0) { const d = PEZZI[tipo] || EDIFICI[tipo]; return d && rot % 2 === 1 && ruotabile(tipo) ? misureGirate(tipo, d) : d }
  /** Le misure della cosa com'è messa (con la sua rotazione). */
  misureCosa(c) { return this.misure(c.tipo, c.rot || 0) }
  prezzoPezzo(tipo) {
    const d = PEZZI[tipo]
    if (!d) return EDIFICI[tipo].prezzo               // un edificio costa sempre uguale: ce n'è uno solo
    return Math.round(d.prezzo * (1 + (d.cresce || 0) * (this.s.cose.filter(c => c.tipo === tipo).length + (this.s.magazzino[tipo] || 0))))          // la formula della 2D: `base · (1 + copie · cresce)`
  }
  nelMagazzino(tipo) { return this.s.magazzino[tipo] || 0 }
  compraPezzo(tipo) {
    if (!PEZZI[tipo] && !EDIFICI[tipo]) return { ok: false, motivo: 'sconosciuto' }
    if (EDIFICI[tipo] && (this.s.posseduti[tipo] || this.nelMagazzino(tipo) > 0)) return { ok: false, motivo: 'gia-tuo' }       // uno per tipo
    if (PEZZI[tipo] && PEZZI[tipo].unico && (this.nelMagazzino(tipo) > 0 || this.s.cose.some(c => c.tipo === tipo))) return { ok: false, motivo: 'gia-tuo' }       // il porticciolo è uno solo
    if (PEZZI[tipo] && PEZZI[tipo].fiera) return { ok: false, motivo: 'non-in-vendita' }       // la fiera si vince dalla mongolfiera (fattoria3d/mongolfiera.md)
    const chiuso = this._chiusa(livelloDelPezzo(tipo))
    if (chiuso) return chiuso
    const costo = this.prezzoPezzo(tipo)
    if (!this._spendi(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this.s.magazzino[tipo] = this.nelMagazzino(tipo) + 1
    return { ok: true, costo }
  }
  /** Si può mettere un pezzo di quel tipo con l'angolo in (i, j)? `ignora`: l'id della cosa che si sta spostando. */
  puoMettere(tipo, i, j, ignora = 0, rot = 0) {
    const d = this.misure(tipo, rot)
    if (!d) return { ok: false, motivo: 'sconosciuto' }
    if (d.acqua && ignora) { const x = this.cosa(ignora); if (x && this._ponteSopra(x)) return { ok: false, motivo: 'ponte-sopra' } }
    let terra = false, acqua = false
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) {
      if (!this.cellaPropria(i + a, j + b)) return { ok: false, motivo: 'fuori-terreno' }
      if (this.acqua(i + a, j + b, ignora)) acqua = true; else terra = true
    }
    if (acqua && !d.suAcqua) return { ok: false, motivo: 'acqua' }
    if (d.soloAcqua && terra) return { ok: false, motivo: 'serve-acqua' }          // le ninfee galleggiano: tutte le celle d'acqua (decorazioni.md)
    if (acqua && !terra && !d.soloAcqua && !d.anfibio && !this._appoggioPerPonte(d, i, j)) return { ok: false, motivo: 'acqua' }       // le canne stanno anche nell'acqua bassa: niente appoggio
    if (d.riva && !this._toccaAcqua(d, i, j)) return { ok: false, motivo: 'serve-riva' }
    if (d.unico && !ignora && this.s.cose.some(c => c.tipo === tipo)) return { ok: false, motivo: 'gia-tuo' }
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) {
      if (this._bloccaSenzaAcqua(i + a, j + b, ignora) || (d.acqua && this.strada.get(chiave(i + a, j + b)) === 2)) return { ok: false, motivo: 'occupato' }
    }
    return { ok: true }
  }
  /** L'impronta ha una cella d'acqua, o ne tocca una di lato: il porticciolo si mette sulla riva. */
  _toccaAcqua(d, i, j) {
    for (let a = -1; a <= d.w; a++) for (let b = -1; b <= d.d; b++) {
      if ((a < 0 || a >= d.w) && (b < 0 || b >= d.d)) continue          // gli angoli non toccano di lato
      if (this.acqua(i + a, j + b)) return true
    }
    return false
  }
  /** Un ponte tutto sull'acqua regge solo se tocca un altro ponte (una cella calpestabile accanto al suo ingombro). */
  _appoggioPerPonte(d, i, j) {
    for (let a = -1; a <= d.w; a++) for (let b = -1; b <= d.d; b++) {
      if ((a >= 0 && a < d.w) && (b >= 0 && b < d.d)) continue
      if ((a < 0 || a >= d.w) && (b < 0 || b >= d.d)) continue          // gli angoli non toccano di lato
      if (this.cellaPasso.has(chiave(i + a, j + b))) return true
    }
    return false
  }
  mettiPezzo(tipo, i, j, rot = 0) {
    if (!(this.nelMagazzino(tipo) > 0)) return { ok: false, motivo: 'non-in-magazzino' }
    if (EDIFICI[tipo] && this.s.posseduti[tipo]) return { ok: false, motivo: 'gia-tuo' }
    const p = this.puoMettere(tipo, i, j, 0, rot)
    if (!p.ok) return p
    const c = { id: this.s.prossimoId++, tipo, i, j }
    if (rot % 4 && ruotabile(tipo)) c.rot = rot % 4
    if (EDIFICI[tipo]) this.s.posseduti[tipo] = true
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
  puoCompraEMettere(tipo, i, j, rot = 0) {
    if (EDIFICI[tipo] && this.s.posseduti[tipo]) return { ok: false, motivo: 'gia-tuo' }
    const p = this.puoMettere(tipo, i, j, 0, rot)
    if (!p.ok) return p
    const chiuso = this._chiusa(livelloDelPezzo(tipo))
    if (chiuso) return chiuso
    const costo = this.costoDiMettere(tipo)
    if (costo > this.monete()) return { ok: false, motivo: 'poche-monete', costo }
    return { ok: true, costo }
  }
  /** Compra (se non è già nel magazzino) e mette in un solo gesto. Se qualcosa non va non cambia niente e non si paga. */
  compraEMetti(tipo, i, j, rot = 0) {
    const p = this.puoCompraEMettere(tipo, i, j, rot)
    if (!p.ok) return p
    if (!(this.nelMagazzino(tipo) > 0)) {
      const c = this.compraPezzo(tipo)
      if (!c.ok) return c
    }
    const r = this.mettiPezzo(tipo, i, j, rot)
    return r.ok ? { ...r, costo: p.costo } : r
  }
  bestieIniziali() { return [{ fine: null }] }          // una gallina o una mucca sono nel prezzo, con fame
  pecoreIniziali() { return [{ eta: 'adulta', t0: null }] }                      // una pecora è nel prezzo del recinto, con fame come una gallina nel pollaio
  /** Sposta una cosa; `rot` (se detto) la gira. Stesso posto e stessa rotazione: niente da fare, niente da pagare. */
  spostaPezzo(id, i, j, { gratis = false, rot } = {}) {
    const c = this.cosa(id)
    if (!c) return { ok: false, motivo: 'sconosciuto' }
    const r1 = rot === undefined || !ruotabile(c.tipo) ? (c.rot || 0) : ((rot % 4) + 4) % 4
    if (c.i === i && c.j === j && r1 === (c.rot || 0)) return { ok: true, costo: 0 }
    const p = this.puoMettere(c.tipo, i, j, id, r1)
    if (!p.ok) return p
    const costo = gratis || c.prova ? 0 : COSTI.spostare
    if (!this._paga(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this._libera(c); c.i = i; c.j = j
    if (r1) c.rot = r1; else delete c.rot
    this._occupa(c, c.id)
    riesaminaPesca(this)
    return { ok: true, costo }
  }
  /** Gira di un quarto la cosa attorno al suo centro (🪙 1 come spostarla). Se così non ci sta, resta com'è e dice perché. */
  ruotaPezzo(id, { gratis = false } = {}) {
    const c = this.cosa(id)
    if (!c) return { ok: false, motivo: 'sconosciuto' }
    if (!ruotabile(c.tipo)) return { ok: false, motivo: 'non-ruotabile' }
    const d0 = this.misureCosa(c), rot = ((c.rot || 0) + 1) % 4, d1 = this.misure(c.tipo, rot)
    // il centro resta; se cade a mezza cella si arrotonda «in fuori» (così quattro quarti di giro tornano dov'erano) e, se lì non ci sta, dall'altra parte
    const dx = (d0.w - d1.w) / 2, dz = (d0.d - d1.d) / 2, fuori = v => Math.sign(v) * Math.ceil(Math.abs(v)), dentro = v => Math.sign(v) * Math.floor(Math.abs(v))
    let ultimo = null
    for (const [ax, az] of [[fuori(dx), fuori(dz)], [dentro(dx), dentro(dz)], [fuori(dx), dentro(dz)], [dentro(dx), fuori(dz)]]) {
      if (ultimo && ultimo[0] === ax && ultimo[1] === az) continue
      ultimo = [ax, az]
      if (this.puoMettere(c.tipo, c.i + ax, c.j + az, id, rot).ok) return this.spostaPezzo(id, c.i + ax, c.j + az, { gratis, rot })
    }
    return this.spostaPezzo(id, c.i + fuori(dx), c.j + fuori(dz), { gratis, rot })          // non ci sta: il rifiuto dice perché
  }
  _libera(c) {
    const d = this.misureCosa(c)
    if (d.acqua) { for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) this.cellaAcqua.delete(chiave(c.i + a, c.j + b)); return }       // il ponte sopra resta dov'è
    for (let a = 0; a < d.w; a++) for (let b = 0; b < d.d; b++) { const k = chiave(c.i + a, c.j + b); this.cellaCosa.delete(k); this.cellaPasso.delete(k) }
  }
  /** Rimette un pezzo nel magazzino. Un campo che sta crescendo e un recinto con le pecore non si mettono via. */
  mettiVia(id, { gratis = false, forza = false } = {}) {
    const c = this.cosa(id)
    if (!c) return { ok: false, motivo: 'sconosciuto' }
    if (!forza && c.tile && c.tile.some(t => t !== null)) return { ok: false, motivo: 'sta-crescendo' }
    if (!forza && c.pecore) return { ok: false, motivo: 'ha-le-pecore' }
    if (!forza && c.bestie) return { ok: false, motivo: 'ha-le-bestie' }
    if (!forza && this._ponteSopra(c)) return { ok: false, motivo: 'ponte-sopra' }
    if (!forza && EDIFICI[c.tipo] && this.edificioAlLavoro(c.tipo)) return { ok: false, motivo: 'macchina-al-lavoro' }
    if (!forza && siloDelPezzo(c.tipo)) return { ok: false, motivo: 'magazzino' }          // un magazzino si sposta, non si mette via: è lì che sta la roba
    const costo = gratis ? 0 : COSTI.spostare
    if (!this._paga(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this._libera(c)
    if (EDIFICI[c.tipo]) this.s.posseduti[c.tipo] = false
    this.s.cose = this.s.cose.filter(x => x.id !== id)
    this.prove = this.prove.filter(x => x.id !== id)
    this.s.magazzino[c.tipo] = this.nelMagazzino(c.tipo) + 1
    riesaminaPesca(this)
    return { ok: true, costo }
  }
  /** Il rimborso di un'azione annullata (la monetina dello spostamento). */
  rimborsa(n) { this._rimborsa(n) }

  // ── gli edifici unici: pezzi liberi, uno per tipo (docs/fattoria3d/edifici-liberi.md). Stanno in `cose` come gli altri pezzi: si
  //    comprano e si mettono con `compraEMetti`, si spostano con `spostaPezzo`, si mettono via con `mettiVia` ──
  edificio(tipo) { return { tipo, ...EDIFICI[tipo], posseduto: !!this.s.posseduti[tipo], cosa: this.cosaDi(tipo) } }
  /** La cosa che è l'edificio di quel tipo in mappa, o null (non comprato, o comprato e nel magazzino). */
  cosaDi(tipo) { return this.s.cose.find(c => c.tipo === tipo) || null }
  /** Una macchina che lavora (qualcosa in coda o da ritirare) o una mongolfiera in volo o già caricata: non si mette via, si può spostare. */
  edificioAlLavoro(tipo) {
    if (tipo === 'mongolfiera') { const M = this.s.mongolfiera; return M.riposo !== null || !!(M.stiva && M.stiva.file.some(f => f.casse.some(c => c.piena))) }
    const Q = this.s.macchine[tipo]
    return !!Q && (Q.coda.length > 0 || Object.keys(Q.pronti).length > 0)
  }
  /** Gli edifici che il livello ha aperto e non sono in mappa: il «!» (solo macchine e mongolfiera; mai una decorazione). */
  /** Gli edifici aperti dal livello e non ancora in mappa (il «!» su Costruisci), più i magazzini che aspettano nel magazzino dei pezzi. */
  edificiDaCostruire() { return [...edificiDaCostruire(this.livello(), this.s.posseduti), ...TIPI_DI_SILO.map(t => SILOS[t].edificio).filter(t => this.nelMagazzino(t) > 0 && PEZZI[t].liv <= this.livello())] }
  /** Un posto dove ci sta: quello di prima se è libero, se no il primo libero nel terreno tuo (per i banchi di prova e i comandi; il gioco lo sceglie il bambino). */
  postoPer(tipo) {
    const vecchio = POSTI_STORICI[tipo]
    if (vecchio && this.puoMettere(tipo, vecchio.i, vecchio.j).ok) return [vecchio.i, vecchio.j]
    for (let j = LIM.j0; j < LIM.j1; j++) for (let i = LIM.i0; i < LIM.i1; i++) if (this.puoMettere(tipo, i, j).ok) return [i, j]
    return null
  }
  /** Compra e mette un edificio: in (i, j), o dove ci sta (`postoPer`). Come `compraEMetti`, con un nome che dice cos'è. */
  compraEdificio(tipo, i, j) {
    if (!EDIFICI[tipo]) return { ok: false, motivo: 'sconosciuto' }
    if (i === undefined) { const p = this.postoPer(tipo); if (!p) return { ok: false, motivo: 'occupato' }; [i, j] = p }
    return this.compraEMetti(tipo, i, j)
  }

  // ── il mangime: le bestie non mangiano raccolti ma il mangime della 2D (becchime, foraggio: li fa il fienile, dati/mangime.js) ──
  /** Quanto mangime c'è per chi mangia `chiavi`: i pezzi in dispensa, sommati. */
  scortaMangime(chiavi) { return chiavi.reduce((n, k) => n + this.scortaDi(k), 0) }
  /** Toglie n pezzi di mangime fra `chiavi`, dalla scorta più grande; se non bastano torna false e non toglie niente. */
  _consumaTra(chiavi, n) {
    if (this.scortaMangime(chiavi) < n) return false
    for (let k = 0; k < n; k++) { const c = chiavi.slice().sort((a, b) => this.scortaDi(b) - this.scortaDi(a))[0]; this._togli(c, 1) }
    return true
  }
  /** Il rifiuto di chi non ha da dare da mangiare: dice quanti pezzi e di quale mangime (`dettoDi` aggiunge dove si fa). */
  _senzaMangime(chiavi, servono) { return { motivo: 'manca-mangime', servono, mangia: chiavi.slice() } }

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
    const costo = COLTURE[coltura].semina || 0                          // 🪙 per seminare un campo: nella 2D è zero per tutte (si paga raccogliendo), ma è un dato
    if (costo && !this._spendi(costo)) return { ok: false, motivo: 'poche-monete', costo }
    const t = this.ora()
    c.coltura = coltura; c.tile = Array.from({ length: TESSERE }, () => t)
    return { ok: true, costo }
  }
  seminaCampo(id, coltura) { return this.semina(id, coltura) }
  colturaSbloccata(coltura) { return livelloDellaColtura(coltura) <= this.livello() }
  /** Un campo ha quattro tessere ma rende un raccolto solo, come uno della 2D (D12): le prime tre si staccano gratis, la **ultima** consegna il raccolto in
      magazzino e costa il gesto della 2D (🪙1–2). Cosa succederebbe raccogliendo tutto il campo, senza cambiare niente: { ok, coltura, costo } o un rifiuto
      (`scomparto-pieno`, `poche-monete`): chi chiama lo controlla prima di far partire il gesto, così non si lascia un campo a metà. */
  provaRaccolta(id) {
    const c = this.cosa(id)
    if (!c || c.tipo !== 'campo' || this.campoVuoto(c)) return { ok: false, motivo: 'vuota' }
    if (!this.campoMaturo(c)) return { ok: false, motivo: 'non-matura' }
    const coltura = c.coltura || 'grano', costo = COLTURE[coltura].raccolta || 0
    if (this.spazioPer(coltura) < 1) return { ok: false, motivo: 'scomparto-pieno', k: coltura, max: this.capienzaDi(coltura) }
    if (costo > this.monete()) return { ok: false, motivo: 'poche-monete', costo }
    return { ok: true, coltura, costo }
  }
  raccogliTessera(id, k) {
    const c = this.cosa(id)
    if (!c || c.tipo !== 'campo' || c.tile[k] === null) return { ok: false, motivo: 'vuota' }
    if (this.crescita(c)[k] < 1) return { ok: false, motivo: 'non-matura' }
    const coltura = c.coltura || 'grano'
    const ultima = c.tile.every((x, i) => i === k || x === null)               // l'ultima tessera del campo consegna il raccolto
    let costo = 0
    if (ultima) {
      if (this.spazioPer(coltura) < 1) return { ok: false, motivo: 'scomparto-pieno', k: coltura, max: this.capienzaDi(coltura) }
      costo = COLTURE[coltura].raccolta || 0
      if (costo && !this._spendi(costo)) return { ok: false, motivo: 'poche-monete', costo }
    }
    c.tile[k] = null
    if (ultima) { this.s.merci[coltura]++; this._evento('raccolto', { coltura }) }
    return { ok: true, coltura, consegnato: ultima, costo }
  }

  // ── i silos: ogni merce ha il suo scomparto da 8 pezzi, +2 a ogni ingrandimento del silo (dati/silos.js) ──
  /** Il silo della merce `k` (una coltura, la lana, un prodotto di bestia o di macchina), o null. */
  siloDi(k) { return siloDi(k) }
  /** Quante volte è stato ingrandito il silo (0 = appena nato). */
  livelloDelSilo(silo) { return (this.s.silo && this.s.silo[silo]) | 0 }
  /** Quanti pezzi tiene ogni scomparto di quel silo. */
  postiDelSilo(silo) { return postiPerMerce(this.livelloDelSilo(silo)) }
  /** Quanti pezzi di `k` ci stanno in tutto (Infinity se non è una merce di nessun silo). */
  capienzaDi(k) { const s = siloDi(k); return s ? this.postiDelSilo(s) : Infinity }
  /** Quanti pezzi di `k` ci stanno ancora: 0 se lo scomparto è pieno (anche se una scorta portata da fuori lo supera). */
  spazioPer(k) { return Math.max(0, this.capienzaDi(k) - this.scortaDi(k)) }
  /** Il prezzo del prossimo ingrandimento di un silo (🪙 `40 + 130·ln(1+n)` come in 2D). */
  prezzoIngrandimento(silo) { return TIPI_DI_SILO.includes(silo) ? prezzoDelPasso(this.livelloDelSilo(silo)) : null }
  /** Ingrandisce un silo: +2 pezzi per ogni scomparto, e il suo edificio cresce. Costa monete (conta come esperienza); { ok, costo, posti } o un
      rifiuto (`sconosciuto`, `poche-monete`, `silo-al-massimo` quando i suoi edifici sono grandi al massimo: ne serve un altro, `costruisciMagazzino`). */
  ingrandisciSilo(silo) {
    if (!TIPI_DI_SILO.includes(silo)) return { ok: false, motivo: 'sconosciuto' }
    if (this.passoDelSilo(silo) !== 'ingrandisci') return { ok: false, motivo: 'silo-al-massimo' }
    const costo = this.prezzoIngrandimento(silo)
    if (!this._spendi(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this.s.silo[silo] = this.livelloDelSilo(silo) + 1
    this._evento('silo', { silo, livello: this.s.silo[silo] })
    return { ok: true, costo, posti: this.postiDelSilo(silo) }
  }

  // ── i magazzini in mappa (docs/fattoria3d/magazzini.md): ogni silo ha i suoi edifici, che crescono con gli ingrandimenti; la capienza la dicono
  //    gli ingrandimenti (`s.silo`), gli edifici la fanno vedere. Il primo silo del raccolto si mette da solo accanto a casa; gli altri arrivano
  //    nel magazzino dei pezzi (al livello del silo, o comprati dal foglio) e li mette il bambino dove vuole (`_assicuraMagazzini`, nel tick) ──
  /** Gli edifici di un silo in mappa, nell'ordine in cui sono nati: il primo cresce per primo. */
  edificiDelSilo(silo) { const t = SILOS[silo].edificio; return this.s.cose.filter(c => c.tipo === t).sort((a, b) => a.id - b.id) }
  /** Quanti edifici ha un silo, in mappa e nel magazzino. */
  quantiMagazzini(silo) { return this.edificiDelSilo(silo).length + this.nelMagazzino(SILOS[silo].edificio) }
  /** Quanto è cresciuto un edificio di un silo (0 appena nato, PASSI_PER_EDIFICIO al massimo), o null se la cosa non è un magazzino. */
  tagliaDi(c) {
    const silo = siloDelPezzo(c.tipo)
    if (!silo) return null
    return tagliaDelEdificio(this.livelloDelSilo(silo), Math.max(0, this.edificiDelSilo(silo).findIndex(x => x.id === c.id)))
  }
  /** Cosa si può fare per dare più posto: 'ingrandisci' (un edificio ha ancora da crescere), 'nuovo' (tutti al massimo: se ne costruisce un altro), 'basta'. */
  passoDelSilo(silo) {
    const quanti = Math.max(1, this.quantiMagazzini(silo))
    if (this.livelloDelSilo(silo) < PASSI_PER_EDIFICIO * quanti) return 'ingrandisci'
    return quanti < EDIFICI_PER_SILO ? 'nuovo' : 'basta'
  }
  /** Il primo posto libero per un pezzo di quel tipo, a spirale attorno a (i0, j0): { i, j } o null. Deterministico (lo rifà uguale l'amico). */
  _postoVicino(tipo, i0, j0, raggio = 14) {
    for (let r = 0; r <= raggio; r++) for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) {
      if (Math.max(Math.abs(a), Math.abs(b)) !== r) continue
      if (this.puoMettere(tipo, i0 + a, j0 + b).ok) return { i: i0 + a, j: j0 + b }
    }
    return null
  }
  /** Il primo silo del raccolto si mette da solo, nel primo posto libero accanto alla casa: torna se c'è riuscito (se no resta da mettere). */
  _mettiIlPrimoSilo() {
    const casa = FISSI[0], p = this._postoVicino('silo', casa.i + casa.w + 1, casa.j + 1)
    this.s.magazzino.silo = this.nelMagazzino('silo') + 1
    return !!(p && this.mettiPezzo('silo', p.i, p.j).ok)
  }
  /** Quando tutti gli edifici di un silo sono grandi al massimo: se ne compra un altro, al prezzo del prossimo ingrandimento (lo è: nasce col suo
      primo passo), e va nel magazzino dei pezzi, da mettere dove si vuole. { ok, costo, posti, tipo } o un rifiuto (`non-serve`, `poche-monete`). */
  costruisciMagazzino(silo) {
    if (!TIPI_DI_SILO.includes(silo)) return { ok: false, motivo: 'sconosciuto' }
    if (this.passoDelSilo(silo) !== 'nuovo') return { ok: false, motivo: 'non-serve' }
    const costo = this.prezzoIngrandimento(silo), tipo = SILOS[silo].edificio
    if (!this._spendi(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this.s.silo[silo] = this.livelloDelSilo(silo) + 1
    this.s.magazzino[tipo] = this.nelMagazzino(tipo) + 1
    this._evento('silo', { silo, livello: this.s.silo[silo] })
    return { ok: true, costo, posti: this.postiDelSilo(silo), tipo }
  }
  /** I magazzini arrivati al livello e non ancora in mappa si mettono da soli (anche per una fattoria di prima: nessuno perde posto). Torna se ne ha messi. */
  _assicuraMagazzini() {
    if (!this.magazzini) return false
    const liv = this.livello(), firma = liv + ':' + TIPI_DI_SILO.map(t => this.livelloDelSilo(t)).join()
    if (firma === this._firmaMagazzini) return false
    this._firmaMagazzini = firma
    let messo = false
    for (const silo of TIPI_DI_SILO) {
      if (liv < SILOS[silo].liv) continue
      const tipo = SILOS[silo].edificio
      for (let n = this.quantiMagazzini(silo); n < edificiPerPassi(this.livelloDelSilo(silo)); n++) {
        if (silo === 'terra' && n === 0) this._mettiIlPrimoSilo()
        else this.s.magazzino[tipo] = this.nelMagazzino(tipo) + 1
        messo = true
      }
    }
    if (messo) this.eventi = this.eventi.filter(e => !(e.tipo === 'pezzo' && siloDelPezzo(e.pezzo)))       // arrivati da soli: non sono pezzi messi dal bambino
    return messo
  }

  /** Mette `n` di `k` in magazzino, fin dove ci stanno: torna quanti ne sono entrati (il resto resta dov'era, a chi chiama). */
  _riponi(k, n) {
    const entra = Math.min(n, this.spazioPer(k))
    if (entra <= 0) return 0
    if (COLTURE[k]) this.s.merci[k] += entra
    else if (LANA[k]) this.s.lana += entra
    else this.s.prodotti[k] = (this.s.prodotti[k] || 0) + entra
    return entra
  }

  // ── gli alberi ──
  puoAbbattere(n) {
    const a = this.albero(n)
    if (!a) return { ok: false, motivo: 'sconosciuto' }
    if (a.tagliato) return { ok: false, motivo: 'gia-tagliato' }
    if (!this.cellaPropria(a.i, a.j)) return { ok: false, motivo: 'fuori-terreno' }
    return { ok: true }
  }
  /** Un colpo d'ascia costa `COSTI.albero`: senza monete rifiuta e non cambia niente. */
  abbatti(n) {
    const p = this.puoAbbattere(n)
    if (!p.ok) return p
    if (!this._spendi(COSTI.albero)) return { ok: false, motivo: 'poche-monete', costo: COSTI.albero }
    const a = this.albero(n)
    a.tagliato = true; this.tagliati.add(n); this.s.tagliati.push(n)
    this.bloccoFisso.delete(chiave(a.i, a.j))
    this._evento('albero')
    return { ok: true, costo: COSTI.albero }
  }
  alberiNelTerreno() { return this.alberi.filter(a => !a.tagliato && this.cellaPropria(a.i, a.j)) }

  // ── i sassi e i cespugli: pochi per lotto, restano anche dopo l'acquisto; si tolgono toccandoli, 🪙 1 l'uno ──
  ostacoloSu(i, j) { const o = this.ostacoloPerCella.get(chiave(i, j)); return o && !o.tolto ? o : null }
  albero(n) { return this.alberiPerId.get(n) || null }
  ostacolo(n) { return this.ostacoliPerId.get(n) || null }
  puoTogliere(n) {
    const o = this.ostacolo(n)
    if (!o) return { ok: false, motivo: 'sconosciuto' }
    if (o.tolto) return { ok: false, motivo: 'gia-tolto' }
    if (!this.cellaPropria(o.i, o.j)) return { ok: false, motivo: 'fuori-terreno' }
    return { ok: true }
  }
  togliOstacolo(n) {
    const p = this.puoTogliere(n)
    if (!p.ok) return p
    if (!this._spendi(COSTI.ostacolo)) return { ok: false, motivo: 'poche-monete', costo: COSTI.ostacolo }
    const o = this.ostacolo(n)
    this._togliSenzaPagare(o)
    this._evento('sasso')
    return { ok: true, costo: COSTI.ostacolo, tipo: o.tipo }
  }
  _togliSenzaPagare(o) { o.tolto = true; this.tolti.add(o.id); if (!this.s.ostacoli.includes(o.id)) this.s.ostacoli.push(o.id); this.bloccoFisso.delete(chiave(o.i, o.j)) }
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
    if (this.lanaPronta(c).length) return this.spazioPer('lana') >= 1 ? { azione: 'tosa' } : { azione: null, motivo: 'scomparto-pieno', k: 'lana', max: this.capienzaDi('lana') }
    const fame = this.pecoreAffamate(c).length
    if (fame) {
      const colMangime = Math.floor(this.scortaMangime(PECORE.mangia) / PECORE.pastiPerLana)
      if (!colMangime) return { azione: null, ...this._senzaMangime(PECORE.mangia, PECORE.pastiPerLana) }
      const quante = Math.min(fame, colMangime, PECORE.costo ? Math.floor(this.monete() / PECORE.costo) : Infinity)       // ogni pecora nutrita dopo la tosa costa il gesto della 2D (la ricetta della lana)
      return quante ? { azione: 'nutri', n: quante } : { azione: null, motivo: 'poche-monete', costo: PECORE.costo }
    }
    if (this._pastoAlRecinto(c)) return this.scortaMangime(PECORE.mangia) >= 1 ? { azione: 'nutri' } : { azione: null, ...this._senzaMangime(PECORE.mangia, 1) }
    const t = this.ora(), resti = c.pecore.filter(p => p.eta === 'adulta' && p.t0 != null).map(p => PECORE.laneMs - (t - p.t0))
    return resti.length ? { azione: null, motivo: 'lana-ricresce', secondi: Math.ceil(Math.max(0, Math.min(...resti)) / 1000) } : { azione: null, motivo: 'sazie' }
  }
  /** La tosa: la lana passa alla scorta e la pecora ha fame (`t0: null`) finché non mangia. */
  tosa(id) {
    const c = this.cosa(id), pronte = c ? this.lanaPronta(c) : []
    if (!pronte.length) return { ok: false, motivo: 'non-pronta' }
    const n = Math.min(pronte.length, this.spazioPer('lana'))                    // lo scomparto della lana ha il suo tetto: le altre pecore aspettano
    if (n < 1) return { ok: false, motivo: 'scomparto-pieno', k: 'lana', max: this.capienzaDi('lana') }
    for (const p of pronte.slice(0, n)) p.t0 = null
    this.s.lana += n
    this._evento('tosa', { n })
    return { ok: true, n }
  }
  /** Un pasto: alle tosate (ognuna, finché c'è da mangiare: parte la lana); poi l'agnello cresce dopo due, due adulte ne fanno nascere uno. Torna cosa è successo. */
  nutri(id) {
    const c = this.cosa(id)
    const p = this.provaCura(id)
    if (!c || p.azione !== 'nutri') return { ok: false, motivo: p.motivo || 'niente-da-fare', ...(p.servono ? { servono: p.servono, mangia: p.mangia } : {}), ...(p.costo ? { costo: p.costo } : {}), ...(p.k ? { k: p.k, max: p.max } : {}) }
    if (this.pecoreAffamate(c).length) {
      let n = 0
      for (const x of this.pecoreAffamate(c)) {
        if (this.scortaMangime(PECORE.mangia) < PECORE.pastiPerLana) break
        if (PECORE.costo && !this._spendi(PECORE.costo)) break
        this._consumaTra(PECORE.mangia, PECORE.pastiPerLana)
        x.t0 = this.ora(); n++
      }
      if (n) return { ok: true, evento: 'lana', n, costo: n * PECORE.costo }
      return this.scortaMangime(PECORE.mangia) >= PECORE.pastiPerLana ? { ok: false, motivo: 'poche-monete', costo: PECORE.costo } : { ok: false, ...this._senzaMangime(PECORE.mangia, PECORE.pastiPerLana) }
    }
    if (!this._consumaTra(PECORE.mangia, 1)) return { ok: false, ...this._senzaMangime(PECORE.mangia, 1) }
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
  /** Cosa c'è da mangiare per questa bestia: il mangime che mangia, sommato. */
  scortaDaMangiare(tipo) { return this.scortaMangime(ANIMALI[tipo].mangia) }
  /** Cosa si farebbe toccando il pollaio o la stalla: prima si raccoglie, poi si nutre. Niente cambia. */
  provaCuraBestie(id) {
    const c = this.cosa(id)
    if (!c || !c.bestie) return { azione: null, motivo: 'sconosciuto' }
    const A = ANIMALI[c.tipo], pronte = this.bestiePronte(c).length
    if (pronte) return this.spazioPer(A.prodotto) >= 1 ? { azione: 'raccogli', n: Math.min(pronte, this.spazioPer(A.prodotto)) } : { azione: null, motivo: 'scomparto-pieno', k: A.prodotto, max: this.capienzaDi(A.prodotto) }
    const fame = this.bestieAffamate(c).length
    if (fame) {
      const colMangime = Math.floor(this.scortaDaMangiare(c.tipo) / A.pasti)
      if (!colMangime) return { azione: null, ...this._senzaMangime(A.mangia, A.pasti) }
      const quante = Math.min(fame, colMangime, A.costo ? Math.floor(this.monete() / A.costo) : Infinity)       // ogni pasto dato a una bestia costa il gesto della 2D (avviare la ricetta)
      return quante ? { azione: 'nutri', n: quante } : { azione: null, motivo: 'poche-monete', costo: A.costo }
    }
    const t = this.ora(), resto = Math.min(...c.bestie.map(b => b.fine - t))
    return { azione: null, motivo: 'lavora', secondi: Math.ceil(Math.max(0, resto) / 1000) }
  }
  /** Dà da mangiare a tutte le bestie che hanno fame, finché c'è da mangiare: ognuna comincia il suo lavoro. */
  nutriBestie(id) {
    const p = this.provaCuraBestie(id)
    if (p.azione !== 'nutri') return { ok: false, motivo: p.motivo || 'niente-da-fare', ...(p.servono ? { servono: p.servono, mangia: p.mangia } : {}), ...(p.costo ? { costo: p.costo } : {}), ...(p.k ? { k: p.k, max: p.max } : {}) }
    const c = this.cosa(id), A = ANIMALI[c.tipo], t = this.ora()
    let n = 0
    for (const b of this.bestieAffamate(c)) {
      if (this.scortaMangime(A.mangia) < A.pasti) break
      if (A.costo && !this._spendi(A.costo)) break
      this._consumaTra(A.mangia, A.pasti)
      b.fine = t + A.ms; n++
    }
    return { ok: true, n, costo: n * (A.costo || 0) }
  }
  /** Raccoglie ciò che le bestie hanno fatto: va in dispensa (`prodotti`), le bestie hanno di nuovo fame. */
  raccogliProdotti(id) {
    const c = this.cosa(id)
    if (!c || !c.bestie) return { ok: false, motivo: 'sconosciuto' }
    const pronte = this.bestiePronte(c)
    if (!pronte.length) return { ok: false, motivo: 'niente' }
    const A = ANIMALI[c.tipo], n = Math.min(pronte.length, this.spazioPer(A.prodotto))        // lo scomparto ha il suo tetto: le bestie che non ci stanno aspettano col loro prodotto
    if (n < 1) return { ok: false, motivo: 'scomparto-pieno', k: A.prodotto, max: this.capienzaDi(A.prodotto) }
    for (const b of pronte.slice(0, n)) b.fine = null
    this._riponi(A.prodotto, n)                                                              // la lana va nel suo contatore (`stato.lana`), il resto in `prodotti`
    this._evento(A.evento, { n })
    return { ok: true, n, prodotto: A.prodotto }
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

  // ── le macchine: mulino, pastificio (id pasticceria), panificio, caseificio, cucina (id conserviera), gelateria. Un posto di partenza, gli altri si comprano (dati/posti.js); si cuoce uno alla volta ──
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
    return { tipo, posti: postiInForma(q.posti), posseduta: !!this.s.posseduti[tipo], coda: q.coda, pronti: q.pronti }
  }
  /** Quanti posti ha ora la macchina di un tipo (da 1 a 6; 0 se non è una macchina). Una coda più lunga dei posti pagati lavora fino in fondo. */
  postiDi(tipo) { const q = this.s.macchine[tipo]; return q ? postiInForma(q.posti) : 0 }
  /** Il prezzo del prossimo posto della macchina (null al tetto o se non è una macchina). */
  prezzoProssimoPosto(tipo) { return MACCHINE[tipo] ? prezzoDelPosto(this.postiDi(tipo)) : null }
  /** Compra il prossimo posto di una macchina (senza conferma): { ok, costo, posti } o un rifiuto (`sconosciuta`, `non-posseduta`, `pieno` al sesto,
      `poche-monete` con `costo`). Conta come esperienza; l'evento `posto` porta il tipo e il numero. */
  compraPosto(tipo) {
    if (!MACCHINE[tipo]) return { ok: false, motivo: 'sconosciuta' }
    if (!this.s.posseduti[tipo]) return { ok: false, motivo: 'non-posseduta' }
    const posti = this.postiDi(tipo), costo = prezzoDelPosto(posti)
    if (posti >= POSTI_MASSIMI || costo === null) return { ok: false, motivo: 'pieno' }
    if (!this._spendi(costo)) return { ok: false, motivo: 'poche-monete', costo }
    this.s.macchine[tipo].posti = posti + 1
    this._evento('posto', { macchina: tipo, posti: posti + 1 })
    return { ok: true, costo, posti: posti + 1 }
  }
  /** Le ricette di una macchina, con il livello vero, se sono aperte e se ora si possono avviare. */
  ricetteDi(tipo) {
    const m = MACCHINE[tipo]
    if (!m) return []
    return Object.entries(m.ricette).map(([id, r]) => {
      const liv = livelloDellaRicetta(id)
      return { id, nome: r.nome, emoji: r.emoji, ing: r.ing, ms: r.ms, costo: r.costo || 0, liv, sbloccata: liv <= this.livello(), ingredienti: this.ingredientiOk(id), mancano: this.mancano(id) }
    })
  }
  avviaRicettaIn(tipo, ric) {
    const m = MACCHINE[tipo], r = RICETTE[ric]
    if (!m || !r || r.dove !== tipo) return { ok: false, motivo: 'sconosciuta' }
    if (!this.s.posseduti[tipo]) return { ok: false, motivo: 'non-tua' }
    const chiuso = this._chiusa(livelloDellaRicetta(ric))
    if (chiuso) return chiuso
    const Q = this.s.macchine[tipo]
    if (Q.coda.length >= this.postiDi(tipo)) return { ok: false, motivo: 'forno-pieno' }
    if (!this.ingredientiOk(ric)) return { ok: false, motivo: 'mancano-ingredienti', mancano: this.mancano(ric) }
    const costo = r.costo || 0                                   // 🪙 per avviare la ricetta: quello della 2D (0, 1 o 2)
    if (costo && !this._spendi(costo)) return { ok: false, motivo: 'poche-monete', costo }
    for (const [k, n] of Object.entries(r.ing)) this._togli(k, n)
    Q.coda.push({ ric, fine: null })
    this.tick()
    return { ok: true, costo }
  }
  /** La ricetta, nella macchina a cui appartiene. */
  avviaRicetta(ric) { return RICETTE[ric] ? this.avviaRicettaIn(RICETTE[ric].dove, ric) : { ok: false, motivo: 'sconosciuta' } }
  ritiraDa(tipo) {
    const Q = this.s.macchine[tipo]
    if (!Q) return { ok: false, motivo: 'sconosciuta' }
    let n = 0, pieno = null
    for (const [k, q] of Object.entries(Q.pronti)) {
      const entra = this._riponi(k, q)                           // lo scomparto ha il suo tetto: il resto aspetta nella macchina
      if (entra < q) pieno = pieno || k
      if (entra) { n += entra; this._evento('prodotto', { ric: k, n: entra, macchina: tipo }) }
      if (entra >= q) delete Q.pronti[k]; else if (entra) Q.pronti[k] = q - entra
    }
    if (n) return { ok: true, n, ...(pieno ? { pieno } : {}) }
    return pieno ? { ok: false, motivo: 'scomparto-pieno', k: pieno, max: this.capienzaDi(pieno) } : { ok: false, motivo: 'niente' }
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
      // le macchine che l'ordine vuole e che non hai ancora messo in mappa: il biglietto dice «Serve il Panificio» col «!»
      const servono = [...new Set(chiede.filter(c => c.prodotto && RICETTE[c.k]).map(c => RICETTE[c.k].dove))].filter(t => EDIFICI[t] && !this.s.posseduti[t])
      return { idx, id: o.id, cliente: clienteDi(o.cliente), chiede, premio: o.premio, liv: o.liv, tipo: tipoDelOrdine(o.chiede), pronto: chiede.every(c => !c.manca),
               senzaMacchina: servono.map(t => ({ tipo: t, nome: EDIFICI[t].nome, art: EDIFICI[t].art, emoji: EDIFICI[t].emoji })) }
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

  // ── le botteghe del paese: pasticceria, osteria, mensa, merceria (motore/botteghe.js, docs/fattoria3d/botteghe.md). Esperienza, mai monete ──
  /** Tutto quello che il foglio di una bottega vuole sapere: la fama e un bancone per volta (cliente con la roba chiesta, oppure l'attesa). */
  vistaBottega(tipo) { return vistaDellaBottega(this, tipo) }
  /** Consegna al cliente `n` della bottega: { ok, xp, cliente, cresciuta } o { ok: false, motivo, mancano? }. */
  consegnaBottega(tipo, n) { return consegnaInBottega(this, tipo, n) }
  /** «Non mi va»: stessa attesa di una consegna. */
  rifiutaBottega(tipo, n) { return rifiutaInBottega(this, tipo, n) }
  /** Quanti clienti di una bottega (o di tutte) hanno già la loro roba: il numero del cartello e il pallino. */
  bottegaPronta(tipo) { return daConsegnareIn(this, tipo) }
  botteghePronte() { return daConsegnareOvunque(this) }

  // ── la pesca: molo e porticciolo, un banco per lotto d'acqua tuo (motore/pesca.js, docs/fattoria3d/geografia-e-pesca.md) ──
  /** Cosa si farebbe toccando la cella d'acqua (i, j): { ok, azione: 'lancia' | 'ritira' | 'aspetta' | 'riposo', sta, … } o un rifiuto. Niente cambia. */
  provaPesca(i, j) { return provaPesca(this, i, j) }
  /** Lancia la lenza in (i, j). */
  lanciaLenza(i, j) { return lanciaLenza(this, i, j) }
  /** Ritira il pesce del banco (id del lotto d'acqua) se abbocca. */
  ritiraPesca(lotto) { return ritiraPesca(this, lotto) }
  /** Il banco di un lotto: { stato: 'calmo' | 'attesa' | 'abbocca' | 'riposo', restoMs }. */
  bancoDi(lotto) { return bancoDi(this, lotto) }
  /** Le lenze in acqua o col pesce all'amo: [{ lotto, i, j, stato, restoMs }]. */
  lenze() { return lenzeInAcqua(this) }
  /** I posti da cui si lancia (i moli e il porticciolo). */
  postiDiPesca() { return postiDiPesca(this) }
  /** Di che acqua è la cella: 'mare' o 'dolce'. */
  tipoAcqua(i, j) { return tipoAcqua(i, j) }

  // ── il tempo: la cottura che avanza e la mongolfiera che torna (si può chiamare quando si vuole) ──
  tick() {
    const t = this.ora(); let cambiato = false
    for (const tipo of TIPI_DI_MACCHINA) {
      const Q = this.s.macchine[tipo]
      while (Q.coda.length && Q.coda[0].fine && Q.coda[0].fine <= t) {
        const r = Q.coda.shift(), prodotto = RICETTE[r.ric].da || r.ric         // `da`: due strade per lo stesso prodotto (foraggio di carote e d'erba medica)
        Q.pronti[prodotto] = (Q.pronti[prodotto] || 0) + 1; cambiato = true
        if (Q.coda[0]) Q.coda[0].fine = r.fine + RICETTE[Q.coda[0].ric].ms     // il successivo parte quando finisce il precedente
      }
      if (Q.coda[0] && !Q.coda[0].fine) Q.coda[0].fine = t + RICETTE[Q.coda[0].ric].ms
    }
    if (aggiornaMongolfiera(this)) cambiato = true
    if (aggiornaLeBotteghe(this)) cambiato = true
    ripulisciPesca(this)
    if (this._riempiOrdini()) cambiato = true
    if (this._assicuraMagazzini()) cambiato = true
    return cambiato
  }

  /** Quante cose aspettano semina e raccolta: i numeri sui tasti. */
  daFare() {
    let semina = 0, raccogli = 0
    for (const c of this.s.cose) if (c.tipo === 'campo') { if (this.campoVuoto(c)) semina++; else if (this.campoMaturo(c)) raccogli++ }
    return { semina, raccogli }
  }

  // ── le prove di stress: tante cose in più, che non si salvano ──
  // `edifici`: gli edifici a giro, anche più di uno per tipo (solo per misurare il peso: docs/fattoria3d/limiti.md)
  aggiungiProve(tipo, n) {
    if (tipo === 'edifici') { let f = 0; const tipi = Object.keys(EDIFICI); for (let k = 0; k < n; k++) f += this.aggiungiProve(tipi[k % tipi.length], 1); return f }
    const d = PEZZI[tipo] || EDIFICI[tipo]
    if (!d) return 0
    const posti = []
    for (let i = LIM.i0 + 1; i + d.w < LIM.i1; i += d.w + 1) for (let j = LIM.j0 + 1; j + d.d < LIM.j1; j += d.d + 1) posti.push([i, j])
    posti.sort(() => this.rnd() - 0.5)
    let fatti = 0
    for (const [i, j] of posti) {
      if (fatti >= n) break
      let ok = true
      // anche sul terreno non comprato e sopra gli alberi: le prove misurano il peso, non giocano (con poche celle tue non ci starebbe niente)
      for (let a = -1; a <= d.w && ok; a++) for (let b = -1; b <= d.d && ok; b++) if (this.cellaCosa.get(chiave(i + a, j + b)) || this.acqua(i + a, j + b)) ok = false
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
    for (const [k, v] of this.strada) if (v === 1) { const c = cellaDa(k); s.strade.push(idCella(c[0], c[1])) }
    return JSON.parse(JSON.stringify(s))
  }
}

