<script setup>
/* Le scelte di chi crea la cucina in due, dentro la sala comune (src/insieme/SalaSfida.vue): quanti minuti e quante pietanze.
   Vedi docs/bancarella/in-due.md. */
import { MINUTI_IN_DUE, MENU_IN_DUE } from '../../data/bancarella-cucine.js'

const minuti = defineModel('minuti', { type: Number, default: 5 })
const menu = defineModel('menu', { type: String, default: 'pochi' })
</script>

<template>
  <div class="ins-scelte" role="group" aria-label="Quanti minuti">
    <button v-for="m in MINUTI_IN_DUE" :key="m" type="button" class="ins-scelta" :class="{ 'ins-scelta-su': m === minuti }"
            :data-minuti-in-due="m" :aria-pressed="m === minuti" @click="minuti = m">{{ m }} minuti</button>
  </div>
  <h2>Quante pietanze?</h2>
  <p class="ins-nota">Più pietanze, più cose da fare in cucina.</p>
  <div class="ins-scelte" role="group" aria-label="Quante pietanze">
    <button v-for="(d, k) in MENU_IN_DUE" :key="k" type="button" class="ins-scelta" :class="{ 'ins-scelta-su': k === menu }"
            :data-menu-in-due="k" :aria-pressed="k === menu" @click="menu = k">{{ d.nome }} ({{ d.ricette.length }})</button>
  </div>
</template>
