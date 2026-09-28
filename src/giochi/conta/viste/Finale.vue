<script setup>
// Il cartello di fine tappa: qui non si perde mai, quindi compare solo
// a tappa fatta ed è sempre una festa — una domanda sbagliata non porta
// mai a un cartello suo, si conta insieme e si riprova senza uscire.
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
