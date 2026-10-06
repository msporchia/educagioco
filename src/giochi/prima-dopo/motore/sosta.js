// La tappa lasciata a metà: uscire non butta via le storie fatte né quella
// aperta. Si scrive solo quello che è successo (quante storie, gli errori,
// le ultime proposte, la domanda com'è, le monete già prese): la tappa, le
// storie e i verbi si rifanno dal codice, e si ritrovano per chiave. La
// domanda aperta si salva com'è: rifarla farebbe pescare una più facile.
// Perché ogni scelta: docs/prima-dopo/sosta.md.
import { STORIE } from '../dati/storie.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { VERBI } from '../dati/verbi.js'
import { Corsa, storieIdonee } from './corsa.js'
import { generaQuesito } from './quesito.js'

// sale quando un campo cambia significato: un salvataggio di un'altra
// versione si butta e la tappa ricomincia
export const VERSIONE = 1

const intero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max
const stringa = s => typeof s === 'string' && s.length > 0

function scriviQuesito(q) {
  if (q.tipo === 'ordina')
    return { tipo: q.tipo, sparse: q.sparse.map(v => v.id), posate: [...q.posate] }
  if (q.tipo === 'scegli')
    return { tipo: q.tipo, mostrati: [...q.mostrati], corretta: q.corretta,
             opzioni: q.opzioni.map(o => o.emoji), scelta: q.scelta }
  return { tipo: q.tipo, vignette: q.vignette.map(v => v.emoji),
           intruso: q.vignette.findIndex(v => v.intruso), scelta: q.scelta }
}

// `extra`: { serie, monete: { chiesto, dato } }. Torna `null` se non c'è
// niente da riprendere: nessuna corsa, o la tappa è già tutta fatta.
export function scrivi(corsa, { serie = 0, monete = {} } = {}) {
  if (!corsa || corsa.finita || !corsa.quesito) return null
  return {
    v: VERSIONE,
    tappa: corsa.tappa.chiave,
    fatte: corsa.fatte,
    errori: corsa.errori,
    recenti: [...corsa.recenti],
    verbo: corsa.verbo.chiave,
    storia: corsa.quesito.storia.chiave,
    quesito: scriviQuesito(corsa.quesito),
    serie,
    monete: { chiesto: monete.chiesto || 0, dato: monete.dato || 0 },
  }
}

// Rimette il quesito com'era, controllando che torni con la storia: torna
// `null` se qualcosa non quadra. Parte da un quesito vero (la classe, i
// getter) e ne sovrascrive solo lo stato della domanda.
function leggiQuesito(d, verbo, storia, altre, rnd) {
  if (!d || typeof d !== 'object') return null
  const q = generaQuesito(verbo, storia, altre, rnd)
  if (d.tipo !== q.tipo) return null
  const nelleStorie = e => storia.passi.includes(e)

  if (q.tipo === 'ordina') {
    const n = q.sequenza.length
    if (!Array.isArray(d.sparse) || d.sparse.length !== n) return null
    if (![...d.sparse].sort().every((id, i) => id === i)) return null
    if (!Array.isArray(d.posate) || d.posate.length !== n) return null
    const messe = d.posate.filter(id => id !== null)
    if (!messe.every(id => intero(id, 0, n - 1)) || new Set(messe).size !== messe.length) return null
    q.sparse = d.sparse.map(id => ({ id, emoji: q.sequenza[id] }))
    q.posate = [...d.posate]
    q.esito = !q.piena ? null : (q.posate.every((id, i) => id === i) ? 'giusta' : 'sbagliata')
    return q
  }

  if (q.tipo === 'scegli') {
    const buco = { manca: 1, dopo: 2, prima: 0 }[q.verbo]
    if (!Array.isArray(d.mostrati) || d.mostrati.length !== 3 || d.mostrati[buco] !== null) return null
    if (!d.mostrati.every((e, i) => i === buco || nelleStorie(e))) return null
    if (!nelleStorie(d.corretta)) return null
    if (!Array.isArray(d.opzioni) || d.opzioni.length !== 3 || !d.opzioni.every(stringa)
        || new Set(d.opzioni).size !== 3 || !d.opzioni.includes(d.corretta)) return null
    if (d.scelta != null && !d.opzioni.includes(d.scelta)) return null
    q.mostrati = [...d.mostrati]
    q.corretta = d.corretta
    q.opzioni = d.opzioni.map(emoji => ({ emoji, giusta: emoji === d.corretta }))
    q.scelta = d.scelta ?? null
    q.esito = q.scelta === null ? null : (q.scelta === q.corretta ? 'giusta' : 'sbagliata')
    return q
  }

  // intruso: quattro vignette, una di un'altra storia
  if (!Array.isArray(d.vignette) || d.vignette.length !== 4 || !d.vignette.every(stringa)) return null
  if (!intero(d.intruso, 0, 3)) return null
  if (!d.vignette.every((e, i) => i === d.intruso ? e !== storia.passi[i] : e === storia.passi[i])) return null
  if (d.scelta != null && !intero(d.scelta, 0, 3)) return null
  q.vignette = d.vignette.map((emoji, id) => ({ id, emoji, intruso: id === d.intruso }))
  q.scelta = d.scelta ?? null
  q.esito = q.scelta === null ? null : (q.scelta === d.intruso ? 'giusta' : 'sbagliata')
  return q
}

// Torna `{ corsa, indice, serie, monete }` pronto da giocare, o `null` se
// il salvataggio non si può leggere: la tappa allora ricomincia.
export function leggi(dato, { campagna = CAMPAGNA, storie = STORIE, rnd = Math.random } = {}) {
  if (!dato || dato.v !== VERSIONE) return null
  const indice = campagna.findIndex(t => t.chiave === dato.tappa)
  if (indice < 0) return null
  const tappa = campagna[indice]
  try {
    const verbo = VERBI[dato.verbo]
    if (!verbo || (tappa.verbo !== 'mescolato' && tappa.verbo !== dato.verbo)) return null
    const idonee = storieIdonee(tappa, verbo, storie)
    const storia = idonee.find(s => s.chiave === dato.storia)
    if (!storia) return null
    if (!intero(dato.fatte, 0, tappa.quante - 1) || !intero(dato.errori, 0, 999)) return null
    if (!Array.isArray(dato.recenti) || dato.recenti.length > 2 || !dato.recenti.every(stringa)) return null

    const quesito = leggiQuesito(dato.quesito, verbo, storia,
      idonee.filter(s => s.chiave !== storia.chiave), rnd)
    if (!quesito) return null

    const corsa = Corsa.perTappa(tappa, { rnd, storie })
    corsa.fatte = dato.fatte
    corsa.errori = dato.errori
    corsa.recenti = [...dato.recenti]
    corsa.verbo = verbo
    corsa.quesito = quesito
    return {
      corsa, indice,
      serie: intero(dato.serie, 0, 99999) ? dato.serie : 0,
      monete: { chiesto: Math.max(0, +dato.monete?.chiesto || 0),
                dato: Math.max(0, +dato.monete?.dato || 0) },
    }
  } catch {
    return null   // un salvataggio storto non porta giù il gioco
  }
}

// cosa scrive la carta in cima alla mappa, senza aprire la tappa
export function dice(dato, campagna = CAMPAGNA) {
  if (!dato || dato.v !== VERSIONE) return null
  const indice = campagna.findIndex(t => t.chiave === dato.tappa)
  if (indice < 0) return null
  const t = campagna[indice]
  return { indice, nome: t.nome, icona: t.icona, fatte: dato.fatte || 0, quante: t.quante }
}
