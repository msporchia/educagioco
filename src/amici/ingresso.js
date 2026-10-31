// «Accetto»: l'invito diventa un ingresso in un gioco. App.vue apre il gioco, il gioco ritira i dati quando si monta.
import { ref } from 'vue'

export const ingresso = ref(null)       // { gioco, dati } | null; `dati` è l'invito accettato, o `{ amico }` dalla lista degli amici

export const chiediIngresso = (gioco, dati) => { ingresso.value = { gioco, dati } }

/* il gioco ritira il suo ingresso (una volta sola) */
export function prendiIngresso(gioco) {
  const i = ingresso.value
  if (!i || i.gioco !== gioco) return null
  ingresso.value = null
  return i.dati
}
