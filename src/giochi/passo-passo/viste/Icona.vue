<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UNA FRECCIA — la stessa sul tasto e nella fila

   Disegnata e non scritta: le frecce emoji (⬅️ ⬆️) ogni telefono le fa a
   modo suo, e qui la freccia è tutta la consegna.

   Il passo è una freccia piena. Il salto è **una punta doppia** — due
   celle in quella direzione — sul tasto arancione. La prima prova era un
   arco che scavalca un quadratino, che raccontava meglio il salto ma
   girato in su o in giù diventava la freccia tonda del «ricarica» o
   dell'«annulla»: a sei anni una freccia che non dice da che parte va
   non è una freccia. La punta doppia si legge uguale nei quattro versi.
   ═══════════════════════════════════════════════════════════════════ */
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
