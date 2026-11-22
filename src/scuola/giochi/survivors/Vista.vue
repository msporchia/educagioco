<script setup>
// Survivors vero, con le domande dell'esercizio, su un profilo in memoria; se non parte, chi la monta torna alle schede. docs/survivors/scuola.md
import { shallowRef, onMounted, onErrorCaptured } from 'vue'
import Survivors from '../../../giochi/survivors/Gioco.vue'
import { bambinoInMemoria } from '../../bambini/profilo.js'
import { pescatore, difficoltaDi } from '../../comune/esercizi.js'
import { raccontaSurvivors } from './risposta.js'

const props = defineProps({
  esercizio: { type: Object, required: true },
  alunno: { type: Object, required: true },     // { id, nome }
})
const emit = defineEmits(['risposta', 'guasto'])
const chi = shallowRef('')           // il profilo pronto: prima il gioco non si monta

let guasto = false
function nonParte(motivo = '') { if (!guasto) { guasto = true; emit('guasto', motivo) } }   // il motivo lo scrive la prova del computer

let limite = null
try { limite = { domande: pescatore(props.esercizio), difficolta: difficoltaDi(props.esercizio) } } catch { /* esercizio storto: nonParte al montaggio */ }

onMounted(async () => {
  if (!limite) return nonParte('esercizio storto')
  try { chi.value = await bambinoInMemoria(props.alunno.id, props.alunno.nome) } catch { nonParte('il profilo non si prepara') }
})
onErrorCaptured(e => { nonParte(`errore: ${(e && e.message) || e}`); return false })

// ogni carta pagata è una domanda chiusa: giusta o no, la carta non torna (docs/scuola/giochi.md)
const riferisci = e => emit('risposta', raccontaSurvivors(e))
</script>

<template>
  <div class="survivors" data-gioco="survivors">
    <div class="colonna">
      <Survivors v-if="chi" :key="chi" :limite="limite" @risposta="riferisci" />
    </div>
  </div>
</template>

<style scoped>
/* il gioco è un `.schermo` assoluto: sta nella colonna, centrata su uno schermo largo */
.survivors { position: relative; flex: 1; min-height: 0; display: flex; justify-content: center; background: #1b2a1b }
.colonna { position: relative; flex: 1; max-width: 600px; overflow: hidden }
</style>
