// La tappa lasciata a metà (docs/pozioni/sosta.md). Si scrive la pozione
// aperta com'è: il listino di ogni ingrediente, quanto c'è negli strumenti, i
// gettoni, le macchie e il procedimento a che punto è. Le tappe e gli
// ingredienti si rifanno dal codice. Una sosta di prima del procedimento
// (v 1, 2 e 3) non si legge: la tappa ricomincia.
import { Bottega, ottimo } from './bottega.js'
import { AZIONI, MORTAIO, TAGLIERE } from './procedimento.js'
import { CAMPAGNA, INFINITA, giroInfinito } from '../dati/campagna.js'
import { INGREDIENTI, VALE } from '../dati/misure.js'

export const VERSIONE = 4

const intero = (n, da, a) => Number.isInteger(n) && n >= da && n <= a

// la tappa del salvataggio, se c'è ancora: si cerca per chiave, perché
// l'indice da solo resterebbe buono anche con una tappa nuova in mezzo
export function tappaDi(dato) {
  if (!dato || dato.v !== VERSIONE) return null
  if (dato.chiave === INFINITA.chiave) return Array.isArray(dato.giro?.pozione) && intero(dato.giro.n, 0, 100000) ? { indice: -1, tappa: giroInfinito(dato.giro.n, dato.giro.pozione) } : null
  const indice = CAMPAGNA.findIndex(t => t.chiave === dato.chiave)
  return indice < 0 ? null : { indice, tappa: CAMPAGNA[indice] }
}

// cosa dice la mappa in cima: dove si era, senza aprire la partita
export function dice(dato) {
  const t = tappaDi(dato)
  if (!t || !Array.isArray(dato.ingredienti)) return null
  return { nome: t.indice < 0 ? INFINITA.nome : t.tappa.nome, emoji: t.indice < 0 ? INFINITA.emoji : t.tappa.emoji, indice: t.indice,
           fatti: dato.ingredienti.filter(i => !i.dispensa && i.messo >= i.dose).length, quanti: dato.ingredienti.filter(i => !i.dispensa).length,
           traboccate: dato.traboccate || 0 }
}

// `indice`: dove sta la tappa nella campagna. Una pozione finita non si
// scrive: torna null e la sosta si toglie.
export function scrivi(b, indice, extra = {}) {
  if (!b || b.finita) return null
  return {
    v: VERSIONE, tappa: indice, chiave: b.tappa.chiave,
    ...(indice < 0 ? { giro: { n: b.tappa.giro, pozione: [b.pozione.nome, b.pozione.emoji, b.pozione.colore] } } : {}),
    passi: b.passi.map(p => ({ azione: p.azione, cosa: [...p.cosa] })), righe: b.righe.map(r => ({ testo: r.testo, passi: [...r.passi] })),
    passo: b.passo, mortaio: [...b.mortaio], pestato: b.pestato, tagliere: [...b.tagliere], tagliato: b.tagliato, dentro: [...b.dentro], scaldato: b.scaldato, soffiato: b.soffiato, incantato: b.incantato, mescolato: b.mescolato, pasticci: b.pasticci, pasticciato: b.pasticciato,
    ingredienti: b.ingredienti.map(g => ({
      nome: g.nome, unita: g.unita, dose: g.dose, messo: g.messo, casa: g.casa, f: !!g.f, dispensa: !!g.dispensa, traboccate: g.traboccate, pezzi: [...g.pezzi],
      offerte: g.offerte.map(o => ({ base: o.base, prezzo: o.prezzo, unita: o.unita })),
    })),
    gettoni: b.gettoni, speso: b.speso, macchie: [...b.macchie],
    traboccate: b.traboccate, pulizie: b.pulizie, rese: b.monete, saltate: b.saltate,
    ...extra,
  }
}

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

