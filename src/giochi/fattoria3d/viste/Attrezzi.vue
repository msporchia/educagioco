<script setup>
// Quello che si trascina, accanto alla cosa toccata: i semi ad arco, a pagine se non ci stanno, o il falcetto (docs/fattoria3d/campi.md); i cibi sulla ciotola, gli animali
// sulla tinozza, il mangime nella nuvoletta di un recinto (docs/fattoria3d/cura-sul-prato.md). Trascinare è il gesto: il gettone segue il dito e la scena fa il resto
// (scena3d/attrezzi.js). Un tocco su un seme dice cos'è; sugli altri li mette dentro, perché chi ha quattro anni trascina male. Soglia di 16 px (docs/core/il-dito.md).
import { ref, computed, watch } from 'vue'
import { COLTURE } from '../dati/colture.js'
import { livelloDellaColtura } from '../dati/livelli.js'
import { tempoBreve } from '../dati/tempo.js'
import Faccia from './Faccia.vue'
import { zittisciIlFantasma } from './dito-soglie.js'
import '../stile-attrezzi.css'

const PER_PAGINA = 5, RAGGIO = 96, SOGLIA = 16
let ultimoSeme = 'grano'                    // l'arco si riapre sulla pagina dell'ultimo seme usato

const p = defineProps({
  tipo: { type: String, required: true },          // semi | falce | ciotola | tinozza | recinto
  x: { type: Number, required: true },             // la cosa sullo schermo
  y: { type: Number, required: true },
  id: { type: Number, default: 0 },
  bestia: { type: String, default: '' },
  larghezza: { type: Number, default: 390 },
  altezza: { type: Number, default: 700 },
  seme: { type: String, default: null },           // la coltura da mostrare per prima
  livello: { type: Number, default: 1 },
  voci: { type: Array, default: () => [] },        // ciotola, tinozza, recinto: [{ id, k, nome, emoji, prezzo, n, ok, vuole }]
  riga: { type: String, default: '' },             // quello che si legge appena si apre
  sopra: { type: Boolean, default: false },        // quello in mano è sopra il bersaglio
  scorta: { type: Function, default: () => 0 },    // quanti ne hai di un raccolto
  anteprima: { type: Function, default: null },
  anteprimaPronta: { type: Function, default: null },
})
const emit = defineEmits(['prendi', 'passa', 'lascia', 'metti'])

const semi = computed(() => Object.keys(COLTURE).filter(k => livelloDellaColtura(k) <= p.livello))
const lista = computed(() => p.tipo === 'falce' ? [{ k: 'falce', chi: 'falce' }]
  : p.tipo === 'semi' ? semi.value.map(k => ({ k, chi: k, nome: COLTURE[k].nome, emoji: COLTURE[k].emoji }))
    : p.voci.map(v => ({ ...v, chi: v.id, k: v.k || v.id })))
const pagine = computed(() => Math.max(1, Math.ceil(lista.value.length / PER_PAGINA)))
const pagina = ref(p.tipo === 'semi' ? Math.max(0, Math.floor(semi.value.indexOf(p.seme || ultimoSeme) / PER_PAGINA)) : 0)
const gettoni = computed(() => lista.value.slice(pagina.value * PER_PAGINA, (pagina.value + 1) * PER_PAGINA))
// il centro dell'arco sta dentro lo schermo anche se la cosa è sul bordo
const cx = computed(() => Math.max(RAGGIO + 36, Math.min(p.larghezza - RAGGIO - 36, p.x)))
const cy = computed(() => Math.max(RAGGIO + 84, Math.min(p.altezza - 120, p.y)))
function posto(n) {
  const a = Math.PI * (1 + (n + 1) / (gettoni.value.length + 1))
  return { left: cx.value + Math.cos(a) * RAGGIO + 'px', top: cy.value + Math.sin(a) * RAGGIO + 'px' }
}
const conto = g => p.tipo === 'falce' ? '' : p.tipo === 'semi' ? p.scorta(g.k) : p.tipo === 'tinozza' ? g.nome : g.n != null ? '×' + g.n : '🪙' + g.prezzo

// i ritratti degli animali, sulla tinozza
const foto = ref({})
watch(() => p.voci, l => {
  if (p.tipo !== 'tinozza') return
  for (const b of l) {
    const t = 'bestia:' + b.id, pronta = p.anteprimaPronta && p.anteprimaPronta(t)
    if (pronta) foto.value = { ...foto.value, [b.id]: pronta }
    else if (p.anteprima) p.anteprima(t).then(u => { if (u) foto.value = { ...foto.value, [b.id]: u } }, () => {})
  }
}, { immediate: true })

