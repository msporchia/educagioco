<script setup>
// La spiegazione: quando si sbaglia, un foglio mostra la storia intera
// (un passo per riga, in colonna così i disegni si vedono grandi), le
// didascalie sotto ogni disegno (dati/didascalie.js, per chi legge ad
// alta voce), e dov'era lo sbaglio. Resta finché non si dice «ho
// capito», o si chiude da sé dopo DURATA (la barra mostra quanto manca).
import { ref, onMounted, onUnmounted } from 'vue'
import Passo from './Passo.vue'
import { didascalia, ordinale } from '../dati/didascalie.js'

const props = defineProps({
  // già masticata da motore/quesito.js: qui non si sa cosa sia un quesito
  spiega: { type: Object, required: true },
})
const emit = defineEmits(['avanti'])

const CIECA = 320          // quanto resta insensibile al tocco appena comparsa
const DURATA = 7000        // e quanto resta a schermo se non la chiude nessuno

const cieca = ref(true)
let apertura = 0
let scadenza = 0

onMounted(() => {
  apertura = setTimeout(() => { cieca.value = false }, CIECA)
  scadenza = setTimeout(() => emit('avanti'), DURATA)
})
onUnmounted(() => { clearTimeout(apertura); clearTimeout(scadenza) })

function avanti() {
  if (cieca.value) return
  emit('avanti')
}
</script>

<template>
  <div class="pd-velo" data-spiega="1">
    <div class="pd-cartello pd-spiega">
      <h2>La storia era questa</h2>
      <p class="pd-nome">{{ spiega.titolo }}</p>

      <ol class="pd-passi">
        <li v-for="(p, i) in spiega.passi" :key="i"
            :class="{ 'pd-chiave': i === spiega.buco,
                      'pd-storto': spiega.esatti && !spiega.esatti[i] }">
          <span class="pd-num">{{ i + 1 }}</span>
          <div class="pd-riquadro em"><Passo :passo="p" /></div>
          <span class="pd-frase">
            <b>{{ ordinale(i, spiega.passi.length) }}</b> {{ didascalia(p) }}
          </span>
        </li>
      </ol>

      <!-- l'opzione sbagliata toccata: non c'entrava con la storia, si
           mostra qui sotto invece che come riga della fila -->
      <p v-if="spiega.scelta && spiega.buco !== null" class="pd-fuori">
        <span class="em">❌</span>
        <span class="pd-mini em"><Passo :passo="spiega.scelta" /></span>
        <span>{{ didascalia(spiega.scelta) }} non c'entra</span>
      </p>
      <p v-else-if="spiega.intruso" class="pd-fuori">
        <span class="em">❌</span>
        <span class="pd-mini em"><Passo :passo="spiega.intruso" /></span>
        <span>{{ didascalia(spiega.intruso) }} era di un'altra storia</span>
      </p>

      <button class="pd-grosso" :disabled="cieca" @click="avanti">
        <span class="em">👍</span> ho capito
      </button>
      <div class="pd-attesa"><i :style="{ animationDuration: DURATA + 'ms' }"></i></div>
    </div>
  </div>
</template>
