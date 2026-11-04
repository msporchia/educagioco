<script setup>
// In basso il tasto 🛒: i campi si fanno col dito (viste/Attrezzi.vue), qui resta solo comprare. Un «!» pulsante dice che c'è qualcosa aperto dal
// livello e non ancora in mappa. Non tocca il gioco: dice cosa si vuole con gli `emit`.
defineProps({
  festa: { type: String, default: '' },              // l'icona della festa da scoprire (🎃/🎄), se c'è
  daCostruire: { type: Number, default: 0 },       // quante cose il livello ha aperto e non sono in mappa
})
defineEmits(['costruisci'])
</script>

<template>
  <div class="f3-azioni-colonna">
    <div class="f3-azioni" data-f3="azioni">
      <button data-f3="az-costruisci" :data-da-costruire="daCostruire || null" @click="$emit('costruisci')"><span>🛒</span><small>Compra</small><i v-if="daCostruire" class="f3-esclama" data-f3="costruisci-esclama" aria-label="c'è un edificio da costruire">!</i><i v-if="festa" class="f3-festa a-sinistra" data-f3="costruisci-festa" aria-label="c'è la festa">{{ festa }}</i></button>
    </div>
  </div>
</template>
