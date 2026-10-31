<script setup>
// La faccia di un mostro grosso (dati/grossi.js) nella sua barra in cima: la foto del suo modello (`mostro:grosso:<chi>`,
// docs/sotterraneo/anteprime-3d.md), con la corona sopra, nell'alone della sua tinta. Finché la foto non c'è resta il posto vuoto.
import { computed } from 'vue'
import Icona from './Icona.vue'
import { GROSSI } from '../dati/grossi.js'
import { chiaveDelMostro } from '../scena3d/anteprime3d-pura.js'

const props = defineProps({
  chi: { type: String, required: true },
  lato: { type: Number, default: 40 },   // il quadrato della foto, in px
})
const G = computed(() => GROSSI[props.chi])
</script>

<template>
  <span v-if="G" class="sot-grosso-fig" data-figura-grosso :style="{ '--tinta': G.tinta }">
    <Icona :tre="chiaveDelMostro({ grosso: chi })" :lato="lato" />
    <b class="sot-corona em" :style="{ fontSize: Math.round(lato * 0.36) + 'px' }">👑</b>
  </span>
</template>
