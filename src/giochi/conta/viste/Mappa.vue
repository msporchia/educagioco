<script setup>
// La mappa della campagna, calcata su codice-segreto/viste/Mappa.vue con
// le carte più grandi: qui legge un bambino di quattro anni, cioè spesso
// non legge affatto — icona e lucchetto devono bastare. Nessun gioco
// libero: la campagna è tutto il gioco.
import Ripresa from '../../Ripresa.vue'

defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe: [] }]
  ripresa: { type: Object, default: null },   // la tappa lasciata a metà: { emoji, nome, dettaglio }
  chiede: { type: String, default: '' },      // la tappa nuova che la butterebbe: l'avviso viene prima
})
defineEmits(['gioca', 'riprendi', 'scorda', 'comincia', 'annulla'])
</script>

<template>
  <div class="ct-mappa">
    <Ripresa :ripresa="ripresa" :chiede="chiede"
             @riprendi="$emit('riprendi')" @scorda="$emit('scorda')"
             @comincia="$emit('comincia')" @annulla="$emit('annulla')" />
    <section v-for="s in scalini" :key="s.chiave" class="ct-scalino">
      <h3>
        <span class="em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="ct-tappe">
        <button v-for="t in s.tappe" :key="t.chiave"
                class="ct-tappa" :class="{ 'ct-chiusa': !t.aperta, 'ct-adesso': t.adesso }"
                :style="{ '--ct-accento': t.accento }"
                :data-tappa="t.indice" :disabled="!t.aperta"
                @click="$emit('gioca', t.indice)">
          <span class="ct-faccia em">{{ t.aperta ? t.icona : '🔒' }}</span>
          <span class="ct-testo">
            <b>{{ t.nome }}</b>
            <i>{{ t.aperta ? t.racconto : t.mondoNome }}</i>
          </span>
          <span class="ct-stelle em">{{ t.stelle ? '⭐'.repeat(t.stelle) : `${t.partite} 🐾` }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
