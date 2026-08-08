<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CARTELLO DI FINE

   Due cartelli in uno, perché sono lo stesso gesto: «è finita una cosa,
   ecco com'è andata, si va avanti da qui».

     che: 'partita'   un codice, trovato o no
     che: 'tappa'     la tappa portata a casa

   Il codice si mostra **sempre**, anche quando si è perso — anzi:
   soprattutto. Un codice che resta segreto non insegna niente, e la
   voglia di rigiocare nasce dal «ah, era lì».
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  che: { type: String, required: true },       // 'partita' | 'tappa'
  vinta: { type: Boolean, default: false },
  codice: { type: Array, default: () => [] },
  stelle: { type: Number, default: 0 },
  monete: { type: Number, default: 0 },
  rimaste: { type: Number, default: 0 },       // quanti codici mancano alla tappa
  titolo: { type: String, default: '' },
  libero: { type: Boolean, default: false },
})
defineEmits(['avanti', 'esci'])
</script>

<template>
  <div class="cs-velo" :data-fine="che">
    <div class="cs-cartello">
      <div class="cs-faccia em">
        {{ che === 'tappa' ? '🏆' : vinta ? '🎉' : '🙈' }}
      </div>

      <h2 v-if="che === 'tappa'">{{ titolo }}</h2>
      <h2 v-else-if="vinta">Trovato!</h2>
      <h2 v-else>Era questo</h2>

      <div v-if="stelle" class="cs-punteggio em">{{ '⭐'.repeat(stelle) }}</div>

      <div class="cs-fila em">
        <span v-for="(s, i) in codice" :key="i"
              :style="{ animationDelay: (i * 90) + 'ms' }">{{ s }}</span>
      </div>

      <p v-if="monete">+{{ monete }} 🪙</p>
      <p v-else-if="!vinta && che === 'partita'">un codice sbagliato non toglie niente</p>

      <p v-if="che === 'partita' && vinta && !libero && rimaste > 0">
        ne {{ rimaste === 1 ? 'manca ancora uno' : `mancano ancora ${rimaste}` }}
      </p>

      <button class="cs-grosso" @click="$emit('avanti')">
        <span class="em">{{ che === 'tappa' ? '🗺️' : '↻' }}</span>
        {{ che === 'tappa' ? 'alla mappa'
           : libero ? 'un altro' : vinta ? 'avanti' : 'riprova' }}
      </button>
      <button v-if="che !== 'tappa'" class="cs-grosso cs-chiaro" @click="$emit('esci')">
        <span class="em">🗺️</span> lascia qui
      </button>
    </div>
  </div>
</template>
