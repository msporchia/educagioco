<script setup>
// L'eroe vestito nei pannelli (zaino, pagina dell'eroe, scelta dell'avventura): la foto del suo modello 3D con l'arma in pugno,
// lo scudo, l'armatura e il copricapo (viste/anteprima3d.js, `eroe:`). Finché la foto non c'è il riquadro resta vuoto della sua
// misura: niente sprite sotto (docs/sotterraneo/anteprime-3d.md). I segni della roba in mano (`data-in-mano`, `data-addosso`,
// `data-in-braccio`) stanno su elementi vuoti, per le prove.
import { computed } from 'vue'
import { COSE } from '../dati/cose.js'
import { usaAnteprima } from './anteprima3d.js'
import Quadro3d from './Quadro3d.vue'
import { chiaveDellEroe, EROI } from '../scena3d/anteprime3d-pura.js'

const props = defineProps({
  eroe: { type: Object, required: true },        // la scheda: sprite (o chiave), em
  mano: { type: String, default: null },         // la chiave dell'arma in pugno (COSE)
  mancina: { type: String, default: null },      // lo scudo, o la seconda arma
  scala: { type: Number, default: 3 },           // la misura del riquadro: 24 × 28 volte questa
  corpo: { type: String, default: null },        // l'armatura
  testa: { type: String, default: null },        // il copricapo (docs/sotterraneo/elmo.md)
})

const LARGO = 24   // il riquadro di sempre, in pixel di sprite: la figura (16) e un po' d'aria ai lati
const ALTO = 28

const dueMani = computed(() => !!(props.mano && COSE[props.mano] && COSE[props.mano].mani === 2))
const chi = computed(() => [props.eroe.sprite, props.eroe.chiave].find(k => EROI.includes(k)) || null)
const chiave = computed(() => (chi.value ? chiaveDellEroe(chi.value, { mano: props.mano, mancina: props.mancina, corpo: props.corpo, testa: props.testa }) : null))
const tre = usaAnteprima(() => chiave.value)
</script>

<template>
  <span class="sot-armato" :data-anteprima="tre ? '3d' : 'attesa'"
        :style="{ width: (LARGO * scala) + 'px', height: (ALTO * scala) + 'px' }">
    <span v-if="mancina && !dueMani" class="sot-pezzo" :data-in-braccio="mancina"></span>
    <span v-if="mano" class="sot-pezzo" :data-in-mano="mano" :data-addosso="mano"></span>
    <Quadro3d v-if="tre" class="sot-armato-img" :immagine="tre" />
    <b v-else-if="!chiave" class="em">{{ eroe.em }}</b>
  </span>
</template>
