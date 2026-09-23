<script setup>
/* ═══════════════════════════════════════════════════════════════════
   GLI AIUTI — una scala, e i primi gradini sono gratis

   Come nel Generale: prima le frasi, dalla più vaga alla più stretta,
   che sono quello che direbbe chi ti sta accanto e non costano niente.
   In fondo «mostrami come», che scrive la soluzione al posto del
   programma e costa la seconda stella — e il tasto lo dice **prima**
   di essere premuto. Nessuno resta chiuso dentro un livello.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'

const props = defineProps({
  aiuti: { type: Array, required: true },
  visti: { type: Number, default: 1 },
  svelato: { type: Boolean, default: false },
})
const emit = defineEmits(['altro', 'svela', 'chiudi'])
const conferma = ref(false)
</script>

<template>
  <div class="cst-velo" @click.self="emit('chiudi')">
    <div class="cst-foglio" data-foglio-aiuto>
      <button type="button" class="cst-chiudi" aria-label="chiudi" data-chiudi @click="emit('chiudi')">✕</button>
      <h3>💡 Un aiuto</h3>
      <ol class="cst-aiuti">
        <li v-for="(a, k) in aiuti.slice(0, visti)" :key="k">{{ a }}</li>
      </ol>
      <div class="cst-tasti-foglio">
        <button v-if="visti < aiuti.length" type="button" class="cst-primario" data-azione="altro-aiuto"
                @click="emit('altro')">un altro aiuto (gratis)</button>
        <template v-else-if="!svelato">
          <button v-if="!conferma" type="button" class="cst-secondario" data-azione="mostrami"
                  @click="conferma = true">🔓 mostrami come si fa · costa la seconda ⭐</button>
          <button v-else type="button" class="cst-pericolo" data-azione="svela"
                  @click="emit('svela')">sì: scrivi la soluzione al posto del mio programma</button>
        </template>
        <p v-else class="cst-piccolo">La soluzione è nel programma: guardala girare, e prova a cambiarla.</p>
      </div>
    </div>
  </div>
</template>
