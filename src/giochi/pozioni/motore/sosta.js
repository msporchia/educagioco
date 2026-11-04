// La tappa lasciata a metà (docs/pozioni/sosta.md). Si scrive la pozione
// aperta com'è: il listino di ogni ingrediente, quanto c'è negli strumenti, i
// gettoni, le macchie e l'ordine in preparazione. Le tappe e gli
// ingredienti si rifanno dal codice. Una sosta del banco vecchio (v 1) non
// si legge: la tappa ricomincia.
import { Bottega, ottimo } from './bottega.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { INGREDIENTI, POZIONI, CLIENTI, VALE } from '../dati/misure.js'

export const VERSIONE = 2

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
  if (!t || !Array.isArray(dato.ingredienti)) return null
  return { nome: t.tappa.nome, emoji: t.tappa.emoji, indice: t.indice,
           fatti: dato.ingredienti.filter(i => i.messo >= i.dose).length, quanti: dato.ingredienti.length,
           traboccate: dato.traboccate || 0 }
}

// `indice`: dove sta la tappa nella campagna. Una pozione finita non si
// scrive: torna null e la sosta si toglie.
export function scrivi(b, indice, extra = {}) {
  if (!b || b.finita) return null
  return {
    v: VERSIONE, tappa: indice, chiave: b.tappa.chiave,
    pozione: b.pozione.nome, cliente: b.pozione.cliente,
    ingredienti: b.ingredienti.map(g => ({
      nome: g.nome, unita: g.unita, dose: g.dose, messo: g.messo, traboccate: g.traboccate, pezzi: [...g.pezzi],
      offerte: g.offerte.map(o => ({ base: o.base, prezzo: o.prezzo, unita: o.unita })),
    })),
    gettoni: b.gettoni, speso: b.speso, macchie: [...b.macchie],
    traboccate: b.traboccate, pulizie: b.pulizie, rese: b.monete, saltate: b.saltate,
    ...extra,
  }
}

const intero = (n, da, a) => Number.isInteger(n) && n >= da && n <= a

// Rimette la pozione com'era. `null` se il salvataggio non torna
// (versione, tappa cambiata, ingrediente sparito): chi chiama butta la
// sosta e la tappa ricomincia.
export function leggi(dato, { rnd = Math.random } = {}) {
  try { return rimetti(dato, rnd) } catch { return null }
}

function leggiOfferte(lista) {
  if (!Array.isArray(lista) || !lista.length) throw new Error('offerte')
  return lista.map(o => {
    if (!intero(o.base, 1, 1e7) || !intero(o.prezzo, 1, 1000) || !(o.unita in VALE)) throw new Error('offerta')
    return { base: o.base, prezzo: o.prezzo, unita: o.unita }
  })
}

function rimetti(dato, rnd) {
  const t = tappaDi(dato)
  if (!t || !Array.isArray(dato.ingredienti) || dato.ingredienti.length !== t.tappa.ingredienti) return null
  const p = POZIONI.find(x => x.nome === dato.pozione)
  if (!p || !CLIENTI.includes(dato.cliente)) return null
  for (const k of ['gettoni', 'speso', 'traboccate', 'pulizie', 'rese', 'saltate'])
    if (!intero(dato[k], 0, 100000)) return null
  const ingredienti = dato.ingredienti.map(s => {
    const i = INGREDIENTI.find(x => x.nome === s.nome)
    if (!i || !(s.unita in VALE) || !intero(s.dose, 1, 1e7) || !intero(s.messo, 0, s.dose) || !intero(s.traboccate, 0, 100000))
      throw new Error('ingrediente')
    if (!Array.isArray(s.pezzi) || s.pezzi.reduce((n, x) => n + x, 0) > s.dose) throw new Error('pezzi')
    const offerte = leggiOfferte(s.offerte)
    const migliore = ottimo(s.dose, offerte)
    if (!migliore) throw new Error('ottimo')
    return { nome: i.nome, emoji: i.emoji, colore: i.colore, famiglia: i.famiglia, unita: s.unita, dose: s.dose,
             messo: s.messo, offerte, ottimo: migliore, traboccate: s.traboccate, pezzi: [...s.pezzi] }
  })
  if (!Array.isArray(dato.macchie) || dato.macchie.some(i => !intero(i, 0, ingredienti.length - 1))) return null

  const b = new Bottega(t.tappa, { rnd })
  b.ingredienti = ingredienti
  b.pozione = { nome: p.nome, emoji: p.emoji, colore: p.colore, cliente: dato.cliente }
  b.minimo = ingredienti.reduce((n, g) => n + g.ottimo.costo, 0)
  b.gettoni = dato.gettoni; b.speso = dato.speso
  b.macchie = [...dato.macchie]; b.traboccate = dato.traboccate; b.pulizie = dato.pulizie
  b.monete = dato.rese; b.saltate = dato.saltate
  return b
}
