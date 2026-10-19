/* Lo stato che si salva (in profile.campagne.fattoria3d.cfg.stato) e come si rimette in forma quando si legge: un salvataggio
   di ieri non ha bisogno di migrazioni, i campi che mancano si riempiono. Dato + funzioni pure. */
import { LOTTI_INIZIALI, PEZZO_DI_PARTENZA } from '../dati/mondo.js'
import { CHIAVI_COLTURE, TESSERE } from '../dati/colture.js'

export const VERSIONE_STATO = 1

const vuote = () => Object.fromEntries(CHIAVI_COLTURE.map(k => [k, 0]))

export function statoIniziale() {
  return {
    v: VERSIONE_STATO,
    merci: vuote(), prodotti: {}, lana: 0, legna: 0,
    posseduti: { pasticceria: false, mongolfiera: false },
    lotti: { ...LOTTI_INIZIALI },
    strade: [],                // le celle (indice di griglia) disegnate dal bambino
    magazzino: {},             // pezzi pagati e non ancora messi: { campo: 1 }
    tagliati: [],              // i numeri degli alberi abbattuti
    cose: [{ id: 1, tipo: PEZZO_DI_PARTENZA.tipo, i: PEZZO_DI_PARTENZA.i, j: PEZZO_DI_PARTENZA.j, tile: nuoveTessere() }],
    prossimoId: 2,
    pasticceria: { coda: [], pronti: {} },
    mongolfiera: { fine: null, cassa: false },
  }
}

export const nuoveTessere = () => Array.from({ length: TESSERE }, () => null)

const numero = (v, d = 0) => Number.isFinite(v) && v >= 0 ? v : d
const oggetto = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {}

/** Rimette in forma uno stato letto (o niente): mai un'eccezione, mai un campo che manca. */
export function normalizza(letto) {
  const base = statoIniziale()
  if (!letto || typeof letto !== 'object') return base
  const s = base
  for (const k of CHIAVI_COLTURE) s.merci[k] = numero(oggetto(letto.merci)[k])
  for (const [k, n] of Object.entries(oggetto(letto.prodotti))) if (numero(n) > 0) s.prodotti[k] = numero(n)
  s.lana = numero(letto.lana); s.legna = numero(letto.legna)
  s.posseduti = { pasticceria: !!oggetto(letto.posseduti).pasticceria, mongolfiera: !!oggetto(letto.posseduti).mongolfiera }
  const lotti = oggetto(letto.lotti)
  s.lotti = Object.keys(lotti).length ? Object.fromEntries(Object.entries(lotti).filter(([, v]) => v).map(([k]) => [k, true])) : s.lotti
  s.strade = Array.isArray(letto.strade) ? letto.strade.filter(Number.isInteger) : []
  for (const [k, n] of Object.entries(oggetto(letto.magazzino))) if (numero(n) > 0) s.magazzino[k] = numero(n)
  s.tagliati = Array.isArray(letto.tagliati) ? letto.tagliati.filter(Number.isInteger) : []
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
      return x
    })
    s.prossimoId = s.cose.reduce((m, c) => Math.max(m, c.id), 0) + 1
  }
  const p = oggetto(letto.pasticceria)
  s.pasticceria = { coda: Array.isArray(p.coda) ? p.coda.filter(x => x && typeof x.ric === 'string').map(x => ({ ric: x.ric, fine: Number.isFinite(x.fine) ? x.fine : null })) : [],
                    pronti: Object.fromEntries(Object.entries(oggetto(p.pronti)).filter(([, n]) => numero(n) > 0)) }
  const m = oggetto(letto.mongolfiera)
  s.mongolfiera = { fine: Number.isFinite(m.fine) ? m.fine : null, cassa: !!m.cassa }
  return s
}
