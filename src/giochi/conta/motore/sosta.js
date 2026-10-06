// La tappa lasciata a metà: uscire non butta via niente. Si scrive quello
// che è successo (quante giuste, gli errori che fanno le stelle, le
// monete già prese) e la domanda aperta com'è, gettoni compresi: rifarla
// a caso sarebbe una mossa (può uscire più facile). La tappa si ritrova
// per chiave. Regola comune: docs/core/ripresa.md; qui: docs/conta/regole.md.
import { CAMPAGNA } from '../dati/campagna.js'
import { VERBI } from '../dati/verbi.js'
import { mondo } from '../dati/mondi.js'
import { Corsa } from './corsa.js'

// 1: la prima. Sale se la forma della domanda cambia significato.
export const VERSIONE = 1

const intero = n => Number.isInteger(n) && n >= 0

// I gettoni portano la specie per chiave: l'oggetto sta nei mondi e si
// rivede da lì (un emoji cambiato non resta scritto nei salvataggi).
function spoglia(domanda) {
  const d = JSON.parse(JSON.stringify({ ...domanda, gruppi: undefined }))
  d.gruppi = domanda.gruppi.map(g => ({
    chiave: g.chiave,
    gettoni: g.gettoni.map(t => ({ ...t, specie: t.specie.chiave })),
  }))
  return d
}

// null se non torna: una domanda storta sullo schermo è un gioco rotto.
function rivesti(d, tappa) {
  const verbo = VERBI[d?.verbo]
  if (!verbo || ![tappa.verbo, ...(tappa.alterna || [])].includes(d.verbo)) return null
  if (d.modo !== verbo.modo || !Array.isArray(d.gruppi) || !d.gruppi.length) return null
  if (!d.consegna || !Array.isArray(d.consegna.icone) || typeof d.consegna.frase !== 'string') return null
  if (d.rispostaGiusta === undefined || d.rispostaGiusta === null) return null

  const m = mondo(tappa.mondo)
  const specie = new Map(m.specie.map(s => [s.chiave, s]))
  const gruppi = []
  for (const g of d.gruppi) {
    if (!g || typeof g.chiave !== 'string' || !Array.isArray(g.gettoni)) return null
    const gettoni = []
    for (const t of g.gettoni) {
      const s = specie.get(t?.specie)
      if (!s || typeof t.id !== 'string' || !Number.isFinite(t.x) || !Number.isFinite(t.y)) return null
      gettoni.push({ ...t, specie: s })
    }
    gruppi.push({ chiave: g.chiave, gettoni })
  }

  if (d.modo === 'porta') {
    if (!intero(d.n) || d.rispostaGiusta !== d.n) return null
  } else {
    if (!Array.isArray(d.opzioni) || !d.opzioni.some(o => Object.is(o?.valore, d.rispostaGiusta))) return null
  }
  return { ...d, gruppi }
}

// `extra`: { monete: { chiesto, dato }, serie } — quello che sta nella
// schermata e non nella corsa.
export function scrivi(corsa, extra = {}) {
  if (!corsa || corsa.finita) return null
  const m = extra.monete || {}
  return {
    v: VERSIONE,
    tappa: corsa.tappa.chiave,
    fatte: corsa.indice,
    errori: corsa.errori,
    domanda: spoglia(corsa.domanda),
    monete: { chiesto: m.chiesto || 0, dato: m.dato || 0 },
    serie: extra.serie || 0,
  }
}

// Torna { corsa, indice, monete, serie } o `null` se il salvataggio non si
// può leggere: chi chiama butta la sosta e la tappa ricomincia.
export function leggi(dato, opzioni = {}) {
  if (!dato || dato.v !== VERSIONE) return null
  const indice = CAMPAGNA.findIndex(t => t.chiave === dato.tappa)
  if (indice < 0) return null
  const tappa = CAMPAGNA[indice]
  if (!intero(dato.fatte) || dato.fatte >= tappa.partite || !intero(dato.errori)) return null
  const domanda = rivesti(dato.domanda, tappa)
  if (!domanda) return null
  const m = dato.monete || {}
  return {
    indice,
    corsa: Corsa.ripresa(tappa, { indice: dato.fatte, errori: dato.errori, domanda, ...opzioni }),
    monete: { chiesto: intero(m.chiesto) ? m.chiesto : 0, dato: intero(m.dato) ? m.dato : 0 },
    serie: intero(dato.serie) ? dato.serie : 0,
  }
}

// Quello che dice la carta in cima alla mappa, senza aprire la partita.
export function dice(dato) {
  const letto = leggi(dato)
  if (!letto) return null
  const t = letto.corsa.tappa
  return { tappa: t.chiave, nome: t.nome, mondo: t.mondo,
           domanda: dato.fatte + 1, di: t.partite }
}
