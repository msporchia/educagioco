<script setup>
// una moneta o una banconota, coi colori veri: il disegno della bancarella (stile e fatti in `grafica/soldi.js`, che i due posti dove si vedono condividono)
import { computed } from 'vue'
import { soldoDi, iniettaStileSoldi } from '../grafica/soldi.js'

const props = defineProps({
  cents: { type: Number, required: true },
  mini: { type: Boolean, default: false },   // in mano al cliente o sul piatto
  medio: { type: Boolean, default: false },  // nella domanda
})
iniettaStileSoldi()
const s = computed(() => soldoDi(props.cents))
</script>

<template>
  <span class="soldo" :class="[s.classe, { mini, medio }]" :data-cents="cents">
    <template v-if="s.carta">
      <i class="finestra"></i><span class="cifra">{{ s.faccia }}</span><i class="banda"></i>
    </template>
    <template v-else>{{ s.faccia }}<i class="u">{{ s.unita }}</i></template>
  </span>
</template>
