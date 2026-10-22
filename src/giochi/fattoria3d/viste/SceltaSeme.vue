<script setup>
// «Cosa semini?»: le colture (tutte, dai dati) con il loro tempo. Quelle che non sono ancora arrivate stanno in grigio col
// livello e toccarle lo dice qui sotto. L'ultima scelta resta in evidenza. ✕ in alto a destra.
import { ref } from 'vue'
import { COLTURE } from '../dati/colture.js'
import { livelloDellaColtura } from '../dati/livelli.js'
import { tempoBreve } from '../dati/tempo.js'
import Faccia from './Faccia.vue'

const props = defineProps({ seme: { type: String, default: 'grano' }, livello: { type: Number, default: 1 }, scorte: { type: Object, default: () => ({}) } })      // scorte: quanti raccolti hai già di ognuno
const emit = defineEmits(['scegli', 'chiudi'])
const messaggio = ref('')
const chiusa = k => livelloDellaColtura(k) > props.livello
function tocca(k) {
  if (chiusa(k)) { messaggio.value = `${COLTURE[k].nome}: arriva al livello ${livelloDellaColtura(k)}`; return }
  emit('scegli', k)
}
</script>

<template>
  <div class="f3-foglio f3-colonna" data-f3="semi">
    <h2>Cosa semini?</h2>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo">
      <div class="f3-semi">
        <!-- aria-disabled e non disabled: toccare una coltura chiusa deve dire il livello -->
        <button v-for="(c, k) in COLTURE" :key="k" :class="{ ultimo: k === seme, bloccato: chiusa(k) }" :aria-disabled="chiusa(k)" :data-seme="k" @click="tocca(k)">
          <span class="em"><Faccia :k="k" :emoji="c.emoji" :lato="44" /><em class="f3-seme-n" :class="{ zero: !(scorte[k] > 0) }" :data-n="scorte[k] || 0" data-f3="seme-scorta">{{ scorte[k] || 0 }}</em></span><b>{{ c.nome }}</b>
          <small v-if="chiusa(k)">🔒 Livello {{ livelloDellaColtura(k) }}</small><small v-else>⏱️ {{ tempoBreve(c.ms) }}<template v-if="c.raccolta"> · 🪙 {{ c.raccolta }}</template></small>
        </button>
      </div>
      <p v-if="messaggio" class="f3-messaggio" data-f3="semi-msg">{{ messaggio }}</p>
    </div>
  </div>
</template>
