<script setup>
// «Cosa semini?»: le cinque colture con il loro tempo. L'ultima scelta resta in evidenza. ✕ in alto a destra.
import { COLTURE } from '../dati/colture.js'
defineProps({ seme: { type: String, default: 'grano' } })
defineEmits(['scegli', 'chiudi'])
</script>

<template>
  <div class="f3-foglio" data-f3="semi">
    <h2>Cosa semini?</h2>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-semi">
      <button v-for="(c, k) in COLTURE" :key="k" :class="{ ultimo: k === seme }" :data-seme="k" @click="$emit('scegli', k)">
        <span class="em">{{ c.emoji }}</span><b>{{ c.nome }}</b><small>⏱️ {{ c.ms / 1000 }}s</small>
      </button>
    </div>
  </div>
</template>
