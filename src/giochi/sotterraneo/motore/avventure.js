// Le quattro avventure, una per eroe (docs/sotterraneo/avventure.md): ognuno ha la sua roba, le sue discese e
// stelle, la sua nebbia, la sua sosta e il suo abisso, in profile.campagne.sotterraneo.cfg.avventure[<eroe>].
// Il record della campagna di fuori (tappa, stelle, libera) resta quello che legge il resto dell'app, e vale il
// massimo fra le avventure: lo scrive completa() di giochi/campagne.js, che tiene sempre il più alto.
// Funzioni pure sul record della campagna: girano in Node, e Gioco.vue le passa a ritocca().
import { EROI, DI_PARTENZA } from '../dati/eroi.js'
import { rileggiRoba } from './corredo.js'
import { robaDiCasa } from './sosta.js'

// quello che stava in cfg quando la roba era una sola per tutti, e adesso sta in ogni avventura
const DI_PRIMA = ['roba', 'terra', 'abisso', 'botteghe']

// `missioni`: il posto per quelle dei personaggi, che verranno (docs/sotterraneo/da-fare.md)
export const AVVENTURA_NUOVA = () => ({ tappa: 0, libera: false, stelle: {}, missioni: {} })

const oggetto = v => !!v && typeof v === 'object' && !Array.isArray(v)
export const eroeVero = k => EROI.some(e => e.chiave === k)

// l'avventura di un eroe messa in forma alla lettura (mai cominciata è nuova); non scrive
export function avventuraDi(c, eroe) {
  const tutte = c && oggetto(c.cfg) && oggetto(c.cfg.avventure) ? c.cfg.avventure : {}
  const a = tutte[eroe]
  if (!oggetto(a)) return AVVENTURA_NUOVA()
  return {
    ...a,
    tappa: Number.isFinite(a.tappa) ? a.tappa : 0,
    libera: !!a.libera,
    stelle: oggetto(a.stelle) ? a.stelle : {},
    missioni: oggetto(a.missioni) ? a.missioni : {},
  }
}

// scrive dentro l'avventura, e la crea se non c'è; un campo a null si toglie (la sosta buttata)
export function scriviNellAvventura(c, eroe, campi) {
  if (!oggetto(c.cfg)) c.cfg = {}
  if (!oggetto(c.cfg.avventure)) c.cfg.avventure = {}
  if (!oggetto(c.cfg.avventure[eroe])) c.cfg.avventure[eroe] = AVVENTURA_NUOVA()
  const a = c.cfg.avventure[eroe]
  for (const [k, v] of Object.entries(campi)) {
    if (v == null) delete a[k]
    else a[k] = v
  }
  return true
}

// una discesa vinta, nell'avventura di chi l'ha vinta: le stesse regole di completa() (il cursore e le stelle
// non scendono mai), che Gioco.vue chiama subito dopo per il record di fuori
export function vintaNellAvventura(c, eroe, indice, quante, stelle = 0) {
  const a = avventuraDi(c, eroe)
  const tappa = Math.max(a.tappa, indice + 1)
  const st = { ...a.stelle }
  if (stelle > (st[indice] || 0)) st[indice] = stelle
  return scriviNellAvventura(c, eroe, { tappa, libera: a.libera || tappa >= quante, stelle: st })
}

// il massimo fra le avventure: il cursore più avanti, le stelle migliori discesa per discesa, il fondo più giù
export function ilMassimo(c) {
  const chi = c && oggetto(c.cfg) && oggetto(c.cfg.avventure) ? Object.keys(c.cfg.avventure) : []
  const m = { tappa: 0, libera: false, stelle: {}, fondo: 0 }
  for (const k of chi) {
    const a = avventuraDi(c, k)
    m.tappa = Math.max(m.tappa, a.tappa)
    m.libera = m.libera || a.libera
    for (const [i, s] of Object.entries(a.stelle)) if (s > (m.stelle[i] || 0)) m.stelle[i] = s
    m.fondo = Math.max(m.fondo, (oggetto(a.abisso) && a.abisso.fondo) || 0)
  }
  return m
}

// cominciata: c'è qualcosa da ritrovare (una discesa vinta o a metà, della roba, un record). La scheda delle
// avventure dice «nuova avventura» alle altre
export function cominciata(a) {
  if (!a) return false
  if (a.tappa > 0 || a.sosta || Object.values(a.stelle || {}).some(s => s > 0)) return true
  if (oggetto(a.abisso) && a.abisso.fondo > 0) return true
  const r = rileggiRoba(a.roba)
  return !!r && (r.gemme > 0 || r.zaino.length > 0 || !!(r.mano || r.mancina || r.corpo || r.dito) ||
                 r.torcia > 0 || r.torce > 0)
}

// Il passaggio dei profili di prima, quando la roba era una sola per tutti: discese, stelle, roba, nebbia,
// banchi, sosta e record vanno all'avventura dell'eroe scelto per ultimo (cfg.eroe), gli altri tre partono da
// capo. Le gemme di bentornato (robaDiCasa) le prende solo lui, che ha le discese finite. Il record di fuori resta
// com'è: era già il suo, e quindi il massimo. Torna false se non c'è niente da fare (già passato, o profilo nuovo)
export function passaAlleAvventure(c) {
  if (!oggetto(c.cfg)) c.cfg = {}
  const cfg = c.cfg
  if (oggetto(cfg.avventure)) return false
  const qualcosa = (c.tappa || 0) > 0 || c.libera || Object.keys(c.stelle || {}).length > 0 || !!c.sosta ||
    DI_PRIMA.some(k => cfg[k] != null)
  if (!qualcosa && !eroeVero(cfg.eroe)) return false
  const eroe = eroeVero(cfg.eroe) ? cfg.eroe : DI_PARTENZA
  const a = {
    ...AVVENTURA_NUOVA(),
    tappa: c.tappa || 0, libera: !!c.libera, stelle: { ...(c.stelle || {}) },
    roba: robaDiCasa({ salvata: cfg.roba, sosta: c.sosta, finite: c.tappa || 0 }).roba,
  }
  for (const k of ['terra', 'abisso', 'botteghe']) if (cfg[k] != null) a[k] = cfg[k]
  if (oggetto(c.sosta)) {
    // la discesa a metà la riprende chi ha l'avventura, anche se l'aveva cominciata un altro eroe; nella
    // versione 2 `eroe` era la cella dov'era, e lì non si tocca (leggi() ripiega sull'eroe dell'avventura)
    a.sosta = { ...c.sosta }
    if (typeof a.sosta.eroe === 'string') a.sosta.eroe = eroe
  }
  cfg.avventure = { [eroe]: a }
  cfg.eroe = eroe
  for (const k of DI_PRIMA) delete cfg[k]
  delete c.sosta
  return true
}
