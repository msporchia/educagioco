<script setup>
// Mentre si disegna col pennello: la strada e la gomma si scambiano, «Fatto» rimette la barra delle azioni. Il dito sulla mappa
// disegna (scena3d/dito.js); qui si sceglie cosa: il tipo di strada, il bordo, e a che livello si apre ognuno (dati/strade.js).
// Vedi docs/fattoria3d/terreno.md «Le strade: tipi e bordi».
import { computed } from 'vue'
import { TIPI_STRADA, BORDI_STRADA, prezzoStrada } from '../dati/strade.js'
const props = defineProps({ strumento: { type: String, default: 'strada' }, testo: { type: String, default: '' }, pennello: { type: Object, default: () => ({ tipo: 'terra', bordo: 'nessuno' }) }, livello: { type: Number, default: 1 } })
defineEmits(['strumento', 'pennello', 'chiusa', 'fatto'])
const prezzo = computed(() => prezzoStrada(props.pennello.tipo, props.pennello.bordo))
</script>

<template>
  <div class="f3-barra-strade" data-f3="barra-strade">
    <p class="f3-suggerimento">{{ testo || (strumento === 'gomma' ? 'Trascina sulle strade che hai disegnato per toglierle.' : `Trascina il dito sulla mappa per disegnare la strada (🪙 ${prezzo} a pezzo).`) }}</p>
    <template v-if="strumento === 'strada'">
      <div class="f3-scelte" data-f3="strade-tipi">
        <button v-for="(t, id) in TIPI_STRADA" :key="id" :class="{ acceso: pennello.tipo === id, chiuso: livello < t.liv }" :data-tipo="id"
          @click="livello < t.liv ? $emit('chiusa', t.liv) : $emit('pennello', { tipo: id })">
          <i :style="{ background: t.colore }"></i><small>{{ livello < t.liv ? `🔒 ${t.liv}` : t.nome }}</small><b>🪙 {{ t.prezzo }}</b>
        </button>
      </div>
      <div class="f3-scelte" data-f3="strade-bordi">
        <button v-for="(b, id) in BORDI_STRADA" :key="id" :class="{ acceso: pennello.bordo === id, chiuso: livello < b.liv }" :data-bordo="id"
          @click="livello < b.liv ? $emit('chiusa', b.liv) : $emit('pennello', { bordo: id })">
          <i class="bordo" :style="{ borderColor: b.colore }"></i><small>{{ livello < b.liv ? `🔒 ${b.liv}` : b.nome }}</small><b>{{ b.prezzo ? `+🪙 ${b.prezzo}` : 'gratis' }}</b>
        </button>
      </div>
    </template>
    <div class="f3-strumenti">
      <button :class="{ acceso: strumento === 'strada' }" data-strumento="strada" @click="$emit('strumento', 'strada')"><span>🛣️</span><small>Strada</small></button>
      <button :class="{ acceso: strumento === 'gomma' }" data-strumento="gomma" @click="$emit('strumento', 'gomma')"><span>🧽</span><small>Gomma</small></button>
      <button class="fatto" data-f3="strade-fatto" @click="$emit('fatto')"><span>✓</span><small>Fatto</small></button>
    </div>
  </div>
</template>
