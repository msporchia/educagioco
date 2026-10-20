<script setup>
// Le scorte in alto: il gettone del livello (si tocca: apre il foglio dei livelli), i raccolti, i prodotti delle macchine e la lana.
// Le monete stanno nella barra. Il resto è solo lettura. Raccolti e prodotti sono elenchi [{ k, n }]: ognuno ha la sua faccia.
import Faccia from './Faccia.vue'
defineProps({
  scorte: { type: Array, default: () => [] },
  prodotti: { type: Array, default: () => [] },
  lana: { type: Number, default: 0 },
  livello: { type: Number, default: 1 },
  quanto: { type: Number, default: 0 },            // 0..1, verso il prossimo livello
  nuovo: { type: Boolean, default: false },        // un livello nuovo che il bambino non ha ancora guardato
  banco: { type: Object, default: () => ({ visibile: false, pronti: 0 }) },   // il tasto del banco: da livello 2; `pronti` = ordini consegnabili
})
defineEmits(['livello', 'banco'])
</script>

<template>
  <div class="f3-hud" data-f3="hud">
    <button class="f3-gettone" data-f3="livello" :aria-label="'livello ' + livello" @click="$emit('livello')">
      <b>⭐ {{ livello }}</b>
      <i><u :style="{ width: quanto * 100 + '%' }"></u></i>
      <em v-if="nuovo" class="f3-pallino" data-f3="livello-nuovo"></em>
    </button>
    <button v-if="banco.visibile" class="f3-banco-tasto" data-f3="apri-banco" aria-label="banco" @click="$emit('banco')">
      🧺 Banco<em v-if="banco.pronti" class="f3-n" data-f3="banco-pronti">{{ banco.pronti }}</em>
    </button>
    <span data-f3="scorte" class="f3-merci"><template v-if="scorte.length"><span v-for="c in scorte" :key="c.k" class="f3-merce-n"><Faccia :k="c.k" :lato="26" /> {{ c.n }}</span></template><span v-else class="f3-merce-n"><Faccia k="grano" :lato="26" /> 0</span></span>
    <span data-f3="prodotti" class="f3-merci"><template v-if="prodotti.length"><span v-for="c in prodotti" :key="c.k" class="f3-merce-n"><Faccia :k="c.k" :lato="26" /> {{ c.n }}</span></template><span v-else class="f3-merce-n"><Faccia k="pane" :lato="26" /> 0</span></span>
    <span data-f3="lana">🧶 {{ lana }}</span>
  </div>
</template>

<style>
/* `.f3-hud span` (stile.css) dà la pillola a ogni span: qui solo quella di fuori la tiene, le facce dentro no */
.f3-hud .f3-merci { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px 10px; }
.f3-hud .f3-merce-n, .f3-hud .f3-merce-n .f3-faccia, .f3-hud .f3-merce-n .f3-faccia .e { background: none; box-shadow: none; padding: 0; border-radius: 0; }
.f3-hud .f3-merce-n { display: inline-flex; align-items: center; gap: 3px; font: inherit; }
</style>
