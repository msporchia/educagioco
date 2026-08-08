<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL GIOCO LIBERO — le due manopole

   Finita la campagna, la difficoltà torna in mano al bambino: quanto
   duro (compreso lo scaglione «esperto», che nelle tappe non compare
   mai) e con quali disegni. Le due scelte si ricordano fra una sera e
   l'altra — chi ha trovato il suo posto non deve rimetterlo ogni volta.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  scaglioni: { type: Array, required: true },
  temi: { type: Array, required: true },        // [{ chiave, nome, icona, accento }]
  difficolta: { type: String, required: true },
  tema: { type: String, required: true },
})
defineEmits(['difficolta', 'tema', 'gioca', 'esci'])
</script>

<template>
  <div class="cs-mappa">
    <div class="cs-manopole">
      <div class="cs-manopola">
        <span>quanto duro</span>
        <div class="cs-scelte" data-manopola="difficolta">
          <button v-for="s in scaglioni" :key="s.chiave" :data-scelta="s.chiave"
                  :aria-pressed="String(s.chiave === difficolta)"
                  @click="$emit('difficolta', s.chiave)">
            <span class="em">{{ s.icona }}</span>{{ s.nome }}
          </button>
        </div>
      </div>

      <div class="cs-manopola">
        <span>con quali disegni</span>
        <div class="cs-scelte" data-manopola="tema">
          <button v-for="t in temi" :key="t.chiave" :data-scelta="t.chiave"
                  :aria-pressed="String(t.chiave === tema)"
                  :style="{ '--cs-accento': t.accento }"
                  @click="$emit('tema', t.chiave)">
            <span class="em">{{ t.icona }}</span>{{ t.nome }}
          </button>
        </div>
      </div>
    </div>

    <button class="cs-grosso" data-azione="gioca" @click="$emit('gioca')">
      <span class="em">▶</span> gioca
    </button>
  </div>
</template>
