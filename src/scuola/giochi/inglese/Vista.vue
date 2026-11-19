<script setup>
// English vero, limitato alle tappe dell'esercizio e senza audio, su un profilo in memoria; se non parte, la maestra lo vede. docs/lingue/scuola.md
import { shallowRef, onMounted, onErrorCaptured } from 'vue'
import IngleseAMondi from '../../../giochi/inglese/Gioco.vue'
import { bambinoInMemoria } from '../../bambini/profilo.js'
import scheda from './scheda.js'

const props = defineProps({
  esercizio: { type: Object, required: true },
  alunno: { type: Object, required: true },     // { id, nome }
})
const emit = defineEmits(['risposta', 'guasto'])
const { gioco, ...esercizio } = props.esercizio
const limite = scheda.tipo.valido(esercizio) ? { isola: esercizio.isola, tappe: esercizio.tappe } : null
const chi = shallowRef('')           // il profilo pronto: prima il gioco non si monta

let guasto = false
function nonParte() { if (!guasto) { guasto = true; emit('guasto') } }

onMounted(async () => {
  if (!limite) return nonParte()
  try { chi.value = await bambinoInMemoria(props.alunno.id, props.alunno.nome) } catch { nonParte() }
})
onErrorCaptured(() => { nonParte(); return false })

// la risposta arriva già raccontata dal gioco (docs/scuola/giochi.md)
const riferisci = r => emit('risposta', r)
</script>

<template>
  <div class="inglese" data-gioco="inglese">
    <div class="colonna">
      <IngleseAMondi v-if="chi" :key="chi" :limite="limite" @risposta="riferisci" />
    </div>
  </div>
</template>

<style scoped>
/* il gioco è un `.schermo` assoluto: sta nella colonna, centrata su uno schermo largo */
.inglese { position: relative; flex: 1; min-height: 0; display: flex; justify-content: center; background: #e8d6ab }
.colonna { position: relative; flex: 1; max-width: 720px; overflow: hidden }
</style>
