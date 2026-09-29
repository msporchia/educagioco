<script setup>
// la tacca ◀ 8 anni e mezzo ▶, componente unico (vedi docs/genitori/manopola.md); non sa cosa fa chi la usa
import { anniInLettere } from './lettere.js'

defineProps({
  anni: { type: Number, default: null }, // null se ancora non scelti
  sotto: { type: String, default: '' }, // riga piccola sotto il numero: la fascia, o cosa decide l'età
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
