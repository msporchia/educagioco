// La tappa lasciata a metà (docs/pozioni/sosta.md). Si scrive solo quello
// che è successo: il cliente in corso con la sua ricetta (la domanda aperta
// si salva com'è), cosa c'è sul banco, le perfette e gli errori. Le tappe,
// gli ingredienti e gli attrezzi si rifanno dal codice.
import { Partita } from './partita.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { STRUMENTO, INGREDIENTI, POZIONI, CLIENTI } from '../dati/misure.js'

export const VERSIONE = 1

// la tappa del salvataggio, se c'è ancora: si cerca per chiave, perché
// l'indice da solo resterebbe buono anche con una tappa nuova in mezzo
export function tappaDi(dato) {
  if (!dato || dato.v !== VERSIONE) return null
  const indice = CAMPAGNA.findIndex(t => t.chiave === dato.chiave)
  return indice < 0 ? null : { indice, tappa: CAMPAGNA[indice] }
}

// cosa dice la mappa in cima: dove si era, senza aprire la partita
export function dice(dato) {
  const t = tappaDi(dato)
  if (!t) return null
  return { nome: t.tappa.nome, emoji: t.tappa.emoji, indice: t.indice,
           cliente: Math.min((dato.n || 0) + 1, t.tappa.clienti), clienti: t.tappa.clienti,
           sbagli: dato.sbagli || 0 }
}

const unaDose = d => ({ famiglia: d.famiglia, unita: d.unita, base: d.base })

// `indice`: dove sta la tappa nella campagna. Una tappa finita non si
// scrive: torna null e la sosta si toglie.
export function scrivi(p, indice, extra = {}) {
  if (!p || p.finita || !p.ricetta) return null
  const r = p.ricetta
  return {
    v: VERSIONE, tappa: indice, chiave: p.tappa.chiave,
    n: p.n, sbagli: p.sbagli, pozioni: p.pozioni, perfette: p.perfette,
    sbagliRicetta: p.sbagliRicetta, sbagliQui: p.sbagliQui,
    dosi: p.dosi.map(d => ({ chiave: d.chiave, giusta: d.giusta, chiesta: d.chiesta })),
    ultime: p.ultime.map(d => ({ base: d.base, unita: d.unita })),
    ricetta: {
      pozione: r.nome, cliente: r.cliente,
      ingredienti: r.ingredienti.map(i => ({ nome: i.nome, dose: unaDose(i.dose), fatto: i.fatto })),
      scaffale: r.scaffale.map(s => s.nome),
    },
    corrente: p.corrente, inMano: p.inMano,
    strumento: p.strumento ? p.strumento.chiave : null,
    messi: [...p.messi],
    // un esito aperto: il giusto è già pagato e imparato (manca solo andare
    // avanti), lo sbaglio è già annotato (basta rileggerlo e riprovare)
    esito: p.esito ? { tipo: p.esito.tipo, codice: p.esito.codice || null,
                       pozioneFinita: !!p.esito.pozioneFinita } : null,
    ...extra,
  }
}

const intero = (n, da, a) => Number.isInteger(n) && n >= da && n <= a

// Rimette la partita dentro la stessa tappa. `null` se il salvataggio non
// torna (versione, tappa cambiata, ingrediente o dose spariti): chi chiama
// butta la sosta e la tappa ricomincia.
export function leggi(dato, { rnd = Math.random } = {}) {
  try { return rimetti(dato, rnd) } catch { return null }
}

function rimetti(dato, rnd) {
  const t = tappaDi(dato)
  if (!t || !dato.ricetta) return null
  const { tappa } = t
  const p = new Partita(tappa, { rnd })

  if (!intero(dato.n, 0, tappa.clienti - 1)) return null
  for (const k of ['sbagli', 'pozioni', 'perfette', 'sbagliRicetta', 'sbagliQui'])
    if (!intero(dato[k], 0, 10000)) return null
  if (dato.pozioni !== dato.n || dato.perfette > dato.pozioni) return null

  const dosiDi = d => tappa.dosi.find(x => x.base === d.base && x.unita === d.unita
                                           && (!d.famiglia || x.famiglia === d.famiglia))
  const r = dato.ricetta
  const pozione = POZIONI.find(x => x.nome === r.pozione)
  if (!pozione || !CLIENTI.includes(r.cliente)) return null
  if (!Array.isArray(r.ingredienti) || r.ingredienti.length !== tappa.ingredienti) return null
  const ingredienti = r.ingredienti.map(i => {
    const ing = INGREDIENTI.find(x => x.nome === i.nome)
    const dose = i.dose && dosiDi(i.dose)
    if (!ing || !dose || ing.famiglia !== dose.famiglia || typeof i.fatto !== 'boolean') throw new Error('ingrediente')
    return { ...ing, dose, fatto: i.fatto }
  })
  if (!Array.isArray(r.scaffale)) return null
  const scaffale = r.scaffale.map(nome => {
    const i = INGREDIENTI.find(x => x.nome === nome)
    if (!i) throw new Error('scaffale')
    return { emoji: i.emoji, nome: i.nome, famiglia: i.famiglia, colore: i.colore }
  })
  if (ingredienti.some(i => !scaffale.some(s => s.nome === i.nome))) return null

  if (!Array.isArray(dato.dosi) || !Array.isArray(dato.ultime) || !Array.isArray(dato.messi)) return null
  p.n = dato.n; p.sbagli = dato.sbagli; p.pozioni = dato.pozioni; p.perfette = dato.perfette
  p.sbagliRicetta = dato.sbagliRicetta; p.sbagliQui = dato.sbagliQui
  p.dosi = dato.dosi.map(d => ({ chiave: d.chiave || null, giusta: !!d.giusta, chiesta: !!d.chiesta }))
  p.ultime = dato.ultime.map(u => {
    const d = dosiDi(u)
    if (!d) throw new Error('ultime')
    return d
  })
  p.ricetta = { ...pozione, cliente: r.cliente, ingredienti, scaffale }

  if (!intero(dato.corrente, -1, ingredienti.length - 1)) return null
  p.corrente = dato.corrente
  p.inMano = !!dato.inMano
  if (p.inMano && p.corrente < 0) return null
  p.strumento = null
  if (dato.strumento) {
    if (p.corrente < 0 || !tappa.strumenti.includes(dato.strumento)) return null
    p.strumento = STRUMENTO[dato.strumento]
    if (p.inMano) return null
  }
  p.messi = dato.messi.filter(x => p.strumento && p.strumento.pezzi.includes(x))
  if (p.messi.length !== dato.messi.length || p.messo > (p.strumento ? p.strumento.limite : 0)) return null

  const e = dato.esito
  if (e) {
    if (e.tipo === 'giusto') {
      // la dose è nel calderone: resta da andare avanti, e lo fa chi chiama
      // (i contatori, il cliente nuovo, la tappa che finisce)
      if (p.corrente < 0 || !ingredienti[p.corrente].fatto) return null
      if (e.pozioneFinita !== (p.daFare.length === 0)) return null
      p.esito = { tipo: 'giusto', ingrediente: p.ingrediente, strumento: p.strumento,
                  annota: null, pozioneFinita: e.pozioneFinita }
    } else if (e.tipo === 'sbaglio') {
      // lo sbaglio è già stato letto e annotato: si torna a riprovare
      p.esito = { tipo: 'sbaglio', codice: e.codice, testo: '', spiegazione: null, annota: null }
      p.riprendi()
    } else return null
  }
  return p
}
