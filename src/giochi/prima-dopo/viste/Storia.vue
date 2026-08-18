<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SCENA — dove si gioca

   Tre disegni diversi per tre forme di quesito (`quesito.tipo`): la
   striscia da riempire, la fila col buco e le tre opzioni, le quattro
   vignette fra cui c'è l'intrusa.

   Cosa succede quando si sbaglia **non è più affare di questo file**.
   C'era prima un lampo — la fila giusta al posto della striscia, il
   tempo di un'occhiata — e prima ancora un replay da quattro secondi;
   adesso c'è un foglio a parte (`Spiegazione.vue`) che dice anche
   perché, e questo file torna a fare una cosa sola: far vedere la
   domanda e dire cosa è stato toccato. Quando la fase non è `gioca` si
   congela e basta.

   Non tocca il motore: tocca una vignetta ed emette `tocca`, e chi
   coordina (`Gioco.vue`) decide cosa vuol dire. Non sa nemmeno cosa sia
   una moneta.

   NOTA PER DOMANI: quando arriverà la voce italiana, è qui — nella
   consegna in alto e nella frase piccola — che andrà agganciata: oggi
   non c'è niente da leggere ad alta voce, perché
   `strumenti/incidi-voci.mjs` parla ancora solo inglese e spagnolo.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import Passo from './Passo.vue'

const props = defineProps({
  quesito: { type: Object, required: true },
  verbo: { type: Object, required: true },      // { icona, frase, ... } da dati/verbi.js
  fase: { type: String, default: 'gioca' },      // 'gioca' | 'vinta' | 'spiega'
})
defineEmits(['tocca'])

const NUMERI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣']

/* ═══════ QUANTO SI PUÒ FARE GRANDE UN DISEGNO ═══════
   Due numeri, e il foglio di stile ci ricava la misura: `--pd-riga`
   quante vignette stanno **su una riga** (comanda la larghezza) e
   `--pd-file` quante righe ci sono **in tutto sullo schermo** (comanda
   l'altezza). Striscia e pesca hanno per forza la stessa misura — una
   vignetta che non riempie la sua buca si legge come «non ci sta» —
   quindi vale il caso peggiore delle due.

   Tre in riga su un telefono fanno 115 px, quattro ne fanno 84: e 84
   px, per un disegno con dentro una faccia, è di nuovo il francobollo
   da cui si è scappati smettendo con le emoji. Perciò quando le
   vignette sono quattro **non si mettono in fila, si mettono in
   quadrato**: due e due, 158 px l'una, quasi quattro volte l'area. Il
   verso del tempo non si perde, perché nella striscia le buche sono
   numerate (1️⃣ 2️⃣ 3️⃣ 4️⃣) e due-e-due si legge come una pagina di
   fumetto — che è appunto l'ordine giusto. */
const inRiga = computed(() => {
  const q = props.quesito
  /* per «ordina» si contano le buche, non le vignette ancora da pescare:
     quelle calano man mano che si posano, e una misura che le seguisse
     farebbe crescere i disegni mentre si gioca */
  if (q.tipo === 'ordina') return q.sequenza.length > 3 ? 2 : q.sequenza.length
  if (q.tipo === 'intruso') return 2
  return Math.max(q.mostrati.length, q.opzioni.length)
})

/* quante righe di vignette ci sono in tutto: la striscia (una, o due se
   è in quadrato) più la pesca, che non c'è nell'intruso */
const inColonna = computed(() => {
  const q = props.quesito
  if (q.tipo === 'intruso') return 2
  return q.tipo === 'ordina' && q.sequenza.length > 3 ? 4 : 2
})
</script>

<template>
  <div class="pd-storia" :class="{ 'pd-congelata': fase !== 'gioca' }"
       :style="{ '--pd-riga': inRiga, '--pd-file': inColonna }">
    <!-- la consegna: iconica in alto, la frase sotto è per chi legge -->
    <div class="pd-consegna">
      <span class="em">{{ verbo.icona }}</span>
      <p>{{ verbo.frase }}</p>
    </div>

    <!-- ORDINA: la striscia numerata, e sotto le vignette da pescare -->
    <template v-if="quesito.tipo === 'ordina'">
      <div class="pd-striscia" :class="{ 'pd-striscia-quadrata': quesito.sequenza.length > 3 }">
        <button v-for="(id, i) in quesito.posate" :key="i" class="pd-buca em"
                :class="{ 'pd-piena': id !== null }" :disabled="id === null"
                :aria-label="id !== null ? 'togli ' + quesito.sequenza[id] : 'posto ' + (i + 1)"
                @click="$emit('tocca', id)">
          <Passo :passo="id !== null ? quesito.sequenza[id] : null" :vuoto="NUMERI[i]" />
        </button>
      </div>
      <div class="pd-pesca">
        <button v-for="v in quesito.vignetteLibere" :key="v.id" class="pd-vignetta em"
                :aria-label="'vignetta ' + v.emoji" @click="$emit('tocca', v.id)">
          <Passo :passo="v.emoji" />
        </button>
      </div>
    </template>

    <!-- MANCA / DOPO / PRIMA: la fila con un buco, tre opzioni sotto -->
    <template v-else-if="quesito.tipo === 'scegli'">
      <div class="pd-striscia">
        <div v-for="(e, i) in quesito.mostrati" :key="i" class="pd-buca em"
             :class="{ 'pd-piena': e !== null }">
          <Passo :passo="e" vuoto="❓" />
        </div>
      </div>
      <div class="pd-pesca">
        <button v-for="o in quesito.opzioni" :key="o.emoji" class="pd-vignetta em"
                :aria-label="'scegli ' + o.emoji" @click="$emit('tocca', o.emoji)">
          <Passo :passo="o.emoji" />
        </button>
      </div>
    </template>

    <!-- INTRUSO: quattro vignette già in fila, si tocca quella che non c'entra -->
    <template v-else-if="quesito.tipo === 'intruso'">
      <div class="pd-striscia pd-striscia-intrusa">
        <button v-for="v in quesito.vignette" :key="v.id" class="pd-buca pd-piena em"
                :aria-label="'vignetta ' + v.emoji" @click="$emit('tocca', v.id)">
          <Passo :passo="v.emoji" />
        </button>
      </div>
    </template>

    <div v-if="fase === 'vinta'" class="pd-spunta em">✔️</div>
  </div>
</template>
