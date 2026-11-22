<script setup>
// Le pozioni vere, limitate alle misure e ai gradini dell'esercizio, su un profilo in memoria; se il 3D non parte o si perde, la maestra lo vede. docs/pozioni/scuola.md
import { ref, shallowRef, onMounted, onBeforeUnmount, onErrorCaptured } from 'vue'
import Pozioni from '../../../giochi/pozioni/Gioco.vue'
import { bambinoInMemoria } from '../../bambini/profilo.js'
import scheda from './scheda.js'
import { difficoltaDi } from '../../comune/esercizi.js'

const props = defineProps({
  esercizio: { type: Object, required: true },
  alunno: { type: Object, required: true },     // { id, nome }
})
const emit = defineEmits(['risposta', 'guasto'])
const { gioco, ...esercizio } = props.esercizio
const { difficolta: _, ...resto } = esercizio     // la chiave comune non è del gioco: `valido` la rifiuterebbe
const limite = scheda.tipo.valido(resto) ? { famiglie: resto.famiglie, gradini: resto.gradini, difficolta: difficoltaDi(esercizio) } : null
const chi = shallowRef('')           // il profilo pronto (muto, fascia bassa): prima il gioco non si monta
const radice = ref(null)

let guasto = false
function nonParte(motivo = '') { if (!guasto) { guasto = true; emit('guasto', motivo) } }   // il motivo lo scrive la prova del computer

// il banco che non si disegna, subito o perso dopo, mostra «riprova» (docs/pozioni/regole.md): a scuola si chiama la maestra
let guardia = null
function guarda() {
  if (radice.value?.querySelector('[data-senza-3d]')) nonParte('senza 3D')
}

onMounted(async () => {
  if (!limite) return nonParte('esercizio storto')
  try { chi.value = await bambinoInMemoria(props.alunno.id, props.alunno.nome) } catch { return nonParte('il profilo non si prepara') }
  guardia = new MutationObserver(guarda)
  guardia.observe(radice.value, { childList: true, subtree: true })
})
onBeforeUnmount(() => guardia?.disconnect())
onErrorCaptured(e => { nonParte(`errore: ${(e && e.message) || e}`); return false })

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
/* su un PC il banco si stende, con la pergamena in colonna a sinistra: docs/pozioni/schermo-largo.md */
@media (min-width: 900px) and (min-aspect-ratio: 5 / 4) { .colonna { max-width: 1280px } }
</style>
