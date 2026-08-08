<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA DELLA CAMPAGNA

   Tre scalini, nove tappe. Riceve tutto già deciso — cosa è aperto,
   quante stelle, di che colore, quanto dura — e non sa niente di
   profili, monete e motore: qui dentro si sceglie dove andare e basta.

   Su ogni tappa c'è scritto **quanto dura**: è la prima cosa che un
   bambino vuole sapere prima di dire di sì, e «40 secondi» è una
   promessa che si può mantenere.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe: [] }]
  libero: { type: Object, required: true },   // { aperto, quante, fatte, primato }
})
defineEmits(['gioca', 'libero'])

const durata = s => s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
</script>

<template>
  <div class="sv-mappa">
    <section v-for="s in scalini" :key="s.chiave" class="sv-scalino">
      <h3>
        <span class="em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="sv-tappe">
        <button v-for="t in s.tappe" :key="t.chiave"
                class="sv-tappa tappa"
                :class="{ 'sv-chiusa': !t.aperta, 'sv-adesso': t.adesso }"
                :style="{ '--sv-accento': t.accento }"
                :data-tappa="t.indice" :disabled="!t.aperta"
                @click="$emit('gioca', t.indice)">
          <span class="sv-faccia em">{{ t.aperta ? t.icona : '🔒' }}</span>
          <span class="sv-testo">
            <b>{{ t.nome }}</b>
            <!-- chiusa, si dice cosa ci sarà: «la neve» è un motivo per
                 arrivarci, «prima finisci quella prima» no -->
            <i>{{ t.aperta ? t.racconto : t.scenarioNome }}</i>
          </span>
          <span class="sv-stelle em">
            {{ t.stelle ? '⭐'.repeat(t.stelle) : durata(t.durata) }}
          </span>
        </button>
      </div>
    </section>

    <!-- il gioco libero: si apre quando la campagna è finita, e non
         finisce mai — il punteggio è quanto si resiste -->
    <button class="sv-libero" :class="{ 'sv-chiusa': !libero.aperto }"
            data-tappa="libero" :disabled="!libero.aperto" @click="$emit('libero')">
      <span class="em">{{ libero.aperto ? '♾️' : '🔒' }}</span>
      <span v-if="libero.aperto">
        sopravvivenza
        <b v-if="libero.primato"> · primato {{ libero.primato }}s</b>
      </span>
      <span v-else>finisci le {{ libero.quante }} tappe ({{ libero.fatte }} fatte)</span>
    </button>
  </div>
</template>
