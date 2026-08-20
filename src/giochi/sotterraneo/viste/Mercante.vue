<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL MERCANTE — l'unico posto senza domande

   Qui si **spende** quello che le domande hanno fruttato. Un gioco in
   cui ogni singola cosa costa un esercizio diventa un compito lungo: ci
   vuole un posto dove il lavoro già fatto valga da solo.

   Ogni riga dice cosa fa l'oggetto, non solo come si chiama: «Sbagliare
   fa meno male» è una ragione per comprare, «Corazza 💎18» è un listino.
   Quello che non ci si può permettere resta visibile e spento — sapere
   cosa c'era è il motivo per tornare.

   ── E ADESSO SI VENDE ANCHE ───────────────────────────────────────
   Sotto il banco ci sono **le proprie tasche**, a metà prezzo. Non è
   un modo di fare gemme — comprare e rivendere perde metà del valore —
   ma è la risposta a due cose che succedevano di continuo: sei tasche
   piene e l'unico modo di liberarne una era buttare per terra quello
   che c'era dentro; e la spada di ieri, quella che non si userà più,
   che restava in fondo allo zaino a occupare il posto per sempre.

   La faccia di ogni cosa è la sua vera (`Icona.vue`): lo stesso pezzo
   che si vede per terra e nella tasca, mai l'emoji al posto suo.
   ═══════════════════════════════════════════════════════════════════ */
import Icona from './Icona.vue'

defineProps({
  roba: { type: Array, required: true },     // [{ …, posso, cambio, quante, mancano }]
  tasche: { type: Array, default: () => [] }, // [{ chiave, em, nome, sprite, vale } | null]
  gemme: { type: Number, required: true },
})
defineEmits(['compra', 'vendi', 'chiudi'])
</script>

<template>
  <div>
    <div v-if="!roba.length" class="sot-vuoto">Ha finito la roba.</div>
    <button v-for="c in roba" :key="c.chiave" class="sot-merce"
            :class="{ 'sot-caro': !c.posso }" :data-merce="c.chiave"
            :disabled="!c.posso" @click="$emit('compra', c.chiave)">
      <Icona :sprite="c.sprite" :em="c.em" :emAlto="26" />
      <span class="sot-testo">
        <b>{{ c.nome }}</b>
        <!-- prima c'era solo la frase dell'oggetto: racconta un'arma,
             non dice se conviene. Il confronto viene per primo perché è
             quello con cui si decide. -->
        <em v-if="c.cambio" class="em"
            :class="{ 'sot-meglio': c.posso && c.cambio.includes('+') }">{{ c.cambio }}</em>
        <i>{{ c.dice }}</i>
      </span>
      <span class="sot-prezzo em" :class="{ 'sot-manca': !c.posso }">
        <b v-if="c.quante" class="sot-quante">ne hai {{ c.quante }}</b>
        💎 {{ c.prezzo }}
        <b v-if="!c.posso" class="sot-quante">ti mancano {{ c.mancano }}</b>
      </span>
    </button>

    <!-- ═══ quello che hai tu ═══
         Solo se c'è qualcosa da vendere: un titolo sopra un elenco
         vuoto è una promessa che non si mantiene. -->
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
