/* ═══════════════════════════════════════════════════════════════════
   LA TASCA DEI POTERI DEGLI ASTEROIDI

   Un gettone guadagnato col filotto non scade con la partita: se
   scadesse, il momento in cui lo si spende non sarebbe più una scelta —
   sarebbe «spendilo adesso o lo perdi», che è il contrario. Quindi la
   tasca sta nel profilo e ci resta.

   DOVE. Dentro `profile.mate`, che è il campo degli asteroidi: `calc` è
   la seconda scaletta dello stesso gioco, non un secondo gioco, e la
   tasca è una sola per tutti e due (la nave è una). Non è un campo nuovo
   del profilo apposta — `profile.campagne` è la casa dei giochi di
   `src/giochi/`, e gli asteroidi stanno ancora in `src/views/`.

   La voce si crea da sé la prima volta che serve, come fanno le
   campagne dei giochi nuovi: un profilo salvato ieri non ha `poteri` e
   non deve passare da una migrazione per avere una tasca vuota.
   ═══════════════════════════════════════════════════════════════════ */
import { state, persist } from './profile.js'

const VUOTA = { gelo: 0, aiuto: 0 }

function tasca() {
  const m = state.profile.mate
  // un profilo rovinato a mano potrebbe averla di un altro tipo: in
  // tutti e due i casi si riparte da vuoto, non da rotto
  if (!m.poteri || typeof m.poteri !== 'object') m.poteri = { ...VUOTA }
  return m.poteri
}

/* quanti ne ho in tasca. Torna l'oggetto vivo — è dentro `state`, quindi
   reattivo — perché chi lo mostra deve vederlo cambiare da solo */
export const poteri = () => tasca()
export const quanti = quale => tasca()[quale] || 0

export function guadagna(quale, n = 1) {
  const t = tasca()
  t[quale] = (t[quale] || 0) + n
  persist()
  return t[quale]
}

/* spende un gettone e dice se c'era: chi chiama non deve ricontrollare,
   e soprattutto non deve poter spendere quello che non ha */
export function spendi(quale) {
  const t = tasca()
  if (!(t[quale] > 0)) return false
  t[quale]--
  persist()
  return true
}
