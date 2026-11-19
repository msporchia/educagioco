<script setup>
// Le pozioni vere, limitate alle misure e ai gradini dell'esercizio, su un profilo in memoria; se il 3D non parte o si perde, la maestra lo vede. docs/pozioni/scuola.md
import { ref, shallowRef, onMounted, onBeforeUnmount, onErrorCaptured } from 'vue'
import Pozioni from '../../../giochi/pozioni/Gioco.vue'
import { bambinoInMemoria } from '../../bambini/profilo.js'
import scheda from './scheda.js'

const props = defineProps({
  esercizio: { type: Object, required: true },
  alunno: { type: Object, required: true },     // { id, nome }
})
const emit = defineEmits(['risposta', 'guasto'])
const { gioco, ...esercizio } = props.esercizio
const limite = scheda.tipo.valido(esercizio) ? { famiglie: esercizio.famiglie, gradini: esercizio.gradini } : null
const chi = shallowRef('')           // il profilo pronto (muto, fascia bassa): prima il gioco non si monta
const radice = ref(null)

let guasto = false
function nonParte() { if (!guasto) { guasto = true; emit('guasto') } }

// il banco che non si disegna, subito o perso dopo, mostra «riprova» (docs/pozioni/regole.md): a scuola si chiama la maestra
let guardia = null
function guarda() {
  if (radice.value?.querySelector('[data-senza-3d]')) nonParte()
}

onMounted(async () => {
  if (!limite) return nonParte()
  try { chi.value = await bambinoInMemoria(props.alunno.id, props.alunno.nome) } catch { return nonParte() }
  guardia = new MutationObserver(guarda)
  guardia.observe(radice.value, { childList: true, subtree: true })
})
onBeforeUnmount(() => guardia?.disconnect())
onErrorCaptured(() => { nonParte(); return false })

// la risposta arriva già raccontata dal gioco (docs/scuola/giochi.md)
const riferisci = r => emit('risposta', r)
</script>

<template>
  <div ref="radice" class="pozioni" data-gioco="pozioni">
    <div class="colonna">
      <Pozioni v-if="chi" :key="chi" :limite="limite" @risposta="riferisci" />
    </div>
  </div>
</template>

<style scoped>
/* il gioco è un `.schermo` assoluto: sta nella colonna, centrata su uno schermo largo */
.pozioni { position: relative; flex: 1; min-height: 0; display: flex; justify-content: center; background: #150f22 }
.colonna { position: relative; flex: 1; max-width: 720px; overflow: hidden }
</style>
