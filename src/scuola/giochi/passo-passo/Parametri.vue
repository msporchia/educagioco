<script setup>
// L'esercizio di Passo passo per la maestra: il protagonista e i gradini come tessere (docs/passo-passo/scuola.md)
import { ref, computed } from 'vue'
import { PROTAGONISTI, GRADINI } from './scheda.js'
import Righe from '../../maestra/Righe.vue'
import MiniMappa from './MiniMappa.vue'
import { provaEsercizio } from '../../maestra/utili.js'
import { CAMPAGNA } from '../../../giochi/passo-passo/dati/campagna.js'
import { STRADE } from '../../../giochi/passo-passo/motore/strade.js'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])

const e = computed(() => props.modelValue)
const suoi = computed(() => GRADINI[e.value.protagonista] || [])
const scelti = computed(() => suoi.value.filter(g => e.value.gradini.includes(g.chiave)))
const livelli = computed(() => scelti.value.reduce((n, g) => n + g.livelli, 0))
// i livelli veri di un gradino sulla strada del protagonista, nel suo ordine: per le anteprime e il loro racconto
const livelliDi = (protagonista, gradino) => STRADE[protagonista].map(i => CAMPAGNA[i]).filter(t => !gradino || t.scalino === gradino)
const primoDi = protagonista => livelliDi(protagonista, null)[0]
const aperti = ref(new Set())
const apri = k => { const x = new Set(aperti.value); x.has(k) ? x.delete(k) : x.add(k); aperti.value = x }
// ▶ Prova: quel gradino, col suo personaggio, nella pagina dei bambini
const prova = (protagonista, gradino, nome) => provaEsercizio({ tipo: 'passo', protagonista, gradini: [gradino] }, nome)
const manda = (protagonista, gradini) => emit('update:modelValue', { tipo: 'passo', protagonista, gradini })

// un protagonista per blocco: cambiandolo si ritrovano le scelte fatte per lui (finché la pagina è aperta); la prima volta
// restano i gradini che ha anche lui (le carte del coniglio e del cane), se no il suo primo
const ricordate = {}
function protagonista(id) {
  if (id === e.value.protagonista) return
  ricordate[e.value.protagonista] = e.value.gradini
  const restano = ricordate[id] || GRADINI[id].filter(g => e.value.gradini.includes(g.chiave)).map(g => g.chiave)
  manda(id, restano.length ? restano : [GRADINI[id][0].chiave])
}
// sempre nell'ordine della strada, e almeno uno
function gradino(chiave) {
  const acceso = e.value.gradini.includes(chiave)
  const dopo = suoi.value.map(g => g.chiave).filter(k => (k === chiave ? !acceso : e.value.gradini.includes(k)))
  if (dopo.length) manda(e.value.protagonista, dopo)
}
</script>

<template>
  <div class="parametri-passo">
    <div class="gruppo">
      <span class="titoletto">Chi gioca</span>
      <p class="nota">Il bambino mette in fila delle carte (frecce, salto, cicli) e preme ▶: il personaggio le esegue una per una.
        Se arriva alla meta il livello è fatto, se no si corregge la fila e si riprova. Ogni personaggio ha i suoi livelli;
        <b>uno per blocco</b>: per fare il coniglio e poi il cane, aggiungi un blocco dopo.</p>
      <Righe :voci="PROTAGONISTI.map(p => ({ chiave: p.id, nome: p.nome, icona: p.icona, testo: p.spiega }))" :scelte="[e.protagonista]"
             attributo="protagonista" una @tocca="protagonista">
        <template #figura="{ voce }"><MiniMappa :mappa="primoDi(voce.chiave).mappa" :protagonista="voce.chiave" :lato="14" /></template>
        <template #sotto="{ voce }">
          <button class="prova" :data-prova-di="voce.chiave" @click="prova(voce.chiave, GRADINI[voce.chiave][0].chiave, voce.nome)">▶ Prova</button>
        </template>
      </Righe>
    </div>
    <div class="gruppo">
      <span class="titoletto">Cosa si impara</span>
      <Righe :voci="suoi.map(g => ({ chiave: g.chiave, nome: g.nome, icona: g.icona, quanti: g.livelli === 1 ? '1 livello' : `${g.livelli} livelli`, testo: g.spiega }))"
             :scelte="e.gradini" attributo="gradino" :larghe="[...aperti]" @tocca="gradino">
        <template #figura="{ voce }"><MiniMappa :mappa="livelliDi(e.protagonista, voce.chiave)[0].mappa" :protagonista="e.protagonista" :lato="14" /></template>
        <template #sotto="{ voce }">
          <span class="azioni">
            <button class="prova" :data-prova-di="voce.chiave" @click="prova(e.protagonista, voce.chiave, voce.nome)">▶ Prova</button>
            <button class="link-livelli" :aria-expanded="aperti.has(voce.chiave)" :data-livelli-di="voce.chiave" @click="apri(voce.chiave)">
              {{ aperti.has(voce.chiave) ? 'Nascondi i livelli' : `Guarda i ${livelliDi(e.protagonista, voce.chiave).length} livelli` }}</button>
          </span>
          <ol v-if="aperti.has(voce.chiave)" class="livelli" :data-elenco-livelli="voce.chiave">
            <li v-for="t in livelliDi(e.protagonista, voce.chiave)" :key="t.chiave">
              <MiniMappa :mappa="t.mappa" :protagonista="e.protagonista" :lato="24" />
              <span><b>{{ t.nome }}</b><span class="nota">{{ t.racconto }}</span></span>
            </li>
          </ol>
        </template>
      </Righe>
      <p class="nota">{{ livelli }} {{ livelli === 1 ? 'livello' : 'livelli' }} in fila, dal più facile; finiti,
        {{ e.protagonista === 'guerriero' ? 'si ricomincia' : 'arrivano posti nuovi fatti con le stesse regole e le stesse carte' }}.</p>
    </div>
  </div>
</template>

<style scoped>
/* come le scelte di ParteEsercizio.vue: `fila`, `tessera`, `scelta` e `nota` sono di maestra.css */
.parametri-passo { display:flex; flex-direction:column; gap:12px }
.gruppo { display:flex; flex-direction:column; gap:6px }
.titoletto { font-size:14px; font-weight:600 }
.quanti { font-weight:400; opacity:.7; margin-left:4px }
.azioni { display:flex; align-items:center; gap:12px; flex-wrap:wrap }
.prova { padding:6px 14px; border-radius:999px; border:0; background:var(--penna); color:#fff; font:inherit; font-size:13px; font-weight:700; cursor:pointer }
.link-livelli { padding:2px 0; background:none; border:0; font:inherit; font-size:13px; font-weight:600; color:var(--penna);
                text-decoration:underline; cursor:pointer }
.livelli { list-style:none; display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:12px; margin:4px 0 4px }
.livelli li { display:flex; gap:12px; align-items:flex-start; padding:8px; border-radius:var(--raggio-piccolo); background:var(--tessera) }
.livelli li > span { display:flex; flex-direction:column; gap:2px; font-size:14px }
</style>
