<script setup>
// In alto: il gettone del livello (si tocca: apre il foglio dei livelli), il tasto del banco e il tasto dell'inventario (le scorte
// stanno lì, non sul prato). Le monete stanno nella barra dell'app.
defineProps({
  livello: { type: Number, default: 1 },
  quanto: { type: Number, default: 0 },            // 0..1, verso il prossimo livello
  nuovo: { type: Boolean, default: false },        // un livello nuovo che il bambino non ha ancora guardato
  robaNuova: { type: Boolean, default: false },    // è entrata roba da quando si è aperto l'inventario
  banco: { type: Object, default: () => ({ visibile: false, pronti: 0 }) },   // il tasto del banco: da livello 2; `pronti` = ordini consegnabili
})
defineEmits(['livello', 'banco', 'inventario', 'abito'])
</script>

<template>
  <div class="f3-hud" data-f3="hud">
    <button class="f3-gettone" data-f3="livello" :aria-label="'livello ' + livello" @click="$emit('livello')">
      <b>⭐ {{ livello }}</b>
      <i><u :style="{ width: quanto * 100 + '%' }"></u></i>
      <em v-if="nuovo" class="f3-pallino" data-f3="livello-nuovo"></em>
    </button>
    <button v-if="banco.visibile" class="f3-banco-tasto" data-f3="apri-banco" aria-label="banco" @click="$emit('banco')">
      🧺 Banco<em v-if="banco.pronti" class="f3-n" data-f3="banco-pronti">{{ banco.pronti }}</em>
    </button>
    <button class="f3-banco-tasto" data-f3="apri-inventario" aria-label="inventario" @click="$emit('inventario')">
      🎒 Inventario<em v-if="robaNuova" class="f3-pallino" data-f3="inventario-nuovo"></em>
    </button>
    <button class="f3-banco-tasto" data-f3="apri-guardaroba" aria-label="abito" @click="$emit('abito')">👕</button>
  </div>
</template>
