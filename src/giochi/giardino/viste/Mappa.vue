<script setup>
// La mappa della campagna: tre scalini, nove tappe, riceve tutto già deciso.
// La partita lasciata a metà sta in cima: toccare un'altra tappa avverte invece
// di buttarla via in silenzio. Stessa struttura di quella di Castle Battle.
import { ref } from 'vue'
import { riprendiSeChiesta } from '../../ripresa.js'
import Ripresa from '../../Ripresa.vue'
import AmiciQui from '../../../components/amici/AmiciQui.vue'

const props = defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe: [] }]
  ripresa: { type: Object, default: null },   // { emoji, nome, dettaglio }
  davanti: { type: String, default: '' },     // l'amico da raggiungere, in parole (docs/core/amici-nei-giochi.md)
})
const emit = defineEmits(['gioca', 'riprendi', 'scorda'])
riprendiSeChiesta(() => props.ripresa, () => emit('riprendi'))

const chiede = ref(null)   // quale partita si sta per cominciare avendone una in sospeso
function tocca(t) {
  if (!props.ripresa) return emit('gioca', t.indice)
  chiede.value = t
}
function vai() {
  const t = chiede.value
  chiede.value = null
  emit('gioca', t.indice)
}
</script>

<template>
  <div class="gi-mappa">
    <Ripresa :ripresa="ripresa" :chiede="chiede ? chiede.nome : ''"
             @riprendi="chiede = null; emit('riprendi')" @scorda="emit('scorda')"
             @comincia="vai" @annulla="chiede = null" />

    <p v-if="davanti" class="gi-davanti" data-amico-davanti>{{ davanti }}</p>

    <section v-for="s in scalini" :key="s.chiave" class="gi-scalino">
      <h3>
        <span class="em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="gi-tappe">
        <button v-for="t in s.tappe" :key="t.chiave" class="gi-tappa tappa"
                :class="{ 'gi-chiusa': !t.aperta, 'gi-adesso': t.adesso }"
                :data-tappa="t.indice" :disabled="!t.aperta" @click="tocca(t)">
          <span class="gi-faccia em">{{ t.aperta ? s.icona : '🔒' }}</span>
          <span class="gi-testo">
            <b>{{ t.nome }}</b>
            <i>{{ t.aperta ? t.racconto : s.nome }}</i>
            <AmiciQui :amici="t.amici" class="gi-qui" :data-al="t.indice" />
          </span>
          <span class="gi-stelle em">
            <template v-if="t.stelle">{{ '⭐'.repeat(t.stelle) }}</template>
            <template v-else>{{ t.carte }}</template>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>
