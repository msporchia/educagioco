<script setup>
// La discesa: le stanze sono bottoni veri (toccabili, testabili), non cerchi
// su tela; la tela sotto tiene solo l'atmosfera (scena/caverna.js). Le due
// geometrie devono coincidere al pixel: le misure vengono da MARGINE, usate
// qui in CSS e là in canvas. La discesa è più alta dello schermo e scorre da
// sé; MA la tela resta grande quanto lo schermo e ferma (altrimenti un
// canvas da 40 file supererebbe il lato massimo che Safari su iPhone
// accetta) — le stanze, essendo DOM, non hanno quel limite e stanno nella
// discesa alta. Questa schermata non decide niente: manda solo "vado lì".
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Caverna, MARGINE, altezzaDiscesa } from '../scena/caverna.js'

const props = defineProps({
  stanze: { type: Array, required: true },     // la vetrina della corsa
  sentieri: { type: Array, default: () => [] },
  pedina: { type: Object, default: null },     // { x, y } | null
  vestito: { type: Object, required: true },   // { pietra, accento }
  piede: { type: String, default: '' },
})
const emit = defineEmits(['vai'])

const tela = ref(null)
const scorri = ref(null)      // la finestra che scorre
const discesa = ref(null)     // la discesa intera, alta quanto serve
let caverna = null
const cammina = ref(false)

// le stanze dichiarano la riga; l'ultima fila è quella del guardiano
const quanteFile = computed(() =>
  props.stanze.reduce((n, s) => Math.max(n, s.riga + 1), 1))
const alta = computed(() => `max(100%, ${altezzaDiscesa(quanteFile.value)}px)`)

// stessi margini in cui la tela disegna i sentieri
const posto = s => ({
  left: `calc(${MARGINE.lati}px + ${s.x} * (100% - ${MARGINE.lati * 2}px))`,
  bottom: `calc(${MARGINE.sotto}px + ${s.y} * (100% - ${MARGINE.sopra + MARGINE.sotto}px))`,
})

const ingressi = computed(() =>
  props.pedina ? [] : props.stanze.filter(s => s.stato === 'aperta'))

// stesso conto di Caverna.punto(), ma da qui: la tela non sa che si scorre
function inquadra(yn, dolce = true) {
  const box = scorri.value, dentro = discesa.value
  if (!box || !dentro) return
  const h = dentro.clientHeight
  const y = h - MARGINE.sotto - yn * (h - MARGINE.sopra - MARGINE.sotto)
  // chi cammina si tiene sotto il centro (la strada da scegliere sta sopra);
  // chi è appena entrato si mette al fondo, con lo stesso margine di sempre
  const quanto = props.pedina || yn > 0
    ? box.clientHeight * 0.62
    : box.clientHeight - MARGINE.sotto
  box.scrollTo({ top: Math.max(0, Math.min(h - box.clientHeight, y - quanto)),
                 behavior: dolce ? 'smooth' : 'auto' })
}

function aggiornaFetta() {
  if (!caverna || !discesa.value || !scorri.value) return
  caverna.inquadratura(discesa.value.clientHeight, scorri.value.scrollTop)
}

function tocca(s) {
  if (s.stato !== 'aperta' || cammina.value) return
  cammina.value = true
  // si sposta insieme alla pedina, non dopo: altrimenti il pezzo di camminata fuori schermo non si vedrebbe
  inquadra(s.y)
  caverna.muovi(s.partenza || { x: s.x, y: -0.14 }, { x: s.x, y: s.y }, s.curva || 0, () => {
    cammina.value = false
    emit('vai', s.id)
  })
}

onMounted(async () => {
  caverna = new Caverna(tela.value)
  caverna.vesti(props.vestito)
  caverna.mostra({ sentieri: props.sentieri, pedina: props.pedina, ingressi: ingressi.value })
  caverna.avvia()
  await nextTick()
  aggiornaFetta()
  inquadra(props.pedina?.y ?? 0, false)
  // si ascolta lo scorrimento e basta: il disegno lo rifà il fotogramma dopo, già in corso
  scorri.value?.addEventListener('scroll', aggiornaFetta, { passive: true })
})
onUnmounted(() => {
  scorri.value?.removeEventListener('scroll', aggiornaFetta)
  caverna?.ferma()
})

watch(() => [props.sentieri, props.pedina, props.stanze], () => {
  caverna?.mostra({ sentieri: props.sentieri, pedina: props.pedina, ingressi: ingressi.value })
})
// una discesa nuova (si riprova, o si cambia tappa) riparte dall'ingresso
watch(quanteFile, async () => {
  await nextTick(); aggiornaFetta(); inquadra(props.pedina?.y ?? 0, false)
})
watch(() => props.vestito, v => caverna?.vesti(v))
</script>

<template>
  <div class="dng-campo">
    <!-- fuori dalla parte che scorre: ferma, la fetta giusta gliela dice `inquadratura` -->
    <canvas ref="tela" class="dng-tela"></canvas>

    <div ref="scorri" class="dng-scorri">
      <div ref="discesa" class="dng-discesa" :style="{ height: alta }">
        <button v-for="s in stanze" :key="s.id"
                class="dng-stanza" :class="'dng-' + s.stato"
                :style="{ ...posto(s), '--dng-accento': s.colore }"
                :data-stanza="s.id" :data-tipo="s.tipo"
                :disabled="s.stato !== 'aperta'"
                :aria-label="s.stato === 'buio' ? 'stanza al buio' : s.nome"
                @click="tocca(s)">
          <span class="dng-icona em">{{ s.stato === 'buio' ? '⋯' : s.icona }}</span>
          <!-- il bollino, prima di entrarci: rende il bivio una scelta -->
          <span v-if="s.rischio && s.stato !== 'buio' && s.stato !== 'fatta'" class="dng-rischio">
            {{ '⚡'.repeat(s.rischio) }}
          </span>
          <span v-if="s.stato === 'fatta'" class="dng-spunta">✓</span>
        </button>
      </div>
    </div>

    <p class="dng-piede">{{ piede }}</p>
  </div>
</template>
