<script setup>
/* Una casella della mappa: la tessera col suo stato (fatta, ora, aperta,
   chiusa), le stelline, il lucchetto, la ✏️ di una fila a metà; quelle dei
   sentieri senza fine sono tonde, col loro animale sul bordo. Il racconto sta nell'`aria-label`, per il
   grande che legge. La usano le due mappe. Vedi docs/passo-passo/mappa.md. */
defineProps({
  c: { type: Object, required: true },     // il nodo con la sua voce: { id, tipo, x, y, lato, animale, stato, … }
  velata: { type: Boolean, default: false },
})
defineEmits(['tocca'])

const STELLA = 'M12 2.6l2.85 5.95 6.55.85-4.8 4.55 1.2 6.5L12 17.3l-5.8 3.15 1.2-6.5-4.8-4.55 6.55-.85z'
const etichetta = c => (c.tipo === 'sentiero'
  ? `${c.nome}: ${c.stato === 'chiusa' ? c.serve : c.racconto}`
  : `${c.id + 1}. ${c.nome}${c.stato === 'chiusa' ? ' (chiusa)' : ''}: ${c.racconto}`)
</script>

<template>
  <button type="button" class="pp-casella"
          :class="['pp-' + c.stato, { 'pp-velata': velata, 'pp-casella-sentiero': c.tipo === 'sentiero' }]"
          :style="{ left: (c.x - c.lato / 2) + 'px', top: (c.y - c.lato / 2) + 'px', width: c.lato + 'px', height: c.lato + 'px' }"
          :data-tappa="c.id" :data-stato="c.stato" :data-strada="c.animale"
          :aria-label="etichetta(c)"
          @click.stop="$emit('tocca', c.id)">
    <span v-if="c.aMeta && c.stato !== 'chiusa'" class="pp-a-meta pp-em" data-a-meta>✏️</span>
    <svg v-if="c.stato === 'chiusa'" class="pp-lucchetto" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" fill="none" stroke="currentColor" stroke-width="2.6" />
      <rect x="4.5" y="10" width="15" height="11" rx="3" fill="currentColor" />
    </svg>
    <svg v-else-if="c.tipo === 'sentiero'" class="pp-infinito" viewBox="0 0 48 24" aria-hidden="true">
      <path d="M24 12c-4-5-7.5-7.5-11-7.5a7.5 7.5 0 0 0 0 15c3.5 0 7-2.5 11-7.5s7.5-7.5 11-7.5a7.5 7.5 0 0 1 0 15c-3.5 0-7-2.5-11-7.5z" />
    </svg>
    <template v-else>
      <span class="pp-casella-faccia pp-em">{{ c.icona }}</span>
      <span class="pp-casella-stelle">
        <svg v-for="s in 4" :key="s" viewBox="0 0 24 24" :class="{ 'pp-presa': s <= c.stelle }"><path :d="STELLA" /></svg>
      </span>
    </template>
    <!-- di chi è il sentiero, anche da chiuso -->
    <span v-if="c.tipo === 'sentiero'" class="pp-sentiero-di pp-em" :data-sentiero-di="c.strada">{{ c.strada === 'cane' ? '🐕' : '🐇' }}</span>
  </button>
</template>
