<script setup>
// Il fondale del duello (viste/Scontro.vue): un pezzo di stanza vera, preso dallo stesso foglio del campo (dati/tessere.js, SCENARI).
// In cima uno zoccolo di parete, sotto il pavimento fino in fondo; tutto a pixel nitidi e alla scala degli sprite (SCALA_PALCO),
// così le piastrelle sono grandi quanto le figure che ci stanno sopra e si vede più terreno (docs/sotterraneo/scontro-interfaccia.md).
// Si disegna di nuovo se cambiano la misura o lo scenario.
import { computed, ref, onMounted, watch } from 'vue'
import { ATLANTE, PEZZI } from '../dati/atlante.js'
import { SCALA_PALCO as S } from './campo.js'

const props = defineProps({
  pavimento: { type: String, default: null },   // il quadrato 4×4 del pavimento delle stanze
  faccia: { type: String, default: null },      // la striscia della parete
  roccia: { type: String, default: '#25201d' }, // il colore sotto la parete e dove manca
  larg: { type: Number, default: 352 },         // la misura del palco, in px di schermo
  alto: { type: Number, default: 264 },
})
const L = computed(() => Math.ceil(props.larg / S))
const A = computed(() => Math.ceil(props.alto / S))
const tela = ref(null)
let img = null

function disegna() {
  const c = tela.value
  if (!c || !img) return
  const ctx = c.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = props.roccia
  ctx.fillRect(0, 0, L.value, A.value)
  const f = PEZZI[props.faccia], p = PEZZI[props.pavimento]
  const yp = f ? f[3] : 20   // il pavimento comincia dove finisce la parete
  if (p) for (let y = yp; y < A.value; y += p[3]) for (let x = 0; x < L.value; x += p[2]) ctx.drawImage(img, p[0], p[1], p[2], p[3], x, y, p[2], p[3])
  if (f) for (let x = 0; x < L.value; x += f[2]) ctx.drawImage(img, f[0], f[1], f[2], f[3], x, 0, f[2], f[3])
  ctx.fillStyle = '#00000059'   // l'ombra che la parete getta sul pavimento
  ctx.fillRect(0, yp, L.value, 3)
  ctx.fillStyle = '#00000026'
  ctx.fillRect(0, yp + 3, L.value, 3)
}
onMounted(() => {
  img = new Image()
  img.onload = disegna
  img.src = ATLANTE
})
// cambiare la misura della tela la svuota: si ridisegna dopo l'aggiornamento del DOM
watch(() => [props.pavimento, props.faccia, props.larg, props.alto], disegna, { flush: 'post' })
</script>

<template>
  <canvas ref="tela" class="sot-palco" :width="L" :height="A" :style="{ width: L * S + 'px', height: A * S + 'px' }" aria-hidden="true"></canvas>
</template>
