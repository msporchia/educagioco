<script setup>
/* Una parola a pixel, con l'orlo del suo tasto come le figure: un carattere
   che sta con la mappa, non quello del telefono. Le minute, senza orlo. */
import { computed } from 'vue'
import { scritta } from './figure.js'

const props = defineProps({
  testo: { type: [String, Number], required: true },
  minuta: { type: Boolean, default: false },
})
const ATTORNO = ['1 0', '-1 0', '0 1', '0 -1']
const s = computed(() => scritta(props.testo, props.minuta))
const orlo = computed(() => (props.minuta ? 0 : 1))
</script>

<template>
  <svg class="pp-pix" :viewBox="`-${orlo} -${orlo} ${s.w + 2 * orlo} ${s.h + 2 * orlo}`"
       :style="{ '--w': s.w + 2 * orlo, '--h': s.h + 2 * orlo }" shape-rendering="crispEdges" aria-hidden="true">
    <template v-if="orlo">
      <path v-for="t in ATTORNO" :key="t" class="pp-scritta-orlo" :d="s.d" :transform="`translate(${t})`" />
    </template>
    <path class="pp-scritta-piena" :d="s.d" />
  </svg>
</template>
