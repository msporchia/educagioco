<script setup>
// i soldi in mano nelle domande: gli stessi pezzi della bancarella, in file ordinate e staccate (`grafica/soldi.js`; il gemello senza Vue è `mazzoDom`)
import { computed } from 'vue'
import Soldo from './Soldo.vue'
import { fileDeiSoldi, descrizioneDeiSoldi } from '../grafica/soldi.js'

const props = defineProps({ pezzi: { type: Array, default: () => [] } })
const file = computed(() => fileDeiSoldi(props.pezzi))
</script>

<template>
  <div class="mazzo-soldi" data-soldi role="img" :aria-label="descrizioneDeiSoldi(pezzi)">
    <div v-for="f in file" :key="f.nome" class="fila" :data-fila="f.nome">
      <Soldo v-for="(s, i) in f.soldi" :key="i" :cents="s.cents" medio :class="{ nuovo: s.nuovo }" />
    </div>
  </div>
</template>
