/* ═══════════════════════════════════════════════════════════════════
   LA LEGENDA DEL PORTO — due caratteri per casella

   Dall'alto una casella ha due strati: **il posto** (il pavimento, il
   muro, il mare, uno scaffale, il bancone, un nastro) e **quello che ci
   sta sopra** (una cassa, un biglietto, il robot). Per questo una mappa
   del porto si scrive a coppie di caratteri, come quelle del Generale:
   il primo dice il posto, il secondo la cosa. `=R` è uno scaffale con
   una cassa rossa, `.@` il robot sul pavimento, `>.` un nastro vuoto
   che porta a destra.

     il posto                         la cosa
     .   pavimento                    .   niente
     #   muro                         @   il robot (solo sul pavimento)
     ~   mare                         R   una cassa rossa: la maiuscola
     =   scaffale (tiene una cosa)        della lettera del colore
     B   il bancone dei clienti       r   qui, alla fine, ci va una cassa
     >   un nastro che porta a destra     rossa: il disegno in trasparenza
     <   … a sinistra                 1…9 un biglietto con quel numero
     ^   … in su                      *   qui cala la gru
     v   … in giù                     %   qui si mettono i clienti
     _   la strada dei camion         &   la piazzola: qui si ferma il
         (il robot non ci va)             camion (sopra `.` o `_`)
     C   un cassone: il secondo carattere è il suo nome, e la sua
         descrizione sta nei `cassoni` dell'ordine («C1», «Cs»)

   Le lettere dei colori sono quelle di `dati/colori.js`: è lo stesso
   rosso dei mattoni del cantiere. Una coppia che non è in legenda è un
   guasto e non un pavimento: una mappa scritta male deve diventare rossa
   in un test, non un buco sul telefono. Un ordine può aggiungere coppie
   sue (`legenda: { 'BX': {...} }`), nella stessa forma di quelle che
   escono da `leggiCasella`.
   ═══════════════════════════════════════════════════════════════════ */
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

/* una lettera di una mappa o di un cassone: una cassa (la maiuscola del
   colore) o un biglietto (una cifra) */
export const cosaDaLettera = l =>
  /^[1-9]$/.test(l) ? { tipo: 'biglietto', numero: Number(l) } : cassaDaLettera(l)

/* una cassa, dalla maiuscola del suo colore: `R` → rossa */
export const cassaDaLettera = l => {
  const colore = COLORE_DI_LETTERA[String(l).toLowerCase()]
  return colore && l !== String(l).toLowerCase() ? { tipo: 'cassa', colore } : null
}

/* Cosa c'è in una casella, letto da una coppia di caratteri. `null` se
   la coppia non vuol dire niente. La forma:
     { suolo, arredo?: { tipo, verso?, id? }, cosa?: { tipo, colore?, numero? },
       bersaglio?: colore, robot?, gru?, clienti? } */
export function leggiCasella(coppia, extra = null) {
  if (extra && extra[coppia]) return extra[coppia]
  const [p, c = '.'] = coppia
  let casella
  if (p === 'C') {
    /* il cassone: il secondo carattere è il nome, non una cosa */
    if (!c || c === '.') return null
    return { suolo: 'pavimento', arredo: { tipo: 'cassone', id: c } }
  }
  if (!POSTI[p]) return null
  casella = { ...POSTI[p], arredo: POSTI[p].arredo ? { ...POSTI[p].arredo } : undefined }
  if (!casella.arredo) delete casella.arredo
  /* `##`, `~~`, `==`, `>>`: il segno ripetuto vuol dire «e basta», come
     nelle mappe del Generale. Non per le lettere (`B`, `v`): `BB` è il
     bancone con sopra una cassa blu */
  if (c === '.' || (c === p && !/[a-zA-Z]/.test(p))) return casella
  if (c === '@') return casella.suolo === 'pavimento' && !casella.arredo ? { ...casella, robot: true } : null
  if (c === '*') return casella.suolo === 'pavimento' ? { ...casella, gru: true } : null
  if (c === '%') return casella.suolo === 'pavimento' && !casella.arredo ? { ...casella, clienti: true } : null
  /* la piazzola del camion è strada anche quando il camion non c'è */
  if (c === '&') return (casella.suolo === 'pavimento' || casella.suolo === 'strada') && !casella.arredo
    ? { suolo: 'strada', piazzola: true } : null
  if (/^[1-9]$/.test(c)) return { ...casella, cosa: { tipo: 'biglietto', numero: Number(c) } }
  const cassa = cassaDaLettera(c)
  if (cassa) return casella.suolo === 'pavimento' ? { ...casella, cosa: cassa } : null
  const bersaglio = COLORE_DI_LETTERA[c]
  if (bersaglio) return { ...casella, bersaglio }
  return null
}
