<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COME LO CHIAMI?

   Si tocca un nome, e basta. La casella per scriverlo c'è, ma sotto:
   questo gioco lo apre anche un bambino di quattro anni, e una casella
   di testo vuota per chi non sa scrivere non è una scelta — è un muro.
   Chi ci arriva chiama il cane «aaa», o chiama la mamma.

   Il nome non è obbligatorio: si può prendere l'animale così com'è e
   battezzarlo dopo, toccandolo nel prato. Un bambino che non ha ancora
   deciso non deve restare bloccato davanti a una domanda.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'
import { nomiPer } from '../dati/animali.js'
import Provino from './Provino.vue'

const props = defineProps({
  chi: { type: String, required: true },      // lo sprite, es. 'cane-beagle'
  che: { type: String, default: '' },         // «Beagle»
  nome: { type: String, default: '' },        // quello di adesso, se ce l'ha
  prezzo: { type: Number, default: 0 },       // 0 = è già tuo, si sta rinominando
})
const emit = defineEmits(['conferma', 'chiudi'])

const scelto = ref(props.nome)
const scritto = ref(props.nome)

function prendi(n) { scelto.value = n; scritto.value = n }
</script>

<template>
  <div class="fa-foglio">
    <h2>{{ prezzo ? 'Come lo chiami?' : (nome || che) }}</h2>
    <Provino :pezzo="chi + '_giu0'" :lato="64" />
    <p v-if="prezzo">È un {{ che.toLowerCase() }}. Tocca un nome, o scrivine uno tu.</p>
    <p v-else>Tocca un nome per cambiarglielo.</p>

    <div class="fa-nomi">
      <button v-for="n in nomiPer(chi)" :key="n"
              :class="['fa-nome-scelta', { viva: n === scelto }]"
              @click="prendi(n)">{{ n }}</button>
    </div>

    <input v-model="scritto" class="fa-scrivi" maxlength="16"
           placeholder="…oppure scrivilo qui" @input="scelto = scritto">

    <div class="fa-fila">
      <button class="fa-bot piano" @click="emit('chiudi')">Lascia stare</button>
      <button class="fa-bot forte" @click="emit('conferma', scritto.trim())">
        {{ prezzo ? `Prendilo · 🪙${prezzo}` : 'Va bene' }}</button>
    </div>
  </div>
</template>
