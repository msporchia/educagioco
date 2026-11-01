<script setup>
// La fila dei turni (docs/sotterraneo/scontro.md, «L'iniziativa»): una colonna stretta in sovrimpressione sul bordo destro del
// fondale, i prossimi sette in ordine, figurine piccole. Chi agisce adesso, in cima, è più grande; il doppio turno dell'eroe si
// vede perché compare due volte. Lo stordito che salterà il turno è smorzato. Non decide niente: la fila la fa il motore
// (`foglio.turni`), e durante il racconto di un turno scorre da sé (viste/racconto.js, `fx.fila`).
import { computed, TransitionGroup } from 'vue'
import Icona from './Icona.vue'
import Glifo from './Glifo.vue'
import { chiaveDellEroe, chiaveDelMostro } from '../scena3d/anteprime3d-pura.js'

const props = defineProps({
  turni: { type: Array, default: () => [] },   // [{ chi: 'eroe' | posto, salta, id? }]
  mostri: { type: Array, required: true },
  eroe: { type: Object, default: () => ({}) },
  incanti: { type: Array, default: () => [] },   // gli incanti preparati addosso: sul primo turno dell'eroe quello che finisce prima, coi passi che restano
})

// le facce sono le foto dei modelli (eroe a mezzo busto, mostri dalla testa a metà corpo), già della misura giusta; senza chiave l'emoji
const voci = computed(() => props.turni.map((t, k) => {
  const e = t.chi === 'eroe'
  const m = e ? null : props.mostri[t.chi]
  const adesso = k === 0   // il primo è più grande
  return { id: t.id != null ? 'f' + t.id : 'v' + k, eroe: e, primoEroe: e && !props.turni.slice(0, k).some(x => x.chi === 'eroe'), chi: t.chi, salta: t.salta, adesso, em: e ? props.eroe.em : m && m.em,
           nome: e ? 'tu' : m && m.nome, grosso: !!(m && m.grosso),
           tre: e ? (props.eroe.chi ? chiaveDellEroe(props.eroe.chi, props.eroe, 'busto') : null) : chiaveDelMostro(m) }
}))
// l'incanto che finisce prima, quello che conta di più saperlo
const piuCorto = computed(() => [...props.incanti].sort((a, b) => a.passi - b.passi)[0] || { passi: 0, glifo: 'scudo', tinta: '#fff' })
</script>

<template>
  <TransitionGroup name="sot-fila" tag="div" class="sot-fila" data-fila>
    <div v-for="v in voci" :key="v.id" class="sot-turno" data-turno :data-chi="v.chi"
         :class="{ 'sot-adesso': v.adesso, 'sot-turno-eroe': v.eroe, 'sot-turno-salta': v.salta, 'sot-turno-grosso': v.grosso }"
         :title="v.nome">
      <span class="sot-turno-fig">
        <Icona :em="v.em" :emAlto="18" :tre="v.tre" :lato="v.adesso ? 34 : 24" />
      </span>
      <Glifo v-if="v.salta" class="sot-turno-stelle" nome="stelle" :misura="12" />
      <span v-if="v.primoEroe && incanti.length" class="sot-turno-incanto" data-incanto-fila :data-passi="piuCorto.passi" :style="{ '--tinta': piuCorto.tinta }">
        <Glifo :nome="piuCorto.glifo" :misura="9" /><b>{{ piuCorto.passi }}</b>
      </span>
    </div>
  </TransitionGroup>
</template>
