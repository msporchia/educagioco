<script setup>
// La festa: coriandoli senza che ogni gioco se li monti da sé. Un componente
// e non una funzione: si accende comparendo e si spegne sparendo, col v-if
// di chi la monta (<Festa v-if="primato.record" />).
import { ref, onMounted, onUnmounted } from 'vue'
import { Coriandoli } from '../grafica/coriandoli.js'

const props = defineProps({
  quanti: { type: Number, default: 130 },   // il difetto va bene per un velo a schermo intero
})

const tela = ref(null)
let festa = null

onMounted(() => {
  if (!tela.value) return
  festa = new Coriandoli(tela.value)
  festa.lancia({ quanti: props.quanti })
})
onUnmounted(() => festa?.ferma())
</script>

<template>
  <canvas ref="tela" class="festa-tela" data-festa hidden></canvas>
</template>

<style scoped>
/* pointer-events:none: una tela larga come lo schermo non deve coprire un
   tasto. z-index:-1: dietro le parole del cartello, davanti allo sfondo */
.festa-tela { position: absolute; inset: 0; width: 100%; height: 100%;
              pointer-events: none; z-index: -1 }
</style>
