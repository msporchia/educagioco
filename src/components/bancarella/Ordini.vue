<script setup>
/* La lista delle ordinazioni: si fanno in qualsiasi ordine, e scadono. Toccando un piatto
   si vede la sua ricetta. Riceve `ordini`, già pronti da mostrare. Vedi docs/bancarella/cucina.md. */
import { FOTO } from '../../data/bancarella-foto.js'

defineProps({
  ordini: { type: Array, required: true },    // { id, piatti: [{ emoji, nome, fatto }], quanto, pagando }
  tappa: { type: String, default: '' },
  prenota: { type: Boolean, default: false },   // in due: il pulsantino, e la scheda prende il colore di chi l'ha presa
})
defineEmits(['ricetta', 'prenota'])
</script>

<template>
  <div class="ordini" data-ordini>
    <div v-for="o in ordini" :key="o.id" class="ordine" :class="[{ pagando: o.pagando, corta: o.quanto < 30 }, o.colore && 'di-' + o.colore]" data-ordine :data-di="o.di">
      <div class="piatti">
        <button v-for="p in o.piatti" :key="p.emoji" type="button" :aria-label="p.nome" :data-ordinato="p.emoji" @click="$emit('ricetta', p.emoji)">
          <img :src="FOTO['piatto:' + p.emoji]" alt="" :class="{ fatto: p.fatto }">
        </button>
      </div>
      <i class="tempo"><b :style="{ width: o.quanto + '%' }"></b></i>
      <button v-if="prenota" type="button" class="prenota" :disabled="o.pagando || o.di === 'sua'" data-prenota @click="$emit('prenota', o.id)">
        {{ o.di === 'mia' ? 'tua' : o.di === 'sua' ? 'sua' : 'prenota' }}</button>
    </div>
    <span class="tappa">{{ tappa }}</span>
  </div>
</template>

<style scoped>
.ordini { position:relative; flex:none; display:flex; align-items:stretch; gap:6px; min-height:92px; padding:8px 46px 8px 8px; background:#fff1d6; box-shadow:0 2px 6px #0003; z-index:3 }
.ordine { flex:0 1 auto; min-width:0; display:flex; flex-direction:column; justify-content:space-between; gap:4px; padding:5px 6px 6px; border-radius:12px; background:#fffdf7; box-shadow:0 2px 0 #0000001f }
.ordine.pagando { background:#dff3e3 }
.piatti { display:flex; gap:2px }
.piatti button { flex:0 1 62px; min-width:0; padding:0; border:0; background:none }
.piatti img { width:100%; max-width:62px; aspect-ratio:1; display:block }
.piatti img.fatto { opacity:.32 }
.tempo { display:block; height:7px; border-radius:4px; overflow:hidden; background:#e8dcc6 }
.tempo b { display:block; height:100%; border-radius:4px; background:#38c172 }
.corta .tempo b { background:#ff5c7a }
.ordine.di-host { background:#ffd9d2; box-shadow:0 0 0 3px #d2402e }
.ordine.di-ospite { background:#d3e6fb; box-shadow:0 0 0 3px #2f7fd6 }
.prenota { padding:3px 2px; border:0; border-radius:8px; font-size:12px; font-weight:900; color:#6d5a44; background:#efe4cf }
.di-host .prenota { color:#fff; background:#d2402e }
.di-ospite .prenota { color:#fff; background:#2f7fd6 }
.tappa { position:absolute; right:10px; top:8px; font-size:13px; font-weight:900; color:#a98860 }
</style>
