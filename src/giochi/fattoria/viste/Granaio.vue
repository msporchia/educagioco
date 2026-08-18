<script setup>
/* ═══════════════════════════════════════════════════════════════════
   DENTRO UN SILO: COSA C'È, QUANTO CI STA ANCORA, E COME FARLO PIÙ GRANDE

   Si apre toccando un silo — come si tocca un campo per vedere cosa ci
   cresce e un recinto per vedere se ha fame. È lo stesso gesto di tutto
   il resto, «tocca una cosa tua e vedi cosa ci si può fare», e ha una
   conseguenza voluta: **senza silo non c'è niente da guardare**, perché
   senza silo non c'è nemmeno dove mettere la roba.

   ── TRE COSE SONO CAMBIATE, E TUTTE E TRE PERCHÉ NON SI CAPIVA ────
   Prima qui c'era scritto: «di ogni cosa ce ne stanno 90; hai 2 silos e
   ognuno che metti ne aggiunge 30». Tre frasi vere che insieme non
   rispondono all'unica domanda che ci si fa aprendo un magazzino —
   *quanto ci sta ancora*.

     · **un tetto solo, condiviso.** Non «di ogni cosa»: di tutto quello
       che sta in questo silo. Un numero che si guarda mentre si
       raccoglie, non una regola da ricostruire prodotto per prodotto.
     · **si ingrandisce da qui.** Il silo è una struttura sola e si
       potenzia pagando (+2 posti a colpo, e ogni colpo costa di più):
       non c'è più niente da capire su cosa faccia il secondo silo
       uguale, perché non si mette giù un secondo silo uguale.
     · **premere una roba dice chi la usa.** Non si posa e non si vende
       — dal silo non esce niente con le dita — ma «🌾 Grano: 3 nel
       mulino fanno 2 🥣, 3 nel pollaio fanno 2 🥚» è la sola cosa utile
       che una riga di scaffale possa dire, ed è il modo in cui la
       catena si scopre da dentro invece che per tentativi. Al posto di
       una frase sotto che valeva per tutti («non si vende, serve alle
       macchine»): vera per ogni riga, quindi muta su ciascuna.

   Non sa niente del profilo: riceve la famiglia del silo, cosa c'è
   dentro, quanto ci sta e quanto costa ingrandirlo.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, ref, watch } from 'vue'
import { PRODOTTI, SILI, SILO_PIU } from '../dati/coltivazioni.js'
import { serveA } from '../dati/bisogni.js'
import { laMacchina } from '../dati/catalogo.js'

const props = defineProps({
  /* 'terra' o 'stalla': il perché di due silos sta in `coltivazioni.js` */
  famiglia: { type: String, default: 'terra' },
  granaio: { type: Object, default: () => ({}) },
  capienza: { type: Number, default: 0 },
  /* quante volte è già stato ingrandito, e quanto costa la prossima */
  livello: { type: Number, default: 0 },
  costo: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
})
defineEmits(['ingrandisci', 'chiudi'])

const silo = computed(() => SILI[props.famiglia] || SILI.terra)
/* Quello che può stare **in questo** silo, anche se adesso non ce n'è:
   un ripiano vuoto dice cosa ci andrà, ed è il modo in cui si scopre
   che le uova vanno di là. */
const PRODOTTO = computed(() => Object.entries(PRODOTTI)
  .filter(([, p]) => p.silo === props.famiglia)
  .map(([id, p]) => ({ id, ...p })))

const quanti = id => props.granaio[id] || 0
const dentro = computed(() => PRODOTTO.value.reduce((n, p) => n + quanti(p.id), 0))
const pieno = computed(() =>
  Math.min(100, Math.round(dentro.value / (props.capienza || 1) * 100)))
const manca = computed(() => Math.max(0, props.costo - props.monete))

/* ── chi usa questa roba ──────────────────────────────────────────
   Si preme una riga e sotto lo scaffale compare a cosa serve. Una sola
   per volta, e ripremendola si chiude: due riquadri aperti insieme
   farebbero saltare in su tutto il resto del foglio, e chi legge
   perderebbe il posto.

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
    return `${u.quanti} ${dove ? 'nel ' + dove.nome.toLowerCase() : ''}` +
           ` ${u.minuti > 0 ? `(${u.minuti} min)` : ''} → ${u.resa} ${u.emoji} ${u.nome.toLowerCase()}`
  }
  if (u.che === 'cibo')
    return `nella ciotola: riempie ${Math.round(u.quanto * 100)}% di pancia`
  return `${u.nome.toLowerCase()}, per il ${u.bisogno.toLowerCase()}`
}
</script>

<template>
  <div class="fa-foglio fa-granaio">
    <h2>{{ silo.nome }}</h2>

    <!-- Quanto ci sta ancora, in cima e in numeri grossi: è la domanda
         che si viene a fare qui, e la risposta non può stare in fondo
         fra le spiegazioni. -->
    <p class="fa-posti">
      <b>{{ dentro }}</b> di <b>{{ capienza }}</b> posti
      <span v-if="dentro >= capienza"> · è pieno</span>
    </p>
    <div class="fa-quanto largo"><i :style="{ width: pieno + '%' }"></i></div>

    <div class="fa-scaffale">
      <button v-for="p in PRODOTTO" :key="p.id" type="button"
              :class="['fa-voce', 'guarda', { tua: quanti(p.id), viva: aperto === p.id }]"
              @click="tocca(p.id)">
        <span class="fa-ripiano"><b class="fa-frutto">{{ p.emoji }}</b></span>
        <span class="fa-nome">{{ p.nome }}</span>
        <span :class="['fa-prezzo', { tuo: quanti(p.id) }]">
          {{ quanti(p.id) ? '×' + quanti(p.id) : '—' }}</span>
      </button>
    </div>

    <!-- A cosa serve quello che si è appena premuto. Prende il posto
         della frase che c'era prima sotto lo scaffale, che valeva per
         tutti e quindi non diceva niente di nessuno. -->
    <div v-if="aperto" class="fa-usi">
      <b>{{ PRODOTTI[aperto].emoji }} {{ PRODOTTI[aperto].nome }}</b>
      <p v-for="(u, i) in usiDi" :key="i">{{ dice(u) }}</p>
      <p v-if="!usiDi.length">Per adesso non serve a niente.</p>
    </div>
    <p v-else-if="!dentro" class="fa-piccolo">Adesso è vuoto: qui dentro
       finisce {{ famiglia === 'terra' ? 'quello che raccogli dai campi'
                                       : 'quello che ti danno gli animali' }}.</p>
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
      aggiunge <b>{{ SILO_PIU }}</b> posti, e il prossimo ingrandimento
      costerà un po' di più.</p>
  </div>
</template>
