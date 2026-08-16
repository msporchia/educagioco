<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UNA VIGNETTA DISEGNATA

   Il gemello di `RitrattoMostro.vue` del castello: un canvas piccolo,
   fermo, che chiama lo stesso pittore che disegnerebbe la scena grande.
   Qui dentro non c'è nessuna regola — riceve il nome di una scena e la
   dipinge.

   Si ridisegna quando cambia la scena e quando cambia la taglia del
   riquadro (il telefono che gira, la striscia che passa da tre a quattro
   buche): un canvas dipinto a una taglia e stirato a un'altra si vede
   subito, ed è il difetto che ci si porta dietro se ci si dimentica
   l'osservatore.
   ═══════════════════════════════════════════════════════════════════ */
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
