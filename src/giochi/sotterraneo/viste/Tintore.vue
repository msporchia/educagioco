<script setup>
// Il foglio del tintore (docs/sotterraneo/tintore.md) sopra l'interfaccia unica (components/personalizza/Personalizza.vue,
// docs/core/personalizza.md), tema del sotterraneo. Schede per posto (Armi, Difese, Copricapi); le voci sono i pezzi da ritingere (addosso o
// nello zaino), una forma sola, e i colori la tavolozza a quindici: ogni tinta nuova costa `costo` gemme, ogni volta. Un tocco su un colore
// lo prova sull'eroe grande (il pezzo addosso, anche se è nello zaino); «Acquista e indossa» paga e il pezzo resta di quel colore.
// La logica è in motore/tintore.js; le foto sono l'eroe disegnato adesso col pezzo e la tinta in prova (Armato, chiavi `:@<tinte>` e `:r<n>`).
import { computed, ref } from 'vue'
import { TINTE } from '../dati/tinte.js'
import Personalizza from '../../../components/personalizza/Personalizza.vue'
import Armato from './Armato.vue'

const props = defineProps({
  eroe: { type: Object, required: true },        // la scheda: sprite, em
  pezzi: { type: Array, default: () => [] },     // [{ k, nome, em, dove, addosso, tinta }] (motore/tintore.js, pezziDaTingere)
  addosso: { type: Object, default: () => ({}) }, // quello che l'eroe ha addosso: { mano, mancina, corpo, testa } (chiavi)
  tinte: { type: Object, default: () => ({}) },  // le tinte di adesso, per chiave di pezzo
  gemme: { type: Number, default: 0 },
  costo: { type: Number, required: true },
  detto: { type: String, default: null },        // l'ultima cosa successa (un pezzo tinto, le gemme che mancano)
})
const emit = defineEmits(['tingi', 'chiudi'])
const giro = ref(0)
const scelto = ref(null)                          // il pezzo toccato per ultimo: si vede addosso all'eroe grande

const SCHEDE = [
  { id: 'armi', nome: 'Armi', tipo: 'oggetti', posti: ['mano'] },
  { id: 'difese', nome: 'Difese', tipo: 'oggetti', posti: ['mancina', 'corpo'] },
  { id: 'copricapi', nome: 'Copricapi', tipo: 'oggetti', posti: ['testa'] },
]
const schedaDel = dove => (SCHEDE.find(s => s.posti.includes(dove)) || SCHEDE[0]).id
// ogni pezzo è un posto a sé (si ritinge quel pezzo, non quello che sta in mano): il valore è il suo colore
const voci = computed(() => props.pezzi.map(p => ({
  id: p.k, scheda: schedaDel(p.dove), posto: p.k, nome: p.nome, dati: { 'data-pezzo': p.k, 'data-tinto': p.tinta || null },
  colori: TINTE.map(t => ({ id: t.id, nome: t.nome, css: t.css, prezzo: props.costo, posseduto: t.id === p.tinta, dati: { 'data-tinta': t.id } })),
})))
const indossato = computed(() => Object.fromEntries(props.pezzi.map(p => [p.k, { oggetto: p.k, forma: null, colore: p.tinta || '-' }])))
const doveDi = k => (props.pezzi.find(p => p.k === k) || {}).dove

// l'eroe come lo si vede: il pezzo scelto indossato, con le tinte in prova
function vestito(k) {
  const v = { mano: props.addosso.mano || null, mancina: props.addosso.mancina || null, corpo: props.addosso.corpo || null, testa: props.addosso.testa || null }
  if (k && doveDi(k)) v[doveDi(k)] = k
  return v
}
const tinteDi = stato => {
  const t = { ...props.tinte }
  for (const [k, v] of Object.entries(stato || {})) if (v && v.colore && v.colore !== '-') t[k] = v.colore
  return t
}
function segna({ posto }) { scelto.value = posto }
function acquista({ pezzi }) { for (const p of pezzi) emit('tingi', p.posto, p.colore) }
</script>

<template>
  <Personalizza tema="sotterraneo" titolo="Il tintore" :chi="eroe.nome || ''" valuta="💎" :saldo="gemme" :schede="SCHEDE" :voci="voci" :indossato="indossato"
                v-model:giro="giro" :avviso="detto || ''" :aiuto="pezzi.length ? `Tocca un pezzo e un colore: lo vedi addosso. Ogni tinta costa ${costo} 💎.` : 'Non hai niente da ritingere: armi, scudi, armature e cappelli.'"
                data-tintore :data-gemme="gemme" @scegli="segna" @prova="segna" @acquista="acquista" @chiudi="emit('chiudi')">
    <template #anteprima="{ stato }">
      <Armato :eroe="eroe" v-bind="vestito(scelto)" :tinte="tinteDi(stato)" :giro="giro" :scala="7" />
    </template>
    <template #foto="{ voce, stato }">
      <Armato v-if="voce" :eroe="eroe" v-bind="vestito(voce.id)" :tinte="tinteDi(stato)" :scala="2.3" />
    </template>
  </Personalizza>
</template>
