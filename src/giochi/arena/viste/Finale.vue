<script setup>
// Il cartello di fine: uno solo per i modi in cui una battaglia finisce.
// Perdere non toglie niente e non fa arretrare. Niente conta qui: arriva già
// scritto (stelle, monete) da Gioco.vue. Nella battaglia infinita non c'è un
// tempo da battere né stelle né record: c'è solo il tempo di questa volta.

defineProps({
  vinta: { type: Boolean, default: false },
  pari: { type: Boolean, default: false },
  titolo: { type: String, default: '' },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  notaMonete: { type: String, default: '' },   // il premio ridotto: docs/genitori/varieta.md
  tempo: { type: Number, default: 0 },
  ultima: { type: Boolean, default: false },   // la campagna è finita qui
  infinita: { type: Boolean, default: false }, // la battaglia infinita
  sfida: { type: Boolean, default: false },    // la sfida in due: niente stelle né tappe, e non si rigioca da qui
})
defineEmits(['ancora', 'esci'])
const minuti = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
</script>

<template>
  <div class="ar-velo ar-fine" :data-fine="vinta ? 'vinta' : pari ? 'pari' : 'persa'">
    <div class="ar-cartello">
      <div class="ar-esito em">{{ ultima ? '🏆' : vinta ? '🎉' : pari ? '🤝' : '🛡️' }}</div>
      <h2 v-if="sfida">{{ vinta ? 'Hai vinto la sfida!' : 'Questa volta ha vinto l\'altro' }}</h2>
      <h2 v-else-if="infinita">{{ vinta ? 'Castello nemico abbattuto!' : 'Il tuo castello è caduto' }}</h2>
      <h2 v-else-if="ultima">Campagna finita!</h2>
      <h2 v-else-if="vinta">{{ titolo }}</h2>
      <h2 v-else-if="pari">Pari: nessuno ha vinto</h2>
      <h2 v-else>Il nemico ha vinto questa volta</h2>
      <div v-if="stelle" class="ar-stelle-grandi em">{{ '⭐'.repeat(stelle) }}</div>
      <p class="ar-tempo">{{ infinita ? (vinta ? `ci hai messo ${minuti(tempo)}` : `hai resistito ${minuti(tempo)}`) : `battaglia durata ${minuti(tempo)}` }}</p>
      <p v-if="notaMonete" class="ar-nota" data-nota-monete>{{ notaMonete }}</p>
      <p v-else-if="monete">+{{ monete }} 🪙</p>
      <p v-if="!vinta && !pari" class="ar-nota">{{ sfida ? 'non hai perso niente: è solo una sfida' : infinita ? 'non hai perso niente: ti aspetta un altro terreno' : 'non hai perso niente: la tappa ti aspetta' }}</p>
      <button v-if="!sfida" class="ar-grosso" data-ancora @click="$emit('ancora')">
        <span class="em">{{ infinita ? '♾️' : vinta ? '▶' : '↻' }}</span> {{ infinita ? 'ancora' : vinta ? 'avanti' : 'riprova' }}
      </button>
      <button class="ar-grosso ar-chiaro" @click="$emit('esci')"><span class="em">🗺️</span> alla mappa</button>
    </div>
  </div>
</template>
