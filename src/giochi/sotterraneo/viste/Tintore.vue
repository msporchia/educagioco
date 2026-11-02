<script setup>
// Il foglio del tintore (docs/sotterraneo/tintore.md): si sceglie un pezzo (addosso o nello zaino), poi un colore della tavolozza, e si
// vede subito sull'eroe che lo indossa; «Tingi» paga (`costo` gemme) e il pezzo resta di quel colore. La logica è in motore/tintore.js.
import { computed, ref, watch } from 'vue'
import { TINTE, TINTA_DI } from '../dati/tinte.js'
import Foglio from './Foglio.vue'
import Armato from './Armato.vue'

const props = defineProps({
  eroe: { type: Object, required: true },        // la scheda: sprite, em
  pezzi: { type: Array, default: () => [] },     // [{ k, nome, em, dove, addosso, tinta }] (motore/tintore.js, pezziDaTingere)
  addosso: { type: Object, default: () => ({}) }, // quello che l'eroe ha addosso: { mano, mancina, corpo, testa } (chiavi)
  tinte: { type: Object, default: () => ({}) },  // le tinte di adesso, per chiave di pezzo
  gemme: { type: Number, default: 0 },
  costo: { type: Number, required: true },
  detto: { type: String, default: null },        // l'ultima cosa successa (un pezzo tinto, le gemme che mancano)
})
const emit = defineEmits(['tingi', 'chiudi'])

const scelto = ref(null)   // la chiave del pezzo
const prova = ref(null)    // il colore provato (id)
const pezzo = computed(() => props.pezzi.find(p => p.k === scelto.value) || null)
// un pezzo che sparisce (non succede qui, ma la lista è di chi apre) non resta scelto
watch(pezzo, p => { if (!p) { scelto.value = null; prova.value = null } })

function sceglie(p) { scelto.value = p.k; prova.value = p.tinta }

// l'eroe come lo si vede: il pezzo scelto indossato (anche se è nello zaino), col colore provato
const vestito = computed(() => {
  const v = { mano: props.addosso.mano || null, mancina: props.addosso.mancina || null, corpo: props.addosso.corpo || null, testa: props.addosso.testa || null }
  if (pezzo.value && v[pezzo.value.dove] !== undefined) v[pezzo.value.dove] = pezzo.value.k
  return v
})
const tinteViste = computed(() => (pezzo.value ? { ...props.tinte, [pezzo.value.k]: prova.value || undefined } : props.tinte))

const basta = computed(() => props.gemme >= props.costo)
const uguale = computed(() => !!pezzo.value && (prova.value || null) === (pezzo.value.tinta || null))
const puoi = computed(() => !!pezzo.value && !!prova.value && !uguale.value && basta.value)
</script>

<template>
  <Foglio centro con-chiudi em="🎨" titolo="Il tintore" data-tintore :data-gemme="gemme"
          :dice="`Scegli un pezzo e un colore: ${costo} 💎. Il pezzo resta quello che è, cambia solo il colore, e lo tiene anche in tasca.`"
          @chiudi="emit('chiudi')">
    <p class="sot-tintore-gemme" data-tintore-gemme>Hai <b>{{ gemme }}</b> 💎</p>
    <div class="sot-tintore-corpo">
      <Armato :eroe="eroe" :mano="vestito.mano" :mancina="vestito.mancina" :corpo="vestito.corpo" :testa="vestito.testa" :tinte="tinteViste" :scala="4" />
      <ul class="sot-tintore-pezzi">
        <li v-for="p in pezzi" :key="p.k">
          <button type="button" class="sot-scelta-breve" :class="{ 'sot-scelto': p.k === scelto }" :data-pezzo="p.k" :data-tinto="p.tinta || null"
                  :aria-pressed="p.k === scelto" @click="sceglie(p)">
            <span class="em">{{ p.em }}</span> {{ p.nome }}
            <small>{{ p.addosso ? 'addosso' : 'nello zaino' }}{{ p.tinta ? ' · ' + TINTA_DI[p.tinta].nome.toLowerCase() : '' }}</small>
          </button>
        </li>
        <li v-if="!pezzi.length" class="sot-tintore-vuoto">Non hai niente da ritingere: armi, scudi, armature e cappelli.</li>
      </ul>
    </div>

    <div v-if="pezzo" class="sot-tinte" data-tinte="pezzo">
      <small>Colore</small>
      <button v-for="t in TINTE" :key="t.id" type="button" class="sot-tinta" :class="{ 'sot-scelto': prova === t.id }"
              :style="{ background: t.css }" :data-tinta="t.id" :aria-label="t.nome" :aria-pressed="prova === t.id" @click="prova = t.id"></button>
    </div>

    <p v-if="detto" class="sot-tintore-detto" data-tintore-detto>{{ detto }}</p>
    <button v-if="pezzo" class="sot-grosso sot-compra" data-azione="tingi" :disabled="!puoi" @click="emit('tingi', pezzo.k, prova)">
      Tingi · {{ costo }} 💎
      <small v-if="!basta">ti mancano {{ costo - gemme }} 💎</small>
      <small v-else-if="uguale">scegli un altro colore</small>
    </button>
  </Foglio>
</template>
