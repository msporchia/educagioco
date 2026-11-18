/* Gli Asteroidi limitati da fuori (a scuola): una tappa finta con le sole tabelline chieste e il bersaglio infinito, così
   nave madre, hangar, stella e premi della tappa non arrivano mai. Gira in Node. Vedi docs/asteroidi/scuola.md */
import { CAMPAGNA } from '../../data/tabelline.js'

const TABELLINE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// `{ tabelline: [9] }` → le tabelline buone, in ordine e senza doppioni; [] se non ce n'è nessuna
export const tabellineDel = limite => [...new Set((Array.isArray(limite?.tabelline) ? limite.tabelline : [])
  .filter(n => TABELLINE.includes(n)))].sort((a, b) => a - b)

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
  return { tipo: 'pianeta', i: pianeta ? pianeta.i : -1, T, pos: -1, n: 0, cap: -1 }
}

