<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UN PASSO — l'unico posto che sa che esistono due specie di vignetta

   Un passo di una storia è una stringa, e `motore/` non guarda mai
   dentro: può essere un'emoji (com'era tutto fino a ieri) o il nome di
   una scena disegnata (`dati/scene.js`). La differenza la conosce
   soltanto questo componente, che è il motivo per cui aggiungere le
   storie disegnate non ha toccato né la campagna né i quesiti.

   Sta staccato da `Storia.vue` perché lì i passi si stampano in sei
   punti diversi — la striscia, la pesca, le opzioni, l'intruso, il
   lampo — e un `v-if` ripetuto sei volte è sei occasioni di
   dimenticarsene una.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import Vignetta from './Vignetta.vue'
import { èScena } from '../dati/scene.js'

const props = defineProps({
  passo: { type: String, default: null },
  /* cosa far vedere quando non c'è nessun passo: il numero della buca
     vuota, il punto di domanda del buco */
  vuoto: { type: String, default: '' },
})

const disegnato = computed(() => !!props.passo && èScena(props.passo))
</script>

<template>
  <Vignetta v-if="disegnato" :scena="passo" />
  <template v-else>{{ passo ?? vuoto }}</template>
</template>
