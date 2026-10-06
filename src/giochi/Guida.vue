<script setup>
// La riga della guida del primo giro, una per tutti i giochi. Contratto in
// giochi/guida.js, regole in docs/core/guida.md.
defineProps({
  passo: { type: Object, default: null },   // { testo, dove }, o null quando tace
})
</script>

<template>
  <p v-if="passo" class="gd-riga" data-guida-riga><span class="gd-dito" aria-hidden="true">👇</span><span>{{ passo.testo }}</span></p>
</template>

<style scoped>
.gd-riga { flex: none; display: flex; align-items: center; gap: 7px; margin: 0; padding: 7px 10px; border-radius: 10px;
           font-size: 13.5px; line-height: 1.35; font-weight: 700; color: #4a3600;
           background: #fff6d6; border: 1.5px solid #f3c64a }
.gd-riga > span:last-child { flex: 1; min-width: 0 }
.gd-dito { flex: none; font-size: 15px; animation: gd-dito 1.2s ease-in-out infinite }
@keyframes gd-dito { 50% { transform: translateY(3px) } }
</style>
