<script setup>
/* L'insegna della tana per l'altro mondo: la stoffa blu col nome e quali
   tappe ci sono di là, e la punta d'oro che scende sulla bocca. Il disegno è di
   scena/stendardo.js; chi la usa la posa con la punta sulla tana. Vedi
   docs/passo-passo/caselle-e-stendardi.md, «L'insegna delle tane». */
import { computed } from 'vue'
import { insegnaTana, stimaNome, CORPO, CORPO_SOTTO, CARATTERE, SPAZIATURA } from '../scena/stendardo.js'

const props = defineProps({
  nome: { type: String, required: true },          // «I prossimi livelli»
  sotto: { type: String, required: true },         // «dal 36 in poi»
  velato: { type: Boolean, default: false },
  scosta: { type: Number, default: 0 },            // la stoffa a destra della punta, in px (il foglietto)
})

let tela = null
function misura(testo, corpo) {
  try {
    if (!tela && typeof document !== 'undefined') tela = document.createElement('canvas').getContext('2d')
    if (tela) {
      tela.font = `700 ${corpo}px ${CARATTERE}`
      return tela.measureText(testo).width + SPAZIATURA * testo.length
    }
  } catch { /* si stima */ }
  return stimaNome(testo) * corpo / CORPO
}
const d = computed(() => insegnaTana(Math.max(misura(props.nome, CORPO), misura(props.sotto, CORPO_SOTTO)), props.scosta))
</script>

<template>
  <svg class="pp-stendardo pp-insegna-tana" :class="{ 'pp-stendardo-velato': velato }"
       :width="d.w" :height="d.h" :viewBox="`0 0 ${d.w} ${d.h}`" :style="{ marginLeft: `${-d.punta.x}px` }">
    <g :transform="`scale(${d.scala})`" shape-rendering="crispEdges">
      <rect v-for="(r, i) in d.rect" :key="i" :x="r.x" :y="r.y" :width="r.w" height="1" :fill="r.c" />
    </g>
    <text class="pp-stendardo-nome" data-nome :x="d.nome.x" :y="d.nome.y" text-anchor="middle" dominant-baseline="central"
          :font-size="CORPO">{{ nome }}</text>
    <text class="pp-stendardo-nome pp-insegna-sotto" data-sotto :x="d.sotto.x" :y="d.sotto.y" text-anchor="middle"
          dominant-baseline="central" :font-size="CORPO_SOTTO">{{ sotto }}</text>
  </svg>
</template>
