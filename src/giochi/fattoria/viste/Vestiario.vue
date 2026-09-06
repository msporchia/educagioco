<script setup>
/* ═══════════════════════════════════════════════════════════════════
   VESTILO — UNO SLOT PER PUNTO DI ATTACCO

   Si arriva qui dalla scheda della bestia, e la domanda è una sola:
   **cosa gli metto?** La risposta è organizzata come sta addosso — in
   testa, sul muso, al collo, sulla schiena — e non come sta in un
   negozio, per prezzo. Un elenco ordinato per prezzo si scorre due
   volte: la prima per capire cos'è un cappello e cos'è una sciarpa.

   ── UNO SLOT TIENE UNA COSA SOLA ──────────────────────────────────
   Premere un cappello quando ce n'è già uno **lo cambia**, non dice di
   no: chi preme il secondo sta chiedendo di cambiarlo. Quello di prima
   torna nel guardaroba e si può rimettere quando si vuole — niente si
   perde mai, come nel baule.

   ── QUELLO CHE NON HAI SI COMPRA PREMENDOLO ───────────────────────
   Un gesto solo, come nel baule dove premere è già posare: si preme e
   si paga, e la bestia se lo ritrova addosso. Il prezzo sta scritto sul
   tasto e chi non ce l'ha vede **di quanto** manca, che è il numero che
   rimanda a fare esercizi.

   Non sa niente del profilo: riceve cosa sta a questa bestia, cosa ha
   addosso e cosa c'è in guardaroba.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { AGGANCI_TUTTI } from '../dati/animali.js'
import Provino from './Provino.vue'

const NOMI = {
  testa: 'In testa', muso: 'Sul muso',
  collo: 'Al collo', schiena: 'Sulla schiena',
}

const props = defineProps({
  chi: { type: String, required: true },
  che: { type: String, default: '' },
  nome: { type: String, default: '' },
  /* quelli che stanno a questa bestia, già filtrati dal motore */
  addobbi: { type: Array, default: () => [] },
  /* `{ aggancio: id }` — quello che ha addosso adesso */
  portati: { type: Object, default: () => ({}) },
  /* `{ id: quanti }` — comprati e non addosso a nessuno */
  guardaroba: { type: Object, default: () => ({}) },
  monete: { type: Number, default: 0 },
})
const emit = defineEmits(['metti', 'togli', 'chiudi'])

/* Solo gli agganci che questa bestia ha davvero: il pappagallo non ha
   la schiena, e uno scaffale vuoto col titolo sopra è un buco che non
   si spiega. */
const gruppi = computed(() => AGGANCI_TUTTI
  .map(dove => ({ dove, nome: NOMI[dove],
                  voci: props.addobbi.filter(a => a.dove === dove) }))
  .filter(g => g.voci.length))

const ce = a => (props.guardaroba[a.id] || 0) > 0
const addosso = a => props.portati[a.dove] === a.id
const manca = a => Math.max(0, a.prezzo - props.monete)
const puoi = a => addosso(a) || ce(a) || manca(a) === 0
</script>

<template>
  <div class="fa-foglio fa-vestiario" data-vestiario>
    <h2>Vesti {{ nome || che }}</h2>
    <Provino :pezzo="chi + '_giu0'" :lato="64" />
    <p>Quello che gli metti si vede <b>in fattoria</b>, mentre cammina.
       Toglierlo non lo perde: torna nel guardaroba.</p>

    <section v-for="g in gruppi" :key="g.dove" class="fa-blocco">
      <div class="fa-testa">
        <b>{{ g.nome }}</b>
        <span></span>
        <!-- Il ✕ compare solo se c'è qualcosa da togliere: un tasto che
             non fa niente è peggio di un tasto che non c'è. -->
        <button v-if="portati[g.dove]" class="fa-minuto dentro"
                :data-togli="g.dove" @click="emit('togli', g.dove)">togli</button>
      </div>
      <div class="fa-gesti">
        <button v-for="a in g.voci" :key="a.id"
                :class="['fa-cibo', { suo: addosso(a), viva: addosso(a),
                                      altrui: !puoi(a) }]"
                :data-addobbo="a.id" :disabled="!puoi(a)"
                @click="emit('metti', a.id)">
          <b>{{ a.emoji }}</b>
          <span>{{ a.nome }}</span>
          <em v-if="addosso(a)">addosso</em>
          <em v-else-if="ce(a)">ce l'hai</em>
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
