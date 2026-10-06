<script setup>
// La faccia di un bambino: l'iniziale del nome in un tondo, col colore
// che viene dall'id (non cambia rinominandolo). Vedi docs/core/home.md.
import { computed } from 'vue'

const props = defineProps({
  id: { type: String, default: '' },
  nome: { type: String, default: '' },
  misura: { type: Number, default: 34 },
})

const COLORI = ['#5b7cfa', '#f0955e', '#2fa36b', '#d6457a', '#8e5bc4', '#d98a0c', '#2b9aa0']
const colore = computed(() => {
  let h = 0
  for (const c of props.id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return COLORI[h % COLORI.length]
})
const lettera = computed(() => (Array.from(props.nome.trim())[0] || '?').toUpperCase())
</script>

<template>
  <span class="iniziale" aria-hidden="true"
        :style="{ background: colore, width: misura + 'px', height: misura + 'px', fontSize: misura * 0.45 + 'px' }">{{ lettera }}</span>
</template>

<style scoped>
.iniziale { flex:none; display:grid; place-items:center; border-radius:50%; color:#fff; font-weight:600; line-height:1 }
</style>
