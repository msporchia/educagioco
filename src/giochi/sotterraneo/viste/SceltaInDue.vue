<script setup>
// Le scelte di chi crea la discesa in due, dentro la sala comune (src/insieme/SalaSfida.vue): il posto e la difficoltà
// (docs/sotterraneo/in-due.md, «Il posto e la difficoltà»). Il livello lo fa il gioco dai due eroi, quando l'altro entra.
import { CAMPAGNA } from '../dati/campagna.js'
import { DUNGEON_NUOVI } from '../dati/dungeon-del-mondo.js'

const posto = defineModel('posto', { type: String, default: 'altare' })
const difficolta = defineModel('difficolta', { type: String, default: 'normale' })
const POSTI = [...CAMPAGNA, ...Object.values(DUNGEON_NUOVI)].map(t => ({ chiave: t.chiave, nome: t.nome, icona: t.icona }))
const DIFFICOLTA = [
  { chiave: 'facile', icona: '🐢', nome: 'Facile' },
  { chiave: 'normale', icona: '⚖️', nome: 'Normale' },
  { chiave: 'difficile', icona: '🔥', nome: 'Difficile' },
  { chiave: 'impossibile', icona: '💀', nome: 'Impossibile' },
]
</script>

<template>
  <div class="ins-scelte" role="group" aria-label="Dove">
    <button v-for="t in POSTI" :key="t.chiave" type="button" class="ins-scelta" :class="{ 'ins-scelta-su': t.chiave === posto }"
            :data-posto-in-due="t.chiave" :aria-pressed="t.chiave === posto" @click="posto = t.chiave"><span class="em">{{ t.icona }}</span> {{ t.nome }}</button>
  </div>
  <h2>Quanto difficile?</h2>
  <p class="ins-nota">I mostri si fanno sulla forza di tutti e due insieme.</p>
  <div class="ins-scelte" role="group" aria-label="Difficoltà">
    <button v-for="d in DIFFICOLTA" :key="d.chiave" type="button" class="ins-scelta" :class="{ 'ins-scelta-su': d.chiave === difficolta }"
            :data-difficolta="d.chiave" :aria-pressed="d.chiave === difficolta" @click="difficolta = d.chiave"><span class="em">{{ d.icona }}</span> {{ d.nome }}</button>
  </div>
</template>
