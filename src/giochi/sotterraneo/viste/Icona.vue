<script setup>
// La faccia di una cosa, una sola in tutto il gioco: dove il foglio ha il pezzo si usa il pezzo, l'emoji è
// il ripiego (armature senza sprite, un pezzo che sparisse). La scala è dichiarata e uguale per tutti (×2):
// "grande quanto ci sta" faceva uscire la stessa boccetta a misure diverse in tasca e in un avviso.
import { computed } from 'vue'
import { figura, SCALA } from './figura.js'

const props = defineProps({
  sprite: { type: String, default: null },
  em: { type: String, default: '' },
  emAlto: { type: Number, default: 22 },   // la scala dell'emoji di ripiego: un carattere, tarato sul testo intorno
  scala: { type: Number, default: SCALA },   // un ritratto vuole essere più grande della scala di casa
})

const f = computed(() => (props.sprite ? figura(props.sprite, { scala: props.scala }) : null))
</script>

<template>
  <span class="sot-icona" :style="f ? f.gabbia : null">
    <i v-if="f" :style="f.pezzo"></i>
    <b v-else class="em" :style="{ fontSize: emAlto + 'px' }">{{ em }}</b>
  </span>
</template>
