<script setup>
// Il calcolo a mente degli Asteroidi per la maestra: le stazioni del gioco come schede, ognuna coi suoi conti d'esempio e
// ▶ Prova (docs/asteroidi/scuola.md). Si parte senza: finché non ce n'è una l'esercizio non è valido. Nell'ordine della fila.
import { computed } from 'vue'
import { STAZIONI_MENTE } from './scheda.js'
import Righe from '../../maestra/Righe.vue'
import { provaEsercizio } from '../../maestra/utili.js'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])
const scelte = computed(() => props.modelValue.stazioni || [])

function stazione(k) {
  const dentro = scelte.value.includes(k)
  const stazioni = STAZIONI_MENTE.map(s => s.chiave).filter(x => (x === k ? !dentro : scelte.value.includes(x)))
  emit('update:modelValue', { tipo: 'mente', stazioni })
}
</script>

<template>
  <div class="gruppo">
    <span class="titoletto">Quali conti</span>
    <p class="nota">Escono solo i conti delle stazioni scelte, mescolati.</p>
    <Righe :voci="STAZIONI_MENTE.map(s => ({ chiave: s.chiave, nome: s.nome, icona: s.icona, testo: `Per esempio ${s.esempio}` }))"
           :scelte="scelte" attributo="stazione" @tocca="stazione">
      <template #sotto="{ voce }">
        <button class="prova" :data-prova-di="voce.chiave"
                @click="provaEsercizio({ tipo: 'mente', stazioni: [voce.chiave], gioco: 'asteroidi' }, voce.nome)">▶ Prova</button>
      </template>
    </Righe>
  </div>
</template>

<style scoped>
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.prova { align-self:flex-start; padding:6px 14px; border-radius:999px; border:0; background:var(--penna); color:#fff; font:inherit; font-size:13px; font-weight:700; cursor:pointer }
</style>
