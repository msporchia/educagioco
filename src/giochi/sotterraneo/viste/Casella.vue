<script setup>
// Una casella della bottega e dello zaino: il pezzo disegnato, il bordo e l'aura del colore della sua rarità (viste/pezzo.js),
// sotto il prezzo o il nome. Le cose piccole (un anello, il medaglione) si ingrandiscono fino a tre volte, così
// in una casella grande non restano un puntino; le lunghe stanno a due. `vuota`: l'ombra di cosa ci va
import { computed } from 'vue'
import Icona from './Icona.vue'
import { PEZZI } from '../dati/atlante.js'
import { gradinoDi, GRADINI } from './pezzo.js'

const props = defineProps({
  cosa: { type: Object, default: null },     // { sprite, em, nome, prezzo, … } o niente
  vuota: { type: String, default: '' },      // l'emoji in ombra di una casella senza niente
  sotto: { type: String, default: '' },      // la riga sotto: «💎 30», «+💎 15»
  segno: { type: String, default: '' },      // nell'angolo: ✋ non la porti, 🔒 non ancora, «×2» quante ne hai
  piccola: { type: Boolean, default: false },
  scelta: { type: Boolean, default: false },
  accesa: { type: Boolean, default: false },   // dove andrebbe il pezzo guardato
  spenta: { type: Boolean, default: false },   // non te la puoi permettere, o non ancora
  ombra: { type: Boolean, default: false },    // la mano presa dall'arma a due mani
  rosso: { type: Boolean, default: false },    // la riga sotto in rosso (mancano gemme)
})

const alto = computed(() => (props.piccola ? 40 : 62))
const scala = computed(() => {
  const p = props.cosa && props.cosa.sprite ? PEZZI[props.cosa.sprite] : null
  return p ? Math.max(2, Math.min(3, Math.floor(alto.value / p[3]))) : 2
})
const colore = computed(() => (props.cosa && !props.ombra ? GRADINI[gradinoDi(props.cosa)].colore : null))
</script>

<template>
  <button type="button" class="sot-casella"
          :class="[{ 'sot-piccola': piccola, 'sot-scelto': scelta, 'sot-accesa': accesa, 'sot-spenta': spenta,
                     'sot-ombra': ombra, 'sot-vuota': !cosa }, cosa && !ombra ? 'sot-r-' + gradinoDi(cosa) : '']"
          :style="colore ? { '--sot-gradino': colore } : null"
          :data-rarita="cosa && !ombra ? gradinoDi(cosa) : null">
    <span class="sot-casella-dentro">
      <Icona v-if="cosa" :sprite="cosa.sprite" :em="cosa.em" :scala="scala" :emAlto="piccola ? 22 : 28" />
      <b v-else class="em sot-casella-ombra">{{ vuota }}</b>
      <b v-if="segno" class="sot-casella-segno em">{{ segno }}</b>
    </span>
    <span v-if="sotto" class="sot-casella-sotto em" :class="{ 'sot-rosso': rosso }">{{ sotto }}</span>
  </button>
</template>
