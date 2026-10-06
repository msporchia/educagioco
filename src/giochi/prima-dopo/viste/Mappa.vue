<script setup>
import Ripresa from '../../Ripresa.vue'
// La mappa della campagna, calcata su codice-segreto/viste/Mappa.vue con
// le carte più grandi: qui legge un bambino di quattro anni. Riceve
// tutto già deciso (aperto, chiuso per età, stelle, colore).
defineProps({
  scalini: { type: Array, required: true },   // [{ chiave, nome, icona, dritta, tappe: [] }]
  ripresa: { type: Object, default: null },   // la tappa lasciata a metà: docs/prima-dopo/sosta.md
  chiede: { type: String, default: '' },      // la tappa che si sta per cominciare, se ce n'è una a metà
})
defineEmits(['gioca', 'riprendi', 'scorda', 'comincia', 'annulla'])
</script>

<template>
  <div class="pd-mappa">
    <Ripresa :ripresa="ripresa" :chiede="chiede"
             @riprendi="$emit('riprendi')" @scorda="$emit('scorda')"
             @comincia="$emit('comincia')" @annulla="$emit('annulla')" />
    <section v-for="s in scalini" :key="s.chiave" class="pd-scalino">
      <h3>
        <span class="em">{{ s.icona }}</span>
        <b>{{ s.nome }}</b>
        <i>{{ s.dritta }}</i>
      </h3>
      <div class="pd-tappe">
        <button v-for="t in s.tappe" :key="t.chiave"
                class="pd-tappa" :class="{ 'pd-chiusa': !t.aperta, 'pd-adesso': t.adesso }"
                :style="{ '--pd-accento': t.accento }"
                :data-tappa="t.indice" :disabled="!t.aperta"
                @click="$emit('gioca', t.indice)">
          <span class="pd-faccia em">{{ t.aperta ? t.icona : '🔒' }}</span>
          <span class="pd-testo">
            <b>{{ t.nome }}</b>
            <!-- chiusa per età non si scrive niente: per questo bambino il gioco finisce lì -->
            <i v-if="t.aperta">{{ t.racconto }}</i>
            <i v-else-if="!t.perEta">continua per aprirla</i>
          </span>
          <span class="pd-stelle em">{{ t.stelle ? '⭐'.repeat(t.stelle) : `${t.quante} 📖` }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
