<script setup>
/* Una lastra in piccolo, sulle carte: vedi docs/passo-passo/regole.md. La
   casa, dove una scatola dice «fino a casa», è la tana; un verso è il ❓ del
   guerriero, «se di là si passa». */
import Figura from './Figura.vue'
import { VERSI } from '../dati/mondo.js'

defineProps({
  colore: { type: String, required: true },     // rosso | blu | giallo | casa | su | giu | sinistra | destra
})
</script>

<template>
  <Figura class="pp-lastra" :class="{ 'pp-lastra-verso': !!VERSI[colore] }" :nome="colore" />
</template>
