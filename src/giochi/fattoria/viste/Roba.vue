<script setup>
/* Il baule: l'elenco di tutto, non solo quello che possiedi. Toccare è già posare (compra e piazza
   insieme) — vedi docs/fattoria/come-si-tocca.md. Non sa niente del profilo: riceve monete/magazzino,
   manda tira. */
import { computed, onMounted, ref } from 'vue'
import { CATEGORIE, ZONE, ANIMALI_ZONA } from '../dati/catalogo.js'
import { chiaveDi } from '../dati/livelli.js'
import { IN_VENDITA } from '../dati/animali.js'
import { SCARTO_DITO, SCARTO_MOUSE } from '../scena/dito.js'
import Provino from './Provino.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  monete: { type: Number, default: 0 },
  magazzino: { type: Object, default: () => ({}) },
  bestie: { type: Array, default: () => [] },     // quelle già comprate
  // id → quanto costa adesso, per quello che rincara a ogni copia (il campo); il conto è del motore.
  prezzi: { type: Object, default: () => ({}) },
  // L'id della voce su cui aprirsi, se il baule è stato aperto da un consiglio.
  punta: { type: String, default: '' },
  // Le chiavi dei premi presi: quello non ancora preso non sta qui, anche se il livello l'ha aperto.
  presi: { type: Array, default: () => [] },
  // Da che metà aprirsi; vuoto vuol dire "decidi tu".
  zonaIniziale: { type: String, default: '' },
  // Gli id delle cose uniche già in mappa (i due silos): una seconda non si può posare.
  posati: { type: Array, default: () => [] },
  // La stagione (dati/stagioni.js): le voci stagione: stanno sullo scaffale solo in quei giorni.
  stagione: { type: String, default: '' },
})
const emit = defineEmits(['tira', 'tiraBestia', 'chiudi'])

// Gli animali passano da un'uscita loro: prima di comparire chiedono un nome.
const ANIMALI = ANIMALI_ZONA

// Un Set: cercare in un array duecento volte a ogni cambio di linguetta sarebbe un conto quadratico.
const presi = computed(() => new Set(props.presi))
const preso = (tipo, id) => presi.value.has(chiaveDi(tipo, id))

// Il granaio non è più una linguetta: si tocca un silo (viste/Granaio.vue) invece di guardarlo qui.

// Una riga sotto il titolo per ogni linguetta: dice cosa ci si fa, che una griglia di figurine non dice da sola.
const DICE = {
  verde: 'Alberi, cespugli e sassi, ma dove vuoi tu.',
  fiori: 'Vasi e fioriere. I fiori piccoli si posano anche sull\'erba.',
  campi: 'La catena, in fila: il campo, i silos, il mulino, il fienile, i recinti.',
  bestiole: 'Cucce, nidi e bestioline. Stanno lì e basta, ma fanno compagnia.',
  raccolto: 'Cassette, ceste e balle di fieno: quello che viene dai campi.',
  acqua: 'Fontane, pozzi e laghetti. La fontana si muove da sola.',
  recinti: 'Per chiudere un pezzo di prato. Una bestia dentro ci resta.',
  case: 'Le cose grandi: costano tanto e si vedono da lontano.',
  arredo: 'Panchine, tavoli e lampioni, da sedersi e da guardare.',
  feste: 'Solo in questi giorni. Quello che compri resta tutto l\'anno.',
  fiera: 'Le sorprese della mongolfiera: non si comprano, si vincono riempiendo le casse.',
}

// punta è l'id di una voce (da un consiglio): il baule si apre dove quella cosa è, metà e linguetta giuste.
const laCategoriaDi = id => (CATEGORIE.find(c => c.voci.some(v => v.id === id)) || null)
const suPunta = CATEGORIE.length ? laCategoriaDi(props.punta) : null

// E la voce deve vedersi: si scorre lo scaffale (non scrollIntoView, che trascinerebbe anche il foglio).
const scaffale = ref(null)
onMounted(() => {
  const s = scaffale.value
  const v = s && s.querySelector('.fa-voce.indicata')
  if (!v) return
  const rs = s.getBoundingClientRect(), rv = v.getBoundingClientRect()
  if (rv.top < rs.top || rv.bottom > rs.bottom)
    s.scrollTop += rv.top - rs.top - (rs.height - rv.height) / 2
})

const zona = ref(suPunta ? (suPunta.zona || 'bello') : (props.zonaIniziale || 'lavoro'))
const categoria = ref(suPunta ? suPunta.chiave : CATEGORIE[0].chiave)
// La linguetta aperta dev'essere una di quelle di questa metà, se no punterebbe a uno scaffale vuoto.
const scheda = computed(() =>
  schede.value.some(s => s.chiave === categoria.value)
    ? categoria.value : (schede.value[0] || {}).chiave)
// Le bestie arrivate; sta sopra zone perché la usa (una computed dopo chi la chiama è una zona morta).
const inVendita = computed(() => IN_VENDITA.filter(a => preso('bestia', a.chi)))

// Una metà senza niente dentro non si mostra: un tasto che apre su niente è un tasto rotto.
const zone = computed(() => ZONE.filter(z => z.chiave === ANIMALI
  ? inVendita.value.length : schedeDi(z.chiave).length))
const quantiNe = id => props.magazzino[id] || 0
const eMia = chi => props.bestie.some(b => (b.chi || b) === chi)

// Quello che il livello ha aperto e si può ancora prendere; se è nel baule resta anche da unico.
const vociDi = chiave => {
  const c = CATEGORIE.find(c => c.chiave === chiave)
  if (!c) return []
  // La fiera non si vende: solo quello che la mongolfiera ha lasciato nel baule.
  return c.voci.filter(v => (v.fiera ? quantiNe(v.id)
      : v.stagione
      ? v.stagione === props.stagione || quantiNe(v.id)
      : preso('cosa', v.id))
    && !(v.unico && props.posati.includes(v.id) && !quantiNe(v.id)))
}

