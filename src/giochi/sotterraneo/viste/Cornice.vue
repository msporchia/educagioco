<script setup>
// La finestra della bottega e dello zaino: legno scuro, bordo d'oro, quattro angoli disegnati qui (niente
// immagini, il file resta uno). La ✕ in alto a destra (docs/core/interfaccia.md); dentro una colonna, con le
// parti ferme in cima e in fondo e quella in mezzo che scorre. `alta`: tutta l'altezza (la bottega).
import Angoli from './Angoli.vue'

defineProps({ alta: { type: Boolean, default: false } })
defineEmits(['chiudi', 'fuori'])
</script>

<template>
  <!-- toccando fuori dalla cornice si chiude, e chi la usa decide dove va quel tocco (docs/core/interfaccia.md) -->
  <div class="sot-sipario" @click.self="$emit('fuori', $event)">
    <section class="sot-cornice" :class="{ 'sot-alta': alta }">
      <Angoli />
      <button type="button" class="sot-chiudi sot-chiudi-cornice" aria-label="chiudi" data-chiudi data-azione="chiudi"
              @click="$emit('chiudi')">✕</button>
      <slot />
    </section>
  </div>
</template>
