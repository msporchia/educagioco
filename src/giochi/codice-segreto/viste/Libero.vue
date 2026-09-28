<script setup>
// Il gioco libero: finita la campagna, difficoltà e tema tornano in mano
// al bambino (compreso lo scaglione «esperto», assente nelle tappe). Le
// due scelte si ricordano da una sera all'altra.
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
