/* Lo stato che si salva (in profile.campagne.fattoria3d.cfg.stato) e come si rimette in forma quando si legge: un salvataggio
   di ieri non ha bisogno di migrazioni, i campi che mancano si riempiono. Dato + funzioni pure. */
import { LOTTI_INIZIALI, PEZZO_DI_PARTENZA, POSTI_STORICI, lottoPerId } from '../dati/mondo.js'
import { lottoDiversoDa } from '../dati/biomi.js'
import { CHIAVI_COLTURE, TESSERE } from '../dati/colture.js'
import { TIPI_DI_EDIFICIO, EDIFICI, PEZZI } from '../dati/catalogo.js'
import { TIPI_DI_MACCHINA, MACCHINE, RICETTE, nuovoId } from '../dati/ricette.js'
import { ANIMALI, PRODOTTI_ANIMALI } from '../dati/animali.js'
import { MANGIMI_SENZA_RICETTA } from '../dati/cortile2.js'
import { ruotabile, rotLetta } from '../dati/rotazione.js'
import { POSTI } from '../dati/ordini.js'
import { livelloPer } from '../dati/livelli.js'
import { ordineInForma } from './ordini.js'
import { stivaInForma } from './mongolfiera.js'
import { leggiLeBotteghe } from './botteghe.js'
import { RIPOSO_MS } from '../dati/mongolfiera.js'
import { casaIniziale, casaInForma } from '../dati/bestie.js'
import { POSTI_DI_PARTENZA, postiInForma } from '../dati/posti.js'
import { TIPI_DI_SILO } from '../dati/silos.js'
import { esperienzaDaPrima, livelloMinimoDi } from './scala-vecchia.js'

const LANA_DEL_SEGNAPOSTO = 2     // il premio della cassa del segnaposto di prima (v7)

// 2: l'esperienza, un `posseduti` per ogni edificio, le macchine per tipo (la pasticceria di prima è `macchine.pasticceria`)
// 3: il banco degli ordini (`ordini`); un v2 si legge senza perdere niente, il banco si riempie da sé
// 4: pollaio e stalla (`bestie` sulla cosa: [{ fine }], `fine` è quando il prodotto è pronto, null se ha fame); un v3 si legge uguale
// 5: le bestie si comprano dentro l'edificio (recinto 4 pecore, pollaio 6 galline, stalla 4 mucche), niente posti per livello: la
//    forma dei dati non cambia, un v4 si legge uguale e ciò che si aveva resta (anche un recinto con più pecore di una)
// 6: niente legna (il campo di un vecchio stato si ignora), e `ostacoli`: gli id (le celle) dei sassi e dei cespugli già tolti
// 7: le merci e le ricette sono quelle della fattoria di sempre (docs/fattoria3d/merci-e-ricette.md): `normalizza` traduce gli id
//    di prima (`MERCI_VECCHIE`) nelle scorte, nelle code e nei pronti, negli ordini aperti e nello stato dei vicini, un pezzo per un pezzo
// 8: il mondo senza confini: i lotti `a_b` hanno coordinate intere qualunque; gli id di strade, sassi e alberi valgono una cella (nei lotti storici
//    come prima, fuori la chiave impacchettata di dati/mondo.js). Niente da tradurre: un v7 si legge uguale
// 9: gli edifici sono pezzi liberi (docs/fattoria3d/edifici-liberi.md): uno posseduto sta in `cose` come `{ id, tipo: 'mulino', i, j }`, uno
//    comprato e non messo nel `magazzino` (al massimo uno); `posseduti[tipo]` vuol dire «è in mappa» e `normalizza` lo rifà dalle cose.
//    Un v8 con un edificio comprato lo ritrova dov'era il suo posto fisso (`POSTI_STORICI`), con la coda, i pronti e la stiva com'erano
//    Senza cambiare versione (niente da tradurre, un v9 si legge uguale): `geo` (1 = la geografia grande, mare a ovest e laghi a est: docs/fattoria3d/geografia-e-pesca.md; 2 = anche i laghi naturali grandi della fascia di mezzo: docs/fattoria3d/laghi.md),
//    `vecchi` e `vecchi1` (gli id dei lotti che un salvataggio senza `geo`, o con `geo: 1`, aveva già comprato dove ora il lotto sarebbe diverso: restano com'erano) e `pesca` (le lenze e i banchi)
//    Il mangime (docs/fattoria3d/mangime-e-catena.md) non cambia la versione: l'erba medica è una coltura in più (`merci.erba`, a zero), il fienile una macchina in più (vuota, non
//    comprata), becchime e foraggio stanno in `prodotti`; le bestie di prima restano, e se hanno fame chiedono il mangime nuovo.
// 10: la scala della 2D (docs/fattoria3d/livelli.md, «I salvataggi di prima»). Senza cambiare la forma: `scala: 2` dice che `esperienza` è sulla scala
//    nuova (70 livelli, prezzi, tempi in minuti e silos della 2D); uno stato senza `scala` ha l'esperienza sulla scala di prima (22 livelli) e `normalizza` la porta
//    nello stesso punto del percorso (motore/scala-vecchia.js), senza scendere sotto il livello che serve a tenere ciò che si ha. `silo`: quante volte è stato
//    ingrandito ciascun magazzino (dati/silos.js), assente = zero. Un raccolto di prima in scorta resta anche se supera lo scomparto: il tetto frena solo ciò che entra.
export const VERSIONE_STATO = 10
export const SCALA_ATTUALE = 2

