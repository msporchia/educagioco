<script setup>
// I quattro angoli d'oro delle finestre (Cornice.vue), disegnati qui una volta: niente immagini, il file resta uno.
const ANGOLI = ['sot-alto-sx', 'sot-alto-dx', 'sot-basso-sx', 'sot-basso-dx']
</script>

<template>
  <svg v-for="a in ANGOLI" :key="a" class="sot-angolo" :class="a" viewBox="0 0 30 30" aria-hidden="true">
    <path d="M3 28V10Q3 3 10 3H28" fill="none" stroke="#8a5a14" stroke-width="5" stroke-linecap="round" />
    <path d="M3 28V10Q3 3 10 3H28" fill="none" stroke="#f3cf6b" stroke-width="2.4" stroke-linecap="round" />
    <path d="M9 22v-8q0-5 5-5h8" fill="none" stroke="#c9963a" stroke-width="1.4" stroke-linecap="round" />
    <circle cx="6.5" cy="6.5" r="4.2" fill="#ffe9a3" stroke="#8a5a14" stroke-width="1.3" />
    <path d="M15 11.5l3.5 3.5-3.5 3.5-3.5-3.5z" fill="#e0644f" stroke="#7a2318" stroke-width=".8" />
  </svg>
</template>
