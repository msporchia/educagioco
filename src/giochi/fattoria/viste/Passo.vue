<script setup>
/* Il prossimo passo a schermo: la faccia di motore/consiglio.js, il tasto dice dove porta, non
   "ok" — vedi docs/fattoria/regole.md. Non decide niente: riceve {testo, azione} e lo mostra. */
import { computed } from 'vue'

const props = defineProps({
  // {testo, azione} da comeAvere / comeFarePosto
  passo: { type: Object, default: null },
})
const emit = defineEmits(['fai'])

const azione = computed(() => (props.passo || {}).azione || null)

// Cosa c'è scritto sul tasto; il prezzo ci va sopra e non nella frase.
const etichetta = computed(() => {
  const a = azione.value
  if (!a) return ''
  if (a.che === 'compra') return 'Apri il baule'
  // Il premio non è ancora nel baule: il tasto porta alla pagina dei livelli.
  if (a.che === 'premio') return 'Vai al premio'
  if (a.che === 'ingrandisci') return `Ingrandisci · 🪙${a.prezzo}`
  return 'Portami lì'
})
</script>

<template>
  <div v-if="passo" class="fa-consiglio">
    <p>{{ passo.testo }}</p>
    <button v-if="azione" type="button" class="fa-bot piccolo"
            @click="emit('fai', azione)">{{ etichetta }}</button>
  </div>
</template>
