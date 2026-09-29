<script setup>
// Il riquadro della creatura: tiene la tela e il suo ciclo, niente altro.
// Cambia creatura o misura → si rifà; cambia solo lo stato → si dice e basta.
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Bestia, quantoLargo } from '../scena/bestia.js'

const props = defineProps({
  chi: { type: String, required: true },       // il nome della creatura
  tipo: { type: String, default: 'mostro' },   // che stanza è: decide la stazza
  stato: { type: String, default: 'normale' }, // normale | colpito | ko
})

const tela = ref(null)
let bestia = null
let osserva = null

function rifai() {
  if (!bestia) return
  bestia.vesti(quantoLargo(props.tipo, props.chi))
  bestia.mostra(props.chi, props.stato)
}

onMounted(async () => {
  bestia = new Bestia(tela.value)
  await nextTick()
  rifai()
  bestia.avvia()
  // il riquadro si stringe quando entra una domanda: senza riascoltare, la creatura verrebbe schiacciata
  if (window.ResizeObserver) {
    osserva = new ResizeObserver(() => bestia?.ridimensiona())
    osserva.observe(tela.value.parentElement)
  }
})
onUnmounted(() => {
  osserva?.disconnect()
  bestia?.ferma()
})

watch(() => [props.chi, props.tipo], rifai)
watch(() => props.stato, s => bestia?.mostra(props.chi, s))
</script>

<template>
  <div><canvas ref="tela"></canvas></div>
</template>
