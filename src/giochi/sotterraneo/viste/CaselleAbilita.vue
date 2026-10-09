<script setup>
// Le tre caselle delle abilità, nello scontro sopra la domanda (docs/sotterraneo/abilita.md): un tocco prepara
// l'abilità per la prossima risposta giusta, un altro la toglie. Non si apre niente e la domanda resta lì: chi non
// tocca niente attacca come sempre. L'energia non si ripete qui: la dice il globo blu della barra. Non calcola niente:
// riceve dal motore cosa si può usare e perché no.
import Medaglione from './Medaglione.vue'
import Glifo from './Glifo.vue'

defineProps({
  caselle: { type: Array, required: true },   // [{ id, glifo, tinta, nome, costo, pronta, perche } | null]
  energia: { type: Number, required: true },
  energiaMax: { type: Number, required: true },
})
defineEmits(['prepara'])
</script>

<template>
  <div class="sot-abilita" data-caselle-abilita :data-energia="energia">
    <template v-for="(a, i) in caselle" :key="a ? a.id : 'vuota' + i">
      <!-- spenta resta toccabile solo se è pronta (per toglierla): se no dice cosa manca -->
      <button v-if="a" type="button" class="sot-abilita-tasto" :class="{ 'sot-pronta': a.pronta, 'sot-spenta': !!a.perche }"
              data-azione="prepara" :data-abilita="a.id" :data-pronta="a.pronta ? 1 : null" :disabled="!!a.perche && !a.pronta"
              :aria-pressed="a.pronta ? 'true' : 'false'" @click="$emit('prepara', a.id)">
        <Medaglione :glifo="a.glifo" :tinta="a.tinta" :stato="a.perche ? 'chiuso' : 'preso'" :misura="32" />
        <b>{{ a.nome }}</b>
        <small v-if="a.pronta" class="sot-abilita-pronta">pronta</small>
        <small v-else-if="a.perche && a.perche !== 'poca energia'">{{ a.perche }}</small>
        <small v-else :class="{ 'sot-poca': a.perche }"><Glifo nome="energia" :misura="11" /> {{ a.costo }}</small>
      </button>
      <span v-else class="sot-abilita-tasto sot-abilita-vuota" aria-hidden="true"></span>
    </template>
  </div>
</template>
