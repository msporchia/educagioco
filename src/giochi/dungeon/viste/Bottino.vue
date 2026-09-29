<script setup>
// Il bottino: cos'è (disegno e nome), cosa fa (parole del gioco, non
// l'effetto: "i mostri cadono prima" non "+2 attacco"), quanto cambia (il
// numero prima → dopo, che fa vedere il potenziamento succedere). Non decide
// niente: riceve un fatto già successo e lo mostra.
defineProps({
  // { em, nome, cosaFa, prima, dopo, segno, invece, gemme, totale }
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
