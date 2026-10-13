<script setup>
// La scelta di un edificio da costruire: le sue due truppe una accanto all'altra,
// col prezzo e il calcolo che costa. Il campo sta fermo finché è aperta (lo decide
// Gioco.vue). Una truppa che la tappa non ha ancora si vede, spenta: arriva più avanti.
import Ritratto from './Ritratto.vue'

defineProps({
  s: { type: Object, required: true },
})
defineEmits(['chiudi', 'costruisci', 'dettagli'])
</script>

<template>
  <div class="ar-velo ar-dettagli" :data-scelta="s.ed" @click.self="$emit('chiudi')">
    <div class="ar-scheda">
      <button class="ar-x" aria-label="chiudi" @click="$emit('chiudi')">✕</button>
      <div class="ar-intesta">
        <div>
          <h2>{{ s.nome }}</h2>
          <p class="ar-livello">{{ s.livello ? `Si rifà al livello ${s.livello}: scegli chi ci abita` : 'Scegli chi ci abita' }}</p>
        </div>
      </div>

      <div class="ar-varianti">
        <section v-for="v in s.varianti" :key="v.id" class="ar-variante" :class="{ 'ar-chiusa': !v.ammessa }" :data-variante="v.id">
          <Ritratto :id="v.id" :lato="60" />
          <h3>{{ v.nome }}</h3>
          <p class="ar-nota-variante">{{ v.nota }}</p>
          <template v-if="v.ammessa">
            <button class="ar-grosso" :class="{ 'ar-spento': !v.puoi }" :disabled="!v.puoi" :data-costruisci="v.id"
                    @click="$emit('costruisci', v.id)">
              <span class="em">🛖</span> {{ v.prezzo }} <span class="em">🪙</span>
            </button>
            <p class="ar-calcolo em">si risolve {{ v.calcolo }}</p>
            <button class="ar-numeri" :data-dettagli="v.id" @click="$emit('dettagli', v.id)">i numeri</button>
          </template>
          <p v-else class="ar-motivo">arriva più avanti</p>
        </section>
      </div>

      <button class="ar-grosso ar-chiaro" @click="$emit('chiudi')">torno in campo</button>
    </div>
  </div>
</template>
