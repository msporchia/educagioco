// L'orologio di una domanda: quanto è stata davanti agli occhi, la finestra
// cieca appena compare, e l'attesa dopo la risposta che si vede e si ferma
// a schermo spento. Le stesse regole di quiz/Domanda.vue
// (docs/apprendimento/la-domanda.md, docs/core/interfaccia.md), per un
// gioco che non passa da lì perché le sue domande hanno le tessere.
import { ref, onMounted, onUnmounted } from 'vue'
import { tempoDaAnnotare } from '../../../quiz/nucleo/domanda.js'

export const CIECA = 320

export function usaOrologio() {
  const attesa = ref(0)      // quanto manca (0 = non si aspetta niente)
  const giro = ref(0)        // rifà la barra da capo quando l'attesa riparte
  const pronta = ref(false)  // passata la finestra cieca
  let partenza = 0, visto = 0, cieca = 0
  let timer = null, scade = 0, poi = null

  function ferma() { clearTimeout(timer); timer = null; poi = null; attesa.value = 0 }

  // una domanda nuova: il conto riparte, e per 320 ms il dito non vale.
  // `giaVisto` (secondi): una domanda ripresa dopo una sosta riparte da lì
  function riparti(giaVisto = 0) {
    ferma()
    visto = giaVisto * 1000
    partenza = performance.now()
    pronta.value = false
    clearTimeout(cieca)
    cieca = setTimeout(() => { pronta.value = true }, CIECA)
  }

  // secondi guardati, col tetto di TEMPO_MAX
  const guardata = () => tempoDaAnnotare(visto + (partenza ? performance.now() - partenza : 0))

  function programma(ms) {
    clearTimeout(timer)
    scade = performance.now() + ms
    timer = setTimeout(() => {
      timer = null
      const fatto = poi
      poi = null
      attesa.value = 0
      if (fatto) fatto()
    }, ms)
  }

  function aspetta(ms, fn) {
    if (partenza) { visto += performance.now() - partenza; partenza = 0 }
    attesa.value = ms
    giro.value++
    poi = fn
    programma(ms)
  }

  function schermo(e) {
    if (e?.type === 'pagehide' || document.visibilityState === 'hidden') {
      if (partenza) { visto += performance.now() - partenza; partenza = 0 }
      if (timer) {
        attesa.value = Math.max(0, Math.round(scade - performance.now()))
        clearTimeout(timer)
        timer = null
      }
      return
    }
    if (poi && !timer) { giro.value++; programma(attesa.value) }
    else if (!poi && !partenza) partenza = performance.now()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', schermo)
    addEventListener('pagehide', schermo)
  })
  onUnmounted(() => {
    clearTimeout(timer); clearTimeout(cieca)
    document.removeEventListener('visibilitychange', schermo)
    removeEventListener('pagehide', schermo)
  })

  return { attesa, giro, pronta, riparti, guardata, aspetta, ferma }
}
