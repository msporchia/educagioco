/* ═══════════════════════════════════════════════════════════════════
   QUALE GUIDA APRIRE

   Un ref solo, e serve a una cosa: il nastro in home dice «ti spiego come
   si installa», e chi lo tocca deve trovarsi **dentro quella guida**, non
   davanti all'elenco a cercarla.

   Sta in un file suo e non in `aiuto.js` perché quello è senza Vue apposta
   — lo importano anche le prove che girano in Node.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'

export const daAprire = ref(null)

/* si legge una volta sola: chi torna all'elenco e poi rientra deve
   trovare l'elenco, non essere rispedito dentro la stessa guida */
export function raccogli () {
  const q = daAprire.value
  daAprire.value = null
  return q
}
