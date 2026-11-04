<script setup>
// La ciotola di un animale: cosa chiede e cosa c'è da metterci. Un gettone si trascina nella ciotola, o si tocca (chi ha quattro anni trascina male): quello che hai nelle scorte
// non costa monete, accanto ci sono sempre i cibi a monete, così non resti mai senza niente da dargli. ✕ in alto a destra. Vedi docs/fattoria3d/cura-sul-prato.md.
import { ref, computed } from 'vue'
import Faccia from './Faccia.vue'
import { SCARTO_DITO, SCARTO_MOUSE } from './dito-soglie.js'
import '../stile-bestia.css'

const props = defineProps({
  id: { type: String, required: true },
  nome: { type: String, default: '' },
  fame: { type: Boolean, default: false },
  gettoni: { type: Array, required: true },         // Cura.perLaCiotola: [{ id, nome, emoji, k, prezzo, n, ok, vuole }]
  messaggio: { type: String, default: '' },
  anteprima: { type: Function, default: null },
  anteprimaPronta: { type: Function, default: null },
})
const emit = defineEmits(['riempi', 'chiudi'])

const foto = ref(props.anteprimaPronta ? props.anteprimaPronta('ciotola_bestia') : null)
if (!foto.value && props.anteprima) props.anteprima('ciotola_bestia').then(u => { foto.value = u }, () => {})
const chiesto = computed(() => props.gettoni.find(g => g.vuole) || null)
const prezzoDi = g => (g.k ? '×' + g.n : '🪙' + g.prezzo)

// ── il dito: tocco = nella ciotola; trascinato = nella ciotola se lo lasci lì ──
const radice = ref(null), bersaglio = ref(null), presa = ref(null)
let dito = null
const sopra = (x, y) => { const r = bersaglio.value.getBoundingClientRect(); return x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 12 && y <= r.bottom + 12 }
function premi (e, g) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  dito = { id: e.pointerId, x: e.clientX, y: e.clientY, g, soglia: e.pointerType === 'mouse' ? SCARTO_MOUSE : SCARTO_DITO, trascina: false }
  try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) { /* niente */ }
}
function muovi (e) {
  if (!dito || e.pointerId !== dito.id) return
  if (!dito.trascina && Math.hypot(e.clientX - dito.x, e.clientY - dito.y) > dito.soglia) dito.trascina = true
  if (dito.trascina) { const o = radice.value.getBoundingClientRect(); presa.value = { g: dito.g, x: e.clientX - o.left, y: e.clientY - o.top - 36, su: sopra(e.clientX, e.clientY) } }
}
function lascia (e) {
  if (!dito || e.pointerId !== dito.id) return
  const { g, trascina } = dito
  dito = null; presa.value = null
  if (!trascina || sopra(e.clientX, e.clientY)) emit('riempi', g.id)
}
function annulla () { dito = null; presa.value = null }
</script>

<template>
  <div ref="radice" class="f3-foglio f3-colonna f3-bes f3-ciot" data-f3="ciotola" :data-bestia="id" @contextmenu.prevent>
    <header class="f3-bes-asse"><h2 data-f3="ciotola-nome">La ciotola di {{ nome }}</h2></header>
    <button class="f3-chiudi f3-bes-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo f3-bes-corpo">
      <div ref="bersaglio" class="f3-ciot-dentro" :class="{ sopra: presa && presa.su }" data-f3="ciotola-dentro">
        <img v-if="foto" :src="foto" alt="" draggable="false">
        <p v-if="fame && chiesto" data-f3="ciotola-chiede">{{ nome }} vorrebbe <b>{{ chiesto.emoji }} {{ chiesto.nome.toLowerCase() }}</b></p>
        <p v-else>{{ fame ? 'Ha fame!' : 'Adesso non ha fame, ma un assaggio gli fa piacere.' }}</p>
      </div>
      <div class="f3-ciot-gettoni">
        <button v-for="g in gettoni" :key="g.id" type="button" class="f3-ciot-g" :class="{ vuole: g.vuole, manca: !g.ok, inmano: presa && presa.g.id === g.id }" :data-cibo="g.id" :data-vuole="g.vuole || null"
                @pointerdown="premi($event, g)" @pointermove="muovi" @pointerup="lascia" @pointercancel="annulla">
          <Faccia :k="g.k || g.id" :emoji="g.emoji" :lato="44" /><span>{{ g.nome }}</span><em>{{ prezzoDi(g) }}</em>
        </button>
      </div>
    </div>
    <p class="f3-bes-msg" data-f3="ciotola-msg">{{ messaggio || 'Trascina qualcosa nella ciotola.' }}</p>
    <div v-if="presa" class="f3-ciot-fantasma" data-f3="trascina-fantasma" :style="{ transform: `translate(${presa.x}px, ${presa.y}px) translate(-50%, -50%)` }"><Faccia :k="presa.g.k || presa.g.id" :emoji="presa.g.emoji" :lato="52" /></div>
  </div>
</template>
