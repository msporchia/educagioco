<script setup>
// La scelta del colpo, nello scontro sopra la domanda (docs/sotterraneo/abilita.md): «Attacco» è sempre la prima riga e
// parte già scelto; sotto, le abilità che si portano, ognuna con quello che fa. Un tocco sceglie, e la scelta parte
// con la prossima risposta giusta; toccare di nuovo la stessa (o «Attacco») torna al colpo solito. Dopo l'uso si torna su
// «Attacco». L'energia non si ripete qui: la dice il globo blu della barra. Non calcola niente: riceve dal motore cosa
// si può usare e perché no.
import Medaglione from './Medaglione.vue'
import Glifo from './Glifo.vue'

defineProps({
  caselle: { type: Array, required: true },   // [{ id, glifo, tinta, nome, costo, dice, pronta, perche } | null]
  colpo: { type: Number, default: 0 },        // il danno del colpo solito, per la riga di «Attacco»
  energia: { type: Number, required: true },
  energiaMax: { type: Number, required: true },
})
defineEmits(['prepara'])
</script>

<template>
  <div class="sot-abilita" data-caselle-abilita :data-energia="energia" role="radiogroup">
    <button type="button" class="sot-scelta" :class="{ 'sot-pronta': !caselle.some(a => a && a.pronta) }"
            data-azione="attacco" :data-pronta="caselle.some(a => a && a.pronta) ? null : 1"
            :aria-pressed="caselle.some(a => a && a.pronta) ? 'false' : 'true'" @click="$emit('prepara', null)">
      <span class="sot-scelta-icona"><Glifo nome="spada" :misura="22" /></span>
      <span class="sot-scelta-testo"><b>Attacco</b><small>fai {{ colpo }} di danno</small></span>
      <span class="sot-scelta-costo">gratis</span>
    </button>
    <template v-for="(a, i) in caselle" :key="a ? a.id : 'vuota' + i">
      <!-- spenta resta toccabile solo se è scelta (per toglierla): se no dice cosa manca -->
      <button v-if="a" type="button" class="sot-scelta" :class="{ 'sot-pronta': a.pronta, 'sot-spenta': !!a.perche }"
              data-azione="prepara" :data-abilita="a.id" :data-pronta="a.pronta ? 1 : null" :disabled="!!a.perche && !a.pronta"
              :aria-pressed="a.pronta ? 'true' : 'false'" @click="$emit('prepara', a.id)">
        <Medaglione :glifo="a.glifo" :tinta="a.tinta" :stato="a.perche ? 'chiuso' : 'preso'" :misura="28" />
        <span class="sot-scelta-testo"><b>{{ a.nome }}</b><small>{{ a.perche && a.perche !== 'poca energia' ? a.perche : a.dice }}</small></span>
        <span class="sot-scelta-costo" :class="{ 'sot-poca': a.perche === 'poca energia' }"><Glifo nome="energia" :misura="11" /> {{ a.costo }}</span>
      </button>
    </template>
  </div>
</template>
