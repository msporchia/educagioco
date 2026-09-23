<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UNA LAVAGNETTA NUOVA

   Una lavagnetta è un numero con un nome: si scrive, si cancella, si
   riscrive. «Lavagnetta» e non «scatola» apposta: una scatola fa
   pensare a tante cose dentro, una lavagnetta tiene un numero solo —
   quello di adesso — ed è esattamente quello che fa una variabile.
   Nasce a 0.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { NOMI_LAVAGNETTE } from './frasi.js'

const props = defineProps({
  prese: { type: Array, default: () => [] },     // i nomi già usati: lavagnette, misure, ordine
})
const emit = defineEmits(['crea', 'chiudi'])

const nome = ref(NOMI_LAVAGNETTE.find(n => !props.prese.includes(n)) || '')
const pulito = computed(() => String(nome.value || '').trim().toLowerCase().replace(/\s+/g, '-').slice(0, 12))
const buono = computed(() => /^[a-zà-ù][a-zà-ù0-9-]*$/.test(pulito.value) && !props.prese.includes(pulito.value))
</script>

<template>
  <div class="cst-velo" @click.self="emit('chiudi')">
    <div class="cst-foglio" data-foglio-lavagnetta>
      <button type="button" class="cst-chiudi" aria-label="chiudi" data-chiudi @click="emit('chiudi')">✕</button>
      <h3>📝 Una lavagnetta nuova</h3>
      <p class="cst-piccolo">Una lavagnetta tiene un numero, e il robot lo può leggere e cambiare mentre lavora. Comincia da 0.</p>
      <label class="cst-campo-testo">
        <span>nome</span>
        <input v-model="nome" data-nome-lavagnetta maxlength="12" autocomplete="off" autocapitalize="none">
      </label>
      <div class="cst-fila">
        <button v-for="n in NOMI_LAVAGNETTE.filter(n => !prese.includes(n))" :key="n" type="button"
                class="cst-chip cst-nome" @click="nome = n">{{ n }}</button>
      </div>
      <p v-if="!buono" class="cst-avviso">Un nome fatto di lettere, e non uno già usato.</p>
      <div class="cst-tasti-foglio">
        <button type="button" class="cst-primario" data-azione="crea-lavagnetta" :disabled="!buono"
                @click="emit('crea', pulito)">Crea</button>
      </div>
    </div>
  </div>
</template>
