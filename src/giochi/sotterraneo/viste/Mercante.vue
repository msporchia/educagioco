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
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  roba: { type: Array, required: true },     // [{ chiave, em, nome, dice, prezzo, posso }]
  gemme: { type: Number, required: true },
})
defineEmits(['compra', 'chiudi'])
</script>

<template>
  <div>
    <div v-if="!roba.length" class="sot-vuoto">Ha finito la roba.</div>
    <button v-for="c in roba" :key="c.chiave" class="sot-merce"
            :class="{ 'sot-caro': !c.posso }" :data-merce="c.chiave"
            :disabled="!c.posso" @click="$emit('compra', c.chiave)">
      <span class="em">{{ c.em }}</span>
      <span class="sot-testo"><b>{{ c.nome }}</b><i>{{ c.dice }}</i></span>
      <span class="sot-prezzo em">💎 {{ c.prezzo }}</span>
    </button>
    <button class="sot-grosso sot-chiaro" data-azione="chiudi" @click="$emit('chiudi')">
      basta così
    </button>
  </div>
</template>
