<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL RIQUADRO DELLA CREATURA

   Tiene la tela e il suo ciclo, e niente altro: chi disegna sta in
   `scena/bestia.js`, chi decide cosa mostrare sta sopra. Quando
   cambia la creatura o la sua misura la tela si rifà; quando cambia
   solo lo stato — un colpo — non si rifà niente, si dice e basta.
   ═══════════════════════════════════════════════════════════════════ */
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
  /* La stanza si stringe quando entra una domanda, e il riquadro con
     lei: senza riascoltare la misura la tela resterebbe della taglia
     di prima e la creatura verrebbe schiacciata. `ResizeObserver` c'è
     su tutto quello che questo gioco gira sopra; dove non ci fosse, il
     disegno resta com'è invece di sparire. */
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
  <!-- la classe la mette chi lo usa (`dng-viva` e la sua stazza): qui
       non se ne aggiunge una seconda che non sta in nessun foglio -->
  <div><canvas ref="tela"></canvas></div>
</template>
