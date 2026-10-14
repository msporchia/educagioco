<script setup>
// La figura di un mostro grosso (dati/grossi.js, `figuraDelGrosso`) fuori dal campo: nello scontro e nella sua barra in cima.
// Lo sprite dipinto se l'atlante ha `grosso-<chiave>-fermo-0`; se no quello della sua specie, ingrandito, con la corona.
// `scala`: i pixel di schermo per ogni pixel dello sprite dell'eroe; il grosso ha la sua (`scalaDelGrosso`, dati/grossi.js: la scatola in cui sta,
// a quarti) e la corona proporzionata alla figura, non grande quanto mezzo mostro
import { computed, ref, watch } from 'vue'
import { figura } from './figura.js'
import { ATLANTE, PEZZI } from '../dati/atlante.js'
import { GROSSI, figuraDelGrosso, spriteDelGrosso, scalaDelGrosso } from '../dati/grossi.js'

const props = defineProps({
  chi: { type: String, required: true },
  scala: { type: Number, default: 2 },
})
const G = computed(() => GROSSI[props.chi])
const F = computed(() => figuraDelGrosso(props.chi))
const corpo = computed(() => {
  const f = F.value
  if (!f) return null
  return figura(spriteDelGrosso(f, 'scontro', 0), { scala: scalaDelGrosso(props.chi, props.scala) })
})
// i fotogrammi sono quadrati con righe vuote in cima: la corona si posa dove comincia la testa, non in cima alla scatola
// (come in scena/tela.js con `vuotoSopra`). Si misura una volta per sprite, sul foglio
const vuoti = new Map()
let immagine = null
const caricaIlFoglio = () => (immagine = immagine || new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = ATLANTE }))
const vuoto = ref(0)   // righe vuote in cima allo sprite, in pixel dello sprite
watch(() => (F.value && !F.value.dipinto ? spriteDelGrosso(F.value, 'scontro', 0) : null), async nome => {
  vuoto.value = 0
  const p = nome && PEZZI[nome]
  if (!p) return
  if (!vuoti.has(nome)) {
    const img = await caricaIlFoglio()
    const [sx, sy, w, h] = p
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    const g = c.getContext('2d')
    g.drawImage(img, sx, sy, w, h, 0, 0, w, h)
    const d = g.getImageData(0, 0, w, h).data
    let r = 0
    while (r < h && !Array.from({ length: w }, (_, x) => d[(r * w + x) * 4 + 3]).some(a => a > 0)) r++
    vuoti.set(nome, r)
  }
  vuoto.value = vuoti.get(nome)
}, { immediate: true })
const scalaVera = computed(() => (corpo.value && F.value ? parseFloat(corpo.value.gabbia.height) / PEZZI[spriteDelGrosso(F.value, 'scontro', 0)][3] : 1))
// la corona è larga un terzo della figura, fra 14 e 24 px (la scritta è un'emoji: il corpo è un po' meno della larghezza)
const corona = computed(() => (corpo.value ? Math.max(14, Math.min(24, Math.round(parseFloat(corpo.value.gabbia.width) * 0.3))) : 0))
</script>

<template>
  <span v-if="corpo" class="sot-grosso-fig" data-figura-grosso :style="{ '--tinta': G.tinta }">
    <span class="sot-ritratto" :style="corpo.gabbia"><i :style="corpo.pezzo"></i></span>
    <b v-if="!F.dipinto" class="sot-corona em" :style="{ fontSize: corona + 'px', top: Math.round(vuoto * scalaVera) + 'px' }">👑</b>
  </span>
</template>
