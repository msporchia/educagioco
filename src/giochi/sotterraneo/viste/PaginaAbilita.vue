<script setup>
// L'albero delle abilità (docs/sotterraneo/abilita.md): quattro rami, ognuno sotto il suo stendardo (si sceglie il ramo
// toccandolo sulla fila degli stendardi, uno alla volta: sette medaglioni a ramo non starebbero in 390 px), i medaglioni in
// cinque righe di uno o due, legati da catene che si accendono d'oro; in cima le tre caselle che si portano nello scontro
// (se ne tocca una e si sceglie l'abilità da mettere, fra quelle che si sanno o toccandola nell'albero) e, in fondo, il
// medaglione toccato con cosa fa adesso e al grado dopo, di che elemento è e chi prende. Si apre dal globo blu della barra, o dalla pagina dell'eroe. Le regole
// (cosa si può imparare e perché no) sono di motore/abilita.js: qui si leggono e si dice cosa è stato toccato.
import { ref, computed, watch, nextTick } from 'vue'
import Cornice from './Cornice.vue'
import Medaglione from './Medaglione.vue'
import Glifo from './Glifo.vue'
import SchedeEroe from './SchedeEroe.vue'
import { RAMI, NODI, GRADI, GRADINI, colpisce, costoAl, preparabile, aGrado } from '../dati/abilita.js'
import { ELEMENTI } from '../dati/elementi.js'
import { gradoDi, perchéNonImpari, caselleDella } from '../motore/abilita.js'

