<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CARTELLO DI FINE

   Un cartello solo per i due modi in cui una partita finisce, perché è
   lo stesso gesto: «è finita, ecco com'è andata, si riparte da qui».

   Perdere non toglie niente e non fa arretrare: si riprova la stessa
   tappa quando si vuole. A sei anni la punizione non insegna, insegna il
   giro dopo — e questo cartello lo deve dire, se no il bambino crede di
   aver perso qualcosa.

   Nella Sopravvivenza la riga che conta è **il primato**: lì non si
   vince niente, quindi l'unica cosa che il gioco ha da dare è dire di
   quanto si è migliorato. Arriva già scritta (`giochi/primati.js`) e
   con i coriandoli quando è un record: questo file non conta e non
   confronta niente.
   ═══════════════════════════════════════════════════════════════════ */
import Festa from '../../Festa.vue'

defineProps({
  vinta: { type: Boolean, default: false },
  titolo: { type: String, default: '' },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  tempo: { type: Number, default: 0 },
  uccisi: { type: Number, default: 0 },
  livello: { type: Number, default: 1 },
  /* `{ record, primo, frase, … }` nella Sopravvivenza, niente nelle
     tappe: un primato non c'entra dove c'è un traguardo da tagliare */
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

      <!-- il record, e di quanto: «🥇 Nuovo record! 2:05 (32s meglio di
           prima)». Quando non è un record si dice lo stesso quanto è
           mancato — è la riga che fa venire voglia di rigiocare, e non
           è un rimprovero: quel record è suo. -->
      <p v-if="primato && primato.record" class="sv-primato em" data-primato="nuovo">
        🥇 {{ primato.frase }}
      </p>
      <p v-else-if="primato && primato.frase" data-primato="no">🏁 {{ primato.frase }}</p>
      <p v-if="extra" class="sv-extra em">⏱️ altri {{ extra }}s dopo il traguardo</p>
      <p v-if="monete">+{{ monete }} 🪙</p>
      <p v-else-if="!vinta">non hai perso niente: la tappa ti aspetta</p>

      <!-- Al traguardo si può restare in campo. Da lì non si vince più
           niente — la stella è già presa — e prima o poi ti prendono: è
           quello il senso, e il tasto lo dice invece di prometterlo. -->
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
