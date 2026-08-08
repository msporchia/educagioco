<script setup>
/* ═══════════════════════════════════════════════════════════════════
   I GETTONI DEL CASTELLO

   Quello che il gioco appende alla barra comune (`components/Barra.vue`):
   cuori, a che ondata siamo, energia, e il tasto della velocità. Piccoli,
   perché lassù dividono lo spazio con il nome del gioco e i tasti — nel
   castello i gettoni erano diventati tanti al punto che il tasto per
   uscire finiva fuori dallo schermo.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  hud: { type: Object, required: true },
  ondate: { type: [Number, String], default: '' },   // '' nella partita libera
  velocita: { type: Number, default: 1 },
})
defineEmits(['velocita'])
</script>

<template>
  <div class="gettone">{{ hud.cuori > 0 ? '❤️' : '💀' }} <b>{{ Math.max(0, hud.cuori) }}</b></div>
  <div class="gettone">🌊 <b>{{ ondate === '' ? hud.onda : hud.onda + '/' + ondate }}</b></div>
  <div class="gettone energia">⚡ <b>{{ hud.energia }}</b></div>
  <button class="tondo veloce" :class="{ acceso: velocita > 1 }"
          @click="$emit('velocita')">⏩<b>{{ velocita }}</b></button>
</template>

<style scoped src="./gettoni.css"></style>
