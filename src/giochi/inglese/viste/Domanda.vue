<script setup>
/* Una domanda della tappa, già costruita dal motore: le opzioni da
   toccare, oppure la fila di tessere di «componi». Riceve la fila e
   l'esito già decisi ed emette i tocchi: non sa cosa sia una moneta.
   Dopo uno sbaglio tre righe distinte — il perché, «Si fa così», la
   frase giusta — e l'attesa che si vede (docs/apprendimento/la-domanda.md). */
import { computed } from 'vue'
import Testo from './Testo.vue'
import { tenere } from './tenere.js'

const props = defineProps({
  d: { type: Object, required: true },
  caselle: { type: Object, default: null },     // { caselle: [{ id?, testo, fisso?, buco? }], punto }
  banco: { type: Array, default: null },        // [{ id, testo, posto }]
  pronto: { type: Boolean, default: false },    // si può consegnare la fila
  esito: { type: Object, default: null },       // { giusta, scelta, sbagliate, perche, siFa, giustaEra, diFretta }
  attesa: { type: Number, default: 0 },
  giro: { type: Number, default: 0 },
  parla: { type: Boolean, default: false },     // la parola ha la sua clip
})
const emit = defineEmits(['opzione', 'metti', 'togli', 'consegna', 'tocca', 'ascolta'])

const ETICHETTE = {
  riconosci: 'Che vuol dire?',
  senso: 'Leggi bene: che vuol dire?',
  scegli: 'Come si dice in inglese?',
  completa: 'Completa la frase',
  monta: 'Metti le parole in ordine',
  scegliMonta: 'Componi la frase: qualche parola è di troppo',
}
const etichetta = computed(() => props.d.genere === 'parola' ? props.d.etichetta : ETICHETTE[props.d.formato])
const componi = computed(() => !!props.d.tessere)

// il testo da mostrare in alto, e in che lingua è
const domanda = computed(() => {
  const d = props.d
  if (d.genere === 'frase') return { testo: d.domanda.testo, en: d.domanda.lingua === 'en' }
  const q = d.domanda
  if (q.ascolta && !q.testo) return { ascolto: true, testo: props.esito ? q.svela : '', en: true }
  return { testo: q.testo, en: !q.italiano, aiuto: q.aiuto }
})

// le opzioni inglesi si tengono premute per sapere cosa vuol dire una parola
const opzioniInglesi = computed(() => props.d.genere === 'frase'
  ? props.d.formato === 'scegli' : !!(props.d.domanda && props.d.domanda.italiano))
const t = tenere(el => emit('tocca', el))

function classeOpzione(o, i) {
  if (!props.esito) return ''
  if (o.giusta) return 'ing-giusta'
  if (i === props.esito.scelta) return 'ing-sbagliata'
  return 'ing-spenta'
}
function opzione(i) {
  if (t.ingoia() || props.esito) return
  emit('opzione', i)
}
function tessera(id, dove) {
  if (t.ingoia() || props.esito) return
  emit(dove === 'banco' ? 'metti' : 'togli', id)
}
const sbagliata = id => !!(props.esito && props.esito.sbagliate && props.esito.sbagliate.includes(id))
</script>

