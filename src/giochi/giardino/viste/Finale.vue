<script setup>
// Il cartello di fine: uno solo per i modi in cui una tappa finisce. Perdere
// non toglie niente e non fa arretrare. Niente conta qui: arriva già scritto
// (stelle, monete) da Gioco.vue.
defineProps({
  vinta: { type: Boolean, default: false },
  titolo: { type: String, default: '' },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  notaMonete: { type: String, default: '' },   // il premio ridotto: docs/genitori/varieta.md
  carretti: { type: Number, default: 0 },
  ultima: { type: Boolean, default: false },   // la campagna è finita qui
})
defineEmits(['ancora', 'esci'])
</script>

<template>
  <div class="gi-velo gi-fine" :data-fine="vinta ? 'vinta' : 'persa'">
    <div class="gi-cartello">
      <div class="gi-esito em">{{ ultima ? '🏆' : vinta ? '🌻' : '🧟' }}</div>
      <h2 v-if="ultima">Campagna finita!</h2>
      <h2 v-else-if="vinta">{{ titolo }}</h2>
      <h2 v-else>Sono arrivati in casa…</h2>
      <div v-if="stelle" class="gi-stelle-grandi em">{{ '⭐'.repeat(stelle) }}</div>
      <p v-if="vinta && carretti" class="gi-nota">{{ carretti === 1 ? 'un carretto è partito' : carretti + ' carretti sono partiti' }}</p>
      <p v-if="notaMonete" class="gi-nota" data-nota-monete>{{ notaMonete }}</p>
      <p v-else-if="monete">+{{ monete }} 🪙</p>
      <p v-if="!vinta" class="gi-nota">non hai perso niente: la tappa ti aspetta</p>
      <button class="gi-grosso" @click="$emit('ancora')">
        <span class="em">{{ vinta ? '▶' : '↻' }}</span> {{ vinta ? 'avanti' : 'riprova' }}
      </button>
      <button class="gi-grosso gi-chiaro" @click="$emit('esci')"><span class="em">🗺️</span> alla mappa</button>
    </div>
  </div>
</template>
