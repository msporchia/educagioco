<script setup>
// Un'icona delle abilità disegnata in codice (viste/glifi.js): pieni e tratti del colore del testo, ombre e riflessi
// sopra. Niente emoji nel sotterraneo dove c'è da dire una cosa seria (docs/sotterraneo/abilita.md)
import { computed } from 'vue'
import { glifoDi } from './glifi.js'

const props = defineProps({
  nome: { type: String, required: true },
  misura: { type: Number, default: 24 },
})
const STILE = {
  p: { fill: 'currentColor' },
  l: { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
  o: { fill: '#00000059' },
  c: { fill: '#ffffffc4' },
  d: { fill: 'none', stroke: '#000000a6', 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
}
const parti = computed(() => glifoDi(props.nome).map(([t, d]) => ({ d, ...STILE[t] })))
</script>

<template>
  <svg class="sot-glifo" :width="misura" :height="misura" viewBox="0 0 24 24" aria-hidden="true" :data-glifo="nome">
    <path v-for="(x, i) in parti" :key="i" v-bind="x" />
  </svg>
</template>
