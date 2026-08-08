<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA DISCESA — la mappa del dungeon

   Le stanze sono **bottoni veri**, non cerchi su tela: si toccano col
   dito, si trovano in un test, e chi non ci vede bene può ingrandirli.
   La tela sotto tiene l'atmosfera — pietra, torce, pulviscolo, i
   sentieri curvi e la pedina che cammina — e non sa niente di regole
   (`scena/caverna.js`).

   Le due geometrie devono coincidere al pixel, o le stanze si staccano
   dai loro sentieri: le misure arrivano da un posto solo (`MARGINE`),
   qui usate in CSS e là in canvas.

   LA DISCESA È PIÙ ALTA DELLO SCHERMO. Quaranta file schiacciate in un
   telefono sono palline che si toccano: la discesa è alta quanto vuole
   (`altezzaDiscesa`) e **scorre**, e chi gioca non la scorre a mano —
   la schermata si sposta da sé su dove si è arrivati, appena comincia
   la camminata.

   MA LA TELA NO: la tela è grande quanto lo schermo e resta ferma lì,
   e a ogni scorrimento le si dice a che punto siamo (`inquadratura`).
   Un canvas alto quanto una discesa da quaranta file sarebbe tremila
   pixel per la densità dello schermo, cioè oltre il lato massimo che
   Safari su iPhone accetta: là smetterebbe di disegnare del tutto. Le
   stanze invece sono bottoni veri e stanno nella discesa alta, perché
   il DOM quel limite non ce l'ha.

   Questa schermata non decide niente: riceve stanze e sentieri già
   decisi e manda fuori un solo gesto — «vado lì». La camminata sì, è
   sua: parte quando si tocca e avvisa quando è arrivata, perché
   entrare in una stanza prima di averla raggiunta si vede.
   ═══════════════════════════════════════════════════════════════════ */
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

/* quante file ha questa discesa: la mappa non le dichiara, ma le
   stanze sì — l'ultima fila è quella del guardiano */
const quanteFile = computed(() =>
  props.stanze.reduce((n, s) => Math.max(n, s.riga + 1), 1))
const alta = computed(() => `max(100%, ${altezzaDiscesa(quanteFile.value)}px)`)

/* le stanze si piazzano dentro gli stessi margini in cui la tela
   disegna i sentieri: un solo posto in cui è scritto quanto */
const posto = s => ({
  left: `calc(${MARGINE.lati}px + ${s.x} * (100% - ${MARGINE.lati * 2}px))`,
  bottom: `calc(${MARGINE.sotto}px + ${s.y} * (100% - ${MARGINE.sopra + MARGINE.sotto}px))`,
})

const ingressi = computed(() =>
  props.pedina ? [] : props.stanze.filter(s => s.stato === 'aperta'))

/* ── inquadrare ──
   Dove si sta e la fila dopo devono essere sotto gli occhi senza che
   nessuno trascini niente. Il conto è lo stesso di `Caverna.punto()`,
   ma da qui — la tela sta dentro la discesa e non sa che si scorre. */
function inquadra(yn, dolce = true) {
  const box = scorri.value, dentro = discesa.value
  if (!box || !dentro) return
  const h = dentro.clientHeight
  const y = h - MARGINE.sotto - yn * (h - MARGINE.sopra - MARGINE.sotto)
  /* Dove tenere il punto guardato, contato dal bordo alto della
     finestra. Chi cammina si tiene sotto il centro — la strada da
     scegliere sta sopra di lui — e chi è appena entrato si mette al
     fondo della discesa, con sotto lo stesso margine che avrebbe se la
     mappa ci stesse tutta: se no la prima fila di stanze finisce sotto
     la riga che dice cosa fare. */
  const quanto = props.pedina || yn > 0
    ? box.clientHeight * 0.62
    : box.clientHeight - MARGINE.sotto
  box.scrollTo({ top: Math.max(0, Math.min(h - box.clientHeight, y - quanto)),
                 behavior: dolce ? 'smooth' : 'auto' })
}

/* la fetta di discesa che la tela deve disegnare adesso */
function aggiornaFetta() {
  if (!caverna || !discesa.value || !scorri.value) return
  caverna.inquadratura(discesa.value.clientHeight, scorri.value.scrollTop)
}

function tocca(s) {
  if (s.stato !== 'aperta' || cammina.value) return
  cammina.value = true
  /* la schermata si sposta insieme alla pedina, non dopo: se aspettasse
     la fine, il pezzo di camminata fuori dallo schermo non si vedrebbe */
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
  /* si ascolta lo scorrimento e basta: il disegno vero lo rifà il
     fotogramma dopo, che c'è già. Niente `requestAnimationFrame` in
     più e niente ridisegni fuori tempo. */
  scorri.value?.addEventListener('scroll', aggiornaFetta, { passive: true })
})
onUnmounted(() => {
  scorri.value?.removeEventListener('scroll', aggiornaFetta)
  caverna?.ferma()
})

watch(() => [props.sentieri, props.pedina, props.stanze], () => {
  caverna?.mostra({ sentieri: props.sentieri, pedina: props.pedina, ingressi: ingressi.value })
})
/* una discesa nuova (si riprova, o si cambia tappa) riparte dall'ingresso */
watch(quanteFile, async () => {
  await nextTick(); aggiornaFetta(); inquadra(props.pedina?.y ?? 0, false)
})
watch(() => props.vestito, v => caverna?.vesti(v))
</script>

<template>
  <div class="dng-campo">
    <!-- la tela sta FUORI dalla parte che scorre: è grande quanto lo
         schermo e ferma, e la fetta giusta gliela dice `inquadratura` -->
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
          <!-- il bollino dice quanto chiede quella strada, PRIMA di
               entrarci: è quello che rende il bivio una scelta -->
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
