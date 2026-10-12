<script setup>
// La figura di un mostro grosso (dati/grossi.js, `figuraDelGrosso`) fuori dal campo: nello scontro e nella sua barra in cima.
// Lo sprite dipinto se l'atlante ha `grosso-<chiave>-fermo-0`; se no quello della sua specie, ingrandito, con la corona.
// `scala`: i pixel di schermo per ogni pixel della sua scatola di 32×32; lo sprite di ripiego ha una scala intera sua,
// o uscirebbe a pixel disuguali (viste/figura.js)
import { computed } from 'vue'
import { figura } from './figura.js'
import { GROSSI, figuraDelGrosso, spriteDelGrosso, LATO_DEL_GROSSO } from '../dati/grossi.js'

const props = defineProps({
  chi: { type: String, required: true },
  scala: { type: Number, default: 2 },
})
const G = computed(() => GROSSI[props.chi])
const F = computed(() => figuraDelGrosso(props.chi))
const corpo = computed(() => {
  const f = F.value
  if (!f) return null
  const s = f.dipinto ? props.scala : Math.max(1, Math.round(props.scala * LATO_DEL_GROSSO / f.alto))
  return figura(spriteDelGrosso(f, false, 0), { scala: s })
})
// la corona è larga più o meno metà della figura
const corona = computed(() => (corpo.value ? Math.round(parseFloat(corpo.value.gabbia.width) * 0.5) : 0))
</script>

<template>
  <span v-if="corpo" class="sot-grosso-fig" data-figura-grosso :style="{ '--tinta': G.tinta }">
    <span class="sot-ritratto" :style="corpo.gabbia"><i :style="corpo.pezzo"></i></span>
    <b v-if="!F.dipinto" class="sot-corona em" :style="{ fontSize: corona + 'px' }">👑</b>
  </span>
</template>
