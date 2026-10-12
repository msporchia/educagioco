<script setup>
// Il ritratto di una truppa nelle carte: lo stesso fotogramma del campo, su una
// tela piccola. Un mostro non è un'emoji (docs/core/grafica.md).
import { ref, onMounted, watch } from 'vue'
import { PEZZI } from '../../castello/dati/figure.js'
import { caricaFigure, immagineFigure } from '../../castello/scena/pittori.js'
import { fotogramma } from '../scena/figure.js'

const props = defineProps({ id: { type: String, required: true }, lato: { type: Number, default: 44 } })
const tela = ref(null)

function dipingi() {
  const cv = tela.value, img = immagineFigure()
  if (!cv || !img) return
  const dpr = window.devicePixelRatio || 1
  cv.width = cv.height = Math.round(props.lato * dpr)
  const c = cv.getContext('2d')
  c.clearRect(0, 0, cv.width, cv.height)
  const [sx, sy, w, h] = PEZZI[fotogramma(props.id, 0, false)]
  const s = Math.min(cv.width / w, cv.height / h) * 0.94
  c.drawImage(img, sx, sy, w, h, (cv.width - w * s) / 2, cv.height - h * s - cv.height * 0.03, w * s, h * s)
}

onMounted(() => caricaFigure().then(dipingi))
watch(() => props.id, dipingi)
</script>

<template>
  <canvas ref="tela" class="ar-ritratto" :style="{ width: lato + 'px', height: lato + 'px' }"></canvas>
</template>
