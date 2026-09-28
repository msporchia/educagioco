<script setup>
// Il cartello di fine tappa: qui non esiste un cartello di partita
// persa, una storia sbagliata si riprova e basta. L'unico cartello è
// quello buono, a tappa portata a casa.
defineProps({
  titolo: { type: String, required: true },
  stelle: { type: Number, default: 1 },
  monete: { type: Number, default: 0 },
  errori: { type: Number, default: 0 },
})
defineEmits(['avanti'])
</script>

<template>
  <div class="pd-velo" data-fine="tappa">
    <div class="pd-cartello">
      <div class="pd-faccia em">🏆</div>
      <h2>{{ titolo }}</h2>
      <div class="pd-punteggio em">{{ '⭐'.repeat(stelle) }}</div>
      <p v-if="monete">+{{ monete }} 🪙</p>
      <p v-if="errori === 0">tutte le storie giuste al primo colpo</p>
      <p v-else>qualche storia si è dovuta rivedere, e va benissimo così</p>
      <button class="pd-grosso" @click="$emit('avanti')">
        <span class="em">🗺️</span> alla mappa
      </button>
    </div>
  </div>
</template>
