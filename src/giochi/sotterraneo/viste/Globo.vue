<script setup>
// Un globo della barra in basso, come in Diablo: una sfera di vetro col liquido che cala dall'alto, l'onda che si
// muove alla superficie e il riflesso del vetro. Rosso la vita, d'oro la luce della torcia
// (docs/sotterraneo/barra.md). Non è un tasto: si guarda.
import { computed } from 'vue'

const props = defineProps({
  tipo: { type: String, required: true },      // 'vita' | 'luce'
  quota: { type: Number, default: 0 },         // 0..1, quanto è pieno
  numero: { type: [String, Number], default: '' },
  guizza: { type: Boolean, default: false },   // la luce agli sgoccioli, senza torce di scorta
  colpito: { type: Boolean, default: false },  // un colpo appena preso: il vetro sobbalza
  etichetta: { type: String, default: '' },
})
const pieno = computed(() => Math.max(0, Math.min(1, props.quota)))
</script>

<template>
  <div class="sot-globo" :class="['sot-globo-' + tipo, { 'sot-guizza': guizza, 'sot-colpito': colpito }]"
       :data-globo="tipo" :data-quota="pieno.toFixed(2)" :data-guizza="guizza ? 1 : null"
       role="img" :aria-label="etichetta">
    <span class="sot-globo-vetro">
      <span class="sot-globo-liquido" :style="{ height: pieno * 100 + '%' }">
        <!-- due onde a velocità diverse: una sola sembra un nastro che scorre -->
        <svg v-if="pieno > 0 && pieno < 1" class="sot-onda sot-onda-dietro" viewBox="0 0 240 12" preserveAspectRatio="none"
             aria-hidden="true"><path d="M0 6Q15 0 30 6T60 6T90 6T120 6T150 6T180 6T210 6T240 6V12H0Z" /></svg>
        <svg v-if="pieno > 0 && pieno < 1" class="sot-onda" viewBox="0 0 240 12" preserveAspectRatio="none"
             aria-hidden="true"><path d="M0 6Q15 0 30 6T60 6T90 6T120 6T150 6T180 6T210 6T240 6V12H0Z" /></svg>
      </span>
      <span class="sot-globo-riflesso" aria-hidden="true"></span>
    </span>
    <b v-if="numero !== ''" class="sot-globo-numero">{{ numero }}</b>
  </div>
</template>
