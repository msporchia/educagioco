<script setup>
// «Cosa semini?»: le colture (tutte, dai dati) con il loro tempo. Quelle che non sono ancora arrivate stanno in grigio col
// livello e toccarle lo dice qui sotto. L'ultima scelta resta in evidenza. ✕ in alto a destra.
import { ref } from 'vue'
import { COLTURE } from '../dati/colture.js'
import { livelloDellaColtura } from '../dati/livelli.js'

const props = defineProps({ seme: { type: String, default: 'grano' }, livello: { type: Number, default: 1 } })
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
          <span class="em">{{ c.emoji }}</span><b>{{ c.nome }}</b>
          <small v-if="chiusa(k)">🔒 Livello {{ livelloDellaColtura(k) }}</small><small v-else>⏱️ {{ c.ms / 1000 }}s</small>
        </button>
      </div>
      <p v-if="messaggio" class="f3-messaggio" data-f3="semi-msg">{{ messaggio }}</p>
    </div>
  </div>
</template>
