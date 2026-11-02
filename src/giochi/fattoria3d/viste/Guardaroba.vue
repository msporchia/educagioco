<script setup>
// Il guardaroba: il ritratto 3D del contadino (o della contadina) e, sotto, le scelte a gettoni per categoria. Un tocco PROVA il pezzo sul
// ritratto (la bozza); se tutta la bozza è gratis o già tua si indossa subito, se c'è un pezzo con 🪙 resta in prova finché non si preme «Acquista e
// indossa»: niente si compra con un tocco solo. I pezzi speciali sono velati col lucchetto finché non arriva il loro livello. Chi si è (contadino o contadina) viene dal
// profilo, come nella fattoria di sempre: qui si può cambiare con la stessa scelta della mappa. ✕ in alto a destra.
// Le regole stanno in dati/abiti.js, il ritratto lo fotografa `scena3d/anteprime.js` (tipo `contadino:<chiave>`).
import { ref, computed, watch, onMounted } from 'vue'
import SceltaAspetto from '../../../components/SceltaAspetto.vue'
import { CATEGORIE, etichettaDi, scelteDi, statoDelPezzo, daComprare, chiaveAbito, nomeDelContadino } from '../dati/abiti.js'
import '../stile-guardaroba.css'

const props = defineProps({
  abito: { type: Object, required: true },        // l'abito di adesso, con la persona
  livello: { type: Number, default: 1 },
  monete: { type: Number, default: 0 },
  armadio: { type: Object, default: () => ({}) }, // i pezzi a pagamento comprati: { 'cappello:cilindro': true }
  stagione: { type: String, default: '' },        // la festa in corso: i pezzi di festa si comprano solo allora
  messaggio: { type: String, default: '' },       // l'esito dell'ultimo acquisto, detto da Gioco.vue
  aspetto: { type: String, default: '' },         // il personaggio del profilo ('bambina' | 'bimbo')
  anteprima: { type: Function, required: true },  // tipo → Promise<dataURL|null>
  anteprimaPronta: { type: Function, required: true },
})
const emit = defineEmits(['indossa', 'aspetto', 'chiudi'])

const scheda = ref('cappello')
const scelto = ref('')                            // il pezzo velato toccato, per dire a che livello arriva
const bozza = ref({ ...props.abito })           // quello che si sta provando: il ritratto lo mostra, il mondo no finché non si indossa
watch(() => chiaveAbito(props.abito), () => { bozza.value = { ...props.abito } })
const tipo = computed(() => 'contadino:' + chiaveAbito(bozza.value))
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
const ctx = computed(() => ({ livello: props.livello, armadio: props.armadio, stagione: props.stagione }))
const voci = computed(() => scelteDi(scheda.value, chi.value, ctx.value).map(o => {
  const st = statoDelPezzo(scheda.value, o, ctx.value)
  return { ...o, st, libero: st !== 'bloccato', sel: bozza.value[scheda.value] === o.id, addosso: props.abito[scheda.value] === o.id }
}))
const da = computed(() => daComprare(bozza.value, props.armadio))                 // i pezzi della bozza ancora da pagare
const costo = computed(() => da.value.reduce((n, o) => n + o.prezzo, 0))
const cambiata = computed(() => chiaveAbito(bozza.value) !== chiaveAbito(props.abito))
const manca = computed(() => Math.max(0, costo.value - props.monete))
const schede = computed(() => CATEGORIE.map(c => ({ id: c, ...etichettaDi(c, chi.value) })))
const riga = computed(() => {
  const v = voci.value.find(x => x.id === scelto.value)
  if (v && !v.libero) return `${v.nome}: si sblocca al livello ${v.liv}.`
  if (da.value.length) return manca.value ? `In prova: ${da.value.map(o => o.nome).join(', ')}. Costa 🪙${costo.value}: ti mancano 🪙${manca.value}.`
    : `In prova: ${da.value.map(o => o.nome).join(', ')}. Costa 🪙${costo.value}: tocca «Acquista e indossa» per averlo.`
  return props.messaggio || 'Tocca un pezzo per provarlo. Quelli con 🪙 si comprano una volta sola e sono tuoi per sempre.'
})
function tocca(v) {
  if (!v.libero) { scelto.value = v.id; return }
  scelto.value = ''
  bozza.value = { ...bozza.value, [scheda.value]: v.id }
  if (cambiata.value && !da.value.length) emit('indossa', { ...bozza.value })            // gratis o già tuo: si indossa subito, come sempre
}
function compra() { if (da.value.length && !manca.value) emit('indossa', { ...bozza.value }) }
function annulla() { bozza.value = { ...props.abito } }
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
        <button v-for="(v, i) in voci" :key="v.id" class="f3-gua-gettone" :class="{ sel: v.sel, velata: !v.libero, vendita: v.st === 'in-vendita' }" :data-capo="scheda + ':' + v.id"
                :aria-pressed="v.addosso" :aria-label="v.nome + (v.libero ? '' : ', livello ' + v.liv)" :style="{ '--i': i, '--col': '#' + v.c.toString(16).padStart(6, '0') }" @click="tocca(v)">
          <span class="f3-gua-campione" :class="{ vuoto: !v.c }"><em v-if="v.emoji" aria-hidden="true">{{ v.emoji }}</em><i v-if="!v.libero" class="f3-gua-lucchetto" aria-hidden="true">🔒</i></span>
          <b>{{ v.nome }}</b>
          <small v-if="!v.libero">Livello {{ v.liv }}</small>
          <small v-else-if="v.st === 'in-vendita'" class="f3-gua-prezzo">🪙{{ v.prezzo }}</small>
          <small v-else-if="v.st === 'mio'">✓ tuo</small>
        </button>
      </div>
    </div>
    <div v-if="cambiata && da.length" class="f3-gua-compra" data-f3="guardaroba-compra">
      <button type="button" class="f3-gua-acquista" :class="{ manca: manca > 0 }" data-f3="guardaroba-acquista" :aria-disabled="manca > 0 || null" @click="compra">🛒 Acquista e indossa 🪙{{ costo }}</button>
      <button type="button" class="f3-gua-annulla" data-f3="guardaroba-annulla" @click="annulla">↩ Annulla</button>
    </div>
    <p class="f3-gua-riga" data-f3="guardaroba-riga">{{ riga }}</p>
  </div>
</template>
