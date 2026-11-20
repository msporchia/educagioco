/* Il giro del bambino a scuola, senza disegno: quale schermata, dove sta nella lezione a blocchi, il conto del blocco, il
   segno in alto e il ricordo in localStorage. Gira in Node. Vedi docs/scuola/bambini.md */
import { lezioneValida, convertiLezione, posizione, finita, bloccoDi, superato, modoDi, sogliaDi } from '../comune/lezione.js'

export const RICORDO = 'scuola:bambino'
const FORMA = 'blocchi'          // un ricordo senza (quello dell'obiettivo e del «dopo») vale come nessun ricordo
const TRE_ORE = 3 * 60 * 60 * 1000
const MINUTO = 60 * 1000

/* il codice come lo scrive il bambino: quattro cifre, spazi e altro si tolgono */
export const pulisciCodice = testo => String(testo ?? '').replace(/\D/g, '').slice(0, 4)
export const codiceCompleto = c => typeof c === 'string' && /^\d{4}$/.test(c)

/* lo `stato` del servizio come lo tiene la pagina; una lezione nella forma di prima si converte (per prudenza) */
const naturaleO0 = n => (Number.isInteger(n) && n > 0 ? n : 0)
export const statoDa = d => ({
  fase: d.fase, lezione: convertiLezione(d.lezione), avanti: naturaleO0(d.avanti), rifatta: naturaleO0(d.rifatta),
  io: d.io ? { ...d.io, avanti: naturaleO0(d.io.avanti), domande: !!d.io.domande } : null, alunni: Array.isArray(d.alunni) ? d.alunni : [],
})

/* il pavimento di questo bambino: «Avanti tutti» per tutti, «Salta il blocco» della maestra per lui solo */
export const pavimento = s => Math.max(s?.avanti | 0, s?.io?.avanti | 0)

/* ══════════════ il cammino: dove sta il bambino e il conto del blocco ══════════════

   `{ alunno, p, visto, conto: { fatte, giuste, inizio } }`: `p` la posizione propria (i blocchi superati), `visto` l'ultima
   posizione in cui ha toccato «Continua» (se è indietro si mostra il passaggio), `conto` le domande chiuse del blocco. */

export const nuovoConto = () => ({ fatte: 0, giuste: 0, inizio: null })
// chi arriva a lezione già avanti comincia dal pavimento, senza passaggio
export const nuovoCammino = (alunno, avanti = 0) => ({ alunno, p: avanti | 0, visto: avanti | 0, conto: nuovoConto() })
const avanza = (c, p) => ({ ...c, p, conto: nuovoConto() })
// il cammino del nome di `stato.io`, anche prima che la pagina l'abbia fatto
export const camminoDi = (c, stato) => (c?.alunno === stato.io.id ? c : nuovoCammino(stato.io.id, pavimento(stato)))

/* il cammino di quel nome, al passo con «Avanti tutti»: un nome diverso riparte, un pavimento più alto porta avanti e fa
   ripartire il conto, chi era già avanti resta */
export function segui(c, alunno, avanti = 0) {
  const mio = c?.alunno === alunno ? c : nuovoCammino(alunno, avanti)
  const p = posizione(mio.p, avanti)
  return p > mio.p ? avanza(mio, p) : mio
}

/* entrando nel blocco (anche a pagina riaperta): il tempo parte, e se la soglia era già passata il blocco è superato */
export function entraNelBlocco(c, lezione, ora) {
  const a = c.conto.inizio == null ? { ...c, conto: { ...c.conto, inizio: ora } } : c
  const b = lezione.blocchi[bloccoDi(lezione, a.p)]
  return b && superato(b.passa, a.conto, ora) ? avanza(a, a.p + 1) : a
}

/* una domanda chiusa nel blocco `blocco` (la posizione in cui è stata data). `ultima: false` è un colpo sbagliato di un
   gioco con la domanda ancora aperta: va alla maestra, ma qui non conta. A minuti la domanda a schermo allo scadere si
   finisce, e la sua risposta fa passare */
export function rispostaData(c, lezione, { blocco, giusta, ultima = true }, ora) {
  if (ultima === false || blocco !== c.p || c.visto !== c.p || finita(lezione, c.p)) return c
  const conto = { ...c.conto, fatte: c.conto.fatte + 1, giuste: c.conto.giuste + (giusta ? 1 : 0) }
  return superato(lezione.blocchi[bloccoDi(lezione, c.p)].passa, conto, ora) ? avanza(c, c.p + 1) : { ...c, conto }
}

export const continua = c => ({ ...c, visto: c.p })

/* «Salta al blocco dopo» dal menu della maestra sul PC: il blocco dopo quello in cui sta, senza passaggio */
export const salta = (c, pav = 0) => { const p = posizione(c.p, pav) + 1; return { ...c, p, visto: p, conto: nuovoConto() } }

/* ══════════════ la schermata ══════════════ */

