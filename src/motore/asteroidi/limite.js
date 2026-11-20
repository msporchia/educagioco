/* Gli Asteroidi limitati da fuori (a scuola): una tappa finta con le sole tabelline chieste e il bersaglio infinito, così
   nave madre, hangar, stella e premi della tappa non arrivano mai. Gira in Node. Vedi docs/asteroidi/scuola.md */
import { CAMPAGNA } from '../../data/tabelline.js'

const TABELLINE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const buone = lista => [...new Set((Array.isArray(lista) ? lista : []).filter(n => TABELLINE.includes(n)))].sort((a, b) => a - b)

// cosa si chiede: il risultato («9 × 7 = ?»), il numero nascosto («9 × ? = 63») o tutti e due a caso
export const MODI = ['prodotto', 'nascosto', 'misti']
const modoBuono = m => (MODI.includes(m) ? m : 'prodotto')

// `{ tabelline: [9], modo }` o `{ gruppi: [{ tabelline: [8], volte: 4, modo }, { tabelline: [3, 4], volte: 1 }] }` → i gruppi buoni
export function gruppiDel(limite) {
  const crudi = Array.isArray(limite?.gruppi) ? limite.gruppi : [{ tabelline: limite?.tabelline, volte: 1, modo: limite?.modo }]
  return crudi.map(g => ({ tabelline: buone(g?.tabelline), volte: Number.isInteger(g?.volte) && g.volte > 0 ? g.volte : 1, modo: modoBuono(g?.modo) }))
    .filter(g => g.tabelline.length)
}

// la forma della domanda dopo, dal modo del suo gruppo: nei misti metà e metà
export const formaDel = (modo, caso = Math.random()) => (modo === 'misti' ? (caso < 0.5 ? 'prodotto' : 'nascosto') : modoBuono(modo))

// tutte le tabelline del limite, in ordine e senza doppioni; [] se non ce n'è nessuna
export const tabellineDel = limite => buone(gruppiDel(limite).flatMap(g => g.tabelline))

/* di che gruppo è la prossima domanda: a turno pesato e liscio (quattro «tanto» per un «un po'», sparsi), come le schede */
export function creaTurni(gruppi) {
  const g = gruppi.map(x => ({ ...x, credito: 0 }))
  const totale = g.reduce((s, x) => s + x.volte, 0)
  return () => {
    for (const x of g) x.credito += x.volte
    const scelto = g.reduce((a, b) => (b.credito > a.credito ? b : a))
    scelto.credito -= totale
    return scelto.tabelline
  }
}

/* la voce della fila che la partita crede di giocare: un pianeta (il cielo è quello della tabellina più alta) senza `pos`
   né `nuova`, coi dieci fatti di ogni tabellina chiesta */
export function tappaDelLimite(limite) {
  const tabelle = tabellineDel(limite)
  if (!tabelle.length) return null
  const pianeta = CAMPAGNA.find(T => T.nuova === tabelle[tabelle.length - 1])
  const T = {
    nome: tabelle.length === 1 ? `La tabellina del ${tabelle[0]}` : `Tabelline del ${tabelle.join(', ')}`,
    emoji: pianeta ? pianeta.emoji : '✖️',
    nuova: null, tabelle, bersaglio: Infinity, mirate: 0,
  }
  // `prossime()`: le tabelline da cui pescare la domanda dopo; `modo` quello del gruppo appena uscito
  const gruppi = gruppiDel(limite)
  const turni = creaTurni(gruppi)
  const voce = { tipo: 'pianeta', i: pianeta ? pianeta.i : -1, T, pos: -1, n: 0, cap: -1, modo: gruppi[0].modo,
    prossime() { const t = turni(); voce.modo = gruppi.find(g => g.tabelline === t).modo; return t } }
  return voce
}


/* Facile e Difficile a scuola: le vite e i secondi che il sasso ci mette a cadere (`CFG` di MathGame); Normale è com'è a casa */
const RITOCCHI = { facile: { vite: 4, cadutaSec: 14 }, difficile: { vite: 2, cadutaSec: 7.5 } }
export const ritoccoDifficolta = d => ({ ...(RITOCCHI[d] || {}) })
