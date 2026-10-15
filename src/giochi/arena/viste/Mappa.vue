<script setup>
// La mappa della campagna: in cima la battaglia infinita, poi quattro scalini e dodici tappe;
// riceve tutto già deciso. La partita lasciata a metà sta in cima: toccare un'altra tappa
// avverte invece di buttarla via in silenzio, perché il dito di un bambino
// sulla mappa ci finisce comunque.
import { ref } from 'vue'
import { riprendiSeChiesta } from '../../ripresa.js'
import Ripresa from '../../Ripresa.vue'

const props = defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe: [] }]
  ripresa: { type: Object, default: null },   // { emoji, nome, dettaglio }
  infinita: { type: Object, default: null },  // { nome, icona, racconto, aperta, motivo }
})
const emit = defineEmits(['gioca', 'riprendi', 'scorda'])
riprendiSeChiesta(() => props.ripresa, () => emit('riprendi'))

const chiede = ref(null)   // quale partita si sta per cominciare avendone una in sospeso
function tocca(t) {
  if (!props.ripresa) return emit('gioca', t.indice)
  chiede.value = t
}
const INFINITA = 'infinita'   // la battaglia infinita non ha un indice: Gioco.vue la riconosce da questo
function toccaInfinita() {
  if (!props.ripresa) return emit('gioca', INFINITA)
  chiede.value = { nome: props.infinita.nome, indice: INFINITA }
}
function vai() {
  const t = chiede.value
  chiede.value = null
  emit('gioca', t.indice)
}
</script>

<template>
  <div class="ar-mappa">
    <Ripresa :ripresa="ripresa" :chiede="chiede ? chiede.nome : ''"
             @riprendi="chiede = null; emit('riprendi')" @scorda="emit('scorda')"
             @comincia="vai" @annulla="chiede = null" />

    <!-- la battaglia infinita: senza timer, nemico al massimo, un terreno diverso a ogni volta -->
    <section v-if="infinita" class="ar-scalino">
      <div class="ar-tappe">
        <button class="ar-tappa tappa ar-infinita" :class="{ 'ar-chiusa': !infinita.aperta }" data-infinita
                :disabled="!infinita.aperta" @click="toccaInfinita">
          <span class="ar-faccia em">{{ infinita.aperta ? infinita.icona : '🔒' }}</span>
          <span class="ar-testo">
            <b>{{ infinita.nome }}</b>
            <i>{{ infinita.aperta ? infinita.racconto : infinita.motivo }}</i>
          </span>
        </button>
      </div>
    </section>

    <section v-for="s in scalini" :key="s.chiave" class="ar-scalino">
      <h3>
        <span class="em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="ar-tappe">
        <button v-for="t in s.tappe" :key="t.chiave" class="ar-tappa tappa"
                :class="{ 'ar-chiusa': !t.aperta, 'ar-adesso': t.adesso }"
                :data-tappa="t.indice" :disabled="!t.aperta" @click="tocca(t)">
          <span class="ar-faccia em">{{ t.aperta ? s.icona : '🔒' }}</span>
          <span class="ar-testo">
            <b>{{ t.nome }}</b>
            <i>{{ t.aperta ? t.racconto : s.nome }}</i>
          </span>
          <span class="ar-stelle em">
            <template v-if="t.stelle">{{ '⭐'.repeat(t.stelle) }}</template>
            <template v-else>{{ t.operazioni.join(' ') }}</template>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>
