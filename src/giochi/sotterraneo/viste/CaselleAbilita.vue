<script setup>
// La scelta dello scontro, in due fasi (docs/sotterraneo/abilita.md): prima si sceglie cosa fare, poi compare la domanda
// per quel colpo. «Attacco» è la prima riga e la principale; sotto le abilità che si portano, ognuna con quello che fa
// contro questo mostro (coi numeri veri); in fondo bere una pozione e scappare, che prima stavano in un menu a parte
// quando si stava per cadere. Un tocco sceglie e va avanti: niente da confermare. Non calcola niente: riceve dal
// motore cosa si può fare e perché no. Per i primi 320 ms i tasti non sentono il tocco (il click che il dito lascia
// dietro alla risposta atterrerebbe qui: docs/core/interfaccia.md, «I tempi»).
import { ref, onMounted, onUnmounted } from 'vue'
import { CIECA } from '../../pausa.js'
import Medaglione from './Medaglione.vue'
import Glifo from './Glifo.vue'
import { DETTO_DEL_PERICOLO } from '../motore/pericolo.js'

defineProps({
  attacco: { type: String, required: true },  // «fai 6 di danno»
  caselle: { type: Array, required: true },   // [{ id, glifo, tinta, nome, costo, dice, perche } | null]
  energia: { type: Number, required: true },
  energiaMax: { type: Number, required: true },
  bevi: { type: Object, default: null },      // { cura, n }: la pozione che si berrebbe, e quante ne restano
  scappa: { type: Object, default: null },    // { graffio }: il costo della fuga; null se il graffio farebbe cadere
  pericolo: { type: Object, default: null },  // { perche, nome, em, vita, male }: il mostro ringhia, si sta per cadere
})
const emit = defineEmits(['scegli', 'bevi', 'scappa'])

const pronto = ref(false)
let cieca = 0
onMounted(() => { cieca = setTimeout(() => { pronto.value = true }, CIECA) })
onUnmounted(() => clearTimeout(cieca))
const vai = (che, ...a) => { if (pronto.value) emit(che, ...a) }
</script>

<template>
  <div class="sot-abilita" data-caselle-abilita :data-energia="energia" :data-pronto="pronto || null">
    <p v-if="pericolo" class="sot-ringhio-detto" data-ringhio :data-perche="pericolo.perche" role="alert">
      <b>Attenzione!</b>
      {{ DETTO_DEL_PERICOLO[pericolo.perche] }}
      <span class="em">❤️ <b>{{ pericolo.vita }}</b> · sbagliando ti toglie <b>{{ pericolo.male }}</b></span>
    </p>
    <button type="button" class="sot-scelta sot-pronta" data-azione="attacco" @click="vai('scegli', null)">
      <span class="sot-scelta-icona"><Glifo nome="spada" :misura="22" /></span>
      <span class="sot-scelta-testo"><b>Attacco</b><small>{{ attacco }}</small></span>
      <span class="sot-scelta-costo">gratis</span>
    </button>
    <template v-for="(a, i) in caselle" :key="a ? a.id : 'vuota' + i">
      <!-- spenta non si tocca: dice cosa manca -->
      <button v-if="a" type="button" class="sot-scelta" :class="{ 'sot-spenta': !!a.perche }"
              data-azione="prepara" :data-abilita="a.id" :disabled="!!a.perche" @click="vai('scegli', a.id)">
        <Medaglione :glifo="a.glifo" :tinta="a.tinta" :stato="a.perche ? 'chiuso' : 'preso'" :misura="28" />
        <span class="sot-scelta-testo"><b>{{ a.nome }}</b><small>{{ a.perche && a.perche !== 'poca energia' ? a.perche : a.dice }}</small></span>
        <span class="sot-scelta-costo" :class="{ 'sot-poca': a.perche === 'poca energia' }"><Glifo nome="energia" :misura="11" /> {{ a.costo }}</span>
      </button>
    </template>
    <div v-if="bevi || scappa" class="sot-scelta-sep"></div>
    <button v-if="bevi" type="button" class="sot-scelta sot-scelta-bevi" data-azione="bevi-scontro" @click="vai('bevi')">
      <span class="sot-scelta-icona em">🧪</span>
      <span class="sot-scelta-testo"><b>Bevi una pozione</b><small>{{ bevi.cura ? `ti guarisce di ${bevi.cura} punti di vita` : 'ti rimette in forze' }} · ne hai {{ bevi.n }}</small></span>
    </button>
    <button v-if="scappa" type="button" class="sot-scelta sot-scelta-scappa" data-azione="scappa" @click="vai('scappa')">
      <span class="sot-scelta-icona em">🏃</span>
      <span class="sot-scelta-testo"><b>Scappa via</b><small>ti costa {{ scappa.graffio }} di vita</small></span>
    </button>
  </div>
</template>