/* da quello che si sa: il codice, l'ultimo `stato` del servizio (o quello ricordato) e il cammino */
export function schermata({ codice, stato, cammino }) {
  if (!codice) return 'codice'
  if (!stato) return 'collego'
  if (stato.fase === 'chiusa') return 'chiusa'
  if (!stato.io) return 'nome'
  if (stato.fase !== 'via') return 'aspetta'
  if (!lezioneValida(stato.lezione)) return 'guasta'
  const c = camminoDi(cammino, stato)
  const p = posizione(c.p, pavimento(stato))
  if (finita(stato.lezione, p)) return 'finito'
  return c.visto < p ? 'passaggio' : 'blocco'
}

/* il segno discreto in alto, secondo come si passa: «3 di 10 giuste», «7 di 20» (la domanda a schermo), i minuti che
   restano; quando lo dice la maestra, niente */
export function segno(passa, conto, ora) {
  if (passa === null) return ''
  const n = sogliaDi(passa), modo = modoDi(passa)
  if (modo === 'giuste') return `${Math.min(conto.giuste, n)} di ${n} giuste`
  if (modo === 'domande') return `${Math.min(conto.fatte + 1, n)} di ${n}`
  const resta = n * MINUTO - (conto.inizio == null ? 0 : Math.max(0, ora - conto.inizio))
  if (resta <= 0) return 'Ultima domanda'
  const m = Math.ceil(resta / MINUTO)
  return m === 1 ? 'Ancora 1 minuto' : `Ancora ${m} minuti`
}

/* ══════════════ senza lezione ══════════════

   La lezione fatta partire dalla maestra sul PC, senza servizio (docs/scuola/ripieghi.md): uno stato come quello del
   servizio, già «via», con un alunno senza nome; i blocchi «quando lo dice la maestra» passano dal suo menu. */
export const SENZA = 'senza-lezione'
export const statoSenzaLezione = lezione => ({ fase: 'via', lezione, avanti: 0, rifatta: 0, io: { id: SENZA, nome: '', avanti: 0, domande: false }, alunni: [] })

/* ══════════════ il ricordo: `scuola:bambino` ══════════════ */
// `nato` serve anche a rete.js, che all'avvio butta ogni `scuola:*` più vecchia di tre ore

function archivio(storage) {
  if (storage !== undefined) return storage
  try { return globalThis.localStorage ?? null } catch { return null }
}

const naturale = n => Number.isInteger(n) && n >= 0
const camminoBuono = c => c && typeof c.alunno === 'string' && naturale(c.p) && naturale(c.visto) && c.visto <= c.p
  && c.conto && naturale(c.conto.fatte) && naturale(c.conto.giuste) && (c.conto.inizio === null || Number.isFinite(c.conto.inizio))
const statoBuono = s => s && typeof s.fase === 'string' && s.lezione && typeof s.lezione === 'object' && naturale(s.avanti)
  && Array.isArray(s.alunni) && (s.io === null || typeof s.io?.id === 'string')

/* l'ultimo ricordo, o null se manca, è guasto, è nella forma di prima, è di più di tre ore fa o è di una lezione chiusa */
export function leggiRicordo(ora, storage) {
  let r
  try { r = JSON.parse(archivio(storage)?.getItem(RICORDO) ?? 'null') } catch { return null }
  if (!r || typeof r !== 'object' || r.forma !== FORMA || !Number.isFinite(r.nato) || !(ora - r.nato < TRE_ORE)) return null
  const stato = statoBuono(r.stato) && r.stato.fase !== 'chiusa' ? statoDa(r.stato) : null
  const cammino = camminoBuono(r.cammino) ? r.cammino : null
  if (r.locale === true) return stato && lezioneValida(stato.lezione) ? { codice: null, locale: true, nato: r.nato, stato, cammino } : null
  if (!codiceCompleto(r.codice)) return null
  return { codice: r.codice, locale: false, nato: r.nato, stato, cammino }
}

/* si ricorda solo una lezione aperta: senza codice o a lezione chiusa il ricordo si toglie, e la pagina riparte dal codice */
export function ricorda({ codice, locale = false, nato, stato, cammino }, storage) {
  const a = archivio(storage)
  try {
    if ((!codice && !locale) || stato?.fase === 'chiusa') return void a?.removeItem(RICORDO)
    const s = stato && { fase: stato.fase, lezione: stato.lezione, avanti: stato.avanti ?? 0, rifatta: stato.rifatta ?? 0, io: stato.io ?? null, alunni: stato.alunni ?? [] }
    a?.setItem(RICORDO, JSON.stringify({ forma: FORMA, codice: locale ? null : codice, ...(locale ? { locale: true } : {}), nato, stato: s, cammino: cammino ?? null }))
  } catch { /* pieno o vietato: si va avanti senza ricordo */ }
}

export const dimentica = storage => ricorda({ codice: null }, storage)
