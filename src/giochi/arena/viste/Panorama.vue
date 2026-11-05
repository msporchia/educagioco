<script setup>
// Una striscia del posto, sulla mappa: lo stesso terreno del campo (scena/terreno.js), a grana più grossa perché costi poco.
// Si dipinge dopo il primo fotogramma: la mappa non deve aspettare.
import { ref, onMounted } from 'vue'
import { dipingi } from '../scena/terreno.js'

const props = defineProps({
  terreno: { type: String, required: true },
  ritardo: { type: Number, default: 0 },
  // il pezzo di mondo: il fiume e le sue rive, dove il posto si riconosce
  pezzo: { type: Object, default: () => ({ x: 20, y: 176, w: 320, h: 92 }) },
  grana: { type: Number, default: 1 },
})
const tela = ref(null)
onMounted(() => setTimeout(() => {
  const cv = tela.value
  if (!cv) return
  const fatto = dipingi(props.terreno, props.pezzo, props.grana)
  cv.width = fatto.width; cv.height = fatto.height
  cv.getContext('2d').drawImage(fatto, 0, 0)
}, 30 + props.ritardo * 60))
</script>

<template>
  <canvas ref="tela" class="ar-panorama" aria-hidden="true"></canvas>
</template>
