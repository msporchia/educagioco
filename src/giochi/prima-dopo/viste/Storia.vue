<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SCENA — dove si gioca

   Tre disegni diversi per tre forme di quesito (`quesito.tipo`), più un
   quarto stato che non è un quesito: il replay. Quando una risposta è
   sbagliata non si dice «no» — la storia si racconta da sola, una
   vignetta alla volta con una nota che sale, e solo allora si può
   riprovare. È tutto CSS e `setTimeout`: una coreografia così piccola
   non merita una cartella `scena/` (vedi `Tavolo.vue` del Codice
   Segreto, che tiene lo stesso genere di animazione — il tremolio —
   qui dentro con un `ref` locale).

   Non tocca il motore: tocca una vignetta ed emette `tocca`, e chi
   coordina (`Gioco.vue`) decide cosa vuol dire. Non sa nemmeno cosa sia
   una moneta.

   NOTA PER DOMANI: quando arriverà la voce italiana, è qui — nella
   consegna in alto e nella frase piccola — che andrà agganciata: oggi
   c'è solo `suono.nota()` sintetizzato, perché `strumenti/incidi-voci.mjs`
   parla ancora solo inglese e spagnolo.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  quesito: { type: Object, required: true },
  verbo: { type: Object, required: true },      // { icona, frase, ... } da dati/verbi.js
  fase: { type: String, default: 'gioca' },      // 'gioca' | 'vinta' | 'replay'
  suonaPasso: { type: Function, default: null },
})
const emit = defineEmits(['tocca', 'fine-replay'])

const NUMERI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣']

/* La sequenza vera da far scorrere nel replay, qualunque sia il tipo di
   quesito: per "ordina" è la fila corretta, per "manca/dopo/prima" è la
   fila mostrata con il buco riempito dalla risposta giusta, per
   "intruso" è la storia vera, senza l'intruso al posto di un passo. */
const replaySequenza = computed(() => {
  const q = props.quesito
  if (q.tipo === 'ordina') return q.sequenza
  if (q.tipo === 'intruso') return q.storia.passi.slice(0, q.vignette.length)
  return q.mostrati.map(e => e ?? q.corretta)
})

const passoReplay = ref(-1)
let orologi = []
function fermaReplay() {
  orologi.forEach(clearTimeout)
  orologi = []
  passoReplay.value = -1
}
function avviaReplay() {
  fermaReplay()
  const seq = replaySequenza.value
  const PRIMO = 500, PASSO = 750
  seq.forEach((_, i) => {
    orologi.push(setTimeout(() => {
      passoReplay.value = i
      props.suonaPasso?.(i)
    }, PRIMO + i * PASSO))
  })
  orologi.push(setTimeout(() => emit('fine-replay'), PRIMO + seq.length * PASSO + 900))
}
watch(() => props.fase, f => { if (f === 'replay') avviaReplay(); else fermaReplay() })
onUnmounted(fermaReplay)
</script>

<template>
  <div class="pd-storia" :class="{ 'pd-congelata': fase !== 'gioca' }">
    <!-- la consegna: iconica in alto, la frase sotto è per chi legge -->
    <div class="pd-consegna">
      <span class="em">{{ verbo.icona }}</span>
      <p>{{ verbo.frase }}</p>
    </div>

    <!-- il replay copre tutto il resto: si guarda e basta -->
    <div v-if="fase === 'replay'" class="pd-replay">
      <div class="pd-striscia">
        <div v-for="(e, i) in replaySequenza" :key="i" class="pd-buca em"
             :class="{ 'pd-piena': i <= passoReplay, 'pd-adesso': i === passoReplay }">
          {{ i <= passoReplay ? e : '' }}
        </div>
      </div>
      <!-- la freccia del tempo, non una nota musicale: col suono spento
           una 🎵 che pulsa promette qualcosa che non arriva -->
      <p class="pd-verso em" :class="{ 'pd-scorre': passoReplay >= 0 }">➡️</p>
    </div>

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
