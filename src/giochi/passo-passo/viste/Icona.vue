<script setup>
/* Una freccia disegnata, non un'emoji (che ogni telefono fa a modo suo). Il
   salto è una punta doppia e non un arco: un arco girato in su o in giù si
   legge come «ricarica»/«annulla», non come una direzione. */
import Figura from './Figura.vue'

defineProps({
  mossa: { type: String, required: true },     // su | giu | … | salto-destra
})
</script>

<template>
  <Figura class="pp-icona" :nome="mossa" />
</template>
