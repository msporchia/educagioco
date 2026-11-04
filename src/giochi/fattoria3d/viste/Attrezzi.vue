<script setup>
// L'attrezzo accanto al campo toccato (docs/fattoria3d/campi.md): i semi ad arco, a pagine se non ci stanno, o il falcetto. Trascinare è il gesto:
// il gettone segue il dito e la scena fa il resto (scena3d/attrezzi.js). Un tocco su un gettone non fa niente: dice cos'è. Soglia di 16 px
// (docs/core/il-dito.md).
import { ref, computed } from 'vue'
import { COLTURE } from '../dati/colture.js'
import { livelloDellaColtura } from '../dati/livelli.js'
import { tempoBreve } from '../dati/tempo.js'
import Faccia from './Faccia.vue'
import '../stile-attrezzi.css'

const PER_PAGINA = 5, RAGGIO = 96, SOGLIA = 16
let ultimoSeme = 'grano'                    // l'arco si riapre sulla pagina dell'ultimo seme usato

const p = defineProps({
  tipo: { type: String, required: true },          // semi | falce
  x: { type: Number, required: true },             // il campo sullo schermo
  y: { type: Number, required: true },
  larghezza: { type: Number, default: 390 },
  altezza: { type: Number, default: 700 },
  seme: { type: String, default: null },           // la coltura da mostrare per prima
  livello: { type: Number, default: 1 },
})
const emit = defineEmits(['prendi', 'passa', 'lascia'])

const semi = computed(() => Object.keys(COLTURE).filter(k => livelloDellaColtura(k) <= p.livello))
const pagine = computed(() => Math.max(1, Math.ceil(semi.value.length / PER_PAGINA)))
const pagina = ref(Math.max(0, Math.floor(semi.value.indexOf(p.seme || ultimoSeme) / PER_PAGINA)))
const gettoni = computed(() => p.tipo === 'falce' ? [{ k: 'falce' }] : semi.value.slice(pagina.value * PER_PAGINA, (pagina.value + 1) * PER_PAGINA).map(k => ({ k })))
// il centro dell'arco sta dentro lo schermo anche se il campo è sul bordo
const cx = computed(() => Math.max(RAGGIO + 36, Math.min(p.larghezza - RAGGIO - 36, p.x)))
const cy = computed(() => Math.max(RAGGIO + 84, Math.min(p.altezza - 120, p.y)))
function posto(n) {
  const a = Math.PI * (1 + (n + 1) / (gettoni.value.length + 1))
  return { left: cx.value + Math.cos(a) * RAGGIO + 'px', top: cy.value + Math.sin(a) * RAGGIO + 'px' }
}

const riga = ref('')
const mano = ref(null)                      // { k, x, y } mentre il dito porta l'attrezzo
let dito = null
function giu(g, e) { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); dito = { id: e.pointerId, x: e.clientX, y: e.clientY, g, via: false } }
function muovi(e) {
  if (!dito || e.pointerId !== dito.id) return
  if (!dito.via && Math.hypot(e.clientX - dito.x, e.clientY - dito.y) > SOGLIA) {
    dito.via = true; riga.value = ''
    if (dito.g.k !== 'falce') ultimoSeme = dito.g.k
    emit('prendi', dito.g.k)
  }
  if (!dito.via) return
  mano.value = { k: dito.g.k, x: e.clientX, y: e.clientY }
  emit('passa', e.clientX, e.clientY)
}
function su(e) {
  if (!dito || e.pointerId !== dito.id) return
  const d = dito; dito = null; mano.value = null
  if (d.via) return emit('lascia')
  riga.value = d.g.k === 'falce' ? 'Trascina il falcetto sui campi pronti' : `${COLTURE[d.g.k].nome} · ⏱️ ${tempoBreve(COLTURE[d.g.k].ms)}: trascinalo sui campi vuoti`
}
function sfoglia(n) { pagina.value = (pagina.value + n + pagine.value) % pagine.value; riga.value = '' }
</script>

<template>
  <div class="f3-attrezzi" :class="{ inMano: mano }" data-f3="attrezzi" :data-tipo="tipo">
    <button v-for="(g, n) in gettoni" :key="g.k" class="gettone" :style="posto(n)" :data-seme="tipo === 'semi' ? g.k : null" :data-f3="tipo === 'falce' ? 'falce' : null"
            :aria-label="tipo === 'falce' ? 'falcetto' : COLTURE[g.k].nome" @pointerdown="giu(g, $event)" @pointermove="muovi" @pointerup="su" @pointercancel="su">
      <svg v-if="g.k === 'falce'" viewBox="0 0 64 64" aria-hidden="true"><path d="M52 7c-1 20-18 32-39 29 6 4 13 6 20 5 14-2 24-17 19-34z" fill="#d7dee6" stroke="#5c6570" stroke-width="2.5" stroke-linejoin="round" /><path d="M15 38 7 57" stroke="#8a5a33" stroke-width="8" stroke-linecap="round" /></svg>
      <Faccia v-else :k="g.k" :emoji="COLTURE[g.k].emoji" :lato="44" />
    </button>
    <template v-if="tipo === 'semi' && pagine > 1">
      <button class="pagina" :style="{ left: cx - 46 + 'px', top: cy + 6 + 'px' }" aria-label="pagina prima" data-f3="semi-prima" @click="sfoglia(-1)">«</button>
      <button class="pagina" :style="{ left: cx + 46 + 'px', top: cy + 6 + 'px' }" aria-label="pagina dopo" data-f3="semi-dopo" @click="sfoglia(1)">»</button>
    </template>
    <p v-if="riga" class="riga" :style="{ left: cx + 'px', top: cy + 44 + 'px' }" data-f3="attrezzi-riga">{{ riga }}</p>
    <div v-if="mano" class="in-mano" :style="{ left: mano.x + 'px', top: mano.y + 'px' }" aria-hidden="true">
      <svg v-if="mano.k === 'falce'" viewBox="0 0 64 64"><path d="M52 7c-1 20-18 32-39 29 6 4 13 6 20 5 14-2 24-17 19-34z" fill="#d7dee6" stroke="#5c6570" stroke-width="2.5" stroke-linejoin="round" /><path d="M15 38 7 57" stroke="#8a5a33" stroke-width="8" stroke-linecap="round" /></svg>
      <Faccia v-else :k="mano.k" :emoji="COLTURE[mano.k].emoji" :lato="52" />
    </div>
  </div>
</template>
