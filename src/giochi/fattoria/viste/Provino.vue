<script setup>
/* Un pezzo dell'atlante su un canvas suo, per le carte e i tastini.
   Sta a parte perché lo usano in tre, e perché è l'unico punto in cui
   una vista tocca l'atlante: se domani i pezzi si disegnassero in un
   altro modo, si cambia qui e non in tre template.

   `imageSmoothingEnabled = false` non è un dettaglio: senza, il canvas
   sfoca la pixel art ingrandita e in una carta da 42 px si vede tutto. */
import { onMounted, ref, watch } from 'vue'
import { ATLANTE, PEZZI } from '../dati/atlante.js'

const props = defineProps({
  pezzo: { type: String, required: true },
  lato: { type: Number, default: 42 },
})

const tela = ref(null)
let immagine = null

function disegna() {
  const c = tela.value, p = PEZZI[props.pezzo]
  if (!c || !p || !immagine || !immagine.complete) return
  const z = Math.max(1, Math.min(3, Math.floor(props.lato / Math.max(p[2], p[3]))))
  c.width = p[2] * z
  c.height = p[3] * z
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false
  g.drawImage(immagine, p[0], p[1], p[2], p[3], 0, 0, c.width, c.height)
}

onMounted(() => {
  immagine = new Image()
  immagine.onload = disegna
  immagine.src = ATLANTE
  disegna()
})
watch(() => props.pezzo, disegna)
</script>

<template><canvas ref="tela" class="fa-provino"></canvas></template>
