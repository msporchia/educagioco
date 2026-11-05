<script setup>
// Il cartello di fine tappa: la tappa si finisce sempre, qui si dice
// com'è andata. Quando è l'ultima, e la prima volta, è quello del maestro.
defineProps({
  titolo: { type: String, required: true },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  notaMonete: { type: String, default: '' },   // il salvadanaio stanco: docs/genitori/varieta.md
  maestro: { type: Boolean, default: false },
  ultima: { type: Boolean, default: false },
  righe: { type: Array, default: () => [] },   // quanto si è speso, e il modo più economico
  ancora: { type: Boolean, default: false },   // il calderone senza fondo: si ricomincia
})
defineEmits(['avanti', 'mappa'])
</script>

<template>
  <div class="pz-velo" data-fine="tappa">
    <div class="pz-cartello-fine">
      <div class="pz-faccia em">{{ maestro ? '🏆' : '✨' }}</div>
      <h2 v-if="maestro">Maestro alchimista</h2>
      <h2 v-else>{{ titolo }}</h2>
      <div v-if="stelle" class="pz-punteggio em" data-stelle>{{ '⭐'.repeat(stelle) }}</div>
      <p v-if="maestro">Pesi, lunghezze e liquidi: tutte le conversioni, in tutti e due i versi.</p>
      <div class="pz-fine-righe" data-righe>
        <span v-for="(r, n) in righe" :key="n"><i v-if="stelle && !n" class="pz-gettone" aria-hidden="true"></i>{{ r }}</span>
      </div>
      <p v-if="monete" class="pz-monete" data-monete data-monete-prese>+{{ monete }} 🪙</p>
      <p v-if="notaMonete" data-nota-monete>{{ notaMonete }}</p>
      <button v-if="!ultima" class="pz-grosso" data-azione="avanti" @click="$emit('avanti')">
        {{ ancora ? 'Un altro giro' : 'Tappa dopo' }} ▶
      </button>
      <button class="pz-grosso pz-chiaro" data-azione="mappa" @click="$emit('mappa')">
        <span class="em">🗺️</span> Le tappe
      </button>
    </div>
  </div>
</template>
