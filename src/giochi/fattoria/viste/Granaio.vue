<script setup>
/* ═══════════════════════════════════════════════════════════════════
   DENTRO UN SILO: GLI SCOMPARTI, E COME FARLI PIÙ GRANDI

   Si apre toccando un silo — come si tocca un campo per vedere cosa ci
   cresce e un recinto per vedere se ha fame. È lo stesso gesto di tutto
   il resto, «tocca una cosa tua e vedi cosa ci si può fare», e ha una
   conseguenza voluta: **senza silo non c'è niente da guardare**, perché
   senza silo non c'è nemmeno dove mettere la roba.

   ── UNO SCOMPARTO PER MERCE ───────────────────────────────────────
   *Ribalta la scelta di prima*, che era un tetto solo condiviso da
   tutto il silo. Era la risposta giusta a un difetto diverso — un tetto
   per prodotto così alto da non mordere mai — e ha prodotto il suo:
   dodici posti in comune fra sette merci sono due a testa, e un
   bambino che semina sempre la stessa cosa riempiva il silo con quella
   e non poteva più raccogliere niente. Trentadue di mais e quattro di
   carote, e il gioco fermo.

   Adesso ogni merce ha **la sua barretta**, tutte della stessa misura,
   e ingrandire il silo le allarga tutte insieme. Il mais non può più
   mangiarsi il posto delle carote. E la domanda per cui si apre un
   magazzino — *quanto ci sta ancora* — smette di essere un conto e
   diventa una riga da guardare.

   Le barrette **vuote si vedono lo stesso**, ed è metà del mestiere di
   questa schermata: uno scomparto a zero non è un buco, è il posto
   dove potrebbe andare qualcosa. È il modo di far scoprire che si può
   coltivare altro senza dirlo con una frase — e di far scoprire che le
   uova vanno di là.

   ── PREMERE UNA ROBA DICE CHI LA USA ──────────────────────────────
   Dal silo non esce niente con le dita: non si posa e non si vende. Ma
   «🌾 Grano: 3 nel mulino fanno 2 🥣» è la sola cosa utile che una riga
   di magazzino possa dire, ed è il modo in cui la catena si scopre da
   dentro invece che per tentativi.

   Non sa niente del profilo: riceve gli scomparti già contati e quanto
   costa ingrandirli.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, ref, watch } from 'vue'
import { PRODOTTI, SILI, SCOMPARTO_PIU } from '../dati/coltivazioni.js'
import { serveA } from '../dati/bisogni.js'
import { laMacchina } from '../dati/catalogo.js'
import { dentroA } from '../motore/consiglio.js'
import Merce from './Merce.vue'

const props = defineProps({
  /* 'terra' o 'stalla': il perché di due silos sta in `coltivazioni.js` */
  famiglia: { type: String, default: 'terra' },
  /* `[{ prodotto, posti, quanti, pieno }]`, uno per merce, già contati
     dal motore (`Fattoria.scomparti`) — anche quelli vuoti */
  scomparti: { type: Array, default: () => [] },
  /* quante volte è già stato ingrandito, e quanto costa la prossima */
  livello: { type: Number, default: 0 },
  costo: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
})
defineEmits(['ingrandisci', 'chiudi'])

const silo = computed(() => SILI[props.famiglia] || SILI.terra)
const roba = id => PRODOTTI[id] || { nome: id, emoji: '📦' }
const manca = computed(() => Math.max(0, props.costo - props.monete))
const posti = computed(() => (props.scomparti[0] || {}).posti || 0)

/* Quanti scomparti sono colmi: è l'unica cosa che va detta in cima,
   perché è l'unica che chiede di fare qualcosa. Se non ce n'è nessuno
   non si dice niente — un cartello tranquillizzante ripetuto ogni volta
   smette di essere letto, e quando arriva quello vero non si distingue. */
const pieni = computed(() => props.scomparti.filter(s => s.pieno))

/* ── chi usa questa roba ──────────────────────────────────────────
   Si preme una riga e sotto compare a cosa serve. Una sola per volta, e
   ripremendola si chiude: due riquadri aperti insieme farebbero saltare
   in su tutto il resto del foglio, e chi legge perderebbe il posto.

   Chi ha davvero gli usi lo sa `dati/bisogni.js`; qui si compone la
   frase, perché il nome della macchina lo sa il catalogo. */
