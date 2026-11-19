<script setup>
// Le tappe del castello per la maestra: una sola, scelta fra quelle del regno, con le sue operazioni. docs/castello/scuola.md
import { computed } from 'vue'
import { CAMPAGNE_CASTELLO, tappaCastello } from './scheda.js'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])

const scelta = computed(() => tappaCastello(props.modelValue.tappa))
const numero = chiave => CAMPAGNE_CASTELLO.flatMap(c => c.tappe).findIndex(t => t.chiave === chiave) + 1
const tappa = chiave => emit('update:modelValue', { tipo: 'castello', tappa: chiave })
</script>

<template>
  <div class="parametri-castello">
    <div v-for="c in CAMPAGNE_CASTELLO" :key="c.id" class="gruppo">
      <span class="titoletto">{{ c.emoji }} {{ c.nome }}</span>
      <div class="fila">
        <button v-for="t in c.tappe" :key="t.chiave" class="tessera" :class="{ scelta: scelta && scelta.chiave === t.chiave }"
                :aria-pressed="!!scelta && scelta.chiave === t.chiave" :title="t.fino.join(', ')" :data-tappa-castello="t.chiave"
                @click="tappa(t.chiave)">{{ numero(t.chiave) }}. {{ t.emoji }} {{ t.nome }} <span class="quanti">{{ t.icone }}</span></button>
      </div>
    </div>
    <p v-if="scelta" class="nota">{{ scelta.nome }}: {{ scelta.fino.join(', ') }}. Si vince con circa {{ scelta.calcoli }}
      conti; vinta o persa, si riparte dalla stessa tappa. Le tappe più avanti chiedono conti più lunghi.</p>
  </div>
</template>

<style scoped>
/* come le scelte di ParteEsercizio.vue: `fila`, `tessera`, `scelta` e `nota` sono di maestra.css */
.parametri-castello { display:flex; flex-direction:column; gap:12px }
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.quanti { font-weight:400; opacity:.7; margin-left:4px }
</style>
