// Quale guida aprire dal nastro: in un file suo perché aiuto.js è senza Vue apposta.
import { ref } from 'vue'

export const daAprire = ref(null)

// si legge una volta sola: chi rientra deve trovare l'elenco, non la stessa guida
export function raccogli () {
  const q = daAprire.value
  daAprire.value = null
  return q
}
