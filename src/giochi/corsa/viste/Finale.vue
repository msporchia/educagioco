<script setup>
// Il cartello di fine: un cartello solo per i due modi in cui una
// corsa finisce. Perdere non toglie niente e non fa arretrare. La riga
// che conta di più è la mira (quanti cancelli erano il migliore): è
// l'unica che parli di matematica invece che di fortuna, ed è quella
// della terza stella. Nella corsa infinita conta il primato, che arriva
// già scritto (giochi/primati.js): questo file non conta e non confronta niente.
import Festa from '../../Festa.vue'

defineProps({
  vinta: { type: Boolean, default: false },
  titolo: { type: String, default: '' },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  notaMonete: { type: String, default: '' },   // il salvadanaio stanco: docs/genitori/varieta.md
  metri: { type: Number, default: 0 },
  truppa: { type: Number, default: 0 },
  vinti: { type: Number, default: 0 },
  cancelli: { type: Number, default: 0 },
  meglio: { type: Number, default: 0 },
  libri: { type: Number, default: 0 },        // esercizi indovinati
  causa: { type: String, default: '' },
  // { record, primo, frase, … } nella corsa infinita, niente nelle tappe
  primato: { type: Object, default: null },
  libera: { type: Boolean, default: false },
  ultima: { type: Boolean, default: false },  // la campagna è finita qui
})
defineEmits(['ancora', 'esci'])
</script>

<template>
  <div class="co-velo co-fine" :data-fine="vinta ? 'vinta' : 'persa'">
    <!-- i coriandoli cadono dietro il cartello, e solo per un record -->
    <Festa v-if="primato && primato.record" />

    <div class="co-cartello">
      <div class="co-faccia em">{{ ultima ? '🏆' : vinta ? '🎉' : '🙈' }}</div>
      <h2 v-if="ultima">Campagna finita!</h2>
      <h2 v-else-if="vinta">{{ titolo || 'Ce l\'hai fatta!' }}</h2>
      <h2 v-else>Ti hanno travolto</h2>

      <div v-if="stelle" class="co-stelle em">{{ '⭐'.repeat(stelle) }}</div>
      <p v-if="!vinta && causa" class="co-causa">Ti ha fermato {{ causa }}.</p>

      <div class="co-rapporto">
        <div class="co-dato"><b>{{ metri }}</b><span>metri</span></div>
        <div class="co-dato"><b>{{ truppa }}</b><span>truppa</span></div>
        <div class="co-dato"><b>{{ vinti }}</b><span>mostri</span></div>
      </div>

      <p v-if="cancelli" class="co-mira em">
        🎯 il cancello migliore <b>{{ meglio }}</b> volte su {{ cancelli }}
      </p>
      <p v-if="libri" class="co-libri em">📚 {{ libri }} esercizi indovinati</p>
      <p v-if="primato && primato.record" class="co-primato em" data-primato="nuovo">
        🥇 {{ primato.frase }}
      </p>
      <p v-else-if="primato && primato.frase" data-primato="no">🏁 {{ primato.frase }}</p>
      <p v-if="monete" data-monete-prese>+{{ monete }} 🪙</p>
      <p v-if="notaMonete" data-nota-monete>{{ notaMonete }}</p>
      <p v-if="!vinta && !libera">non hai perso niente: la tappa ti aspetta</p>

      <button class="co-grosso" @click="$emit('ancora')">
        <span class="em">{{ vinta && !libera ? '▶' : '↻' }}</span>
        {{ libera ? 'ancora' : vinta ? 'avanti' : 'riprova' }}
      </button>
      <button class="co-grosso co-chiaro" @click="$emit('esci')">
        <span class="em">🗺️</span> alla mappa
      </button>
    </div>
  </div>
</template>
