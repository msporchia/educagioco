<script>
// dove il segnalino si è posato l'ultima volta, per bambino: dura la sessione, non va nel profilo
let ultimo = null      // { chi, mondo, al, dove, verso }: `al` e `dove` sono id (l'indice della tappa, 'senza-fine', un posto della strada)
</script>

<script setup>
/* La mappa della campagna, in due mondi: la valle dei piccoli sul fondale
   dipinto (viste/Valle.vue) e il mondo dello zaino ancora disegnato in
   codice (viste/MondoZaino.vue). Si passa dall'uno all'altro da una tana.
   Qui si decide in che mondo aprire e da dove parte il segnalino; il resto
   lo fa il mondo. Vedi docs/passo-passo/mappa.md. */
import { ref, computed } from 'vue'
import { STRADE } from '../motore/strade.js'
import { quadroValle, nellaValle } from '../scena/valle.js'
import Valle from './Valle.vue'
import MondoZaino from './MondoZaino.vue'

const props = defineProps({
  // per indice: { indice, nome, icona, racconto, stelle, stato: fatta|ora|aperta|chiusa, aMeta, serve, scalino: { icona, nome } }
  voci: { type: Array, required: true },
  senzaFine: { type: Object, required: true },        // { aperto, record, quante, fatte }
  dove: { type: [Number, String], required: true },   // la casella del segnalino: la tappa di adesso, o 'senza-fine'
  chi: { type: String, default: '' },
})
const emit = defineEmits(['gioca', 'senza-fine'])

// cosa sta nella valle: le tappe delle sue isole e i posti del fondale; il resto è dello zaino
const NELLA_VALLE = new Set(quadroValle(STRADE).nodi.map(n => n.id))
const mondoDi = id => (NELLA_VALLE.has(id) ? 'valle' : 'zaino')
const isoleZaino = STRADE.isole.filter(s => !nellaValle(s.chiave))
const tappeZaino = isoleZaino.flatMap(s => s.tappe)

// la tana dello zaino è aperta se lì c'è almeno una tappa aperta; chiusa dice cosa manca alla prima
const zaino = computed(() => {
  const prima = isoleZaino.length ? props.voci[isoleZaino[0].tappe[0]] : null
  return { aperto: tappeZaino.some(i => props.voci[i] && props.voci[i].stato !== 'chiusa'),
           serve: prima ? prima.serve || '' : '' }
})

// si gioca lì: una casella aperta, o un posto della strada della valle
const giocabile = id => {
  if (id === 'senza-fine') return props.senzaFine.aperto
  if (typeof id === 'number') return !!props.voci[id] && props.voci[id].stato !== 'chiusa'
  return mondoDi(id) === 'valle' && !String(id).startsWith('tana:')
}

/* Dove si apre: se la tappa di adesso è cambiata il segnalino parte da
   dov'era e ci va (nello stesso mondo; da un mondo all'altro si ritrova
   sulla tappa); se no si ritrova dove lo si era lasciato, se lì si può
   ancora giocare. */
function apertura() {
  const prima = ultimo && ultimo.chi === props.chi ? ultimo : null
  const md = mondoDi(props.dove)
  if (prima && prima.dove !== props.dove && prima.al !== props.dove && prima.al !== null) {
    if (prima.mondo === md && mondoDi(prima.al) === md) return { mondo: md, partenza: prima.al, meta: props.dove, verso: prima.verso }
    return { mondo: md, partenza: props.dove, verso: prima.verso }
  }
  if (prima && prima.al !== null && mondoDi(prima.al) === prima.mondo && giocabile(prima.al))
    return { mondo: prima.mondo, partenza: prima.al, verso: prima.verso }
  return { mondo: md, partenza: props.dove, verso: prima ? prima.verso : 1 }
}

const stato = ref({ ...apertura(), entrata: false, n: 0 })
function ricorda({ al, verso }) {
  ultimo = { chi: props.chi, mondo: stato.value.mondo, al, dove: props.dove, verso }
}
// dalla tana si passa all'altro mondo: si sbuca dalla tana di là
function passa() {
  const mondo = stato.value.mondo === 'valle' ? 'zaino' : 'valle'
  const partenza = mondo === 'valle' ? 'tana:zaino' : 'tana:valle'
  const verso = (ultimo && ultimo.verso) || 1
  stato.value = { mondo, partenza, meta: null, verso, entrata: true, n: stato.value.n + 1 }
  ultimo = { chi: props.chi, mondo, al: partenza, dove: props.dove, verso }
}
</script>

<template>
  <div class="pp-mappa" data-mappa :data-mondo="stato.mondo">
    <!-- in cima e ferma, la partita lasciata a metà (docs/passo-passo/sosta.md) -->
    <div class="pp-mappa-cima"><slot /></div>

    <Valle v-if="stato.mondo === 'valle'" :key="'valle' + stato.n" :voci="voci" :senza-fine="senzaFine" :zaino="zaino"
           :dove="dove" :partenza="stato.partenza" :meta="stato.meta ?? null" :entrata="stato.entrata" :verso="stato.verso || 1"
           @gioca="i => emit('gioca', i)" @senza-fine="emit('senza-fine')" @passa="passa" @posato="ricorda" />
    <MondoZaino v-else :key="'zaino' + stato.n" :voci="voci" :senza-fine="senzaFine"
                :partenza="stato.partenza" :meta="stato.meta ?? null" :entrata="stato.entrata" :verso="stato.verso || 1"
                @gioca="i => emit('gioca', i)" @passa="passa" @posato="ricorda" />
  </div>
</template>
