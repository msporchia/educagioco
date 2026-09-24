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
import { computed, provide, ref, watch, nextTick } from 'vue'
import { nomiLeggibili } from '../motore/modifica.js'
import { DOVE_PORTO, LATI } from '../dati/scrivi.js'
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
  indietro: { type: Number, default: 0 },        // quanti «annulla» ci sono
  zaino: { type: Number, default: null },        // quante righe tiene il programma, se il livello lo dice
  scritte: { type: Number, default: 0 },         // quante ne ha scritte il bambino (gli attrezzi no)
  livelli: { type: Array, default: () => [] },   // per dire da quale livello viene un attrezzo
})
const emit = defineEmits(['tab', 'seleziona', 'apri', 'imposta', 'aggiungi', 'azione', 'annulla',
                          'nuova-lavagnetta', 'progetto', 'ricomincia'])

const progetti = computed(() => props.programma.progetti || [])
/* cambiando scheda si riparte dalla cima: la testa di un progetto (e la
   nota di un attrezzo, che dice dove lascia il robot) sta lì */
const foglio = ref(null)
watch(() => props.tab, () => nextTick(() => { if (foglio.value) foglio.value.scrollTop = 0 }))
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
    /* il porto: quattro frecce, la mano, le cose del livello, e la lettura
       se il livello la offre */
    const porto = props.livello.mondo === 'porto'
    return {
      colori: props.livello.colori,
      nomi,
      confronta: nomi.misure.length + nomi.lavagnette.length + nomi.ordine.length > 0,
      ...(porto ? { porto: true, versi: LATI, dove: DOVE_PORTO, cose: props.livello.cose || [],
                    leggere: !!props.livello.leggere } : {}),
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
const inOrdine = computed(() => [
  ...progetti.value.filter(p => !p.attrezzo),
  ...(conProgetti.value && !props.sola ? [{ id: '＋', nuovo: true }] : []),
  ...progetti.value.filter(p => p.attrezzo),
])
/* un attrezzo dice da dove viene: il livello dove il bambino l'ha costruito */
const daDove = a => { const l = a && a.da && props.livelli.find(x => x.chiave === a.da); return l ? l.nome : null }
/* la carta aperta in cima alla pila, se è di questo progetto: le sue
   misure si scrivono sulla scheda coi valori di **questa** chiamata */
const inCima = computed(() => props.pila.length ? props.pila[props.pila.length - 1] : null)
const valoriDi = p => (inCima.value && inCima.value.progetto === p.id ? inCima.value.misure : null)
</script>

<template>
  <section ref="foglio" class="cst-editor" data-editor>
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

    <!-- le schede, e in fondo alla stessa riga lo zaino e «annulla»: una
         riga in più qui sarebbe una riga di programma in meno sul telefono -->
    <div class="cst-barra-schede">
    <nav class="cst-schede">
      <button type="button" class="cst-scheda" :class="{ 'cst-su': !tab }" data-scheda="principale"
              @click="emit('tab', null)">▶ principale</button>
      <!-- prima i progetti del bambino e il «＋», poi gli attrezzi: quello
           che si scrive sta davanti, quello che si legge e basta in fondo -->
      <button v-for="p in inOrdine" :key="p.id" type="button" class="cst-scheda"
              :class="{ 'cst-su': tab === p.id, 'cst-attrezzo': p.attrezzo, 'cst-nuovo': p.nuovo }"
              :data-scheda="p.nuovo ? null : p.id" :data-azione="p.nuovo ? 'nuovo-progetto' : null"
              @click="p.nuovo ? emit('progetto', null) : emit('tab', p.id)">
        <template v-if="p.nuovo">＋ progetto</template>
        <template v-else>
          <span v-if="p.attrezzo" class="cst-lucchetto" aria-label="attrezzo">🔒</span>{{ p.icona }} {{ p.nome }}
          <small v-if="!valoriDi(p)">{{ misureDi(p) }}</small>
          <i v-for="(v, m) in valoriDi(p) || {}" v-else :key="m" class="cst-valore-misura">{{ m }} {{ v }}</i>
        </template>
      </button>
    </nav>
    <span v-if="zaino && !sola" class="cst-zaino" :class="{ 'cst-quasi': scritte >= zaino - 1, 'cst-troppe': scritte > zaino }"
          data-zaino :data-righe="scritte" :aria-label="`${scritte} righe su ${zaino}`">📝 {{ scritte }}/{{ zaino }}</span>
    <button v-if="!sola" type="button" class="cst-annulla" data-azione="annulla" aria-label="annulla" title="annulla"
            :disabled="!indietro" @click="emit('annulla')">↶</button>
    </div>
    </div>

    <div class="cst-foglio-programma" :class="{ 'cst-gira': sola }">
      <div v-if="attivo" class="cst-testa-progetto" :class="{ 'cst-testa-attrezzo': attivo.attrezzo }">
        <span class="cst-ico">{{ attivo.icona }}</span>
        <b>{{ attivo.attrezzo ? 'attrezzo' : 'progetto' }} {{ attivo.nome }}</b>
        <span v-if="attivo.misure.length" class="cst-misure">misure: <i v-for="m in attivo.misure" :key="m">{{ m }}</i></span>
        <button v-if="!sola && !attivo.attrezzo" type="button" class="cst-matita" data-azione="modifica-progetto" aria-label="modifica il progetto"
                @click="emit('progetto', attivo.id)">✎</button>
      </div>
      <!-- un attrezzo è già scritto: si legge, si chiama, e si sa dove lascia il robot -->
      <p v-if="attivo && attivo.attrezzo" class="cst-nota-attrezzo" data-attrezzo>
        🔒 È già scritto<template v-if="daDove(attivo)">: l'hai costruito in «{{ daDove(attivo) }}»</template>.
        Si chiama dalla cassetta, e non si cambia. <b>Finisce {{ attivo.finisce }}.</b>
      </p>
      <p v-if="!righe.length && !sola" class="cst-vuoto">
        {{ attivo ? 'Il progetto è vuoto: scrivici dentro come si costruisce.' : 'Il programma è vuoto: tocca «＋ aggiungi».' }}
      </p>
      <Righe :righe="righe" :dove="{ progetto: tab, dentro: null, ramo: 'corpo' }" :bloccata="!!(attivo && attivo.attrezzo)" />
      <div v-if="!sola && !(attivo && attivo.attrezzo)" class="cst-piede-editor">
        <button type="button" class="cst-ricomincia" data-azione="ricomincia" @click="emit('ricomincia')">↺ ricomincia da capo</button>
      </div>
    </div>
  </section>
</template>
