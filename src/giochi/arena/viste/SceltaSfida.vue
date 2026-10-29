<script setup>
// Le scelte di chi crea la sfida in due, dentro la sala comune (src/insieme/SalaSfida.vue): il terreno e quanto andare veloci
// (docs/arena/multigiocatore.md). Il resto della sala, codice e amici compresi, non è di Castle Battle.
defineProps({
  terreni: { type: Array, default: () => [] },     // [{ chiave, nome, icona }]
})
const terreno = defineModel('terreno', { type: String, default: 'bosco' })
const secondi = defineModel('secondi', { type: Number, default: 10 })
// quanto ci mette un bambino a rispondere: le monete corrono in proporzione (docs/arena/multigiocatore.md)
const RITMI = [
  { chiave: 'piano', icona: '🐢', nome: 'Più piano', secondi: 15 },
  { chiave: 'normale', icona: '⚖️', nome: 'Normale', secondi: 10 },
  { chiave: 'svelto', icona: '🐇', nome: 'Svelto', secondi: 6 },
]
</script>

<template>
  <div class="ins-scelte" role="group" aria-label="Terreno">
    <button v-for="t in terreni" :key="t.chiave" type="button" class="ins-scelta" :class="{ 'ins-scelta-su': t.chiave === terreno }"
            :data-terreno="t.chiave" :aria-pressed="t.chiave === terreno" @click="terreno = t.chiave"><span class="em">{{ t.icona }}</span> {{ t.nome }}</button>
  </div>
  <h2>Quanto andate veloci?</h2>
  <p class="ins-nota">Quanto ci mettete a rispondere a un conto: le monete corrono di conseguenza.</p>
  <div class="ins-scelte" role="group" aria-label="Velocità">
    <button v-for="r in RITMI" :key="r.chiave" type="button" class="ins-scelta" :class="{ 'ins-scelta-su': r.secondi === secondi }"
            :data-ritmo="r.chiave" :aria-pressed="r.secondi === secondi" @click="secondi = r.secondi"><span class="em">{{ r.icona }}</span> {{ r.nome }}</button>
  </div>
</template>