const vuote = () => Object.fromEntries(CHIAVI_COLTURE.map(k => [k, 0]))

// `posti`: quanti posti ha la macchina (1 di partenza, fino a 6: dati/posti.js). Un vecchio stato senza il campo vale 1; una coda già più lunga
// (quando i posti erano tre) lavora fino in fondo, poi si torna ai posti pagati. Niente da migrare: `normalizza` basta, la versione non sale.
const macchinaVuota = () => ({ coda: [], pronti: {}, posti: POSTI_DI_PARTENZA })
const CODA_STORICA = 3                // i posti di una volta: una coda così lunga non si butta

/** `s.pasticceria` resta leggibile (la scena e la vista di prima lo usano) ma non si salva due volte: è la macchina. */
function conAlias(s) {
  Object.defineProperty(s, 'pasticceria', { get() { return s.macchine.pasticceria }, enumerable: false, configurable: true })
  return s
}

export function statoIniziale() {
  return conAlias({
    v: VERSIONE_STATO,
    merci: vuote(), prodotti: {}, lana: 0,
    esperienza: 0,             // monete spese in questo gioco; non scende mai (dati/livelli.js ne ricava il livello)
    scala: SCALA_ATTUALE,      // 2 = la scala dei livelli della 2D; uno stato senza `scala` ha l'esperienza sulla scala di prima e `normalizza` la porta qui
    silo: Object.fromEntries(TIPI_DI_SILO.map(t => [t, 0])),      // quante volte è stato ingrandito ogni magazzino (+2 pezzi per scomparto, dati/silos.js)
    posseduti: Object.fromEntries(TIPI_DI_EDIFICIO.map(t => [t, false])),
    lotti: { ...LOTTI_INIZIALI },
    geo: 2,                    // la geografia: 1 = mare a ovest e laghi a est, 2 = anche i laghi naturali nella fascia di mezzo; uno stato più vecchio tiene i suoi lotti com'erano
    vecchi: [],                // gli id (`a_b`) dei lotti comprati prima della geografia grande dove ora cambierebbe qualcosa: si generano alla vecchia (generaLotto `vecchio: true`)
    vecchi1: [],               // gli id dei lotti comprati con `geo: 1` dove ora c'è un lago naturale al posto della pozzanghera: restano com'erano (generaLotto `vecchio: 1`)
    casa: casaIniziale(),      // le bestie di casa che hai preso (docs/fattoria3d/bestie-di-casa.md): { beagle: { pancia, pelo, gioco, quando, premiato, nome?, i?, j? } }
    pesca: {},                 // per lotto d'acqua tuo: { i, j (dove sta il galleggiante), fine (quando abbocca, null se non c'è la lenza), riposo (quando il banco si ripopola, null) }
    strade: [],                // le celle (indice di griglia) disegnate dal bambino
    daRegalare: {},            // ciò che la fattoria 2D aveva e la 3D non ha ancora ({ 'cosa:ovile': 1, 'scorta:miele': 4, 'terra': 2 }): solo un conto, mai monete (motore/migra.js)
    migrato: 0,                // >0 se lo stato viene dalla fattoria 2D: il numero della conversione che l'ha fatto (motore/migra.js, MIGRAZIONE)
    magazzino: {},             // pezzi pagati e non ancora messi: { campo: 1 }
    tagliati: [],              // i numeri degli alberi abbattuti
    ostacoli: [],              // gli id (le celle) dei sassi e dei cespugli tolti
    cose: [{ id: 1, tipo: PEZZO_DI_PARTENZA.tipo, i: PEZZO_DI_PARTENZA.i, j: PEZZO_DI_PARTENZA.j, tile: nuoveTessere() }],
    prossimoId: 2,
    macchine: Object.fromEntries(TIPI_DI_MACCHINA.map(t => [t, macchinaVuota()])),
    mongolfiera: { stiva: null, via: null, riposo: null, giri: 0 },   // la nave (docs/fattoria3d/mongolfiera.md): il carico da riempire, quando è partita e quando torna, i viaggi fatti
    ordini: { aperti: Array(POSTI(1)).fill(null), riprende: Array(POSTI(1)).fill(null), prossimoId: 1 },   // il banco: un ordine o null per posto; `riprende` è quando un posto vuoto si riempie
    botteghe: {},              // le quattro botteghe del paese (docs/fattoria3d/botteghe.md), per tipo: { consegne (i cuori della fama), prossimo, banconi: [cliente | { dal } | null] }
  })
}

