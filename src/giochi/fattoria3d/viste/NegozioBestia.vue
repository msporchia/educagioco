<script setup>
// Il negozio degli addobbi (docs/fattoria3d/addobbi.md): la bestia fa da modello, grande, e si gira col dito; sotto gli scaffali per
// aggancio (testa, occhi, collo, schiena) con le schede degli addobbi, e per quello scelto i colori. Toccare una scheda o un colore PROVA l'addobbo
// sulla bestia, senza pagare; il tasto in fondo compra (ogni colore si paga, e comprato resta tuo) e mette, oppure mette gratis un colore che hai,
// oppure toglie. Qui non si decide niente: i gesti vanno a chi lo usa (`compra`, `spoglia`), che parla col motore (motore/cura.js).
// Il modello lo fotografa `scena3d/anteprime.js` (tipo `vestita:<bestia>|<gradi>|<aggancio>=<chiave>;…`), un angolo per volta.
import { ref, computed, watch, onMounted } from 'vue'
import { AGGANCI_TUTTI } from '../dati/addobbi.js'
import '../stile-negozio-bestie.css'

const props = defineProps({
  id: { type: String, required: true },
  nome: { type: String, default: '' },
  emoji: { type: String, default: '' },
  vestiario: { type: Array, default: () => [] },    // Cura.vestiarioDi: [{ id, nome, emoji, prezzo, dove, liv, bloccato, fuoriStagione, stagione, addosso (colore), colori: [{ id, nome, hex, hai, addosso }] }]
  addosso: { type: Object, default: () => ({}) },   // { aggancio: chiave } quello che porta adesso
  monete: { type: Number, default: 0 },
  messaggio: { type: String, default: '' },
  anteprima: { type: Function, default: null },
  anteprimaPronta: { type: Function, default: null },
})
const emit = defineEmits(['compra', 'spoglia', 'chiudi'])

const SCAFFALI = { testa: ['🎩', 'In testa'], muso: ['👓', 'Occhi'], collo: ['🧣', 'Al collo'], schiena: ['🎒', 'Sulla schiena'] }
const scaffali = computed(() => AGGANCI_TUTTI.filter(d => props.vestiario.some(a => a.dove === d)).map(d => ({ id: d, emoji: SCAFFALI[d][0], nome: SCAFFALI[d][1] })))
const scaffale = ref('')
const scelto = ref('')                                // l'id dell'addobbo in prova
const coloreScelto = ref('')                          // l'id del colore in prova
const gradi = ref(40)                                // si comincia di tre quarti: di faccia una bestia a quattro zampe è una macchia

const suoi = computed(() => props.vestiario.filter(a => a.dove === (scaffale.value || (scaffali.value[0] || {}).id)))
const addobbo = computed(() => props.vestiario.find(a => a.id === scelto.value) || null)
const colore = computed(() => (addobbo.value && addobbo.value.colori.find(c => c.id === coloreScelto.value)) || null)
const chiave = computed(() => (addobbo.value && colore.value ? addobbo.value.id + ':' + colore.value.id : ''))
const hex = c => '#' + c.hex.toString(16).padStart(6, '0')
const prezzoDa = a => (a.colori.some(c => c.hai || c.addosso) ? '' : 'da ') + '🪙' + a.prezzo

/** Cosa si vede sulla bestia: quello che porta, e al posto dell'aggancio in prova il colore provato. */
const inProva = computed(() => (chiave.value ? { ...props.addosso, [addobbo.value.dove]: chiave.value } : props.addosso))
const tipo = computed(() => `vestita:${props.id}|${gradi.value}|${Object.entries(inProva.value).map(([d, k]) => d + '=' + k).join(';')}`)

// Le schede mostrano il modello dell'addobbo, non un'emoji: la foto fatta sul computer (`npm run anteprime`, tipo `addobbo:<id>:<colore>`), nel colore che
// porta, o che hai, o il primo. Finché non arriva (o se manca) c'è l'emoji.
const foto = ref({})
const coloreDiScheda = a => a.addosso || (a.colori.find(c => c.hai) || a.colori[0]).id
const fotoDi = a => foto.value[a.id + ':' + coloreDiScheda(a)] || ''
function caricaFoto() {
  if (!props.anteprima) return
  for (const a of props.vestiario) {
    const k = a.id + ':' + coloreDiScheda(a)
    if (k in foto.value) continue
    foto.value[k] = ''
    Promise.resolve(props.anteprima('addobbo:' + k)).then(u => { if (u) foto.value = { ...foto.value, [k]: u } }, () => {})
  }
}
watch(() => props.vestiario, caricaFoto)
onMounted(caricaFoto)

const ritratto = ref('')
let ultimo = ''
async function disegna() {
  const t = tipo.value; ultimo = t
  const pronta = props.anteprimaPronta && props.anteprimaPronta(t)
  if (pronta) { ritratto.value = pronta; return }
  if (!props.anteprima) return
  const url = await props.anteprima(t)
  if (url && ultimo === t) ritratto.value = url           // se nel frattempo ha girato o provato altro, vale l'ultimo
}
watch(tipo, disegna)
onMounted(disegna)

function scegliScaffale(d) { scaffale.value = d; scelto.value = ''; coloreScelto.value = '' }
function scegliAddobbo(a) {
  scelto.value = a.id
  coloreScelto.value = a.addosso || (a.colori.find(c => c.hai) || a.colori[0]).id         // quello che porta, o uno che hai già, o il primo
}
// Un cambio da fuori (compra, toglie) rimette in forma la scelta: l'addobbo c'è ancora, il colore pure.
watch(() => props.vestiario, () => { if (scelto.value && !addobbo.value) scelto.value = '' })

