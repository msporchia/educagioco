<script setup>
/* La mappa del tesoro: la tela dipinge (scena/mappa.js), qui sopra si
   mettono i nomi e i tasti, in HTML, negli stessi punti. Riceve lo stato
   già deciso e sceglie solo dove andare. Si apre scorrendo fino alla
   tappa da fare adesso. */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { disponi } from '../scena/disposizione.js'
import { dipingiMappa } from '../scena/mappa.js'

const props = defineProps({
  stato: { type: Array, required: true },      // motore/mappa.js, statoMappa
  extra: { type: Object, default: () => ({}) }, // { <mondo>: { libro, cassetto } }
  prima: { type: Boolean, default: false },     // c'è il gioco di prima da offrire
})
const emit = defineEmits(['tappa', 'libro', 'cassetto', 'prima'])

const scorre = ref(null)
const tela = ref(null)
const W = ref(0)
let occhio = null
let giaScesa = false

const quadro = computed(() => (W.value ? disponi(props.stato, W.value, m => props.extra[m]) : null))
// i mondi «passati» per età sono aperti da ripassare, ma la freccia di adesso
// sta dove c'è ancora da fare (se ce n'è)
const passati = computed(() => new Set(props.stato.filter(m => m.passato).map(m => m.id)))
const ePassato = id => passati.value.has(id)
const adessoVero = computed(() => {
  const qui = quadro.value ? quadro.value.nodi.filter(n => n.adesso) : []
  return qui.find(n => !ePassato(n.mondo)) || qui[0] || null
})

function misura() {
  if (!scorre.value) return
  W.value = Math.min(520, Math.floor(scorre.value.clientWidth))
}

function dipingi() {
  if (tela.value && quadro.value) dipingiMappa(tela.value, quadro.value)
}

function scendi() {
  if (giaScesa || !quadro.value || !scorre.value) return
  const n = adessoVero.value
  giaScesa = true
  if (n) scorre.value.scrollTop = Math.max(0, n.y - scorre.value.clientHeight * 0.42)
}

watch(quadro, async () => { await nextTick(); dipingi(); scendi() })

onMounted(() => {
  misura()
  if (typeof ResizeObserver !== 'undefined') {
    occhio = new ResizeObserver(misura)
    occhio.observe(scorre.value)
  }
})
onUnmounted(() => occhio && occhio.disconnect())

function tocca(n) {
  if (n.tipo === 'tappa') emit('tappa', n.id)
  else if (n.tipo === 'libro') emit('libro', n.mondo)
  else if (n.tipo === 'cassetto') emit('cassetto', n.mondo)
}
const chiuso = n => n.stato === 'chiusa' || n.stato === 'arrivo'
const NOMI = { libro: 'Il libro', cassetto: 'Il cassetto' }
const etichetta = n => n.tipo === 'mondo' ? 'in arrivo' : n.nome || NOMI[n.tipo]
const racconto = n => n.tipo === 'tappa'
  ? `${n.nome}: ${chiuso(n) ? 'chiusa' : `imparata ${n.grado} su 10`}`
  : `${etichetta(n)}${chiuso(n) ? ', chiuso' : ''}`
</script>

<template>
  <div ref="scorre" class="ing-mappa" data-mappa-inglese>
    <div v-if="quadro" class="ing-tavola" :style="{ width: quadro.W + 'px', height: quadro.H + 'px' }">
      <canvas ref="tela" class="ing-tela"></canvas>

      <div v-for="t in quadro.titoli" :key="'m' + t.mondo" class="ing-mondo-nome"
           :class="{ 'ing-lontano': !t.pronto, 'ing-chiuso': t.pronto && !t.aperto }"
           :data-mondo="t.mondo" :data-pronto="t.pronto ? '1' : '0'" :data-passato="ePassato(t.mondo) ? '1' : null"
           :style="{ left: t.x + 'px', top: t.y + 'px', width: Math.max(90, t.larg - 8) + 'px' }">
        {{ t.nome }}<i v-if="ePassato(t.mondo)" class="ing-passato">già fatto a scuola: da ripassare</i>
      </div>

      <template v-for="n in quadro.nodi" :key="n.chiave">
        <button type="button" class="ing-nodo" :class="'ing-' + n.stato"
                :style="{ left: (n.x - n.r - 6) + 'px', top: (n.y - n.r - 6) + 'px',
                          width: (2 * n.r + 12) + 'px', height: (2 * n.r + 12) + 'px' }"
                :disabled="chiuso(n)" :aria-label="racconto(n)"
                :data-tappa="n.tipo === 'tappa' ? n.id : null"
                :data-libro="n.tipo === 'libro' ? n.mondo : null"
                :data-cassetto="n.tipo === 'cassetto' ? n.mondo : null"
                :data-grado="n.tipo === 'tappa' ? n.grado : null"
                :data-stato="n.stato"
                @click="tocca(n)"></button>
        <span class="ing-nodo-nome" :class="{ 'ing-spento': chiuso(n) }"
              :style="{ left: n.x + 'px', top: (n.y + n.r + 9) + 'px', width: Math.min(120, n.larg) + 'px' }">
          {{ etichetta(n) }}
        </span>
        <!-- di fianco e non sopra: sopra c'è il nome del mondo, o quello della tappa prima -->
        <span v-if="n.adesso && (n === adessoVero || !ePassato(n.mondo))" class="ing-qui" aria-hidden="true"
              :style="{ left: (n.x + n.r + 10) + 'px', top: n.y + 'px' }">◀</span>
      </template>
    </div>

    <!-- chi aveva finito la campagna di prima tiene il suo gioco libero, in fondo alla mappa -->
    <button v-if="prima" type="button" class="ing-prima" data-prima @click="$emit('prima')">
      <span class="em">♾️</span>
      <span><b>Il gioco di prima</b><i>tutte le parole insieme, senza fine</i></span>
    </button>
  </div>
</template>
