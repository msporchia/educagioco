<script setup>
// Il foglio degli ordini, a bacheca: bigliettini colorati appuntati su una tavola di legno (uno per posto), si tocca per sceglierne uno
// e sotto (sui tablet a destra) c'è il suo dettaglio: il cliente, il premio in esperienza ⭐ (mai monete), le merci chieste con la
// spunta o il conto, il cestino che cambia l'ordine e «Consegna». Riceve una fotografia già pronta e dice cosa si vuole con gli `emit`.
// Vedi docs/fattoria3d/ordini.md.
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import MerceBacheca from './MerceBacheca.vue'
import '../stile-bacheca.css'

const p = defineProps({
  aperto: { type: Boolean, default: false },
  perche: { type: String, default: '' },           // banco chiuso: cosa fare per aprirlo
  ordini: { type: Array, default: () => [] },      // motore.ordini(): ordine { idx, cliente, chiede, premio, tipo, pronto } | { idx, attesa, restoMs }
  messaggio: { type: String, default: '' },        // l'esito dell'ultimo tocco (manca roba, consegnato)
  traguardo: { type: Object, default: () => ({ fatte: 0, meta: 1 }) },   // le consegne fatte e la prossima soglia del traguardo
})
const emit = defineEmits(['consegna', 'cambia', 'chiudi'])

const tempo = ms => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') }
const SCELTO = ref(null)                           // il posto toccato; null = il primo consegnabile, o il primo che c'è
const scelto = computed(() => {
  const o = p.ordini.find(x => x.idx === SCELTO.value && !x.attesa)
  return o || p.ordini.find(x => x.pronto) || p.ordini.find(x => !x.attesa) || null
})
const barra = computed(() => Math.min(100, Math.round(100 * p.traguardo.fatte / Math.max(1, p.traguardo.meta))))
const storto = idx => ['-2deg', '1.5deg', '-1deg', '2deg', '-1.5deg', '1deg'][idx % 6]

// la festa: stelline che volano dal biglietto appena consegnato (CSS, col tempo: un `setTimeout` solo per toglierle)
const festa = ref(null)
let fine = 0
function consegna(o) {
  if (o.pronto) { festa.value = { idx: o.idx, via: (festa.value ? festa.value.via : 0) + 1 }; clearTimeout(fine); fine = setTimeout(() => { festa.value = null }, 1300) }
  emit('consegna', o.idx)
}
// ordini che cambiano posto non devono lasciare la scelta su un posto che non c'è più
watch(() => p.ordini.length, () => { if (SCELTO.value !== null && !p.ordini.some(x => x.idx === SCELTO.value)) SCELTO.value = null })
onBeforeUnmount(() => clearTimeout(fine))
const STELLE = Array.from({ length: 8 }, (_, i) => ({ dx: Math.round(Math.cos(i * 0.785 + 0.3) * 54), dy: Math.round(Math.sin(i * 0.785 + 0.3) * 46) - 14, ritardo: i * 35 }))
</script>

