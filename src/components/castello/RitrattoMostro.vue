<script setup>
// Il ritratto di un mostro: lo stesso pittore del campo su una tela minuscola,
// fermo apposta (nel nastro ce ne stanno tre alla volta). Vedi
// docs/castello/torri.md.
import { ref, watch, onMounted } from 'vue'
import { creaTela } from '../../grafica/tela.js'
import { PITTORI } from '../../grafica/castello.js'

const props = defineProps({
  bestia: { type: String, required: true },
  unita: { type: Number, default: 30 },     // più piccola, più grosso il mostro
  /* chi lo dipinge: quelli di sempre, o quelli di una pelle (il castello
     a sprite), che il mostro lo mostrano con la figura del campo */
  pittori: { type: Object, default: null },
})

const tela = ref(null)
let campo = null

function dipingi() {
  if (!campo) return
  const { W, H } = campo.ridimensiona()
  campo.disegna([{ che: 'ritratto', x: W / 2, y: H * 0.56, bestia: props.bestia }], 0)
}

onMounted(() => {
  campo = creaTela(tela.value, props.pittori || PITTORI, { unita: props.unita, massimo: 3 })
  dipingi()
  // un foglio di figure ancora da decodificare: si ridipinge quando c'è
  props.pittori?.pronte?.().then(dipingi, () => {})
})
watch(() => props.bestia, dipingi)
</script>

<template><canvas ref="tela"></canvas></template>

<style scoped>
canvas { display:block; width:100%; height:100% }
</style>
