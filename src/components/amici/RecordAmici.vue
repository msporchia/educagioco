<script setup>
// I record degli amici sotto il proprio (docs/core/amici-bacheca.md): dal più alto, già in parole («Leonardo: 3:10»). Colore e
// misura del testo li dà il gioco intorno.
import PallinoAmico from './PallinoAmico.vue'

defineProps({
  record: { type: Array, required: true },    // da usaAmici: record(sfida)
  lato: { type: Number, default: 18 },
})
</script>

<template>
  <span v-if="record.length" class="record-amici" data-record-amici>
    <span v-for="a in record" :key="a.chiave" class="riga" data-record-amico>
      <PallinoAmico :amico="a" :lato="lato" />{{ a.nome }}: <b>{{ a.record }}</b>
    </span>
  </span>
</template>

<style scoped>
.record-amici { display:flex; flex-direction:column; gap:4px }
.riga { display:flex; align-items:center; gap:6px; font-weight:600 }
</style>
