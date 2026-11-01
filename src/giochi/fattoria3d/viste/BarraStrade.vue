<script setup>
// Mentre si disegna col pennello: la strada, la staccionata, il cancello e la gomma si scambiano, «Fatto» rimette la barra delle azioni. Il dito sulla mappa
// disegna (scena3d/dito.js); qui si sceglie cosa: il tipo di strada e il bordo (dati/strade.js), il tipo di staccionata (dati/staccionate.js), e a che livello si apre ognuno.
// Vedi docs/fattoria3d/terreno.md «Le strade: tipi e bordi» e docs/fattoria3d/staccionate.md.
import { computed } from 'vue'
import { TIPI_STRADA, BORDI_STRADA, prezzoStrada } from '../dati/strade.js'
import { TIPI_STACCIONATA, PREZZO_CANCELLO } from '../dati/staccionate.js'
const props = defineProps({ strumento: { type: String, default: 'strada' }, testo: { type: String, default: '' }, pennello: { type: Object, default: () => ({ tipo: 'terra', bordo: 'nessuno', staccionata: 'legno' }) }, livello: { type: Number, default: 1 } })
defineEmits(['strumento', 'pennello', 'chiusa', 'fatto'])
const prezzo = computed(() => prezzoStrada(props.pennello.tipo, props.pennello.bordo))
const suggerimento = computed(() => ({
  gomma: 'Trascina su una staccionata o una strada tua per toglierla.',
  cancello: `Tocca un pezzo di staccionata per farne un cancello (🪙 ${PREZZO_CANCELLO}): ci passi tu, il resto no.`,
  staccionata: `Trascina il dito per fare la staccionata (🪙 ${TIPI_STACCIONATA[props.pennello.staccionata]?.prezzo ?? 2} a pezzo). Se chiude il passo, l'ultimo pezzo è un cancello.`,
}[props.strumento] || `Trascina il dito sulla mappa per disegnare la strada (🪙 ${prezzo.value} a pezzo).`))
</script>

<template>
  <div class="f3-barra-strade" data-f3="barra-strade">
    <p class="f3-suggerimento">{{ testo || suggerimento }}</p>
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
    <div v-else-if="strumento === 'staccionata'" class="f3-scelte" data-f3="staccionate-tipi">
      <button v-for="(t, id) in TIPI_STACCIONATA" :key="id" :class="{ acceso: pennello.staccionata === id, chiuso: livello < t.liv }" :data-staccionata="id"
        @click="livello < t.liv ? $emit('chiusa', t.liv) : $emit('pennello', { staccionata: id })">
        <i :style="{ background: t.colore }"></i><small>{{ livello < t.liv ? `🔒 ${t.liv}` : t.nome }}</small><b>🪙 {{ t.prezzo }}</b>
      </button>
    </div>
    <div class="f3-strumenti">
      <button :class="{ acceso: strumento === 'strada' }" data-strumento="strada" @click="$emit('strumento', 'strada')"><span>🛣️</span><small>Strada</small></button>
      <button :class="{ acceso: strumento === 'staccionata' }" data-strumento="staccionata" @click="$emit('strumento', 'staccionata')"><span>🚧</span><small>Staccionata</small></button>
      <button :class="{ acceso: strumento === 'cancello' }" data-strumento="cancello" @click="$emit('strumento', 'cancello')"><span>🚪</span><small>Cancello</small></button>
      <button :class="{ acceso: strumento === 'gomma' }" data-strumento="gomma" @click="$emit('strumento', 'gomma')"><span>🧽</span><small>Gomma</small></button>
      <button class="fatto" data-f3="strade-fatto" @click="$emit('fatto')"><span>✓</span><small>Fatto</small></button>
    </div>
  </div>
</template>
