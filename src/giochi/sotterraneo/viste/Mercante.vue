<script setup>
// Il mercante: l'unico posto senza domande, dove si spende quello che le domande hanno fruttato. Ogni riga
// dice cosa fa l'oggetto («Sbagliare fa meno male»), non solo il nome. Le tre che curano non finiscono mai
// (docs/sotterraneo/roba.md); una riga che la classe non impugna dice il perché al posto del confronto; e
// si vende dalle proprie tasche a metà prezzo — comprare e rivendere è una perdita, non un modo di fare gemme.
import Icona from './Icona.vue'

defineProps({
  roba: { type: Array, required: true },     // [{ …, posso, sempre, cambio, quante, mancano }]
  tasche: { type: Array, default: () => [] }, // [{ chiave, em, nome, sprite, vale } | null]
  gemme: { type: Number, required: true },
})
defineEmits(['compra', 'vendi', 'chiudi'])
</script>

<template>
  <div>
    <!-- un banco vuoto non esiste: le tre che curano stanno sempre lì -->
    <button v-for="c in roba" :key="c.chiave" class="sot-merce"
            :class="{ 'sot-caro': !c.posso || c.nonPuoi }" :data-merce="c.chiave"
            :disabled="!c.posso || !!c.nonPuoi" @click="$emit('compra', c.chiave)">
      <Icona :sprite="c.sprite" :em="c.em" :emAlto="26" />
      <span class="sot-testo">
        <b>{{ c.nome }}</b>
        <!-- il confronto viene per primo (è quello con cui si decide); non impugnabile, il perché al suo posto -->
        <em v-if="c.nonPuoi" class="em sot-altrui" data-non-puoi>✋ {{ c.nonPuoi }}</em>
        <em v-else-if="c.sempre" class="em">ne ha sempre</em>
        <em v-else-if="c.cambio" class="em"
            :class="{ 'sot-meglio': c.posso && c.cambio.includes('+') }">{{ c.cambio }}</em>
        <i>{{ c.dice }}</i>
      </span>
      <span class="sot-prezzo em" :class="{ 'sot-manca': !c.posso }">
        <b v-if="c.quante" class="sot-quante">ne hai {{ c.quante }}</b>
        💎 {{ c.prezzo }}
        <b v-if="!c.posso && !c.nonPuoi" class="sot-quante">ti mancano {{ c.mancano }}</b>
      </span>
    </button>

    <!-- solo se c'è qualcosa da vendere -->
    <template v-if="tasche.some(Boolean)">
      <p class="sot-banco">Ti compra quello che hai, a metà prezzo.</p>
      <button v-for="(t, i) in tasche" v-show="t" :key="i" class="sot-merce sot-vendo"
              :data-vendo="t ? t.chiave : ''" @click="$emit('vendi', i)">
        <Icona :sprite="t ? t.sprite : null" :em="t ? t.em : ''" :emAlto="26" />
        <span class="sot-testo"><b>{{ t ? t.nome : '' }}</b><i>lo vendo</i></span>
        <span class="sot-prezzo em">+ 💎 {{ t ? t.vale : 0 }}</span>
      </button>
    </template>

    <button class="sot-grosso sot-chiaro" data-azione="chiudi" @click="$emit('chiudi')">
      basta così
    </button>
  </div>
</template>