<template>
  <div class="f3-foglio f3-colonna f3-bac" data-f3="banco">
    <header class="f3-bac-asse">
      <div v-if="aperto" class="f3-bac-conta" data-f3="ordini-conta" :aria-label="'consegne ' + traguardo.fatte + ' su ' + traguardo.meta">
        <span>Consegne {{ traguardo.fatte }}/{{ traguardo.meta }}</span>
        <i><u :style="{ width: barra + '%' }"></u></i>
      </div>
      <h2>Gli ordini</h2>
    </header>
    <button class="f3-chiudi f3-bac-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo">
      <p v-if="!aperto" class="f3-messaggio" data-f3="banco-chiuso">{{ perche }}</p>
      <div v-else class="f3-bac-scheda">
        <div class="f3-bac-tavola" data-f3="bacheca-tavola">
          <div v-for="o in ordini" :key="o.idx" class="f3-bac-casella">
            <Transition name="f3-bac-b" mode="out-in">
              <div v-if="o.attesa" :key="'a' + o.idx" class="f3-bac-bigl attesa" :style="{ '--r': storto(o.idx) }" :data-ordine="o.idx" data-pronto="false">
                <i class="puntina" aria-hidden="true"></i>
                <b>Posto libero</b>
                <small data-f3="ordine-attesa">Torna fra {{ tempo(o.restoMs) }}</small>
              </div>
              <button v-else :key="o.id" type="button" class="f3-bac-bigl" :class="[o.tipo, { sel: scelto && scelto.idx === o.idx, pronto: o.pronto }]"
                      :style="{ '--r': storto(o.idx) }" :data-ordine="o.idx" :data-pronto="!!o.pronto" :data-sel="!!(scelto && scelto.idx === o.idx)"
                      data-f3="biglietto" :aria-label="o.cliente.nome + ', ' + o.premio + ' stelle'" @click="SCELTO = o.idx">
                <i class="puntina" aria-hidden="true"></i>
                <span class="em" aria-hidden="true">{{ o.cliente.emoji }}</span>
                <b class="stella">+{{ o.premio }} ⭐</b>
                <span v-if="o.pronto" class="spunta" aria-hidden="true">✓</span>
                <i v-else-if="o.senzaMacchina.length" class="f3-esclama" data-f3="ordine-esclama" aria-label="serve una macchina">!</i>
              </button>
            </Transition>
            <span v-if="festa && festa.idx === o.idx" :key="festa.via" class="f3-bac-festa" aria-hidden="true">
              <i v-for="(s, n) in STELLE" :key="n" :style="{ '--dx': s.dx + 'px', '--dy': s.dy + 'px', animationDelay: s.ritardo + 'ms' }">⭐</i>
            </span>
          </div>
        </div>

        <div class="f3-bac-dettaglio" data-f3="dettaglio" :data-dettaglio="scelto ? scelto.idx : ''">
          <p v-if="messaggio" class="f3-messaggio" data-f3="banco-msg">{{ messaggio }}</p>
          <div v-if="scelto" class="f3-bac-carta">
            <div class="f3-bac-chi">
              <span class="ritratto" aria-hidden="true">{{ scelto.cliente.emoji }}</span>
              <span class="nome"><b>{{ scelto.cliente.nome }}</b><span class="premio" data-f3="premio">+{{ scelto.premio }} ⭐</span></span>
              <button type="button" class="cestino" data-f3="cambia" aria-label="cambia ordine" @click="$emit('cambia', scelto.idx)">🗑️</button>
            </div>
            <div class="f3-bac-merci">
              <div v-for="c in scelto.chiede" :key="c.k" class="merce" :class="c.manca ? 'manca' : 'ok'" :data-chiede="c.k">
                <MerceBacheca :k="c.k" :emoji="c.emoji" :n="c.n" />
                <span v-if="!c.manca" class="segno" aria-label="c'è">✓</span>
                <small v-else>{{ c.ha }}/{{ c.n }}</small>
              </div>
            </div>
            <p v-for="mc in scelto.senzaMacchina" :key="mc.tipo" class="f3-bac-serve" data-f3="ordine-serve" :data-macchina="mc.tipo">
              <i class="f3-esclama" aria-hidden="true">!</i> Serve {{ mc.art }} {{ mc.nome }} <span class="em" aria-hidden="true">{{ mc.emoji }}</span>
            </p>
            <!-- aria-disabled e non disabled: un tasto spento non si tocca, e toccarlo deve dire cosa manca -->
            <button type="button" class="consegna" :class="{ spenta: !scelto.pronto }" :aria-disabled="!scelto.pronto" :data-puoi="scelto.pronto"
                    data-f3="consegna" @click="consegna(scelto)"><span aria-hidden="true">🚜</span> Consegna</button>
          </div>
          <p v-else class="f3-bac-vuoto">I clienti tornano fra poco.</p>
        </div>
        <p class="f3-nota f3-bac-nota">Ogni consegna dà esperienza ⭐, non monete. Il cestino manda via l'ordine, ma il posto resta vuoto per qualche minuto.</p>
      </div>
    </div>
  </div>
</template>
