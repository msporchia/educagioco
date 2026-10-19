<script setup>
// Una domanda con due scelte (comprare un terreno, un edificio). Si chiude da sola scegliendo; il tasto «quieto» è quello di «non ora».
defineProps({
  titolo: { type: String, default: '' },
  testo: { type: String, default: '' },
  bottoni: { type: Array, default: () => [] },     // [{ t, quieto }]
})
defineEmits(['scelta'])
</script>

<template>
  <div class="f3-velo" data-f3="dialogo">
    <div class="f3-dialogo">
      <h2>{{ titolo }}</h2>
      <p>{{ testo }}</p>
      <div class="f3-dialogo-bottoni">
        <button v-for="(b, i) in bottoni" :key="i" :class="{ quieto: b.quieto }" :data-scelta="i" @click="$emit('scelta', i)">{{ b.t }}</button>
      </div>
    </div>
  </div>
</template>
