<script setup>
// Il pezzo scelto, nella bottega e nello zaino: il nome del colore del suo gradino, che cos'è, i numeri in elenco
// e, se si indossa, il confronto affiancato con quello che si ha addosso (Confronto.vue: due colonne, una riga per
// abilità). Sotto le righe del momento (`note`) e i tasti, nello slot. I numeri li dà il motore (seLoMetto), le
// parole pezzo.js
import { computed } from 'vue'
import Icona from './Icona.vue'
import Confronto from './Confronto.vue'
import { GRADINI, gradinoDi, tipoDi, numeriDi } from './pezzo.js'
import { PEZZI } from '../dati/atlante.js'

const props = defineProps({
  cosa: { type: Object, required: true },      // COSE[k] con la chiave
  prova: { type: Object, default: null },      // seLoMetto(k): null se non si indossa o è già addosso
  note: { type: Array, default: () => [] },    // [{ testo, em?, tono? ('ambra' | 'tenue' | 'oro') , dato? }]
})

// un anello piccolo cresce fino a riempire il riquadro, una spada lunga ci sta a due
const scala = computed(() => {
  const p = props.cosa.sprite ? PEZZI[props.cosa.sprite] : null
  return p ? Math.max(2, Math.min(4, Math.floor(46 / p[3]))) : 2
})
const gradino = computed(() => GRADINI[gradinoDi(props.cosa)])
const numeri = computed(() => numeriDi(props.cosa))
// col confronto affiancato il pezzo ha già la sua colonna: testa e numeri in elenco direbbero le stesse cose
const affianca = computed(() => !!(props.prova && props.prova.prima && props.prova.cambio))
</script>

<template>
  <div class="sot-pannello" data-pannello :data-cosa="cosa.chiave" :style="{ '--sot-gradino': gradino.colore }">
    <Confronto v-if="affianca" :cosa="cosa" :prova="prova" />
    <template v-else>
      <div class="sot-pannello-testa">
        <span class="sot-pannello-icona"><Icona :sprite="cosa.sprite" :em="cosa.em" :scala="scala" :emAlto="26" /></span>
        <span class="sot-pannello-nome">
          <b>{{ cosa.nome }}</b>
          <i>{{ tipoDi(cosa) }} · {{ gradino.nome }}</i>
        </span>
      </div>
      <ul v-if="numeri.length" class="sot-pannello-numeri">
        <li v-for="(n, i) in numeri" :key="i"><span class="em">{{ n.em }}</span> {{ n.testo }}</li>
      </ul>
    </template>
    <p v-for="(n, i) in note" :key="'n' + i" class="sot-pannello-nota" :class="n.tono ? 'sot-tono-' + n.tono : null"
       v-bind="n.dato ? { [n.dato]: '' } : {}">
      <span v-if="n.em" class="em">{{ n.em }}</span> {{ n.testo }}
    </p>
    <div class="sot-pannello-tasti"><slot /></div>
  </div>
</template>
