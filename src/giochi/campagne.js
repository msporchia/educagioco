// L'avanzamento dei giochi nuovi, un posto solo: vedi docs/core/convenzione-giochi.md.
import { state, persist, flushNow, tappaAperta } from '../store/profile.js'
import { tappaApertaQui, tappaChiusaPerEtaQui } from '../data/portata-giochi.js'
import { GIOCHI } from '../data/giochi.js'   // tutti i giochi, non solo i nuovi: serve alla tabella dei record
import { apriQuaderno, conRisultato, inParole, primatoInParole, dettagliInParole,
         sfideDi, sfidaDi, chiaveSfida }
  from './primati.js'

const VUOTA = () => ({ tappa: 0, libera: false, stelle: {}, cfg: {} })

// la forma si mette a posto alla lettura: un profilo di ieri non ha bisogno di migrazioni
export function progresso(chiave) {
  const p = state.profile
  if (!p.campagne || typeof p.campagne !== 'object') p.campagne = {}
  const c = p.campagne[chiave]
  if (!c || typeof c !== 'object') return (p.campagne[chiave] = VUOTA())
  if (typeof c.tappa !== 'number') c.tappa = 0
  if (!c.stelle || typeof c.stelle !== 'object') c.stelle = {}
  if (!c.cfg || typeof c.cfg !== 'object') c.cfg = {}
  return c
}

export const aperta = (chiave, indice) => tappaApertaQui(chiave, indice, progresso(chiave).tappa)

export const chiusaPerEta = (chiave, indice) => tappaChiusaPerEtaQui(chiave, indice)

// la prossima da giocare, SE si può giocare: sopra la mira dell'età resta chiusa
export const adesso = (chiave, indice) =>
  indice === progresso(chiave).tappa && aperta(chiave, indice)

export const stelleDi = (chiave, indice) => progresso(chiave).stelle[indice] || 0

export const stelleInTutto = chiave =>
  Object.values(progresso(chiave).stelle).reduce((n, s) => n + s, 0)

export function completa(chiave, indice, quante, { stelle = 0 } = {}) {
  const c = progresso(chiave)
  c.tappa = Math.max(c.tappa || 0, indice + 1)
  if (c.tappa >= quante) c.libera = true
  if (stelle > (c.stelle[indice] || 0)) c.stelle[indice] = stelle
  persist()
  flushNow()     // una tappa si vince di rado: non deve perdersi
  return c
}

// Gradini della scala degli aiuti scesi in un livello: sotto la CHIAVE del
// livello (non la posizione), come i programmi del costruttore.
export const aiutiPresi = (chiave, livello) =>
  ((progresso(chiave).aiuti || {})[livello]) || 0

export function segnaAiutiPresi(chiave, livello, n) {
  const c = progresso(chiave)
  if (!c.aiuti || typeof c.aiuti !== 'object') c.aiuti = {}
  if (!(n > (c.aiuti[livello] || 0))) return c.aiuti[livello] || 0
  c.aiuti[livello] = n
  persist()
  flushNow()     // un gradino si paga: non deve perdersi
  return n
}

// scelte del bambino da ricordare (non impostazioni dei genitori: quelle sono in settings)
export const scelta = (chiave, campo, seNiente = null) => {
  const v = progresso(chiave).cfg[campo]
  return v === undefined ? seNiente : v
}

// Ricomincia solo questo gioco (monete e traguardi restano). Non rimborsa:
// se no ricominciare diventerebbe il modo più rapido di farsi ridare le monete.
export function azzeraCampagna(chiave) {
  const p = state.profile
  if (p.campagne) delete p.campagne[chiave]
  persist()
  flushNow()
  return true
}

// Una partita lasciata a metà: un oggetto opaco (il formato lo decide il
// gioco), una sosta per gioco e non per tappa.
export const sosta = chiave => progresso(chiave).sosta || null

export function salvaSosta(chiave, dato, { subito = false } = {}) {
  const c = progresso(chiave)
  if (!dato) delete c.sosta
  else c.sosta = dato
  persist()
  if (subito) flushNow()   // alla chiusura la pagina può sparire prima del salvataggio pigro
  return dato
}

