<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SCHEDA DI UNA TORRE

   Il foglio che sale quando si tocca una torre già in campo. Dice tre
   cose e ne offre due: chi è, a che punto è della sua scaletta, cosa
   sa fare; e poi si può farla salire o spostarla.

   ── perché lo spostamento sta qui ──
   Trascinare una torre da una piazzola all'altra si è sempre potuto, e
   non costa niente: è tattica, non un acquisto. Ma chi non sa che si
   può trascinare non lo scopre mai — un gesto senza un bottone è un
   gesto per chi c'era quando è stato scritto. Il tasto non toglie il
   trascinamento: lo racconta.

   ── il bivio ──
   Quando la torre arriva al gradino in cui si specializza, al posto del
   tasto «potenzia» compaiono due carte. Il calcolo da fare è lo stesso —
   il bivio non costa un'operazione in più, è quello che l'operazione
   compra. Si sceglie *dopo* aver deciso di salire, mai prima: la scelta
   è il premio del conto difficile, non un pedaggio davanti.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { TORRI, segnoDi } from '../../data/ops.js'
import RitrattoTorre from './RitrattoTorre.vue'

const props = defineProps({
  torre: { type: Object, required: true },       // { tipo, lv, ramo }
  cap: { type: Number, default: 10 },
  costo: { type: Number, default: 0 },
  energia: { type: Number, default: 0 },
  divisioni: { type: Boolean, default: true },
  /* i due mestieri fra cui scegliere, quando è il momento: [{ id, nome, descr }] */
  rami: { type: Array, default: () => [] },
})
defineEmits(['potenzia', 'sposta'])

const modello = computed(() => TORRI[props.torre.tipo])
const massimo = computed(() => props.torre.lv >= props.cap)
const posso = computed(() => props.energia >= props.costo)
const segno = computed(() => segnoDi(props.torre.tipo, props.divisioni))
const gradini = computed(() => Array.from({ length: props.cap }, (_, i) => i + 1))
</script>

<template>
  <div class="chi">
    <span class="figura">
      <RitrattoTorre :tipo="torre.tipo" :lv="torre.lv" :ramo="torre.ramo" :unita="62" />
    </span>
    <span class="dati">
      <b :style="{ color: modello.colore }">{{ modello.nome }}</b>
      <span class="scaletta">
        <i v-for="g in gradini" :key="g" class="pip" :class="{ pieno: g <= torre.lv }"></i>
        <em>liv. {{ torre.lv }}<template v-if="!massimo"> di {{ cap }}</template></em>
      </span>
      <span class="descr">{{ modello.descr }}</span>
    </span>
  </div>

  <!-- il bivio: due mestieri, lo stesso conto -->
  <template v-if="rami.length && !massimo">
    <div class="dritta">Con questo conto diventa…</div>
    <div class="rami">
      <button v-for="r in rami" :key="r.id" class="ramo" :style="{ '--c': modello.colore }"
              :class="{ cara: !posso }" :data-ramo="r.id" @click="$emit('potenzia', r.id)">
        <span class="figura">
          <RitrattoTorre :tipo="torre.tipo" :lv="torre.lv + 1" :ramo="r.id" :unita="66" />
        </span>
        <b>{{ r.nome }}</b>
        <span class="descr">{{ r.descr }}</span>
        <i><em>{{ segno }}</em> · {{ costo }} ⚡</i>
      </button>
    </div>
  </template>

  <!-- il caso di sempre: un gradino alla volta -->
  <button v-else-if="!massimo" class="bottone stretto sale" :class="{ cara: !posso }"
          data-azione="potenzia" @click="$emit('potenzia', null)">
    Potenzia · liv. {{ torre.lv }} → {{ torre.lv + 1 }}
    <span class="prezzo"><em>{{ segno }}</em> {{ costo }} ⚡</span>
  </button>
  <div v-else class="dritta finita">Questa torre è al massimo della sua scaletta</div>

  <button class="bottone chiaro stretto" data-azione="sposta" @click="$emit('sposta')">
    ✋ Spostala · gratis
  </button>
</template>

<style scoped src="./scheda.css"></style>
