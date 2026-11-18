<script setup>
// I capitoli del Robot per la maestra: tessere da accendere, almeno una; si giocano nell'ordine della campagna. docs/costruttore/scuola.md
import { computed } from 'vue'
import { CAPITOLI_ROBOT } from './scheda.js'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])

const scelti = computed(() => (Array.isArray(props.modelValue.capitoli) ? props.modelValue.capitoli : []))
const livelli = computed(() => CAPITOLI_ROBOT.filter(c => scelti.value.includes(c.chiave)).reduce((n, c) => n + c.livelli, 0))

function capitolo(k) {
  const dentro = scelti.value.includes(k)
  if (dentro && scelti.value.length === 1) return
  const capitoli = CAPITOLI_ROBOT.map(c => c.chiave).filter(x => (x === k ? !dentro : scelti.value.includes(x)))
  emit('update:modelValue', { tipo: 'robot', capitoli })
}
</script>

<template>
  <div class="gruppo">
    <span class="titoletto">Quali capitoli</span>
    <div class="fila">
      <button v-for="(c, i) in CAPITOLI_ROBOT" :key="c.chiave" class="tessera" :class="{ scelta: scelti.includes(c.chiave) }"
              :aria-pressed="scelti.includes(c.chiave)" :title="c.dice" :data-capitolo-robot="c.chiave"
              @click="capitolo(c.chiave)">{{ c.icona }} {{ i + 1 }}. {{ c.nome }} <span class="quanti">{{ c.livelli }}</span></button>
    </div>
    <p class="nota">{{ livelli === 1 ? '1 livello' : `${livelli} livelli` }}, in fila; finiti, si ricomincia dal primo. I capitoli
      vanno in ordine: ognuno usa quello che s'impara prima, e il primo spiega da sé come si gioca.</p>
  </div>
</template>

<style scoped>
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.quanti { font-weight:400; opacity:.7; margin-left:4px }
</style>
