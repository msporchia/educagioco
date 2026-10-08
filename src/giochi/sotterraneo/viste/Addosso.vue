<script setup>
// L'eroe armato con le quattro caselle intorno, come il cerchio dei giochi di ruolo in piccolo: le mani in alto
// (la debole a sinistra), il corpo e il dito sotto. Serve alla bottega e allo zaino; toccare una casella la
// sceglie, e il pannello dice cosa c'è. `va`: la casella dove andrebbe il pezzo guardato, che si accende
import { computed } from 'vue'
import Armato from './Armato.vue'
import Casella from './Casella.vue'

const props = defineProps({
  eroe: { type: Object, required: true },     // la scheda: sprite, em
  mano: { type: Object, default: null },      // { chiave, sprite, em, nome, prezzo, mani } o niente
  mancina: { type: Object, default: null },
  corpo: { type: Object, default: null },
  dito: { type: Object, default: null },
  scelto: { type: String, default: null },    // la casella scelta
  va: { type: String, default: null },
})
defineEmits(['tocca'])

// dove la casella è vuota, l'ombra di cosa ci va: una casella bianca non dice che lì ci sta uno scudo
const POSTI = [
  { dove: 'mancina', ombra: '🛡️', dice: 'scudo' },
  { dove: 'mano', ombra: '⚔️', dice: 'arma' },
  { dove: 'corpo', ombra: '🦺', dice: 'armatura' },
  { dove: 'dito', ombra: '💍', dice: 'gioiello' },
]
const su = dove => props[dove]
// l'arma a due mani tiene anche la sinistra: la stessa arma, in ombra
const dueMani = computed(() => !!(props.mano && props.mano.mani === 2))
const ombra = dove => dove === 'mancina' && dueMani.value
</script>

<template>
  <div class="sot-intorno">
    <div class="sot-intorno-lato">
      <template v-for="p in POSTI.filter(x => x.dove === 'mancina' || x.dove === 'corpo')" :key="p.dove">
        <Casella :cosa="ombra(p.dove) ? mano : su(p.dove)" :vuota="p.ombra" piccola :ombra="ombra(p.dove)"
                 :scelta="scelto === p.dove" :accesa="va === p.dove" :disabled="ombra(p.dove)"
                 :data-casella="p.dove" :data-cosa="su(p.dove) ? su(p.dove).chiave : null" :aria-label="su(p.dove) ? su(p.dove).nome : p.dice" @click="$emit('tocca', p.dove)" />
      </template>
    </div>
    <div class="sot-intorno-eroe">
      <Armato :eroe="eroe" :mano="mano ? mano.chiave : null" :mancina="mancina ? mancina.chiave : null" :scala="3" />
    </div>
    <div class="sot-intorno-lato">
      <template v-for="p in POSTI.filter(x => x.dove === 'mano' || x.dove === 'dito')" :key="p.dove">
        <Casella :cosa="su(p.dove)" :vuota="p.ombra" piccola
                 :scelta="scelto === p.dove" :accesa="va === p.dove"
                 :data-casella="p.dove" :data-cosa="su(p.dove) ? su(p.dove).chiave : null" :aria-label="su(p.dove) ? su(p.dove).nome : p.dice" @click="$emit('tocca', p.dove)" />
      </template>
    </div>
    <div class="sot-intorno-numeri"><slot /></div>
  </div>
</template>
