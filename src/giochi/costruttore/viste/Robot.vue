<script setup>
// Il Robot disegnato, da mettere dentro un <svg>: centrato nell'origine, alto
// una trentina di pixel. I pezzi sono quelli della tela (scena/robot.js), così
// è lo stesso dappertutto. Vedi docs/costruttore/scheda.md.
import { computed } from 'vue'
import { pezzi } from '../scena/robot.js'

const props = defineProps({
  fermo: { type: Boolean, default: false },              // senza il dondolio
  verso: { type: String, default: 'fronte' },
  braccia: { type: String, default: 'giu' },
  occhi: { type: String, default: 'aperti' },
})
const disegno = computed(() => pezzi({ verso: props.verso, braccia: props.braccia, occhi: props.occhi }))
const corpo = computed(() => disegno.value.filter(k => !k.suolo))
const suolo = computed(() => disegno.value.filter(k => k.suolo))
const punti = l =>l.map(p => p.join(',')).join(' ')
</script>

<template>
  <g class="cst-robot" :class="{ 'cst-robot-fermo': fermo }">
    <g v-for="(parte, j) in [corpo, suolo]" :key="j" :class="{ 'cst-robot-corpo': j === 0 }">
      <template v-for="(k, i) in parte" :key="i">
        <rect v-if="k.t === 'rett'" :x="k.x" :y="k.y" :width="k.w" :height="k.h" :rx="k.r"
              :fill="k.fill" :stroke="k.stroke || undefined" :stroke-width="k.sw || undefined" />
        <circle v-else-if="k.t === 'cerchio'" :cx="k.x" :cy="k.y" :r="k.r"
                :fill="k.fill" :stroke="k.stroke || undefined" :stroke-width="k.sw || undefined" />
        <polyline v-else :points="punti(k.punti)" fill="none" :stroke="k.stroke" :stroke-width="k.sw"
                  stroke-linecap="round" stroke-linejoin="round" />
      </template>
    </g>
  </g>
</template>

<style scoped>
.cst-robot-corpo { animation:cst-dondola 1.3s ease-in-out infinite }
.cst-robot-fermo .cst-robot-corpo { animation:none }
@keyframes cst-dondola { 50% { transform:translateY(-1.5px) } }
@media (prefers-reduced-motion: reduce) { .cst-robot-corpo { animation:none } }
</style>
