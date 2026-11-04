<script setup>
/* Una freccia disegnata, non un'emoji (che ogni telefono fa a modo suo). Il
   salto è una punta doppia e non un arco: un arco girato in su o in giù si
   legge come «ricarica»/«annulla», non come una direzione. */
import { computed } from 'vue'

const props = defineProps({
  mossa: { type: String, required: true },     // su | giu | … | salto-destra
})
const verso = computed(() => props.mossa.replace('salto-', ''))
const salto = computed(() => props.mossa.startsWith('salto-'))
const giro = computed(() => ({
  destra: '', sinistra: 'rotate(180)', su: 'rotate(-90)', giu: 'rotate(90)',
})[verso.value] || '')
</script>

<template>
  <svg class="pp-icona" viewBox="-20 -20 40 40" aria-hidden="true">
    <g :transform="giro">
      <path v-if="!salto" class="pp-icona-pieno pp-punta" d="M-14 -6 H-2 V-13 L14 0 L-2 13 V6 H-14 Z" />
      <template v-else>
        <path class="pp-icona-pieno pp-punta" d="M-16 -12 L-2 0 L-16 12 Z" />
        <path class="pp-icona-pieno pp-punta" d="M1 -12 L15 0 L1 12 Z" />
      </template>
    </g>
  </svg>
</template>