export const buttaSosta = chiave => salvaSosta(chiave, null, { subito: true })

export const haGiocato = chiave => {
  const c = state.profile.campagne
  return !!(c && c[chiave])
}

export function ricorda(chiave, campo, valore) {
  progresso(chiave).cfg[campo] = valore
  persist()
  return valore
}

// I giochi senza fine: il conto lo fa giochi/primati.js (puro), qui solo
// il pezzo che tocca il profilo. Vedi docs/core/primati.md.
const sfidaDelGioco = (chiave, sfida) => {
  const g = GIOCHI.find(x => x.chiave === chiave)
  return sfidaDi(g && g.senzaFine, sfida) || sfida
}

const vecchioDi = s =>
  (s && typeof s === 'object' && typeof s.vecchio === 'function' ? s.vecchio(state.profile) : 0)

// senza passare da progresso(), che scriverebbe la voce: una mappa che legge non deve scrivere
export function primatoDi(chiave, sfida = null) {
  const s = sfidaDelGioco(chiave, sfida)
  return apriQuaderno((state.profile.campagne || {})[chiave] || {}, s, vecchioDi(s))
}

export function segnaPrimato(chiave, valore, quando = Date.now(), dettagli = null, sfida = null) {
  const c = progresso(chiave)
  const s = sfidaDelGioco(chiave, sfida)
  const { quaderno, esito } = conRisultato(apriQuaderno(c, s, vecchioDi(s)), valore, quando, dettagli)
  const k = chiaveSfida(s)
  if (k) {
    if (!c.primati || typeof c.primati !== 'object') c.primati = {}
    c.primati[k] = quaderno
  } else c.primato = quaderno
  // il posto vecchio si lascia andare solo se chi legge ha diritto di ereditarlo
  const erede = !k || (s && typeof s === 'object' && s.eredita)
  if (erede && k && c.primato !== undefined) delete c.primato
  if (erede && c.cfg && c.cfg.primato !== undefined) delete c.cfg.primato
  persist()
  flushNow()
  return esito
}

// I regali della partita libera del castello (data/castello.js): restano per
// sempre, letti senza passare da progresso() per non scrivere una voce inutile.
export const regaliDi = chiave => {
  const c = (state.profile.campagne || {})[chiave]
  const r = c && c.regali
  return r && typeof r === 'object' ? r : {}
}

export function regaloPreso(chiave, id) {
  const c = progresso(chiave)
  if (!c.regali || typeof c.regali !== 'object') c.regali = {}
  c.regali[id] = (c.regali[id] || 0) + 1
  persist()
  flushNow()
  return { ...c.regali }
}

// Una riga per sfida senza fine (non per gioco: il castello ne ha quattro),
// solo quelle già giocate almeno una volta.
export function tabellaDeiPrimati() {
  const tutte = state.profile.campagne || {}
  return GIOCHI.filter(g => g.senzaFine).flatMap(g => sfideDi(g.senzaFine).map(s => {
    const q = apriQuaderno(tutte[g.chiave] || {}, s, vecchioDi(s))
    return {
      id: s.chiave ? `${g.chiave}/${s.chiave}` : g.chiave,
      chiave: g.chiave,
      sfida: s.chiave,
      gioco: g.nome,
      icona: s.icona || g.ico,
      nome: s.nome,
      che: s.che,
      misura: s.misura,
      best: q.best,
      parole: primatoInParole(q, s.misura),
      dettagli: dettagliInParole(q, s),   // «580 mostri · livello 6», o vuoto
      quando: q.quando,
      partite: q.partite,
      /* i risultati più recenti, dal più vecchio al più nuovo: sotto
         forma di barrette si legge da sinistra a destra come il tempo */
      ultime: q.ultime.map(u => ({ ...u, parole: inParole(u.v, s.misura) })).reverse(),
    }
  })).filter(r => r.partite > 0 || r.best > 0)
}
