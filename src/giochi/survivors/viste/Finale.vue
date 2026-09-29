<script setup>
// Il cartello di fine: un cartello solo per i due modi in cui una
// partita finisce. Perdere non toglie niente e non fa arretrare. Nella
// Sopravvivenza conta il primato, che arriva già scritto
// (giochi/primati.js): questo file non conta e non confronta niente.
import Festa from '../../Festa.vue'

defineProps({
  vinta: { type: Boolean, default: false },
  titolo: { type: String, default: '' },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  notaMonete: { type: String, default: '' },   // il premio ridotto: docs/genitori/varieta.md
  tempo: { type: Number, default: 0 },
  uccisi: { type: Number, default: 0 },
  livello: { type: Number, default: 1 },
  // { record, primo, frase, … } nella Sopravvivenza, niente nelle tappe
  primato: { type: Object, default: null },
  libera: { type: Boolean, default: false },
  ultima: { type: Boolean, default: false },   // la campagna è finita qui
  puoiRestare: { type: Boolean, default: false },  // sei appena arrivato al traguardo
  extra: { type: Number, default: 0 },         // secondi resistiti dopo il traguardo
})
defineEmits(['ancora', 'esci', 'resta'])

const minuti = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
</script>

<template>
  <div class="sv-velo sv-fine" :data-fine="vinta ? 'vinta' : 'persa'">
    <!-- i coriandoli cadono dietro il cartello, e solo per un record -->
    <Festa v-if="primato && primato.record" />

    <div class="sv-cartello">
      <div class="sv-faccia em">{{ ultima ? '🏆' : vinta ? '🎉' : '🙈' }}</div>
      <h2 v-if="ultima">Campagna finita!</h2>
      <h2 v-else-if="vinta">{{ titolo || 'Ce l\'hai fatta!' }}</h2>
      <h2 v-else>Ti hanno preso</h2>

      <div v-if="stelle" class="sv-stelle em">{{ '⭐'.repeat(stelle) }}</div>

      <div class="sv-rapporto">
        <div class="sv-dato"><b>{{ minuti(tempo) }}</b><span>resistito</span></div>
        <div class="sv-dato"><b>{{ uccisi }}</b><span>mostri</span></div>
        <div class="sv-dato"><b>{{ livello }}</b><span>livello</span></div>
      </div>

      <p v-if="primato && primato.record" class="sv-primato em" data-primato="nuovo">
        🥇 {{ primato.frase }}
      </p>
      <p v-else-if="primato && primato.frase" data-primato="no">🏁 {{ primato.frase }}</p>
      <p v-if="extra" class="sv-extra em">⏱️ altri {{ extra }}s dopo il traguardo</p>
      <p v-if="notaMonete" class="sv-nota-monete" data-nota-monete>{{ notaMonete }}</p>
      <p v-else-if="monete">+{{ monete }} 🪙</p>
      <p v-if="!monete && !notaMonete && !vinta">non hai perso niente: la tappa ti aspetta</p>

      <!-- al traguardo si può restare: da lì non si vince più niente, prima o poi ti prendono -->
      <button v-if="puoiRestare" class="sv-grosso sv-resta" @click="$emit('resta')">
        <span class="em">⏱️</span> resto in campo
      </button>
      <button class="sv-grosso" @click="$emit('ancora')">
        <span class="em">{{ vinta && !libera ? '▶' : '↻' }}</span>
        {{ libera ? 'ancora' : vinta ? 'avanti' : 'riprova' }}
      </button>
      <button class="sv-grosso sv-chiaro" @click="$emit('esci')">
        <span class="em">🗺️</span> alla mappa
      </button>
    </div>
  </div>
</template>
