<script setup>
// Il Robot vero, limitato ai capitoli dell'esercizio, su un profilo in memoria; se non parte, «chiama la maestra». docs/costruttore/scuola.md
import { shallowRef, onMounted, onErrorCaptured } from 'vue'
import Robot from '../../../giochi/costruttore/Gioco.vue'
import { bambinoInMemoria } from '../../bambini/profilo.js'
import scheda from './scheda.js'

const props = defineProps({
  esercizio: { type: Object, required: true },
  alunno: { type: Object, required: true },     // { id, nome }
})
const emit = defineEmits(['risposta', 'guasto'])
const chi = shallowRef('')           // il profilo pronto: prima il gioco non si monta
const limite = scheda.tipo.valido(props.esercizio) ? { capitoli: [...props.esercizio.capitoli] } : null

// la tela scrive i numeri e il «!» col font delle emoji: si aspetta che sia decodificato, ma non a lungo (come src/main.js)
const emojiPronte = () => {
  try {
    return Promise.race([document.fonts.load('16px "Emoji Gioco"', '🐰'), new Promise(r => setTimeout(r, 1500))]).catch(() => {})
  } catch { return Promise.resolve() }
}

let guasto = false
function nonParte() { if (!guasto) { guasto = true; emit('guasto') } }

onMounted(async () => {
  if (!limite) return nonParte()
  try {
    const [, id] = await Promise.all([emojiPronte(), bambinoInMemoria(props.alunno.id, props.alunno.nome)])
    chi.value = id
  } catch { nonParte() }
})
onErrorCaptured(() => { nonParte(); return false })

// il gioco la manda già raccontata (motore/limite.js): un livello vinto chiude la domanda, un ▶ che non arriva no
const riferisci = r => emit('risposta', r)
</script>

<template>
  <div class="robot" data-gioco="robot">
    <div class="colonna">
      <Robot v-if="chi" :key="chi" :limite="limite" @risposta="riferisci" />
    </div>
  </div>
</template>

<style scoped>
/* il gioco è un `.schermo` assoluto: sta nella colonna, centrata su uno schermo largo (l'editor vuole un po' più spazio) */
.robot { position: relative; flex: 1; min-height: 0; display: flex; justify-content: center; background: #e9e1d3 }
.colonna { position: relative; flex: 1; max-width: 720px; overflow: hidden }
@media (min-width: 900px) and (min-aspect-ratio: 5 / 4) { .colonna { max-width: 1280px } }
</style>
