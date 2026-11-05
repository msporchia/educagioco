<script setup>
/* Un disegno a pixel di `figure.js`. Il pixel è largo quanto dice `--pp-pix`:
   tre sui tasti, due sulle carte. */
import { computed } from 'vue'
import { rettangoli } from '../scena/pixel.js'
import { FIGURE } from './figure.js'

const props = defineProps({
  nome: { type: String, required: true },
})
const disegno = computed(() => rettangoli(FIGURE[props.nome]))
</script>

<template>
  <svg class="pp-pix" :viewBox="`0 0 ${disegno.w} ${disegno.h}`" :style="{ '--w': disegno.w, '--h': disegno.h }"
       shape-rendering="crispEdges" aria-hidden="true">
    <rect v-for="(r, i) in disegno.rect" :key="i" :x="r.x" :y="r.y" :width="r.w" height="1" :style="{ fill: r.c }" />
  </svg>
</template>
