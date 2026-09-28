<script setup>
// La mappa della campagna: tre scalini, nove tappe. Riceve tutto già
// deciso (aperto, stelle, colore) e non sa niente di profili o motore.
defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe: [] }]
  libero: { type: Object, required: true },   // { aperto, quante, fatte, primato }
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
            <i>{{ t.aperta ? t.racconto : t.temaNome }}</i>
          </span>
          <span class="cs-stelle em">{{ t.stelle ? '⭐'.repeat(t.stelle) : `${t.partite} 🔑` }}</span>
        </button>
      </div>
    </section>

    <button class="cs-libero" :class="{ 'cs-chiusa': !libero.aperto }"
            data-tappa="libero" :disabled="!libero.aperto" @click="$emit('libero')">
      <span class="em">{{ libero.aperto ? '🎲' : '🔒' }}</span>
      <span v-if="libero.aperto">
        gioco libero
        <b v-if="libero.primato"> · record {{ libero.primato }}</b>
      </span>
      <span v-else>finisci le {{ libero.quante }} tappe ({{ libero.fatte }} fatte)</span>
    </button>
  </div>
</template>
