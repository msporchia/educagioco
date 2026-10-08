<script setup>
// La figura di un mostro grosso (scena/grossi.js) fuori dal campo: nello scontro e nella sua barra in cima, a pixel netti
import { computed } from 'vue'
import Pixel from './Pixel.vue'
import { pixel } from './pixel.js'
import { righeDelGrosso, TAVOLOZZE } from '../scena/grossi.js'

const props = defineProps({
  disegno: { type: String, required: true },
  colori: { type: String, required: true },
  scala: { type: Number, default: 2 },
})
const figura = computed(() => pixel(righeDelGrosso(props.disegno, props.colori), TAVOLOZZE[props.colori] || TAVOLOZZE.verde))
</script>

<template>
  <Pixel :figura="figura" :scala="scala" data-figura-grosso />
</template>
