<script setup>
/* Un disegno in pixel della festa (scena/pixel-festa.js) dentro un foglio: lo stesso cappello che la
   bestia porta in fattoria, non un'emoji che gli somiglia. */
import { onMounted, ref, watch } from 'vue'
import { DISEGNI, disegnaPixel } from '../scena/pixel-festa.js'

const props = defineProps({
  disegno: { type: String, required: true },
  lato: { type: Number, default: 34 },
})
const tela = ref(null)

function disegna() {
  const d = DISEGNI[props.disegno]
  const c = tela.value
  if (!d || !c) return
  const largo = Math.max(...d.righe.map(r => r.length)), alto = d.righe.length
  const px = Math.max(1, Math.floor(props.lato / Math.max(largo, alto)))
  c.width = props.lato; c.height = props.lato
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, c.width, c.height)
  disegnaPixel(ctx, props.disegno, props.lato / 2, (props.lato + alto * px) / 2, px)
}
onMounted(disegna)
watch(() => [props.disegno, props.lato], disegna)
</script>

<template>
  <canvas ref="tela" class="fa-pixel" :style="{ width: lato + 'px', height: lato + 'px' }"></canvas>
</template>
