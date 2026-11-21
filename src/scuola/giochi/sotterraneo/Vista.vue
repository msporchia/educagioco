<script setup>
// Il sotterraneo vero, con le domande dell'esercizio, su un profilo in memoria; se non parte o il 3D si perde, chi la monta torna alle schede. docs/sotterraneo/scuola.md
import { ref, shallowRef, onMounted, onErrorCaptured } from 'vue'
import Sotterraneo from '../../../giochi/sotterraneo/Entrata.vue'
import { bambinoInMemoria } from '../../bambini/profilo.js'
import { pescatore, difficoltaDi } from '../../comune/esercizi.js'
import { raccontaSotterraneo } from './risposta.js'

const props = defineProps({
  esercizio: { type: Object, required: true },
  alunno: { type: Object, required: true },     // { id, nome }
})
const emit = defineEmits(['risposta', 'guasto'])
const chi = shallowRef('')           // il profilo pronto: prima il gioco non si monta
const radice = ref(null)

let guasto = false
function nonParte() { if (!guasto) { guasto = true; emit('guasto') } }

let limite = null
try { limite = { domande: pescatore(props.esercizio), difficolta: difficoltaDi(props.esercizio) } } catch { /* esercizio storto: nonParte al montaggio */ }

onMounted(async () => {
  if (!limite) return nonParte()
  try { chi.value = await bambinoInMemoria(props.alunno.id, props.alunno.nome) } catch { return nonParte() }
  // senza WebGL 2 l'entrata lo dice e offre «torno ai giochi»: a scuola si torna alle schede
  setTimeout(() => { if (radice.value?.querySelector('[data-senza-3d]')) nonParte() }, 0)
})
onErrorCaptured(() => { nonParte(); return false })

const riferisci = e => emit('risposta', raccontaSotterraneo(e))
</script>

<template>
  <div ref="radice" class="sotterraneo" data-gioco="sotterraneo">
    <div class="colonna">
      <!-- il gioco esce verso casa solo se qualcosa è andato storto (il 3D perso): si torna alle schede -->
      <Sotterraneo v-if="chi" :key="chi" :limite="limite" @risposta="riferisci" @vai="nonParte" />
    </div>
  </div>
</template>

<style scoped>
/* il gioco è un `.schermo` assoluto: sta nella colonna, centrata su uno schermo largo */
.sotterraneo { position: relative; flex: 1; min-height: 0; display: flex; justify-content: center; background: #1a1410 }
.colonna { position: relative; flex: 1; max-width: 720px; overflow: hidden }
/* su un PC il sotterraneo si allarga (scelta dell'utente): si vede più cripta. Il costo lo regge il pixel ratio, che scende
   da solo se i fotogrammi pesano (scena3d/contesto.js); docs/sotterraneo/scuola.md */
@media (min-width: 900px) and (min-aspect-ratio: 5 / 4) { .colonna { max-width: 1280px } }
</style>
