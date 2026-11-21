<script setup>
// Il tasto da premere, disegnato come un tasto della tastiera: c'è solo dove c'è una tastiera (giochi/tastiera.js).
// docs/core/tastiera.md
import { conTastiera } from '../giochi/tastiera.js'

defineProps({ nome: { type: String, required: true } })   // quello che c'è scritto sul tasto: '↵', '⌫', 'R', '⇧'
</script>

<template>
  <kbd v-if="conTastiera" class="tasto-tastiera" aria-hidden="true" data-tasto-tastiera>{{ nome }}</kbd>
</template>

<style scoped>
/* chiaro con l'orlo in basso, come un tasto vero: si legge su ogni fondo */
.tasto-tastiera { display:inline-grid; place-items:center; min-width:26px; height:26px; padding:0 6px; box-sizing:border-box;
                  font:700 17px/1 "Emoji Gioco", system-ui, sans-serif; color:#2a2f3a; background:#f6f7fb; border:1px solid #0000002e;
                  border-bottom-width:3px; border-radius:5px; pointer-events:none; white-space:nowrap }
</style>
