<script setup>
/* La traduzione di una parola toccata: una nuvoletta sopra la parola, per
   un paio di secondi, che il dito attraversa. Se il tocco è costato il
   guadagno della domanda lo dice anche lei, oltre all'indicatore delle
   monete. */
defineProps({
  parola: { type: String, required: true },
  it: { type: String, default: '' },
  costa: { type: Boolean, default: false },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
})
</script>

<template>
  <Teleport to="body">
    <div class="ing-bolla" data-traduzione :style="{ left: x + 'px', top: y + 'px' }">
      <b>{{ parola }}</b> = {{ it || '…' }}
      <small v-if="costa">questa domanda non paga</small>
    </div>
  </Teleport>
</template>
