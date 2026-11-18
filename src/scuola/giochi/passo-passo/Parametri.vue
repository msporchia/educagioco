<script setup>
// L'esercizio di Passo passo per la maestra: il protagonista e i gradini come tessere (docs/passo-passo/scuola.md)
import { computed } from 'vue'
import { PROTAGONISTI, GRADINI } from './scheda.js'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])

const e = computed(() => props.modelValue)
const suoi = computed(() => GRADINI[e.value.protagonista] || [])
const scelti = computed(() => suoi.value.filter(g => e.value.gradini.includes(g.chiave)))
const livelli = computed(() => scelti.value.reduce((n, g) => n + g.livelli, 0))
const manda = (protagonista, gradini) => emit('update:modelValue', { tipo: 'passo', protagonista, gradini })

// cambiando protagonista restano i gradini che ha anche lui (le carte del coniglio e del cane), se no il suo primo
function protagonista(id) {
  if (id === e.value.protagonista) return
  const restano = GRADINI[id].filter(g => e.value.gradini.includes(g.chiave)).map(g => g.chiave)
  manda(id, restano.length ? restano : [GRADINI[id][0].chiave])
}
// sempre nell'ordine della strada, e almeno uno
function gradino(chiave) {
  const acceso = e.value.gradini.includes(chiave)
  const dopo = suoi.value.map(g => g.chiave).filter(k => (k === chiave ? !acceso : e.value.gradini.includes(k)))
  if (dopo.length) manda(e.value.protagonista, dopo)
}
</script>

<template>
  <div class="parametri-passo">
    <div class="gruppo">
      <span class="titoletto">Chi gioca</span>
      <div class="fila">
        <button v-for="p in PROTAGONISTI" :key="p.id" class="tessera" :class="{ scelta: e.protagonista === p.id }"
                :aria-pressed="e.protagonista === p.id" :title="p.spiega" :data-protagonista="p.id"
                @click="protagonista(p.id)">{{ p.icona }} {{ p.nome }}</button>
      </div>
    </div>
    <div class="gruppo">
      <span class="titoletto">Quali gradini</span>
      <div class="fila">
        <button v-for="g in suoi" :key="g.chiave" class="tessera" :class="{ scelta: e.gradini.includes(g.chiave) }"
                :aria-pressed="e.gradini.includes(g.chiave)" :title="g.spiega" :data-gradino="g.chiave"
                @click="gradino(g.chiave)">{{ g.icona }} {{ g.nome }} <span class="quanti">{{ g.livelli }}</span></button>
      </div>
      <p class="nota">{{ livelli }} {{ livelli === 1 ? 'livello' : 'livelli' }} in fila, dal più facile; finiti, si ricomincia.
        <template v-if="scelti.length === 1"> {{ scelti[0].spiega }}</template></p>
    </div>
  </div>
</template>

<style scoped>
/* come le scelte di ParteEsercizio.vue: `fila`, `tessera`, `scelta` e `nota` sono di maestra.css */
.parametri-passo { display:flex; flex-direction:column; gap:12px }
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.quanti { font-weight:400; opacity:.7; margin-left:4px }
</style>
