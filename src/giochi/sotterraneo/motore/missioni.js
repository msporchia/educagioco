// Le missioni dei personaggi, senza schermo (docs/sotterraneo/missioni.md). Lo stato di un'avventura è
// `cfg.avventure[eroe].missioni`: { [id]: 'presa' | 'fatta' | 'consegnata' }, una missione mai presa non c'è.
// Qui: cosa dice un personaggio adesso, il segno sopra la sua testa, prendere e consegnare, il premio sulla roba,
// e dove la discesa mette la cosa da trovare e il mostro col nome. Gira in Node.
import { MISSIONI, missioniDi, missioneDi, PIU_DURO } from '../dati/missioni.js'
import { MOSTRI } from '../dati/mostri.js'
import { guardianoDi } from '../dati/campagna.js'
import { seminato } from './livello.js'

export const PRESA = 'presa', FATTA = 'fatta', CONSEGNATA = 'consegnata'

const statoDi = (stati, id) => (stati && typeof stati === 'object' ? stati[id] || null : null)

// Cosa ha da dire `chi` adesso, in quest'ordine: una missione da consegnare, una da fare, una nuova da dare, una
// che si aprirà; se no saluta. `aperta(chiave)`: la discesa è aperta per quest'avventura
export function cosaDice(chi, stati, aperta) {
  const sue = missioniDi(chi)
  const trova = st => sue.find(m => statoDi(stati, m.id) === st)
  const pronta = trova(FATTA)
  if (pronta) return { fase: 'consegna', missione: pronta }
  const presa = trova(PRESA)
  if (presa) return { fase: 'aspetta', missione: presa }
  const nuova = sue.find(m => !statoDi(stati, m.id) && aperta(m.discesa))
  if (nuova) return { fase: 'offre', missione: nuova }
  const poi = sue.find(m => !statoDi(stati, m.id))
  if (poi) return { fase: 'chiusa', missione: poi }
  return { fase: 'saluto', missione: null }
}

// il segno sopra la testa: «!» ha qualcosa da chiederti, «?» aspetta quello che hai trovato; niente altrimenti
export function segnoDi(chi, stati, aperta) {
  const { fase } = cosaDice(chi, stati, aperta)
  return fase === 'offre' ? '!' : fase === 'consegna' ? '?' : null
}

// le funzioni che cambiano lo stato tornano lo stato nuovo, o null se non c'era niente da fare
export function prendi(stati, id) {
  if (!missioneDi(id) || statoDi(stati, id)) return null
  return { ...(stati || {}), [id]: PRESA }
}

export function fatte(stati, ids) {
  const nuovi = { ...(stati || {}) }
  let cambiato = false
  for (const id of ids) if (statoDi(stati, id) === PRESA) { nuovi[id] = FATTA; cambiato = true }
  return cambiato ? nuovi : null
}

// il premio va sulla roba (un Corredo): le gemme si sommano, una cosa va addosso se è meglio, se no in tasca. A
// tasche piene la consegna aspetta (torna 'pieno'): un premio buttato per terra non esiste, sopra
export function consegna(stati, id, corredo) {
  const m = missioneDi(id)
  if (!m || statoDi(stati, id) !== FATTA) return null
  const p = m.premio
  if (p.cosa) {
    if (corredo.nonCiStarebbe(p.cosa)) return { stati, esito: 'pieno' }
    corredo.prendi(p.cosa)
  }
  if (p.gemme) corredo.gemme += p.gemme
  return { stati: { ...stati, [id]: CONSEGNATA }, esito: 'consegnata' }
}

// le missioni prese che riguardano questa discesa: la Corsa le mette nei piani
export const presePer = (stati, chiaveTappa) =>
  MISSIONI.filter(m => m.discesa === chiaveTappa && statoDi(stati, m.id) === PRESA)

// Dove sta, in un piano già fatto, la cosa di una missione: in una stanza che non è l'ingresso, la scala o il
// portale, su una cella libera lontana dalle porte. Un caso tutto suo (seme del piano e nome della missione): il
// caso della discesa non si sposta, e rientrando la cosa è nello stesso posto
export function postoPer(livello, m) {
  let h = 7
  for (const ch of m.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const rnd = seminato(livello.seme * 13 + livello.piano * 7919 + h)
  const buone = livello.stanze.filter(s => !['ingresso', 'uscita', 'portale'].includes(s.ruolo))
  const stanze = buone.length ? buone : livello.stanze.filter(s => s.ruolo !== 'ingresso')
  for (let giro = 0; giro < 60; giro++) {
    const s = stanze[Math.floor(rnd() * stanze.length)]
    if (!s) return null
    const x = s.x + 1 + Math.floor(rnd() * Math.max(1, s.w - 2)), y = s.y + 1 + Math.floor(rnd() * Math.max(1, s.h - 2))
    if (livello.calpestabile(x, y) && !livello.robeSu(x, y).length && !livello.porteVicine(x, y)) return { x, y }
  }
  return null
}

// la roba di una missione per un piano: il forziere che si riconosce, o il mostro col nome più duro dei suoi
export function robaDellaMissione(livello, m, tappa) {
  const dove = postoPer(livello, m)
  if (!dove) return null
  if (m.tipo === 'trova')
    return { che: 'forziere', x: dove.x, y: dove.y, em: m.cosa.em, nome: m.cosa.nome,
             pelle: 'forziere-oro-chiuso', aperto: false, missione: m.id }
  const r = livello.mostro(m.mostro.tipo, dove.x, dove.y)
  const g = livello.mostro(guardianoDi(tappa, livello.piano), dove.x, dove.y)
  r.ossa = r.ossaMax = Math.round(Math.max(r.ossa * PIU_DURO.ossa, g.ossa))
  r.att = Math.max(r.att, g.att) + PIU_DURO.att
  r.dif = Math.max(r.dif, MOSTRI[m.mostro.tipo].dif)
  return { ...r, nome: m.mostro.nome, missione: m.id }
}
