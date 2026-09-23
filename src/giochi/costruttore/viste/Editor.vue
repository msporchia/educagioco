<script setup>
/* ═══════════════════════════════════════════════════════════════════
   L'EDITOR — il programma, a schede

   Una scheda per la fila principale e una per ogni progetto: un
   progetto è un pezzo di programma con un nome e le sue misure, e si
   scrive nella sua scheda come la principale. Mentre il programma gira
   la scheda segue il robot: quando entra in «colonna» si apre la carta
   di colonna, con le misure di **quella** chiamata scritte sopra
   («alta 3») — è la pila delle chiamate, fatta vedere invece che
   spiegata.

   Tutto quello che succede qui si dice a chi coordina (`emit`): le
   righe, attraverso `Righe.vue`, lo chiedono all'editore che questo
   componente mette a disposizione (provide/inject), così una riga
   dentro tre blocchi non deve rimandare gli eventi su per tre livelli.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, provide } from 'vue'
import { nomiLeggibili } from '../motore/modifica.js'
import Righe from './Righe.vue'

const props = defineProps({
  programma: { type: Object, required: true },
  livello: { type: Object, required: true },
  tab: { type: String, default: null },          // la scheda aperta: null = principale
  sel: { type: String, default: null },
  aperta: { type: Object, default: null },       // { id, campo, tipo }
  accesa: { type: String, default: null },
  guasto: { type: String, default: null },
  problemi: { type: Object, default: () => new Set() },
  giro: { type: Object, default: null },
  sola: { type: Boolean, default: false },       // il programma gira: si guarda e basta
  pila: { type: Array, default: () => [] },
})
const emit = defineEmits(['tab', 'seleziona', 'apri', 'imposta', 'aggiungi', 'azione',
                          'nuova-lavagnetta', 'progetto', 'ricomincia', 'codice'])

const progetti = computed(() => props.programma.progetti || [])
const attivo = computed(() => progetti.value.find(p => p.id === props.tab) || null)
const righe = computed(() => (attivo.value ? attivo.value.corpo : props.programma.principale))
const conProgetti = computed(() => (props.livello.cassetta || []).includes('progetti'))
/* le lavagnette dell'ordine, coi loro valori: dalla specie (numero o
   colore) si sa in quali caselle offrirle */
const lavagnetteOrdine = computed(() => props.livello.ordini[0].lavagnette || {})

provide('editore', {
  programma: computed(() => props.programma),
  sel: computed(() => props.sel),
  aperta: computed(() => props.aperta),
  accesa: computed(() => props.accesa),
  guasto: computed(() => props.guasto),
  problemi: computed(() => props.problemi),
  giro: computed(() => props.giro),
  sola: computed(() => props.sola),
  contesto: computed(() => {
    const nomi = nomiLeggibili(props.programma, props.tab, lavagnetteOrdine.value)
    return {
      colori: props.livello.colori,
      nomi,
      confronta: nomi.misure.length + nomi.lavagnette.length + nomi.ordine.length > 0,
    }
  }),
  seleziona: id => emit('seleziona', id),
  apri: (id, campo, tipo) => emit('apri', id ? { id, campo, tipo } : null),
  imposta: (id, campo, valore) => emit('imposta', { id, campo, valore }),
  aggiungi: posto => emit('aggiungi', posto),
  azione: (tipo, id) => emit('azione', { tipo, id }),
  nuovaLavagnetta: id => emit('nuova-lavagnetta', id),
})

const misureDi = p => (p.misure || []).length ? `(${p.misure.join(', ')})` : ''
/* la carta aperta in cima alla pila, se è di questo progetto: le sue
   misure si scrivono sulla scheda coi valori di **questa** chiamata */
const inCima = computed(() => props.pila.length ? props.pila[props.pila.length - 1] : null)
const valoriDi = p => (inCima.value && inCima.value.progetto === p.id ? inCima.value.misure : null)
</script>

<template>
  <section class="cst-editor" data-editor>
    <div class="cst-testa-editor">
    <!-- la pila delle carte aperte, mentre gira o dove si è fermato -->
    <div v-if="pila.length" class="cst-pila" data-pila>
      <span>principale</span>
      <template v-for="(c, k) in pila" :key="k">
        <span class="cst-sep">›</span>
        <span class="cst-carta-pila">
          {{ (progetti.find(p => p.id === c.progetto) || {}).icona }}
          {{ (progetti.find(p => p.id === c.progetto) || {}).nome }}
          <i v-for="(v, m) in c.misure" :key="m">{{ m }} {{ v }}</i>
        </span>
      </template>
    </div>

    <nav class="cst-schede">
      <button type="button" class="cst-scheda" :class="{ 'cst-su': !tab }" data-scheda="principale"
              @click="emit('tab', null)">▶ principale</button>
      <button v-for="p in progetti" :key="p.id" type="button" class="cst-scheda"
              :class="{ 'cst-su': tab === p.id }" :data-scheda="p.id" @click="emit('tab', p.id)">
        {{ p.icona }} {{ p.nome }}
        <small v-if="!valoriDi(p)">{{ misureDi(p) }}</small>
        <i v-for="(v, m) in valoriDi(p) || {}" v-else :key="m" class="cst-valore-misura">{{ m }} {{ v }}</i>
      </button>
      <button v-if="conProgetti && !sola" type="button" class="cst-scheda cst-nuovo" data-azione="nuovo-progetto"
              @click="emit('progetto', null)">＋ progetto</button>
    </nav>
    </div>

    <div class="cst-foglio-programma" :class="{ 'cst-gira': sola }">
      <div v-if="attivo" class="cst-testa-progetto">
        <span class="cst-ico">{{ attivo.icona }}</span>
        <b>progetto {{ attivo.nome }}</b>
        <span v-if="attivo.misure.length" class="cst-misure">misure: <i v-for="m in attivo.misure" :key="m">{{ m }}</i></span>
        <button v-if="!sola" type="button" class="cst-matita" data-azione="modifica-progetto" aria-label="modifica il progetto"
                @click="emit('progetto', attivo.id)">✎</button>
      </div>
      <p v-if="!righe.length && !sola" class="cst-vuoto">
        {{ attivo ? 'Il progetto è vuoto: scrivici dentro come si costruisce.' : 'Il programma è vuoto: tocca «＋ aggiungi».' }}
      </p>
      <Righe :righe="righe" :dove="{ progetto: tab, dentro: null, ramo: 'corpo' }" />
      <div v-if="!sola" class="cst-piede-editor">
        <button type="button" class="cst-ricomincia" data-azione="codice" @click="emit('codice')">🐍 com'è in Python</button>
        <button type="button" class="cst-ricomincia" data-azione="ricomincia" @click="emit('ricomincia')">↺ ricomincia da capo</button>
      </div>
    </div>
  </section>
</template>
