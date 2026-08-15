<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SCENA — dove si gioca

   Tre disegni diversi per tre forme di quesito (`quesito.tipo`), più un
   quarto stato che non è un quesito: il lampo. Quando una risposta è
   sbagliata non si dice «no» — la fila giusta si accende tutta insieme
   al posto della striscia, mezzo secondo, e si riprova.

   C'era, prima, un replay: una schermata a parte che copriva il tavolo
   e riaccendeva le vignette una alla volta con una nota, quattro
   secondi. Diceva due volte quello che il bambino vedeva già — il verso
   della storia — e in mezzo non c'era niente da fare che aspettare: la
   parte peggiore di un errore era la pausa, non l'errore. Il lampo dice
   la stessa cosa nel tempo di un'occhiata, senza togliere il tavolo da
   sotto e senza suono. È tutto CSS e un `setTimeout` solo.

   Non tocca il motore: tocca una vignetta ed emette `tocca`, e chi
   coordina (`Gioco.vue`) decide cosa vuol dire. Non sa nemmeno cosa sia
   una moneta.

   NOTA PER DOMANI: quando arriverà la voce italiana, è qui — nella
   consegna in alto e nella frase piccola — che andrà agganciata: oggi
   non c'è niente da leggere ad alta voce, perché
   `strumenti/incidi-voci.mjs` parla ancora solo inglese e spagnolo.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  quesito: { type: Object, required: true },
  verbo: { type: Object, required: true },      // { icona, frase, ... } da dati/verbi.js
  fase: { type: String, default: 'gioca' },      // 'gioca' | 'vinta' | 'lampo'
})
const emit = defineEmits(['tocca', 'fine-lampo'])

const NUMERI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣']

/* Quanto resta accesa la fila giusta: il tempo di un'occhiata, non di
   un'attesa. Sotto i 400 ms non si legge, sopra i 900 si aspetta. */
const LAMPO = 700

/* La fila giusta da far vedere nel lampo, qualunque sia il tipo di
   quesito: per "ordina" è la sequenza corretta, per "manca/dopo/prima"
   è la fila mostrata con il buco riempito dalla risposta giusta, per
   "intruso" è la storia vera, senza l'intruso al posto di un passo. */
const filaGiusta = computed(() => {
  const q = props.quesito
  if (q.tipo === 'ordina') return q.sequenza
  if (q.tipo === 'intruso') return q.storia.passi.slice(0, q.vignette.length)
  return q.mostrati.map(e => e ?? q.corretta)
})

let orologio = 0
const fermaLampo = () => clearTimeout(orologio)
watch(() => props.fase, f => {
  fermaLampo()
  if (f === 'lampo') orologio = setTimeout(() => emit('fine-lampo'), LAMPO)
})
onUnmounted(fermaLampo)
</script>

<template>
  <div class="pd-storia" :class="{ 'pd-congelata': fase !== 'gioca' }">
    <!-- la consegna: iconica in alto, la frase sotto è per chi legge -->
    <div class="pd-consegna">
      <span class="em">{{ verbo.icona }}</span>
      <p>{{ verbo.frase }}</p>
    </div>

    <!-- il lampo: la fila giusta prende il posto della striscia, tutta
         insieme, il tempo di guardarla. Sotto resta il vuoto della zona
         di pesca, se ce n'era una: senza, la striscia si allargherebbe
         e il tavolo salterebbe proprio nel momento in cui va guardato. -->
    <template v-if="fase === 'lampo'">
      <div class="pd-striscia">
        <div v-for="(e, i) in filaGiusta" :key="i" class="pd-buca pd-piena pd-lampo em">{{ e }}</div>
      </div>
      <div v-if="quesito.tipo !== 'intruso'" class="pd-pesca"></div>
    </template>

    <template v-else>
      <!-- ORDINA: la striscia numerata, e sotto le vignette da pescare -->
      <template v-if="quesito.tipo === 'ordina'">
        <div class="pd-striscia">
          <button v-for="(id, i) in quesito.posate" :key="i" class="pd-buca em"
                  :class="{ 'pd-piena': id !== null }" :disabled="id === null"
                  :aria-label="id !== null ? 'togli ' + quesito.sequenza[id] : 'posto ' + (i + 1)"
                  @click="$emit('tocca', id)">
            {{ id !== null ? quesito.sequenza[id] : NUMERI[i] }}
          </button>
        </div>
        <div class="pd-pesca">
          <button v-for="v in quesito.vignetteLibere" :key="v.id" class="pd-vignetta em"
                  :aria-label="'vignetta ' + v.emoji" @click="$emit('tocca', v.id)">{{ v.emoji }}</button>
        </div>
      </template>

      <!-- MANCA / DOPO / PRIMA: la fila con un buco, tre opzioni sotto -->
      <template v-else-if="quesito.tipo === 'scegli'">
        <div class="pd-striscia">
          <div v-for="(e, i) in quesito.mostrati" :key="i" class="pd-buca em"
               :class="{ 'pd-piena': e !== null }">{{ e ?? '❓' }}</div>
        </div>
        <div class="pd-pesca">
          <button v-for="o in quesito.opzioni" :key="o.emoji" class="pd-vignetta em"
                  :aria-label="'scegli ' + o.emoji" @click="$emit('tocca', o.emoji)">{{ o.emoji }}</button>
        </div>
      </template>

      <!-- INTRUSO: quattro vignette già in fila, si tocca quella che non c'entra -->
      <template v-else-if="quesito.tipo === 'intruso'">
        <div class="pd-striscia pd-striscia-intrusa">
          <button v-for="v in quesito.vignette" :key="v.id" class="pd-buca pd-piena em"
                  :aria-label="'vignetta ' + v.emoji" @click="$emit('tocca', v.id)">{{ v.emoji }}</button>
        </div>
      </template>
    </template>

    <div v-if="fase === 'vinta'" class="pd-spunta em">✔️</div>
  </div>
</template>
