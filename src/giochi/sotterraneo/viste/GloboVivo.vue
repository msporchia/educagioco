<script setup>
// Il globo vivo della barra, col tema dei pannelli (docs/sotterraneo/barra.md, «I globi vivi»): lo stesso contratto di
// Globo.vue (data-globo, data-quota, il numero in HTML), ma il vetro è un canvas piccolo dipinto dalla strada A (canvas 2D)
// o B (WebGL, `modo: '3d'`, con ripiego su A). Il liquido scende con un ritardo morbido, sale con le bolle, si muove solo
// quando cambia qualcosa: fermo, nessun fotogramma. La scossa e il battito del cuore sono CSS sul guscio, non ridisegni
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { StatoGlobo } from './globo/stato.js'
import { dipingi2d } from './globo/pittore2d.js'
import { dipingi3d } from './globo/pittore3d.js'

const props = defineProps({
  tipo: { type: String, required: true },      // 'vita' | 'energia'
  quota: { type: Number, default: 0 },
  numero: { type: [String, Number], default: '' },
  guizza: { type: Boolean, default: false },
  colpito: { type: Boolean, default: false },
  acceso: { type: Boolean, default: false },
  etichetta: { type: String, default: '' },
  modo: { type: String, default: '2d' },       // '2d' (strada A) | '3d' (strada B)
})
const pieno = computed(() => Math.max(0, Math.min(1, props.quota)))
// la vita bassa batte come un cuore (CSS); l'energia spesa pulsa
const batte = computed(() => props.tipo === 'vita' && pieno.value > 0 && pieno.value < 0.3)
const pulsa = ref(false)

const tela = ref(null)
const stato = new StatoGlobo(pieno.value)
let raf = 0, prima = 0, lato = 0, spento = false

function misura() {
  const el = tela.value
  if (!el) return
  const l = Math.max(16, Math.round(el.clientWidth * Math.min(2, devicePixelRatio || 1)))
  if (l !== lato) { lato = l; el.width = l; el.height = l }
}
function disegna() {
  const el = tela.value
  if (!el || !lato) return
  const ctx = el.getContext('2d')
  const f = stato.fotogramma()
  if (!(props.modo === '3d' && dipingi3d(ctx, lato, props.tipo, f))) dipingi2d(ctx, lato, props.tipo, f)
}
function passo(ora) {
  raf = 0
  const dt = Math.min(0.05, (ora - prima) / 1000)
  prima = ora
  const ancora = stato.avanza(dt)
  disegna()
  if (ancora && !spento && document.visibilityState !== 'hidden') raf = requestAnimationFrame(passo)
}
function sveglia() {
  if (raf || spento) return
  prima = performance.now()
  raf = requestAnimationFrame(passo)
}

let pulsaFino = 0
watch(pieno, (q, prima) => {
  stato.imposta(q, props.tipo)
  if (props.tipo === 'energia' && q < prima) { pulsa.value = false; requestAnimationFrame(() => { pulsa.value = true }); clearTimeout(pulsaFino); pulsaFino = setTimeout(() => { pulsa.value = false }, 600) }
  sveglia()
})
watch(() => props.modo, () => { disegna() })
const torna = () => { if (document.visibilityState !== 'hidden') sveglia() }
let osserva = null
onMounted(() => {
  misura(); disegna(); sveglia()
  if (typeof ResizeObserver === 'function') { osserva = new ResizeObserver(() => { misura(); disegna() }); osserva.observe(tela.value) }
  document.addEventListener('visibilitychange', torna)
})
onBeforeUnmount(() => {
  spento = true
  cancelAnimationFrame(raf)
  clearTimeout(pulsaFino)
  if (osserva) osserva.disconnect()
  document.removeEventListener('visibilitychange', torna)
})
</script>

<template>
  <div class="sot-globo sot-globo-vivo" :class="['sot-globo-' + tipo, { 'sot-guizza': guizza, 'sot-colpito': colpito, 'sot-acceso': acceso,
                                                   'sot-batte': batte, 'sot-pulsa': pulsa }]"
       :data-globo="tipo" :data-quota="pieno.toFixed(2)" :data-guizza="guizza ? 1 : null" :data-modo="modo"
       role="img" :aria-label="etichetta">
    <span class="sot-globo-vetro"><canvas ref="tela" class="sot-globo-tela" aria-hidden="true"></canvas></span>
    <b v-if="numero !== ''" class="sot-globo-numero">{{ numero }}</b>
  </div>
</template>
