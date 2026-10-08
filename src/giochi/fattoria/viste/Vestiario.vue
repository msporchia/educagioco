<script setup>
/* Vestilo: uno slot per punto di attacco (testa, muso, collo, schiena), organizzato come sta addosso
   e non per prezzo — vedi docs/fattoria/animali.md. Premere un cappello già occupato lo cambia;
   quello che non hai si compra premendolo. Non sa niente del profilo. */
import { computed } from 'vue'
import { AGGANCI_TUTTI } from '../dati/animali.js'
import Provino from './Provino.vue'
import Pixel from './Pixel.vue'
import Chiudi from './Chiudi.vue'

const NOMI = {
  testa: 'In testa', muso: 'Sul muso',
  collo: 'Al collo', schiena: 'Sulla schiena',
}

const props = defineProps({
  chi: { type: String, required: true },
  che: { type: String, default: '' },
  nome: { type: String, default: '' },
  // quelli che stanno a questa bestia, già filtrati dal motore
  addobbi: { type: Array, default: () => [] },
  // {aggancio: id} — quello che ha addosso adesso
  portati: { type: Object, default: () => ({}) },
  // {id: quanti} — comprati e non addosso a nessuno
  guardaroba: { type: Object, default: () => ({}) },
  monete: { type: Number, default: 0 },
})
const emit = defineEmits(['metti', 'togli', 'chiudi'])

// Solo gli agganci che questa bestia ha davvero (il pappagallo non ha la schiena).
const gruppi = computed(() => AGGANCI_TUTTI
  .map(dove => ({ dove, nome: NOMI[dove],
                  voci: props.addobbi.filter(a => a.dove === dove) }))
  .filter(g => g.voci.length))

const ce = a => (props.guardaroba[a.id] || 0) > 0
const addosso = a => props.portati[a.dove] === a.id
const manca = a => Math.max(0, a.prezzo - props.monete)
// Un sospeso si mette e si toglie ma non si compra: il tasto c'è solo se ce l'ha.
const puoi = a => addosso(a) || ce(a) || (!a.sospeso && manca(a) === 0)
</script>

<template>
  <div class="fa-foglio fa-vestiario" data-vestiario>
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>Vesti {{ nome || che }}</h2>
    <Provino :pezzo="chi + '_giu0'" :lato="64" />
    <p>Quello che gli metti si vede <b>in fattoria</b>, mentre cammina.
       Toglierlo non lo perde: torna nel guardaroba.</p>

    <section v-for="g in gruppi" :key="g.dove" class="fa-blocco">
      <div class="fa-testa">
        <b>{{ g.nome }}</b>
        <span></span>
        <!-- Il ✕ compare solo se c'è qualcosa da togliere. -->
        <button v-if="portati[g.dove]" class="fa-minuto dentro"
                :data-togli="g.dove" @click="emit('togli', g.dove)">togli</button>
      </div>
      <div class="fa-gesti">
        <button v-for="a in g.voci" :key="a.id"
                :class="['fa-cibo', { suo: addosso(a), viva: addosso(a) || (a.stagione && !ce(a)),
                                      altrui: !puoi(a) }]"
                :data-addobbo="a.id" :disabled="!puoi(a)"
                @click="emit('metti', a.id)">
          <Pixel v-if="a.disegno" :disegno="a.disegno" :lato="30" />
          <b v-else>{{ a.emoji }}</b>
          <span>{{ a.nome }}</span>
          <em v-if="addosso(a)">addosso</em>
          <em v-else-if="ce(a)">ce l'hai</em>
          <em v-else-if="a.sospeso">non si vende più</em>
          <em v-else-if="manca(a)">manca 🪙{{ manca(a) }}</em>
          <em v-else>🪙{{ a.prezzo }}</em>
        </button>
      </div>
    </section>

    <div class="fa-fila">
      <button class="fa-bot forte" @click="emit('chiudi')">Va bene</button>
    </div>
    <p class="fa-piccolo">Quello che compri resta tuo: si può spostare da
       una bestia all'altra quante volte vuoi.</p>
  </div>
</template>
