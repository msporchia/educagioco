/* Il ponte fra i quiz e il profilo: annota scrive com'è andata una
   domanda, bisognoDi rilegge quanto va rivista quella tipologia. L'unico
   file di src/quiz/ che conosce il profilo (il nucleo gira in Node e non
   lo importa: il bisogno viaggia come funzione passata a mano). Vedi
   docs/apprendimento/quiz-ripasso.md. */

import { state, answer } from '../store/profile.js'
import { bisognoDa } from './nucleo/bisogno.js'

// si legge state.profile.items a mano: item() crea l'elemento se non c'è, e qui si guarda per ogni pesca
export function bisognoDi(chiave, now = Date.now()) {
  if (!chiave) return 1
  return bisognoDa(state.profile?.items?.[chiave], now)
}

// un `now` solo per tutta la pesca, così due tipologie non si confrontano su due istanti diversi
export function ilBisogno(now = Date.now()) {
  return chiave => bisognoDi(chiave, now)
}

// tempo arriva in secondi da Domanda.vue e va in ms per srs.js, ma non pesa: rispondere lento non è un errore qui
export function annota({ chiave, giusto, tempo = 0 }) {
  if (!chiave) return
  answer(chiave, { correct: !!giusto, ms: Math.max(0, tempo) * 1000 })
}
