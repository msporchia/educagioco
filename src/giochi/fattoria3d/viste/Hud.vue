<script setup>
// In alto il gettone del livello (si tocca: apre il foglio dei livelli) e basta: il resto sta nella fattoria, gli ordini sulla bacheca, le
// scorte nei magazzini, i vestiti nell'armadio di casa. Le monete stanno nella barra dell'app.
defineProps({
  livello: { type: Number, default: 1 },
  quanto: { type: Number, default: 0 },            // 0..1, verso il prossimo livello
  nuovo: { type: Boolean, default: false },        // un livello nuovo che il bambino non ha ancora guardato
})
defineEmits(['livello'])
</script>

<template>
  <div class="f3-hud" data-f3="hud">
    <button class="f3-gettone" data-f3="livello" :aria-label="'livello ' + livello" @click="$emit('livello')">
      <b>⭐ {{ livello }}</b>
      <i><u :style="{ width: quanto * 100 + '%' }"></u></i>
      <em v-if="nuovo" class="f3-pallino" data-f3="livello-nuovo"></em>
    </button>
  </div>
</template>
