<script setup>
/* Gli attrezzi della cosa selezionata, appesi all'oggetto (non in un pannello che la coprirebbe):
   compaiono al tocco lungo, spariscono mentre si trascina o sotto un foglio aperto (doveAttrezzi
   in Gioco.vue) — vedi docs/fattoria/come-si-tocca.md. Un gesto con prezzo porta il numero addosso. */
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  gesti: { type: Array, default: () => [] },   // [{ chiave, icona, titolo, prezzo, spento }]
})
const emit = defineEmits(['fai', 'fine'])
</script>

<template>
  <div class="fa-attrezzi" :style="{ left: x + 'px', top: y + 'px' }">
    <button v-for="g in gesti" :key="g.chiave" :title="g.titolo"
            :data-attrezzo="g.chiave"
            :disabled="g.spento" @click="emit('fai', g.chiave)">{{ g.icona }}<span
      v-if="g.prezzo" class="fa-costo-gesto" data-costo>🪙{{ g.prezzo }}</span></button>
    <button title="ho finito" @click="emit('fine')">✓</button>
  </div>
</template>
