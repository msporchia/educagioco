<script setup>
// Una domanda sbagliata, per la maestra: il conto, poi cosa ha detto il bambino (✗ in rosso) e la giusta (✓ in verde). Prima
// era «5 + 5 fa 10»: spiegava il conto e non diceva l'errore (l'utente). «—» è una domanda lasciata andare (il sasso giusto
// degli Asteroidi caduto): «nessuna risposta». docs/scuola/quaderno.md
import { computed } from 'vue'

const props = defineProps({
  fatto: { type: String, required: true },
  dette: { type: Array, default: () => [] },   // le risposte date, le ultime
  attesa: { type: String, required: true },
  volte: { type: Number, default: 1 },
})
const date = computed(() => props.dette.filter(d => d && d !== '—'))
</script>

<template>
  <span class="sbaglio" data-sbaglio>
    <b class="fatto">{{ props.fatto }}</b>
    <span v-if="date.length" class="detta" title="ha risposto">✗ {{ date.join(', ') }}</span>
    <span v-else class="detta vuota" title="non ha risposto">nessuna risposta</span>
    <span class="giusta" title="la risposta giusta">✓ {{ props.attesa }}</span>
    <span v-if="props.volte > 1" class="volte">×{{ props.volte }}</span>
  </span>
</template>

<style scoped>
.sbaglio { display:inline-flex; align-items:baseline; flex-wrap:wrap; gap:6px; font-size:13px; padding:3px 9px; border-radius:6px;
           background:var(--tessera) }
.fatto { color:var(--inchiostro) }
.detta { color:var(--correzione); font-weight:700 }
.detta.vuota { font-weight:600; font-style:italic }
.giusta { color:var(--corretto); font-weight:700 }
.volte { color:var(--grigio) }
</style>
