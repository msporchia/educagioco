<script setup>
// Il fondale del duello (viste/Scontro.vue): la parete e il pavimento veri dello scenario in cui si combatte, presi dallo
// stesso foglio del campo (dati/tessere.js, SCENARI) e ripetuti a pixel nitidi. Niente di nuovo da disegnare: chi
// guarda vede dov'è. Si disegna una volta (e di nuovo se cambia lo scenario).
import { ref, onMounted, watch } from 'vue'
import { ATLANTE, PEZZI } from '../dati/atlante.js'

const props = defineProps({
  pavimento: { type: String, default: null },   // il quadrato 4×4 del pavimento delle stanze
  faccia: { type: String, default: null },      // la striscia della parete
  roccia: { type: String, default: '#25201d' }, // il colore sopra la parete
})
// 192×56 pixel del foglio: la proporzione del palco, ingrandita dal CSS
const L = 192, A = 56, PARETE_Y = 8, PIAN_Y = 28
const tela = ref(null)
let img = null

function disegna() {
  const c = tela.value
  if (!c || !img) return
  const ctx = c.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = props.roccia
  ctx.fillRect(0, 0, L, A)
  const f = PEZZI[props.faccia], p = PEZZI[props.pavimento]
  if (f) for (let x = 0; x < L; x += f[2]) ctx.drawImage(img, f[0], f[1], f[2], f[3], x, PARETE_Y, f[2], f[3])
  if (p) for (let x = 0; x < L; x += p[2]) ctx.drawImage(img, p[0], p[1], p[2], Math.min(p[3], A - PIAN_Y), x, PIAN_Y, p[2], Math.min(p[3], A - PIAN_Y))
}
onMounted(() => {
  img = new Image()
  img.onload = disegna
  img.src = ATLANTE
})
watch(() => [props.pavimento, props.faccia], disegna)
</script>

<template>
  <canvas ref="tela" class="sot-palco" :width="L" :height="A" aria-hidden="true"></canvas>
</template>
