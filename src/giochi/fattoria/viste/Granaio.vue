<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL GRANAIO: SI APRE TOCCANDO UN SILO

   *Ribalta la scelta di prima*, che ne faceva una linguetta del baule
   accanto a «Verde» e «Case». Era comodo e diceva la cosa sbagliata: il
   granaio finiva in mezzo alle cose da **comprare**, e in un elenco dove
   ogni linguetta si apre e si posa quella era l'unica che si guardava e
   basta. Peggio: faceva sembrare le scorte una schermata del gioco, cioè
   qualcosa che c'è e basta, mentre sono **il contenuto di una cosa che
   hai costruito**.

   Adesso si tocca un silo, come si tocca un campo per vedere cosa ci
   cresce e un recinto per vedere se ha fame. È lo stesso gesto di tutto
   il resto — «tocca una cosa tua e vedi cosa ci si può fare» — e ha una
   conseguenza voluta: **senza silo il granaio non si guarda**. Non è una
   punizione, è quello che rende il silo una cosa da desiderare invece
   che un numero che cresce; e siccome un tetto che non si vede è un
   tetto che si scopre tardi, chi non ha silos se lo sente dire quando
   raccoglie (`Gioco.vue`) e leggendo la scheda di un campo.

   Non sa niente del profilo: riceve `granaio`, `capienza` e `silos`.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { PRODOTTI, GRANAIO_PER_SILO } from '../dati/coltivazioni.js'

const props = defineProps({
  granaio: { type: Object, default: () => ({}) },
  capienza: { type: Number, default: 0 },
  silos: { type: Number, default: 1 },
})
defineEmits(['chiudi'])

const PRODOTTO = Object.entries(PRODOTTI).map(([id, p]) => ({ id, ...p }))
const quanti = id => props.granaio[id] || 0
/* Quanto è pieno, in centesimi: serve alla strisciolina sotto ogni
   prodotto. Il tetto è per prodotto, non per tutto il granaio insieme —
   è la cosa che di solito si dà per scontata al contrario. */
const pieno = id => Math.min(100, Math.round(quanti(id) / (props.capienza || 1) * 100))
const roba = computed(() => PRODOTTO.reduce((n, p) => n + quanti(p.id), 0))
</script>

<template>
  <div class="fa-foglio fa-granaio">
    <h2>Il granaio</h2>
    <p v-if="roba">Quello che hai raccolto e quello che ti hanno dato gli
       animali. Non si vende: serve alle macchine e alle ciotole.</p>
    <p v-else>Qui dentro finisce quello che raccogli dai campi. Adesso è
       vuoto: semina qualcosa e torna a guardare.</p>

    <div class="fa-scaffale">
      <div v-for="p in PRODOTTO" :key="p.id"
           :class="['fa-voce', { tua: quanti(p.id) }]">
        <span class="fa-ripiano"><b class="fa-frutto">{{ p.emoji }}</b></span>
        <span class="fa-nome">{{ p.nome }}</span>
        <span :class="['fa-prezzo', { tuo: quanti(p.id) }]">
          {{ quanti(p.id) ? '×' + quanti(p.id) : '—' }}</span>
        <span class="fa-quanto"><i :style="{ width: pieno(p.id) + '%' }"></i></span>
      </div>
    </div>

    <p class="fa-piccolo">Di ogni cosa ce ne stanno <b>{{ capienza }}</b>.
       Hai {{ silos === 1 ? 'un silo' : silos + ' silos' }}, e ognuno che
       metti giù ne aggiunge <b>{{ GRANAIO_PER_SILO }}</b>.</p>

    <div class="fa-fila"><button class="fa-bot" @click="$emit('chiudi')">Chiudi</button></div>
  </div>
</template>
