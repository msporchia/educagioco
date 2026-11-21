<script setup>
// L'esercizio delle pozioni per la maestra: le misure e i gradini come tessere (docs/pozioni/scuola.md)
import { computed } from 'vue'
import { FAMIGLIE_POZIONI, GRADINI_POZIONI, quanteTappe } from './scheda.js'
import Righe from '../../maestra/Righe.vue'
import { provaEsercizio } from '../../maestra/utili.js'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])

const e = computed(() => props.modelValue)
const tappe = computed(() => quanteTappe(e.value))
const scelti = computed(() => GRADINI_POZIONI.filter(g => e.value.gradini.includes(g.chiave)))

// sempre nell'ordine della campagna, e almeno una
const accendi = (tutte, ora, chiave) => {
  const acceso = ora.includes(chiave)
  return tutte.map(x => x.chiave).filter(k => (k === chiave ? !acceso : ora.includes(k)))
}
function famiglia(chiave) {
  const dopo = accendi(FAMIGLIE_POZIONI, e.value.famiglie, chiave)
  if (dopo.length) emit('update:modelValue', { tipo: 'pozioni', famiglie: dopo, gradini: e.value.gradini })
}
function gradino(chiave) {
  const dopo = accendi(GRADINI_POZIONI, e.value.gradini, chiave)
  if (dopo.length) emit('update:modelValue', { tipo: 'pozioni', famiglie: e.value.famiglie, gradini: dopo })
}
</script>

<template>
  <div class="parametri-pozioni">
    <div class="gruppo">
      <span class="titoletto">Quali misure</span>
      <div class="fila">
        <button v-for="f in FAMIGLIE_POZIONI" :key="f.chiave" class="tessera" :class="{ scelta: e.famiglie.includes(f.chiave) }"
                :aria-pressed="e.famiglie.includes(f.chiave)" :title="f.unita" :data-famiglia="f.chiave"
                @click="famiglia(f.chiave)">{{ f.icona }} {{ f.nome }} <span class="quanti">{{ f.unita }}</span></button>
      </div>
    </div>
    <div class="gruppo">
      <span class="titoletto">Cosa si chiede</span>
      <p class="nota">In ogni tappa una ricetta: per ogni dose il bambino compra dal mercante le ampolle giuste, spendendo poco.</p>
      <Righe :voci="GRADINI_POZIONI.map((g, n) => ({ chiave: g.chiave, nome: `${n + 1}. ${g.nome}`, testo: g.spiega }))" :scelte="e.gradini"
             attributo="gradino" @tocca="gradino">
        <template #sotto="{ voce }">
          <button class="prova" :data-prova-di="voce.chiave"
                  @click="provaEsercizio({ tipo: 'pozioni', famiglie: e.famiglie, gradini: [voce.chiave] }, voce.nome)">▶ Prova</button>
        </template>
      </Righe>
      <p class="nota">{{ tappe }} {{ tappe === 1 ? 'tappa' : 'tappe' }} in fila, dalla più facile; finite, si ricomincia.</p>
    </div>
  </div>
</template>

<style scoped>
/* come le scelte di ParteEsercizio.vue: `fila`, `tessera`, `scelta` e `nota` sono di maestra.css */
.parametri-pozioni { display:flex; flex-direction:column; gap:12px }
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.quanti { font-weight:400; opacity:.7; margin:0 4px }
.prova { align-self:flex-start; padding:6px 14px; border-radius:999px; border:0; background:var(--penna); color:#fff; font:inherit; font-size:13px; font-weight:700; cursor:pointer }
</style>
