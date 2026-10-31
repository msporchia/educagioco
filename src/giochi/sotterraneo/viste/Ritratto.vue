<script setup>
// Il ritratto di chi sta sulla terra di sopra (il minatore, i sei delle missioni, il capitano, i quattro mercanti): la faccia del suo
// modello 3D (`persona:<modello>`, docs/sotterraneo/persone-3d.md); finché la foto non c'è il posto resta vuoto (docs/sotterraneo/anteprime-3d.md).
// La figura di pixel.js solo per chi un modello non ce l'ha.
import { computed } from 'vue'
import Icona from './Icona.vue'
import Pixel from './Pixel.vue'
import { MINATORE, RAGAZZA, MUGNAIO, EREMITA, GUARDIA, PESCATORE, BOSCAIOLO, ARMAIOLO, ERBORISTA, RIGATTIERE } from './pixel.js'
import { PERSONAGGI_DI_SOPRA } from '../dati/missioni.js'
import { mercanteDi } from '../dati/mercanti.js'
import { MODELLI_PERSONE } from '../dati/persone3d.js'

const props = defineProps({
  chi: { type: String, required: true },   // la chiave: 'ragazza', 'mugnaio', …, 'armaiolo', … o 'minatore'
  scala: { type: Number, default: 3 },
})

const FIGURE = { ragazza: RAGAZZA, mugnaio: MUGNAIO, eremita: EREMITA, guardia: GUARDIA, pescatore: PESCATORE,
                 boscaiolo: BOSCAIOLO, minatore: MINATORE, armaiolo: ARMAIOLO, erborista: ERBORISTA, rigattiere: RIGATTIERE }
const nome = computed(() => (PERSONAGGI_DI_SOPRA[props.chi] || mercanteDi(props.chi) || { sprite: 'minatore' }).sprite)
// il modello è quello del suo aspetto, ma il capitano (che come aspetto è la guardia) ha il suo
const modello = computed(() => (props.chi === 'capitano' ? 'capitano' : nome.value))
const chiave = computed(() => (MODELLI_PERSONE.includes(modello.value) ? `persona:${modello.value}` : null))
</script>

<template>
  <Icona v-if="chiave" :tre="chiave" :lato="20 * scala" />
  <Pixel v-else :figura="FIGURE[chi] || MINATORE" :scala="props.scala" />
</template>
