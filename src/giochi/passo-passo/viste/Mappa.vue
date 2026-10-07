<script>
// dove il segnalino si è posato l'ultima volta, per bambino: dura la sessione, non va nel profilo
let ultimo = null      // { chi, mondo, al, dove, verso }: `al` e `dove` sono id (l'indice della tappa, un sentiero, un posto della strada)
</script>

<script setup>
/* La mappa della campagna, in due valli dipinte: la valle dei piccoli e il
   mondo dello zaino, tutte e due con viste/Valle.vue. Si passa dall'una
   all'altra da una tana. Qui si decide in che valle aprire e da dove parte il
   segnalino; il resto lo fa la valle. Vedi docs/passo-passo/mappa.md. */
import { ref, computed } from 'vue'
import { STRADE } from '../motore/strade.js'
import { quadroValle, mondoDellIsola, MONDI } from '../scena/valle.js'
import { SENTIERO_CANE } from '../scena/animale.js'
import Valle from './Valle.vue'

const props = defineProps({
  // per indice: { indice, nome, icona, racconto, stelle, stato: fatta|ora|aperta|chiusa, aMeta, serve, scalino: { icona, nome } }
  voci: { type: Array, required: true },
  // i due sentieri senza fine: { coniglio, cane }, ognuno { aperto, record, serve }
  sentieri: { type: Object, required: true },
  dove: { type: [Number, String], required: true },   // la casella del segnalino: la tappa di adesso, o un sentiero
  chi: { type: String, default: '' },
})
const emit = defineEmits(['gioca', 'senza-fine'])

// in che valle sta ogni posto (gli id dei nodi non si ripetono fra le due)
const MONDO_DI = new Map()
for (const m of MONDI) for (const n of quadroValle(STRADE, { mondo: m }).nodi) MONDO_DI.set(n.id, m)
const mondoDi = id => MONDO_DI.get(id) ?? 'valle'
const isoleZaino = STRADE.isole.filter(s => mondoDellIsola(s.chiave) === 'zaino')
const tappeZaino = isoleZaino.flatMap(s => s.tappe)

// la tana dello zaino è aperta se lì c'è almeno una tappa aperta; chiusa dice cosa manca alla prima
const zaino = computed(() => {
  const prima = isoleZaino.length ? props.voci[isoleZaino[0].tappe[0]] : null
  return { aperto: tappeZaino.some(i => props.voci[i] && props.voci[i].stato !== 'chiusa'),
           serve: prima ? prima.serve || '' : '' }
})
// quella che torna alla valle è sempre aperta
const TORNA = { aperto: true, serve: '' }

// si gioca lì: una casella aperta, o un posto della strada (non una tana)
const giocabile = id => {
  if (id === 'senza-fine') return !!props.sentieri.coniglio.aperto
  if (id === SENTIERO_CANE) return !!props.sentieri.cane.aperto
  if (typeof id === 'number') return !!props.voci[id] && props.voci[id].stato !== 'chiusa'
  return MONDO_DI.has(id) && !String(id).startsWith('tana:')
}

/* Dove si apre: se la tappa di adesso è cambiata il segnalino parte da
   dov'era e ci va (nella stessa valle; da una valle all'altra si ritrova
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
// dalla tana si passa all'altra valle: si sbuca dalla tana di là
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

    <Valle :key="stato.mondo + stato.n" :mondo="stato.mondo" :voci="voci" :sentieri="sentieri"
           :passaggio="stato.mondo === 'valle' ? zaino : TORNA"
           :dove="dove" :partenza="stato.partenza" :meta="stato.meta ?? null" :entrata="stato.entrata" :verso="stato.verso || 1"
           @gioca="i => emit('gioca', i)" @senza-fine="s => emit('senza-fine', s)" @passa="passa" @posato="ricorda" />
  </div>
</template>
