<script>
// dove il segnalino si è posato l'ultima volta, per bambino e protagonista: dura la sessione, non va nel profilo
let ultimo = null      // { chi, protagonista, mondo, al, dove, verso }: `al` e `dove` sono id (l'indice della tappa, un sentiero, un posto della strada)
</script>

<script setup>
/* La mappa della campagna: un selettore sceglie il protagonista, il
   coniglio o il cane, e ognuno ha la sua strada, con le sue caselle
   numerate da 1. La strada passa per due valli dipinte, la valle dei
   piccoli e le isole delle carte, tutte e due con viste/Valle.vue; si passa
   dall'una all'altra da una tana. Qui si decide chi gioca, in che valle
   aprire e da dove parte il segnalino; il resto lo fa la valle. Vedi
   docs/passo-passo/mappa.md. */
import { ref, computed } from 'vue'
import { STRADE } from '../motore/strade.js'
import { quadroValle, mondoDellIsola, MONDI } from '../scena/valle.js'
import { SENTIERO_CANE } from '../scena/animale.js'
import Valle from './Valle.vue'

const props = defineProps({
  // per indice: { indice, numero, nome, icona, racconto, stelle, stato: fatta|ora|aperta|chiusa, aMeta, serve, scalino: { icona, nome }, nuovo }
  voci: { type: Array, required: true },
  // i due sentieri senza fine: { coniglio, cane }, ognuno { aperto, record, serve }
  sentieri: { type: Object, required: true },
  // la casella del segnalino di ogni protagonista: la tappa di adesso, o un sentiero
  dove: { type: Object, required: true },
  primo: { type: String, default: 'coniglio' },        // con chi si apre
  chi: { type: String, default: '' },
})
const emit = defineEmits(['gioca', 'senza-fine'])

const PROTAGONISTI = [
  { chiave: 'coniglio', nome: 'Coniglio', icona: '🐇' },
  { chiave: 'cane', nome: 'Cane', icona: '🐕' },
]
// in che valle sta ogni posto, per protagonista (gli id dei nodi non si ripetono fra le due valli)
const MONDO_DI = {}
for (const p of PROTAGONISTI) {
  MONDO_DI[p.chiave] = new Map()
  for (const m of MONDI) for (const n of quadroValle(STRADE, { mondo: m, protagonista: p.chiave }).nodi) MONDO_DI[p.chiave].set(n.id, m)
}
const tappeDi = (p, mondo) => STRADE.isole.filter(s => s.animale === p && mondoDellIsola(s.chiave) === mondo).flatMap(s => s.tappe)

// la strada del cane è aperta se lo è la sua prima tappa; chiusa, il selettore dice cosa manca
const caneAperto = computed(() => !!props.voci[STRADE.cane[0]] && props.voci[STRADE.cane[0]].stato !== 'chiusa')
const protagonista = ref(ultimo && ultimo.chi === props.chi && (ultimo.protagonista !== 'cane' || caneAperto.value)
  ? ultimo.protagonista : props.primo)
const doveOra = computed(() => props.dove[protagonista.value])
const mondoDi = id => MONDO_DI[protagonista.value].get(id) ?? 'valle'

// sull'insegna, quali numeri ci sono di là: dal primo in poi, o dal primo all'ultimo
function numeri(l) {
  if (!l.length) return ''
  const n = l.map(i => STRADE.numero[i])
  const da = Math.min(...n), a = Math.max(...n)
  return a === STRADE[protagonista.value].length ? `dal ${da} in poi` : `${da === 1 ? 'dall\'1' : `dal ${da}`} al ${a}`
}
// l'insegna ondeggia se di là c'è una tappa aperta e non ancora fatta
const daFare = l => l.some(i => props.voci[i] && ['ora', 'aperta'].includes(props.voci[i].stato))

/* la tana per le isole delle carte è aperta se lì c'è almeno una tappa aperta del protagonista;
   chiusa dice cosa manca alla prima. Quella che torna alla valle è sempre aperta */
const passaggio = computed(() => {
  const p = protagonista.value
  if (stato.value.mondo !== 'valle') {
    const l = tappeDi(p, 'valle')
    return { aperto: true, serve: '', sotto: numeri(l), chiama: daFare(l) }
  }
  const l = tappeDi(p, 'zaino')
  const prima = l.length ? props.voci[l.reduce((a, i) => (STRADE.numero[i] < STRADE.numero[a] ? i : a))] : null
  return { aperto: l.some(i => props.voci[i] && props.voci[i].stato !== 'chiusa'),
           serve: prima ? prima.serve || '' : '', sotto: numeri(l), chiama: daFare(l) }
})

// si gioca lì: una casella aperta, o un posto della strada (non una tana)
const giocabile = id => {
  if (id === 'senza-fine') return !!props.sentieri.coniglio.aperto
  if (id === SENTIERO_CANE) return !!props.sentieri.cane.aperto
  if (typeof id === 'number') return !!props.voci[id] && props.voci[id].stato !== 'chiusa'
  return MONDO_DI[protagonista.value].has(id) && !String(id).startsWith('tana:')
}

