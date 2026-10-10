<script setup>
// La finestra della bottega e dello zaino: legno scuro, bordo d'oro, quattro angoli disegnati qui (niente
// immagini, il file resta uno). La ✕ in alto a destra (docs/core/interfaccia.md); dentro una colonna, con le
// parti ferme in cima e in fondo e quella in mezzo che scorre. `alta`: tutta l'altezza (la bottega). `scontro`: la stessa
// cornice per il duello (docs/sotterraneo/abilita.md): senza ✕ (uno scontro non si chiude) e sopra la barra
defineProps({ alta: { type: Boolean, default: false }, scontro: { type: Boolean, default: false } })
defineEmits(['chiudi', 'fuori'])

const ANGOLI = ['sot-alto-sx', 'sot-alto-dx', 'sot-basso-sx', 'sot-basso-dx']
</script>

<template>
  <!-- toccando fuori dalla cornice si chiude, e chi la usa decide dove va quel tocco (docs/core/interfaccia.md) -->
  <div class="sot-sipario" :class="{ 'sot-velo-scontro': scontro }" @click.self="$emit('fuori', $event)">
    <section class="sot-cornice" :class="{ 'sot-alta': alta }">
      <svg v-for="a in ANGOLI" :key="a" class="sot-angolo" :class="a" viewBox="0 0 30 30" aria-hidden="true">
        <path d="M3 28V10Q3 3 10 3H28" fill="none" stroke="#8a5a14" stroke-width="5" stroke-linecap="round" />
        <path d="M3 28V10Q3 3 10 3H28" fill="none" stroke="#f3cf6b" stroke-width="2.4" stroke-linecap="round" />
        <path d="M9 22v-8q0-5 5-5h8" fill="none" stroke="#c9963a" stroke-width="1.4" stroke-linecap="round" />
        <circle cx="6.5" cy="6.5" r="4.2" fill="#ffe9a3" stroke="#8a5a14" stroke-width="1.3" />
        <path d="M15 11.5l3.5 3.5-3.5 3.5-3.5-3.5z" fill="#e0644f" stroke="#7a2318" stroke-width=".8" />
      </svg>
      <button v-if="!scontro" type="button" class="sot-chiudi sot-chiudi-cornice" aria-label="chiudi" data-chiudi data-azione="chiudi"
              @click="$emit('chiudi')">✕</button>
      <slot />
    </section>
  </div>
</template>
