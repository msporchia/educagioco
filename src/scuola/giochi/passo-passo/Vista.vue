<script setup>
// Passo passo vero, limitato ai gradini dell'esercizio, su un profilo in memoria; se non parte, la maestra lo vede. docs/passo-passo/scuola.md
import { shallowRef, onMounted, onErrorCaptured } from 'vue'
import PassoPasso from '../../../giochi/passo-passo/Gioco.vue'
import { bambinoInMemoria } from '../../bambini/profilo.js'
import scheda from './scheda.js'

const props = defineProps({
  esercizio: { type: Object, required: true },
  alunno: { type: Object, required: true },     // { id, nome }
})
const emit = defineEmits(['risposta', 'guasto'])
const { gioco, ...esercizio } = props.esercizio
const limite = scheda.tipo.valido(esercizio) ? { gradini: esercizio.gradini, protagonista: esercizio.protagonista } : null
const chi = shallowRef('')           // il profilo pronto: prima il gioco non si monta

let guasto = false
function nonParte(motivo = '') { if (!guasto) { guasto = true; emit('guasto', motivo) } }   // il motivo lo scrive la prova del computer

onMounted(async () => {
  if (!limite) return nonParte('esercizio storto')
  try { chi.value = await bambinoInMemoria(props.alunno.id, props.alunno.nome) } catch { nonParte('il profilo non si prepara') }
})
onErrorCaptured(e => { nonParte(`errore: ${(e && e.message) || e}`); return false })

// la risposta arriva già raccontata dal gioco (docs/scuola/giochi.md)
const riferisci = r => emit('risposta', r)
</script>

<template>
  <div class="passo-passo" data-gioco="passo-passo">
    <div class="colonna">
      <PassoPasso v-if="chi" :key="chi" :limite="limite" @risposta="riferisci" />
    </div>
  </div>
</template>

<style scoped>
/* il gioco è un `.schermo` assoluto: sta nella colonna, centrata su uno schermo largo */
.passo-passo { position: relative; flex: 1; min-height: 0; display: flex; justify-content: center; background: #eef4e4 }
.colonna { position: relative; flex: 1; max-width: 720px; overflow: hidden }
/* sullo schermo largo il gioco si stende (giochi/passo-passo/stile.css): la mappa a destra ha bisogno della larghezza */
@media (min-width: 900px) and (min-aspect-ratio: 5 / 4) { .colonna { max-width: 1280px } }
</style>
