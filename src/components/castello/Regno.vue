<script setup>
/* Il regno: la mappa dipinta delle quattro isole, una per campagna, e del
   castello in mezzo con le quattro partite libere sui torrioni. L'immagine e
   i posti stanno in giochi/castello/dati/regno.js (lo rifà
   strumenti/sprite/regno-castello.py); qui sopra ci sono solo i segnalini, la
   bandierina di dove sei e il fumetto. Vedi docs/castello/regno.md. */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Fumetto from '../Fumetto.vue'
import { TORRI } from '../../data/ops.js'
import { CAMPAGNE } from '../../data/campagne-castello.js'
import { apertaQui } from '../../data/portata-giochi.js'
import { MAPPA, LARGO, POSTI, LIBERE_POSTI } from '../../giochi/castello/dati/regno.js'

const props = defineProps({
  tappe: { type: Array, required: true },
  fatte: { type: Number, default: 0 },          // quante ne ha già superate
  libera: { type: Boolean, default: false },
  libere: { type: Array, default: () => [] },   // [{ chiave, nome, emoji, primato }]
  regali: { type: Number, default: 0 },         // potenziamenti presi: uno per il castello, non per terreno
})
const emit = defineEmits(['gioca', 'libera'])

const radice = ref(null)
const W = ref(0)
const k = computed(() => W.value / LARGO)
const aperto = ref(null)          // { tipo: 'tappa', i } | { tipo: 'libera', chiave }

// il lucchetto guarda anche l'età: le tappe già passate nascono aperte,
// quelle troppo avanti restano chiuse (data/portata.js)
const aperta = i => apertaQui(props.tappe[i], i, props.fatte)
const statoDi = i => (i < props.fatte ? 'fatta' : !aperta(i) ? 'chiusa' : i === props.fatte ? 'ora' : 'aperta')

const segni = computed(() => props.tappe.map((T, i) => {
  const c = CAMPAGNE.find(x => x.id === T.campagna)
  const sue = props.tappe.filter(t => t.campagna === T.campagna)
  const n = sue.indexOf(T)
  return { T, i, n: n + 1, di: sue.length, capo: n === sue.length - 1, campagna: c ? c.nome : '',
           x: POSTI[i][0] * k.value, y: POSTI[i][1] * k.value, stato: statoDi(i) }
}))
const torrioni = computed(() => props.libere.map(l => ({
  ...l, x: LIBERE_POSTI[l.chiave][0] * k.value, y: LIBERE_POSTI[l.chiave][1] * k.value,
  stato: props.libera ? 'aperta' : 'chiusa',
})))
const qui = computed(() => segni.value.find(s => s.stato === 'ora') || null)

const scelto = computed(() => {
  const a = aperto.value
  if (!a) return null
  return a.tipo === 'tappa' ? segni.value[a.i] : torrioni.value.find(t => t.chiave === a.chiave)
})
const prima = s => (s.i > 0 ? props.tappe[s.i - 1].nome : '')

function tocca(a) {
  const s = aperto.value
  aperto.value = s && s.tipo === a.tipo && s.i === a.i && s.chiave === a.chiave ? null : a
}

const scorre = () => (radice.value ? radice.value.closest('.banco') : null)
let osserva = null
onMounted(async () => {
  const misura = () => { if (radice.value) W.value = radice.value.clientWidth }
  misura()
  osserva = new ResizeObserver(misura)
  osserva.observe(radice.value)
  // si apre su dove sei: la tappa da fare a metà schermo
  await nextTick()
  const s = scorre()
  const dove = qui.value || (props.libera ? torrioni.value[0] : segni.value[0])
  if (!s || !dove) return
  s.scrollTop = Math.max(0, radice.value.offsetTop + dove.y - s.clientHeight * 0.5)
  s.scrollLeft = Math.max(0, radice.value.offsetLeft + dove.x - s.clientWidth * 0.5)
})
onUnmounted(() => osserva && osserva.disconnect())
</script>

<template>
  <div ref="radice" class="regno" data-regno @click="aperto = null">
    <img class="fondo" :src="MAPPA" alt="" draggable="false">
    <template v-if="W">
      <div class="tappe">
        <button v-for="s in segni" :key="s.i" class="tap" :data-tappa="s.i" :data-stato="s.stato"
                :class="[s.stato, { capo: s.capo, scelta: scelto === s }]"
                :style="{ left: s.x + 'px', top: s.y + 'px' }"
                :aria-label="`${s.i + 1}. ${s.T.nome}`" @click.stop="tocca({ tipo: 'tappa', i: s.i })">
          <template v-if="s.stato === 'fatta'">✓</template><template v-else>{{ s.n }}</template>
          <span v-if="s.capo" class="corona">👑</span>
        </button>
        <button v-for="t in torrioni" :key="t.chiave" class="tap libera" :data-tappa="t.chiave"
                :data-stato="t.stato" :class="[t.stato, { scelta: scelto === t }]"
                :style="{ left: t.x + 'px', top: t.y + 'px' }"
                :aria-label="t.nome" @click.stop="tocca({ tipo: 'libera', chiave: t.chiave })">∞</button>
      </div>
      <span v-if="qui" class="qui" :style="{ left: qui.x + 'px', top: qui.y + 'px' }" data-qui></span>
      <span v-if="libera && regali" class="dote" data-regali
            :style="{ left: 512 * k + 'px', top: 880 * k + 'px' }">🎁 {{ regali }}
        {{ regali === 1 ? 'potenziamento' : 'potenziamenti' }}</span>

      <Fumetto v-if="scelto" :x="scelto.x" :y="scelto.y" :raggio="24" :limite="W" :scorre="scorre()"
               :tenue="scelto.stato === 'chiusa'" :largo="230">
        <template v-if="aperto.tipo === 'tappa'">
          <b class="titolo">{{ scelto.T.emoji }} {{ scelto.T.nome }}</b>
          <span class="riga">{{ scelto.campagna }} · {{ scelto.n }} di {{ scelto.di }}</span>
          <span class="riga">{{ scelto.T.ondate }} ondate ·
            <template v-for="t in scelto.T.torri" :key="t">{{ TORRI[t].emoji }}</template></span>
          <span v-if="scelto.capo" class="riga">👑 alla fine arriva il capo</span>
          <span v-if="scelto.stato === 'chiusa'" class="riga perche">
            {{ scelto.i > fatte ? `Si apre quando vinci «${prima(scelto)}».` : 'Per ora è chiusa.' }}</span>
          <button v-else class="bottone stretto" data-azione="gioca" @click="emit('gioca', scelto.i)">
            {{ scelto.stato === 'fatta' ? 'Rigioca' : 'Gioca' }} ▶</button>
        </template>
        <template v-else>
          <b class="titolo">{{ scelto.emoji }} {{ scelto.nome }}</b>
          <span class="riga">senza fine: si va avanti finché il castello regge</span>
          <span v-if="scelto.primato" class="riga record">record {{ scelto.primato }}</span>
          <span v-if="scelto.stato === 'chiusa'" class="riga perche">Si apre quando hai vinto tutte le tappe.</span>
          <button v-else class="bottone stretto" data-azione="gioca" @click="emit('libera', scelto.chiave)">
            Gioca ▶</button>
        </template>
      </Fumetto>
    </template>
  </div>
</template>

<style scoped src="./regno.css"></style>
