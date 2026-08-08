<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL RITRATTO DI UN MOSTRO

   Una faccia sola, ferma, dentro un riquadro piccolo. Non è
   un'immagine: è lo stesso pittore che disegna i mostri sul campo,
   chiamato su una tela minuscola. Un mostro nuovo si disegna una volta
   sola e compare dappertutto.

   Ferma apposta: nel nastro del preavviso ce ne stanno tre alla volta,
   e tre animazioni a sessanta fotogrammi per dire «arriva un goblin»
   sarebbero tre volte il lavoro per niente.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, watch, onMounted } from 'vue'
import { creaTela } from '../../grafica/tela.js'
import { PITTORI } from '../../grafica/castello.js'

const props = defineProps({
  bestia: { type: String, required: true },
  unita: { type: Number, default: 30 },     // più piccola, più grosso il mostro
})

const tela = ref(null)
let campo = null

function dipingi() {
  if (!campo) return
  const { W, H } = campo.ridimensiona()
  campo.disegna([{ che: 'ritratto', x: W / 2, y: H * 0.56, bestia: props.bestia }], 0)
}

onMounted(() => {
  campo = creaTela(tela.value, PITTORI, { unita: props.unita, massimo: 3 })
  dipingi()
})
watch(() => props.bestia, dipingi)
</script>

<template><canvas ref="tela"></canvas></template>

<style scoped>
canvas { display:block; width:100%; height:100% }
</style>
