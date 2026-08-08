<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL BOTTINO — «hai preso questo, e adesso sei più forte così»

   Prima un tesoro era una riga di testo in fondo al cartello della
   stanza: «un tesoro in tasca!». Un bambino di sei anni la leggeva —
   quando la leggeva — e non sapeva né cosa avesse preso, né cosa
   cambiasse, né perché avrebbe dovuto essere contento. Un premio che
   non si capisce non è un premio: è una riga di testo.

   Quindi il bottino si ferma davanti e si fa guardare. Tre cose, in
   quest'ordine, che sono le tre domande che si fa chi gioca:

     1. COS'È      il disegno grande, e il nome
     2. COSA FA    detto con le parole del gioco, non con l'effetto
                   («i mostri cadono prima», non «+2 attacco»)
     3. QUANTO     il numero che cambia, da quello di prima a quello di
                   adesso: ⚔️ 3 → 5. È la riga che fa vedere il
                   potenziamento *succedere*, ed è tutto il motivo per
                   cui si è scesi fin qui.

   Le gemme hanno lo stesso cartello ma dicono una cosa in più — a cosa
   servono — perché sono l'unica cosa che si raccoglie e non si usa
   subito, e senza quella riga un bambino le prende per punti.

   Non decide niente: riceve un fatto già successo e lo mostra.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  /* { em, nome, cosaFa, prima, dopo, segno, invece, gemme, totale } */
  bottino: { type: Object, required: true },
})
defineEmits(['chiudi'])
</script>

<template>
  <div class="dng-velo" data-velo="bottino" @click="$emit('chiudi')">
    <div class="dng-premio" @click.stop>
      <div class="dng-luccica"></div>
      <div class="dng-premio-em em">{{ bottino.em }}</div>
      <h3>{{ bottino.nome }}</h3>
      <p class="dng-premio-fa">{{ bottino.cosaFa }}</p>

      <!-- il numero che cambia: è questa riga che fa vedere di essere
           diventati più forti, e va guardata mentre succede -->
      <div v-if="bottino.dopo !== undefined" class="dng-salto">
        <span class="dng-salto-segno em">{{ bottino.segno }}</span>
        <b class="dng-prima">{{ bottino.prima }}</b>
        <span class="dng-freccia">→</span>
        <b class="dng-dopo">{{ bottino.dopo }}</b>
      </div>

      <div v-if="bottino.gemme" class="dng-salto">
        <span class="dng-salto-segno em">💎</span>
        <b class="dng-dopo">+{{ bottino.gemme }}</b>
        <span class="dng-freccia">in tutto</span>
        <b class="dng-prima">{{ bottino.totale }}</b>
      </div>

      <p v-if="bottino.invece" class="dng-premio-invece">
        lasci lì {{ bottino.invece }}
      </p>

      <button class="dng-grosso" data-voce="preso" @click="$emit('chiudi')">
        <span class="em">👍</span> preso!
      </button>
    </div>
  </div>
</template>
