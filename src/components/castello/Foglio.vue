<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL FOGLIO — quello che sale dal basso quando si tocca il campo.

   Prende il posto del banco: prima sotto al campo c'era sempre, aperta,
   una tastiera di bottoni che occupava metà schermo anche quando non
   serviva a niente. Adesso lo schermo è tutto campo, e il foglio sale
   solo quando c'è qualcosa da decidere — che torre costruire qui, cosa
   fare di questa torre, e il conto da fare per pagarla.

   Si appoggia sopra il campo e basta. Per un po' ha fatto di più — la
   telecamera si stringeva di quanto il foglio copriva, così mentre si
   calcolava si continuava a vedere tutta la battaglia — ed era una
   cattiva idea: l'inquadratura che entra e esce a ogni tocco stanca
   l'occhio, e ricalcolare la scala di un canvas a ogni fotogramma
   stanca il telefono. Il campo continua a girare sotto, chi vuole
   guardarlo chiude il foglio.

   Quello che il foglio fa e non si vede: **non ruba il tocco a tutto lo
   schermo**. Il velo sopra il campo chiude il foglio, ma è solo un
   velo — sotto la battaglia si vede ancora.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  aperto: { type: Boolean, default: false },
  /* il titolino in cima, e se si può tornare indietro invece di chiudere */
  titolo: { type: String, default: '' },
  indietro: { type: Boolean, default: false },
})
defineEmits(['chiudi', 'indietro'])
</script>

<template>
  <div class="velina" :class="{ via: !aperto }" @pointerdown.self="$emit('chiudi')"></div>
  <div class="foglio" :class="{ via: !aperto }">
    <div class="maniglia"></div>
    <div v-if="titolo || indietro" class="cima">
      <button v-if="indietro" class="tondo" aria-label="indietro" @click="$emit('indietro')">‹</button>
      <b>{{ titolo }}</b>
      <button class="tondo chiudi" aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    </div>
    <slot></slot>
  </div>
</template>

<style scoped src="./foglio.css"></style>
