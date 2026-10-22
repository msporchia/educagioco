<script setup>
// L'inventario: tutto ciò che hai in dispensa, a schede (raccolti, prodotti, lana e altro). Solo lettura: si tocca un gettone per
// leggerne il nome e a cosa serve. ✕ in alto a destra. Il conto sta in inventario-puro.js.
import { ref, computed } from 'vue'
import Faccia from './Faccia.vue'
import { SCHEDE, tipiDi, dettaglioDi } from './inventario-puro.js'
import '../stile-inventario.css'

const props = defineProps({ schede: { type: Object, required: true } })      // schedeDellInventario()
defineEmits(['chiudi', 'albero'])
const scheda = ref('raccolti')
const scelta = ref('')
const voci = computed(() => props.schede[scheda.value] || [])
const conta = id => tipiDi(props.schede[id] || [])
const nomeScelta = computed(() => { const v = voci.value.find(c => c.k === scelta.value); return v ? v.nome : '' })
const vuoto = computed(() => !tipiDi(voci.value))
const testoVuoto = { raccolti: 'Ancora niente: semina un campo!', prodotti: 'Ancora niente: le macchine li preparano coi raccolti.', altro: 'Ancora niente: gli animali ti daranno lana, uova e latte.' }
function cambia(id) { scheda.value = id; scelta.value = '' }
</script>

<template>
  <div class="f3-foglio f3-colonna f3-inv" data-f3="inventario">
    <header class="f3-inv-asse"><span aria-hidden="true">🎒</span><h2>Inventario</h2></header>
    <button class="f3-chiudi f3-inv-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <nav class="f3-inv-schede">
      <button v-for="s in SCHEDE" :key="s.id" :class="{ acceso: scheda === s.id }" :data-scheda-inv="s.id" @click="cambia(s.id)">
        <span aria-hidden="true">{{ s.emoji }}</span> {{ s.nome }}<i>{{ conta(s.id) }}</i>
      </button>
    </nav>
    <div class="f3-corpo">
      <p v-if="vuoto" class="f3-inv-vuoto" data-f3="inventario-vuoto">{{ testoVuoto[scheda] }}</p>
      <div class="f3-inv-griglia" :key="scheda">
        <button v-for="(v, i) in voci" :key="v.k" class="f3-inv-gettone" :class="{ velata: v.velata, sel: v.k === scelta }" :data-merce="v.k" :data-n="v.n"
                :style="{ '--i': i }" @click="scelta = v.k === scelta ? '' : v.k">
          <span class="f3-inv-faccia"><Faccia :k="v.k" :emoji="v.emoji" :lato="46" /><em class="f3-inv-n">{{ v.n }}</em></span>
          <b>{{ v.nome }}</b>
        </button>
      </div>
    </div>
    <div class="f3-inv-riga" data-f3="inventario-riga">
      <p><template v-if="scelta"><b>{{ nomeScelta }}.</b> {{ dettaglioDi(scelta) }}</template><template v-else>Tocca una cosa per sapere a cosa serve.</template></p>
      <button v-if="scelta" type="button" class="f3-inv-albero" data-f3="inventario-albero" :data-albero-di="scelta" @click="$emit('albero', scelta)">🌳 Come si fa</button>
    </div>
  </div>
</template>
