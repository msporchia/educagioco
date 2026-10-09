<script setup>
// L'albero delle abilità (docs/sotterraneo/abilita.md): tre rami sotto il loro stendardo, quattro medaglioni legati da
// una catena che si accende d'oro, in cima le tre caselle che si portano nello scontro (se ne tocca una e si sceglie
// l'abilità da mettere, fra quelle che si sanno o toccandola nell'albero) e, in fondo, il medaglione toccato con cosa
// fa adesso e al grado dopo. Si apre dal globo blu della barra, o dalla pagina dell'eroe. Le regole
// (cosa si può imparare e perché no) sono di motore/abilita.js: qui si leggono e si dice cosa è stato toccato.
import { ref, computed, watch } from 'vue'
import Cornice from './Cornice.vue'
import Medaglione from './Medaglione.vue'
import Glifo from './Glifo.vue'
import SchedeEroe from './SchedeEroe.vue'
import { RAMI, NODI, GRADI } from '../dati/abilita.js'
import { gradoDi, perchéNonImpari, caselleDella } from '../motore/abilita.js'

const props = defineProps({
  eroe: { type: Object, required: true },        // la scheda della classe (dati/eroi.js)
  livello: { type: Number, required: true },
  punti: { type: Number, default: 0 },           // i punti dell'albero ancora da dare
  crescita: { type: Object, required: true },    // albero e caselle
  energia: { type: Number, default: 0 },
  energiaMax: { type: Number, default: 10 },
  haLArma: { type: Function, required: true },   // il Corredo: quell'arma ce l'ha in mano?
  puntiEroe: { type: Number, default: 0 },       // quelli delle caratteristiche, sulla scheda «Eroe»
  vitaMax: { type: Number, default: 0 },         // cure e scudi dicono il numero vero («cura 12 di vita»)
  gemme: { type: Number, default: 0 },           // per dimenticare l'albero, che si paga
  costoDimenticare: { type: Number, default: 0 },
})

const rami = computed(() => RAMI[props.eroe.chiave] || [])
const tintaDi = id => (rami.value.find(r => r.chiave === NODI[id].ramo) || {}).tinta
const caselle = computed(() => caselleDella(props.crescita).map(id => (id ? NODI[id] : null)))
// la casella toccata, che aspetta la sua abilità; le abilità che si sanno, da proporre
const casella = ref(null)
const sapute = computed(() => rami.value.flatMap(r => r.nodi).filter(n => !n.sempre && gradoDi(props.crescita, n.id)))
const emit = defineEmits(['impara', 'casella', 'scheda', 'chiudi', 'fuori', 'dimentica'])
// dimenticare costa gemme: il primo tocco chiede, il secondo fa (e un tocco altrove ci ripensa)
const sicuro = ref(false)
function dimentica() {
  if (!sicuro.value) { sicuro.value = true; return }
  sicuro.value = false
  emit('dimentica')
}
function tocca(n) {
  // con una casella aperta, toccare un'abilità saputa nell'albero la mette lì
  if (casella.value != null && !n.sempre && g(n.id)) { scegli(n.id); return }
  scelto.value = n.id
}
function scegli(id) {
  emit('casella', { i: casella.value, id })
  casella.value = null
}

// il nodo guardato: all'apertura quello che si può imparare adesso, se c'è, se no il primo
const scelto = ref(null)
function primo() {
  const tutti = rami.value.flatMap(r => r.nodi)
  const pronto = tutti.find(n => !perchéNonImpari(props.crescita, props.eroe.chiave, n.id))
  return (pronto || tutti[0] || {}).id || null
}
watch(() => props.eroe.chiave, () => { scelto.value = primo() }, { immediate: true })

