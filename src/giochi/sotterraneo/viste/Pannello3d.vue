<script setup>
// Il pannello dello scontro: la scelta del colpo e la domanda (gli stessi componenti della cornice,
// viste/Cornice.vue) stanno in fondo al campo, sopra la barra, e la scena si alza sopra di lui (Gioco.vue misura quanto copre,
// `data-pannello3d`). Lo scontro non si chiude: niente ✕. I quattro angoli d'oro della cornice ci sono, spenti: li accende il tema
// dei pannelli (docs/sotterraneo/tema-pannelli.md)
import Angoli from './Angoli.vue'

defineProps({ scontro: { type: Boolean, default: false } })
</script>

<template>
  <div class="sot3d-sotto" data-pannello3d>
    <Angoli />
    <slot />
  </div>
</template>
