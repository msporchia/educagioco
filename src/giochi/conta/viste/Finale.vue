<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CARTELLO DI FINE TAPPA

   Un solo cartello, perché qui una domanda sbagliata non porta mai a un
   cartello suo: si conta insieme e si riprova, senza uscire dalla
   scena. Questo compare solo quando la tappa è fatta — e qui non si
   perde mai, quindi è sempre una festa.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  titolo: { type: String, required: true },
  stelle: { type: Number, required: true },
  monete: { type: Number, default: 0 },
})
defineEmits(['avanti'])
</script>

<template>
  <div class="ct-velo">
    <div class="ct-cartello">
      <div class="ct-faccia em">🏆</div>
      <h2>{{ titolo }}</h2>
      <div class="ct-punteggio em">{{ '⭐'.repeat(stelle) }}</div>
      <p v-if="monete">+{{ monete }} 🪙</p>
      <button class="ct-grosso" @click="$emit('avanti')">
        <span class="em">🗺️</span> alla mappa
      </button>
    </div>
  </div>
</template>