export const nuoveTessere = () => Array.from({ length: TESSERE }, () => null)

/** Le bestie di un pollaio o di una stalla, rimesse in forma: da una a `posti`, ognuna con la fine del suo lavoro o null. */
export function bestieInForma(tipo, letto) {
  const a = ANIMALI[tipo]
  const l = Array.isArray(letto) ? letto.slice(0, a.posti).map(b => ({ fine: b && Number.isFinite(b.fine) ? b.fine : null })) : []
  return l.length ? l : [{ fine: null }]
}

const numero = (v, d = 0) => Number.isFinite(v) && v >= 0 ? v : d
const oggetto = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {}

/** Una chiave che può stare in `prodotti`: una ricetta, un prodotto delle bestie o un mangime senza ricetta. */
const merceDiProdotti = k => !!(RICETTE[k] || PRODOTTI_ANIMALI[k] || MANGIMI_SENZA_RICETTA[k])

/** Rimette in forma uno stato letto (o niente): mai un'eccezione, mai un campo che manca. */
export function normalizza(letto) {
  const base = statoIniziale()
  if (!letto || typeof letto !== 'object') return base
  const s = base
  for (const k of CHIAVI_COLTURE) s.merci[k] = numero(oggetto(letto.merci)[k])
  for (const [vecchio, n] of Object.entries(oggetto(letto.prodotti))) {
    const k = nuovoId(vecchio)
    if (numero(n) > 0 && merceDiProdotti(k)) s.prodotti[k] = (s.prodotti[k] || 0) + numero(n)         // un id che la 3D non conosce (i `tartufi` di prima) si perde, mai un'eccezione
  }
  s.lana = numero(letto.lana)
  s.esperienza = numero(letto.esperienza)
  for (const t of TIPI_DI_SILO) { const n = oggetto(letto.silo)[t]; s.silo[t] = Number.isInteger(n) && n > 0 ? Math.min(60, n) : 0 }
  const lotti = oggetto(letto.lotti)
  s.lotti = Object.keys(lotti).length ? Object.fromEntries(Object.entries(lotti).filter(([k, v]) => v && lottoPerId(k)).map(([k]) => [k, true])) : s.lotti
  // la geografia grande: uno stato di prima (senza `geo`) tiene com'erano i lotti già comprati che ora sarebbero diversi (mare, costa, lago, o un laghetto che sparisce)
  // `geo: 1` ha già la sua lista; i suoi lotti comprati dove ora c'è un lago naturale (o altro che cambia) restano com'erano (`vecchi1`). `geo: 2` ha tutte e due le liste.
  const lista = (v, tieni) => Array.isArray(v) ? [...new Set(v.filter(id => typeof id === 'string' && lottoPerId(id) && s.lotti[id] && tieni(id)))] : []
  const diverso = (gen, id) => { const l = lottoPerId(id); return l && lottoDiversoDa(l, gen) }
  if (letto.geo === 1 || letto.geo === 2) {
    s.vecchi = lista(letto.vecchi, () => true)
    s.vecchi1 = letto.geo === 2 ? lista(letto.vecchi1, id => !s.vecchi.includes(id))
      : Object.keys(s.lotti).filter(id => !s.vecchi.includes(id) && diverso(1, id))
  } else {
    s.vecchi = Object.keys(s.lotti).filter(id => diverso(0, id))
    s.vecchi1 = []
  }
  s.casa = casaInForma(letto.casa)       // le bestie di casa (assenti prima del giro G6, senza cambiare versione): uno stato di prima non ne ha
  for (const [id, v] of Object.entries(oggetto(letto.pesca))) {
    if (!lottoPerId(id) || !v || typeof v !== 'object' || !Number.isInteger(v.i) || !Number.isInteger(v.j)) continue
    const fine = Number.isFinite(v.fine) ? v.fine : null, riposo = Number.isFinite(v.riposo) ? v.riposo : null
    if (fine !== null || riposo !== null) s.pesca[id] = { i: v.i, j: v.j, fine, riposo }
  }
  for (const [k, n] of Object.entries(oggetto(letto.daRegalare)).slice(0, 400)) if (typeof k === 'string' && k.length <= 64 && numero(n) >= 1) s.daRegalare[k] = Math.min(9999, Math.floor(n))
  s.migrato = Number.isInteger(letto.migrato) && letto.migrato > 0 ? Math.min(99, letto.migrato) : 0
  s.strade = Array.isArray(letto.strade) ? letto.strade.filter(Number.isInteger) : []
  for (const [k, n] of Object.entries(oggetto(letto.magazzino))) if (numero(n) > 0) s.magazzino[k] = numero(n)
  s.tagliati = Array.isArray(letto.tagliati) ? letto.tagliati.filter(Number.isInteger) : []
  s.ostacoli = Array.isArray(letto.ostacoli) ? [...new Set(letto.ostacoli.filter(Number.isInteger))] : []
  if (Array.isArray(letto.cose)) {
    let id = 1
    const edificiVisti = new Set()                 // un edificio è uno per tipo: il secondo si butta
    s.cose = letto.cose.filter(c => c && (PEZZI[c.tipo] || EDIFICI[c.tipo]) && Number.isInteger(c.i) && Number.isInteger(c.j)
      && !(EDIFICI[c.tipo] && (edificiVisti.has(c.tipo) || !edificiVisti.add(c.tipo)))).map(c => {
      const x = { id: Number.isInteger(c.id) && c.id >= id ? c.id : id, tipo: c.tipo, i: c.i, j: c.j }
      id = x.id + 1
      if (c.tipo === 'campo') {
        x.tile = Array.from({ length: TESSERE }, (_, k) => Number.isFinite((c.tile || [])[k]) ? c.tile[k] : null)
        if (typeof c.coltura === 'string') x.coltura = c.coltura
      }
      if (c.tipo === 'recinto') {
        x.pecore = Array.isArray(c.pecore) && c.pecore.length ? c.pecore.map(p => p && p.eta === 'agnello' ? { eta: 'agnello', cibo: numero(p.cibo) } : { eta: 'adulta', t0: p && p.t0 === null ? null : numero(p && p.t0) }) : null
        x.cibo = numero(c.cibo)
      }
      if (ANIMALI[c.tipo]) x.bestie = bestieInForma(c.tipo, c.bestie)
      if (ruotabile(c.tipo) && rotLetta(c.rot)) x.rot = rotLetta(c.rot)          // un quarto di giro: assente = 0 (dati/rotazione.js)
      return x
    })
    s.prossimoId = s.cose.reduce((m, c) => Math.max(m, c.id), 0) + 1
  }
  // gli edifici: in mappa se c'è la cosa; un v8 (o un v9 guasto) con `posseduti[tipo]` e nessuna cosa lo mette al suo posto di una volta;
  // uno nel magazzino (comprato, non messo) è al più uno e non è in mappa
  for (const t of TIPI_DI_EDIFICIO) {
    if (s.cose.some(c => c.tipo === t)) delete s.magazzino[t]
    else if (s.magazzino[t]) s.magazzino[t] = 1
    else if (oggetto(letto.posseduti)[t]) s.cose.push({ id: s.prossimoId++, tipo: t, i: POSTI_STORICI[t].i, j: POSTI_STORICI[t].j })
    s.posseduti[t] = s.cose.some(c => c.tipo === t)
  }
  // la scala: l'esperienza di uno stato di prima vale sulla scala di prima (22 livelli); la si porta sulla scala della 2D nello stesso punto del percorso
  if (letto.scala !== SCALA_ATTUALE) s.esperienza = esperienzaDaPrima(s.esperienza, livelloMinimoDi(s))
  // le macchine: un v1 aveva solo `pasticceria` in radice. Un v6 aveva altre ricette: ogni cosa in forno o pronta diventa il suo cugino di
  // oggi (`nuovoId`); se il cugino sta in un'altra macchina (il pane, che era della pasticceria) arriva subito in dispensa, se no resta
  // dov'era. Niente si perde: ciò che non entra nei tre posti va fra i pronti, e i pronti si ritirano.
  const macchine = oggetto(letto.macchine)
  const vecchie = new Set([...Object.keys(macchine), ...(letto.pasticceria ? ['pasticceria'] : [])])
  for (const t of TIPI_DI_MACCHINA) s.macchine[t] = macchinaVuota()
  const alloggia = (t, ric, n, fine) => {
    const id = nuovoId(ric), r = RICETTE[id]
    if (!r || !(n >= 1)) return
    if (r.dove !== t) { s.prodotti[id] = (s.prodotti[id] || 0) + n; return }
    const Q = s.macchine[t]
    for (let i = 0; i < n; i++) {
      if (Q.coda.length < Math.max(Q.posti, CODA_STORICA)) Q.coda.push({ ric: id, fine: Q.coda.length === 0 && Number.isFinite(fine) ? fine : null })
      else Q.pronti[id] = (Q.pronti[id] || 0) + 1
    }
  }
  for (const t of vecchie) {
    const p = oggetto(macchine[t] || (t === 'pasticceria' ? letto.pasticceria : null))
    if (MACCHINE[t]) s.macchine[t].posti = postiInForma(p.posti)
    if (Array.isArray(p.coda)) for (const x of p.coda) if (x && typeof x.ric === 'string') alloggia(MACCHINE[t] ? t : '', x.ric, 1, x.fine)
    for (const [k, n] of Object.entries(oggetto(p.pronti))) {
      const id = nuovoId(k), r = RICETTE[id] || MANGIMI_SENZA_RICETTA[id]        // i pronti sono chiavi di PRODOTTO: `fiori` non ha una ricetta col suo id
      if (!r || !(numero(n) > 0)) continue
      if (r.dove !== t || !MACCHINE[t]) s.prodotti[id] = (s.prodotti[id] || 0) + numero(n)
      else s.macchine[t].pronti[id] = (s.macchine[t].pronti[id] || 0) + numero(n)
    }
  }
  // la mongolfiera: il segnaposto di prima (`fine`, `cassa`: carichi 2 raccolti, torna una cassa di lana) si chiude senza lamentele; un
  // viaggio in corso o una cassa da ritirare valgono la lana che avrebbero dato (+2), così niente si perde. I campi nuovi si riempiono.
  const m = oggetto(letto.mongolfiera)
  if (m.cassa || Number.isFinite(m.fine)) s.lana += LANA_DEL_SEGNAPOSTO
  const riposo = Number.isFinite(m.riposo) ? m.riposo : null
  s.mongolfiera = {
    stiva: riposo === null ? stivaInForma(m.stiva) : null,
    via: riposo === null ? null : (Number.isFinite(m.via) ? m.via : riposo - RIPOSO_MS),
    riposo, giri: Number.isInteger(m.giri) && m.giri > 0 ? m.giri : 0,
  }
  // il banco (assente prima del v3): ordini guasti diventano posti vuoti, che il banco riempie
  const o = oggetto(letto.ordini)
  // i posti sono almeno quelli del livello e mai meno di quelli salvati (un ordine non si perde); un elenco corto si riempie
  const posti = Math.max(Math.min(16, Array.isArray(o.aperti) ? o.aperti.length : 0), POSTI(livelloPer(s.esperienza)))
  s.ordini.aperti = Array(posti).fill(null); s.ordini.riprende = Array(posti).fill(null)
  for (let k = 0; k < posti; k++) {
    s.ordini.aperti[k] = Array.isArray(o.aperti) ? ordineInForma(o.aperti[k]) : null
    s.ordini.riprende[k] = Array.isArray(o.riprende) && Number.isFinite(o.riprende[k]) ? o.riprende[k] : null
  }
  s.ordini.prossimoId = Math.max(numero(o.prossimoId, 1), 1, ...s.ordini.aperti.map(x => x ? x.id + 1 : 1))
  // le botteghe (assenti prima del giro G7, senza cambiare versione): uno stato di prima non ne ha, e nascono vuote
  s.botteghe = leggiLeBotteghe(letto.botteghe)
  return s
}
