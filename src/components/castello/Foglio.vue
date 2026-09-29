<script setup>
// Il foglio che sale dal basso quando si tocca il campo. Vedi
// docs/castello/torri.md — «Si compra toccando il campo».
defineProps({
  aperto: { type: Boolean, default: false },
  /* il titolino in cima, e se si può tornare indietro invece di chiudere */
  titolo: { type: String, default: '' },
  indietro: { type: Boolean, default: false },
})
defineEmits(['chiudi', 'indietro'])
</script>

<template>
  <div class="velina" :class="{ via: !aperto }" @pointerdown.self="$emit('chiudi')"></div>
  <div class="foglio" :class="{ via: !aperto }">
    <div class="maniglia"></div>
    <div v-if="titolo || indietro" class="cima">
      <button v-if="indietro" class="tondo" aria-label="indietro" @click="$emit('indietro')">‹</button>
      <b>{{ titolo }}</b>
      <button class="tondo chiudi" aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    </div>
    <slot></slot>
  </div>
</template>

<style scoped src="./foglio.css"></style>
