<script setup>
// L'eroe armato con le caselle intorno, come il cerchio dei giochi di ruolo in piccolo: a sinistra lo scudo, il corpo e la
// collana, a destra l'arma e i due anelli, sopra la testa il copricapo (docs/sotterraneo/elmo.md). Serve alla bottega e allo zaino; toccare una casella la sceglie, e il pannello dice cosa c'è. `va`: la
// casella dove andrebbe il pezzo guardato, che si accende
import { computed } from 'vue'
import Armato from './Armato.vue'
import Casella from './Casella.vue'

const props = defineProps({
  eroe: { type: Object, required: true },     // la scheda: sprite, em
  mano: { type: Object, default: null },      // { chiave, sprite, em, nome, prezzo, mani } o niente
  mancina: { type: Object, default: null },
  corpo: { type: Object, default: null },
  collo: { type: Object, default: null },
  dito: { type: Object, default: null },
  dito2: { type: Object, default: null },
  testa: { type: Object, default: null },
  conTesta: { type: Boolean, default: false },   // la casella del copricapo anche vuota (il 3D)
  scelto: { type: String, default: null },    // la casella scelta
  va: { type: String, default: null },
})
defineEmits(['tocca'])

// dove la casella è vuota, l'ombra di cosa ci va: una casella bianca non dice che lì ci sta uno scudo
const POSTI = [
  { dove: 'mancina', ombra: '🛡️', dice: 'scudo' },
  { dove: 'mano', ombra: '⚔️', dice: 'arma' },
  { dove: 'corpo', ombra: '🦺', dice: 'armatura' },
  { dove: 'collo', ombra: '📿', dice: 'collana' },
  { dove: 'dito', ombra: '💍', dice: 'anello' },
  { dove: 'dito2', ombra: '💍', dice: 'anello' },
]
const TESTA = { dove: 'testa', ombra: '🪖', dice: 'copricapo' }
const conLaTesta = computed(() => props.conTesta || !!props.testa)
const su = dove => props[dove]
// l'arma a due mani tiene anche la sinistra: la stessa arma, in ombra
const dueMani = computed(() => !!(props.mano && props.mano.mani === 2))
const ombra = dove => dove === 'mancina' && dueMani.value
</script>

<template>
  <div class="sot-intorno">
    <div class="sot-intorno-lato">
      <template v-for="p in POSTI.filter(x => x.dove === 'mancina' || x.dove === 'corpo' || x.dove === 'collo')" :key="p.dove">
        <Casella :cosa="ombra(p.dove) ? mano : su(p.dove)" :vuota="p.ombra" piccola :ombra="ombra(p.dove)"
                 :scelta="scelto === p.dove" :accesa="va === p.dove" :disabled="ombra(p.dove)"
                 :data-casella="p.dove" :data-cosa="su(p.dove) ? su(p.dove).chiave : null" :aria-label="su(p.dove) ? su(p.dove).nome : p.dice" @click="$emit('tocca', p.dove)" />
      </template>
    </div>
    <div class="sot-intorno-eroe" :class="{ 'sot-con-testa': conLaTesta }">
      <Casella v-if="conLaTesta" class="sot-intorno-testa" :cosa="testa" :vuota="TESTA.ombra" piccola
               :scelta="scelto === 'testa'" :accesa="va === 'testa'"
               data-casella="testa" :data-cosa="testa ? testa.chiave : null" :aria-label="testa ? testa.nome : TESTA.dice" @click="$emit('tocca', 'testa')" />
      <Armato :eroe="eroe" :mano="mano ? mano.chiave : null" :mancina="mancina ? mancina.chiave : null" :corpo="corpo ? corpo.chiave : null"
              :testa="testa ? testa.chiave : null" :scala="3" />
    </div>
    <div class="sot-intorno-lato">
      <template v-for="p in POSTI.filter(x => x.dove === 'mano' || x.dove === 'dito' || x.dove === 'dito2')" :key="p.dove">
        <Casella :cosa="su(p.dove)" :vuota="p.ombra" piccola
                 :scelta="scelto === p.dove" :accesa="va === p.dove"
                 :data-casella="p.dove" :data-cosa="su(p.dove) ? su(p.dove).chiave : null" :aria-label="su(p.dove) ? su(p.dove).nome : p.dice" @click="$emit('tocca', p.dove)" />
      </template>
    </div>
    <div class="sot-intorno-numeri"><slot /></div>
  </div>
</template>
