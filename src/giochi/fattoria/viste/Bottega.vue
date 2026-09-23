<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UNA BOTTEGA DEL PAESE — CHI È VENUTO, E COSA VUOLE

   La sorella di `viste/Mercato.vue`, e si legge allo stesso modo: per
   ogni bancone chi c'è, cosa vuole, le **caselle** (una per pezzo,
   accesa se ce l'hai) e il tasto. La differenza è che qui ogni cliente
   vuole **una cosa sola** — «la pasticcera vuole 3 biscotti» — e che
   un bancone vuoto non è un buco: dice fra quanto arriva qualcuno,
   perché è il motivo per tornare.

   ── I CUORI ───────────────────────────────────────────────────────
   In cima, sotto il nome, la fama della bottega: cinque cuori, uno per
   consegna, e a cinque la bottega **cresce di un bancone**. Stanno in
   cima e non in fondo perché sono la cosa che cambia da una visita
   all'altra, e dicono da soli perché conviene tornare qui invece che
   al banco.

   Non sa niente del profilo né del granaio: riceve la bottega già
   contata da `motore/botteghe.js` (`bottegaDi`) e manda fuori
   `consegna` e `rifiuta` col numero del cliente.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { ATTESA_MIN, ATTESA_MAX, BANCONI_MAX } from '../dati/botteghe.js'
import Merce from './Merce.vue'
import Chiudi from './Chiudi.vue'

const props = defineProps({
  /* `{ id, nome, fama: { banconi, cuori, di, piena }, banconi: [...] }`
     — vedi `bottegaDi` */
  bottega: { type: Object, required: true },
})
const emit = defineEmits(['consegna', 'rifiuta', 'chiudi', 'albero'])

const clienti = computed(() => props.bottega.banconi.filter(b => b.cliente))
const attese = computed(() => props.bottega.banconi.filter(b => !b.cliente))
const pronti = computed(() => clienti.value.filter(b => b.cliente.pronto).length)

const caselle = riga => Array.from({ length: riga.serve },
                                   (_, i) => ({ piena: i < riga.hai }))
</script>

<template>
  <div class="fa-foglio fa-mercato fa-bottega" data-bottega :data-bottega-id="bottega.id">
    <Chiudi @chiudi="$emit('chiudi')" />
    <h2>{{ bottega.nome }}</h2>

    <!-- La fama: cinque cuori, e cosa succede quando sono pieni. A tre
         banconi la bottega è cresciuta del tutto, e la riga lo dice
         invece di promettere un bancone che non arriverà. -->
    <div class="fa-fama" data-fama :data-cuori="bottega.fama.cuori">
      <span class="fa-cuori">
        <span v-for="i in bottega.fama.di" :key="i"
              :class="['fa-cuore', { pieno: i <= bottega.fama.cuori }]">
          {{ i <= bottega.fama.cuori ? '❤️' : '🤍' }}</span>
      </span>
      <span class="fa-piccolo" v-if="!bottega.fama.piena">
        {{ bottega.fama.banconi === 1 ? 'Un bancone' : bottega.fama.banconi + ' banconi' }}
        · a {{ bottega.fama.di }} cuori ne arriva un altro</span>
      <span class="fa-piccolo" v-else>
        {{ BANCONI_MAX }} banconi: la bottega è famosa</span>
    </div>

    <p v-if="pronti">{{ pronti === 1 ? 'C\'è chi' : 'Ce ne sono ' + pronti + ' che' }}
       puoi accontentare adesso: la roba esce dal silo e la fattoria
       <b>cresce di livello</b>.</p>
    <p v-else-if="clienti.length">Qui vengono per una cosa sola, e la
       vogliono proprio da te. Ogni consegna è un cuore.</p>
    <p v-else>Per adesso non c'è nessuno. Torna fra poco.</p>

    <div class="fa-ordini">
      <div v-for="b in clienti" :key="b.cliente.id" class="fa-ordine"
           :class="{ pronto: b.cliente.pronto }" :data-cliente="b.cliente.id">
        <div class="fa-chi">
          <b>{{ b.cliente.cliente.emoji }}</b>
          <span>{{ b.cliente.cliente.nome }} vuole</span>
          <em class="fa-premio-xp">⭐ {{ b.cliente.xp }}</em>
        </div>

        <div class="fa-chiede">
          <span v-for="r in b.cliente.righe" :key="r.prodotto" class="fa-pezzetto">
            <span class="fa-caselle">
              <span v-for="(c, i) in caselle(r)" :key="i"
                    :class="['fa-casella', { piena: c.piena }]">
                <Merce :merce="r.prodotto" :lato="22" />
              </span>
            </span>
            <u>{{ r.hai }} su {{ r.serve }} · {{ r.nome.toLowerCase() }}</u>
          </span>
        </div>

        <div class="fa-fila">
          <!-- «Non mi va» costa quanto consegnare: il cliente dopo arriva
               fra dieci e venti minuti in tutti e due i casi. Sta
               scritto sul tasto, perché una cosa che si scopre dopo
               averla premuta è una trappola. -->
          <button class="fa-bot piano piccolo" data-azione="rifiuta"
                  :title="`il prossimo arriva fra ${ATTESA_MIN}–${ATTESA_MAX} minuti`"
                  @click="emit('rifiuta', b.cliente.id)">✕ non mi va</button>
          <button class="fa-bot forte" data-azione="consegna"
                  :disabled="!b.cliente.pronto" @click="emit('consegna', b.cliente.id)">
            Consegna</button>
        </div>
        <!-- Quello che manca **si preme**: apre l'albero di quella
             merce, come al mercato (`viste/Albero.vue`). -->
        <p v-if="!b.cliente.pronto" class="fa-piccolo fa-manca">
          <span>Ti serve ancora</span>
          <button v-for="r in b.cliente.righe.filter(r => !r.pieno)" :key="r.prodotto"
                  type="button" class="fa-manca-tasto" :data-albero-apri="r.prodotto"
                  @click="emit('albero', r.prodotto)">
            <b>{{ r.serve - r.hai }}
            <Merce :merce="r.prodotto" :lato="20" />
            {{ r.nome.toLowerCase() }}</b> 🌳</button>
        </p>
      </div>
    </div>

    <!-- Un bancone vuoto dice fra quanto arriva qualcuno: è il motivo
         per tornare, e senza la bottega sembrerebbe più piccola di
         com'è. -->
    <p v-for="b in attese" :key="'a' + b.i" class="fa-piccolo" data-attesa>
      <template v-if="b.minuti > 0">Al bancone arriva qualcuno fra
        <b>{{ b.minuti }}</b> {{ b.minuti === 1 ? 'minuto' : 'minuti' }}.</template>
      <template v-else>Al bancone sta per arrivare qualcuno.</template>
    </p>

    <p class="fa-piccolo">Come al mercato, consegnare non dà monete ma
       <b>esperienza</b> — e qui un po' di più, perché è roba di mestiere.</p>
  </div>
</template>
