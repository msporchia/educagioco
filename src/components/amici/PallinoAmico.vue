<script setup>
// Il pallino di un amico (docs/core/amici-bacheca.md): l'iniziale nel suo colore, uguale in ogni gioco. Niente emoji, che
// cambiano da un telefono all'altro.
defineProps({
  amico: { type: Object, required: true },     // { iniziale, colore } da amiciNelGioco
  lato: { type: Number, default: 22 },
})
</script>

<template>
  <span class="pallino-amico" aria-hidden="true"
        :style="{ background: amico.colore, width: lato + 'px', height: lato + 'px', fontSize: Math.round(lato * 0.55) + 'px' }">{{ amico.iniziale }}</span>
</template>

<style scoped>
.pallino-amico { display:inline-flex; align-items:center; justify-content:center; flex:none; border-radius:50%;
                 border:2px solid #0b1029; font-weight:800; line-height:1; color:#0b1029 }
</style>
