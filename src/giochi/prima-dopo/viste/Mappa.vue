<script setup>
// La mappa della campagna, calcata su codice-segreto/viste/Mappa.vue con
// le carte più grandi: qui legge un bambino di quattro anni. Riceve
// tutto già deciso (aperto, chiuso per età, stelle, colore).
defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe: [] }]
})
defineEmits(['gioca'])
</script>

<template>
  <div class="pd-mappa">
    <section v-for="s in scalini" :key="s.chiave" class="pd-scalino">
      <h3>
        <span class="em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="pd-tappe">
        <button v-for="t in s.tappe" :key="t.chiave"
                class="pd-tappa" :class="{ 'pd-chiusa': !t.aperta, 'pd-adesso': t.adesso }"
                :style="{ '--pd-accento': t.accento }"
                :data-tappa="t.indice" :disabled="!t.aperta"
                @click="$emit('gioca', t.indice)">
          <span class="pd-faccia em">{{ t.aperta ? t.icona : '🔒' }}</span>
          <span class="pd-testo">
            <b>{{ t.nome }}</b>
            <!-- chiusa per età non si scrive niente: per questo bambino il gioco finisce lì -->
            <i v-if="t.aperta">{{ t.racconto }}</i>
            <i v-else-if="!t.perEta">continua per aprirla</i>
          </span>
          <span class="pd-stelle em">{{ t.stelle ? '⭐'.repeat(t.stelle) : `${t.quante} 📖` }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
