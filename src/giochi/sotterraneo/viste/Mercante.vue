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

   ── LE TRE CHE CURANO NON FINISCONO, E LO DICONO ──────────────────
   Stanno in cima, sempre le stesse, e comprarne una non la toglie dal
   banco. Ma tutte le altre righe spariscono appena si comprano, quindi
   una che resta lì **senza una parola sembra un guasto**: «ne ha
   sempre» sta al posto del confronto, che su una boccetta non c'è
   niente da fare (non si indossa, non c'è un «+1 rispetto a»).

   ── E QUELLO CHE LA TUA CLASSE NON IMPUGNA ────────────────────────
   Capita, di rado: il banco pesca prediligendo la classe che scende
   (`PESO_ALTRUI` in `dati/cose.js`), ma non filtra. Quando capita la
   riga c'è e dice **perché no** al posto del confronto — comprarla
   sarebbe l'unico modo di perdere gemme senza guadagnare niente, visto
   che si rivende a metà. È lo stesso avviso che compare nello zaino e
   per terra: uno solo, scritto una volta sola (`nonLaPorta`).

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
  roba: { type: Array, required: true },     // [{ …, posso, sempre, cambio, quante, mancano }]
  tasche: { type: Array, default: () => [] }, // [{ chiave, em, nome, sprite, vale } | null]
  gemme: { type: Number, required: true },
})
defineEmits(['compra', 'vendi', 'chiudi'])
</script>

<template>
  <div>
    <!-- «Ha finito la roba» non c'è più: le tre che curano stanno sul
         banco comunque, quindi un banco vuoto non esiste. -->
    <button v-for="c in roba" :key="c.chiave" class="sot-merce"
            :class="{ 'sot-caro': !c.posso || c.nonPuoi }" :data-merce="c.chiave"
            :disabled="!c.posso || !!c.nonPuoi" @click="$emit('compra', c.chiave)">
      <Icona :sprite="c.sprite" :em="c.em" :emAlto="26" />
      <span class="sot-testo">
        <b>{{ c.nome }}</b>
        <!-- prima c'era solo la frase dell'oggetto: racconta un'arma,
             non dice se conviene. Il confronto viene per primo perché è
             quello con cui si decide. -->
        <!-- e quando non si può impugnare, al posto del confronto va il
             perché: «⚔️ +1 rispetto alla spada» sopra una riga che non
             si può comprare sarebbe una presa in giro -->
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
