<script setup>
// L'esercizio di Passo passo per la maestra: il protagonista e i gradini come tessere (docs/passo-passo/scuola.md)
import { computed } from 'vue'
import { PROTAGONISTI, GRADINI } from './scheda.js'
import Righe from '../../maestra/Righe.vue'

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
      <p class="nota">Il bambino mette in fila delle carte (frecce, salto, cicli) e preme ▶: il personaggio le esegue una per una.
        Se arriva alla meta il livello è fatto, se no si corregge la fila e si riprova.</p>
      <Righe :voci="PROTAGONISTI.map(p => ({ chiave: p.id, nome: p.nome, icona: p.icona, testo: p.spiega }))" :scelte="[e.protagonista]"
             attributo="protagonista" una @tocca="protagonista" />
    </div>
    <div class="gruppo">
      <span class="titoletto">Cosa si impara</span>
      <Righe :voci="suoi.map(g => ({ chiave: g.chiave, nome: g.nome, icona: g.icona, quanti: g.livelli === 1 ? '1 livello' : `${g.livelli} livelli`, testo: g.spiega }))"
             :scelte="e.gradini" attributo="gradino" @tocca="gradino" />
      <p class="nota">{{ livelli }} {{ livelli === 1 ? 'livello' : 'livelli' }} in fila, dal più facile; finiti, si ricomincia.</p>
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
