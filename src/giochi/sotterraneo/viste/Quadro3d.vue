<script setup>
// Un'anteprima 3D (viste/anteprima3d.js) a schermo: la tela piccola che il servizio ha disegnato, copiata in una tela sua. Niente
// PNG: codificarlo costava più del disegno (docs/sotterraneo/anteprime-3d.md).
import { ref, onMounted, watch } from 'vue'

const props = defineProps({ immagine: { type: Object, required: true } })   // un HTMLCanvasElement
const tela = ref(null)
function copia() {
  const c = tela.value, i = props.immagine
  if (!c || !i) return
  if (c.width !== i.width) c.width = i.width
  if (c.height !== i.height) c.height = i.height
  const x = c.getContext('2d')
  x.clearRect(0, 0, c.width, c.height)
  x.drawImage(i, 0, 0)
}
onMounted(copia)
watch(() => props.immagine, copia, { flush: 'post' })
</script>

<template>
  <canvas ref="tela" aria-hidden="true"></canvas>
</template>
