<script setup>
// Gli addobbi di una bestia (docs/fattoria3d/addobbi.md) sopra l'interfaccia unica (components/personalizza/Personalizza.vue,
// docs/core/personalizza.md), tema animali. Si apre da «Vestilo» nel foglio della bestia. Una scheda per aggancio (In testa, Sul muso,
// Al collo, Sulla schiena) e Set; un addobbo ha una forma sola e i colori della tavolozza (grafica/persona/tinte.js): il suo viene con lui,
// un'altra tinta si compra una volta (PREZZO_TINTA). Quello che è tuo si mette subito; il resto resta in prova finché non si paga.
// Le foto: la bestia vestita girata a scatti (`bestia:<id>:r<n>:<aggancio>=<addobbo@tinta>`), gli addobbi da soli (`addobbo:<id>[@tinta]`).
import { ref, computed, reactive } from 'vue'
import { TINTE } from '../../../grafica/persona/tinte.js'
import { PREZZO_TINTA, portaDi, conTinta } from '../dati/addobbi.js'
import { curabile } from '../dati/bestie.js'
import Personalizza from '../../../components/personalizza/Personalizza.vue'

const props = defineProps({
  id: { type: String, required: true },
  nome: { type: String, default: '' },
  monete: { type: Number, default: 0 },
  vestiario: { type: Array, default: () => [] },   // [{ id, nome, prezzo, dove, addosso, tinta, hai, tinte }] (Cura.vestiarioDi)
  vestiti: { type: Array, default: () => [] },     // i set salvati di questa bestia (Cura.vestitiDi)
  messaggio: { type: String, default: '' },
  anteprima: { type: Function, required: true },
  anteprimaPronta: { type: Function, required: true },
})
const emit = defineEmits(['veste', 'spoglia', 'salva-set', 'rinomina-set', 'togli-set', 'chiudi'])
const giro = ref(0)

const NOMI = { testa: 'In testa', muso: 'Sul muso', collo: 'Al collo', schiena: 'Sulla schiena' }
const posti = computed(() => portaDi((curabile(props.id) || {}).famiglia))
const schede = computed(() => [...posti.value.map(d => ({ id: d, nome: NOMI[d], tipo: 'oggetti' })), { id: 'set', nome: 'Set', tipo: 'set' }])
const IL_SUO = { id: '-', nome: 'Il suo', css: null, posseduto: true }
const voci = computed(() => posti.value.flatMap(d => [
  { id: 'niente-' + d, scheda: d, posto: d, nome: 'Niente', niente: true, dati: { 'data-addobbo': 'niente-' + d } },
  ...props.vestiario.filter(a => a.dove === d).map(a => ({
    id: a.id, scheda: d, posto: d, nome: a.nome, prezzo: a.prezzo, posseduto: a.addosso || a.hai > 0, prezzoColore: PREZZO_TINTA, dati: { 'data-addobbo': a.id },
    colori: [IL_SUO, ...TINTE.map(t => ({ id: t.id, nome: t.nome, css: t.css, posseduto: (a.tinte || []).includes(t.id), dati: { 'data-tinta': t.id } }))],
  })),
]))
const valori = (addobbi, tinte) => Object.fromEntries(posti.value.map(d => [d, addobbi[d]
  ? { oggetto: addobbi[d], forma: null, colore: (tinte && tinte[d]) || '-' } : { oggetto: 'niente-' + d, forma: null, colore: null }]))
const indossato = computed(() => valori(Object.fromEntries(props.vestiario.filter(a => a.addosso).map(a => [a.dove, a.id])), Object.fromEntries(props.vestiario.filter(a => a.addosso && a.tinta).map(a => [a.dove, a.tinta]))))
const mieiSet = computed(() => props.vestiti.map(v => ({ posto: v.posto, nome: v.nome, pezzi: valori(v.addobbi || {}, v.tinte || {}) })))

// le foto
const foto = reactive({}), chiesti = new Set()
function fotoDi(tipo) {
  if (foto[tipo]) return foto[tipo]
  const pronta = props.anteprimaPronta(tipo)
  if (pronta) return pronta
  if (!chiesti.has(tipo)) { chiesti.add(tipo); props.anteprima(tipo).then(url => { if (url) foto[tipo] = url }) }
  return ''
}
const addosso = stato => Object.entries(stato).filter(([, v]) => v && !String(v.oggetto).startsWith('niente')).map(([d, v]) => `${d}=${conTinta(v.oggetto, v.colore)}`).join(',')
const tipoBestia = (stato, r = 0) => ['bestia', props.id, ...(r ? ['r' + r] : []), ...(addosso(stato) ? [addosso(stato)] : [])].join(':')
const tipoFoto = ({ zona, voce, valore, stato }) => (zona === 'set' || !voce || voce.niente ? tipoBestia(stato) : 'addobbo:' + conTinta(voce.id, valore && valore.colore))

const metti = (posto, oggetto, colore) => (String(oggetto).startsWith('niente') ? emit('spoglia', posto) : emit('veste', { id: oggetto, tinta: colore && colore !== '-' ? colore : null }))
function scegli({ posto, oggetto, colore }) { metti(posto, oggetto, colore) }
function acquista({ pezzi }) { for (const p of pezzi) metti(p.posto, p.oggetto, p.colore) }
function indossaSet({ pezzi }) { for (const [d, v] of Object.entries(pezzi)) if (!indossato.value[d] || indossato.value[d].oggetto !== v.oggetto || indossato.value[d].colore !== v.colore) metti(d, v.oggetto, v.colore) }
</script>

<template>
  <Personalizza tema="animali" :titolo="'Vesti ' + nome" :chi="nome" valuta="🪙" :saldo="monete" :schede="schede" :voci="voci" :indossato="indossato" :miei-set="mieiSet"
                v-model:giro="giro" :avviso="messaggio" data-f3="addobbi" :data-bestia="id"
                @scegli="scegli" @acquista="acquista" @indossa-set="indossaSet" @salva-set="x => emit('salva-set', x)" @rinomina-set="x => emit('rinomina-set', x)"
                @togli-set="x => emit('togli-set', x)" @chiudi="emit('chiudi')">
    <template #anteprima="{ stato }">
      <div class="f3-add-ritratto" data-f3="addobbi-ritratto"><img v-if="fotoDi(tipoBestia(stato, giro))" :src="fotoDi(tipoBestia(stato, giro))" :alt="'Ritratto di ' + nome" draggable="false"></div>
    </template>
    <template #foto="f">
      <img v-if="fotoDi(tipoFoto(f))" class="f3-add-foto" :src="fotoDi(tipoFoto(f))" alt="" draggable="false">
    </template>
  </Personalizza>
</template>

<style>
.f3-add-ritratto { width: 100%; height: 100%; display: grid; place-items: center; }
.f3-add-ritratto img, .f3-add-foto { width: 100%; height: 100%; object-fit: contain; pointer-events: none; -webkit-user-drag: none; }
</style>
