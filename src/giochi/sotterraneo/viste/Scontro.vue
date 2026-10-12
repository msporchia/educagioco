<script setup>
// Lo scontro a gruppi (docs/sotterraneo/scontro.md, «La vista»), sul fondale vero dello scenario: l'eroe a sinistra con un
// posto vuoto sotto per il compagno, i mostri a destra in una o due file (il grosso grande al centro), la fila dei turni in
// una colonna sul bordo destro. Sotto ogni mostro la sua barra della vita, senza numeri (il brivido di non sapere quanto
// resiste), e sopra «ti colpisce 3». Toccando un mostro lo si fa bersaglio. Non calcola niente: riceve i numeri già fatti
// dal motore (viste/campo.js) e il racconto del turno che si sta facendo (viste/racconto.js, `fx`).
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { CIECA } from '../../pausa.js'
import { PEZZI } from '../dati/atlante.js'
import Icona from './Icona.vue'
import Grosso from './Grosso.vue'
import Glifo from './Glifo.vue'
import Palco from './Palco.vue'
import FilaDeiTurni from './FilaDeiTurni.vue'

const props = defineProps({
  mostri: { type: Array, required: true },    // [{ i, nome, sprite, em, grosso, chiave, ossa, ossaMax, morto, stati, colpisce, salta, bersaglio, colpito }] nell'ordine dei posti
  posti: { type: Object, required: true },    // { file, grande, celle: [{ col, riga, file }] }
  turni: { type: Array, default: () => [] },  // [{ chi: 'eroe' | posto, salta }]: i prossimi sette
  apertura: { type: Object, default: () => ({}) },
  palco: { type: Object, default: () => ({}) },   // lo scenario vero: { pavimento, faccia, roccia }
  eroe: { type: Object, default: () => ({}) },   // { sprite, em, vita, vitaMax }
  mie: { type: Array, default: () => [] },     // cosa protegge l'eroe in questo scontro (scudo, parato…)
  fx: { type: Object, required: true },        // il racconto di adesso (viste/racconto.js)
})
const emit = defineEmits(['bersaglio', 'accorcia'])

/* ── le misure: gli sprite hanno una scala intera (pixel nitidi), scelta su quanto è largo il palco ── */
const duello = ref(null)
const larg = ref(352)
let osserva = null
onMounted(() => {
  if (duello.value && typeof ResizeObserver !== 'undefined') {
    osserva = new ResizeObserver(([e]) => { larg.value = Math.round(e.contentRect.width) })
    osserva.observe(duello.value)
  }
  liberoDa = performance.now() + CIECA
})
onUnmounted(() => osserva && osserva.disconnect())

const quanti = computed(() => props.mostri.length)
const scalaEroe = computed(() => (quanti.value <= 2 ? 4 : 3))
const lEroe = computed(() => 16 * scalaEroe.value + 18)    // quanto spazio prende a sinistra
const lFila = 44                                            // e la colonna dei turni a destra
const cella = computed(() => (larg.value - lEroe.value - lFila) / 3)   // sei colonne a due a due: tre mostri per fila
const larghissimo = computed(() => Math.max(16, ...props.mostri.filter(m => !m.grosso).map(m => (PEZZI[m.sprite] ? PEZZI[m.sprite][2] : 16))))
const scalaM = computed(() => {
  const n = quanti.value, tetto = props.posti.grande >= 0 ? 2 : n === 1 ? 5 : n <= 3 ? 4 : 3   // col grosso gli altri si fanno piccoli
  return Math.max(2, Math.min(tetto, Math.floor((cella.value - 4) / larghissimo.value)))
})
const scalaGrosso = computed(() => Math.max(2, Math.min(4, Math.floor(cella.value * 1.7 / 32))))
const stretto = computed(() => cella.value < 72)   // tre per fila a 320 px: la riga della minaccia si accorcia
const barra = computed(() => (quanti.value === 1 ? 96 : Math.min(64, Math.round(cella.value - 14))))

const celleDi = computed(() => props.mostri.map((m, k) => {
  const c = props.posti.celle[k]
  return { gridColumn: `${c.col} / span 2`, gridRow: `${c.riga} / span ${c.file}` }
}))

