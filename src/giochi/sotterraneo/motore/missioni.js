// Le missioni dei personaggi, senza schermo (docs/sotterraneo/missioni.md). Lo stato di un'avventura è
// `cfg.avventure[eroe].missioni`: { [id]: 'presa' | 'fatta' | 'consegnata' }, una missione mai presa non c'è.
// Qui: cosa dice un personaggio adesso, il segno sopra la sua testa, prendere e consegnare, il premio sulla roba,
// e dove la discesa mette la cosa da trovare e il mostro col nome. Gira in Node.
import { MISSIONI, PERSONAGGI, missioneDi, PIU_DURO } from '../dati/missioni.js'
import { MOSTRI } from '../dati/mostri.js'
import { CAMPAGNA, guardianoDi } from '../dati/campagna.js'
import { seminato } from './livello.js'

export const PRESA = 'presa', FATTA = 'fatta', CONSEGNATA = 'consegnata'

const statoDi = (stati, id) => (stati && typeof stati === 'object' ? stati[id] || null : null)

// L'ordine della storia: la discesa in fila (dati/campagna.js), poi il piano
const indiceDi = chiave => { const i = CAMPAGNA.findIndex(t => t.chiave === chiave); return i < 0 ? 999 : i }
const dellaStoria = (a, b) => indiceDi(a.discesa) - indiceDi(b.discesa) || a.piano - b.piano

// La missione che il mondo propone adesso, una sola (docs/sotterraneo/missioni.md). `tappe` sono quelle
// dell'avventura, [{ chiave, aperta, fatta }] (come le dà Gioco.vue). In quest'ordine:
//  1. una già fatta, da consegnare (la prima della storia: da uno stato di prima ne possono restare più d'una);
//  2. una presa e non ancora fatta: finché non è consegnata non se ne propone un'altra;
//  3. se no una nuova: fra le non cominciate con la discesa aperta e non oltre il punto dove è arrivato l'eroe
//     (la prima discesa non ancora finita), la più avanti, e in una stessa discesa il piano più in alto.
//     Chi ne ha saltata una la ritrova solo quando di più adatte non ce ne sono.
export function proposta(stati, tappe) {
  const inStato = st => MISSIONI.filter(m => statoDi(stati, m.id) === st).sort(dellaStoria)
  const pronta = inStato(FATTA)[0]
  if (pronta) return pronta
  const presa = inStato(PRESA)[0]
  if (presa) return presa
  const giu = tappe || []
  const aperta = k => { const t = giu.find(x => x.chiave === k); return !!(t && t.aperta) }
  const primaNonFinita = giu.find(t => !t.fatta)
  const punto = primaNonFinita ? indiceDi(primaNonFinita.chiave) : CAMPAGNA.length - 1
  const nuove = MISSIONI.filter(m => !statoDi(stati, m.id) && aperta(m.discesa) && indiceDi(m.discesa) <= punto)
  nuove.sort((a, b) => indiceDi(b.discesa) - indiceDi(a.discesa) || a.piano - b.piano)
  return nuove[0] || null
}

// Cosa ha da dire `chi` adesso: se la missione proposta è sua, consegnarla, ricordarla o darla; se no saluta e
// basta. Le altre sue missioni non si nominano nemmeno: una per volta
export function cosaDice(chi, stati, tappe) {
  const m = proposta(stati, tappe)
  if (!m || m.da !== chi) return { fase: 'saluto', missione: null }
  const st = statoDi(stati, m.id)
  return { fase: st === FATTA ? 'consegna' : st === PRESA ? 'aspetta' : 'offre', missione: m }
}

// il segno sopra la testa: «!» ha una missione nuova per te, «?» una che hai preso (e fatta, ecco qua); niente
// a tutti gli altri
export function segnoDi(chi, stati, tappe) {
  const { fase } = cosaDice(chi, stati, tappe)
  return fase === 'offre' ? '!' : fase === 'aspetta' || fase === 'consegna' ? '?' : null
}

// la frase con cui il minatore, indicando la strada, dice chi ha una missione per te (null se è sua, o non ce n'è)
export function chiTiCerca(stati, tappe) {
  const m = proposta(stati, tappe)
  const chi = m && PERSONAGGI[m.da]
  if (!chi) return null
  const Chi = chi.chi.charAt(0).toUpperCase() + chi.chi.slice(1)
  const st = statoDi(stati, m.id)
  if (st === FATTA) return `${Chi} ti aspetta: quello che ti ha chiesto l'hai fatto.`
  if (st === PRESA) return `${Chi} aspetta ancora: ${(m.tipo === 'trova' ? m.cosa.nome : m.mostro.nome).replace(/^./, c => c.toLowerCase())}.`
  return `${Chi} ha un favore da chiederti.`
}

// le funzioni che cambiano lo stato tornano lo stato nuovo, o null se non c'era niente da fare. Con `tappe` si
// prende solo la missione proposta adesso: una per volta
export function prendi(stati, id, tappe = null) {
  if (!missioneDi(id) || statoDi(stati, id)) return null
  if (tappe) { const p = proposta(stati, tappe); if (!p || p.id !== id) return null }
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