/* Dove si apre: se la tappa di adesso è cambiata il segnalino parte da
   dov'era e ci va (nella stessa valle; da una valle all'altra si ritrova
   sulla tappa); se no si ritrova dove lo si era lasciato, se lì si può
   ancora giocare. Ogni protagonista ha il suo. */
function apertura() {
  const p = protagonista.value
  const prima = ultimo && ultimo.chi === props.chi && ultimo.protagonista === p ? ultimo : null
  const dove = doveOra.value
  const md = mondoDi(dove)
  if (prima && prima.dove !== dove && prima.al !== dove && prima.al !== null) {
    if (prima.mondo === md && mondoDi(prima.al) === md) return { mondo: md, partenza: prima.al, meta: dove, verso: prima.verso }
    return { mondo: md, partenza: dove, verso: prima.verso }
  }
  if (prima && prima.al !== null && mondoDi(prima.al) === prima.mondo && giocabile(prima.al))
    return { mondo: prima.mondo, partenza: prima.al, verso: prima.verso }
  return { mondo: md, partenza: dove, verso: prima ? prima.verso : 1 }
}

// `ultimi` tiene il posto di ognuno dei due protagonisti in questa apertura della mappa
const ultimi = {}
const stato = ref({ ...apertura(), entrata: false, n: 0 })
// una valle che si chiude perché si è cambiato protagonista dice ancora dov'era il suo: va sotto di lui
function ricorda({ al, verso, protagonista: p, mondo }) {
  ultimi[p] = { chi: props.chi, protagonista: p, mondo, al, dove: props.dove[p], verso }
  if (p === protagonista.value) ultimo = ultimi[p]
}
// dalla tana si passa all'altra valle: si sbuca dalla tana di là
function passa() {
  const mondo = stato.value.mondo === 'valle' ? 'zaino' : 'valle'
  const partenza = mondo === 'valle' ? 'tana:zaino' : 'tana:valle'
  const verso = (ultimo && ultimo.verso) || 1
  stato.value = { mondo, partenza, meta: null, verso, entrata: true, n: stato.value.n + 1 }
  ultimo = { chi: props.chi, protagonista: protagonista.value, mondo, al: partenza, dove: doveOra.value, verso }
  ultimi[protagonista.value] = ultimo
}

/* il selettore: cambia chi gioca, e la mappa con lui. Il cane chiuso dice cosa manca */
const caneSpiega = ref(false)
function scegli(p) {
  if (p === 'cane' && !caneAperto.value) { caneSpiega.value = !caneSpiega.value; return }
  caneSpiega.value = false
  if (p === protagonista.value) return
  protagonista.value = p
  ultimo = ultimi[p] || (ultimo && ultimo.protagonista === p ? ultimo : null)
  stato.value = { ...apertura(), entrata: false, n: stato.value.n + 1 }
}
const caneServe = computed(() => (props.voci[STRADE.cane[0]] || {}).serve || '')
</script>

<template>
  <div class="pp-mappa" data-mappa :data-mondo="stato.mondo" :data-protagonista="protagonista">
    <!-- in cima e ferma: chi gioca, e la partita lasciata a metà (docs/passo-passo/sosta.md) -->
    <div class="pp-mappa-cima">
      <!-- chi gioca: il coniglio o il cane, ognuno con la sua strada -->
      <div class="pp-protagonisti" role="radiogroup" aria-label="Chi gioca">
        <button v-for="p in PROTAGONISTI" :key="p.chiave" type="button" class="pp-protagonista"
                role="radio" :aria-checked="protagonista === p.chiave ? 'true' : 'false'"
                :class="{ 'pp-scelto': protagonista === p.chiave, 'pp-chiuso': p.chiave === 'cane' && !caneAperto }"
                :data-scegli="p.chiave" @click="scegli(p.chiave)">
          <span class="pp-em">{{ p.icona }}</span> {{ p.nome }}
          <svg v-if="p.chiave === 'cane' && !caneAperto" class="pp-lucchetto-piccolo" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" fill="none" stroke="currentColor" stroke-width="3" />
            <rect x="4.5" y="10" width="15" height="11" rx="3" fill="currentColor" />
          </svg>
        </button>
        <p v-if="caneSpiega && !caneAperto" class="pp-protagonista-serve" data-serve-cane @click="caneSpiega = false">
          <span class="pp-em">🔒</span> {{ caneServe }}</p>
      </div>
      <slot />
    </div>

    <Valle :key="protagonista + stato.mondo + stato.n" :mondo="stato.mondo" :protagonista="protagonista"
           :voci="voci" :sentieri="sentieri" :passaggio="passaggio"
           :dove="doveOra" :partenza="stato.partenza" :meta="stato.meta ?? null" :entrata="stato.entrata" :verso="stato.verso || 1"
           @gioca="i => emit('gioca', i)" @senza-fine="s => emit('senza-fine', s)" @passa="passa" @posato="ricorda" />
  </div>
</template>
