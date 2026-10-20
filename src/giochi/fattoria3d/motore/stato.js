/* Lo stato che si salva (in profile.campagne.fattoria3d.cfg.stato) e come si rimette in forma quando si legge: un salvataggio
   di ieri non ha bisogno di migrazioni, i campi che mancano si riempiono. Dato + funzioni pure. */
import { LOTTI_INIZIALI, PEZZO_DI_PARTENZA } from '../dati/mondo.js'
import { CHIAVI_COLTURE, TESSERE } from '../dati/colture.js'
import { TIPI_DI_EDIFICIO } from '../dati/catalogo.js'
import { TIPI_DI_MACCHINA, RICETTE } from '../dati/ricette.js'
import { ANIMALI } from '../dati/animali.js'
import { POSTI } from '../dati/ordini.js'
import { ordineInForma } from './ordini.js'

// 2: l'esperienza, un `posseduti` per ogni edificio, le macchine per tipo (la pasticceria di prima è `macchine.pasticceria`)
// 3: il banco degli ordini (`ordini`); un v2 si legge senza perdere niente, il banco si riempie da sé
// 4: pollaio e stalla (`bestie` sulla cosa: [{ fine }], `fine` è quando il prodotto è pronto, null se ha fame); un v3 si legge uguale
// 5: le bestie si comprano dentro l'edificio (recinto 4 pecore, pollaio 6 galline, stalla 4 mucche), niente posti per livello: la
//    forma dei dati non cambia, un v4 si legge uguale e ciò che si aveva resta (anche un recinto con più pecore di una)
// 6: niente legna (il campo di un vecchio stato si ignora), e `ostacoli`: gli id (le celle) dei sassi e dei cespugli già tolti
export const VERSIONE_STATO = 6

const vuote = () => Object.fromEntries(CHIAVI_COLTURE.map(k => [k, 0]))

const macchinaVuota = () => ({ coda: [], pronti: {} })

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
    posseduti: Object.fromEntries(TIPI_DI_EDIFICIO.map(t => [t, false])),
    lotti: { ...LOTTI_INIZIALI },
    strade: [],                // le celle (indice di griglia) disegnate dal bambino
    magazzino: {},             // pezzi pagati e non ancora messi: { campo: 1 }
    tagliati: [],              // i numeri degli alberi abbattuti
    ostacoli: [],              // gli id (le celle) dei sassi e dei cespugli tolti
    cose: [{ id: 1, tipo: PEZZO_DI_PARTENZA.tipo, i: PEZZO_DI_PARTENZA.i, j: PEZZO_DI_PARTENZA.j, tile: nuoveTessere() }],
    prossimoId: 2,
    macchine: Object.fromEntries(TIPI_DI_MACCHINA.map(t => [t, macchinaVuota()])),
    mongolfiera: { fine: null, cassa: false },
    ordini: { aperti: Array(POSTI).fill(null), riprende: Array(POSTI).fill(null), prossimoId: 1 },   // il banco: un ordine o null per posto; `riprende` è quando un posto vuoto si riempie
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

/** Rimette in forma uno stato letto (o niente): mai un'eccezione, mai un campo che manca. */
export function normalizza(letto) {
  const base = statoIniziale()
  if (!letto || typeof letto !== 'object') return base
  const s = base
  for (const k of CHIAVI_COLTURE) s.merci[k] = numero(oggetto(letto.merci)[k])
  for (const [k, n] of Object.entries(oggetto(letto.prodotti))) if (numero(n) > 0) s.prodotti[k] = numero(n)
  s.lana = numero(letto.lana)
  s.esperienza = numero(letto.esperienza)
  for (const t of TIPI_DI_EDIFICIO) s.posseduti[t] = !!oggetto(letto.posseduti)[t]
  const lotti = oggetto(letto.lotti)
  s.lotti = Object.keys(lotti).length ? Object.fromEntries(Object.entries(lotti).filter(([, v]) => v).map(([k]) => [k, true])) : s.lotti
  s.strade = Array.isArray(letto.strade) ? letto.strade.filter(Number.isInteger) : []
  for (const [k, n] of Object.entries(oggetto(letto.magazzino))) if (numero(n) > 0) s.magazzino[k] = numero(n)
  s.tagliati = Array.isArray(letto.tagliati) ? letto.tagliati.filter(Number.isInteger) : []
  s.ostacoli = Array.isArray(letto.ostacoli) ? [...new Set(letto.ostacoli.filter(Number.isInteger))] : []
  if (Array.isArray(letto.cose)) {
    let id = 1
    s.cose = letto.cose.filter(c => c && typeof c.tipo === 'string' && Number.isInteger(c.i) && Number.isInteger(c.j)).map(c => {
      const x = { id: Number.isInteger(c.id) && c.id >= id ? c.id : id, tipo: c.tipo, i: c.i, j: c.j }
      id = x.id + 1
      if (c.tipo === 'campo') {
        x.tile = Array.from({ length: TESSERE }, (_, k) => Number.isFinite((c.tile || [])[k]) ? c.tile[k] : null)
        if (typeof c.coltura === 'string') x.coltura = c.coltura
      }
      if (c.tipo === 'recinto') {
        x.pecore = Array.isArray(c.pecore) && c.pecore.length ? c.pecore.map(p => p && p.eta === 'agnello' ? { eta: 'agnello', cibo: numero(p.cibo) } : { eta: 'adulta', t0: numero(p && p.t0) }) : null
        x.cibo = numero(c.cibo)
      }
      if (ANIMALI[c.tipo]) x.bestie = bestieInForma(c.tipo, c.bestie)
      return x
    })
    s.prossimoId = s.cose.reduce((m, c) => Math.max(m, c.id), 0) + 1
  }
  // le macchine: un v1 aveva solo `pasticceria` in radice
  const macchine = oggetto(letto.macchine)
  for (const t of TIPI_DI_MACCHINA) {
    const p = oggetto(macchine[t] || (t === 'pasticceria' ? letto.pasticceria : null))
    s.macchine[t] = {
      coda: Array.isArray(p.coda) ? p.coda.filter(x => x && typeof x.ric === 'string' && RICETTE[x.ric] && RICETTE[x.ric].dove === t)
        .map(x => ({ ric: x.ric, fine: Number.isFinite(x.fine) ? x.fine : null })) : [],
      pronti: Object.fromEntries(Object.entries(oggetto(p.pronti)).filter(([k, n]) => RICETTE[k] && RICETTE[k].dove === t && numero(n) > 0).map(([k, n]) => [k, numero(n)])),
    }
  }
  const m = oggetto(letto.mongolfiera)
  s.mongolfiera = { fine: Number.isFinite(m.fine) ? m.fine : null, cassa: !!m.cassa }
  // il banco (assente prima del v3): ordini guasti diventano posti vuoti, che il banco riempie
  const o = oggetto(letto.ordini)
  for (let k = 0; k < POSTI; k++) {
    s.ordini.aperti[k] = Array.isArray(o.aperti) ? ordineInForma(o.aperti[k]) : null
    s.ordini.riprende[k] = Array.isArray(o.riprende) && Number.isFinite(o.riprende[k]) ? o.riprende[k] : null
  }
  s.ordini.prossimoId = Math.max(numero(o.prossimoId, 1), 1, ...s.ordini.aperti.map(x => x ? x.id + 1 : 1))
  return s
}
