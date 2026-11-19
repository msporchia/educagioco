<script setup>
// L'esercizio della cucina per la maestra: da quale a quale livello, coi tratti della cassa come scelte svelte (docs/bancarella/scuola.md)
import { computed } from 'vue'
import { LIVELLI_CUCINA, TRATTI_CUCINA, contiDi } from './scheda.js'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])

const e = computed(() => props.modelValue)
const quanti = computed(() => e.value.a - e.value.da + 1)
// sempre da ≤ a: chi sceglie un estremo oltre l'altro li scambia
function livelli(da, a) {
  if (da > a) [da, a] = [a, da]
  emit('update:modelValue', { tipo: 'cucina', da, a })
}
const scelto = t => e.value.da === t.da && e.value.a === t.a
</script>

<template>
  <div class="parametri-cucina">
    <div class="gruppo">
      <span class="titoletto">Alla cassa</span>
      <div class="fila">
        <button v-for="t in TRATTI_CUCINA" :key="t.da" class="tessera" :class="{ scelta: scelto(t) }" :aria-pressed="scelto(t)"
                :data-tratto="t.da" @click="livelli(t.da, t.a)">{{ t.nome }} <span class="quanti">{{ t.da }}–{{ t.a }}</span></button>
      </div>
    </div>
    <div class="due">
      <label>Dal livello
        <select class="campo" :value="e.da" data-campo="da" @change="livelli(Number($event.target.value), e.a)">
          <option v-for="l in LIVELLI_CUCINA" :key="l.n" :value="l.n">{{ l.n }} · {{ l.nome }}: {{ l.nuovo }}</option>
        </select>
      </label>
      <label>Al livello
        <select class="campo" :value="e.a" data-campo="a" @change="livelli(e.da, Number($event.target.value))">
          <option v-for="l in LIVELLI_CUCINA" :key="l.n" :value="l.n">{{ l.n }} · {{ l.nome }}: {{ l.nuovo }}</option>
        </select>
      </label>
    </div>
    <p class="nota">{{ quanti }} {{ quanti === 1 ? 'livello' : 'livelli' }} in fila; finiti, si ricomincia. Alla cassa {{ contiDi(e) }}.</p>
  </div>
</template>

<style scoped>
/* come le scelte di ParteEsercizio.vue: `fila`, `tessera`, `scelta`, `campo` e `nota` sono di maestra.css */
.parametri-cucina { display:flex; flex-direction:column; gap:12px }
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.due { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px }
.quanti { font-weight:400; opacity:.7; margin-left:4px }
</style>
