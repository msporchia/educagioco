/* Il ponte fra i quiz e il profilo: annota scrive com'è andata una
   domanda, bisognoDi rilegge quanto va rivista quella tipologia, e il
   muro alleggerisce da sé (quiz/alleggerire.js). Il nucleo gira in Node
   e non importa il profilo: il bisogno viaggia come funzione passata a
   mano. Vedi docs/apprendimento/quiz-ripasso.md e la-domanda.md. */

import { state, answer, persist } from '../store/profile.js'
import { bisognoDa } from './nucleo/bisogno.js'
import { alleggeritaDa, daAlleggerire, ancoraDifficile, bisognoAlleggerito, segnoDa }
  from './alleggerire.js'

const segni = campo => state.profile?.settings?.[campo] || {}

export const alleggerita = (chiave, now = Date.now()) =>
  !!chiave && alleggeritaDa(segni('alleggerite')[chiave], now)

// si legge state.profile.items a mano: item() crea l'elemento se non c'è, e qui si guarda per ogni pesca
export function bisognoDi(chiave, now = Date.now()) {
  if (!chiave) return 1
  return bisognoAlleggerito(bisognoDa(state.profile?.items?.[chiave], now),
                            alleggerita(chiave, now))
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

// chiamata a ogni risposta annotata: al muro scrive il segno della settimana, e nient'altro
export function alleggerisciSeServe(chiave, now = Date.now()) {
  const s = state.profile?.settings
  if (!chiave || !s) return false
  const it = state.profile.items?.[chiave]
  if (!daAlleggerire(it, segni('alleggerite')[chiave], now)) return false
  s.alleggerite = { ...(s.alleggerite || {}), [chiave]: segnoDa(it, now) }
  persist()
  return true
}

// «Va bene così» dalla settimana dei grandi: il conto di adesso diventa la base
export function vaBeneCosi(chiave, now = Date.now()) {
  const s = state.profile?.settings
  if (!chiave || !s) return
  s.vaBene = { ...(s.vaBene || {}), [chiave]: segnoDa(state.profile.items?.[chiave], now) }
  persist()
}

export const eDifficile = chiave =>
  ancoraDifficile(state.profile?.items?.[chiave], segni('vaBene')[chiave])
