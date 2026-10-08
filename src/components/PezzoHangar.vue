<script setup>
/* Un pezzo dell'hangar su una tela piccola (docs/asteroidi/hangar.md).
   `regalo`: il pacco aperto da cui esce, per «hai ottenuto». */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { aspettoDi } from '../motore/asteroidi/hangar.js'
import { disegnaPezzo, disegnaRegalo } from '../grafica/pezzo-hangar.js'

const props = defineProps({
  pezzo: { type: String, required: true },
  nave: { type: Object, default: () => ({}) },
  misura: { type: Number, default: 56 },
  regalo: { type: Boolean, default: false },
  fermo: { type: Boolean, default: false },   // niente animazione: una tavolozza di trenta tele non deve girare
})

const tela = ref(null)
let raf = 0, inizio = 0

function disegna(ts) {
  const cv = tela.value
  if (!cv) return
  const dpr = devicePixelRatio || 1, m = props.misura
  if (cv.width !== Math.round(m * dpr)) { cv.width = Math.round(m * dpr); cv.height = Math.round(m * dpr) }
  const ctx = cv.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, m, m)
  const t = inizio ? (ts - inizio) / 1000 : 0
  const a = aspettoDi(props.pezzo, props.nave)
  if (props.regalo) disegnaRegalo(ctx, a, m, m, t)
  else disegnaPezzo(ctx, a, m / 2, m / 2, m, t)
  if (!props.fermo) raf = requestAnimationFrame(disegna)
}
function riparti() {
  cancelAnimationFrame(raf)
  inizio = performance.now()
  raf = requestAnimationFrame(disegna)
}
onMounted(riparti)
watch(() => [props.pezzo, props.nave, props.misura], riparti, { deep: true })
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <canvas ref="tela" :style="{ width: misura + 'px', height: misura + 'px' }" :data-pezzo="pezzo"></canvas>
</template>
