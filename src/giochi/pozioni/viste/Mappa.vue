<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA — un blocco per famiglia, e il calderone in fondo

   Riceve tutto già deciso: cosa è aperto, quante stelle, dov'è il
   bambino. Qui si sceglie dove andare e basta.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  blocchi: { type: Array, required: true },   // [{ chiave, nome, emoji, dritta, tappe: [] }]
})
defineEmits(['gioca'])
</script>

<template>
  <div class="pz-mappa">
    <p class="pz-intro">La ricetta parla di chili, metri e litri. Ogni attrezzo conta nella
      sua unità e arriva fin dove arriva: sta a te scegliere quello giusto, e tradurre.</p>
    <section v-for="b in blocchi" :key="b.chiave" class="pz-blocco" :data-blocco="b.chiave">
      <h3>
        <span class="em">{{ b.emoji }}</span>
        <b>{{ b.nome }}</b>
        <i>{{ b.dritta }}</i>
      </h3>
      <div class="pz-tappe">
        <button v-for="t in b.tappe" :key="t.chiave" class="pz-tappa"
                :class="{ 'pz-chiusa': !t.aperta, 'pz-adesso': t.adesso, 'pz-fatta': t.stelle > 0 }"
                :data-tappa="t.indice" :disabled="!t.aperta" @click="$emit('gioca', t.indice)">
          <span class="pz-numero">{{ t.indice + 1 }}</span>
          <span class="pz-testo">
            <b>{{ t.nome }}</b>
            <i>{{ t.dritta }}</i>
          </span>
          <span class="pz-stelle em">{{ !t.aperta ? '🔒' : t.stelle ? '⭐'.repeat(t.stelle) : '▶' }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
