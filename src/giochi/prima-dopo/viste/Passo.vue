<script setup>
// Un passo: l'unico posto che sa che esistono due specie di vignetta
// (un'emoji o il nome di una scena disegnata). Sta staccato da
// Storia.vue perché lì i passi si stampano in sei punti diversi.
import { computed } from 'vue'
import Vignetta from './Vignetta.vue'
import { èScena } from '../dati/scene.js'

const props = defineProps({
  passo: { type: String, default: null },
  vuoto: { type: String, default: '' },   // cosa mostrare per una buca vuota
})

const disegnato = computed(() => !!props.passo && èScena(props.passo))
</script>

<template>
  <Vignetta v-if="disegnato" :scena="passo" />
  <template v-else>{{ passo ?? vuoto }}</template>
</template>
