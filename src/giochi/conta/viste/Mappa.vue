<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA DELLA CAMPAGNA

   Calcata su `codice-segreto/viste/Mappa.vue`, con le carte più grandi:
   qui legge un bambino di quattro anni, cioè spesso non legge affatto —
   l'icona del mondo e il lucchetto devono bastare da soli a capire dove
   si può andare. Nessun gioco libero: la campagna è tutto il gioco.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe: [] }]
})
defineEmits(['gioca'])
</script>

<template>
  <div class="ct-mappa">
    <section v-for="s in scalini" :key="s.chiave" class="ct-scalino">
      <h3>
        <span class="em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="ct-tappe">
        <button v-for="t in s.tappe" :key="t.chiave"
                class="ct-tappa" :class="{ 'ct-chiusa': !t.aperta, 'ct-adesso': t.adesso }"
                :style="{ '--ct-accento': t.accento }"
                :data-tappa="t.indice" :disabled="!t.aperta"
                @click="$emit('gioca', t.indice)">
          <span class="ct-faccia em">{{ t.aperta ? t.icona : '🔒' }}</span>
          <span class="ct-testo">
            <b>{{ t.nome }}</b>
            <i>{{ t.aperta ? t.racconto : t.mondoNome }}</i>
          </span>
          <span class="ct-stelle em">{{ t.stelle ? '⭐'.repeat(t.stelle) : `${t.partite} 🐾` }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
