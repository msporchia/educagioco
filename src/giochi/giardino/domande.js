// Il ponte fra una scelta del gioco e il motore dei quiz: chiede UN conto di UN'operazione
// a una grandezza precisa al modulo `conti` (src/quiz/moduli/conti.js), così arrivano il
// perché dopo lo sbaglio, lo SRS, l'età e i saperi spenti dai genitori. Il motore del
// giardino non sa che esistano le domande: si parlano solo qui. Vedi docs/giardino/calcoli.md.
import { domandaPerGioco } from '../../quiz/scelta.js'

const TIPO = { '+': 'somma', '−': 'differenza', '×': 'prodotto', '÷': 'quoziente' }

/* `op` è l'operazione, `grado` quello del modulo (la base del bambino più il peso della pianta). */
export function domandaDi(op, grado) {
  return domandaPerGioco({ moduli: ['conti'], tipi: [TIPO[op] || 'somma'], grado })
}
