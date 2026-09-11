<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CARTELLO DI FINE TAPPA

   La tappa si finisce sempre: qui si dice com'è andata — stelle,
   monete, quante pozioni senza uno sbaglio — e si va avanti. Quando è
   l'ultima, e la prima volta, il cartello è quello del maestro.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  titolo: { type: String, required: true },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  pozioni: { type: Number, default: 0 },
  perfette: { type: Number, default: 0 },
  maestro: { type: Boolean, default: false },
  ultima: { type: Boolean, default: false },
})
defineEmits(['avanti', 'mappa'])
</script>

<template>
  <div class="pz-velo" data-fine="tappa">
    <div class="pz-cartello-fine">
      <div class="pz-faccia em">{{ maestro ? '🏆' : '✨' }}</div>
      <h2 v-if="maestro">Maestro alchimista</h2>
      <h2 v-else>{{ titolo }}</h2>
      <div class="pz-punteggio em" data-stelle>{{ '⭐'.repeat(stelle) }}</div>
      <p v-if="maestro">Pesi, lunghezze e liquidi: tutte le conversioni, in tutti e due i versi.</p>
      <p v-else>{{ pozioni }} pozioni consegnate, {{ perfette }} senza uno sbaglio.</p>
      <p v-if="monete" class="pz-monete" data-monete>+{{ monete }} 🪙</p>
      <button v-if="!ultima" class="pz-grosso" data-azione="avanti" @click="$emit('avanti')">
        Tappa dopo ▶
      </button>
      <button class="pz-grosso pz-chiaro" data-azione="mappa" @click="$emit('mappa')">
        <span class="em">🗺️</span> Le tappe
      </button>
    </div>
  </div>
</template>