const riga = ref(p.riga)
const mano = ref(null)                      // { g, x, y } mentre il dito porta l'attrezzo
let dito = null
function giu(g, e) { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); dito = { id: e.pointerId, x: e.clientX, y: e.clientY, g, via: false } }
function muovi(e) {
  if (!dito || e.pointerId !== dito.id) return
  if (!dito.via && dito.g.ok !== false && Math.hypot(e.clientX - dito.x, e.clientY - dito.y) > SOGLIA) {
    dito.via = true; riga.value = ''
    if (p.tipo === 'semi') ultimoSeme = dito.g.k
    emit('prendi', dito.g.chi)
  }
  if (!dito.via) return
  mano.value = { g: dito.g, x: e.clientX, y: e.clientY }
  emit('passa', e.clientX, e.clientY)
}
function su(e) {
  if (!dito || e.pointerId !== dito.id) return
  const d = dito; dito = null; mano.value = null
  if (e.pointerType !== 'mouse') zittisciIlFantasma(e.clientX, e.clientY)      // il gettone sparisce: sotto può esserci il cartello che compra una bestia
  if (d.via) return emit('lascia')
  if (p.tipo === 'falce') riga.value = 'Trascina il falcetto sui campi pronti'
  else if (p.tipo === 'semi') riga.value = `${d.g.nome} · ⏱️ ${tempoBreve(COLTURE[d.g.k].ms)}: trascinalo sui campi vuoti`
  else if (d.g.ok === false) riga.value = d.g.prezzo ? `Servono 🪙 ${d.g.prezzo}` : `${d.g.nome}: non ne hai`
  else emit('metti', d.g.chi)
}
function sfoglia(n) { pagina.value = (pagina.value + n + pagine.value) % pagine.value; riga.value = '' }
</script>

<template>
  <div class="f3-attrezzi" :class="{ inMano: mano }" data-f3="attrezzi" :data-tipo="tipo">
    <button v-for="(g, n) in gettoni" :key="g.chi" class="gettone" :class="{ vuole: g.vuole, manca: g.ok === false, nuvola: tipo === 'recinto' }" :style="posto(n)"
            :data-seme="tipo === 'semi' ? g.k : null" :data-f3="tipo === 'falce' ? 'falce' : null" :data-cibo="tipo === 'ciotola' || tipo === 'recinto' ? g.chi : null"
            :data-sporca="tipo === 'tinozza' ? g.chi : null" :data-vuole="g.vuole || null" :aria-label="tipo === 'falce' ? 'falcetto' : g.nome"
            @pointerdown="giu(g, $event)" @pointermove="muovi" @pointerup="su" @pointercancel="su">
      <svg v-if="g.k === 'falce'" viewBox="0 0 64 64" aria-hidden="true"><path d="M52 7c-1 20-18 32-39 29 6 4 13 6 20 5 14-2 24-17 19-34z" fill="#d7dee6" stroke="#5c6570" stroke-width="2.5" stroke-linejoin="round" /><path d="M15 38 7 57" stroke="#8a5a33" stroke-width="8" stroke-linecap="round" /></svg>
      <img v-else-if="foto[g.chi]" :src="foto[g.chi]" alt="" draggable="false">
      <Faccia v-else :k="g.k" :emoji="g.emoji" :lato="44" />
      <em v-if="conto(g) !== ''" class="conto" data-f3="gettone-conto">{{ conto(g) }}</em>
    </button>
    <template v-if="pagine > 1">
      <button class="pagina" :style="{ left: cx - 46 + 'px', top: cy + 6 + 'px' }" aria-label="pagina prima" data-f3="semi-prima" @click="sfoglia(-1)">«</button>
      <button class="pagina" :style="{ left: cx + 46 + 'px', top: cy + 6 + 'px' }" aria-label="pagina dopo" data-f3="semi-dopo" @click="sfoglia(1)">»</button>
    </template>
    <p v-if="riga" class="riga" :style="{ left: cx + 'px', top: cy + 44 + 'px' }" data-f3="attrezzi-riga">{{ riga }}</p>
    <div v-if="mano" class="in-mano" :class="{ sopra }" :style="{ left: mano.x + 'px', top: mano.y + 'px' }" aria-hidden="true">
      <svg v-if="mano.g.k === 'falce'" viewBox="0 0 64 64"><path d="M52 7c-1 20-18 32-39 29 6 4 13 6 20 5 14-2 24-17 19-34z" fill="#d7dee6" stroke="#5c6570" stroke-width="2.5" stroke-linejoin="round" /><path d="M15 38 7 57" stroke="#8a5a33" stroke-width="8" stroke-linecap="round" /></svg>
      <img v-else-if="foto[mano.g.chi]" :src="foto[mano.g.chi]" alt="" draggable="false">
      <Faccia v-else :k="mano.g.k" :emoji="mano.g.emoji" :lato="52" />
    </div>
  </div>
</template>
