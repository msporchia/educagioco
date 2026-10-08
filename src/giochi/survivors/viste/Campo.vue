<script setup>
// Il campo di battaglia: consegna il suo canvas a chi lo deve dipingere
// (emit('tela')) e trasforma il dito in una direzione. Il dito non è
// un bersaglio ma un verso: si tiene premuto e si trascina verso dove
// si vuole andare (non sopra l'eroe, o lo coprirebbe).
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  cruscotto: { type: Object, required: true },
  buio: { type: Boolean, default: false },
  dritta: { type: Boolean, default: true },     // «tieni premuto e trascina»
})
const emit = defineEmits(['tela', 'muovi', 'bomba', 'potenzia'])

const tela = ref(null)
const dito = ref(false)

// prima del traguardo conta alla rovescia; dopo non c'è più niente da
// raggiungere, conta in su (il tempo regalato)
const orologio = computed(() => {
  const c = props.cruscotto
  const s = Math.max(0, Math.ceil(c.oltre ? c.extra : c.infinita ? c.tempo : c.restano))
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
})
const cuori = computed(() =>
  Array.from({ length: props.cruscotto.cuoriMax }, (_, i) => i < props.cruscotto.cuori))

function verso(e) {
  const t = tela.value
  if (!t) return
  const r = t.getBoundingClientRect()
  const dx = (e.clientX - r.left) - r.width / 2
  const dy = (e.clientY - r.top) - r.height / 2
  // un dito appoggiato in mezzo non è un ordine: l'eroe resta fermo invece di tremare
  if (Math.hypot(dx, dy) < 10) return emit('muovi', 0, 0)
  emit('muovi', dx, dy)
}

function giu(e) {
  dito.value = true
  try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* pazienza */ }
  verso(e)
}
const muove = e => { if (dito.value) verso(e) }
const su = () => { dito.value = false; emit('muovi', 0, 0) }

// le frecce, per chi gioca al computer (e per i test, che girano senza dito)
const tasti = new Set()
const FRECCE = {
  ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0],
  ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1],
}
function daTastiera() {
  let dx = 0, dy = 0
  for (const k of tasti) { dx += FRECCE[k][0]; dy += FRECCE[k][1] }
  emit('muovi', dx, dy)
}
const premuto = e => {
  if (e.key === ' ' && !e.repeat) { e.preventDefault(); emit('bomba'); return }
  if (e.key === 'Enter' && !e.repeat) { e.preventDefault(); emit('potenzia'); return }
  if (FRECCE[e.key] && !dito.value) { tasti.add(e.key); daTastiera() }
}
const mollato = e => { if (tasti.delete(e.key)) daTastiera() }

onMounted(() => {
  emit('tela', tela.value)
  addEventListener('keydown', premuto)
  addEventListener('keyup', mollato)
})
onUnmounted(() => {
  removeEventListener('keydown', premuto)
  removeEventListener('keyup', mollato)
})
</script>

<template>
  <div class="sv-campo" :class="{ 'sv-buio': buio }"
       @pointerdown="giu" @pointermove="muove" @pointerup="su" @pointercancel="su">
    <canvas ref="tela" class="sv-tela"></canvas>

    <div class="sv-cruscotto">
      <div class="sv-riga">
        <div class="sv-cuori em">
          <span v-for="(pieno, i) in cuori" :key="i" :class="{ 'sv-spento': !pieno }">❤️</span>
        </div>
        <div class="sv-spazio"></div>
        <div class="sv-gettone em" :class="{ 'sv-oltre': cruscotto.oltre }">
          {{ cruscotto.oltre ? '🔥' : '⏱️' }} <b>{{ orologio }}</b>
        </div>
        <div class="sv-gettone em">💀 <b>{{ cruscotto.uccisi }}</b></div>
      </div>
      <div class="sv-barra"><i :style="{ width: (cruscotto.quota * 100) + '%' }"></i></div>
      <div class="sv-livello">LIVELLO {{ cruscotto.livello }}</div>
    </div>

    <div v-if="dritta" class="sv-dritta em">tieni premuto e trascina 👆</div>

    <!-- i potenziamenti messi da parte salendo di livello: le carte si
         aprono quando lo decide chi gioca, non a ogni livello -->
    <button v-if="cruscotto.daSpendere > 0" class="sv-potenzia em" data-potenzia
            @pointerdown.stop.prevent="emit('potenzia')">
      ⬆️ <span>potenzia</span><b>{{ cruscotto.daSpendere }}</b>
    </button>

    <!-- la bomba: il tocco si ferma qui, non deve muovere l'eroe -->
    <button v-if="cruscotto.bombe > 0" class="sv-bomba em" data-bomba
            @pointerdown.stop.prevent="emit('bomba')">
      💣<b v-if="cruscotto.bombe > 1">{{ cruscotto.bombe }}</b>
    </button>

    <div class="sv-presi em">
      <span v-for="p in cruscotto.presi" :key="p.chiave">
        {{ p.icona }}<sub v-if="p.quante > 1">{{ p.quante }}</sub>
      </span>
    </div>
  </div>
</template>
