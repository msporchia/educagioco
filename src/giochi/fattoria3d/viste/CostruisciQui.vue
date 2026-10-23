<script setup>
// «Cosa costruiamo?»: il foglio che si apre tenendo premuto su un posto libero del proprio terreno. Schede per categoria in alto
// (scorrono di lato se non ci stanno) e sotto una griglia di carte, tre per riga; il corpo scorre in verticale. Una carta ha il
// anteprima 3D del pezzo o dell'edificio (il modello vero, fotografato dalla scena: `anteprima(tipo)`, scena3d/anteprime.js) e,
// finché non è pronta o per gli strumenti, l'emoji su una piastrella del colore della scheda. Una carta non ancora arrivata è velata col lucchetto: toccarla la fa tremare e dice il livello qui sotto. Il resto
// lo decide chi la usa (`scegli`): qui non si compra niente. Vedi docs/fattoria3d/scena.md.
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { CATEGORIE } from '../dati/catalogo.js'

let ultimaScheda = 'campi'                 // il foglio si riapre dove s'era lasciato (finché la pagina vive)

const props = defineProps({
  schede: { type: Object, required: true },           // { campi: [carta…], … } (dati/carte.js)
  messaggio: { type: String, default: '' },            // un rifiuto del motore («Servono 🪙 28»)
  anteprima: { type: Function, default: null },        // tipo → Promise<dataURL|null>: l'immagine 3D, una per volta (il file del 3D non si importa qui)
  anteprimaPronta: { type: Function, default: null },  // tipo → dataURL|null subito, se c'è già
})
const emit = defineEmits(['scegli', 'chiudi'])

const scheda = ref(CATEGORIE[ultimaScheda] ? ultimaScheda : 'campi')
const msg = ref(props.messaggio)
const trema = ref('')
let tremaFine = 0
watch(() => props.messaggio, m => { msg.value = m })

const visibile = k => !!CATEGORIE[k].strumenti || (props.schede[k] || []).length > 0          // «Feste» sparisce quando non ha carte (fuori stagione, senza regali della fiera)
const segnalata = k => (props.schede[k] || []).some(c => c.segnala)       // una carta con il «!» accende la sua linguetta
function vai(c) { scheda.value = ultimaScheda = c; msg.value = ''; chiedi(c) }

// le anteprime: dalla scheda aperta e poi le altre; ognuna entra in `img` quando è pronta ('' = non ce n'è: resta l'emoji)
const img = reactive({}), viste = reactive({})
let aperto = true
function chiedi(cat) {
  for (const c of props.schede[cat] || []) {
    if (c.genere === 'strumento' || c.id in img) continue
    const pronta = props.anteprimaPronta && props.anteprimaPronta(c.id)
    if (pronta) { img[c.id] = pronta; continue }
    if (!props.anteprima) continue
    img[c.id] = null                                    // chiesta, non ancora arrivata
    props.anteprima(c.id).then(u => { if (aperto) img[c.id] = u || '' }, () => { if (aperto) img[c.id] = '' })
  }
}
onMounted(() => { chiedi(scheda.value); for (const k of Object.keys(CATEGORIE)) chiedi(k) })
onBeforeUnmount(() => { aperto = false })
function tocca(carta) {
  if (carta.bloccata) {
    msg.value = `${carta.nome}: arriva al livello ${carta.liv}`
    trema.value = carta.id; clearTimeout(tremaFine); tremaFine = setTimeout(() => { trema.value = '' }, 450)
    return
  }
  msg.value = ''
  emit('scegli', carta)
}
</script>

<template>
  <div class="f3-velo" data-f3="costruisci-velo" @click.self="emit('chiudi')">
    <div class="f3-foglio f3-colonna f3-costruisci" data-f3="costruisci-qui">
      <h2>Cosa costruiamo?</h2>
      <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="emit('chiudi')">✕</button>
      <div class="f3-schede" role="tablist">
        <button v-for="(c, k) in CATEGORIE" v-show="visibile(k)" :key="k" role="tab" :class="{ acceso: scheda === k }" :aria-selected="scheda === k" :data-scheda="k" :data-cat="k" @click="vai(k)">
          <span class="em">{{ c.emoji }}</span>{{ c.nome }}<i v-if="segnalata(k)" class="f3-esclama" data-f3="scheda-esclama" aria-label="c'è un edificio da costruire">!</i>
        </button>
      </div>
      <div class="f3-corpo">
        <div class="f3-griglia-carte" :key="scheda">
          <!-- aria-disabled e non disabled: toccare una carta chiusa deve dire il livello -->
          <button v-for="c in schede[scheda]" :key="c.id" class="carta" :class="{ bloccata: c.bloccata, trema: trema === c.id, daCostruire: c.segnala, magazzino: c.etichetta.startsWith('📦') }"
                  :data-carta="c.id" :data-cat="scheda" :aria-disabled="c.bloccata || null" @click="tocca(c)">
            <span class="disegno">
              <span v-if="!viste[c.id]" class="em" :class="{ attesa: c.genere !== 'strumento' && img[c.id] !== '' }">{{ c.emoji }}</span>
              <img v-if="img[c.id]" class="anteprima" :class="{ vista: viste[c.id] }" :src="img[c.id]" :alt="c.nome" width="72" height="72" draggable="false"
                   :data-anteprima="viste[c.id] ? 'pronta' : null" @load="viste[c.id] = true">
            </span>
            <i v-if="c.segnala" class="f3-esclama" data-f3="carta-esclama" aria-label="da costruire">!</i>
            <b>{{ c.nome }}</b>
            <small v-if="c.bloccata">🔒 Livello {{ c.liv }}</small>
            <small v-else class="prezzo">{{ c.etichetta }}</small>
          </button>
        </div>
        <p v-if="msg" class="f3-messaggio" data-f3="costruisci-msg">{{ msg }}</p>
      </div>
    </div>
  </div>
</template>
