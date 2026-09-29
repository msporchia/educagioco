<script setup>
// Il foglio che sale toccando una piazzola vuota: quattro carte col prezzo
// (listino diverso per torre, vedi docs/castello/torri.md) e il «non lo
// tocca» di chi sta per arrivare (letto dallo stesso dato del preavviso). La
// carta segnata non si disabilita: comprarla resta legittimo.
import { TORRI, segnoDi } from '../../data/ops.js'
import RitrattoTorre from './RitrattoTorre.vue'

const props = defineProps({
  pittori: { type: Object, default: null },
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
      <span v-if="ignorata(k) && disponibile(k)" class="terzo" data-non-tocca>non lo tocca</span>
      <span class="figura">
        <RitrattoTorre :pittori="pittori" v-if="disponibile(k)" :tipo="k" :lv="1" />
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
