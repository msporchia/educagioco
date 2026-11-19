<script setup>
// L'esercizio di English per la maestra: l'isola e le sue tappe come tessere (docs/lingue/scuola.md)
import { computed } from 'vue'
import { ISOLE } from './scheda.js'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])

const e = computed(() => props.modelValue)
const isola = computed(() => ISOLE.find(i => i.id === e.value.isola) || ISOLE[0])
const scelte = computed(() => (Array.isArray(e.value.tappe) ? e.value.tappe : []))
const conFrasi = computed(() => isola.value.tappe.some(t => t.specie === 'frasi' && scelte.value.includes(t.id)))
const manda = (id, tappe) => emit('update:modelValue', { tipo: 'inglese', isola: id, tappe })
const anno = n => (n <= 5 ? `${n}ª` : 'dopo la 5ª')

// cambiando isola si parte dalla sua prima tappa
function sceltaIsola(id) {
  if (id !== e.value.isola) manda(id, [ISOLE.find(i => i.id === id).tappe[0].id])
}
// sempre nell'ordine dell'isola, e almeno una
function tappa(id) {
  const accesa = scelte.value.includes(id)
  const dopo = isola.value.tappe.map(t => t.id).filter(k => (k === id ? !accesa : scelte.value.includes(k)))
  if (dopo.length) manda(isola.value.id, dopo)
}
</script>

<template>
  <div class="parametri-inglese">
    <div class="gruppo">
      <span class="titoletto">Quale isola</span>
      <div class="fila">
        <button v-for="i in ISOLE" :key="i.id" class="tessera" :class="{ scelta: isola.id === i.id }"
                :aria-pressed="isola.id === i.id" :title="i.insegna" :data-isola="i.id"
                @click="sceltaIsola(i.id)">{{ i.nome }} <span class="quanti">{{ anno(i.anno) }}</span></button>
      </div>
      <p class="nota">Insegna: {{ isola.insegna }}.</p>
    </div>
    <div class="gruppo">
      <span class="titoletto">Quali tappe</span>
      <div class="fila">
        <button v-for="t in isola.tappe" :key="t.id" class="tessera" :class="{ scelta: scelte.includes(t.id) }"
                :aria-pressed="scelte.includes(t.id)" :data-tappa-inglese="t.id"
                @click="tappa(t.id)"><template v-if="t.specie === 'bandiera'">🏁 </template>{{ t.nome }}
          <span v-if="t.specie === 'frasi'" class="quanti">frasi</span></button>
      </div>
      <p class="nota">{{ scelte.length === 1 ? '1 tappa' : `${scelte.length} tappe` }} in fila; finite, si ricomincia. Niente
        audio.<template v-if="conFrasi"> Le frasi usano le parole delle tappe prima: una parola che non sa, il bambino la tocca
        e legge cosa vuol dire.</template></p>
    </div>
  </div>
</template>

<style scoped>
/* come le scelte di ParteEsercizio.vue: `fila`, `tessera`, `scelta` e `nota` sono di maestra.css */
.parametri-inglese { display:flex; flex-direction:column; gap:12px }
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.quanti { font-weight:400; opacity:.7; margin-left:4px }
</style>