/* ── cosa si vede di ognuno: durante il racconto le ossa e i caduti sono quelli di quel momento, non ancora quelli veri ── */
const ossaDi = m => (props.fx.attivo && props.fx.ossa[m.i] != null ? props.fx.ossa[m.i] : m.ossa)
const mortoDi = m => (props.fx.attivo ? !!props.fx.morti[m.i] : m.morto)
const effettoDi = chi => props.fx.effetto[chi]
const classeFx = chi => (effettoDi(chi) ? 'sot-fx-' + effettoDi(chi).tipo : '')
const chiaveFx = chi => chi + '-' + (effettoDi(chi) ? effettoDi(chi).n : 0)
const numeriDi = chi => props.fx.numeri.filter(n => n.su === chi)
const pulita = m => !props.fx.attivo && !mortoDi(m)
const soloMiaUna = computed(() => props.mostri.filter(m => m.colpito).length > 1)
const addosso = m => m.stati.map(x => 'sot-addosso-' + (x.fuoco ? 'fuoco' : x.chiave))
const protetto = computed(() => props.mie.some(x => ['parato', 'scudo', 'intoccabile', 'specchio'].includes(x.chiave)))
const guarisce = computed(() => props.mie.some(x => x.chiave === 'linfa'))
const tintaEroe = computed(() => (props.fx.nome ? { '--tinta': props.fx.nome.tinta } : null))

/* ── il tocco ──
   Durante il racconto un tocco lo accorcia. Fuori, toccare un mostro lo fa bersaglio: ma non nei primi 320 ms (il click che
   il dito si lascia dietro alla risposta atterrerebbe proprio qui, docs/core/il-dito.md) */
let liberoDa = 0
watch(() => props.fx.attivo, v => { if (!v) liberoDa = performance.now() + CIECA })
function sulDuello() { if (props.fx.attivo) emit('accorcia') }
function tocca(m) {
  if (props.fx.attivo) { emit('accorcia'); return }
  if (performance.now() < liberoDa || mortoDi(m)) return
  emit('bersaglio', m.i)
}

/* ── il glifo che vola dall'eroe a chi colpisce: il vettore si misura sul palco, quando compare ── */
const elEroe = ref(null)
const elM = {}
function volo(v) {
  const d = duello.value && duello.value.getBoundingClientRect()
  const a = elEroe.value && elEroe.value.getBoundingClientRect()
  const b = elM[v.a] && elM[v.a].getBoundingClientRect()
  if (!d || !a || !b) return { display: 'none' }
  const x0 = a.right - d.left - 6, y0 = a.top + a.height * 0.42 - d.top
  return { left: x0 + 'px', top: y0 + 'px', '--dx': (b.left + b.width / 2 - d.left - x0) + 'px',
           '--dy': (b.top + b.height * 0.5 - d.top - y0) + 'px', '--tinta': v.tinta, '--ritardo': v.ritardo + 'ms' }
}
</script>

