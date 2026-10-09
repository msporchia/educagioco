<script setup>
// Le tre schede della finestra dell'eroe (docs/sotterraneo/barra.md, «La finestra dell'eroe»): lo zaino con l'eroe
// vestito, le caratteristiche, l'albero delle abilità. Sono tre facce della stessa cosa: da qualunque parte la si apra
// (la bisaccia, il livello, il globo blu) si vedono tutte e si passa dall'una all'altra senza chiudere. Il «+» d'oro
// dice dove ci sono punti da dare
import Pixel from './Pixel.vue'
import Glifo from './Glifo.vue'
import { BISACCIA } from './pixel.js'

defineProps({
  attiva: { type: String, required: true },     // 'zaino' | 'eroe' | 'abilita'
  punti: { type: Number, default: 0 },           // da dare alle caratteristiche
  puntiAbilita: { type: Number, default: 0 },    // da imparare nell'albero
})
defineEmits(['scheda'])
</script>

<template>
  <nav class="sot-schede" role="tablist" aria-label="l'eroe">
    <button type="button" role="tab" class="sot-scheda" :class="{ 'sot-attiva': attiva === 'zaino' }" data-scheda="zaino"
            :aria-selected="attiva === 'zaino'" @click="$emit('scheda', 'zaino')">
      <Pixel :figura="BISACCIA" :scala="2" /><span>Zaino</span>
    </button>
    <button type="button" role="tab" class="sot-scheda" :class="{ 'sot-attiva': attiva === 'eroe' }" data-scheda="eroe"
            :aria-selected="attiva === 'eroe'" @click="$emit('scheda', 'eroe')">
      <Glifo nome="elmo" :misura="20" /><span>Eroe</span>
      <b v-if="punti" class="sot-scheda-punti">+{{ punti }}</b>
    </button>
    <button type="button" role="tab" class="sot-scheda" :class="{ 'sot-attiva': attiva === 'abilita' }" data-scheda="abilita"
            :aria-selected="attiva === 'abilita'" @click="$emit('scheda', 'abilita')">
      <Glifo nome="energia" :misura="20" class="sot-glifo-energia" /><span>Abilità</span>
      <b v-if="puntiAbilita" class="sot-scheda-punti">+{{ puntiAbilita }}</b>
    </button>
  </nav>
</template>
