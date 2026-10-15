<script setup>
// La scelta per una piazzola libera, in una nuvoletta sopra la piazzola (come i campi della fattoria,
// non un foglio): il disegno di ogni truppa della tappa e della miniera, col prezzo dentro lo stesso riquadro. Si preme il riquadro; il «?» piccolo apre «i numeri». Niente nomi né frasi: il bambino sa già cosa
// vuole. Il campo sta fermo finché è aperta (lo decide Gioco.vue), che le dà il punto (x, y, coda).
import Ritratto from './Ritratto.vue'

defineProps({
  s: { type: Object, required: true },
})
defineEmits(['costruisci', 'dettagli'])
</script>

<template>
  <div class="ar-nuvola" :data-scelta="s.posto" :style="{ left: s.x + 'px', top: s.y + 'px', width: s.larga + 'px', '--coda': s.coda + 'px' }"
       @click.stop>
    <div v-for="v in s.varianti" :key="v.id" class="ar-opzione" :class="{ 'ar-no': !v.puoi }" :data-variante="v.id">
      <button class="ar-disegno" :disabled="!v.puoi" :data-costruisci="v.id" :aria-label="v.nome"
              @click="$emit('costruisci', v.id)">
        <Ritratto :id="v.id" :lato="50" />
        <span class="ar-costo em">{{ v.prezzo }} 💎</span>
      </button>
      <button class="ar-punto em" :data-dettagli="v.id" aria-label="i numeri"
              @click.stop="$emit('dettagli', { truppa: v.id })">?</button>
    </div>
    <div class="ar-opzione" :class="{ 'ar-no': !s.miniera.puoi }" data-variante="miniera">
      <button class="ar-disegno" :disabled="!s.miniera.puoi" data-costruisci="miniera" :aria-label="s.miniera.nome"
              @click="$emit('costruisci', 'miniera')">
        <span class="ar-pico em">⛏️</span>
        <span class="ar-costo em">{{ s.miniera.prezzo }} 💎</span>
      </button>
      <button class="ar-punto em" data-dettagli="miniera" aria-label="i numeri"
              @click.stop="$emit('dettagli', { truppa: 'miniera' })">?</button>
    </div>
  </div>
</template>
