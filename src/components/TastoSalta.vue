<script setup>
/* Il tasto «salta» per provare i giochi (docs/core/comandi.md):
   c'è solo se chi sviluppa l'ha acceso da `#admin`, e dice al gioco
   «dai questa domanda per risposta giusta». Non decide niente: chi lo
   monta sa cosa significa per la sua domanda, e non scrive mai nel ripasso,
   né paga, né conta (docs/core/comandi.md, «Il tasto salta»).
   Sta in un posto solo per non rifarlo in dieci giochi con dieci stili. */
import { saltoAcceso } from '../store/salto.js'

defineEmits(['salta'])
</script>

<template>
  <button v-if="saltoAcceso" type="button" class="tasto-salta" data-azione="salta"
          aria-label="salta questa domanda (solo per provare)" @click="$emit('salta')">
    ⏭️ salta
  </button>
</template>

<style scoped>
/* piccolo, tratteggiato e scuro: si legge su ogni fondo e non sembra un tasto del gioco */
.tasto-salta {
  display: inline-flex; align-items: center; gap: 4px;
  margin: 6px auto 0; padding: 3px 10px;
  font: inherit; font-size: 12px; font-weight: 700; letter-spacing: .02em;
  color: #eaf0ff; background: rgba(12, 16, 30, .78);
  border: 1px dashed rgba(255, 255, 255, .55); border-radius: 999px;
  cursor: pointer; opacity: .85;
}
.tasto-salta:hover, .tasto-salta:focus-visible { opacity: 1 }
</style>
