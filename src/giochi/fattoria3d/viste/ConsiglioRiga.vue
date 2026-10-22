<script setup>
// Sotto un «non si può»: il passo per arrivarci e il tasto che porta lì (motore/consiglio.js, docs/fattoria3d/guida.md).
// Senza azione (c'è solo da aspettare) non c'è tasto. Non fa niente da solo: dice con `fai` cosa si vuole.
defineProps({ consiglio: { type: Object, default: null } })      // { testo, azione, etichetta }
defineEmits(['fai'])
</script>

<template>
  <div v-if="consiglio" class="f3-consiglio-riga" data-f3="consiglio-riga">
    <span class="f3-consiglio-testo" data-f3="consiglio-testo">👉 {{ consiglio.testo }}</span>
    <button v-if="consiglio.azione" type="button" class="f3-consiglio-fai" data-f3="consiglio-fai" :data-azione="consiglio.azione.che" @click="$emit('fai', consiglio.azione)">{{ consiglio.etichetta }}</button>
  </div>
</template>
