<script setup>
/* La cucina col cuoco, in prova: si tocca la stanza. Riceve lo stato, e `tocca` dice
   dove è caduto il dito; il resto lo fa la vista. Vedi docs/bancarella/cuoco.md. */
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { zittisciIlFantasma } from '../../giochi/fattoria3d/viste/dito-soglie.js'
import { dispensaDi } from '../../motore/bancarella/cucina.js'
import { quanto } from '../../motore/bancarella/cuoco.js'

const props = defineProps({
  stato: { type: Object, required: true },
  detto: { type: Object, default: null },     // { testo }: un oggetto nuovo a ogni cosa da dire, anche se è la stessa
})
const emit = defineEmits(['presa', 'tocca'])

const tela = ref(null)
const senza3d = ref(false)
const apre = ref(false)
const fumetto = ref('')
let scena = null, spento = false, voce = 0

watch(() => props.detto, d => {
  if (!d?.testo) return
  fumetto.value = d.testo
  const mia = ++voce
  setTimeout(() => { if (mia === voce) fumetto.value = '' }, 1800)
})

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
  scena = creaCucinaCuoco(tela.value, { quanto, dpr, sente: v => emit('presa', v), perso: () => { senza3d.value = true } })
  senza3d.value = !scena
  scena?.imposta(props.stato)
}
onMounted(accendi)
onBeforeUnmount(() => { spento = true; scena?.rilascia(); scena = null })

/* Il tocco vale alla pressione. Il foglio del resto può aprirsi proprio sotto il dito:
   il click che resta premerebbe una moneta (docs/core/il-dito.md). */
function premi(e) {
  const dove = scena?.cosaCe(e.clientX, e.clientY)
  if (dove) emit('tocca', dove)
}
const alzato = e => zittisciIlFantasma(e.clientX, e.clientY)

if (typeof window !== 'undefined') window.__cucina3d = { grafica: () => scena?.grafica(), dove: id => scena?.dove(id) }
</script>

<template>
  <div class="cucina" data-cucina data-cuoco>
    <canvas ref="tela" class="tela" data-tela @pointerdown.prevent="premi" @pointerup="alzato"></canvas>
    <p v-if="fumetto" class="detto" data-detto>{{ fumetto }}</p>
    <p v-if="apre" class="apre">Si accendono i fornelli…</p>
    <div v-if="senza3d" class="senza">
      Qui la cucina non si riesce a disegnare.
      <button type="button" @click="accendi">riprova</button>
    </div>
  </div>
</template>

<style scoped>
.cucina { position:relative; flex:1; min-height:0; margin-top:-13px; overflow:hidden; background:#3f3128 }
.tela { position:absolute; inset:0; width:100%; height:100%; display:block; touch-action:none }
.detto { position:absolute; left:50%; bottom:calc(10px + env(safe-area-inset-bottom)); transform:translateX(-50%); z-index:2; margin:0; padding:7px 14px; max-width:90%; white-space:nowrap;
         border-radius:12px; background:#3a2a1ae6; color:#fffdf7; font-size:14px; font-weight:800; text-align:center; pointer-events:none }
.apre { position:absolute; inset:0; display:grid; place-items:center; margin:0; font-size:17px; font-weight:900; color:#f1e6cf }
.senza { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:24px; text-align:center;
         font-weight:800; color:#f1e6cf }
.senza button { padding:9px 18px; border:0; border-radius:12px; font-weight:900; color:#5a3200; background:#ffd257 }
</style>
