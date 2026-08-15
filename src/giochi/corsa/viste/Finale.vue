<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CARTELLO DI FINE

   Un cartello solo per i due modi in cui una corsa finisce, perché è lo
   stesso gesto: «è finita, ecco com'è andata, si riparte da qui».

   Perdere non toglie niente e non fa arretrare: si riprova la stessa
   tappa quando si vuole. A sei anni la punizione non insegna, insegna il
   giro dopo — e questo cartello lo deve dire, se no il bambino crede di
   aver perso qualcosa.

   La riga che conta di più è **la mira**: quanti dei cancelli erano il
   migliore. È l'unica cosa qui dentro che parli di matematica invece che
   di fortuna, ed è quella che vale la terza stella.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  vinta: { type: Boolean, default: false },
  titolo: { type: String, default: '' },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  metri: { type: Number, default: 0 },
  truppa: { type: Number, default: 0 },
  vinti: { type: Number, default: 0 },
  cancelli: { type: Number, default: 0 },
  meglio: { type: Number, default: 0 },
  libri: { type: Number, default: 0 },        // esercizi indovinati
  causa: { type: String, default: '' },
  primato: { type: Boolean, default: false },
  libera: { type: Boolean, default: false },
  ultima: { type: Boolean, default: false },  // la campagna è finita qui
})
defineEmits(['ancora', 'esci'])
</script>

<template>
  <div class="co-velo co-fine" :data-fine="vinta ? 'vinta' : 'persa'">
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
      <p v-if="primato" class="co-primato em">🥇 nuovo primato!</p>
      <p v-if="monete">+{{ monete }} 🪙</p>
      <p v-else-if="!vinta">non hai perso niente: la tappa ti aspetta</p>

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
