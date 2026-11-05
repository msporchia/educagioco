<script setup>
// Uno scorcio del posto, sulla mappa: una striscia già pronta (`dati/terreni-pronti.js`). Niente da disegnare, è un'immagine.
import { PANORAMI } from '../dati/terreni-pronti.js'

defineProps({ terreno: { type: String, required: true } })
</script>

<template>
  <img class="ar-panorama" :src="PANORAMI[terreno]" alt="" />
</template>
