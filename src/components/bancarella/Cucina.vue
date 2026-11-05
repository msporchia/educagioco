<script setup>
/* La cucina della bancarella, in prova: una tela 3D dove si lavora col dito.
   Riceve lo stato e `azione`, che fa la mossa e dice se è riuscita. Vedi docs/bancarella/cucina.md. */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { quantoStazione, dispensaDi, INGREDIENTI } from '../../motore/bancarella/cucina.js'

const props = defineProps({
  stato: { type: Object, required: true },
  azione: { type: Function, required: true },
})
const emit = defineEmits(['presa'])

const tela = ref(null)
const senza3d = ref(false)
const apre = ref(false)
const detto = ref('')
let scena = null, spento = false, voce = 0

const CONSIGLI = {
  pentola: 'Aspetta che sia pronta, poi portala su un piatto', padella: 'Quando è cotta, portala su un piatto',
  forno: 'Porta qui la pizza condita', tagliere: 'Porta qui l\'insalata e taglia col coltello',
  coltello: 'Passa il coltello avanti e indietro sul tagliere', no: 'Qui non va', bidone: 'Trascina qui quello che è da buttare',
}
function aiuto(id) {
  if (!id) return
  const [tipo] = id.split(':')
  detto.value = CONSIGLI[id] || (tipo === 'piatto' ? 'Trascina il piatto verso il cliente' : 'Trascinalo dove serve')
  const mia = ++voce
  setTimeout(() => { if (mia === voce) detto.value = '' }, 2200)
}

const quadro = computed(() => ({
  stazioni: props.stato.stazioni, piatti: props.stato.piatti, quanto: quantoStazione,
  dispensa: dispensaDi(props.stato).map(k => ({ k, nome: INGREDIENTI[k].nome })),
}))

async function accendi() {
  senza3d.value = false
  apre.value = true
  const [{ creaCucina3d }, { prepara }] = await Promise.all([import('../../grafica/cucina3d/indice.js'), import('../../grafica/cucina3d/cibo.js')])
  await prepara(dispensaDi(props.stato), props.stato.ricette)
  apre.value = false
  if (spento) return
  scena?.rilascia()
  // `&dpr=1` nell'indirizzo: il pixel ratio fisso, per le foto e per i test senza scheda grafica
  const dpr = Number((location.hash.match(/dpr=(\d)/) || [])[1]) || undefined
  scena = creaCucina3d(tela.value, { azione: props.azione, aiuto, dpr, presa: v => emit('presa', v), perso: () => { senza3d.value = true } })
  senza3d.value = !scena
  scena?.imposta(quadro.value)
}
onMounted(accendi)
onBeforeUnmount(() => { spento = true; scena?.rilascia(); scena = null })
watch(quadro, q => scena?.imposta(q))

if (typeof window !== 'undefined') window.__cucina3d = { grafica: () => scena?.grafica(), dove: id => scena?.dove(id) }
</script>

<template>
  <div class="cucina" data-cucina>
    <canvas ref="tela" class="tela" data-tela></canvas>
    <p v-if="detto" class="detto" data-detto>{{ detto }}</p>
    <p v-if="apre" class="apre">Si accendono i fornelli…</p>
    <div v-if="senza3d" class="senza">
      Qui la cucina non si riesce a disegnare.
      <button type="button" @click="accendi">riprova</button>
    </div>
  </div>
</template>

<style scoped>
.cucina { position:relative; flex:1; min-height:0; margin-top:-13px; overflow:hidden; background:#e9dfc9 }
.tela { position:absolute; inset:0; width:100%; height:100%; display:block; touch-action:none }
.detto { position:absolute; left:50%; bottom:calc(10px + env(safe-area-inset-bottom)); transform:translateX(-50%); z-index:2; margin:0; padding:7px 14px; max-width:90%;
         border-radius:12px; background:#3a2a1ae0; color:#fffdf7; font-size:14px; font-weight:800; text-align:center; pointer-events:none }
.apre { position:absolute; inset:0; display:grid; place-items:center; margin:0; font-size:17px; font-weight:900; color:#5a4632 }
.senza { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:24px; text-align:center;
         font-weight:800; color:#5a4632 }
.senza button { padding:9px 18px; border:0; border-radius:12px; font-weight:900; color:#5a3200; background:#ffd257 }
</style>
