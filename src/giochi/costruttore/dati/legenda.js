/* ═══════════════════════════════════════════════════════════════════
   LA LEGENDA DELLE MAPPE — un carattere per cella

   Il cantiere si vede di lato, come una fetta di terra: il sopra è il
   cielo, il sotto è il suolo. Una mappa è un elenco di righe, dall'alto
   in basso, e ogni carattere è una cella:

     .   aria
     #   terreno (erba sopra, terra sotto): solido, non ci si mette niente
     ~   acqua: non regge nessuno, ma un mattone ci si posa e la riempie
     @   da qui parte il robot (la cella è aria)
     P   da qui parte l'omino che prova la costruzione (aria)
     F   la bandiera dove l'omino deve arrivare (aria)
     r   minuscola: qui ci va un mattone di quel colore (il disegno)
     R   maiuscola: qui c'è già un mattone di quel colore

   Le lettere dei colori stanno in `dati/colori.js`. Una lettera che non
   è in legenda è un guasto, non un'aria: una mappa scritta male deve
   diventare rossa in un test, non un buco sul telefono.
   ═══════════════════════════════════════════════════════════════════ */
import { COLORE_DI_LETTERA } from './colori.js'

export const SIMBOLI = {
  '.': { suolo: 'aria' },
  '#': { suolo: 'terreno' },
  '~': { suolo: 'acqua' },
  '@': { suolo: 'aria', robot: true },
  'P': { suolo: 'aria', omino: true },
  'F': { suolo: 'aria', bandiera: true },
}

/* Cosa c'è in una cella, letto da un carattere. `null` se il carattere
   non vuol dire niente. */
export function leggiSimbolo(c) {
  if (SIMBOLI[c]) return SIMBOLI[c]
  const min = COLORE_DI_LETTERA[c]
  if (min) return { suolo: 'aria', bersaglio: min }
  const mai = COLORE_DI_LETTERA[c.toLowerCase()]
  if (mai && c !== c.toLowerCase()) return { suolo: 'aria', fisso: mai }
  return null
}
