<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO — dove sta la tela

   Monta la tela, le dice quanto posto c'è (tutta la larghezza, e al
   massimo un terzo abbondante dell'altezza: sotto c'è il programma, che
   è l'altra metà del gioco) e le passa il quadro. Il quadro lo muta la
   regia sul posto: qui non si guarda cosa c'è dentro.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Tela } from '../scena/tela.js'

const props = defineProps({
  quadro: { type: Object, default: null },
})

const scatola = ref(null)
const canvas = ref(null)
let tela = null
let osserva = null

function misura() {
  if (!tela || !props.quadro || !scatola.value) return
  const larga = scatola.value.clientWidth
  const alta = Math.max(150, Math.min(window.innerHeight * 0.36, 360))
  tela.misura(larga, alta, props.quadro.w, props.quadro.h)
}

onMounted(() => {
  tela = new Tela(canvas.value)
  tela.aggiorna(props.quadro)
  misura()
  osserva = new ResizeObserver(misura)
  osserva.observe(scatola.value)
})
onUnmounted(() => { tela?.ferma(); osserva?.disconnect() })

watch(() => props.quadro, q => {
  if (!tela) return
  tela.aggiorna(q)
  misura()
})
</script>

<template>
  <div ref="scatola" class="cst-campo" data-campo>
    <canvas ref="canvas"></canvas>
  </div>
</template>
