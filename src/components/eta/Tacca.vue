<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA TACCA: ◀ otto anni e mezzo ▶

   Il pezzo che si tocca, e nient'altro. Non sa cosa succede quando ci
   si sposta sopra — se si scrive subito, se si aspetta un «Applica»,
   se si sta solo guardando un elenco muoversi: quello lo sa chi la
   usa, che adesso è `Manopola.vue` e basta.

   Sta in un file suo perché era scritta due volte, e le due copie erano
   diverse senza che nessuno l'avesse deciso: una aveva `◀ ▶` e sotto la
   fascia, l'altra `− +` e sotto una frase — stessa manopola, due
   aspetti, su due schede della stessa schermata. Poi la seconda scheda
   è sparita del tutto: si tara nel quadro, dove si vede cosa cambia.

   Il mezzo anno è il passo di tutto il sistema (12,5 punti di
   difficoltà per anno), e la scala si ferma dove si ferma la scuola
   primaria: sotto i quattro anni non c'è nessun gioco, sopra i dodici
   non c'è nessuna domanda.
   ═══════════════════════════════════════════════════════════════════ */
import { anniInLettere } from './lettere.js'

defineProps({
  /* gli anni di adesso, o `null` se ancora non sono stati scelti */
  anni: { type: Number, default: null },
  /* la riga piccola sotto il numero: la fascia, o cosa decide l'età */
  sotto: { type: String, default: '' },
  min: { type: Number, default: 4 },
  max: { type: Number, default: 12 },
})
defineEmits(['muovi'])
</script>

<template>
  <div class="tacca">
    <button type="button" class="freccia" data-eta="giu"
            :disabled="anni != null && anni <= min"
            aria-label="mezzo anno in meno" @click="$emit('muovi', -0.5)">◀</button>
    <span class="numero">
      <b data-eta-ora>{{ anniInLettere(anni) }}</b>
      <em>{{ sotto || 'muovi la manopola' }}</em>
    </span>
    <button type="button" class="freccia" data-eta="su"
            :disabled="anni != null && anni >= max"
            aria-label="mezzo anno in più" @click="$emit('muovi', 0.5)">▶</button>
  </div>
</template>

<style scoped>
.tacca { display:flex; align-items:center; gap:10px; justify-content:space-between;
         background:#fff; border-radius:16px; padding:8px 10px;
         box-shadow:0 2px 8px #0000000f }
.freccia { border:none; background:#f0eaff; color:#5b3fa8; font-size:20px; line-height:1;
           width:46px; height:46px; border-radius:14px; cursor:pointer; font-family:inherit }
.freccia:disabled { opacity:.3; cursor:default }
.freccia:active:not(:disabled) { transform:translateY(1px) }
.numero { flex:1; text-align:center; display:flex; flex-direction:column; gap:1px;
          color:var(--viola-scuro, #3b2b6b) }
.numero b { font-size:19px }
.numero em { font-style:normal; font-size:11px; color:#7a7a8a }
</style>
