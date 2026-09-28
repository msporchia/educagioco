<script setup>
// Monta la tela (il cantiere di lato o il porto dall'alto) e le passa il
// quadro, che la regia muta sul posto. Si cambia tela senza smontare il
// campo quando cambia il mondo (`delPorto`).
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Tela } from '../scena/tela.js'
import { TelaPorto } from '../scena/porto.js'

const props = defineProps({
  quadro: { type: Object, default: null },
})

const scatola = ref(null)
const canvas = ref(null)
let tela = null
let porto = false
let osserva = null

const delPorto = q => !!q && q.mondo === 'porto'

function misura() {
  if (!tela || !props.quadro || !scatola.value) return
  const larga = scatola.value.clientWidth
  /* il porto si guarda di più: è lì che succedono le cose mentre il
     programma gira, e una mappa grande vuole spazio */
  const alta = porto
    ? Math.max(180, Math.min(window.innerHeight * 0.44, 440))
    : Math.max(150, Math.min(window.innerHeight * 0.36, 360))
  tela.misura(larga, alta, props.quadro.w, props.quadro.h)
}

function montaTela(q) {
  tela?.ferma()
  /* la tela del porto si trascina col dito e toglie lo scorrimento al
     canvas: quella del cantiere no, e lo rivuole */
  canvas.value.style.touchAction = ''
  porto = delPorto(q)
  tela = porto ? new TelaPorto(canvas.value) : new Tela(canvas.value)
  tela.aggiorna(q)
  misura()
}

onMounted(() => {
  montaTela(props.quadro)
  osserva = new ResizeObserver(misura)
  osserva.observe(scatola.value)
})
onUnmounted(() => { tela?.ferma(); osserva?.disconnect() })

watch(() => props.quadro, q => {
  if (!tela) return
  if (delPorto(q) !== porto) return montaTela(q)
  tela.aggiorna(q)
  misura()
})
</script>

<template>
  <div ref="scatola" class="cst-campo" data-campo>
    <canvas ref="canvas"></canvas>
  </div>
</template>
