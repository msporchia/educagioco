<script setup>
// Le scorte in alto: il gettone del livello (si tocca: apre il foglio dei livelli), i raccolti, i prodotti delle macchine, la lana e
// la legna. Le monete stanno nella barra. Il resto è solo lettura.
defineProps({
  scorte: { type: String, default: '' },
  prodotti: { type: String, default: '' },
  lana: { type: Number, default: 0 },
  legna: { type: Number, default: 0 },
  livello: { type: Number, default: 1 },
  quanto: { type: Number, default: 0 },            // 0..1, verso il prossimo livello
  nuovo: { type: Boolean, default: false },        // un livello nuovo che il bambino non ha ancora guardato
  banco: { type: Object, default: () => ({ visibile: false, pronti: 0 }) },   // il tasto del banco: da livello 2; `pronti` = ordini consegnabili
})
defineEmits(['livello', 'banco'])
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
    <span data-f3="scorte">{{ scorte }}</span>
    <span data-f3="prodotti">{{ prodotti }}</span>
    <span data-f3="lana">🧶 {{ lana }} &nbsp;🪵 {{ legna }}</span>
  </div>
</template>
