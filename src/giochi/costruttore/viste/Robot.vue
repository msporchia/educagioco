<script setup>
// Il robot del costruttore, disegnato: da mettere dentro un <svg>, centrato
// nell'origine, alto una trentina di pixel. Vedi docs/costruttore/scheda.md.
defineProps({ fermo: { type: Boolean, default: false } })   // fermo: senza il dondolio
</script>

<template>
  <g class="cst-robot" :class="{ 'cst-robot-fermo': fermo }">
    <g class="cst-robot-corpo">
      <line x1="0" y1="-12" x2="0" y2="-16.5" stroke="#1c2420" stroke-width="1.6" />
      <circle cx="0" cy="-17" r="2.4" fill="#ffc857" stroke="#1c2420" stroke-width="1.2" />
      <rect x="-12.5" y="2" width="3.5" height="7" rx="1.5" fill="#9fb0a8" stroke="#1c2420" stroke-width="1.2" />
      <rect x="9" y="2" width="3.5" height="7" rx="1.5" fill="#9fb0a8" stroke="#1c2420" stroke-width="1.2" />
      <rect x="-10" y="-12" width="20" height="12" rx="4" fill="#e3ebe7" stroke="#1c2420" stroke-width="1.4" />
      <rect x="-6.5" y="-8.5" width="13" height="5.5" rx="2.5" fill="#1c2420" />
      <circle cx="-3.2" cy="-5.75" r="1.5" fill="#7fe0f0" />
      <circle cx="3.2" cy="-5.75" r="1.5" fill="#7fe0f0" />
      <rect x="-8.5" y="0.5" width="17" height="10.5" rx="2.5" fill="#cbd6d1" stroke="#1c2420" stroke-width="1.4" />
      <rect x="-3" y="3.5" width="6" height="3.5" rx="1" fill="#e8a24f" />
    </g>
    <rect x="-9.5" y="11.5" width="19" height="4.5" rx="2.25" fill="#1c2420" />
  </g>
</template>

<style scoped>
.cst-robot-corpo { animation:cst-dondola 1.3s ease-in-out infinite }
.cst-robot-fermo .cst-robot-corpo { animation:none }
@keyframes cst-dondola { 50% { transform:translateY(-1.5px) } }
@media (prefers-reduced-motion: reduce) { .cst-robot-corpo { animation:none } }
</style>
