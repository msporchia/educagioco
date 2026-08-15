<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SCHEDA DI UNA TORRE

   Il foglio che sale quando si tocca una torre già in campo. Dice tre
   cose e ne offre una: chi è, a che punto è della sua scaletta, cosa sa
   fare — e poi la si fa salire.

   ── spostarla ──
   Da quando ci sono tappe con due ingressi, portare la torre giusta
   dalla parte giusta è la mossa che vince, e costa due punti di
   energia. Si fa in due modi che sono la stessa cosa: trascinandola, o
   da qui — si preme, il foglio si toglie di mezzo e il campo aspetta
   che gli si dica dove. Il tasto non toglie il trascinamento: lo
   racconta a chi non l'ha scoperto, e adesso che la mossa ha un prezzo
   il prezzo va scritto da qualche parte.

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
  /* quanto costa spostarla, e se c'è un posto dove metterla */
  costoSposta: { type: Number, default: 0 },
  puoiSpostare: { type: Boolean, default: true },
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

  <button class="bottone chiaro stretto" :class="{ cara: !puoiSpostare || energia < costoSposta }"
          data-azione="sposta" @click="$emit('sposta')">
    ✋ Spostala <span class="prezzo">{{ costoSposta }} ⚡</span>
  </button>
  <div class="trascina">…o trascinala col dito, è la stessa cosa</div>
</template>

<style scoped src="./scheda.css"></style>
