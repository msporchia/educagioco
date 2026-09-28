<script setup>
// Il personaggio che chiede, e gli ordini in fila come gettoni. Vedi
// docs/costruttore/linguaggio.md.
defineProps({
  livello: { type: Object, required: true },
  visto: { type: Number, default: 0 },
  esiti: { type: Array, default: () => [] },
  inCorso: { type: Boolean, default: false },
})
const emit = defineEmits(['vedi'])

const valori = o => Object.entries(o.lavagnette || {})
</script>

<template>
  <div class="cst-ordine" data-ordine>
    <div class="cst-chi">
      <span class="cst-faccia">{{ livello.chi.emoji }}</span>
      <p><b>{{ livello.chi.nome }}:</b> {{ livello.racconto }}</p>
    </div>
    <div v-if="livello.ordini.length > 1 || valori(livello.ordini[0]).length" class="cst-gettoni">
      <button v-for="(o, i) in livello.ordini" :key="i" type="button" class="cst-gettone"
              :class="{ 'cst-su': visto === i, 'cst-vinto': esiti[i] === 'vinto', 'cst-perso': esiti[i] === 'perso' }"
              :data-gettone="i" :disabled="inCorso" @click="emit('vedi', i)">
        <span class="cst-segno">{{ esiti[i] === 'vinto' ? '✓' : esiti[i] === 'perso' ? '✗' : i + 1 }}</span>
        <span>{{ o.nome }}</span>
      </button>
    </div>
  </div>
</template>
