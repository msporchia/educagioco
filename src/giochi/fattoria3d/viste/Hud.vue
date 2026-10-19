<script setup>
// Le scorte in alto: i raccolti, i prodotti della pasticceria, la lana e la legna. Le monete stanno nella barra. Solo lettura.
defineProps({
  scorte: { type: String, default: '' },
  prodotti: { type: String, default: '' },
  lana: { type: Number, default: 0 },
  legna: { type: Number, default: 0 },
})
</script>

<template>
  <div class="f3-hud" data-f3="hud">
    <span data-f3="scorte">{{ scorte }}</span>
    <span data-f3="prodotti">{{ prodotti }}</span>
    <span data-f3="lana">🧶 {{ lana }} &nbsp;🪵 {{ legna }}</span>
  </div>
</template>
