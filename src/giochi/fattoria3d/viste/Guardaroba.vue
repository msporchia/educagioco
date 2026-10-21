<script setup>
// Il guardaroba: il ritratto 3D del contadino (o della contadina) con l'abito di adesso e, sotto, le scelte a gettoni per categoria. Tutto
// gratis; i pezzi speciali sono velati col lucchetto finché non arriva il loro livello. Chi si è (contadino o contadina) viene dal
// profilo, come nella fattoria di sempre: qui si può cambiare con la stessa scelta della mappa. ✕ in alto a destra.
// Le regole stanno in dati/abiti.js, il ritratto lo fotografa `scena3d/anteprime.js` (tipo `contadino:<chiave>`).
import { ref, computed, watch, onMounted } from 'vue'
import SceltaAspetto from '../../../components/SceltaAspetto.vue'
import { CATEGORIE, etichettaDi, opzioniDi, sbloccato, chiaveAbito, nomeDelContadino } from '../dati/abiti.js'
import '../stile-guardaroba.css'

const props = defineProps({
  abito: { type: Object, required: true },        // l'abito di adesso, con la persona
  livello: { type: Number, default: 1 },
  aspetto: { type: String, default: '' },         // il personaggio del profilo ('bambina' | 'bimbo')
  anteprima: { type: Function, required: true },  // tipo → Promise<dataURL|null>
  anteprimaPronta: { type: Function, required: true },
})
const emit = defineEmits(['vesti', 'aspetto', 'chiudi'])

const scheda = ref('cappello')
const scelto = ref('')                            // il pezzo velato toccato, per dire a che livello arriva
const tipo = computed(() => 'contadino:' + chiaveAbito(props.abito))
const ritratto = ref('')
let ultimo = ''
async function disegna() {
  const t = tipo.value; ultimo = t
  const pronta = props.anteprimaPronta(t)
  if (pronta) { ritratto.value = pronta; return }
  const url = await props.anteprima(t)
  if (url && ultimo === t) ritratto.value = url             // se nel frattempo ha scelto un altro pezzo, vale l'ultimo
}
watch(tipo, disegna)
onMounted(disegna)

const chi = computed(() => props.abito.persona)
const voci = computed(() => opzioniDi(scheda.value, chi.value).map(o => ({ ...o, libero: sbloccato(o, props.livello), sel: props.abito[scheda.value] === o.id })))
const schede = computed(() => CATEGORIE.map(c => ({ id: c, ...etichettaDi(c, chi.value) })))
const riga = computed(() => {
  const v = voci.value.find(x => x.id === scelto.value)
  if (v && !v.libero) return `${v.nome}: si sblocca al livello ${v.liv}.`
  return 'Tocca un pezzo per indossarlo. È tutto gratis!'
})
function tocca(v) {
  if (!v.libero) { scelto.value = v.id; return }
  scelto.value = ''; emit('vesti', scheda.value, v.id)
}
function cambia(id) { scheda.value = id; scelto.value = '' }
</script>

<template>
  <div class="f3-foglio f3-colonna f3-gua" data-f3="guardaroba">
    <header class="f3-gua-asse"><span aria-hidden="true">👕</span><h2>Guardaroba</h2></header>
    <button class="f3-chiudi f3-gua-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-gua-testa">
      <div class="f3-gua-ritratto" data-f3="guardaroba-ritratto">
        <img v-if="ritratto" :src="ritratto" :alt="'Ritratto ' + nomeDelContadino(abito, 'del')" draggable="false">
        <span v-else class="f3-gua-attesa" aria-hidden="true">👕</span>
      </div>
      <div class="f3-gua-chi">
        <p class="f3-gua-nome" data-f3="guardaroba-chi">Sei {{ nomeDelContadino(abito, 'il') }}</p>
        <SceltaAspetto :scelto="aspetto" @scegli="n => emit('aspetto', n)" />
      </div>
    </div>
    <nav class="f3-gua-schede">
      <button v-for="s in schede" :key="s.id" :class="{ acceso: scheda === s.id }" :data-scheda-abito="s.id" @click="cambia(s.id)">
        <span aria-hidden="true">{{ s.emoji }}</span> {{ s.nome }}
      </button>
    </nav>
    <div class="f3-corpo">
      <div class="f3-gua-griglia" :key="scheda + chi">
        <button v-for="(v, i) in voci" :key="v.id" class="f3-gua-gettone" :class="{ sel: v.sel, velata: !v.libero }" :data-capo="scheda + ':' + v.id"
                :aria-pressed="v.sel" :aria-label="v.nome + (v.libero ? '' : ', livello ' + v.liv)" :style="{ '--i': i, '--col': '#' + v.c.toString(16).padStart(6, '0') }" @click="tocca(v)">
          <span class="f3-gua-campione" :class="{ vuoto: !v.c }"><em v-if="v.emoji" aria-hidden="true">{{ v.emoji }}</em><i v-if="!v.libero" class="f3-gua-lucchetto" aria-hidden="true">🔒</i></span>
          <b>{{ v.nome }}</b>
          <small v-if="!v.libero">Livello {{ v.liv }}</small>
        </button>
      </div>
    </div>
    <p class="f3-gua-riga" data-f3="guardaroba-riga">{{ riga }}</p>
  </div>
</template>
