<script setup>
// I capitoli del Robot per la maestra: tessere da accendere, almeno una; si giocano nell'ordine della campagna. docs/costruttore/scuola.md
import { computed } from 'vue'
import { CAPITOLI_ROBOT } from './scheda.js'
import Righe from '../../maestra/Righe.vue'

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
    <p class="nota">Il bambino scrive un programma a righe e preme ▶: il robot lo esegue e costruisce. Se il risultato è quello
      del disegno il livello è fatto, se no si corregge e si riprova.</p>
    <Righe :voci="CAPITOLI_ROBOT.map((c, i) => ({ chiave: c.chiave, nome: `${i + 1}. ${c.nome}`, icona: c.icona,
                  quanti: c.livelli === 1 ? '1 livello' : `${c.livelli} livelli`, testo: c.dice }))"
           :scelte="scelti" attributo="capitolo-robot" @tocca="capitolo" />
    <p class="nota">{{ livelli === 1 ? '1 livello' : `${livelli} livelli` }}, in fila; finiti, si ricomincia dal primo. I capitoli
      vanno in ordine: ognuno usa quello che s'impara prima, e il primo spiega da sé come si gioca.</p>
  </div>
</template>

<style scoped>
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.quanti { font-weight:400; opacity:.7; margin-left:4px }
</style>
