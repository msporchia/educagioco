<script>
// dove la nave ha attraccato l'ultima volta: resta per tutta la sessione,
// anche se la mappa si smonta per giocare una tappa (non va nel profilo)
let ultimoPorto = null
</script>

<script setup>
/* La mappa del tesoro: la tela dipinge (scena/mappa.js), qui sopra si
   mettono i nomi e i tasti, in HTML, negli stessi punti, e la nave (la sua
   tela, scena/nave.js). Riceve lo stato già deciso e sceglie solo dove
   andare: toccata una tappa aperta la nave ci naviga per mare, e arrivata
   la tappa si apre; una chiusa la nave non parte e si dice cosa serve.
   Si apre scorrendo fino alla nave. */
import { ref, shallowRef, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { disponi, doveStaLaNave } from '../scena/disposizione.js'
import { dipingiMappa } from '../scena/mappa.js'
import { rotta, lunghezza, durata, pezzoVisibile } from '../scena/rotte.js'
import { posa, viaggia } from '../scena/nave.js'
import { cosaServe } from '../motore/mappa.js'

const props = defineProps({
  stato: { type: Array, required: true },      // motore/mappa.js, statoMappa
  extra: { type: Object, default: () => ({}) }, // { <mondo>: { libro, cassetto } }
  prima: { type: Boolean, default: false },     // c'è il gioco di prima da offrire
})
const emit = defineEmits(['tappa', 'libro', 'cassetto', 'prima'])

const scorre = ref(null)
const tela = ref(null)
const telaNave = ref(null)
const barca = ref(null)
const W = ref(0)
const porto = ref(null)       // la chiave del nodo dove la nave è ferma
const viaggio = shallowRef(null)
const serve = ref(null)
const scossa = ref(false)
let occhio = null
let giaScesa = false
let timerServe = 0, timerScossa = 0

const quadro = computed(() => (W.value ? disponi(props.stato, W.value, m => props.extra[m]) : null))
// la prima volta la nave attracca dove c'è da fare
const adessoVero = computed(() => (quadro.value && quadro.value.nodi.find(n => n.adesso)) || null)

function misura() {
  if (!scorre.value) return
  W.value = Math.min(520, Math.floor(scorre.value.clientWidth))
}

function nodoDi(chiave) { return quadro.value && quadro.value.nodi.find(n => n.chiave === chiave) }

// la nave ferma accanto al suo nodo, con la prua verso l'isola
function ormeggia() {
  const n = nodoDi(porto.value)
  if (!n || !n.porto || !telaNave.value || !barca.value) return
  posa(telaNave.value, barca.value, n.porto.x, n.porto.y, n.x - n.porto.x)
}

function dipingi() {
  if (!tela.value || !quadro.value) return
  dipingiMappa(tela.value, quadro.value)
  if (!viaggio.value) {
    const n = doveStaLaNave(quadro.value, porto.value || ultimoPorto || (adessoVero.value && adessoVero.value.chiave))
    porto.value = n ? n.chiave : null
    ormeggia()
  }
}

function scendi() {
  if (giaScesa || !quadro.value || !scorre.value) return
  const n = nodoDi(porto.value)
  giaScesa = true
  if (n) scorre.value.scrollTop = Math.max(0, n.y - scorre.value.clientHeight * 0.42)
}

watch(quadro, async () => { await nextTick(); dipingi(); scendi() })

onMounted(() => {
  misura()
  if (typeof ResizeObserver !== 'undefined') {
    occhio = new ResizeObserver(misura)
    occhio.observe(scorre.value)
  }
})
onUnmounted(() => {
  if (occhio) occhio.disconnect()
  if (viaggio.value) viaggio.value.ferma()
  clearTimeout(timerServe); clearTimeout(timerScossa)
})

function apri(n) {
  ultimoPorto = n.chiave
  if (n.tipo === 'tappa') emit('tappa', n.id)
  else if (n.tipo === 'libro') emit('libro', n.mondo)
  else if (n.tipo === 'cassetto') emit('cassetto', n.mondo)
}

// una tappa chiusa: la nave dà uno scossone e non parte, e si dice cosa serve
function nonSiParte(n) {
  const largo = quadro.value.W
  serve.value = { chiave: n.chiave, testo: cosaServe(props.stato, n, props.extra[n.mondo]) || 'Non ancora',
                  x: Math.max(Math.min(n.x, largo - 116), 116), y: n.y - n.r - 10 }
  clearTimeout(timerServe)
  timerServe = setTimeout(() => { serve.value = null }, 2600)
  scossa.value = false
  clearTimeout(timerScossa)
  nextTick(() => { scossa.value = true; timerScossa = setTimeout(() => { scossa.value = false }, 450) })
}

function tocca(n) {
  if (viaggio.value) return
  if (chiuso(n)) { nonSiParte(n); return }
  serve.value = null
  const da = nodoDi(porto.value), q = quadro.value
  const punti = da && da.porto && n.porto && da.chiave !== n.chiave && rotta(q.mare, da.porto, n.porto)
  if (!punti || !telaNave.value) { porto.value = n.chiave; apri(n); return }
  // della rotta si naviga il pezzo che si vede
  const su = scorre.value ? scorre.value.scrollTop : 0, alto = scorre.value ? scorre.value.clientHeight : q.H
  const pezzo = pezzoVisibile(punti, su, su + alto)
  viaggio.value = viaggia(telaNave.value, barca.value, pezzo, durata(lunghezza(pezzo)), () => {
    viaggio.value = null
    porto.value = n.chiave
    ormeggia()
    apri(n)
  })
}
// un tocco durante il viaggio lo chiude subito
function arriva() { if (viaggio.value) viaggio.value.chiudi() }

const chiuso = n => n.stato === 'chiusa' || n.stato === 'arrivo'
const NOMI = { libro: 'Il libro', cassetto: 'Il cassetto' }
const etichetta = n => n.tipo === 'mondo' ? 'in arrivo' : n.nome || NOMI[n.tipo]
const racconto = n => n.tipo === 'tappa'
  ? `${n.nome}: ${chiuso(n) ? 'chiusa' : `imparata ${n.grado} su 10`}`
  : `${etichetta(n)}${chiuso(n) ? ', chiuso' : ''}`
</script>

<template>
  <div ref="scorre" class="ing-mappa" data-mappa-inglese>
    <div v-if="quadro" class="ing-tavola" :style="{ width: quadro.W + 'px', height: quadro.H + 'px' }">
      <canvas ref="tela" class="ing-tela"></canvas>

      <div v-for="t in quadro.titoli" :key="'m' + t.mondo" class="ing-mondo-nome"
           :class="{ 'ing-lontano': !t.pronto, 'ing-chiuso': t.pronto && !t.aperto }"
           :data-mondo="t.mondo" :data-pronto="t.pronto ? '1' : '0'"
           :style="{ left: t.x + 'px', top: t.y + 'px', width: Math.max(90, t.larg - 8) + 'px' }">
        {{ t.nome }}
      </div>

      <template v-for="n in quadro.nodi" :key="n.chiave">
        <button type="button" class="ing-nodo" :class="'ing-' + n.stato"
                :style="{ left: (n.x - n.r - 6) + 'px', top: (n.y - n.r - 6) + 'px',
                          width: (2 * n.r + 12) + 'px', height: (2 * n.r + 12) + 'px' }"
                :data-chiuso="chiuso(n) ? '1' : null" :aria-label="racconto(n)"
                :data-tappa="n.tipo === 'tappa' ? n.id : null"
                :data-libro="n.tipo === 'libro' ? n.mondo : null"
                :data-cassetto="n.tipo === 'cassetto' ? n.mondo : null"
                :data-grado="n.tipo === 'tappa' ? n.grado : null"
                :data-stato="n.stato"
                @click="tocca(n)"></button>
        <span class="ing-nodo-nome" :class="{ 'ing-spento': chiuso(n) }"
              :style="{ left: n.x + 'px', top: (n.y + n.r + 9) + 'px', width: Math.min(120, n.larg) + 'px' }">
          {{ etichetta(n) }}
        </span>
      </template>

      <!-- la nave: al posto della freccia, ferma accanto alla tappa dove si è arrivati -->
      <div ref="barca" class="ing-nave" aria-hidden="true" data-nave :data-porto="porto"
           :data-in-viaggio="viaggio ? '1' : '0'">
        <canvas ref="telaNave" :class="{ 'ing-scossa': scossa }"></canvas>
      </div>

      <div v-if="serve" :key="serve.chiave" class="ing-serve" data-serve :data-serve-per="serve.chiave"
           role="status" :style="{ left: serve.x + 'px', top: serve.y + 'px' }">🔒 {{ serve.testo }}</div>

      <!-- durante il viaggio un tocco qualunque lo chiude: la tappa si apre subito -->
      <div v-if="viaggio" class="ing-viaggio" data-viaggio @click="arriva"></div>
    </div>

    <!-- chi aveva finito la campagna di prima tiene il suo gioco libero, in fondo alla mappa -->
    <button v-if="prima" type="button" class="ing-prima" data-prima @click="$emit('prima')">
      <span class="em">♾️</span>
      <span><b>Il gioco di prima</b><i>tutte le parole insieme, senza fine</i></span>
    </button>
  </div>
</template>
