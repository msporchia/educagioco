<script setup>
/* Il campo: tre stati (vuoto, cresce, pronto), il prezzo si vede prima di premere, niente si perde
   mai — vedi docs/fattoria/campi-e-silos.md. Non sa niente del profilo: riceve stato/monete. */
import { computed } from 'vue'
import { PRODOTTI } from '../dati/coltivazioni.js'
import Merce from './Merce.vue'
import Passo from './Passo.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  // quello che torna da Fattoria.statoCampo()
  stato: { type: Object, required: true },
  monete: { type: Number, default: 0 },
  // quanto ci sta ancora nel silo del raccolto: zero vuol dire che raccogliere non si può
  ciSta: { type: Number, default: 99 },
  // il silo del raccolto non è ancora costruito: si dice prima di seminare, non a raccolto pronto
  senzaSilo: { type: Boolean, default: false },
  prezzoSilo: { type: Number, default: 0 },
  // Quelle che il livello ha già aperto; le porta chi apre il foglio.
  colture: { type: Array, default: () => [] },
  // Il prossimo passo quando il raccolto non ha dove andare (motore/consiglio.js).
  passo: { type: Object, default: null },
})
const emit = defineEmits(['semina', 'raccogli', 'chiudi', 'passo'])

const c = computed(() => props.stato.coltura)
const pieno = computed(() => !props.stato.vuoto && props.stato.pronto &&
                             props.ciSta < (c.value ? c.value.resa : 0))
const prodotto = k => PRODOTTI[k] || { nome: k, emoji: '📦' }
</script>

<template>
  <div class="fa-foglio">
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>{{ stato.vuoto ? 'Un campo da seminare' : c.nome }}</h2>

    <!-- ── vuoto: cosa ci metto ── -->
    <template v-if="stato.vuoto">
      <p>Scegli cosa seminare. Ci vuole del tempo vero: puoi chiudere il
         gioco e tornare quando è cresciuto.</p>
      <!-- Quanto ne hai già, sotto ogni coltura: trasforma i bottoni in una scelta. -->
      <!-- fa-semi scorre: con l'orto sono tredici semi, più di quanti ne stiano in uno schermo. -->
      <div class="fa-nomi fa-semi">
        <button v-for="k in colture" :key="k.id"
                :class="['fa-cibo', 'grande', k.ciSta < k.resa ? 'colma' : 'suo']"
                :disabled="k.semina > monete" @click="emit('semina', k)">
          <Merce :merce="k.da" :lato="44" />
          <span>{{ k.nome }}</span>
          <u>{{ k.ciSta < k.resa ? 'pieno · ' + k.hai : 'ne hai ' + k.hai }}</u>
          <em>{{ k.minuti }} min</em>
        </button>
      </div>
      <p v-if="senzaSilo" class="fa-piccolo">Ti servirà anche il <b>silo
         del raccolto</b> (🪙{{ prezzoSilo }}): è lì che finisce quello
         che raccogli, e senza non c'è dove metterlo.</p>
      <p v-else class="fa-piccolo">Seminare è gratis: <b>si paga
         raccogliendo</b>, una monetina. Un campo dà <b>una</b> cosa, e
         quella finisce nel silo del raccolto: al fienile diventa mangime
         per le bestie del cortile, al mulino pappa per il cane e il
         gatto.</p>
    </template>

    <!-- ── sta crescendo ── -->
    <template v-else-if="!stato.pronto">
      <p>{{ c.emoji }} Sta crescendo. È pronto fra
         <b>{{ stato.manca }} {{ stato.manca === 1 ? 'minuto' : 'minuti' }}</b>.</p>
      <div class="fa-bisogni">
        <div class="fa-bisogno">
          <Merce :merce="c.da" :lato="26" />
          <span class="fa-livello">
            <i :style="{ width: Math.round(stato.quanto * 100) + '%', background: '#8fcf6f' }"></i>
          </span>
          <em>{{ Math.round(stato.quanto * 100) }}%</em>
        </div>
      </div>
      <p class="fa-piccolo">Non serve restare a guardare: cresce anche a
         gioco chiuso, e non si secca mai.</p>
    </template>

    <!-- ── pronto ── -->
    <template v-else>
      <p class="fa-pronto"><Merce :merce="c.da" :lato="48" />
         <b>È pronto!</b> Ne
         {{ c.resa === 1 ? 'viene' : 'vengono' }} {{ c.resa }}
         {{ prodotto(c.da).nome.toLowerCase() }}.</p>
      <!-- Non ci sta: il perché lo dice il consiglio, e porta il tasto. -->
      <template v-if="pieno">
        <p class="fa-piccolo">Il campo ti aspetta: non si perde niente.</p>
        <Passo :passo="passo" @fai="a => emit('passo', a)" />
      </template>
      <p v-else-if="c.raccolta > monete" class="fa-piccolo">Ti
         {{ c.raccolta - monete === 1 ? 'serve' : 'servono' }}
         <b>🪙{{ c.raccolta - monete }}</b> in più per raccoglierlo. Resta
         qui ad aspettarti: fai un po' di esercizi e torna.</p>
    </template>

    <div class="fa-fila">
      <button class="fa-bot piano" @click="emit('chiudi')">Chiudi</button>
      <button v-if="!stato.vuoto && stato.pronto" class="fa-bot forte"
              :disabled="pieno || c.raccolta > monete" @click="emit('raccogli')">
        Raccogli{{ c.raccolta ? ` · 🪙${c.raccolta}` : '' }}</button>
    </div>
  </div>
</template>
