<script setup>
// Il medaglione di un'abilità (docs/sotterraneo/abilita.md): un anello d'oro, il fondo nel colore del ramo, l'icona
// disegnata in codice. Le abilità da usare sono gemme a otto lati, quelle che valgono sempre sono tonde. Chiuso è
// ferro e grigio, pronto da imparare brilla, preso è acceso
import Glifo from './Glifo.vue'

defineProps({
  glifo: { type: String, required: true },
  tinta: { type: String, default: '#6a5acd' },
  tondo: { type: Boolean, default: false },
  stato: { type: String, default: 'preso' },   // 'preso' | 'pronto' | 'chiuso'
  misura: { type: Number, default: 56 },
})
</script>

<template>
  <span class="sot-med" :class="['sot-med-' + stato, { 'sot-med-tondo': tondo }]"
        :style="{ '--tinta': tinta, '--m': misura + 'px' }">
    <span class="sot-med-anello"><span class="sot-med-fondo"><Glifo :nome="glifo" :misura="Math.round(misura * 0.58)" /></span></span>
  </span>
</template>
