<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA FESTA — i coriandoli, senza che ogni gioco se li monti

   Tre righe che si ripetevano identiche in chi voleva festeggiare: una
   tela, una classe da costruire, una da fermare quando la schermata se
   ne va. Qui stanno una volta sola, e chi festeggia scrive:

     <Festa v-if="primato.record" />

   **Si accende comparendo e si spegne sparendo**, che è il motivo per
   cui è un componente e non una funzione: il `v-if` di chi la monta è
   già la risposta a «adesso?», e non serve una seconda volontà.

   Due cose nel foglio di stile, e nessuna delle due è decorazione.
   `pointer-events: none`, perché una tela larga come lo schermo sopra
   un tasto è un tasto che non si preme più. E `z-index: -1`, che dentro
   il velo di un cartello vuol dire **dietro le parole**: i coriandoli
   cadono fra lo sfondo e il cartello, e quello che c'è scritto — che è
   il record appena battuto — resta leggibile mentre cadono.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, onMounted, onUnmounted } from 'vue'
import { Coriandoli } from '../grafica/coriandoli.js'

const props = defineProps({
  /* quanti pezzi: il difetto va bene per un velo a schermo intero */
  quanti: { type: Number, default: 130 },
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
.festa-tela { position: absolute; inset: 0; width: 100%; height: 100%;
              pointer-events: none; z-index: -1 }
</style>
