<script setup>
// Il pezzo di fumetto di chi dà le missioni (il minatore e i personaggi della terra di sopra): per ognuna delle
// sue missioni aperte cosa chiede, cosa aspetta, cosa ti dà. Non scrive niente: dice «prendi» o «consegna» a chi lo
// usa (viste/Terra.vue). Le regole: docs/sotterraneo/missioni.md.
import { computed } from 'vue'
import { cosaDice, inFrase } from '../motore/missioni.js'
import { premioDetto } from '../dati/missioni.js'

const props = defineProps({
  chi: { type: String, required: true },
  stati: { type: Object, default: () => ({}) },
  tappe: { type: Array, required: true },     // per sapere se la discesa è aperta, e come si chiama
  saluto: { type: String, default: '' },      // quando non ha niente da chiedere
})
const emit = defineEmits(['azione'])

const tappaDi = chiave => props.tappe.find(t => t.chiave === chiave) || null
const ora = computed(() => cosaDice(props.chi, props.stati, props.tappe))
const dove = m => {
  const t = tappaDi(m.discesa)
  return t ? `${t.nome}, piano ${m.piano + 1}` : ''
}
const cosa = m => (m.tipo === 'trova' ? m.cosa.nome : m.mostro.nome)
const em = m => (m.tipo === 'trova' ? m.cosa.em : '👑')
const minuscolo = s => s.charAt(0).toLowerCase() + s.slice(1)
</script>

<template>
  <div class="sot-missioni">
    <div v-for="v in ora.voci" :key="v.missione.id" class="sot-missione" :data-missione="v.missione.id" :data-fase="v.fase">
      <template v-if="v.fase === 'offre'">
        <p class="sot-fum-detto">«{{ v.missione.dice }}»</p>
        <p class="sot-fum-premio"><span class="em">{{ em(v.missione) }}</span> {{ dove(v.missione) }} · ti dà <b class="em">{{ premioDetto(v.missione.premio) }}</b></p>
        <button class="sot-grosso" data-azione="prendi-missione" @click="emit('azione', v.missione.id, 'prendi')">
          <span class="em">🤝</span> ci penso io
        </button>
      </template>
      <template v-else-if="v.fase === 'aspetta'">
        <p class="sot-fum-detto">«Allora? {{ v.missione.tipo === 'trova' ? 'Hai trovato' : 'Hai battuto' }} {{ inFrase(cosa(v.missione)) }}? Ricordati: {{ minuscolo(dove(v.missione)) }}.»</p>
        <p class="sot-fum-premio"><span class="em">{{ em(v.missione) }}</span> {{ cosa(v.missione) }} · ti dà <b class="em">{{ premioDetto(v.missione.premio) }}</b></p>
      </template>
      <template v-else>
        <p class="sot-fum-detto">«{{ v.missione.grazie }}»</p>
        <button class="sot-grosso" data-azione="consegna" @click="emit('azione', v.missione.id, 'consegna')">
          <span class="em">{{ em(v.missione) }}</span> ecco qua · <b class="em">{{ premioDetto(v.missione.premio) }}</b>
        </button>
      </template>
    </div>
    <p v-if="!ora.voci.length && saluto" class="sot-fum-detto" data-fase="saluto">«{{ saluto }}»</p>
  </div>
</template>
