<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LE MACCHINE: LA ROBA DEL GRANAIO CHE DIVENTA UN'ALTRA ROBA

   Stessa forma di `Campo.vue` e per la stessa ragione: si tocca una cosa
   propria e si vede cosa ci si può fare. Tre stati — ferma (cosa faccio),
   sta lavorando (quanto manca), pronto (ritira) — e i costi a schermo
   prima di premere.

   ── PERCHÉ UNA MACCHINA E NON UN TASTO IN UN MENÙ ─────────────────
   Perché è **una cosa che si compra e si mette dove si vuole**, e costa
   più di trenta pappe: è lì il money pit della catena. Un tasto «macina»
   nascosto in un pannello sarebbe gratis, e la fattoria smetterebbe di
   essere il posto dove si spendono le monete guadagnate altrove.

   ── E UN RECINTO È UNA MACCHINA ANCHE LUI ─────────────────────────
   Stessi verbi, stesso pannello: dài da mangiare, aspetti, ritiri. Le
   uniche due cose che cambiano sono il **nome** — che arriva dal
   catalogo, perché un foglio che dice «Il mulino» sopra un pollaio è la
   cosa che fa smettere di credere a quello che c'è scritto — e le
   parole, che con degli animali dentro non possono essere quelle di un
   macinino. Non è un secondo pannello: è lo stesso, che sa di chi sta
   parlando.

   ── COSA MANCA SI DICE COL NUMERO ─────────────────────────────────
   Un tasto spento senza il perché è un tasto rotto. Qui il perché è
   sempre un numero — «ti serve 1 🌾 in più» — e lo calcola il motore
   (`cheMancaPer`), non questo file: la stessa divisione della ciotola,
   dove il prezzo si mostra e non si decide.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { PRODOTTI } from '../dati/coltivazioni.js'

const props = defineProps({
  /* quello che torna da `Fattoria.statoMacchina()` */
  stato: { type: Object, required: true },
  nome: { type: String, default: 'La macchina' },
  /* se là dentro ci sono degli animali: cambia solo come si dicono le
     cose, mai cosa fanno i tasti */
  bestie: { type: Boolean, default: false },
  /* le ricette di questa macchina, ognuna già con quello che le manca:
     `{ ricetta, manca: [{ prodotto, quanti }], monete }` */
  ricette: { type: Array, default: () => [] },
  ciSta: { type: Number, default: 99 },
  /* dove finisce quello che esce di qui: come si chiama, se c'è, e
     quanto costa. Un «metti un silo» che non dice quale manda a
     comprare quello sbagliato, e sono 120 monete. */
  silo: { type: String, default: 'silo' },
  senzaSilo: { type: Boolean, default: false },
  prezzoSilo: { type: Number, default: 0 },
})
const emit = defineEmits(['avvia', 'ritira', 'chiudi'])

const r = computed(() => props.stato.ricetta)
const pieno = computed(() => !props.stato.ferma && props.stato.pronto &&
                            props.ciSta < (r.value ? r.value.resa : 0))
const prodotto = k => PRODOTTI[k] || { nome: k, emoji: '📦' }
const puo = v => !v.manca.length && !v.monete
</script>

<template>
  <div class="fa-foglio">
    <h2>{{ nome }}</h2>

    <!-- ── ferma: cosa faccio ── -->
    <template v-if="stato.ferma">
      <p v-if="bestie">Hanno fame. Dai loro quello che hai raccolto, e
         dopo un po' ti danno qualcosa in cambio.</p>
      <p v-else>Metti dentro quello che hai raccolto e ne esce da
         mangiare per i tuoi animali.</p>
      <div class="fa-nomi">
        <button v-for="v in ricette" :key="v.ricetta.id"
                :class="['fa-cibo', puo(v) ? 'suo' : 'altrui']"
                :disabled="!puo(v)" @click="emit('avvia', v.ricetta)">
          <b>{{ v.ricetta.emoji }}</b>
          <span>{{ v.ricetta.nome }} ×{{ v.ricetta.resa }}</span>
          <em>{{ Object.entries(v.ricetta.prende)
                   .map(([k, n]) => n + prodotto(k).emoji).join(' ') }}
              {{ v.ricetta.costo ? ' · 🪙' + v.ricetta.costo : '' }}
              · {{ v.ricetta.minuti }} min</em>
        </button>
      </div>
      <p v-for="v in ricette.filter(v => !puo(v))" :key="v.ricetta.id" class="fa-piccolo">
        Per {{ v.ricetta.nome.toLowerCase() }} ti
        {{ v.manca.length ? 'serve ancora' : 'servono' }}
        <b>{{ [...v.manca.map(m => m.quanti + ' ' + prodotto(m.prodotto).emoji),
               ...(v.monete ? ['🪙' + v.monete] : [])].join(' e ') }}</b>.
      </p>
    </template>

    <!-- ── sta lavorando ── -->
    <template v-else-if="!stato.pronto">
      <p>{{ r.emoji }} {{ bestie ? 'Ci stanno pensando' : 'Sta lavorando' }}. Finisce fra
         <b>{{ stato.manca }} {{ stato.manca === 1 ? 'minuto' : 'minuti' }}</b>.</p>
      <div class="fa-bisogni">
        <div class="fa-bisogno">
          <span>{{ r.emoji }}</span>
          <span class="fa-livello">
            <i :style="{ width: Math.round(stato.quanto * 100) + '%', background: '#e0a33c' }"></i>
          </span>
          <em>{{ Math.round(stato.quanto * 100) }}%</em>
        </div>
      </div>
      <p class="fa-piccolo">Va avanti anche a gioco chiuso, e quando ha
         finito ti aspetta.</p>
    </template>

    <!-- ── pronto ── -->
    <template v-else>
      <p><b>{{ r.emoji }} È pronto!</b> Ci sono
         {{ r.resa }} {{ prodotto(r.da).nome.toLowerCase() }} da portare via.
         Ritirare non costa niente.</p>
      <p v-if="pieno && senzaSilo" class="fa-piccolo">Non hai ancora il
         <b>{{ silo.toLowerCase() }}</b> (🪙{{ prezzoSilo }}): senza, non c'è
         dove metterlo. Non si butta via niente.</p>
      <p v-else-if="pieno" class="fa-piccolo">Nel {{ silo.toLowerCase() }}
         non c'è posto per {{ r.resa }} {{ prodotto(r.da).emoji }}: dai da
         mangiare a qualcuno, o toccalo e ingrandiscilo. Non si butta via
         niente.</p>
    </template>

    <div class="fa-fila">
      <button class="fa-bot piano" @click="emit('chiudi')">Chiudi</button>
      <button v-if="!stato.ferma && stato.pronto" class="fa-bot forte"
              :disabled="pieno" @click="emit('ritira')">Ritira</button>
    </div>
  </div>
</template>
