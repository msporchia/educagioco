// La legenda del porto: due caratteri per casella, posto + cosa.
// Tabella completa in docs/costruttore/porto.md.
import { COLORE_DI_LETTERA } from '../colori.js'

export const POSTI = {
  '.': { suolo: 'pavimento' },
  '#': { suolo: 'muro' },
  '~': { suolo: 'mare' },
  '=': { suolo: 'pavimento', arredo: { tipo: 'scaffale' } },
  'B': { suolo: 'pavimento', arredo: { tipo: 'bancone' } },
  '>': { suolo: 'pavimento', arredo: { tipo: 'nastro', verso: 'destra' } },
  '<': { suolo: 'pavimento', arredo: { tipo: 'nastro', verso: 'sinistra' } },
  '^': { suolo: 'pavimento', arredo: { tipo: 'nastro', verso: 'su' } },
  'v': { suolo: 'pavimento', arredo: { tipo: 'nastro', verso: 'giu' } },
  '_': { suolo: 'strada' },
}

export const cosaDaLettera = l =>
  /^[1-9]$/.test(l) ? { tipo: 'biglietto', numero: Number(l) } : cassaDaLettera(l)

export const cassaDaLettera = l => {
  const colore = COLORE_DI_LETTERA[String(l).toLowerCase()]
  return colore && l !== String(l).toLowerCase() ? { tipo: 'cassa', colore } : null
}

// Cosa c'è in una casella, letto da una coppia di caratteri. `null` se
// non è riconosciuta.
export function leggiCasella(coppia, extra = null) {
  if (extra && extra[coppia]) return extra[coppia]
  const [p, c = '.'] = coppia
  let casella
  if (p === 'C') {
    if (!c || c === '.') return null
    return { suolo: 'pavimento', arredo: { tipo: 'cassone', id: c } }
  }
  if (!POSTI[p]) return null
  casella = { ...POSTI[p], arredo: POSTI[p].arredo ? { ...POSTI[p].arredo } : undefined }
  if (!casella.arredo) delete casella.arredo
  // il segno ripetuto ('##', '~~'…) vuol dire «e basta»; non per le lettere
  if (c === '.' || (c === p && !/[a-zA-Z]/.test(p))) return casella
  if (c === '@') return casella.suolo === 'pavimento' && !casella.arredo ? { ...casella, robot: true } : null
  if (c === '*') return casella.suolo === 'pavimento' ? { ...casella, gru: true } : null
  if (c === '%') return casella.suolo === 'pavimento' && !casella.arredo ? { ...casella, clienti: true } : null
  if (c === '&') return (casella.suolo === 'pavimento' || casella.suolo === 'strada') && !casella.arredo
    ? { suolo: 'strada', piazzola: true } : null
  if (/^[1-9]$/.test(c)) return { ...casella, cosa: { tipo: 'biglietto', numero: Number(c) } }
  const cassa = cassaDaLettera(c)
  if (cassa) return casella.suolo === 'pavimento' ? { ...casella, cosa: cassa } : null
  const bersaglio = COLORE_DI_LETTERA[c]
  if (bersaglio) return { ...casella, bersaglio }
  return null
}
