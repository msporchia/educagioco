<script setup>
// La scelta per una piazzola libera: le truppe della tappa a due a due, col prezzo; anche
// una uguale a una caserma che c'è già. Il campo sta fermo finché è aperta (lo decide
// Gioco.vue). Le truppe che la tappa non ha ancora si vedono in fondo, piccole.
import Ritratto from './Ritratto.vue'

defineProps({
  s: { type: Object, required: true },
})
defineEmits(['chiudi', 'costruisci', 'dettagli'])
</script>

<template>
  <div class="ar-velo ar-dettagli" :data-scelta="s.posto" @click.self="$emit('chiudi')">
    <div class="ar-scheda">
      <button class="ar-x" aria-label="chiudi" @click="$emit('chiudi')">✕</button>
      <div class="ar-intesta">
        <div>
          <h2>Piazzola libera</h2>
          <p class="ar-livello">Scegli chi ci abita: parte dal livello 1</p>
        </div>
      </div>

      <div class="ar-varianti">
        <section v-for="v in s.varianti" :key="v.id" class="ar-variante" :data-variante="v.id">
          <Ritratto :id="v.id" :lato="60" />
          <h3>{{ v.nome }}</h3>
          <p class="ar-nota-variante">{{ v.nota }}</p>
          <button class="ar-grosso" :class="{ 'ar-spento': !v.puoi }" :disabled="!v.puoi" :data-costruisci="v.id"
                  @click="$emit('costruisci', v.id)">
            <span class="em">🛖</span> {{ v.prezzo }} <span class="em">🪙</span>
          </button>
          <button class="ar-numeri" :data-dettagli="v.id" @click="$emit('dettagli', v.id)">i numeri</button>
        </section>
      </div>
      <div v-if="s.piuAvanti.length" class="ar-piu-avanti">
        <Ritratto v-for="id in s.piuAvanti" :key="id" :id="id" :lato="30" />
        <span class="ar-motivo">arrivano più avanti</span>
      </div>

      <button class="ar-grosso ar-chiaro" @click="$emit('chiudi')">torno in campo</button>
    </div>
  </div>
</template>
