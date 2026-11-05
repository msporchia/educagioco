<script setup>
// Gli addobbi di una bestia (docs/fattoria3d/addobbi.md) sopra l'interfaccia unica (components/personalizza/Personalizza.vue,
// docs/core/personalizza.md), tema animali. Si apre dal tasto nel foglio della bestia; la ✕ torna al foglio. Una scheda per aggancio e Set;
// un addobbo ha una forma sola e i suoi colori (dati/addobbi-colori.js): ogni colore si compra, e comprato resta tuo (nel cassetto o addosso).
// Quello che hai si mette subito; il resto resta in prova sulla bestia finché non si preme «Acquista e indossa». Un addobbo di un livello che non
// hai si vede chiuso; uno di una festa finita non si compra (quello che hai si rimette). Qui non si decide niente: i gesti vanno a Gioco.vue.
// Le foto: la bestia vestita, girata (`vestita:<id>|<gradi>|<aggancio>=<chiave>;…`), e gli addobbi in quel colore (`addobbo:<id>:<colore>`).
import { ref, computed, reactive } from 'vue'
import { AGGANCI_TUTTI } from '../dati/addobbi.js'
import Personalizza from '../../../components/personalizza/Personalizza.vue'

const props = defineProps({
  id: { type: String, required: true },
  nome: { type: String, default: '' },
  monete: { type: Number, default: 0 },
  livello: { type: Number, default: 1 },
  vestiario: { type: Array, default: () => [] },   // Cura.vestiarioDi: [{ id, nome, prezzo, dove, liv, bloccato, fuoriStagione, stagione, addosso, colori: [{ id, nome, hex, hai, addosso }] }]
  addosso: { type: Object, default: () => ({}) },  // { aggancio: `<id>:<colore>` }
  vestiti: { type: Array, default: () => [] },     // i set salvati di questa bestia (Cura.vestitiDi): [{ posto, nome, addobbi }]
  messaggio: { type: String, default: '' },
  anteprima: { type: Function, required: true },
  anteprimaPronta: { type: Function, required: true },
})
const emit = defineEmits(['veste', 'spoglia', 'salva-set', 'rinomina-set', 'togli-set', 'chiudi'])
const giro = ref(0)

const NOMI = { testa: 'In testa', muso: 'Sul muso', collo: 'Al collo', schiena: 'Sulla schiena' }
const FESTE = { natale: 'Solo a Natale', halloween: 'Solo a Halloween' }
const posti = computed(() => AGGANCI_TUTTI.filter(d => props.vestiario.some(a => a.dove === d)))
const schede = computed(() => [...posti.value.map(d => ({ id: d, nome: NOMI[d], tipo: 'oggetti' })), { id: 'set', nome: 'Set', tipo: 'set' }])
const hex = c => '#' + c.hex.toString(16).padStart(6, '0')
const voci = computed(() => posti.value.flatMap(d => [
  { id: 'niente-' + d, scheda: d, posto: d, nome: 'Niente', niente: true, dati: { 'data-addobbo': 'niente-' + d } },
  ...props.vestiario.filter(a => a.dove === d).map(a => ({
    id: a.id, scheda: d, posto: d, nome: a.nome, posseduto: a.colori.some(c => c.hai || c.addosso), prezzoDa: a.prezzo, liv: a.liv || 0,
    ...(a.fuoriStagione ? { chiuso: FESTE[a.stagione] || 'Fuori stagione' } : {}), dati: { 'data-addobbo': a.id },
    // ogni colore si paga come l'addobbo; quello che hai (nel cassetto o addosso) è tuo
    colori: a.colori.map(c => ({ id: c.id, nome: c.nome, css: hex(c), prezzo: a.prezzo, posseduto: !!(c.hai || c.addosso),
      ...(a.fuoriStagione ? { chiuso: FESTE[a.stagione] || 'Fuori stagione' } : {}), dati: { 'data-colore': c.id } })),
  })),
]))
const valori = addobbi => Object.fromEntries(posti.value.map(d => {
  const k = addobbi[d]
  return [d, k ? { oggetto: k.split(':')[0], forma: null, colore: k.split(':')[1] } : { oggetto: 'niente-' + d, forma: null, colore: null }]
}))
const indossato = computed(() => valori(props.addosso))
const mieiSet = computed(() => props.vestiti.map(v => ({ posto: v.posto, nome: v.nome, pezzi: valori(v.addobbi || {}) })))
const chiaveDi = v => (v && !String(v.oggetto).startsWith('niente') ? `${v.oggetto}:${v.colore}` : null)

// le foto
const foto = reactive({}), chiesti = new Set()
function fotoDi(tipo) {
  if (foto[tipo]) return foto[tipo]
  const pronta = props.anteprimaPronta(tipo)
  if (pronta) return pronta
  if (!chiesti.has(tipo)) { chiesti.add(tipo); Promise.resolve(props.anteprima(tipo)).then(url => { if (url) foto[tipo] = url }, () => {}) }
  return ''
}
// di tre quarti si comincia (di faccia una bestia a quattro zampe è una macchia), poi scatti di 45°
const tipoVestita = (stato, r = 0) => `vestita:${props.id}|${40 + r * 45}|${Object.entries(stato).map(([d, v]) => chiaveDi(v) && d + '=' + chiaveDi(v)).filter(Boolean).join(';')}`
const tipoFoto = ({ zona, voce, valore, stato }) => (zona === 'set' || !voce || voce.niente ? tipoVestita(stato) : 'addobbo:' + chiaveDi(valore))

const metti = (posto, v) => (chiaveDi(v) ? emit('veste', chiaveDi(v)) : emit('spoglia', posto))
function scegli({ posto, oggetto, colore }) { metti(posto, { oggetto, colore }) }
function acquista({ pezzi }) { for (const p of pezzi) metti(p.posto, p) }
function indossaSet({ pezzi }) { for (const [d, v] of Object.entries(pezzi)) if (chiaveDi(v) !== (props.addosso[d] || null)) metti(d, v) }
</script>

<template>
  <Personalizza tema="animali" :titolo="'Vesti ' + nome" :chi="nome" valuta="🪙" :saldo="monete" :livello="livello" :schede="schede" :voci="voci" :indossato="indossato" :miei-set="mieiSet"
                v-model:giro="giro" :avviso="messaggio" data-f3="addobbi" :data-bestia="id"
                @scegli="scegli" @acquista="acquista" @indossa-set="indossaSet" @salva-set="x => emit('salva-set', x)" @rinomina-set="x => emit('rinomina-set', x)"
                @togli-set="x => emit('togli-set', x)" @chiudi="emit('chiudi')">
    <template #anteprima="{ stato }">
      <div class="f3-add-ritratto" data-f3="addobbi-ritratto"><img v-if="fotoDi(tipoVestita(stato, giro))" :src="fotoDi(tipoVestita(stato, giro))" :alt="'Ritratto di ' + nome" draggable="false"></div>
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
