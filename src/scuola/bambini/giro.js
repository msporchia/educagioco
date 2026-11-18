/* Il giro del bambino a scuola, senza disegno: quale schermata, l'avanzamento dell'obiettivo, il conto dei minuti e il
   ricordo in localStorage. Gira in Node. Vedi docs/scuola/bambini.md */
import { valido } from '../comune/esercizi.js'

export const RICORDO = 'scuola:bambino'
const TRE_ORE = 3 * 60 * 60 * 1000
const MINUTO = 60 * 1000
const PARTI = ['obiettivo', 'finito', 'dopo']

/* il codice come lo scrive il bambino: minuscole e spazi vanno bene, si tengono solo le lettere */
export const pulisciCodice = testo => String(testo ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5)
export const codiceCompleto = c => typeof c === 'string' && /^[A-Z]{5}$/.test(c)

export const haDopo = lezione => valido(lezione?.dopo)

/* quale schermata, da quello che si sa: il codice, l'ultimo `stato` del servizio (o quello ricordato) e l'avanzamento */
export function schermata({ codice, stato, avanzamento }) {
  if (!codice) return 'codice'
  if (!stato) return 'collego'
  if (stato.fase === 'chiusa') return 'chiusa'
  if (!stato.io) return 'nome'
  if (stato.fase !== 'via') return 'aspetta'
  if (!valido(stato.lezione?.obiettivo?.esercizio)) return 'guasta'
  const parte = avanzamento?.alunno === stato.io.id ? avanzamento.parte : 'obiettivo'
  if (parte === 'obiettivo') return 'obiettivo'
  return parte === 'dopo' && haDopo(stato.lezione) ? 'dopo' : 'finito'
}

/* ══════════════ l'avanzamento dell'obiettivo ══════════════ */

export const nuovoAvanzamento = alunno => ({ alunno, fatte: 0, inizio: null, parte: 'obiettivo' })
// un nome diverso sullo stesso PC (la maestra l'ha liberato e ne è stato scelto un altro) riparte da zero
export const perAlunno = (av, alunno) => (av?.alunno === alunno ? av : nuovoAvanzamento(alunno))
// i minuti partono alla prima domanda, e sono tempo di parete (Date.now): passano anche a pagina chiusa
export const comincia = (av, ora) => (av.inizio == null ? { ...av, inizio: ora } : av)

const passato = (av, ora) => (av.inizio == null ? 0 : Math.max(0, ora - av.inizio))

export function obiettivoFatto(av, obiettivo, ora) {
  if (obiettivo?.quante > 0) return av.fatte >= obiettivo.quante
  if (obiettivo?.minuti > 0) return av.inizio != null && passato(av, ora) >= obiettivo.minuti * MINUTO
  return false
}

/* una risposta data: conta solo nell'obiettivo, e chiude l'obiettivo quando basta (a tempo: la domanda a schermo si finisce).
   `ultima: false` è un colpo sbagliato di un gioco con la domanda ancora aperta: va alla maestra, ma qui non conta */
export function rispostaData(av, obiettivo, ora, ultima = true) {
  if (av.parte !== 'obiettivo' || ultima === false) return av
  const dopo = { ...av, fatte: av.fatte + 1 }
  return obiettivoFatto(dopo, obiettivo, ora) ? { ...dopo, parte: 'finito' } : dopo
}

/* all'ingresso nell'obiettivo (anche a pagina riaperta): il tempo parte, e se era già scaduto l'obiettivo è finito */
export function entraNellObiettivo(av, obiettivo, ora) {
  const a = comincia(av, ora)
  return a.parte === 'obiettivo' && obiettivoFatto(a, obiettivo, ora) ? { ...a, parte: 'finito' } : a
}

export const continua = av => (av.parte === 'finito' ? { ...av, parte: 'dopo' } : av)

/* il segno discreto di quanto manca: «7 di 15» (la domanda a schermo) o i minuti che restano */
export function segno(av, obiettivo, ora) {
  if (obiettivo?.quante > 0) return `${Math.min(av.fatte + 1, obiettivo.quante)} di ${obiettivo.quante}`
  if (obiettivo?.minuti > 0) {
    const resta = obiettivo.minuti * MINUTO - passato(av, ora)
    if (resta <= 0) return 'Ultima domanda'
    const m = Math.ceil(resta / MINUTO)
    return m === 1 ? 'Ancora 1 minuto' : `Ancora ${m} minuti`
  }
  return ''
}

/* ══════════════ il ricordo: `scuola:bambino` ══════════════ */
// `nato` serve anche a rete.js, che all'avvio butta ogni `scuola:*` più vecchia di tre ore

function archivio(storage) {
  if (storage !== undefined) return storage
  try { return globalThis.localStorage ?? null } catch { return null }
}

const avanzamentoBuono = a => a && typeof a.alunno === 'string' && Number.isInteger(a.fatte) && a.fatte >= 0
  && (a.inizio === null || Number.isFinite(a.inizio)) && PARTI.includes(a.parte)
const statoBuono = s => s && typeof s.fase === 'string' && s.lezione && typeof s.lezione === 'object'
  && Array.isArray(s.alunni) && (s.io === null || typeof s.io?.id === 'string')

/* l'ultimo ricordo, o null se manca, è guasto, è di più di tre ore fa o è di una lezione chiusa */
export function leggiRicordo(ora, storage) {
  let r
  try { r = JSON.parse(archivio(storage)?.getItem(RICORDO) ?? 'null') } catch { return null }
  if (!r || typeof r !== 'object' || !codiceCompleto(r.codice) || !Number.isFinite(r.nato) || !(ora - r.nato < TRE_ORE)) return null
  const stato = statoBuono(r.stato) && r.stato.fase !== 'chiusa' ? r.stato : null
  const avanzamento = avanzamentoBuono(r.avanzamento) ? r.avanzamento : null
  return { codice: r.codice, nato: r.nato, stato, avanzamento }
}

/* si ricorda solo una lezione aperta: senza codice o a lezione chiusa il ricordo si toglie, e la pagina riparte dal codice */
export function ricorda({ codice, nato, stato, avanzamento }, storage) {
  const a = archivio(storage)
  try {
    if (!codice || stato?.fase === 'chiusa') return void a?.removeItem(RICORDO)
    const s = stato && { fase: stato.fase, lezione: stato.lezione, io: stato.io ?? null, alunni: stato.alunni ?? [] }
    a?.setItem(RICORDO, JSON.stringify({ codice, nato, stato: s, avanzamento: avanzamento ?? null }))
  } catch { /* pieno o vietato: si va avanti senza ricordo */ }
}

export const dimentica = storage => ricorda({ codice: null }, storage)
