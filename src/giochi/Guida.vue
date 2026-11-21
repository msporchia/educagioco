<script setup>
// La riga della guida, una per tutti i giochi. Contratto in giochi/guida.js, regole in docs/core/guida.md
// e, per la ✕ e il passo finale della guida richiamata, docs/core/come-si-gioca.md.
defineProps({
  passo: { type: Object, default: null },   // { testo, dove, fine? }, o null quando tace
  spegnibile: { type: Boolean, default: false },
})
defineEmits(['spegni'])
</script>

<template>
  <p v-if="passo" class="gd-riga" :data-guida-riga="passo.fine ? 'fine' : ''">
    <span v-if="passo.fine" class="gd-fatto" aria-hidden="true">✓</span>
    <span v-else class="gd-dito" aria-hidden="true">👇</span>
    <span>{{ passo.testo }}</span>
    <button v-if="spegnibile" type="button" class="gd-spegni" data-guida-spegni aria-label="basta guida"
            @click.stop="$emit('spegni')">✕</button>
  </p>
</template>

<style scoped>
.gd-riga { flex: none; display: flex; align-items: center; gap: 7px; margin: 0; padding: 7px 10px; border-radius: 10px;
           font-size: 13.5px; line-height: 1.35; font-weight: 700; color: #4a3600;
           background: #fff6d6; border: 1.5px solid #f3c64a }
.gd-riga > span:nth-child(2) { flex: 1; min-width: 0 }
.gd-dito { flex: none; font-size: 15px; animation: gd-dito 1.2s ease-in-out infinite }
@keyframes gd-dito { 50% { transform: translateY(3px) } }
.gd-fatto { flex: none; font-size: 17px; font-weight: 900; color: #2f8a3a }
/* grande per il dito anche se il segno è piccolo: il riquadro tocca i bordi della riga */
.gd-spegni { flex: none; width: 36px; height: 36px; margin: -6px -6px -6px 0; border: 0; border-radius: 9px;
             background: transparent; color: #7a5c00; font-size: 17px; font-weight: 900; line-height: 1 }
.gd-spegni:active { background: #f3c64a55 }
</style>