const g = id => gradoDi(props.crescita, id)
const stato = n => {
  if (g(n.id)) return 'preso'
  return perchéNonImpari(props.crescita, props.eroe.chiave, n.id) ? 'chiuso' : 'pronto'
}
const maiuscola = t => t.charAt(0).toUpperCase() + t.slice(1)
// sotto un medaglione ancora da prendere: il livello, se è quello che manca (il grado dopo lo dice il riquadro in fondo)
const quando = n => {
  const p = !g(n.id) && perchéNonImpari(props.crescita, props.eroe.chiave, n.id).match(/^dal livello (\d+)/)
  return p ? `livello ${p[1]}` : ''
}
const dettaglio = computed(() => {
  const n = scelto.value ? NODI[scelto.value] : null
  if (!n) return null
  const ora = g(n.id)
  return {
    ...n, grado: ora, tinta: tintaDi(n.id), stato: stato(n),
    ora: ora ? n.fa(ora, props.vitaMax) : null,
    dopo: maiuscola(n.fa(ora + 1, props.vitaMax)),
    perche: perchéNonImpari(props.crescita, props.eroe.chiave, n.id),
    senzArma: n.arma && !props.haLArma(n.arma) ? n.arma : null,
  }
})
</script>

<template>
  <Cornice alta data-pagina-abilita @chiudi="$emit('chiudi')" @fuori="e => $emit('fuori', e)">
    <SchedeEroe attiva="abilita" :punti="puntiEroe" :punti-abilita="punti" @scheda="s => $emit('scheda', s)" />

    <div class="sot-punti-riga">
      <p v-if="punti" class="sot-eroe-punti" data-punti-abilita :data-n="punti">
        {{ punti === 1 ? 'Hai un punto da imparare' : `Hai ${punti} punti da imparare` }}
      </p>
      <p v-else class="sot-eroe-punti sot-tenue">A ogni livello, un punto per l'albero.</p>
      <!-- dimenticare l'albero: i punti tornano da dare, a cinque gemme l'uno -->
      <button v-if="costoDimenticare" type="button" class="sot-riassegna" :class="{ 'sot-sicuro': sicuro }" data-azione="dimentica"
              :data-costo="costoDimenticare" :disabled="gemme < costoDimenticare" @click="dimentica">
        {{ sicuro ? 'Sicuro?' : 'Riassegna' }} <span class="em">💎</span>{{ costoDimenticare }}
      </button>
    </div>

    <!-- le tre abilità che compaiono nello scontro, sopra la domanda: si tocca una casella e si sceglie cosa metterci -->
    <div class="sot-albero-caselle" data-caselle-albero>
      <span class="sot-albero-dida">Nello scontro
        <span class="sot-albero-energia" :data-energia="energia"><Glifo nome="energia" :misura="14" /> {{ energia }}/{{ energiaMax }}</span>
      </span>
      <div class="sot-albero-zoccoli">
        <button v-for="(c, i) in caselle" :key="c ? c.id : 'v' + i" type="button" class="sot-zoccolo"
                :class="{ 'sot-vuota': !c, 'sot-aperto': casella === i }" data-azione="zoccolo" :data-zoccolo="i"
                :data-casella="c ? c.id : null" @click="casella = casella === i ? null : i">
          <Medaglione v-if="c" :glifo="c.glifo" :tinta="tintaDi(c.id)" :misura="38" />
          <i v-else class="sot-zoccolo-vuoto" aria-hidden="true">+</i>
          <small>{{ c ? c.nome : 'scegli' }}</small>
        </button>
      </div>
      <!-- la casella aperta: le abilità che si sanno, in fila; quella toccata ci va (anche dall'albero qui sotto) -->
      <div v-if="casella != null" class="sot-scelta-abilita" data-scelta-abilita>
        <template v-if="sapute.length">
          <button v-for="n in sapute" :key="n.id" type="button" class="sot-scelta-voce" :class="{ 'sot-dentro': caselle[casella] && caselle[casella].id === n.id }"
                  data-azione="metti" :data-metti="n.id" @click="scegli(n.id)">
            <Medaglione :glifo="n.glifo" :tinta="tintaDi(n.id)" :misura="34" />
            <small>{{ n.nome }}</small>
          </button>
          <button v-if="caselle[casella]" type="button" class="sot-scelta-voce sot-scelta-via" data-azione="metti" data-metti=""
                  @click="scegli(null)"><i class="sot-zoccolo-vuoto" aria-hidden="true"></i><small>vuota</small></button>
        </template>
        <p v-else>Impara un'abilità nell'albero qui sotto.</p>
      </div>
    </div>

    <div class="sot-albero">
      <section v-for="r in rami" :key="r.chiave" class="sot-ramo" :data-ramo="r.chiave" :style="{ '--tinta': r.tinta }">
        <!-- lo stendardo del ramo: il suo colore, la sua icona, e l'arma che vuole -->
        <span class="sot-stendardo">
          <svg viewBox="0 0 60 66" aria-hidden="true">
            <defs>
              <linearGradient :id="'st-' + r.chiave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" :stop-color="r.tinta" /><stop offset="1" stop-color="#140e08" />
              </linearGradient>
            </defs>
            <path d="M3 2H57V50L30 63L3 50Z" :fill="`url(#st-${r.chiave})`" stroke="#f3cf6b" stroke-width="2" stroke-linejoin="round" />
            <path d="M8 6H52V47.5L30 58L8 47.5Z" fill="none" stroke="#f3cf6b55" stroke-width="1" />
          </svg>
          <Glifo :nome="r.glifo" :misura="28" />
        </span>
        <h3>{{ r.nome }}</h3>
        <small class="sot-ramo-arma" :class="{ 'sot-manca': r.arma && !haLArma(r.arma) }">{{ r.arma ? r.arma.con : 'con ogni arma' }}</small>
        <template v-for="(n, i) in r.nodi" :key="n.id">
          <i class="sot-catena" :class="{ 'sot-accesa': i ? g(r.nodi[i - 1].id) : true }" aria-hidden="true"></i>
          <button type="button" class="sot-nodo" :class="['sot-nodo-' + stato(n), { 'sot-scelto': scelto === n.id }]"
                  data-azione="nodo" :data-nodo="n.id" :data-grado="g(n.id)" :data-stato="stato(n)" @click="tocca(n)">
            <Medaglione :glifo="n.glifo" :tinta="r.tinta" :tondo="!!n.sempre" :stato="stato(n)" :misura="50" />
            <b>{{ n.nome }}</b>
            <span class="sot-gradi" aria-hidden="true">
              <i v-for="k in GRADI" :key="k" :class="{ 'sot-pieno': k <= g(n.id) }"></i>
              <em v-if="g(n.id) > GRADI">{{ g(n.id) }}</em>
            </span>
            <small v-if="quando(n)">{{ quando(n) }}</small>
          </button>
        </template>
      </section>
    </div>

    <!-- il medaglione toccato: cosa fa adesso, cosa farebbe al grado dopo, e i due tasti -->
    <div v-if="dettaglio" class="sot-nodo-dettaglio" data-nodo-dettaglio :data-nodo="dettaglio.id" :style="{ '--tinta': dettaglio.tinta }">
      <div class="sot-nodo-nome">
        <Medaglione :glifo="dettaglio.glifo" :tinta="dettaglio.tinta" :tondo="!!dettaglio.sempre" :stato="dettaglio.stato" :misura="44" />
        <span>
          <b>{{ dettaglio.nome }}</b>
          <small v-if="dettaglio.sempre">vale sempre</small>
          <small v-else class="sot-costo-energia"><Glifo nome="energia" :misura="13" /> {{ dettaglio.costo }} di energia</small>
        </span>
      </div>
      <p v-if="dettaglio.ora">Grado {{ dettaglio.grado }}: {{ dettaglio.ora }}</p>
      <p v-if="dettaglio.dopo" :class="{ 'sot-tenue': !!dettaglio.grado }">
        <template v-if="dettaglio.grado">Al grado {{ dettaglio.grado + 1 }}: </template>{{ dettaglio.dopo }}
      </p>
      <p v-if="dettaglio.senzArma" class="sot-manca">Ci vuole {{ dettaglio.senzArma.nome }} in mano</p>
      <div class="sot-nodo-tasti">
        <button type="button" class="sot-grosso" data-azione="impara" :data-impara="dettaglio.id" :disabled="!!dettaglio.perche"
                @click="$emit('impara', dettaglio.id)">
          <template v-if="!dettaglio.perche">{{ dettaglio.grado ? 'Migliora' : 'Impara' }} <small>un punto</small></template>
          <template v-else>{{ dettaglio.grado ? 'Migliora' : 'Impara' }} <small>{{ dettaglio.perche }}</small></template>
        </button>
      </div>
    </div>
  </Cornice>
</template>
