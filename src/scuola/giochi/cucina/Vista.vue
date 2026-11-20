<script setup>
// La cucina vera, limitata ai livelli dell'esercizio, su un profilo in memoria; se non parte o il 3D si perde, «chiama la maestra». docs/bancarella/scuola.md
import { ref, shallowRef, onMounted, onBeforeUnmount, onErrorCaptured } from 'vue'
import BancarellaGame from '../../../views/BancarellaGame.vue'
import { bambinoInMemoria } from '../../bambini/profilo.js'
import scheda from './scheda.js'

const props = defineProps({
  esercizio: { type: Object, required: true },
  alunno: { type: Object, required: true },     // { id, nome }
})
const emit = defineEmits(['risposta', 'guasto'])
const { gioco, difficolta, ...esercizio } = props.esercizio
const limite = scheda.tipo.valido(esercizio) ? { da: esercizio.da, a: esercizio.a, difficolta } : null
const chi = shallowRef('')           // il profilo pronto: prima il gioco non si monta
const radice = ref(null)

let guasto = false, guarda = null
function nonParte() { if (!guasto) { guasto = true; emit('guasto') } }

onMounted(async () => {
  if (!limite) return nonParte()
  // la cucina che non si disegna (o perde il 3D per strada) offre «riprova» (components/bancarella/Cucina.vue): a scuola si chiama la maestra
  guarda = new MutationObserver(() => { if (radice.value?.querySelector('[data-senza3d]')) nonParte() })
  guarda.observe(radice.value, { childList: true, subtree: true })
  try { chi.value = await bambinoInMemoria(props.alunno.id, props.alunno.nome) } catch { nonParte() }
})
onBeforeUnmount(() => guarda?.disconnect())
onErrorCaptured(() => { nonParte(); return false })

// la risposta arriva già raccontata dal gioco (motore/bancarella/limite.js), solo dove il resto lo conta il bambino
const riferisci = r => emit('risposta', r)
</script>

<template>
  <div ref="radice" class="cucina" data-gioco="cucina">
    <div class="colonna">
      <BancarellaGame v-if="chi" :key="chi" :limite="limite" @risposta="riferisci" />
    </div>
  </div>
</template>

<style scoped>
/* il gioco è un `.schermo` assoluto: sta nella colonna, centrata su uno schermo largo */
.cucina { position: relative; flex: 1; min-height: 0; display: flex; justify-content: center; background: #3f3128 }
.colonna { position: relative; flex: 1; max-width: 600px; overflow: hidden }
</style>
