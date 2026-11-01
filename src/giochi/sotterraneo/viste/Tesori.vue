<script setup>
// I Tesori (docs/sotterraneo/rarita.md, «I leggendari»): tutti i leggendari, quelli trovati col nome in oro e la loro
// riga di storia, gli altri come un posto vuoto. Niente «in arrivo»: il posto vuoto dice che c'è ancora da cercare
import { computed } from 'vue'
import Cornice from './Cornice.vue'
import Icona from './Icona.vue'
import { LEGGENDARI } from '../dati/pezzi.js'
import { COSE, chiaveDelPezzo } from '../dati/cose.js'

const props = defineProps({
  trovati: { type: Array, default: () => [] },   // gli id dei leggendari trovati da questo eroe
})
defineEmits(['indietro', 'chiudi', 'fuori'])

const tutti = computed(() => Object.entries(LEGGENDARI).map(([id, l]) => {
  const b = COSE[l.base] || {}
  // la foto del suo modello (docs/sotterraneo/anteprime-3d.md): la figura di un leggendario non dipende dal livello
  return { id, nome: l.nome, storia: l.storia, cosa: { chiave: chiaveDelPezzo(l.base, 1, 'leggendario', [], id) }, em: b.em, trovato: props.trovati.includes(id) }
}))
const quanti = computed(() => tutti.value.filter(t => t.trovato).length)
</script>

<template>
  <Cornice data-tesori @chiudi="$emit('chiudi')" @fuori="e => $emit('fuori', e)">
    <header class="sot-targa">
      <span class="sot-targa-ritratto sot-targa-em em">🏆</span>
      <span class="sot-targa-nome">
        <b>Tesori</b>
        <i>{{ quanti }} trovati su {{ tutti.length }}</i>
      </span>
    </header>
    <ul class="sot-tesori">
      <li v-for="t in tutti" :key="t.id" class="sot-tesoro" :class="{ 'sot-trovato': t.trovato }"
          :data-tesoro="t.id" :data-trovato="t.trovato ? 1 : 0">
        <span class="sot-tesoro-icona"><Icona :em="t.em" :emAlto="24" :cosa3d="t.cosa" :lato="44" /></span>
        <span v-if="t.trovato" class="sot-tesoro-testo"><b>{{ t.nome }}</b><i>{{ t.storia }}</i></span>
        <span v-else class="sot-tesoro-testo"><b>? ? ?</b><i>Ancora da trovare, laggiù.</i></span>
      </li>
    </ul>
    <button type="button" class="sot-grosso sot-chiaro" data-azione="indietro-tesori" @click="$emit('indietro')">
      ‹ l'eroe
    </button>
  </Cornice>
</template>
