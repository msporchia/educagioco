<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CARTELLO DI FINE — il coniglio è a casa

   Qui non c'è un cartello di partita persa: una fila sbagliata si
   riprova e basta. Questo compare solo quando il coniglio è nella tana.

   Le tre stelle si guadagnano per tre cose diverse, e sotto ognuna c'è
   il disegno di **cosa** l'ha data: la tana, la carota, 🧠 — la strada
   l'hai trovata tu. Una stella spenta con sotto la carota dice da sola
   cosa manca, e che rigiocando la si può prendere — senza una riga da
   leggere. La terza era «senza 💡», e la toglieva qualunque aiuto: gli
   aiuti adesso si pagano in monete, e la terza se ne va solo se la
   strada intera l'ha scritta il gioco.

   Il racconto del posto sta in fondo, piccolo: è per il grande che
   guarda da sopra la spalla, e dice cosa si è appena imparato.

   I tasti restano spenti per un attimo quando il cartello compare: il
   dito che ha appena premuto ▶ si lascia dietro un tocco, e quel tocco
   non deve premere «avanti» da solo.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, onMounted, onUnmounted } from 'vue'
import Festa from '../../Festa.vue'

defineProps({
  che: { type: String, default: 'tappa' },        // tappa | sentiero
  titolo: { type: String, required: true },
  stelle: { type: Number, default: 1 },
  carota: { type: Boolean, default: false },
  svelato: { type: Boolean, default: false },     // la strada l'ha scritta tutta il gioco
  monete: { type: Number, default: 0 },
  racconto: { type: String, default: '' },
  prossima: { type: Boolean, default: false },    // c'è una tappa dopo, ed è aperta
  frase: { type: String, default: '' },           // il sentiero: di fila, e il record
  record: { type: Boolean, default: false },
})
defineEmits(['avanti', 'rigioca', 'mappa'])

const CIECA = 320
const pronto = ref(false)
let sveglia = 0
onMounted(() => { sveglia = setTimeout(() => { pronto.value = true }, CIECA) })
onUnmounted(() => clearTimeout(sveglia))
</script>

<template>
  <div class="pp-velo" :data-fine="che">
    <!-- i coriandoli a ogni tappa, ma nel sentiero solo sul record: a ogni
         sentiero sarebbero una festa che non vuol dire più niente -->
    <Festa v-if="che === 'tappa' || record" :quanti="che === 'tappa' ? 110 : 70" />
    <div class="pp-cartello">
      <div class="pp-faccia pp-em">{{ che === 'tappa' ? '🏡' : '🥕' }}</div>
      <h2>{{ titolo }}</h2>

      <div v-if="che === 'tappa'" class="pp-tre" data-stelle-prese :data-quante="stelle">
        <span class="pp-una">
          <span class="pp-em pp-grande">⭐</span><span class="pp-em">🏡</span>
        </span>
        <span class="pp-una" :class="{ 'pp-spenta': !carota }">
          <span class="pp-em pp-grande">⭐</span><span class="pp-em">🥕</span>
        </span>
        <span class="pp-una" :class="{ 'pp-spenta': svelato }" data-stella-pensata>
          <span class="pp-em pp-grande">⭐</span><span class="pp-em">🧠</span>
        </span>
      </div>

      <p v-if="frase" class="pp-frase" :class="{ 'pp-record': record }" data-primato>{{ frase }}</p>
      <p v-if="monete" class="pp-monete">+{{ monete }} 🪙</p>
      <p v-if="racconto" class="pp-racconto">{{ racconto }}</p>

      <div class="pp-scelte">
        <button class="pp-piccolo" data-azione="mappa" aria-label="alla mappa" :disabled="!pronto"
                @click="$emit('mappa')"><span class="pp-em">🗺️</span></button>
        <button v-if="che === 'tappa'" class="pp-piccolo" data-azione="rigioca" aria-label="rigioca"
                :disabled="!pronto" @click="$emit('rigioca')"><span class="pp-em">🔁</span></button>
        <button v-if="prossima || che === 'sentiero'" class="pp-grosso" data-azione="avanti" aria-label="avanti"
                :disabled="!pronto" @click="$emit('avanti')">
          <svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="M-9 -14 L15 0 L-9 14 Z" /></svg>
        </button>
      </div>
    </div>
  </div>
</template>
