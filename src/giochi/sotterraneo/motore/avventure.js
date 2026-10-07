// Le quattro avventure, una per eroe (docs/sotterraneo/avventure.md): ognuno ha la sua roba, le sue discese e
// stelle, la sua nebbia, la sua sosta e il suo abisso, in profile.campagne.sotterraneo.cfg.avventure[<eroe>].
// Il record della campagna di fuori (tappa, stelle, libera) resta quello che legge il resto dell'app, e vale il
// massimo fra le avventure: lo scrive completa() di giochi/campagne.js, che tiene sempre il più alto.
// Funzioni pure sul record della campagna: girano in Node, e Gioco.vue le passa a ritocca().
import { EROI } from '../dati/eroi.js'
import { CAMPAGNA, CAMPAGNA_DI_PRIMA } from '../dati/campagna.js'
import { rileggiRoba } from './corredo.js'

// `missioni`: quelle dei personaggi, { [id]: stato } (motore/missioni.js, docs/sotterraneo/missioni.md)
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

// I salvataggi di prima si azzerano (docs/sotterraneo/avventure.md, «I salvataggi di prima»): il gioco è cambiato
// tanto che passarli non aveva senso. Una volta per profilo, segnata da `cfg.mondo`: le avventure, la roba, la
// nebbia, i banchi, l'abisso e la sosta se ne vanno; restano l'eroe scelto e il record di fuori (tappa, stelle,
// libera), che medaglie, esperienza e livello leggono. Torna false se non c'è niente da fare
// Il mondo 3 (la grande storia, 7 ottobre 2026) ha riordinato le discese: un'avventura del mondo 2 si
// rilegge per chiave (`riordina`), le altre si azzerano come prima.
export const MONDO = 3
const AZZERATO = 2
const DI_PRIMA = ['avventure', 'roba', 'terra', 'abisso', 'botteghe']

// Il record dell'abisso di prima dell'azzeramento: il primato `sotFondo` del bambino (e, se c'è ancora, quello
// salvato nella campagna vecchia) resta in `cfg.fondoDiPrima`, che la riga della home legge insieme ai fondi
// delle avventure. Gira a ogni apertura, prima di azzerare: non abbassa mai il numero.
export function ricordaIlFondo(c, primato = 0) {
  if (!oggetto(c.cfg)) c.cfg = {}
  const vecchio = c.cfg.mondo === MONDO ? 0 : (oggetto(c.cfg.abisso) && c.cfg.abisso.fondo) || 0
  const f = Math.max(primato || 0, vecchio)
  if (!(f > (c.cfg.fondoDiPrima || 0))) return false
  c.cfg.fondoDiPrima = f
  return true
}

export function azzeraIlVecchio(c) {
  if (!oggetto(c.cfg)) c.cfg = {}
  if (c.cfg.mondo === MONDO) return false
  if (c.cfg.mondo === AZZERATO) {
    for (const a of Object.values(oggetto(c.cfg.avventure) ? c.cfg.avventure : {})) if (oggetto(a)) riordina(a)
  } else {
    for (const k of DI_PRIMA) delete c.cfg[k]
    delete c.sosta
  }
  if (c.cfg.eroe != null && !eroeVero(c.cfg.eroe)) delete c.cfg.eroe
  c.cfg.mondo = MONDO
  return true
}

// Un'avventura scritta con le sei discese di prima, nella fila di adesso: le stelle passano per chiave (il pozzo
// dal tetto rosso non è più una discesa, e le sue si lasciano), il cursore conta le discese di fila già finite. La
// sosta si butta (gli indici e i piani sono cambiati), e la terra torna al villaggio con la sua nebbia: il
// minatore sta da un'altra parte, e ha di nuovo qualcosa da dire. Il record di fuori non si tocca: medaglie ed
// esperienza lo leggono, e togliere non abbassa il livello (docs/sotterraneo/la-grande-storia.md)
export function riordina(a) {
  const fatte = new Set(CAMPAGNA_DI_PRIMA.slice(0, Number.isFinite(a.tappa) ? a.tappa : 0))
  const stelle = {}
  for (const [i, s] of Object.entries(oggetto(a.stelle) ? a.stelle : {})) {
    const nuovo = CAMPAGNA.findIndex(t => t.chiave === CAMPAGNA_DI_PRIMA[i])
    if (nuovo >= 0 && s > 0) stelle[nuovo] = s
  }
  let tappa = 0
  while (tappa < CAMPAGNA.length && fatte.has(CAMPAGNA[tappa].chiave)) tappa++
  a.tappa = tappa
  a.libera = !!a.libera || tappa >= CAMPAGNA.length   // chi aveva aperto l'abisso non lo richiude
  a.stelle = stelle
  delete a.sosta
  if (oggetto(a.terra)) { delete a.terra.dove; delete a.terra.parlato }
  return a
}
