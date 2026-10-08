<script setup>
// Il ritratto di chi dà le missioni (il minatore e i sei della terra di sopra): lo sprite `<nome>-fermo-0` se l'atlante
// ce l'ha, se no la figura di pixel.js, la stessa che sta in piedi sulla mappa (viste/Terra.vue)
import { computed } from 'vue'
import Pixel from './Pixel.vue'
import { figura, haFigura } from './figura.js'
import { MINATORE, RAGAZZA, MUGNAIO, EREMITA, GUARDIA, PESCATORE, BOSCAIOLO } from './pixel.js'
import { PERSONAGGI } from '../dati/missioni.js'

const props = defineProps({
  chi: { type: String, required: true },   // la chiave: 'ragazza', 'mugnaio', … o 'minatore'
  scala: { type: Number, default: 3 },
})

const FIGURE = { ragazza: RAGAZZA, mugnaio: MUGNAIO, eremita: EREMITA, guardia: GUARDIA, pescatore: PESCATORE,
                 boscaiolo: BOSCAIOLO, minatore: MINATORE }
const sprite = computed(() => `${(PERSONAGGI[props.chi] || { sprite: 'minatore' }).sprite}-fermo-0`)
const vero = computed(() => (haFigura(sprite.value) ? figura(sprite.value, { scala: props.scala }) : null))
</script>

<template>
  <span v-if="vero" class="sot-ritratto" :style="vero.gabbia"><i :style="vero.pezzo"></i></span>
  <Pixel v-else :figura="FIGURE[chi] || MINATORE" :scala="props.scala" />
</template>
