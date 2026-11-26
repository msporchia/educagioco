/* La lezione a blocchi: la forma, quando si passa al blocco dopo, dove sta un bambino, e la conversione delle lezioni
   salvate prima (obiettivo + «se hai finito»). Gira in Node. Vedi docs/scuola/lezione.md */
import { valido, descrivi, giochiPer, giocoDi, GIOCHI } from './esercizi.js'

export const MAX_BLOCCHI = 8
export const MAX_NOME_LEZIONE = 60

/* quando si passa al blocco dopo: da solo a una soglia, o quando lo dice la maestra («Avanti tutti») */
export const MODI_PASSA = [
  { id: 'giuste', nome: 'Dopo un numero di risposte giuste', unita: 'giuste', tetto: 500, base: 10 },
  { id: 'domande', nome: 'Dopo un numero di domande', unita: 'domande', tetto: 500, base: 20 },
  { id: 'minuti', nome: 'Dopo un numero di minuti', unita: 'minuti', tetto: 180, base: 10 },
  { id: 'maestra', nome: 'Quando lo dice la maestra', unita: null },
]
const SOGLIE = MODI_PASSA.filter(m => m.unita)

const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)

/* `passa`: `{ giuste: 5 }`, `{ domande: 20 }`, `{ minuti: 10 }`, oppure `null` (quando lo dice la maestra) */
export function passaValido(p) {
  if (p === null) return true
  if (!oggetto(p)) return false
  const chiavi = Object.keys(p)
  if (chiavi.length !== 1) return false
  const m = SOGLIE.find(x => x.id === chiavi[0])
  return !!m && Number.isInteger(p[m.id]) && p[m.id] >= 1 && p[m.id] <= m.tetto
}
export const modoDi = p => (p === null ? 'maestra' : Object.keys(p)[0])
export const sogliaDi = p => (p === null ? null : p[modoDi(p)])

/* come si contano le domande nel gioco dell'esercizio (`conta` della scheda): nel coniglio «dopo 3 livelli», non «dopo 3
   domande»; un gioco senza `giuste` (un livello si chiude solo vinto) non offre «dopo N giuste» */
const CONTA_DOMANDE = { tante: 'domande', una: 'una domanda', giuste: 'risposte giuste', giusta: 'una risposta giusta' }
export const contaDi = e => GIOCHI.find(g => g.id === giocoDi(e))?.conta || CONTA_DOMANDE
export const modiPassaPer = e => MODI_PASSA.filter(m => m.id !== 'giuste' || contaDi(e).giuste)

export function descriviPassa(p, e = null) {
  if (p === null) return 'quando lo dice la maestra'
  const c = contaDi(e)
  const n = sogliaDi(p), modo = modoDi(p)
  if (modo === 'giuste' && c.giuste) return n === 1 ? `dopo ${c.giusta}` : `dopo ${n} ${c.giuste}`
  if (modo === 'giuste' || modo === 'domande') return n === 1 ? `dopo ${c.una}` : `dopo ${n} ${c.tante}`
  return n === 1 ? 'dopo un minuto' : `dopo ${n} minuti`
}

/* `{ id, nome, blocchi: [{ esercizio, passa }], inTondo }`: da 1 a MAX_BLOCCHI blocchi; in tondo, dopo l'ultimo si
   ricomincia dal primo. Anche contro un link manomesso: niente chiavi in più. */
export function lezioneValida(l) {
  if (!oggetto(l) || !Object.keys(l).every(k => ['id', 'nome', 'blocchi', 'inTondo'].includes(k))) return false
  if (typeof l.id !== 'string' || !l.id || l.id.length > 40) return false
  if (typeof l.nome !== 'string' || l.nome.length > MAX_NOME_LEZIONE) return false
  if (typeof l.inTondo !== 'boolean') return false
  if (!Array.isArray(l.blocchi) || !l.blocchi.length || l.blocchi.length > MAX_BLOCCHI) return false
  // `turno: true`: finito il blocco, il PC torna alla lista dei codici e tocca a un altro bambino (docs/scuola/lezione.md)
  return l.blocchi.every(b => oggetto(b) && Object.keys(b).every(k => k === 'esercizio' || k === 'passa' || k === 'turno') &&
    valido(b.esercizio) && 'passa' in b && passaValido(b.passa) && (b.turno === undefined || b.turno === true))
}

export function descriviBlocco(b) { return `${descrivi(b.esercizio)} · ${descriviPassa(b.passa, b.esercizio)}${b.turno ? ' · poi tocca a un altro bambino' : ''}` }

/* la forma di prima: `obiettivo: { esercizio, quante | minuti }` e `dopo` (un esercizio senza fine). Diventa un blocco
   che passa alla soglia e, se c'era, un secondo che non passa mai da solo. Una lezione già a blocchi torna uguale. */
export function convertiLezione(l) {
  if (!oggetto(l) || Array.isArray(l.blocchi) || !oggetto(l.obiettivo)) return l
  const o = l.obiettivo
  const blocchi = [{ esercizio: o.esercizio, passa: o.quante ? { domande: o.quante } : o.minuti ? { minuti: o.minuti } : null }]
  if (l.dopo) blocchi.push({ esercizio: l.dopo, passa: null })
  return { id: l.id, nome: l.nome, blocchi, inTondo: false }
}

/* ══════════════ dove sta un bambino ══════════════

   La posizione `p` conta i blocchi superati (0 = il primo). Il bambino la fa crescere da solo superando le soglie;
   «Avanti tutti» della maestra alza un pavimento comune `avanti`, e vale il più grande dei due: chi era indietro passa,
   chi era già avanti resta dov'è. In tondo `p` cresce senza fine e il blocco gira. */
export const posizione = (propria, avanti) => Math.max(propria | 0, avanti | 0)
export const finita = (l, p) => !l.inTondo && p >= l.blocchi.length
export const bloccoDi = (l, p) => (finita(l, p) ? -1 : p % l.blocchi.length)

/* `conto` del blocco in corso: `{ fatte, giuste, inizio }` (le domande chiuse, quelle giuste, quando è cominciato, ms) */
export function superato(passa, conto, ora) {
  if (passa === null) return false
  const n = sogliaDi(passa), modo = modoDi(passa)
  if (modo === 'giuste') return (conto?.giuste ?? 0) >= n
  if (modo === 'domande') return (conto?.fatte ?? 0) >= n
  return conto?.inizio != null && ora - conto.inizio >= n * 60 * 1000
}

/* «Tutti alle domande» (docs/scuola/ripieghi.md): ogni blocco che si può fare a schede lascia il suo gioco; quelli che
   esistono solo dentro un gioco (i gradini di Passo passo…) restano come sono, e `restano` dice quanti */
export function alleDomande(l) {
  let restano = 0
  const blocchi = l.blocchi.map(b => {
    const { gioco, difficolta, ...esercizio } = b.esercizio
    if (giochiPer(esercizio).some(g => g.id === 'schede')) return { ...b, esercizio }
    if (giocoDi(b.esercizio) !== 'schede') restano++
    return b
  })
  return { lezione: { ...l, blocchi }, restano }
}
