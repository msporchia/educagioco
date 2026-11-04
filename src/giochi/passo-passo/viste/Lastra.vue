<script setup>
/* Una lastra in piccolo, sulle carte: vedi docs/passo-passo/regole.md. La
   casa, dove una scatola dice «fino a casa», è la tana; un verso è il ❓ del
   guerriero, «se di là si passa». */
import Icona from './Icona.vue'
import { VERSI } from '../dati/mondo.js'

defineProps({
  colore: { type: String, required: true },     // rosso | blu | giallo | casa | su | giu | sinistra | destra
})
</script>

<template>
  <span v-if="colore === 'casa'" class="pp-lastra pp-lastra-casa pp-em" aria-hidden="true">🏠</span>
  <span v-else-if="VERSI[colore]" class="pp-lastra pp-lastra-verso" aria-hidden="true"><Icona :mossa="colore" /></span>
  <span v-else class="pp-lastra" :class="'pp-lastra-' + colore" aria-hidden="true"><i></i></span>
</template>
