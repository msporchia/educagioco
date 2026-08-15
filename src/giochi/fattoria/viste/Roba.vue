<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL BAULE — L'ELENCO DI TUTTO, NON DI QUELLO CHE POSSIEDI

   Un posto solo dove si guarda «cosa c'è da avere e a che punto sono»,
   invece di un negozio da una parte e una cassapanca dall'altra: sono la
   stessa domanda fatta due volte. Ogni oggetto c'è sempre, e sopra c'è
   scritto o il prezzo o quanti ne hai.

   **Toccare compra, tenere premuto e tirare piazza.** Due gesti, e il
   secondo non passa dal primo: chi ha già una panchina da parte non deve
   ricomprarla per metterla giù.

   Si chiamava «la roba», ed era il nome sbagliato per due motivi: non
   dice niente a un bambino, e detto ad alta voce suona male. «Il baule»
   invece si capisce a quattro anni — è la cassa dove stanno le tue cose,
   e da cui ne escono di nuove.

   Non sa niente del profilo né delle monete vere: riceve `monete` e
   `magazzino` e manda fuori `compra` e `tira`. Chi paga è `Gioco.vue`.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'
import { CATEGORIE } from '../dati/catalogo.js'
import { IN_VENDITA } from '../dati/animali.js'
import Provino from './Provino.vue'

const props = defineProps({
  monete: { type: Number, default: 0 },
  magazzino: { type: Object, default: () => ({}) },
  bestie: { type: Array, default: () => [] },     // quelle già comprate
})
const emit = defineEmits(['compra', 'tira', 'compraBestia', 'chiudi'])

/* Gli animali stanno nella stessa modale ma in una linguetta a parte, e
   non si trascinano: una bestia non si posa da nessuna parte, si compra
   e da lì gira per conto suo. */
const BESTIARIO = { chiave: 'animali', nome: 'Animali', icona: '🐕' }
const SCHEDE = [...CATEGORIE, BESTIARIO]

const categoria = ref(CATEGORIE[0].chiave)
const quantiNe = id => props.magazzino[id] || 0

/* Un dito solo per due gesti: se si sposta sta tirando fuori la cosa, se
   non si sposta sta comprando. La soglia è in pixel e non in tempo — una
   pressione lenta è comunque un tocco, e un tocco lento non deve
   comprare per sbaglio qualcosa che volevi solo guardare. */
let dito = null

function giu(e, v) {
  dito = { v, x: e.clientX, y: e.clientY, tirato: false }
}

function muovi(e) {
  if (!dito || dito.tirato) return
  if (Math.abs(e.clientX - dito.x) + Math.abs(e.clientY - dito.y) < 12) return
  const v = dito.v
  if (!quantiNe(v.id) && v.prezzo > props.monete) { dito = null; return }
  dito.tirato = true
  emit('tira', { voce: v, x: e.clientX, y: e.clientY })
}

function su() {
  if (!dito || dito.tirato) { dito = null; return }
  const v = dito.v
  dito = null
  emit('compra', v)
}
</script>

<template>
  <div class="fa-baule">
    <h2>Il baule</h2>
    <p v-if="categoria === 'animali'">Un animale si compra e basta: da
       quel momento gira per il prato per conto suo.</p>
    <p v-else>Tocca per <b>comprarne uno</b>. Quello che hai resta tuo:
       <b>tienilo premuto e tira</b> per metterlo giù dove vuoi.</p>

    <div class="fa-schede">
      <button v-for="c in SCHEDE" :key="c.chiave"
              :class="['fa-scheda', { viva: c.chiave === categoria }]"
              @click="categoria = c.chiave">{{ c.icona }} {{ c.nome }}</button>
    </div>

    <div v-if="categoria === 'animali'" class="fa-griglia">
      <div v-for="a in IN_VENDITA" :key="a.chi"
           :class="['fa-voce', { presa: bestie.includes(a.chi),
                                 cara: !bestie.includes(a.chi) && a.prezzo > monete }]"
           @click="!bestie.includes(a.chi) && emit('compraBestia', a)">
        <Provino :pezzo="a.chi + '_giu0'" :lato="42" />
        <span class="fa-nome">{{ a.nome }}</span>
        <span :class="['fa-prezzo', { tuo: bestie.includes(a.chi) }]">
          {{ bestie.includes(a.chi) ? 'è tua' : '🪙' + a.prezzo }}</span>
      </div>
    </div>

    <div v-else class="fa-griglia" @pointermove="muovi" @pointerup="su" @pointercancel="dito = null">
      <div v-for="v in CATEGORIE.find(c => c.chiave === categoria).voci" :key="v.id"
           :class="['fa-voce', { tua: quantiNe(v.id), cara: !quantiNe(v.id) && v.prezzo > monete }]"
           @pointerdown="giu($event, v)">
        <Provino :pezzo="v.pezzo" :lato="42" />
        <span class="fa-nome">{{ v.nome }}</span>
        <span :class="['fa-prezzo', { tuo: quantiNe(v.id) }]">
          {{ quantiNe(v.id) ? '×' + quantiNe(v.id) : '🪙' + v.prezzo }}</span>
      </div>
    </div>

    <div class="fa-fila"><button class="fa-bot" @click="emit('chiudi')">Chiudi</button></div>
  </div>
</template>
