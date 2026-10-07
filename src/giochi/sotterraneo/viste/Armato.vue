<script setup>
// L'eroe come lo si vede in discesa: fermo, con l'arma in pugno e lo scudo dall'altra parte, alla stessa scala
// della figura (scena/tela.js `arma`: il pugno sta 0,42 caselle a lato e in basso, lo scudo è girato). Serve alle
// carte fuori dalla discesa e all'eroe che cammina sulla terra di sopra (`posa`, `fotogramma`): un bambino riconosce lo spadone dal
// ritratto prima di leggere i numeri. Diverso dal campo: l'arma a due mani sta lo stesso a lato e non in mezzo,
// perché a questa scala, davanti al corpo, lo nasconde (uno spadone è alto quanto l'eroe).
import { computed } from 'vue'
import { figura } from './figura.js'
import { pezzoAndante } from '../dati/tessere.js'
import { PEZZI } from '../dati/atlante.js'
import { COSE } from '../dati/cose.js'

const props = defineProps({
  eroe: { type: Object, required: true },        // la scheda: sprite, em
  mano: { type: String, default: null },         // la chiave dell'arma in pugno (COSE)
  mancina: { type: String, default: null },      // lo scudo, o la seconda arma
  scala: { type: Number, default: 3 },           // intera: uno sprite a scala storta esce a pixel disuguali
  posa: { type: String, default: 'fermo' },      // 'corsa' quando cammina: l'arma resta in pugno
  fotogramma: { type: Number, default: 0 },
})

const T = 16       // la casella del campo, in pixel di sprite
const ALTO = 28    // l'eroe fermo: 16 × 28
const MARGINE = 4  // un po' d'aria ai lati, dove l'arma esce dal corpo

const corpo = computed(() => figura(pezzoAndante(props.eroe.sprite, props.posa, props.fotogramma), { scala: props.scala }))
const larga = computed(() => (T + 2 * MARGINE) * props.scala)

const dueMani = computed(() => !!(props.mano && COSE[props.mano] && COSE[props.mano].mani === 2))

// un pezzo posato con i piedi (il fondo) un pixel sopra quelli dell'eroe, centrato `verso` caselle dal centro
function posato(chiave, verso, dy = 0, specchia = false) {
  const cosa = COSE[chiave]
  const p = cosa && cosa.sprite ? PEZZI[cosa.sprite] : null
  if (!p) return null
  const f = figura(cosa.sprite, { scala: props.scala })
  const s = props.scala
  const x = (MARGINE + T / 2 + verso * T * 0.42) * s - p[2] * s / 2
  const y = (ALTO - T * 0.08 - p[3] + dy) * s
  return {
    chiave, gabbia: f.gabbia, pezzo: f.pezzo,
    posto: { left: `${Math.round(x)}px`, top: `${Math.round(y)}px`, transform: specchia ? 'scaleX(-1)' : null },
  }
}

const inPugno = computed(() => (props.mano ? posato(props.mano, 1) : null))
const inBraccio = computed(() => (props.mancina && !dueMani.value ? posato(props.mancina, -1, 0, true) : null))
</script>

<template>
  <span class="sot-armato" :style="{ width: larga + 'px', height: (ALTO * scala) + 'px' }">
    <span class="sot-ritratto" :style="corpo ? { ...corpo.gabbia, left: MARGINE * scala + 'px' } : null">
      <i v-if="corpo" :style="corpo.pezzo"></i>
      <b v-else class="em">{{ eroe.em }}</b>
    </span>
    <!-- lo scudo prima: se si toccano, copre l'arma buona e non il contrario -->
    <span v-if="inBraccio" class="sot-pezzo" :data-in-braccio="inBraccio.chiave"
          :style="{ ...inBraccio.gabbia, ...inBraccio.posto }">
      <i :style="inBraccio.pezzo"></i>
    </span>
    <span v-if="inPugno" class="sot-pezzo" :data-in-mano="inPugno.chiave" :data-addosso="inPugno.chiave"
          :style="{ ...inPugno.gabbia, ...inPugno.posto }">
      <i :style="inPugno.pezzo"></i>
    </span>
  </span>
</template>
