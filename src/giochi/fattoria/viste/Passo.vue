<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL PROSSIMO PASSO, A SCHERMO

   La faccia di `motore/consiglio.js`: una riga che dice cosa fare
   adesso, e il tasto che lo fa. Sta in fondo ai fogli che possono dire
   di no — il campo che non ha dove scaricare, la macchina a cui manca
   un ingrediente — e la regola è che **un no non compare mai da solo**.

   È piccolo apposta. Un cartello grosso in mezzo a un foglio si legge
   come un errore; questa è una scorciatoia, e una scorciatoia sta in
   fondo e non urla. Il tasto dice **dove porta**, non «ok»: «Apri il
   baule» e «Portami lì» sono due promesse diverse, e mantenerle è
   quello che fa fidare del tasto dopo.

   Non decide niente: riceve `{ testo, azione }` così com'è uscito dal
   motore e manda fuori l'azione al tocco.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'

const props = defineProps({
  /* `{ testo, azione }` da `comeAvere` / `comeFarePosto` */
  passo: { type: Object, default: null },
})
const emit = defineEmits(['fai'])

const azione = computed(() => (props.passo || {}).azione || null)

/* Cosa c'è scritto sul tasto. Il prezzo ci va **sopra** e non nella
   frase: un tasto che si preme sapendo quanto costa non ha bisogno di
   una conferma dopo. */
const etichetta = computed(() => {
  const a = azione.value
  if (!a) return ''
  if (a.che === 'compra') return 'Apri il baule'
  if (a.che === 'ingrandisci') return `Ingrandisci · 🪙${a.prezzo}`
  return 'Portami lì'
})
</script>

<template>
  <div v-if="passo" class="fa-consiglio">
    <p>{{ passo.testo }}</p>
    <button v-if="azione" type="button" class="fa-bot piccolo"
            @click="emit('fai', azione)">{{ etichetta }}</button>
  </div>
</template>
