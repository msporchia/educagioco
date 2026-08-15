<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA DELLA CAMPAGNA

   Tre scalini, nove tappe. Riceve tutto già deciso — cosa è aperto,
   quante stelle, di che colore, quanto dura — e non sa niente di
   profili, monete e motore: qui dentro si sceglie dove andare e basta.

   Su ogni tappa c'è scritto **quanto dura**: è la prima cosa che un
   bambino vuole sapere prima di dire di sì, e «50 secondi» è una
   promessa che si può mantenere.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe }]
  libera: { type: Object, required: true },   // { aperta, quante, fatte, primato }
})
defineEmits(['gioca', 'libera'])

const durata = s => s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
</script>

<template>
  <div class="co-mappa">
    <section v-for="s in scalini" :key="s.chiave" class="co-scalino">
      <h3>
        <span class="em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="co-tappe">
        <button v-for="t in s.tappe" :key="t.chiave"
                class="co-tappa tappa"
                :class="{ 'co-chiusa': !t.aperta, 'co-adesso': t.adesso }"
                :style="{ '--co-accento': t.accento }"
                :data-tappa="t.indice" :disabled="!t.aperta"
                @click="$emit('gioca', t.indice)">
          <span class="co-faccia em">{{ t.aperta ? t.icona : '🔒' }}</span>
          <span class="co-testo">
            <b>{{ t.nome }}</b>
            <!-- chiusa, si dice cosa ci sarà: «la neve» è un motivo per
                 arrivarci, «prima finisci quella prima» no -->
            <i>{{ t.aperta ? t.racconto : t.vesteNome }}</i>
          </span>
          <span class="co-stelle em">
            {{ t.stelle ? '⭐'.repeat(t.stelle) : durata(t.secondi) }}
          </span>
        </button>
      </div>
    </section>

    <!-- la corsa infinita: si apre quando la campagna è finita, e non
         finisce mai — il punteggio è quanto lontano si arriva -->
    <button class="co-libera" :class="{ 'co-chiusa': !libera.aperta }"
            data-tappa="libera" :disabled="!libera.aperta" @click="$emit('libera')">
      <span class="em">{{ libera.aperta ? '♾️' : '🔒' }}</span>
      <span v-if="libera.aperta">
        la corsa infinita
        <b v-if="libera.primato"> · primato {{ libera.primato }} m</b>
      </span>
      <span v-else>finisci le {{ libera.quante }} tappe ({{ libera.fatte }} fatte)</span>
    </button>
  </div>
</template>
