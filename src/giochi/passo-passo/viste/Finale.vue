<script setup>
/* Il cartello di fine — il coniglio è a casa. Niente cartello di partita
   persa: una fila sbagliata si riprova e basta, questo compare solo in
   tana. Le quattro stelle: vedi docs/passo-passo/stelle-e-aiuti.md. */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Festa from '../../Festa.vue'
import { usaTasti } from '../../tastiera.js'
import TastoTastiera from '../../../components/TastoTastiera.vue'

const props = defineProps({
  che: { type: String, default: 'tappa' },        // tappa | sentiero
  titolo: { type: String, required: true },
  stelle: { type: Number, default: 1 },
  carota: { type: Boolean, default: false },
  /* una tappa del cane: la prima stella è il gregge nel recinto, la
     seconda l'osso */
  cane: { type: Boolean, default: false },
  /* una tappa del guerriero: la principessa, e la corona */
  guerriero: { type: Boolean, default: false },
  svelato: { type: Boolean, default: false },     // la strada l'ha scritta tutta il gioco
  monete: { type: Number, default: 0 },
  racconto: { type: String, default: '' },
  prossima: { type: Boolean, default: false },    // c'è una tappa dopo, ed è aperta
  frase: { type: String, default: '' },           // il sentiero: di fila, e il record
  record: { type: Boolean, default: false },
  amici: { type: String, default: '' },           // la serie chiusa contro i record degli amici, in parole
  /* la strada più corta: quante carte bastavano, quante ne sono servite,
     e se era la più corta (la quarta stella) */
  minimo: { type: Number, default: 0 },
  usate: { type: Number, default: 0 },
  corta: { type: Boolean, default: false },
  zaino: { type: Boolean, default: false },
  lunga: { type: Boolean, default: false },       // si poteva fare con meno: la riga lo dice
  mappa: { type: Boolean, default: true },        // a scuola la mappa non c'è (docs/passo-passo/scuola.md)
})
const emit = defineEmits(['avanti', 'rigioca', 'mappa'])

const parola = computed(() => props.zaino ? 'carte' : 'frecce')
const meta = computed(() => (props.guerriero ? '👸' : props.cane ? '🐑' : '🏡'))

const CIECA = 320
const pronto = ref(false)
let sveglia = 0
onMounted(() => { sveglia = setTimeout(() => { pronto.value = true }, CIECA) })
onUnmounted(() => clearTimeout(sveglia))

/* a scuola anche dalla tastiera (docs/passo-passo/regole.md, «La tastiera»): Invio o Spazio come il tasto grande (il
   livello dopo, o di nuovo questo se un dopo non c'è), R rigioca; non prima che i tasti si accendano */
const conAvanti = computed(() => props.prossima || props.che === 'sentiero')
const grande = () => pronto.value && emit(conAvanti.value ? 'avanti' : 'rigioca')
usaTasti({
  Enter: grande, Spazio: grande,
  r: () => pronto.value && props.che === 'tappa' && emit('rigioca'),
})
</script>

<template>
  <div class="pp-velo" :data-fine="che">
    <!-- i coriandoli a ogni tappa, ma nel sentiero solo sul record: a ogni
         sentiero sarebbero una festa che non vuol dire più niente -->
    <Festa v-if="che === 'tappa' || record" :quanti="che === 'tappa' ? 110 : 70" />
    <div class="pp-cartello">
      <div class="pp-faccia pp-em">{{ che === 'tappa' ? meta : cane ? '🦴' : '🥕' }}</div>
      <h2>{{ titolo }}</h2>

      <div v-if="che === 'tappa'" class="pp-tre" data-stelle-prese :data-quante="stelle">
        <span class="pp-una">
          <span class="pp-em pp-grande">⭐</span><span class="pp-em">{{ meta }}</span>
        </span>
        <span class="pp-una" :class="{ 'pp-spenta': !carota }">
          <span class="pp-em pp-grande">⭐</span><span class="pp-em">{{ guerriero ? '👑' : cane ? '🦴' : '🥕' }}</span>
        </span>
        <span class="pp-una" :class="{ 'pp-spenta': svelato }" data-stella-pensata>
          <span class="pp-em pp-grande">⭐</span><span class="pp-em">🧠</span>
        </span>
        <span class="pp-una" :class="{ 'pp-spenta': !corta }" data-stella-corta>
          <span class="pp-em pp-grande">⭐</span>
          <span class="pp-meta"><span class="pp-em">🎯</span>{{ minimo || '' }}</span>
        </span>
      </div>

      <p v-if="lunga" class="pp-accorcia" data-accorcia :data-minimo="minimo" :data-usate="usate">
        Si può fare con {{ minimo }} {{ parola }}: tu ne hai usate {{ usate }}.
      </p>
      <p v-if="frase" class="pp-frase" :class="{ 'pp-record': record }" data-primato>{{ frase }}</p>
      <p v-if="amici" class="pp-frase pp-contro-amici" data-contro-amici>{{ amici }}</p>
      <p v-if="monete" class="pp-monete">+{{ monete }} 🪙</p>
      <p v-if="racconto" class="pp-racconto">{{ racconto }}</p>

      <div class="pp-scelte">
        <button v-if="mappa" class="pp-piccolo" data-azione="mappa" aria-label="alla mappa" :disabled="!pronto"
                @click="$emit('mappa')"><span class="pp-em">🗺️</span></button>
        <button v-if="che === 'tappa'" class="pp-piccolo" data-azione="rigioca" aria-label="rigioca"
                :disabled="!pronto" @click="$emit('rigioca')"><span class="pp-em">🔁</span>
          <TastoTastiera class="pp-tasto-tastiera" :nome="conAvanti ? 'R' : '↵'" /></button>
        <button v-if="conAvanti" class="pp-grosso" data-azione="avanti" aria-label="avanti"
                :disabled="!pronto" @click="$emit('avanti')">
          <svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="M-9 -14 L15 0 L-9 14 Z" /></svg>
          <TastoTastiera class="pp-tasto-tastiera" nome="↵" />
        </button>
      </div>
    </div>
  </div>
</template>
