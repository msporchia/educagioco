<script setup>
// Un mostro nello scontro: la sua faccia (`Icona`) e, se è una variante armata (dati/varianti.js), l'arma in pugno sopra, una
// figura della roba posata sulla sua mano (`MANI`) e più bassa dell'originale perché stia in proporzione con lui. La faccia
// guarda a destra (lo sprite) e il campo la specchia verso l'eroe: l'arma sta nello stesso specchio, quindi dalla parte della mano.
import { computed } from 'vue'
import Icona from './Icona.vue'
import { figura } from './figura.js'
import { PEZZI } from '../dati/atlante.js'
import { MANI } from '../dati/varianti.js'

const props = defineProps({
  sprite: { type: String, default: null },
  em: { type: String, default: '' },
  scala: { type: Number, default: 2 },
  emAlto: { type: Number, default: 48 },
  tipo: { type: String, default: '' },
  arma: { type: String, default: null },
})

const inMano = computed(() => {
  const mano = MANI[props.tipo]
  const c = props.sprite && PEZZI[props.sprite], a = props.arma && PEZZI[props.arma]
  if (!mano || !c || !a) return null
  const W = c[2] * props.scala, H = c[3] * props.scala
  const s = mano.k * H / a[3]   // la scala dell'arma: alta `k` volte lo sprite
  const f = figura(props.arma, { scala: s })
  if (!f) return null
  // l'impugnatura sta a due terzi dell'arma, al centro: lì si tiene
  return { gabbia: f.gabbia, pezzo: f.pezzo,
           posto: { left: `${Math.round(mano.x * W - a[2] * s / 2)}px`, top: `${Math.round(mano.y * H - a[3] * s * 0.68)}px` } }
})
</script>

<template>
  <span class="sot-creatura">
    <Icona :sprite="sprite" :em="em" :scala="scala" :emAlto="emAlto" />
    <span v-if="inMano" class="sot-arma-in-mano" data-arma-in-mano :data-arma="arma" :style="{ ...inMano.gabbia, ...inMano.posto }">
      <i :style="inMano.pezzo"></i>
    </span>
  </span>
</template>
