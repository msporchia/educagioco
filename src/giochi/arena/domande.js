// Il ponte fra una scelta del gioco e il motore dei quiz: chiede UN conto di
// UN'operazione a una grandezza precisa al modulo `conti` (src/quiz/moduli/conti.js).
// Le regole non sanno che esistano le domande, e il motore dei quiz non sa che
// esista Castle Battle: sono due cose che si parlano solo qui. Vedi docs/arena/calcoli.md.
import { domandaPerGioco } from '../../quiz/scelta.js'

const TIPO = { '+': 'somma', '−': 'differenza', '×': 'prodotto', '÷': 'quoziente' }

/* `op` è l'operazione (+ − × ÷), `peso` la grandezza da 1 a 10 che dice il
   motore di gioco. Torna quello che Domanda.vue si aspetta
   ({ domanda, pittori, modulo, nome, icona }). */
export function domandaDi(op, peso) {
  return domandaPerGioco({ moduli: ['conti'], tipi: [TIPO[op] || 'somma'], grado: Math.max(1, Math.min(10, Math.round(peso))) })
}
