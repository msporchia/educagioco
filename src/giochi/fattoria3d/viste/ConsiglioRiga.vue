<script setup>
// Sotto un «non si può»: il passo per arrivarci e il tasto che porta lì (motore/consiglio.js, docs/fattoria3d/guida.md).
// Senza azione (c'è solo da aspettare) non c'è tasto. Non fa niente da solo: dice con `fai` cosa si vuole.
// Con `albero` (la merce che manca) c'è anche «🌳 Come si fa»: manda `fai` con `{ che: 'albero', k }` e Gioco.vue apre l'albero (viste/Albero.vue).
defineProps({ consiglio: { type: Object, default: null } })      // { testo, azione, etichetta, albero? }
defineEmits(['fai'])
</script>

<template>
  <div v-if="consiglio" class="f3-consiglio-riga" data-f3="consiglio-riga">
    <span class="f3-consiglio-testo" data-f3="consiglio-testo">👉 {{ consiglio.testo }}</span>
    <button v-if="consiglio.azione" type="button" class="f3-consiglio-fai" data-f3="consiglio-fai" :data-azione="consiglio.azione.che" @click="$emit('fai', consiglio.azione)">{{ consiglio.etichetta }}</button>
    <button v-if="consiglio.albero" type="button" class="f3-consiglio-fai f3-consiglio-albero" data-f3="consiglio-albero" :data-albero-di="consiglio.albero" @click="$emit('fai', { che: 'albero', k: consiglio.albero })">🌳 Come si fa</button>
  </div>
</template>
