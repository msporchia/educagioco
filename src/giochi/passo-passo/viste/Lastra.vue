<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UNA LASTRA, IN PICCOLO — il colore che si guarda, sulle carte

   La stessa lastra che sta per terra (`scena/pixel.js`), ridotta a un
   segno: un quadratino chiaro con dentro la forma del suo colore — il
   cerchio rosso, il quadrato blu, il triangolo giallo. La forma c'è
   perché un bambino su dodici i colori non li distingue tutti, e una
   carta che dice «fino al rosso» si deve poter leggere lo stesso. La
   casa, dove la testa di una scatola dice «fino a casa», è la tana.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  colore: { type: String, required: true },     // rosso | blu | giallo | casa
})
</script>

<template>
  <span v-if="colore === 'casa'" class="pp-lastra pp-lastra-casa pp-em" aria-hidden="true">🏠</span>
  <span v-else class="pp-lastra" :class="'pp-lastra-' + colore" aria-hidden="true"><i></i></span>
</template>
