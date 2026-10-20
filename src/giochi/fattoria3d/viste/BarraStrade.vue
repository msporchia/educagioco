<script setup>
// Mentre si disegna col pennello: la strada e la gomma si scambiano, «Fatto» rimette la barra delle azioni. Il dito sulla mappa
// disegna (scena3d/dito.js); qui si sceglie solo cosa. Vedi docs/fattoria3d/scena.md.
import { COSTI } from '../dati/regole.js'
defineProps({ strumento: { type: String, default: 'strada' }, testo: { type: String, default: '' } })
defineEmits(['strumento', 'fatto'])
</script>

<template>
  <div class="f3-barra-strade" data-f3="barra-strade">
    <p class="f3-suggerimento">{{ testo || (strumento === 'gomma' ? 'Trascina sulle strade che hai disegnato per toglierle.' : `Trascina il dito sulla mappa per disegnare la strada (🪙 ${COSTI.strada} a pezzo).`) }}</p>
    <div class="f3-strumenti">
      <button :class="{ acceso: strumento === 'strada' }" data-strumento="strada" @click="$emit('strumento', 'strada')"><span>🛣️</span><small>Strada</small></button>
      <button :class="{ acceso: strumento === 'gomma' }" data-strumento="gomma" @click="$emit('strumento', 'gomma')"><span>🧽</span><small>Gomma</small></button>
      <button class="fatto" data-f3="strade-fatto" @click="$emit('fatto')"><span>✓</span><small>Fatto</small></button>
    </div>
  </div>
</template>
