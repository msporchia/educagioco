<script setup>
/* Il nome di un'isola: uno stendardo appeso a un'asta, con lo stemma
   dell'icona del capitolo; o, senza nome (`solo-stemma`), lo scudo solo, per
   le isolette. Il disegno è di scena/stendardo.js, il nome è testo vero e
   la stoffa si allarga quanto serve. Chi lo usa lo posa (un `style`).
   Vedi docs/passo-passo/mappa.md, «Gli stendardi». */
import { computed } from 'vue'
import { stendardo, stemma, stimaNome, CORPO, CARATTERE, SPAZIATURA } from '../scena/stendardo.js'

const props = defineProps({
  nome: { type: String, default: '' },
  icona: { type: String, required: true },
  animale: { type: String, default: 'coniglio' },
  velato: { type: Boolean, default: false },
  max: { type: Number, default: Infinity },          // quanto può essere largo: il nome si stringe
  soloStemma: { type: Boolean, default: false },
})

// la larghezza vera del nome, col carattere vero (dove si può: in un browser)
let tela = null
function misura(nome) {
  try {
    if (!tela && typeof document !== 'undefined') tela = document.createElement('canvas').getContext('2d')
    if (tela) {
      tela.font = `700 ${CORPO}px ${CARATTERE}`
      return tela.measureText(nome).width + SPAZIATURA * nome.length
    }
  } catch { /* si stima */ }
  return stimaNome(nome)
}

const d = computed(() => (props.soloStemma ? null : stendardo(misura(props.nome), props.animale, props.max)))
const s = computed(() => (props.soloStemma ? stemma(props.animale) : null))
const figura = computed(() => d.value || s.value)
const emoji = computed(() => (d.value ? d.value.scudo : s.value.campo))
</script>

<template>
  <svg class="pp-stendardo" :class="['pp-stendardo-' + animale, { 'pp-stendardo-velato': velato }]"
       :width="figura.w" :height="figura.h" :viewBox="`0 0 ${figura.w} ${figura.h}`">
    <g :transform="`scale(${figura.scala})`" shape-rendering="crispEdges">
      <rect v-for="(r, i) in figura.rect" :key="i" :x="r.x" :y="r.y" :width="r.w" height="1" :fill="r.c" />
    </g>
    <text class="pp-stemma-icona pp-em" :x="emoji.x" :y="emoji.y" text-anchor="middle" dominant-baseline="central">{{ icona }}</text>
    <text v-if="d" class="pp-stendardo-nome" :x="d.testo.x" :y="d.testo.y" text-anchor="middle" dominant-baseline="central"
          :font-size="CORPO" :textLength="d.stretto ? d.testoW : null" lengthAdjust="spacingAndGlyphs">{{ nome }}</text>
  </svg>
</template>
