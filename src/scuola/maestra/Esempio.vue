<script setup>
// Una domanda vera dell'esercizio, nella scheda che vedono i bambini (quiz/Domanda.vue, la stessa di bambini/viste/Domande.vue),
// pescata come la pescherà il gioco: con le figure, e si può rispondere per vedere cosa succede. «Un'altra» ne pesca una nuova.
// Provato un riassunto a parole: le risposte disegnate diventavano «(una figura)». docs/scuola/quaderno.md
import { shallowRef, watch } from 'vue'
import Domanda from '../../quiz/Domanda.vue'
import { valido, pescatore } from '../comune/esercizi.js'

const props = defineProps({ esercizio: { type: Object, required: true }, gioco: { type: String, default: 'schede' } })
let pesca = null
const ora = shallowRef(null)

function prossima() {
  try { ora.value = pesca ? pesca.prossima() : null } catch { ora.value = null }
}
// l'esercizio cambia (un gradino, una tabellina): un pescatore nuovo e la sua prima domanda
watch(() => JSON.stringify(props.esercizio), () => {
  try { pesca = valido(props.esercizio) ? pescatore(props.esercizio) : null } catch { pesca = null }
  prossima()
}, { immediate: true })
</script>

<template>
  <aside v-if="ora" class="esempio" data-esempio>
    <div class="testa">
      <span class="titoletto">{{ props.gioco === 'schede' ? 'Così la vede il bambino' : 'Una domanda così (nel gioco cambia l\'aspetto)' }}</span>
      <button class="bottone chiaro piccolo" data-azione="altro-esempio" @click="prossima">Un'altra</button>
    </div>
    <div class="schermo-finto">
      <Domanda :domanda="ora.domanda" :pittori="ora.pittori" :titolo="ora.titolo" @risposto="prossima" />
    </div>
  </aside>
</template>

<style scoped>
.esempio { display:flex; flex-direction:column; gap:8px }
.testa { display:flex; align-items:center; justify-content:space-between; gap:8px }
.titoletto { font-size:13px; font-weight:600; color:var(--grigio) }
/* la domanda è un velo `absolute` sopra chi la contiene: qui un riquadro della sua misura, con l'altezza che le serve */
.schermo-finto { position:relative; height:380px; border-radius:var(--raggio-piccolo); overflow:hidden; background:#eef1f6;
                 --qz-h:4.4px; text-align:left }
.schermo-finto :deep(.qz-velo) { --qz-h:4.4px; background:none; backdrop-filter:none; animation:none }
</style>
