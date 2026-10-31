<script setup>
// Il ritratto di chi sta sulla terra di sopra (il minatore, i sei delle missioni, il capitano, i quattro mercanti): lo sprite `<nome>-fermo-0` se l'atlante
// ce l'ha, se no la figura di pixel.js. Appena è pronta,
// la faccia del modello 3D (`persona:<modello>`, docs/sotterraneo/persone-3d.md); finché non c'è, lo sprite
import { computed } from 'vue'
import { usaAnteprima } from './anteprima3d.js'
import Quadro3d from './Quadro3d.vue'
import Pixel from './Pixel.vue'
import { figura, haFigura } from './figura.js'
import { MINATORE, RAGAZZA, MUGNAIO, EREMITA, GUARDIA, PESCATORE, BOSCAIOLO, ARMAIOLO, ERBORISTA, RIGATTIERE } from './pixel.js'
import { PERSONAGGI_DI_SOPRA } from '../dati/missioni.js'
import { mercanteDi } from '../dati/mercanti.js'

const props = defineProps({
  chi: { type: String, required: true },   // la chiave: 'ragazza', 'mugnaio', …, 'armaiolo', … o 'minatore'
  scala: { type: Number, default: 3 },
})

const FIGURE = { ragazza: RAGAZZA, mugnaio: MUGNAIO, eremita: EREMITA, guardia: GUARDIA, pescatore: PESCATORE,
                 boscaiolo: BOSCAIOLO, minatore: MINATORE, armaiolo: ARMAIOLO, erborista: ERBORISTA, rigattiere: RIGATTIERE }
const nome = computed(() => (PERSONAGGI_DI_SOPRA[props.chi] || mercanteDi(props.chi) || { sprite: 'minatore' }).sprite)
const sprite = computed(() => `${nome.value}-fermo-0`)
// il modello è quello dello sprite, ma il capitano (che come sprite è la guardia) ha il suo
const tre = usaAnteprima(() => `persona:${props.chi === 'capitano' ? 'capitano' : nome.value}`)
const vero = computed(() => (haFigura(sprite.value) ? figura(sprite.value, { scala: props.scala }) : null))
</script>

<template>
  <span v-if="tre" class="sot-icona sot-icona-3d" data-anteprima="3d" :data-anteprima-chiave="`persona:${chi === 'capitano' ? 'capitano' : nome}`"
        :style="{ width: 20 * scala + 'px', height: 20 * scala + 'px' }"><Quadro3d :immagine="tre" /></span>
  <span v-else-if="vero" class="sot-ritratto" :style="vero.gabbia"><i :style="vero.pezzo"></i></span>
  <Pixel v-else :figura="FIGURE[chi] || MINATORE" :scala="props.scala" />
</template>
