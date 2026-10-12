<script setup>
// La fila dei turni (docs/sotterraneo/scontro.md, «L'iniziativa»): una colonna stretta in sovrimpressione sul bordo destro del
// fondale, i prossimi sette in ordine, figurine piccole. Chi agisce adesso, in cima, è più grande; il doppio turno dell'eroe si
// vede perché compare due volte. Lo stordito che salterà il turno è smorzato. Non decide niente: la fila la fa il motore
// (`foglio.turni`), e durante il racconto di un turno scorre da sé (viste/racconto.js, `fx.fila`).
import { computed, TransitionGroup } from 'vue'
import { PEZZI } from '../dati/atlante.js'
import Icona from './Icona.vue'
import Glifo from './Glifo.vue'

const props = defineProps({
  turni: { type: Array, default: () => [] },   // [{ chi: 'eroe' | posto, salta, id? }]
  mostri: { type: Array, required: true },
  eroe: { type: Object, default: () => ({}) },
})

const LATO = 22   // le figurine piccole stanno in una scatola di 22 px; chi è più alto o più largo si rimpicciolisce
const voci = computed(() => props.turni.map((t, k) => {
  const e = t.chi === 'eroe'
  const m = e ? null : props.mostri[t.chi]
  const sprite = e ? props.eroe.sprite : m && (m.grosso ? m.sprite : m.sprite)
  const p = sprite && PEZZI[sprite]
  // il primo è più grande: scala 2 se ci sta nella sua scatola (36 px), se no 1
  const adesso = k === 0
  const scala = adesso && p && p[2] * 2 <= 34 && p[3] * 2 <= 38 ? 2 : 1
  const riduci = !adesso && p ? Math.min(1, LATO / p[3], LATO / p[2]) : 1
  return { id: t.id != null ? 'f' + t.id : 'v' + k, eroe: e, chi: t.chi, salta: t.salta, adesso, sprite, em: e ? props.eroe.em : m && m.em,
           scala, riduci, nome: e ? 'tu' : m && m.nome, grosso: !!(m && m.grosso) }
}))
</script>

<template>
  <TransitionGroup name="sot-fila" tag="div" class="sot-fila" data-fila>
    <div v-for="v in voci" :key="v.id" class="sot-turno" data-turno :data-chi="v.chi"
         :class="{ 'sot-adesso': v.adesso, 'sot-turno-eroe': v.eroe, 'sot-turno-salta': v.salta, 'sot-turno-grosso': v.grosso }"
         :title="v.nome">
      <span class="sot-turno-fig" :style="v.riduci < 1 ? { transform: `scale(${v.riduci})` } : null">
        <Icona :sprite="v.sprite" :em="v.em" :scala="v.scala" :emAlto="18" />
      </span>
      <Glifo v-if="v.salta" class="sot-turno-stelle" nome="stelle" :misura="12" />
    </div>
  </TransitionGroup>
</template>
