<script setup>
/* «Hai ottenuto»: il pacco della nave madre (docs/asteroidi/boss.md). */
import { genereDi } from '../motore/asteroidi/hangar.js'
import PezzoHangar from './PezzoHangar.vue'

defineProps({ pezzo: { type: String, required: true } })
</script>

<template>
  <div class="regalo" data-regalo :data-pezzo="pezzo">
    <div class="titolo">Hai ottenuto</div>
    <PezzoHangar :pezzo="pezzo" :misura="170" regalo />
    <div class="cosa">{{ genereDi(pezzo) }}</div>
  </div>
</template>

<style scoped>
.regalo { display:flex; flex-direction:column; align-items:center; gap:4px; margin:10px 0 }
.titolo { font-size:clamp(24px,7vw,34px); font-weight:900; color:#ffd94a;
          text-transform:uppercase; text-shadow:0 0 18px #ffd94a66 }
.cosa { font-size:18px; font-weight:800; color:#fff }
</style>
