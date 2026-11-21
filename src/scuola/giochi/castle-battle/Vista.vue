<script setup>
// Castle Battle vero, limitato alla tappa dell'esercizio e al livello del nemico, su un profilo in memoria; se non parte, «chiama
// la maestra». docs/arena/scuola.md
import { shallowRef, onMounted, onErrorCaptured } from 'vue'
import CastleBattle from '../../../giochi/arena/Gioco.vue'
import { bambinoInMemoria } from '../../bambini/profilo.js'
import scheda from './scheda.js'

const props = defineProps({
  esercizio: { type: Object, required: true },
  alunno: { type: Object, required: true },     // { id, nome }
})
const emit = defineEmits(['risposta', 'guasto'])
const { gioco, difficolta, ...esercizio } = props.esercizio
const limite = scheda.tipo.valido(esercizio) ? { tappa: esercizio.tappa, difficolta } : null
const chi = shallowRef('')           // il profilo pronto: prima il gioco non si monta

// la tela scrive i numeri col font delle emoji: si aspetta che sia decodificato, ma non a lungo (come src/main.js)
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

// il gioco la manda già raccontata (giochi/arena/motore/limite.js): ogni calcolo è una domanda chiusa
const riferisci = r => emit('risposta', r)
</script>

<template>
  <div class="castle-battle" data-gioco="castle-battle">
    <div class="colonna">
      <CastleBattle v-if="chi" :key="chi" :limite="limite" @risposta="riferisci" />
    </div>
  </div>
</template>

<style scoped>
/* il gioco è un `.schermo` assoluto: sta nella colonna, centrata su uno schermo largo (la corsia è verticale) */
.castle-battle { position: relative; flex: 1; min-height: 0; display: flex; justify-content: center; background: #1d1a17 }
.colonna { position: relative; flex: 1; max-width: 600px; overflow: hidden }
</style>
