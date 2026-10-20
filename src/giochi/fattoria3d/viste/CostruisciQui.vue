<script setup>
// «Cosa costruiamo?»: il foglio che si apre tenendo premuto su un posto libero del proprio terreno. Schede per categoria in alto
// (scorrono di lato se non ci stanno) e sotto una griglia di carte, tre per riga; il corpo scorre in verticale. Una carta ha il
// disegno dell'atlante della fattoria di sempre (Provino.vue, non toccato) e l'emoji su una piastrella del colore della scheda dove
// il disegno manca. Una carta non ancora arrivata è velata col lucchetto: toccarla la fa tremare e dice il livello qui sotto. Il resto
// lo decide chi la usa (`scegli`): qui non si compra niente. Vedi docs/fattoria3d/scena.md.
import { ref, watch } from 'vue'
import { CATEGORIE } from '../dati/catalogo.js'
import Provino from '../../fattoria/viste/Provino.vue'

let ultimaScheda = 'campi'                 // il foglio si riapre dove s'era lasciato (finché la pagina vive)

const props = defineProps({
  schede: { type: Object, required: true },           // { campi: [carta…], … } (dati/carte.js)
  messaggio: { type: String, default: '' },            // un rifiuto del motore («Servono 🪙 28»)
})
const emit = defineEmits(['scegli', 'chiudi'])

const scheda = ref(CATEGORIE[ultimaScheda] ? ultimaScheda : 'campi')
const msg = ref(props.messaggio)
const trema = ref('')
let tremaFine = 0
watch(() => props.messaggio, m => { msg.value = m })

function vai(c) { scheda.value = ultimaScheda = c; msg.value = '' }
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
        <button v-for="(c, k) in CATEGORIE" :key="k" role="tab" :class="{ acceso: scheda === k }" :aria-selected="scheda === k" :data-scheda="k" :data-cat="k" @click="vai(k)">
          <span class="em">{{ c.emoji }}</span>{{ c.nome }}
        </button>
      </div>
      <div class="f3-corpo">
        <div class="f3-griglia-carte" :key="scheda">
          <!-- aria-disabled e non disabled: toccare una carta chiusa deve dire il livello -->
          <button v-for="c in schede[scheda]" :key="c.id" class="carta" :class="{ bloccata: c.bloccata, trema: trema === c.id, magazzino: c.etichetta.startsWith('📦') }"
                  :data-carta="c.id" :data-cat="scheda" :aria-disabled="c.bloccata || null" @click="tocca(c)">
            <span class="disegno">
              <Provino v-if="c.disegno" :pezzo="c.disegno" :lato="58" :aria="1" />
              <span v-else class="em">{{ c.emoji }}</span>
            </span>
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
