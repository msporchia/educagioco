<script setup>
// Le tappe di Castle Battle per la maestra: una sola, come scheda con le sue operazioni, il suo racconto e ▶ Prova
// (docs/arena/scuola.md). Si parte senza: finché non ce n'è una l'esercizio non è valido.
import { computed } from 'vue'
import { TAPPE_BATTAGLIA } from './scheda.js'
import Righe from '../../maestra/Righe.vue'
import { provaEsercizio } from '../../maestra/utili.js'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])
const scelte = computed(() => (props.modelValue.tappa ? [props.modelValue.tappa] : []))
const voci = TAPPE_BATTAGLIA.map(t => ({ chiave: t.chiave, nome: `${t.numero}. ${t.nome}`, icona: t.icona, quanti: t.segni,
                                        testo: `${t.posto}: ${t.operazioni}. ${t.racconto}` }))
const tappa = chiave => emit('update:modelValue', { tipo: 'battaglia', tappa: chiave })
</script>

<template>
  <div class="gruppo">
    <span class="titoletto">Quale tappa</span>
    <p class="nota">Le operazioni le portano le truppe della tappa: le prime tre solo addizioni e sottrazioni, poi arrivano le
      tabelline e le divisioni. Vinta o persa, si riparte dalla stessa tappa.</p>
    <Righe :voci="voci" :scelte="scelte" attributo="tappa-battaglia" una @tocca="tappa">
      <template #sotto="{ voce }">
        <button class="prova" :data-prova-di="voce.chiave"
                @click="provaEsercizio({ tipo: 'battaglia', tappa: voce.chiave }, voce.nome)">▶ Prova</button>
      </template>
    </Righe>
  </div>
</template>

<style scoped>
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.prova { align-self:flex-start; padding:6px 14px; border-radius:999px; border:0; background:var(--penna); color:#fff; font:inherit; font-size:13px; font-weight:700; cursor:pointer }
</style>