<template>
  <div class="ing-domanda" data-domanda :data-formato="d.formato" :data-genere="d.genere">
    <div class="ing-etichetta">{{ etichetta }}</div>

    <!-- la consegna: inglese si tocca parola per parola, l'ascolto si ripete toccandolo -->
    <div class="ing-consegna" :class="{ 'ing-it': !domanda.en, 'ing-lunga': (domanda.testo || '').length > 18 }">
      <button v-if="domanda.ascolto" type="button" class="ing-ascolta" data-azione="ascolta"
              @click="$emit('ascolta')">
        <span v-if="!esito" class="em">🎧</span><span v-else>{{ domanda.testo }}</span>
      </button>
      <template v-else>
        <Testo v-if="domanda.en" :testo="domanda.testo" @tocca="el => $emit('tocca', el)" />
        <span v-else>{{ domanda.testo }}</span>
        <button v-if="parla" type="button" class="ing-voce" aria-label="ascolta"
                data-azione="ascolta" @click="$emit('ascolta')">🔊</button>
      </template>
    </div>
    <div v-if="domanda.aiuto" class="ing-sotto">{{ domanda.aiuto }}</div>

    <!-- componi: la fila in alto, il banco sotto; si tocca e basta -->
    <template v-if="componi">
      <div class="ing-fila" data-fila :class="{ 'ing-fila-vuota': !caselle.caselle.length }">
        <template v-for="(c, i) in caselle.caselle" :key="i">
          <span v-if="c.fisso" class="ing-fisso">{{ c.testo }}</span>
          <button v-else-if="c.id != null" type="button" class="ing-tessera ing-in-fila"
                  :class="{ 'ing-sbagliata': sbagliata(c.id) }" :data-in-fila="c.id"
                  :data-sbagliata="sbagliata(c.id) ? '' : null"
                  @pointerdown="t.giu" @pointermove="t.muovi" @pointerup="t.su" @pointercancel="t.su"
                  @click="tessera(c.id, 'fila')"><span :data-parola="c.testo">{{ c.testo }}</span></button>
          <span v-else class="ing-buco" :data-buco="c.buco"></span>
        </template>
        <span v-if="caselle.punto" class="ing-fisso ing-punto">{{ caselle.punto }}</span>
        <span v-if="!caselle.caselle.length" class="ing-invito">tocca le parole qui sotto</span>
      </div>
      <div class="ing-banco" data-banco>
        <button v-for="b in banco" :key="b.id" type="button" class="ing-tessera"
                :data-tessera="b.id" :data-posto="b.posto == null ? null : b.posto"
                @pointerdown="t.giu" @pointermove="t.muovi" @pointerup="t.su" @pointercancel="t.su"
                @click="tessera(b.id, 'banco')"><span :data-parola="b.testo">{{ b.testo }}</span></button>
      </div>
      <button v-if="!esito" type="button" class="ing-grosso ing-consegna-tasto" data-azione="consegna"
              :disabled="!pronto" @click="$emit('consegna')">Fatto ✓</button>
    </template>

    <!-- le opzioni -->
    <div v-else class="ing-opzioni" :class="{ 'ing-figure': d.figure, 'ing-lunghe': d.lunghe || d.genere === 'frase' }">
      <button v-for="(o, i) in d.opzioni" :key="i" type="button" class="ing-opzione"
              :class="classeOpzione(o, i)" :data-opzione="i" :data-giusta="o.giusta ? '' : null"
              @pointerdown="opzioniInglesi ? t.giu($event) : null"
              @pointermove="opzioniInglesi ? t.muovi($event) : null"
              @pointerup="t.su" @pointercancel="t.su"
              @click="opzione(i)">
        <Testo v-if="opzioniInglesi" :testo="o.testo" :toccabile="true" />
        <template v-else>{{ o.testo }}</template>
      </button>
    </div>

    <!-- l'esito: la correzione, il metodo, la frase giusta — tre righe, tre mestieri -->
    <div v-if="esito" class="ing-esito" :data-esito="esito.giusta ? 'giusta' : 'sbagliata'">
      <div v-if="esito.giusta" class="ing-bene">Giusto!</div>
      <template v-else>
        <div class="ing-male">Non così.<span v-if="esito.perche" data-perche>{{ ' ' + esito.perche }}</span></div>
        <div v-if="esito.giustaEra" class="ing-era" data-giusta-era>Si dice: <b>{{ esito.giustaEra }}</b></div>
        <div v-if="esito.siFa" class="ing-come" data-si-fa><b>Si fa così:</b> {{ esito.siFa }}</div>
        <div v-if="esito.diFretta" class="ing-fretta">🐢 Troppo di fretta: leggi bene la domanda.</div>
      </template>
      <div v-if="attesa" class="ing-avanti" data-attesa>
        <i :key="giro" :style="{ animationDuration: attesa + 'ms' }"></i>
      </div>
    </div>
  </div>
</template>