function leggiPassi(lista, quanti) {
  if (!Array.isArray(lista) || !lista.length) throw new Error('passi')
  return lista.map(p => {
    if (!AZIONI[p.azione] || !Array.isArray(p.cosa) || p.cosa.some(i => i !== MORTAIO && i !== TAGLIERE && !intero(i, 0, quanti - 1))) throw new Error('passo')
    return { azione: p.azione, cosa: [...p.cosa] }
  })
}
function leggiRighe(lista, quanti) {
  if (!Array.isArray(lista) || !lista.length) throw new Error('righe')
  return lista.map(r => {
    if (typeof r.testo !== 'string' || !Array.isArray(r.passi) || r.passi.some(k => !intero(k, 0, quanti - 1))) throw new Error('riga')
    return { testo: r.testo, passi: [...r.passi] }
  })
}

function rimetti(dato, rnd) {
  const t = tappaDi(dato)
  if (!t || !Array.isArray(dato.ingredienti) || dato.ingredienti.filter(i => !i.dispensa).length !== t.tappa.ingredienti) return null
  for (const k of ['gettoni', 'speso', 'traboccate', 'pulizie', 'rese', 'saltate', 'passo', 'pasticci'])
    if (!intero(dato[k], 0, 100000)) return null
  const ingredienti = dato.ingredienti.map(s => {
    const i = INGREDIENTI.find(x => x.nome === s.nome)
    if (!i || !(s.unita in VALE) || !intero(s.dose, 1, 1e7) || !intero(s.messo, 0, s.dose) || !intero(s.traboccate, 0, 100000))
      throw new Error('ingrediente')
    if (!Array.isArray(s.pezzi) || s.pezzi.reduce((n, x) => n + x, 0) > s.dose) throw new Error('pezzi')
    const offerte = s.dispensa ? [] : leggiOfferte(s.offerte)
    if (!intero(s.casa, 0, s.dose)) throw new Error('casa')
    const migliore = s.dispensa ? { costo: 0, pezzi: [] } : ottimo(s.dose - s.casa, offerte)
    if (!migliore) throw new Error('ottimo')
    return { nome: i.nome, art: i.art, lavoro: i.lavoro, colore: i.colore, famiglia: i.famiglia, unita: s.unita, dose: s.dose,
             messo: s.messo, casa: s.casa, dispensa: !!s.dispensa, offerte, ottimo: migliore, traboccate: s.traboccate, pezzi: [...s.pezzi] }
  })
  if (!Array.isArray(dato.macchie) || dato.macchie.some(i => !intero(i, 0, ingredienti.length - 1))) return null

  const b = new Bottega(t.tappa, { rnd })
  b.ingredienti = ingredienti
  b.minimo = ingredienti.reduce((n, g) => n + g.ottimo.costo, 0)
  b.gettoni = dato.gettoni; b.speso = dato.speso
  b.macchie = [...dato.macchie]; b.traboccate = dato.traboccate; b.pulizie = dato.pulizie
  b.monete = dato.rese; b.saltate = dato.saltate
  b.passi = leggiPassi(dato.passi, ingredienti.length)
  b.righe = leggiRighe(dato.righe, b.passi.length)
  if (dato.passo >= b.passi.length || !Array.isArray(dato.mortaio) || !Array.isArray(dato.dentro)) return null
  b.passo = dato.passo; b.mortaio = [...dato.mortaio]; b.dentro = [...dato.dentro]
  // tagliere e mantice sono venuti dopo: in una sosta vecchia non ci sono, e va bene
  b.tagliere = Array.isArray(dato.tagliere) ? [...dato.tagliere] : []; b.tagliato = !!dato.tagliato; b.soffiato = !!dato.soffiato; b.incantato = !!dato.incantato
  b.pestato = !!dato.pestato; b.scaldato = !!dato.scaldato; b.mescolato = !!dato.mescolato; b.pasticci = dato.pasticci; b.pasticciato = !!dato.pasticciato
  return b
}
