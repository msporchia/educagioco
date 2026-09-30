<script setup>
// Il foglio che sale toccando una piazzola vuota: quattro carte col prezzo,
// e quella a cui chi arriva è immune attenuata, senza scritte (torri.md).
import { TORRI, segnoDi } from '../../data/ops.js'
import RitrattoTorre from './RitrattoTorre.vue'

const props = defineProps({
  tappa: { type: Object, required: true },
  energia: { type: Number, default: 0 },
  costi: { type: Object, default: () => ({}) },   // { tipo: ⚡ }
  divisioni: { type: Boolean, default: true },
  immune: { type: Array, default: () => [] },     // le torri a cui chi arriva è immune
})
defineEmits(['scegli'])

const disponibile = k => props.tappa.torri.includes(k)
const segno = k => segnoDi(k, props.divisioni)
const costo = k => props.costi[k] ?? 0
const cara = k => disponibile(k) && props.energia < costo(k)
const ignorata = k => props.immune.includes(k)
</script>

<template>
  <div class="carte">
    <button v-for="(T, k) in TORRI" :key="k" class="carta-torre" :style="{ '--c': T.colore }"
            :class="{ bloccata: !disponibile(k), cara: cara(k), fiacca: ignorata(k) }"
            :disabled="!disponibile(k)" :data-torre="k" :data-costo="costo(k)"
            @click="$emit('scegli', k)">
      <span class="figura">
        <RitrattoTorre v-if="disponibile(k)" :tipo="k" :lv="1" />
        <span v-else class="chiuso">🔒</span>
      </span>
      <b>{{ T.nome }}</b>
      <span class="descr">{{ T.descr }}</span>
      <i v-if="!disponibile(k)">non in questa tappa</i>
      <i v-else-if="cara(k)">servono {{ costo(k) }} ⚡</i>
      <i v-else><em>{{ segno(k) }}</em> · {{ costo(k) }} ⚡</i>
    </button>
  </div>
</template>

<style scoped src="./scelta.css"></style>
