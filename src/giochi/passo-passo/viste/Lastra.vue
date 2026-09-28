<script setup>
/* Una lastra in piccolo, sulle carte: vedi docs/passo-passo/regole.md. La
   casa, dove una scatola dice «fino a casa», è la tana. */
defineProps({
  colore: { type: String, required: true },     // rosso | blu | giallo | casa
})
</script>

<template>
  <span v-if="colore === 'casa'" class="pp-lastra pp-lastra-casa pp-em" aria-hidden="true">🏠</span>
  <span v-else class="pp-lastra" :class="'pp-lastra-' + colore" aria-hidden="true"><i></i></span>
</template>