const props = defineProps({
  eroe: { type: Object, required: true },        // la scheda della classe (dati/eroi.js)
  livello: { type: Number, required: true },
  punti: { type: Number, default: 0 },           // i punti dell'albero ancora da dare
  missioni: { type: Number, default: 0 },        // le missioni da consegnare, sulla scheda (SchedeEroe.vue)
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
// il ramo aperto: uno alla volta. All'apertura quello dove c'è qualcosa da imparare, se no il primo; cambiando eroe si riparte
const aperto = ref(null)
const ramo = computed(() => rami.value.find(r => r.chiave === aperto.value) || rami.value[0] || null)
// le righe del ramo aperto: uno o due nodi ciascuna (si prende l'uno, l'altro o tutti e due)
const righe = computed(() => (ramo.value ? GRADINI.map((_, i) => ramo.value.nodi.filter(x => x.riga === i)) : []))
const presi = r => r.nodi.filter(x => g(x.id)).length
const daImparare = r => r.nodi.some(x => !g(x.id) && !perchéNonImpari(props.crescita, props.eroe.chiave, x.id))
// la catena fra due righe, in un disegno solo: dai nodi di sopra (si accende se imparato) a una sbarra, e dalla sbarra ai nodi di
// sotto (si accende se ne hai imparato uno sopra). Con un nodo il tratto è dritto, con due i nodi stanno a un quarto e tre quarti
const xDi = n => (n === 2 ? [25, 75] : [50])
const sopra = i => (i > 0 ? righe.value[i - 1] : [])
const sopraAccesa = i => sopra(i).some(x => g(x.id))
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
watch(() => props.eroe.chiave, () => {
  scelto.value = primo()
  aperto.value = scelto.value && NODI[scelto.value] ? NODI[scelto.value].ramo : null
}, { immediate: true })
// toccare un ramo lo apre, e guarda il suo primo nodo da imparare (o il primo)
const scorri = ref(null)
function apri(r) {
  aperto.value = r.chiave
  nextTick(() => { if (scorri.value) scorri.value.scrollTop = 0 })
  const dentro = r.nodi.find(x => !perchéNonImpari(props.crescita, props.eroe.chiave, x.id) && !g(x.id))
  scelto.value = (dentro || r.nodi[0]).id
}

const g = id => gradoDi(props.crescita, id)
const stato = n => {
  if (g(n.id)) return 'preso'
  return perchéNonImpari(props.crescita, props.eroe.chiave, n.id) ? 'chiuso' : 'pronto'
}
const maiuscola = t => { const s = String(t ?? ''); return s.charAt(0).toUpperCase() + s.slice(1) }
// sotto un medaglione ancora da prendere: il livello, se è quello che manca (il grado dopo lo dice il riquadro in fondo)
const quando = n => {
  const p = !g(n.id) && perchéNonImpari(props.crescita, props.eroe.chiave, n.id).match(/^dal livello (\d+)/)
  return p ? `livello ${p[1]}` : ''
}
// chi prende il colpo, in due parole (la forma del colpo, dati/abilita.js)
const CHI = { vicini: 'il mostro e i due accanto', catena: 'un mostro, poi salta sugli altri', tutti: 'tutti i mostri in campo' }
const CON = { forza: 'la forza', destrezza: 'la destrezza', intelligenza: 'l\'intelligenza' }
const dettaglio = computed(() => {
  const n = scelto.value ? NODI[scelto.value] : null
  if (!n) return null
  const ora = g(n.id)
  const r = rami.value.find(x => x.chiave === n.ramo) || {}
  return {
    ...n, grado: ora, tinta: tintaDi(n.id), stato: stato(n),
    costo: n.sempre ? 0 : costoAl(n, ora || 1), costoDopo: n.sempre ? 0 : costoAl(n, ora + 1),
    colpisce: colpisce(n), chi: CHI[n.forma] || '', elementoDi: colpisce(n) ? ELEMENTI[n.elemento] : null,
    con: n.car ? CON[n.car] : '', arma: r.arma || null,
    ora: ora ? n.fa(ora, props.vitaMax) : null,
    dopo: maiuscola(n.fa(ora + 1, props.vitaMax)),
    perche: perchéNonImpari(props.crescita, props.eroe.chiave, n.id),
    senzArma: n.arma && !props.haLArma(n.arma) ? n.arma : null,
    preparabile: preparabile(n) ? aGrado(n, 'preparabile', ora || 1) : 0,   // i passi che resta addosso se la lanci dal campo
  }
})
</script>

<template>
  <Cornice alta data-pagina-abilita @chiudi="$emit('chiudi')" @fuori="e => $emit('fuori', e)">
    <SchedeEroe attiva="abilita" :punti="puntiEroe" :punti-abilita="punti" :missioni="missioni" @scheda="s => $emit('scheda', s)" />

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

    <!-- i quattro stendardi: si tocca il ramo da guardare. Sotto, quello aperto, in cinque righe di uno o due medaglioni -->
    <div ref="scorri" class="sot-albero" data-albero>
      <nav class="sot-stendardi" aria-label="i rami">
        <button v-for="r in rami" :key="r.chiave" type="button" class="sot-stend" :class="{ 'sot-stend-aperto': ramo && ramo.chiave === r.chiave }"
                :style="{ '--tinta': r.tinta }" data-azione="ramo" :data-ramo-scheda="r.chiave" :data-aperto="ramo && ramo.chiave === r.chiave ? 1 : 0"
                :data-presi="presi(r)" @click="apri(r)">
          <span class="sot-stendardo sot-stendardo-pic">
            <svg viewBox="0 0 60 66" aria-hidden="true">
              <defs>
                <linearGradient :id="'st-' + r.chiave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" :stop-color="r.tinta" /><stop offset="1" stop-color="#140e08" />
                </linearGradient>
              </defs>
              <path d="M3 2H57V50L30 63L3 50Z" :fill="`url(#st-${r.chiave})`" stroke="#f3cf6b" stroke-width="2" stroke-linejoin="round" />
              <path d="M8 6H52V47.5L30 58L8 47.5Z" fill="none" stroke="#f3cf6b55" stroke-width="1" />
            </svg>
            <Glifo :nome="r.glifo" :misura="22" />
            <i v-if="daImparare(r)" class="sot-stend-pronto" aria-hidden="true">+</i>
          </span>
          <b>{{ r.nome }}</b>
          <small>{{ presi(r) }}/{{ r.nodi.length }}</small>
        </button>
      </nav>

      <section v-if="ramo" :key="ramo.chiave" class="sot-ramo" :data-ramo="ramo.chiave" :style="{ '--tinta': ramo.tinta }">
        <!-- l'intestazione del ramo: l'arma che vuole, e con cosa colpisce quando non è l'arma -->
        <p class="sot-ramo-testa">
          <span class="sot-ramo-arma" :class="{ 'sot-manca': ramo.arma && !haLArma(ramo.arma) }">{{ ramo.arma ? ramo.arma.con : 'con ogni arma' }}</span>
          <span v-if="ramo.car" class="sot-ramo-car" data-car>colpisce con {{ CON[ramo.car] }}</span>
          <span v-if="ramo.elemento && ramo.elemento !== 'fisico'" class="sot-elem" :style="{ '--e': ELEMENTI[ramo.elemento].tinta }" data-elemento-ramo>
            <Glifo :nome="ELEMENTI[ramo.elemento].glifo" :misura="13" /> {{ ELEMENTI[ramo.elemento].nome }}
          </span>
        </p>
        <template v-for="(riga, i) in righe" :key="i">
          <!-- la catena che porta alla riga: dritta, o con la forcella se i nodi sono due -->
          <svg v-if="i" class="sot-giunto" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
            <path v-for="(x, k) in xDi(sopra(i).length)" :key="'s' + k" :d="`M${x} 0V10`" :class="{ 'sot-accesa': g(sopra(i)[k].id) }" />
            <path v-if="sopra(i).length + riga.length > 2" :d="`M${xDi(Math.max(sopra(i).length, riga.length))[0]} 10H${xDi(Math.max(sopra(i).length, riga.length)).slice(-1)[0]}`"
                  :class="{ 'sot-accesa': sopraAccesa(i) }" />
            <path v-for="(x, k) in xDi(riga.length)" :key="'g' + k" :d="`M${x} 10V20`" :class="{ 'sot-accesa': sopraAccesa(i) }" />
          </svg>
          <div class="sot-riga" :class="{ 'sot-riga-due': riga.length === 2 }" :data-riga="i">
            <template v-for="(n, k) in riga" :key="n.id">
              <i v-if="k" class="sot-o" aria-hidden="true">o</i>
              <button type="button" class="sot-nodo" :class="['sot-nodo-' + stato(n), { 'sot-scelto': scelto === n.id }]"
                      data-azione="nodo" :data-nodo="n.id" :data-grado="g(n.id)" :data-stato="stato(n)" @click="tocca(n)">
                <Medaglione :glifo="n.glifo" :tinta="ramo.tinta" :tondo="!!n.sempre" :stato="stato(n)" :misura="48" />
                <b>{{ n.nome }}</b>
                <span class="sot-gradi" aria-hidden="true">
                  <i v-for="q in GRADI" :key="q" :class="{ 'sot-pieno': q <= g(n.id) }"></i>
                  <em v-if="g(n.id) > GRADI">{{ g(n.id) }}</em>
                </span>
                <small v-if="quando(n)">{{ quando(n) }}</small>
              </button>
            </template>
          </div>
        </template>
      </section>

      <!-- cosa vuol dire gemma e cosa vuol dire tondo (l'utente, 9 ottobre: non si capiva che Fiamma viva è una passiva) -->
      <p class="sot-legenda" data-legenda-albero>
        <span><Medaglione glifo="spada" tinta="#c9a24a" stato="preso" :misura="22" /> <b>Abilità</b>: la scegli nello scontro, costa energia</span>
        <span><Medaglione glifo="spada" tinta="#c9a24a" stato="preso" :tondo="true" :misura="22" /> <b>Passiva</b>: lavora da sola, sempre, senza energia</span>
        <span><i class="sot-o" aria-hidden="true">o</i> Due accanto: ne prendi una, l'altra o tutte e due</span>
      </p>
    </div>

    <!-- il medaglione toccato: cosa fa adesso, cosa farebbe al grado dopo, e i due tasti -->
    <div v-if="dettaglio" class="sot-nodo-dettaglio" data-nodo-dettaglio :data-nodo="dettaglio.id" :style="{ '--tinta': dettaglio.tinta }">
      <div class="sot-nodo-nome">
        <Medaglione :glifo="dettaglio.glifo" :tinta="dettaglio.tinta" :tondo="!!dettaglio.sempre" :stato="dettaglio.stato" :misura="44" />
        <span>
          <b>{{ dettaglio.nome }}</b>
          <small v-if="dettaglio.sempre">passiva · vale sempre</small>
          <small v-else class="sot-costo-energia"><Glifo nome="energia" :misura="13" /> {{ dettaglio.costo }} di energia<template v-if="dettaglio.grado && dettaglio.costoDopo > dettaglio.costo"> (al grado {{ dettaglio.grado + 1 }}: {{ dettaglio.costoDopo }})</template></small>
        </span>
      </div>
      <p v-if="dettaglio.ora">Grado {{ dettaglio.grado }}: {{ dettaglio.ora }}</p>
      <p v-if="dettaglio.colpisce" class="sot-nodo-natura" data-natura>
        <span v-if="dettaglio.elementoDi" class="sot-elem" :style="{ '--e': dettaglio.elementoDi.tinta }" :data-elemento="dettaglio.elemento">
          <Glifo :nome="dettaglio.elementoDi.glifo" :misura="13" /> {{ dettaglio.elementoDi.nome }}</span>
        <span v-if="dettaglio.chi" class="sot-chi" data-chi>colpisce {{ dettaglio.chi }}</span>
        <span v-if="dettaglio.con" class="sot-chi" data-con>picchia con {{ dettaglio.con }}</span>
      </p>
      <p v-if="dettaglio.dopo" :class="{ 'sot-tenue': !!dettaglio.grado }">
        <template v-if="dettaglio.grado">Al grado {{ dettaglio.grado + 1 }}: </template>{{ dettaglio.dopo }}
      </p>
      <p v-if="dettaglio.preparabile" class="sot-tenue" data-preparabile :data-passi="dettaglio.preparabile">Si può preparare prima di uno scontro, dal globo blu: resta addosso per {{ dettaglio.preparabile }} passi e lo scontro comincia con lei già attiva.</p>
      <p v-if="dettaglio.sempre" class="sot-tenue" data-passiva>Una passiva lavora da sola: non costa energia e non va nelle caselle dello scontro. Basta averla imparata.</p>
      <p v-if="dettaglio.senzArma" class="sot-manca">Ci vuole {{ dettaglio.senzArma.nome }} in mano</p>
      <p v-if="!dettaglio.sempre && dettaglio.costo > energiaMax" class="sot-manca" data-serve-energia>Ti serve più energia: ne hai al massimo {{ energiaMax }}. Metti punti in intelligenza</p>
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
