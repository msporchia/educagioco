<script setup>
/* Il segno di una scatola, disegnato: il cerchio del ripeti o il punto di
   domanda del se. Le emoji, sul legno e sul verde, non si leggevano. */
defineProps({
  tipo: { type: String, required: true },     // ripeti | se
})
</script>

<template>
  <svg class="pp-segno" viewBox="-20 -20 40 40" aria-hidden="true">
    <template v-if="tipo === 'se'">
      <path class="pp-segno-tratto" d="M-8 -8 C-8 -18 9 -18 9 -8 C9 -1 0 -2 0 6" />
      <circle class="pp-segno-pieno" cx="0" cy="15" r="3.6" />
    </template>
    <template v-else>
      <path class="pp-segno-tratto" d="M-14 3 A14 14 0 0 1 9 -10" />
      <path class="pp-segno-tratto" d="M14 -3 A14 14 0 0 1 -9 10" />
      <path class="pp-segno-pieno" d="M12 -18 L14 -4 L1 -7 Z" />
      <path class="pp-segno-pieno" d="M-12 18 L-14 4 L-1 7 Z" />
    </template>
  </svg>
</template>
