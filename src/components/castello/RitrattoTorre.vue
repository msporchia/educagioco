<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL RITRATTO DI UNA TORRE

   Come quello dei mostri, e per la stessa ragione: non è un'immagine,
   è **lo stesso pittore** che la disegna sul campo, chiamato su una
   tela piccola. Così la carta con cui la compri e la torre che ti
   ritrovi in mezzo al prato sono la stessa cosa — compreso il fatto
   che al livello sette è diventata un'altra roba.

   Prima qui c'era un'emoji, e l'emoji mentiva: 🏹 restava 🏹 anche
   quando la torre era cresciuta due volte.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, watch, onMounted } from 'vue'
import { creaTela } from '../../grafica/tela.js'
import { PITTORI } from '../../grafica/castello.js'

const props = defineProps({
  tipo: { type: String, required: true },
  lv: { type: Number, default: 1 },
  ramo: { type: String, default: null },
  unita: { type: Number, default: 74 },     // più piccola, più grossa la torre
})

const tela = ref(null)
let campo = null

function dipingi() {
  if (!campo) return
  const { W, H } = campo.ridimensiona()
  campo.disegna([{ che: 'torre', x: W / 2, y: H * 0.82,
                   tipo: props.tipo, lv: props.lv, ramo: props.ramo,
                   potenziabile: false, posso: false }], 0)
}

onMounted(() => {
  campo = creaTela(tela.value, PITTORI, { unita: props.unita, massimo: 3 })
  dipingi()
})
watch(() => [props.tipo, props.lv, props.ramo], dipingi)
</script>

<template><canvas ref="tela"></canvas></template>

<style scoped>
canvas { display:block; width:100%; height:100% }
</style>
