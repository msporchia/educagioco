<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CARTELLO DI FINE LIVELLO

   Dice le stelle, le monete (solo la prima volta: un livello rifatto
   si ricorda, non si risolve) e **su quanti ordini ha retto** il
   programma, uno per uno — è la cosa vera del gioco. Se il livello ne
   aveva uno solo non lo dice: sarebbe una frase senza notizia.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, onMounted, onUnmounted } from 'vue'
import Festa from '../../Festa.vue'

defineProps({
  titolo: { type: String, required: true },
  stelle: { type: Number, default: 1 },
  monete: { type: Number, default: 0 },
  ordini: { type: Array, default: () => [] },     // i nomi degli ordini
  svelato: { type: Boolean, default: false },
  ultimo: { type: Boolean, default: false },
})
const emit = defineEmits(['avanti', 'mappa', 'resta'])

/* la finestra cieca di sempre: il cartello compare sotto il dito che ha
   appena premuto ▶, e quel dito si lascia dietro un tocco */
const cieco = ref(true)
let timer = 0
onMounted(() => { timer = setTimeout(() => { cieco.value = false }, 320) })
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="cst-velo cst-velo-fine" data-fine="livello">
    <!-- i coriandoli cadono dietro il cartello: quello che c'è scritto resta leggibile -->
    <Festa :quanti="90" />
    <div class="cst-cartello">
      <div class="cst-faccia-grande">🏗️</div>
      <h2>{{ titolo }}</h2>
      <div class="cst-stelle-grandi">{{ '⭐'.repeat(stelle) }}<span class="cst-spenta">{{ '⭐'.repeat(2 - stelle) }}</span></div>
      <p v-if="ordini.length > 1">Il tuo programma ha retto su tutti gli ordini: <b>{{ ordini.join(' · ') }}</b>.</p>
      <p v-else>Costruito!</p>
      <p v-if="svelato" class="cst-piccolo">Con la soluzione mostrata la seconda stella resta spenta: ricomincia da capo e prova da solo.</p>
      <p v-if="monete" class="cst-monete">+{{ monete }} 🪙</p>
      <div class="cst-tasti-foglio">
        <button type="button" class="cst-secondario" data-azione="resta" :disabled="cieco" @click="emit('resta')">guarda il programma</button>
        <button v-if="!ultimo" type="button" class="cst-primario" data-azione="avanti" :disabled="cieco" @click="emit('avanti')">avanti →</button>
        <button v-else type="button" class="cst-primario" data-azione="mappa" :disabled="cieco" @click="emit('mappa')">🗺️ alla mappa</button>
      </div>
    </div>
  </div>
</template>
