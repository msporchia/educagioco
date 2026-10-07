<script setup>
// Il pezzo di fumetto di chi dà le missioni (il minatore e i personaggi della terra di sopra): cosa chiede, cosa
// aspetta, cosa ti dà. Non scrive niente: dice «prendi» o «consegna» a chi lo usa (viste/Terra.vue).
// Le regole: docs/sotterraneo/missioni.md.
import { computed } from 'vue'
import { cosaDice } from '../motore/missioni.js'
import { premioDetto } from '../dati/missioni.js'

const props = defineProps({
  chi: { type: String, required: true },
  stati: { type: Object, default: () => ({}) },
  tappe: { type: Array, required: true },     // per sapere se la discesa è aperta, e come si chiama
  saluto: { type: String, default: '' },      // quando non ha niente da chiedere
})
const emit = defineEmits(['azione'])

const tappaDi = chiave => props.tappe.find(t => t.chiave === chiave) || null
const ora = computed(() => cosaDice(props.chi, props.stati, k => !!(tappaDi(k) && tappaDi(k).aperta)))
const m = computed(() => ora.value.missione)
const dove = computed(() => {
  const t = m.value && tappaDi(m.value.discesa)
  return t ? `${t.nome}, piano ${m.value.piano + 1}` : ''
})
const cosa = computed(() => (m.value ? (m.value.tipo === 'trova' ? m.value.cosa.nome : m.value.mostro.nome) : ''))
const em = computed(() => (m.value ? (m.value.tipo === 'trova' ? m.value.cosa.em : '👑') : ''))
</script>

<template>
  <div class="sot-missione" :data-missione="m ? m.id : null" :data-fase="ora.fase">
    <template v-if="ora.fase === 'offre'">
      <p class="sot-fum-detto">«{{ m.dice }}»</p>
      <p class="sot-fum-premio"><span class="em">{{ em }}</span> {{ dove }} · ti dà <b class="em">{{ premioDetto(m.premio) }}</b></p>
      <button class="sot-grosso" data-azione="prendi-missione" @click="emit('azione', m.id, 'prendi')">
        <span class="em">🤝</span> ci penso io
      </button>
    </template>
    <template v-else-if="ora.fase === 'aspetta'">
      <p class="sot-fum-detto">«Allora? {{ m.tipo === 'trova' ? 'Hai trovato' : 'Hai battuto' }} {{ cosa.charAt(0).toLowerCase() + cosa.slice(1) }}? Ricordati: {{ dove.charAt(0).toLowerCase() + dove.slice(1) }}.»</p>
      <p class="sot-fum-premio"><span class="em">{{ em }}</span> {{ cosa }} · ti dà <b class="em">{{ premioDetto(m.premio) }}</b></p>
    </template>
    <template v-else-if="ora.fase === 'consegna'">
      <p class="sot-fum-detto">«{{ m.grazie }}»</p>
      <button class="sot-grosso" data-azione="consegna" @click="emit('azione', m.id, 'consegna')">
        <span class="em">{{ em }}</span> ecco qua · <b class="em">{{ premioDetto(m.premio) }}</b>
      </button>
    </template>
    <template v-else-if="ora.fase === 'chiusa'">
      <p class="sot-fum-detto">«{{ saluto ? saluto + ' ' : '' }}Quando potrai scendere {{ tappaDi(m.discesa) ? tappaDi(m.discesa).dove : '' }}, avrei un favore da chiederti.»</p>
    </template>
    <p v-else-if="saluto" class="sot-fum-detto">«{{ saluto }}»</p>
  </div>
</template>