const aperto = ref(null)
const tocca = id => { aperto.value = aperto.value === id ? null : id }
/* Cambiando silo si chiude quello che era aperto: il pannello si rifà
   dopo un ingrandimento, e un riquadro rimasto aperto su un prodotto
   dell'altro silo sarebbe roba che non c'entra. */
watch(() => props.famiglia, () => { aperto.value = null })

const usiDi = computed(() => aperto.value ? serveA(aperto.value) : [])
const dice = u => {
  if (u.che === 'ricetta') {
    const dove = laMacchina(u.dove)
    /* Il **nome** e non l'emoji: la riga sopra mostra la figura vera
       della merce, e un'emoji che non le somiglia (🥬 per una balla di
       fieno) fa sembrare due cose diverse quello che è una cosa sola. */
    return `${u.quanti} ${dove ? dentroA(dove.nome.toLowerCase()) : ''}` +
           ` ${u.minuti > 0 ? `(${u.minuti} min)` : ''} → ${u.resa} ${u.nome.toLowerCase()}`
  }
  if (u.che === 'cibo')
    return `nella ciotola: riempie ${Math.round(u.quanto * 100)}% di pancia`
  return `${u.nome.toLowerCase()}, per il ${u.bisogno.toLowerCase()}`
}
</script>

<template>
  <div class="fa-foglio fa-granaio">
    <h2>{{ silo.nome }}</h2>

    <!-- Cosa ci sta, detto una volta e in numero: «8 di ogni cosa» è la
         regola intera, e sta in cima perché è quello che si viene a
         sapere. -->
    <p class="fa-posti">
      <b>{{ posti }}</b> di ogni cosa
      <span v-if="pieni.length">· {{ pieni.length === 1
        ? `${roba(pieni[0].prodotto).nome.toLowerCase()} è al completo`
        : `${pieni.length} scomparti sono al completo` }}</span>
    </p>

    <!-- ── gli scomparti ──
         Uno per riga, barretta e numeri: è la risposta alla domanda per
         cui si apre un magazzino, e si legge senza contare niente. -->
    <div class="fa-scomparti">
      <button v-for="s in scomparti" :key="s.prodotto" type="button"
              :class="['fa-scomparto', { colmo: s.pieno, vuoto: !s.quanti,
                                         viva: aperto === s.prodotto }]"
              @click="tocca(s.prodotto)">
        <Merce :merce="s.prodotto" :lato="32" />
        <span class="fa-etichetta">{{ roba(s.prodotto).nome }}</span>
        <span class="fa-quanto">
          <i :style="{ width: Math.round(s.quanti / (s.posti || 1) * 100) + '%' }"></i>
        </span>
        <span class="fa-conto">{{ s.quanti }}<em>/{{ s.posti }}</em></span>
      </button>
    </div>

    <!-- A cosa serve quello che si è appena premuto. Su uno scomparto
         colmo la stessa riga cambia mestiere: non dice più «a cosa
         serve» ma **come si svuota**, che è la cosa che si sta
         cercando. -->
    <div v-if="aperto" class="fa-usi">
      <b><Merce :merce="aperto" :lato="26" /> {{ roba(aperto).nome }}</b>
      <p v-for="(u, i) in usiDi" :key="i">{{ dice(u) }}</p>
      <p v-if="!usiDi.length">Per adesso non serve a niente.</p>
    </div>
    <p v-else-if="pieni.length" class="fa-piccolo">Uno scomparto pieno non
       ferma gli altri: si può raccogliere tutto il resto. Premi
       <b>{{ roba(pieni[0].prodotto).nome.toLowerCase() }}</b> per vedere
       come si svuota.</p>
    <p v-else class="fa-piccolo">Premi una cosa per vedere chi la usa.</p>

    <div class="fa-fila">
      <button class="fa-bot" @click="$emit('chiudi')">Chiudi</button>
      <button class="fa-bot forte" :disabled="manca > 0" @click="$emit('ingrandisci')">
        Ingrandisci 🪙{{ costo }}</button>
    </div>
    <!-- Il tasto spento dice **di quanto** manca, come in tutto il resto
         del gioco: è il numero che rimanda a fare esercizi. -->
    <p class="fa-piccolo">
      <template v-if="manca">Ti {{ manca === 1 ? 'manca' : 'mancano' }}
        🪙{{ manca }}: </template>
      <template v-else>Ingrandirlo </template>
      aggiunge <b>{{ SCOMPARTO_PIU }}</b> posti <b>a ogni</b> scomparto, e il
      prossimo ingrandimento costerà un po' di più.</p>
  </div>
</template>
