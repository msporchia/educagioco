<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA DELLA CAMPAGNA

   Tre scalini, nove tappe. Riceve tutto già deciso — cosa è aperto,
   quante stelle, che colore ha la tappa — e non sa niente di profili,
   monete e motore: qui dentro si sceglie dove andare e basta.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe: [] }]
  libero: { type: Object, required: true },   // { aperto, quante, fatte }
})
defineEmits(['gioca', 'libero'])
</script>

<template>
  <div class="cs-mappa">
    <section v-for="s in scalini" :key="s.chiave" class="cs-scalino">
      <h3>
        <span class="em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="cs-tappe">
        <button v-for="t in s.tappe" :key="t.chiave"
                class="cs-tappa" :class="{ 'cs-chiusa': !t.aperta, 'cs-adesso': t.adesso }"
                :style="{ '--cs-accento': t.accento }"
                :data-tappa="t.indice" :disabled="!t.aperta"
                @click="$emit('gioca', t.indice)">
          <span class="cs-faccia em">{{ t.aperta ? t.icona : '🔒' }}</span>
          <span class="cs-testo">
            <b>{{ t.nome }}</b>
            <!-- chiusa, si dice cosa ci sarà: «i disegni del mare» è un
                 motivo per arrivarci, «prima finisci quella prima» no -->
            <i>{{ t.aperta ? t.racconto : t.temaNome }}</i>
          </span>
          <span class="cs-stelle em">{{ t.stelle ? '⭐'.repeat(t.stelle) : `${t.partite} 🔑` }}</span>
        </button>
      </div>
    </section>

    <!-- il gioco libero: si apre quando la campagna è finita, ed è l'unico
         posto dove la difficoltà si sceglie a mano -->
    <button class="cs-libero" :class="{ 'cs-chiusa': !libero.aperto }"
            data-tappa="libero" :disabled="!libero.aperto" @click="$emit('libero')">
      <span class="em">{{ libero.aperto ? '🎲' : '🔒' }}</span>
      <span v-if="libero.aperto">gioco libero</span>
      <span v-else>finisci le {{ libero.quante }} tappe ({{ libero.fatte }} fatte)</span>
    </button>
  </div>
</template>
