<script setup>
/* Il cartello di fine: una tappa, un cassetto o un capitolo. Qui non si
   perde niente, quindi è sempre un resoconto e mai una bocciatura: dice
   il grado di prima e di adesso, e le monete arrivate davvero (col
   salvadanaio stanco, docs/genitori/varieta.md). */

defineProps({
  titolo: { type: String, required: true },
  sotto: { type: String, default: '' },
  prima: { type: Number, default: null },       // il grado a inizio tappa
  dopo: { type: Number, default: null },        // e alla fine
  giuste: { type: Number, default: 0 },
  errori: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  notaMonete: { type: String, default: '' },
  avanti: { type: String, default: '' },        // il nome della tappa dopo, se si può andare
  ancora: { type: String, default: '' },        // «Rigioca», se la stessa cosa si può rifare
  altro: { type: String, default: '' },         // nel libro: «Un'altra storia» accanto a «Puntata 2»
})
defineEmits(['mappa', 'avanti', 'ancora', 'altro'])
</script>

<template>
  <div class="ing-velo" data-fine>
    <div class="ing-cartello">
      <button type="button" class="ing-chiudi" aria-label="chiudi" data-chiudi @click="$emit('mappa')">✕</button>
      <h2>{{ titolo }}</h2>
      <p v-if="sotto" class="ing-sotto">{{ sotto }}</p>
      <div v-if="dopo != null" class="ing-gradi" data-grado-fine :data-grado="dopo">
        <span class="ing-grado-num">{{ prima }}</span>
        <span class="ing-freccia">→</span>
        <span class="ing-grado-num ing-grado-ora">{{ dopo }}</span>
        <span class="ing-su-dieci">su 10</span>
      </div>
      <div class="ing-conti">✅ {{ giuste }} giuste<template v-if="errori"> · ✋ {{ errori }} da rivedere</template></div>
      <p v-if="notaMonete" class="ing-nota-monete" data-nota-monete>{{ notaMonete }}</p>
      <div v-else class="ing-premio" data-monete-fine :data-monete="monete">+{{ monete }} 🪙</div>
      <div class="ing-bottoni">
        <button v-if="avanti" type="button" class="ing-grosso" data-azione="avanti" @click="$emit('avanti')">
          {{ avanti }} →
        </button>
        <button v-if="altro" type="button" class="ing-grosso ing-chiaro" data-azione="altra-storia"
                @click="$emit('altro')">{{ altro }} →</button>
        <button v-if="ancora" type="button" class="ing-grosso ing-chiaro" data-azione="ancora"
                @click="$emit('ancora')">↻ {{ ancora }}</button>
        <button type="button" class="ing-grosso ing-chiaro" data-azione="mappa" @click="$emit('mappa')">
          La mappa
        </button>
      </div>
    </div>
  </div>
</template>
