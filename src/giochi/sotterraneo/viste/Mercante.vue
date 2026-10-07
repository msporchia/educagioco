<script setup>
// Il banco di un mercante di sopra: il posto senza domande, dove si spende quello che le domande hanno fruttato.
// Ogni riga dice cosa fa l'oggetto («Sbagliare fa meno male»), non solo il nome; quello che non ci si può
// permettere resta visibile e spento; una riga che la classe non impugna dice il perché al posto del confronto.
// Le tasche si vendono solo a chi compra (il rigattiere), a metà prezzo (docs/sotterraneo/roba.md).
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Icona from './Icona.vue'

// appena aperto il banco non ascolta: un secondo tocco sul mercante, dato mentre l'eroe ci arriva, cadrebbe
// su una riga e la comprerebbe (gli stessi 320 ms ciechi della domanda, docs/core/interfaccia.md)
const CIECO = 320
const pronto = ref(false)
let cieco = 0
onMounted(() => { cieco = setTimeout(() => { pronto.value = true }, CIECO) })
onBeforeUnmount(() => clearTimeout(cieco))

defineProps({
  roba: { type: Array, required: true },       // [{ …, posso, sempre, cambio, quante, mancano }]
  tasche: { type: Array, default: null },      // [{ chiave, em, nome, sprite, vale } | null]; null: questo non compra
  detto: { type: Object, default: null },      // l'ultima riga: { testo, sprite?, em? } («Spada ⚔️ +2», «lo zaino è pieno»)
  chiCompra: { type: String, default: '' },    // «il rigattiere, vicino al carro»: detto da chi non compra
})
defineEmits(['compra', 'vendi'])
</script>

<template>
  <div>
    <p v-if="detto" class="sot-cambio sot-meglio sot-detto-banco" data-detto-banco>
      <Icona v-if="detto.sprite || detto.em" :sprite="detto.sprite" :em="detto.em" :emAlto="18" />
      {{ detto.testo }}
    </p>

    <button v-for="c in roba" :key="c.chiave" class="sot-merce"
            :class="{ 'sot-caro': !c.posso || c.nonPuoi }" :data-merce="c.chiave"
            :disabled="!c.posso || !!c.nonPuoi" @click="pronto && $emit('compra', c.chiave)">
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
    <!-- il banco porta il passo dopo della storia (motore/storia.js): prima della prima discesa, o a chi ha già
         tutto, non c'è niente da vendere, e lo si dice invece di aprire un banco vuoto -->
    <p v-if="!roba.length" class="sot-banco sot-vuote" data-banco-vuoto>
      Per ora non ho niente per te: torna quando avrai finito la prossima discesa.
    </p>

    <!-- chi compra mostra le tasche; gli altri dicono dove si vende -->
    <template v-if="tasche">
      <p class="sot-banco">Ti compro quello che hai in tasca, a metà prezzo.</p>
      <p v-if="!tasche.some(Boolean)" class="sot-banco sot-vuote" data-tasche-vuote>Le tasche sono vuote.</p>
      <button v-for="(t, i) in tasche" v-show="t" :key="i" class="sot-merce sot-vendo"
              :data-vendo="t ? t.chiave : ''" @click="pronto && $emit('vendi', i)">
        <Icona :sprite="t ? t.sprite : null" :em="t ? t.em : ''" :emAlto="26" />
        <span class="sot-testo"><b>{{ t ? t.nome : '' }}</b><i>lo vendo</i></span>
        <span class="sot-prezzo em">+ 💎 {{ t ? t.vale : 0 }}</span>
      </button>
    </template>
    <p v-else-if="chiCompra" class="sot-banco" data-chi-compra>Quello che hai in tasca lo compra {{ chiCompra }}.</p>
  </div>
</template>