const passo = 30
const gira = d => { gradi.value = (gradi.value + d * passo + 360) % 360 }
let da = null, resto = 0
function giu(e) { da = e.clientX; resto = 0; e.currentTarget.setPointerCapture?.(e.pointerId) }
function muovi(e) {
  if (da === null) return
  resto += e.clientX - da; da = e.clientX
  while (Math.abs(resto) >= 24) { gira(resto > 0 ? -1 : 1); resto -= Math.sign(resto) * 24 }
}
function su() { da = null }

const bottone = computed(() => {
  const a = addobbo.value, c = colore.value
  if (!a || !c) return null
  if (c.addosso) return { testo: 'Togli', classe: 'togli', azione: 'spoglia' }
  if (c.hai) return { testo: 'Metti · gratis', classe: 'metti', azione: 'compra' }
  if (a.bloccato) return { testo: '🔒 Livello ' + a.bloccato, classe: 'chiuso', azione: 'compra' }
  if (a.fuoriStagione) return { testo: 'Solo a ' + (a.stagione === 'natale' ? 'Natale' : 'Halloween'), classe: 'chiuso', azione: 'compra' }
  return { testo: `Compra e metti · 🪙${a.prezzo}`, classe: a.prezzo > props.monete ? 'manca' : 'compra', azione: 'compra' }
})
function azione() {
  const a = addobbo.value, c = colore.value, b = bottone.value
  if (!a || !c || !b) return
  if (b.azione === 'spoglia') emit('spoglia', { ...a, dove: a.dove })
  else emit('compra', chiave.value)
}
const riga = computed(() => {
  const a = addobbo.value, c = colore.value
  if (!a) return props.messaggio || `Tocca un addobbo per provarlo su ${props.nome}.`
  return props.messaggio || `${a.nome} ${c.nome.toLowerCase()}: ${c.addosso ? 'ce l\'ha addosso.' : c.hai ? 'è tuo, lo metti gratis.' : 'lo provi, poi lo compri.'}`
})
</script>

<template>
  <div class="f3-foglio f3-colonna f3-neg" data-f3="negozio-bestia" :data-bestia="id">
    <header class="f3-neg-insegna"><span aria-hidden="true">🛍️</span><h2>Negozio di {{ nome }}</h2><b class="f3-neg-monete" data-f3="negozio-monete">🪙{{ monete }}</b></header>
    <button class="f3-chiudi f3-neg-x" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-neg-palco" data-f3="negozio-palco">
      <button type="button" class="f3-neg-gira" data-gira="-1" aria-label="gira a sinistra" @click="gira(-1)">◀</button>
      <div class="f3-neg-modello" @pointerdown="giu" @pointermove="muovi" @pointerup="su" @pointercancel="su">
        <img v-if="ritratto" :src="ritratto" :alt="'Ritratto di ' + nome" draggable="false">
        <span v-else class="f3-neg-attesa" aria-hidden="true">{{ emoji }}</span>
      </div>
      <button type="button" class="f3-neg-gira" data-gira="1" aria-label="gira a destra" @click="gira(1)">▶</button>
    </div>
    <p class="f3-neg-riga" data-f3="negozio-riga">{{ riga }}</p>
    <nav class="f3-neg-scaffali">
      <button v-for="s in scaffali" :key="s.id" type="button" :class="{ acceso: (scaffale || scaffali[0].id) === s.id }" :data-scaffale="s.id" @click="scegliScaffale(s.id)">
        <span aria-hidden="true">{{ s.emoji }}</span> {{ s.nome }}
      </button>
    </nav>
    <div class="f3-corpo f3-neg-corpo">
      <div class="f3-neg-schede">
        <button v-for="a in suoi" :key="a.id" type="button" class="f3-neg-scheda" :class="{ sel: scelto === a.id, chiusa: a.bloccato || (a.fuoriStagione && !a.colori.some(c => c.hai || c.addosso)) }"
                :data-addobbo="a.id" :aria-pressed="scelto === a.id" @click="scegliAddobbo(a)">
          <img v-if="fotoDi(a)" class="f3-neg-foto" :src="fotoDi(a)" alt="" draggable="false"><b v-else aria-hidden="true">{{ a.emoji }}</b><span>{{ a.nome }}</span>
          <em v-if="a.addosso">✓ addosso</em><em v-else-if="a.bloccato">🔒 Livello {{ a.bloccato }}</em><em v-else>{{ prezzoDa(a) }}</em>
          <i v-if="a.stagione" class="f3-neg-festa" aria-hidden="true">{{ a.stagione === 'natale' ? '🎄' : '🎃' }}</i>
        </button>
      </div>
    </div>
    <section v-if="addobbo" class="f3-neg-colori" data-f3="negozio-colori">
      <div class="f3-neg-campioni">
        <button v-for="c in addobbo.colori" :key="c.id" type="button" class="f3-neg-campione" :class="{ sel: coloreScelto === c.id, tuo: c.hai || c.addosso }"
                :data-colore="c.id" :aria-pressed="coloreScelto === c.id" :aria-label="c.nome + (c.hai || c.addosso ? ', tuo' : ', ' + addobbo.prezzo + ' monete')"
                @click="coloreScelto = c.id">
          <i :style="{ background: hex(c) }"></i><small>{{ c.addosso ? '✓' : c.hai ? 'tuo' : '🪙' + addobbo.prezzo }}</small>
        </button>
      </div>
      <button v-if="bottone" type="button" class="f3-neg-tasto" :class="bottone.classe" data-azione="negozio" @click="azione">{{ bottone.testo }}</button>
    </section>
  </div>
</template>
