<script setup>
// La scelta degli incantesimi da preparare, dalla loro casella nella barra (docs/sotterraneo/orologio.md): le abilità che proteggono si
// lanciano anche fuori dallo scontro, pagando l'energia di sempre, e restano addosso per un po' di passi; lo scontro comincia con loro
// già attive. Il mana speso adesso non c'è dopo. Un tocco lancia; in fondo il tasto dell'albero (con il «+» d'oro dei punti da
// imparare). Non calcola niente: le voci e i perché le dà la corsa (motore/preparati.js). La casella c'è sempre: se l'eroe non ne sa nessuno
// (`voci` vuote) lo dice e porta all'albero, e sopra (`sopra`) dice che si preparano laggiù. Si chiude con la ✕ o toccando fuori
// (docs/core/interfaccia.md). Per i primi 320 ms i tasti non sentono il tocco (il click che il dito lascia dietro alla casella).
import { ref, onMounted, onUnmounted } from 'vue'
import { CIECA } from '../../pausa.js'
import Cornice from './Cornice.vue'
import Medaglione from './Medaglione.vue'
import Glifo from './Glifo.vue'

defineProps({
  voci: { type: Array, required: true },       // [{ id, nome, glifo, tinta, costo, dice, perche, passi }]: passi > 0 se ce l'hai addosso
  energia: { type: Number, default: 0 },
  energiaMax: { type: Number, default: 10 },
  puntiAbilita: { type: Number, default: 0 },  // i punti dell'albero da dare: un «+» sul tasto dell'albero
  sopra: { type: Boolean, default: false },   // sulla terra di sopra non si prepara niente: la finestra lo spiega
})
const emit = defineEmits(['prepara', 'albero', 'chiudi', 'fuori'])

// l'energia che non basta si dice come nello scontro (viste/CaselleAbilita.vue)
const DETTO = { 'poca energia': 'ti manca energia', 'serve più energia': 'ti serve più energia (intelligenza)' }

const pronto = ref(false)
let cieca = 0
onMounted(() => { cieca = setTimeout(() => { pronto.value = true }, CIECA) })
onUnmounted(() => clearTimeout(cieca))
const vai = (che, ...a) => { if (pronto.value) emit(che, ...a) }
</script>

<template>
  <Cornice data-preparati :data-pronto="pronto || null" :data-energia="energia" @chiudi="$emit('chiudi')" @fuori="e => $emit('fuori', e)">
    <h2 class="sot-prep-titolo">Prepara un incantesimo</h2>
    <p v-if="sopra" class="sot-prep-dida" data-prep-sopra>
      Gli incantesimi si preparano giù, nel sotterraneo: li lanci prima di uno scontro e restano addosso per qualche passo.
      Al villaggio non servirebbero a niente.
    </p>
    <p v-else-if="!voci.length" class="sot-prep-dida" data-prep-nessuno>
      Non sai ancora nessun incantesimo da preparare. Nell'albero delle abilità ce ne sono: le protezioni e quelli che indeboliscono
      si lanciano anche prima dello scontro e restano addosso per qualche passo.
    </p>
    <p v-else class="sot-prep-dida">
      Lo lanci adesso e resta addosso per qualche passo: se incontri dei mostri, lo scontro comincia già protetto.
      Ma l'energia che spendi adesso non c'è più dopo.
      <span class="sot-albero-energia" data-energia-preparati><Glifo nome="energia" :misura="14" /> {{ energia }}/{{ energiaMax }}</span>
    </p>
    <div v-if="!sopra && voci.length" class="sot-prep-elenco">
      <button v-for="v in voci" :key="v.id" type="button" class="sot-scelta" :class="{ 'sot-spenta': !!v.perche, 'sot-pronta': v.passi > 0 }"
              data-azione="prepara-campo" :data-abilita="v.id" :data-addosso="v.passi || null" :disabled="!!v.perche" @click="vai('prepara', v.id)">
        <Medaglione :glifo="v.glifo" :tinta="v.tinta" :stato="v.perche && !v.passi ? 'chiuso' : 'preso'" :misura="34" />
        <span class="sot-scelta-testo">
          <b>{{ v.nome }}<em v-if="v.passi" class="sot-prep-addosso" data-passi-addosso> · addosso: {{ v.passi }} passi</em></b>
          <small>{{ v.perche && !v.passi ? (DETTO[v.perche] || v.perche) : v.dice }}</small>
        </span>
        <span class="sot-scelta-costo" :class="{ 'sot-poca': !!DETTO[v.perche] }"><Glifo nome="energia" :misura="11" /> {{ v.costo }}</span>
      </button>
    </div>
    <button type="button" class="sot-grosso sot-chiaro sot-prep-albero" data-azione="apri-albero" @click="vai('albero')">
      L'albero delle abilità
      <i v-if="puntiAbilita" class="sot-punti sot-punti-piccolo" data-punti-albero aria-hidden="true">+</i>
    </button>
  </Cornice>
</template>
