<script setup>
// La faccia di una cosa, una sola in tutto il gioco. Una cosa con un modello si mostra solo con la sua foto (viste/anteprima3d.js):
// finché non c'è, o se non verrà (un contesto perso), la casella resta vuota della sua misura, senza sprite sotto
// (docs/sotterraneo/anteprime-3d.md). Lo sprite resta per chi un modello non ce l'ha, l'emoji è il ripiego. La scala è
// dichiarata e uguale per tutti (×2): "grande quanto ci sta" faceva uscire la stessa boccetta a misure diverse.
import { computed } from 'vue'
import { figura, SCALA } from './figura.js'
import { usaAnteprime3d, usaAnteprima } from './anteprima3d.js'
import Quadro3d from './Quadro3d.vue'
import { chiaveDellaCosa } from '../scena3d/anteprime3d-pura.js'

const props = defineProps({
  sprite: { type: String, default: null },
  em: { type: String, default: '' },
  emAlto: { type: Number, default: 22 },   // la scala dell'emoji di ripiego: un carattere, tarato sul testo intorno
  scala: { type: Number, default: SCALA },   // un ritratto vuole essere più grande della scala di casa
  tre: { type: String, default: null },      // la chiave dell'anteprima 3D (anteprime3d-pura.js), o…
  cosa3d: { type: Object, default: null },   // …la cosa, e la chiave la si ricava qui: se c'è, lo sprite non si usa
  lato: { type: Number, default: 0 },        // il quadrato dell'anteprima, in px; 0: quanto l'emoji
  riduci: { type: Number, default: 1 },      // solo per lo sprite (la fila dei turni): l'anteprima è già della misura giusta
})

const servizio = usaAnteprime3d()
const chiave = computed(() => props.tre || (props.cosa3d ? chiaveDellaCosa(props.cosa3d, servizio ? servizio.eroe() : undefined) : null))
const tre = usaAnteprima(() => chiave.value)
const f = computed(() => (props.sprite && !chiave.value ? figura(props.sprite, { scala: props.scala }) : null))
const lato = computed(() => {
  if (props.lato) return props.lato
  const g = f.value && f.value.gabbia
  return g ? Math.max(parseFloat(g.width) || 0, parseFloat(g.height) || 0) || 48 : Math.round(props.emAlto * 1.6)
})
</script>

<template>
  <span v-if="chiave" class="sot-icona sot-icona-3d" :data-anteprima="tre ? '3d' : 'attesa'" :data-anteprima-chiave="chiave"
        :style="{ width: lato + 'px', height: lato + 'px' }"><Quadro3d v-if="tre" :immagine="tre" /></span>
  <span v-else class="sot-icona" :style="f ? { ...f.gabbia, ...(riduci < 1 ? { transform: `scale(${riduci})` } : null) } : null">
    <i v-if="f" :style="f.pezzo"></i>
    <b v-else class="em" :style="{ fontSize: emAlto + 'px' }">{{ em }}</b>
  </span>
</template>
