<script setup>
// Il portale fuori dal piano (il gemello sulla terra di sopra): lo stesso disegno di scena/portale.js su una
// tela piccola, ingrandita a pixel pieni alla scala dell'eroe. Il bagliore qui lo fa il CSS (.sot-portale-luce).
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { dipingiPortale, PORTALE } from '../scena/portale.js'

const props = defineProps({
  scala: { type: Number, default: 3 },
})

const MARGINE = 3   // le scintille girano fuori dall'ovale
const L = 2 * PORTALE.rx + 1 + 2 * MARGINE
const A = 2 * PORTALE.ry + 1 + 2 * MARGINE + 2   // e sotto c'è l'ombra
const tela = ref(null)
let raf = 0

function disegna(ora) {
  raf = requestAnimationFrame(disegna)
  const ctx = tela.value && tela.value.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, L, A)
  dipingiPortale(ctx, MARGINE + PORTALE.rx, MARGINE + PORTALE.ry, ora / 1000, { bagliore: false })
}
onMounted(() => { raf = requestAnimationFrame(disegna) })
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <span class="sot-portale-luce" :style="{ width: L * scala + 'px', height: A * scala + 'px' }">
    <canvas ref="tela" :width="L" :height="A" :style="{ width: L * scala + 'px', height: A * scala + 'px' }"></canvas>
  </span>
</template>
