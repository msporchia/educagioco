<script setup>
/* La cucina col cuoco, in prova: la stanza in 3D, sotto la levetta e i due tasti.
   Riceve lo stato e `azione`; `leva` dice dove spinge il pollice. Vedi docs/bancarella/cuoco.md. */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { zittisciIlFantasma } from '../../giochi/fattoria3d/viste/dito-soglie.js'
import { dispensaDi } from '../../motore/bancarella/cucina.js'
import { quanto, bersaglio, decidi, puoTagliare } from '../../motore/bancarella/cuoco.js'

const props = defineProps({
  stato: { type: Object, required: true },
  azione: { type: Function, required: true },
})
const emit = defineEmits(['presa', 'leva'])

const tela = ref(null)
const senza3d = ref(false)
const apre = ref(false)
const detto = ref('')
const tasto = ref('')            // cosa farebbe il tasto grande adesso
const taglio = ref(false)
const pomello = ref({ x: 0, y: 0 })
const leva = ref(null)
let scena = null, spento = false, voce = 0, tieni = 0, dito = null

function di(testo) {
  if (!testo) return
  detto.value = testo
  const mia = ++voce
  setTimeout(() => { if (mia === voce) detto.value = '' }, 1800)
}

function sente(d) {
  tasto.value = d.nome || ''
  taglio.value = puoTagliare(props.stato)
  emit('presa', !!props.stato.cuoco.mano?.pronto)
}

async function accendi() {
  senza3d.value = false
  apre.value = true
  const [{ creaCucinaCuoco }, { prepara }, { preparaCuoco }] = await Promise.all([import('../../grafica/cucina3d/cuoco.js'),
    import('../../grafica/cucina3d/cibo.js'), import('../../grafica/cucina3d/omino.js')])
  await prepara(dispensaDi(props.stato), props.stato.ricette)
  preparaCuoco()
  apre.value = false
  if (spento) return
  scena?.rilascia()
  // `&dpr=1` nell'indirizzo: il pixel ratio fisso, per le foto e per i test senza scheda grafica
  const dpr = Number((location.hash.match(/dpr=(\d)/) || [])[1]) || undefined
  scena = creaCucinaCuoco(tela.value, { sente, dpr, leggi: { quanto, bersaglio, decidi, puoTagliare }, perso: () => { senza3d.value = true } })
  senza3d.value = !scena
  scena?.imposta(props.stato)
}
onMounted(accendi)
onBeforeUnmount(() => { spento = true; clearInterval(tieni); emit('leva', 0, 0); scena?.rilascia(); scena = null })

/* La levetta: il pollice sta giù e si tira. Qui `pointerdown` e mai `click`: con due dita
   sullo schermo il click non parte (docs/core/il-dito.md). */
const CORSA = 38
function spingi(e) {
  const r = leva.value.getBoundingClientRect()
  let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2)
  const d = Math.hypot(x, y)
  if (d > CORSA) { x *= CORSA / d; y *= CORSA / d }
  pomello.value = { x, y }
  emit('leva', x / CORSA, y / CORSA)
}
function giuLeva(e) {
  dito = e.pointerId
  e.currentTarget.setPointerCapture?.(e.pointerId)
  spingi(e)
}
const muoviLeva = e => { if (e.pointerId === dito) spingi(e) }
function suLeva(e) {
  if (e.pointerId !== dito) return
  dito = null
  pomello.value = { x: 0, y: 0 }
  emit('leva', 0, 0)
}

function premi() {
  if (!props.azione({ che: 'usa' })) di(props.stato.perche)
}
function taglia() {
  if (!props.azione({ che: 'tagliaCuoco' })) di(props.stato.perche)
  clearInterval(tieni)
  // tenerlo giù vale come batterci sopra
  tieni = setInterval(() => { if (!props.azione({ che: 'tagliaCuoco' })) clearInterval(tieni) }, 240)
}
const lascia = () => clearInterval(tieni)
// «Servi» apre il foglio del resto proprio sotto il dito: il click che resta premerebbe una moneta (docs/core/il-dito.md)
const alzato = e => zittisciIlFantasma(e.clientX, e.clientY)

