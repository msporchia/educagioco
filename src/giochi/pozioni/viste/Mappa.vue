<script setup>
// La mappa: un blocco per famiglia, e il calderone in fondo. Riceve
// tutto già deciso; qui si sceglie dove andare e basta. In cima, se c'è,
// la tappa lasciata a metà (docs/pozioni/sosta.md).
import Ripresa from '../../Ripresa.vue'
import AmiciQui from '../../../components/amici/AmiciQui.vue'

defineProps({
  blocchi: { type: Array, required: true },   // [{ chiave, nome, emoji, dritta, tappe: [] }]
  ripresa: { type: Object, default: null },   // { emoji, nome, dettaglio }
  chiede: { type: String, default: '' },      // la tappa che si sta per cominciare
  davanti: { type: String, default: '' },     // l'amico da raggiungere, in parole (docs/core/amici-nei-giochi.md)
})
defineEmits(['gioca', 'riprendi', 'scorda', 'comincia', 'annulla'])
</script>

<template>
  <div class="pz-mappa">
    <Ripresa :ripresa="ripresa" :chiede="chiede"
             @riprendi="$emit('riprendi')" @scorda="$emit('scorda')"
             @comincia="$emit('comincia')" @annulla="$emit('annulla')" />
    <p v-if="davanti" class="pz-davanti" data-amico-davanti>{{ davanti }}</p>
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
            <AmiciQui :amici="t.amici" class="pz-qui" :data-al="t.indice" />
          </span>
          <span class="pz-stelle em">{{ !t.aperta ? '🔒' : t.stelle ? '⭐'.repeat(t.stelle) : '▶' }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