const schedeDi = quale => quale === ANIMALI ? []
  : CATEGORIE.filter(c => (c.zona || 'bello') === quale && vociDi(c.chiave).length)
const schede = computed(() => schedeDi(zona.value))

const costa = v => props.prezzi[v.id] ?? v.prezzo
// Quanto manca per potersela permettere: zero vuol dire che si può.
const manca = v => Math.max(0, costa(v) - props.monete)

// Tocca prende, striscia scorre (in su/giù è del browser, di lato tira fuori e posa) — vedi
// docs/fattoria/come-si-tocca.md e docs/core/il-dito.md.
let dito = null

function premi(e, prendi) {
  dito = { id: e.pointerId, x: e.clientX, y: e.clientY, prendi,
           scarto: e.pointerType === 'mouse' ? SCARTO_MOUSE : SCARTO_DITO }
  // Il puntatore resta legato alla carta anche fuori da lei (setPointerCapture).
  try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) { /* niente */ }
}

function muovi(e) {
  if (!dito || e.pointerId !== dito.id) return
  const dx = e.clientX - dito.x, dy = e.clientY - dito.y
  if (Math.hypot(dx, dy) <= dito.scarto) return
  const { prendi } = dito
  dito = null
  if (e.pointerType !== 'mouse' && Math.abs(dy) >= Math.abs(dx)) return
  prendi(e, true)
}

function lascia(e) {
  if (!dito || e.pointerId !== dito.id) return
  const { prendi } = dito
  dito = null
  prendi(e, false)
}

// Il browser si è preso il dito per scorrere: non è successo niente.
function annulla() { dito = null }

function giu(e, v) {
  if (!quantiNe(v.id) && manca(v)) return
  premi(e, (ev, trascina) =>
    emit('tira', { voce: v, x: ev.clientX, y: ev.clientY, trascina }))
}

function giuBestia(e, a) {
  if (eMia(a.chi) || a.prezzo > props.monete) return
  premi(e, (ev, trascina) =>
    emit('tiraBestia', { bestia: a, x: ev.clientX, y: ev.clientY, trascina }))
}
</script>

<template>
  <div class="fa-baule" @pointermove="muovi" @pointerup="lascia" @pointercancel="annulla">
    <!-- Il resto del gesto sale fin qui: la carta si tiene il puntatore (premi). -->
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>Il baule</h2>

    <nav v-if="zone.length > 1" class="fa-zone">
      <button v-for="z in zone" :key="z.chiave"
              :class="['fa-zona', { viva: z.chiave === zona }]"
              @click="zona = z.chiave">
        <b>{{ z.icona }}</b> {{ z.nome }}</button>
    </nav>

    <!-- Le linguette compaiono solo se sono più di una. -->
    <nav v-if="schede.length > 1" class="fa-schede">
      <button v-for="c in schede" :key="c.chiave"
              :class="['fa-scheda', { viva: c.chiave === scheda }]"
              @click="categoria = c.chiave">
        <b>{{ c.icona }}</b><span>{{ c.nome }}</span></button>
    </nav>

    <p v-if="zona === 'animali'" class="fa-dice">Premi un animale e
       scegli <b>dove farlo arrivare</b>: poi gli dai un nome. Dentro un
       recinto ci resta.</p>
    <p v-else class="fa-dice">{{ DICE[scheda] || 'Premi una cosa e scegli dove metterla.' }}</p>

    <!-- bestie sono i record salvati, non i nomi degli sprite. -->
    <div v-if="zona === 'animali'" class="fa-scaffale">
      <div v-for="a in inVendita" :key="a.chi"
           :class="['fa-voce', { presa: eMia(a.chi),
                                 cara: !eMia(a.chi) && a.prezzo > monete }]"
           @pointerdown="giuBestia($event, a)">
        <!-- il ripiano delle bestie è più alto: un cane è uno sprite 16×32. -->
        <!-- Il prezzo sta appoggiato sulla figura, il nome attaccato sotto: niente cornice attorno. -->
        <span class="fa-ripiano alto"><Provino :pezzo="a.chi + '_giu0'" :lato="88" />
          <span v-if="eMia(a.chi)" class="fa-prezzo tuo">è tua</span>
          <span v-else-if="a.prezzo > monete" class="fa-prezzo manca">
            manca 🪙{{ a.prezzo - monete }}</span>
          <span v-else class="fa-prezzo">🪙{{ a.prezzo }}</span></span>
        <span class="fa-nome">{{ a.nome }}</span>
      </div>
    </div>

    <div v-else ref="scaffale" class="fa-scaffale">
      <div v-for="v in vociDi(scheda)" :key="v.id"
           :class="['fa-voce', { tua: quantiNe(v.id),
                                 cara: !quantiNe(v.id) && manca(v),
                                 indicata: v.id === punta,
                                 lavora: v.campo || v.macchina || v.silo }]"
           @pointerdown="giu($event, v)">
        <span class="fa-ripiano"><Provino :pezzo="v.pezzo" :lato="72" />
          <span v-if="quantiNe(v.id)" class="fa-prezzo tuo">×{{ quantiNe(v.id) }}</span>
          <span v-else-if="manca(v)" class="fa-prezzo manca">manca 🪙{{ manca(v) }}</span>
          <span v-else class="fa-prezzo">🪙{{ costa(v) }}</span></span>
        <span class="fa-nome">{{ v.nome }}</span>
      </div>
    </div>

  </div>
</template>
