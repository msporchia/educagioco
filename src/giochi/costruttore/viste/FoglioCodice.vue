<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COM'È IN PYTHON — il programma, come lo scrive chi programma

   Solo da leggere, e solo per chi lo chiede: il tasto sta in fondo
   all'editor, piccolo. La traduzione la fa `motore/python.js`.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { inPython } from '../motore/python.js'

const props = defineProps({
  programma: { type: Object, required: true },
  ordine: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['chiudi'])
const testo = computed(() => inPython(props.programma, props.ordine))
</script>

<template>
  <div class="cst-velo" @click.self="emit('chiudi')">
    <div class="cst-foglio" data-foglio-codice>
      <button type="button" class="cst-chiudi" aria-label="chiudi" data-chiudi @click="emit('chiudi')">✕</button>
      <h3>🐍 Com'è in Python</h3>
      <p class="cst-piccolo">È lo stesso programma, scritto come lo scrive chi programma di mestiere.
        I progetti diventano <code>def</code>, le lavagnette variabili, «ripeti» diventa <code>for</code>.</p>
      <pre class="cst-codice copiabile">{{ testo }}</pre>
    </div>
  </div>
</template>