if (typeof window !== 'undefined') window.__cucina3d = { grafica: () => scena?.grafica() }
</script>

<template>
  <div class="cucina" data-cucina data-cuoco>
    <div class="stanza">
      <canvas ref="tela" class="tela" data-tela></canvas>
      <p v-if="detto" class="detto" data-detto>{{ detto }}</p>
      <p v-if="apre" class="apre">Si accendono i fornelli…</p>
      <div v-if="senza3d" class="senza">
        Qui la cucina non si riesce a disegnare.
        <button type="button" @click="accendi">riprova</button>
      </div>
    </div>
    <div class="comandi">
      <div class="presa-leva" data-leva @pointerdown.prevent="giuLeva" @pointermove="muoviLeva" @pointerup="suLeva" @pointercancel="suLeva">
        <div ref="leva" class="leva"><i :style="{ transform: `translate(${pomello.x}px,${pomello.y}px)` }"></i></div>
      </div>
      <button type="button" class="tasto taglia" :class="{ acceso: taglio }" data-taglia aria-label="taglia"
              @pointerdown.prevent="taglia" @pointerup="lascia" @pointercancel="lascia" @pointerleave="lascia">🔪<small>Taglia</small></button>
      <button type="button" class="tasto usa" :class="{ acceso: tasto }" data-usa @pointerdown.prevent="premi" @pointerup="alzato">{{ tasto || 'Prendi' }}</button>
    </div>
  </div>
</template>

<style scoped>
.cucina { position:relative; flex:1; min-height:0; margin-top:-13px; display:flex; flex-direction:column; overflow:hidden; background:#3f3128;
          user-select:none; -webkit-user-select:none; -webkit-touch-callout:none }
.stanza { position:relative; flex:1; min-height:0 }
.tela { position:absolute; inset:0; width:100%; height:100%; display:block; touch-action:none }
.detto { position:absolute; left:50%; bottom:8px; transform:translateX(-50%); z-index:2; margin:0; padding:7px 14px; max-width:90%; white-space:nowrap;
         border-radius:12px; background:#3a2a1ae6; color:#fffdf7; font-size:14px; font-weight:800; text-align:center; pointer-events:none }
.apre { position:absolute; inset:0; display:grid; place-items:center; margin:0; font-size:17px; font-weight:900; color:#f1e6cf }
.senza { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:24px; text-align:center;
         font-weight:800; color:#f1e6cf }
.senza button { padding:9px 18px; border:0; border-radius:12px; font-weight:900; color:#5a3200; background:#ffd257 }

.comandi { flex:none; display:flex; align-items:center; gap:10px; padding:8px 12px calc(10px + env(safe-area-inset-bottom)); background:#2f241d }
.presa-leva { flex:1; display:flex; align-items:center; height:112px; touch-action:none }
.leva { position:relative; width:104px; height:104px; border-radius:50%; background:radial-gradient(circle at 50% 42%,#5a4638,#3a2c23); box-shadow:inset 0 3px 8px #0009, 0 1px 0 #ffffff1f }
.leva i { position:absolute; left:50%; top:50%; width:54px; height:54px; margin:-27px 0 0 -27px; border-radius:50%;
          background:radial-gradient(circle at 38% 32%,#ffe9a8,#ffb52e 62%,#d2861a); box-shadow:0 4px 8px #0008 }
.tasto { flex:none; display:flex; flex-direction:column; align-items:center; justify-content:center; border:0; border-radius:50%; touch-action:none; font-weight:900;
         background:#5a4a3e; color:#c9bcae; box-shadow:0 4px 0 #1f1712 }
.tasto:active { transform:translateY(3px); box-shadow:0 1px 0 #1f1712 }
.taglia { width:74px; height:74px; font-size:26px; line-height:1 }
.taglia small { font-size:11px; font-weight:900 }
.taglia.acceso { background:linear-gradient(180deg,#ff8a70,#e2533a); color:#fff; box-shadow:0 4px 0 #9d2f1e }
.usa { width:96px; height:96px; font-size:17px }
.usa.acceso { background:linear-gradient(180deg,#8fe69f,#3fb562); color:#0f3d1e; box-shadow:0 4px 0 #1f7a3c }
</style>
