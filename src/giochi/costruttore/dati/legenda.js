// La legenda delle mappe, un carattere per cella. Vedi docs/costruttore/linguaggio.md.
import { COLORE_DI_LETTERA } from './colori.js'

export const SIMBOLI = {
  '.': { suolo: 'aria' },
  '#': { suolo: 'terreno' },
  '~': { suolo: 'acqua' },
  '@': { suolo: 'aria', robot: true },
  'P': { suolo: 'aria', omino: true },
  'F': { suolo: 'aria', bandiera: true },
}

// Cosa c'è in una cella, letto da un carattere. `null` se non è riconosciuto.
export function leggiSimbolo(c) {
  if (SIMBOLI[c]) return SIMBOLI[c]
  const min = COLORE_DI_LETTERA[c]
  if (min) return { suolo: 'aria', bersaglio: min }
  const mai = COLORE_DI_LETTERA[c.toLowerCase()]
  if (mai && c !== c.toLowerCase()) return { suolo: 'aria', fisso: mai }
  return null
}
