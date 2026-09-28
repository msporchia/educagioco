<script setup>
// Una vignetta disegnata: un canvas piccolo e fermo che chiama lo stesso
// pittore della scena grande. Si ridisegna quando cambia la scena o la
// taglia del riquadro, o un canvas dipinto a una taglia e stirato a
// un'altra si vede subito.
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { dipingiScena } from '../scena/tela.js'
import { SCENE } from '../dati/scene.js'

const props = defineProps({
  scena: { type: String, required: true },
})

const tela = ref(null)
let occhio = null

function dipingi() {
  const canvas = tela.value
  if (!canvas || !canvas.clientWidth) return
  dipingiScena(canvas, SCENE[props.scena])
}

onMounted(() => {
  dipingi()
  if (typeof ResizeObserver !== 'undefined') {
    occhio = new ResizeObserver(dipingi)
    occhio.observe(tela.value)
  }
})
onUnmounted(() => occhio && occhio.disconnect())
watch(() => props.scena, dipingi)
</script>

<template><canvas ref="tela" class="pd-vignetta-tela"></canvas></template>
