<script>
// dove il cavaliere si è fermato l'ultima volta: dura la sessione, non va nel profilo
let ultimo = null
</script>

<script setup>
/* Il regno: la mappa dipinta delle quattro isole, una per campagna, e del
   castello in mezzo con le quattro partite libere sui torrioni. L'immagine e
   i posti stanno in giochi/castello/dati/regno.js (lo rifà
   strumenti/sprite/regno-castello.py); qui sopra ci sono solo gli scudi delle
   tappe, il cavaliere che cammina dall'una all'altra e il fumetto.
   Vedi docs/castello/regno.md. */
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Fumetto from '../Fumetto.vue'
import { TORRI } from '../../data/ops.js'
import { CAMPAGNE } from '../../data/campagne-castello.js'
import { apertaQui } from '../../data/portata-giochi.js'
import { MAPPA, LARGO, POSTI, LIBERE_POSTI } from '../../giochi/castello/dati/regno.js'
// il cavaliere è quello del sotterraneo: stesso atlante, già nel file unico
import { figura } from '../../giochi/sotterraneo/viste/figura.js'

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

// lo scudo ha il colore del vestito dei campi della sua isola
const TERRA = { bosco: 'bosco', sotterraneo: 'lava', mura: 'neve', palude: 'palude' }

// il lucchetto guarda anche l'età: le tappe già passate nascono aperte,
// quelle troppo avanti restano chiuse (data/portata.js)
const aperta = i => apertaQui(props.tappe[i], i, props.fatte)
const statoDi = i => (i < props.fatte ? 'fatta' : !aperta(i) ? 'chiusa' : i === props.fatte ? 'ora' : 'aperta')

