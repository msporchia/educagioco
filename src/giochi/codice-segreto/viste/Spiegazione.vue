<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL VELO DELLA SPIEGAZIONE

   Poco più di una cornice: monta la Dimostrazione sul suo elemento, la
   avvia, e la ferma appena si chiude — un'animazione lasciata a girare
   dietro a una schermata chiusa è un telefono che scalda in tasca.

   Cosa far vedere lo decide chi sta sopra (i disegni sono quelli del
   tema di questa tappa): qui non si calcola niente.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Dimostrazione } from '../scena/dimostrazione.js'

const props = defineProps({
  codice: { type: Array, required: true },
  tentativo: { type: Array, required: true },
  passi: { type: Array, required: true },
  suona: { type: Function, default: null },
})
defineEmits(['chiudi'])

const dove = ref(null)
let dimo = null

onMounted(() => {
  dimo = new Dimostrazione(dove.value, {
    codice: props.codice, tentativo: props.tentativo,
    passi: props.passi, suona: props.suona,
  })
  dimo.avvia()
})
onBeforeUnmount(() => dimo?.ferma())
</script>

<template>
  <div class="cs-velo" data-velo="spiegazione">
    <div ref="dove"></div>
    <button class="cs-grosso" @click="$emit('chiudi')"><span class="em">▶</span> gioca</button>
  </div>
</template>
