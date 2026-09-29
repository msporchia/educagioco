<script setup>
/* Un pezzo dell'atlante su un canvas suo, per carte e tastini: unico punto in cui una vista tocca
   l'atlante. Il riquadro è sempre lato×lato (il pezzo ci sta in scala, ingrandito solo di un intero
   quando è piccolo), bottom-aligned come sul piede della scena, imageSmoothingEnabled false e dpr suo. */
import { onMounted, ref, watch } from 'vue'
import { ATLANTE, PEZZI } from '../dati/atlante.js'

const props = defineProps({
  pezzo: { type: String, required: true },
  lato: { type: Number, default: 42 },
  // quanto lasciare libero attorno, in pixel del riquadro
  aria: { type: Number, default: 2 },
})

const tela = ref(null)
let immagine = null

function disegna() {
  const c = tela.value, p = PEZZI[props.pezzo]
  if (!c || !immagine || !immagine.complete) return
  const dpr = Math.min(3, Math.max(1, Math.round(globalThis.devicePixelRatio || 1)))
  c.width = c.height = props.lato * dpr
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false
  g.clearRect(0, 0, c.width, c.height)
  if (!p) return

  const dentro = Math.max(1, props.lato - props.aria * 2)
  let z = Math.min(dentro / p[2], dentro / p[3])
  // ingrandire si ingrandisce solo di un intero; rimpicciolire no (mezzo pixel in più si vede, in meno no)
  if (z > 1) z = Math.floor(z)
  const w = Math.round(p[2] * z * dpr), h = Math.round(p[3] * z * dpr)
  g.drawImage(immagine, p[0], p[1], p[2], p[3],
    Math.round((c.width - w) / 2), Math.round(c.height - props.aria * dpr - h), w, h)
}

onMounted(() => {
  immagine = new Image()
  immagine.onload = disegna
  immagine.src = ATLANTE
  disegna()
})
watch(() => [props.pezzo, props.lato], disegna)
</script>

<template>
  <canvas ref="tela" class="fa-provino"
          :style="{ width: lato + 'px', height: lato + 'px' }"></canvas>
</template>