const segni = computed(() => props.tappe.map((T, i) => {
  const c = CAMPAGNE.find(x => x.id === T.campagna)
  const sue = props.tappe.filter(t => t.campagna === T.campagna)
  const n = sue.indexOf(T)
  return { T, i, n: n + 1, di: sue.length, capo: n === sue.length - 1, campagna: c ? c.nome : '',
           terra: TERRA[T.campagna] || 'bosco', x: POSTI[i][0] * k.value, y: POSTI[i][1] * k.value, stato: statoDi(i) }
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

/* ── il cavaliere ──
   Sta sulla tappa da fare; toccata un'altra tappa aperta ci va a piedi,
   passando da tutte quelle in mezzo (gli scudi stanno sul sentiero e ai capi
   dei ponti, quindi da scudo a scudo si resta sulla strada). Dopo una tappa
   vinta parte da dove si era fermato e va alla prossima. */
const VELOCE = 230                  // pixel della mappa al secondo
const eroe = reactive({ x: 0, y: 0, i: null, cammina: false, fr: 0, specchio: false })
let viaggio = null                  // le tappe che restano da raggiungere, [[x, y, i]]

function mettiA(i) {
  eroe.x = POSTI[i][0]; eroe.y = POSTI[i][1]; eroe.i = i; ultimo = i
}
function vai(a) {
  if (eroe.i === null) return mettiA(a)
  const da = eroe.i, passo = a > da ? 1 : -1
  const punti = []
  for (let j = da + passo; passo > 0 ? j <= a : j >= a; j += passo) punti.push([POSTI[j][0], POSTI[j][1], j])
  if (!punti.length && (eroe.x !== POSTI[a][0] || eroe.y !== POSTI[a][1])) punti.push([POSTI[a][0], POSTI[a][1], a])
  viaggio = punti.length ? punti : null
}
const corpo = computed(() => figura(`cavaliere-${eroe.cammina ? 'corsa' : 'fermo'}-${eroe.fr}`, { scala: 2 }))

const scorre = () => (radice.value ? radice.value.closest('.banco') : null)
// mentre cammina la vista lo segue, senza strappi: si muove solo quando sta per uscire
function segui() {
  const s = scorre()
  if (!s || !radice.value) return
  const x = radice.value.offsetLeft + eroe.x * k.value - s.scrollLeft
  const y = radice.value.offsetTop + eroe.y * k.value - s.scrollTop
  if (x < s.clientWidth * 0.25 || x > s.clientWidth * 0.75) s.scrollLeft += (x - s.clientWidth * 0.5) * 0.08
  if (y < s.clientHeight * 0.25 || y > s.clientHeight * 0.7) s.scrollTop += (y - s.clientHeight * 0.45) * 0.08
}

let id = 0, istante = null, tempo = 0
function giro(ora) {
  // a schermo spento il tempo non conta (docs/core/interfaccia.md)
  const dt = istante === null || document.hidden ? 0 : Math.min(0.05, (ora - istante) / 1000)
  istante = ora
  tempo += dt
  let resta = VELOCE * dt
  while (viaggio && resta > 0) {
    const [tx, ty, ti] = viaggio[0]
    const dx = tx - eroe.x, dy = ty - eroe.y, d = Math.hypot(dx, dy)
    if (Math.abs(dx) > 0.5) eroe.specchio = dx < 0
    if (d <= resta) {
      eroe.x = tx; eroe.y = ty; eroe.i = ti; ultimo = ti; resta -= d
      viaggio.shift()
      if (!viaggio.length) viaggio = null
    } else {
      eroe.x += (dx / d) * resta; eroe.y += (dy / d) * resta; resta = 0
    }
  }
  if (viaggio) segui()
  eroe.cammina = !!viaggio
  const fr = Math.floor(tempo * (eroe.cammina ? 10 : 4)) % 4
  if (fr !== eroe.fr) eroe.fr = fr
  id = requestAnimationFrame(giro)
}

function tocca(a) {
  const s = aperto.value
  const stesso = s && s.tipo === a.tipo && s.i === a.i && s.chiave === a.chiave
  aperto.value = stesso ? null : a
  if (!stesso && a.tipo === 'tappa' && statoDi(a.i) !== 'chiusa') vai(a.i)
}

let osserva = null, parte = 0
onMounted(async () => {
  const misura = () => { if (radice.value) W.value = radice.value.clientWidth }
  misura()
  osserva = new ResizeObserver(misura)
  osserva.observe(radice.value)
  // il cavaliere riparte da dove si era fermato; la prima volta sta già sulla tappa da fare
  const meta = qui.value ? qui.value.i : null
  const da = ultimo !== null && ultimo < props.tappe.length ? ultimo : meta ?? 0
  mettiA(da)
  id = requestAnimationFrame(giro)
  // si apre su di lui
  await nextTick()
  const s = scorre()
  if (s) {
    s.scrollTop = Math.max(0, radice.value.offsetTop + eroe.y * k.value - s.clientHeight * 0.5)
    s.scrollLeft = Math.max(0, radice.value.offsetLeft + eroe.x * k.value - s.clientWidth * 0.5)
  }
  if (meta !== null && meta !== da) parte = setTimeout(() => vai(meta), 500)
})
onUnmounted(() => {
  cancelAnimationFrame(id)
  clearTimeout(parte)
  if (osserva) osserva.disconnect()
})
</script>

<template>
  <div ref="radice" class="regno" data-regno @click="aperto = null">
    <img class="fondo" :src="MAPPA" alt="" draggable="false">
    <template v-if="W">
      <div class="tappe">
        <button v-for="s in segni" :key="s.i" class="tap" :data-tappa="s.i" :data-stato="s.stato"
                :class="[s.stato, s.terra, { capo: s.capo, scelta: scelto === s }]"
                :style="{ left: s.x + 'px', top: s.y + 'px' }"
                :aria-label="`${s.i + 1}. ${s.T.nome}`" @click.stop="tocca({ tipo: 'tappa', i: s.i })">
          <span class="scudo"></span>
          <b class="n">{{ s.i + 1 }}</b>
          <span v-if="s.stato === 'fatta'" class="spunta">✓</span>
          <span v-if="s.capo" class="corona">👑</span>
        </button>
        <button v-for="t in torrioni" :key="t.chiave" class="tap libera" :data-tappa="t.chiave"
                :data-stato="t.stato" :class="[t.stato, { scelta: scelto === t }]"
                :style="{ left: t.x + 'px', top: t.y + 'px' }"
                :aria-label="t.nome" @click.stop="tocca({ tipo: 'libera', chiave: t.chiave })">
          <span class="scudo"></span>
          <b class="n coppa">🏆</b>
        </button>
      </div>

      <div v-if="corpo && eroe.i !== null" class="eroe" :class="{ specchio: eroe.specchio }" data-eroe
           :data-in-viaggio="eroe.cammina ? 1 : 0" :data-dove="eroe.i"
           :style="{ left: eroe.x * k + 'px', top: eroe.y * k + 'px' }">
        <span class="gabbia" :style="corpo.gabbia"><span :style="corpo.pezzo"></span></span>
      </div>

      <span v-if="libera && regali" class="dote" data-regali
            :style="{ left: 512 * k + 'px', top: 880 * k + 'px' }">🎁 {{ regali }}
        {{ regali === 1 ? 'potenziamento' : 'potenziamenti' }}</span>

      <Fumetto v-if="scelto" :x="scelto.x" :y="scelto.y" :raggio="26" :limite="W" :scorre="scorre()"
               :tenue="scelto.stato === 'chiusa'" :largo="230">
        <template v-if="aperto.tipo === 'tappa'">
          <b class="titolo">{{ scelto.i + 1 }}. {{ scelto.T.nome }}</b>
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
          <b class="titolo">{{ scelto.nome }}</b>
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
