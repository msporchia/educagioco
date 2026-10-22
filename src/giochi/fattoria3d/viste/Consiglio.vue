<script setup>
// «E adesso?»: il foglio che dice la cosa più utile da fare e porta lì col suo tasto. ✕ in alto a destra. Il conto sta in motore/consiglio.js.
import ConsiglioRiga from './ConsiglioRiga.vue'
defineProps({ consiglio: { type: Object, required: true } })      // { testo, azione, etichetta }
defineEmits(['fai', 'chiudi'])
</script>

<template>
  <div class="f3-foglio f3-colonna f3-consiglio" data-f3="consiglio">
    <h2>🧭 E adesso?</h2>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo">
      <ConsiglioRiga :consiglio="consiglio" @fai="a => $emit('fai', a)" />
    </div>
  </div>
</template>
