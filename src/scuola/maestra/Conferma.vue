<script setup>
// Un tasto che chiede «sicura?» prima di fare una cosa che non si disfa (cancellare, togliere)
import { ref } from 'vue'
defineProps({ etichetta: String, domanda: { type: String, default: 'Sicura?' }, si: { type: String, default: 'Sì' } })
defineEmits(['si'])
defineOptions({ inheritAttrs: false })
const aperta = ref(false)
</script>

<template>
  <span class="conferma">
    <button v-if="!aperta" class="bottone chiaro piccolo" v-bind="$attrs" @click="aperta = true">{{ etichetta }}</button>
    <template v-else>
      <span class="nota">{{ domanda }}</span>
      <button class="bottone rosso piccolo" data-azione="conferma" @click="aperta = false; $emit('si')">{{ si }}</button>
      <button class="bottone chiaro piccolo" data-azione="annulla" @click="aperta = false">No</button>
    </template>
  </span>
</template>

<style scoped>
.conferma { display:inline-flex; flex-wrap:wrap; align-items:center; gap:6px }
</style>
