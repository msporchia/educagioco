<script setup>
// Quale pozione bere, quando se ne hanno di più stadi: una riga per tipo, con quanto cura e quante ne restano. Compare dalla
// casella 🧪 e dal menu dello scontro (con un tipo solo si beve e basta). La ✕ in alto a destra, un tocco fuori chiude; per i
// primi 320 ms le righe non sentono il tocco (il click che il dito lascia dietro alla casella: docs/core/interfaccia.md)
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Cornice from './Cornice.vue'
import Icona from './Icona.vue'
import { CIECA } from '../../pausa.js'

defineProps({
  scelte: { type: Array, required: true },    // [{ k, n, i, cura, nome, em, sprite, tutta }]: dalla più piccola alla più grande
  manca: { type: Number, default: 0 },        // i punti di vita che mancano: la riga che li rimette tutti si legge subito
  nelloScontro: { type: Boolean, default: false },
})
const emit = defineEmits(['bevi', 'chiudi', 'fuori'])

const pronto = ref(false)
let cieca = 0
onMounted(() => { cieca = setTimeout(() => { pronto.value = true }, CIECA) })
onBeforeUnmount(() => clearTimeout(cieca))
const bevi = s => { if (pronto.value) emit('bevi', s.i) }
</script>

<template>
  <Cornice data-scegli-pozione :data-pronto="pronto || null" @chiudi="$emit('chiudi')" @fuori="e => $emit('fuori', e)">
    <h2 class="sot-scegli-titolo">Quale pozione?</h2>
    <p class="sot-scegli-dice">
      <template v-if="manca > 0">ti mancano <b>{{ manca }}</b> punti di vita</template>
      <template v-else>sei già in piena forma</template>
      <template v-if="nelloScontro"> · poi tocca ancora a te</template>
    </p>
    <div class="sot-scegli-elenco">
      <button v-for="s in scelte" :key="s.k" type="button" class="sot-scelta sot-scelta-bevi sot-scegli-riga"
              :class="{ 'sot-rimette': s.cura >= manca && manca > 0 }" data-azione="bevi-questa" :data-cosa="s.k" :data-cura="s.cura"
              :data-n="s.n" @click="bevi(s)">
        <span class="sot-scelta-icona"><Icona :sprite="s.sprite" :em="s.em" :emAlto="22" /></span>
        <span class="sot-scelta-testo">
          <b>{{ s.nome }}</b>
          <small>{{ s.tutta ? 'tutta la vita' : `+${s.cura} vita` }}<template v-if="s.cura >= manca && manca > 0"> · ti rimette in piedi</template></small>
        </span>
        <span class="sot-scelta-costo sot-scegli-n">×{{ s.n }}</span>
      </button>
    </div>
  </Cornice>
</template>