<template>
  <div class="sot-scontro">
    <div ref="duello" class="sot-duello" data-duello :data-file="posti.file" :data-mostri="quanti"
         :data-racconto="fx.attivo ? 'in-corso' : null" :class="{ 'sot-veloce': fx.veloce }"
         :style="{ '--ae': lEroe + 'px', '--barra': barra + 'px' }" @click="sulDuello">
      <Palco v-bind="palco" />

      <!-- l'eroe, a sinistra; sotto di lui il posto vuoto del compagno (solo il posto, niente scritta) -->
      <div ref="elEroe" class="sot-attore-eroe" data-eroe-scontro>
        <div :key="chiaveFx('eroe')" class="sot-figura sot-eroe-fig" :class="classeFx('eroe')" :style="tintaEroe">
          <div class="sot-corpo">
            <div class="sot-respira" :class="{ 'sot-protetto': protetto, 'sot-guarisce': guarisce }">
              <Icona :sprite="eroe.sprite" :em="eroe.em" :scala="scalaEroe" :emAlto="64" />
            </div>
          </div>
        </div>
        <span v-if="fx.nome" :key="'n' + fx.nome.nome" class="sot-nome-abilita" data-abilita-usata :style="{ '--tinta': fx.nome.tinta }">
          <Glifo :nome="fx.nome.glifo" :misura="14" /> {{ fx.nome.nome }}
        </span>
        <span v-for="n in numeriDi('eroe')" :key="n.id" class="sot-numero" :class="'sot-numero-' + n.tipo" data-cifra>{{ n.testo }}</span>
      </div>
      <div class="sot-compagno" data-posto-compagno aria-hidden="true"></div>

      <!-- i mostri: sei colonne, ognuno ne prende due; il grosso sta al centro e occupa le due file -->
      <div class="sot-schiera" data-campo>
        <button v-for="(m, k) in mostri" :key="m.i" :ref="el => { elM[m.i] = el }" type="button" class="sot-m"
                :class="{ 'sot-morto': mortoDi(m), 'sot-m-grosso': m.grosso, 'sot-bersaglio': pulita(m) && m.bersaglio,
                          'sot-colpito-da-me': pulita(m) && m.colpito && soloMiaUna }"
                :style="[celleDi[k], { '--f': m.colpito }]" :aria-label="m.nome" :disabled="mortoDi(m)"
                data-mostro :data-i="m.i" :data-tipo="m.tipo" :data-nome="m.nome" :data-grande="m.grosso || null"
                :data-bersaglio="pulita(m) && m.bersaglio ? '' : null" :data-colpito="pulita(m) && m.colpito ? m.colpito : null"
                :data-morto="mortoDi(m) ? '' : null" :data-porta-chiave="m.chiave ? '' : null" @click.stop="tocca(m)">
          <span class="sot-minaccia" data-minaccia :class="{ 'sot-minaccia-salta': m.salta }" :data-colpisce="m.colpisce"
                :style="{ opacity: pulita(m) ? 1 : 0 }">
            <template v-if="m.salta"><Glifo nome="stelle" :misura="11" /> salta il turno</template>
            <template v-else><span v-if="!stretto">ti </span>colpisce <b>{{ m.colpisce }}</b></template>
          </span>
          <span class="sot-m-corpo">
            <span :key="chiaveFx(m.i)" class="sot-figura sot-m-fig" :class="classeFx(m.i)">
              <span class="sot-corpo">
                <span class="sot-respira" :class="addosso(m)">
                  <Grosso v-if="m.grosso" :chi="m.grosso" :scala="scalaGrosso" />
                  <Icona v-else :sprite="m.sprite" :em="m.em" :scala="scalaM" :emAlto="48" />
                </span>
              </span>
            </span>
            <i class="sot-anello" aria-hidden="true"></i>
            <svg v-if="m.chiave" class="sot-m-chiave" viewBox="0 0 24 24" width="14" height="14" aria-label="porta la chiave" data-segno-chiave>
              <circle cx="7" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2.4" /><path d="M10 11 L20 21 M16 17 L19 14 M13 14 L16 11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
            </svg>
            <span class="sot-m-stati" data-effetti>
              <span v-for="x in m.stati" :key="x.chiave" class="sot-chip" :class="'sot-chip-' + (x.fuoco ? 'fuoco' : x.chiave)"
                    :data-stato="x.chiave" :title="x.dice"><Glifo :nome="x.glifo" :misura="12" /><b v-if="x.t">{{ x.t }}</b></span>
            </span>
            <span v-for="n in numeriDi(m.i)" :key="n.id" class="sot-numero" :class="'sot-numero-' + n.tipo" data-cifra>{{ n.testo }}</span>
          </span>
          <span class="sot-vita" data-vita :data-ossa="ossaDi(m)"><i :style="{ width: Math.max(0, ossaDi(m) / m.ossaMax * 100) + '%' }"></i></span>
        </button>
      </div>

      <FilaDeiTurni :turni="fx.fila || turni" :mostri="mostri" :eroe="eroe" />

      <!-- da lontano (arco, bacchetta) vola il colpo: l'abilità col suo simbolo e il suo colore, verso ognuno dei colpiti -->
      <span v-for="v in fx.voli" :key="v.id" class="sot-dardo" data-dardo :style="volo(v)">
        <Glifo :nome="v.glifo" :misura="30" />
      </span>

      <!-- l'agguato e la sorpresa: una riga che si vede, poi sparisce -->
      <p v-if="fx.riga" class="sot-apertura" data-apertura>{{ fx.riga }}</p>
    </div>

    <div v-if="mie.length" class="sot-stati-mie em" data-stati-eroe>
      <span v-for="x in mie" :key="x.chiave" :data-stato="x.chiave"><Glifo :nome="x.glifo" :misura="14" /> {{ x.dice }}</span>
    </div>
  </div>
</template>
