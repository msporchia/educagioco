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
      <path v-if="!salto" class="pp-icona-pieno" d="M-15 -5.5 H0 V-14 L16 0 L0 14 V5.5 H-15 Z" />
      <template v-else>
        <path class="pp-icona-pieno" d="M-17 -13 L-1 0 L-17 13 Z" />
        <path class="pp-icona-pieno" d="M0 -13 L16 0 L0 13 Z" />
      </template>
    </g>
  </svg>
</template>
