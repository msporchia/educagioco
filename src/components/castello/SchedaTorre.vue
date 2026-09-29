<script setup>
// Il foglio che sale toccando una torre in campo: chi è, a che punto è
// della scaletta, il bivio quando arriva (due carte, stesso conto, si
// sceglie dopo aver deciso di salire) e il tasto per spostarla (stessa cosa
// del trascinamento, ma il prezzo va scritto). Vedi docs/castello/torri.md.
import { computed } from 'vue'
import { TORRI, segnoDi } from '../../data/ops.js'
import RitrattoTorre from './RitrattoTorre.vue'

const props = defineProps({
  pittori: { type: Object, default: null },
  torre: { type: Object, required: true },       // { tipo, lv, ramo }
  cap: { type: Number, default: 10 },
  costo: { type: Number, default: 0 },
  energia: { type: Number, default: 0 },
  divisioni: { type: Boolean, default: true },
  rami: { type: Array, default: () => [] },      // [{ id, nome, descr }]
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
      <RitrattoTorre :pittori="pittori" :tipo="torre.tipo" :lv="torre.lv" :ramo="torre.ramo" :unita="62" />
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

  <template v-if="rami.length && !massimo">
    <div class="dritta">Con questo conto diventa…</div>
    <div class="rami">
      <button v-for="r in rami" :key="r.id" class="ramo" :style="{ '--c': modello.colore }"
              :class="{ cara: !posso }" :data-ramo="r.id" @click="$emit('potenzia', r.id)">
        <span class="figura">
          <RitrattoTorre :pittori="pittori" :tipo="torre.tipo" :lv="torre.lv + 1" :ramo="r.id" :unita="66" />
        </span>
        <b>{{ r.nome }}</b>
        <span class="descr">{{ r.descr }}</span>
        <i><em>{{ segno }}</em> · {{ costo }} ⚡</i>
      </button>
    </div>
  </template>

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
