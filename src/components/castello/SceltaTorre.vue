<script setup>
/* ═══════════════════════════════════════════════════════════════════
   CHE TORRE COSTRUISCO QUI

   Il foglio che sale quando si tocca una piazzola vuota. Quattro carte,
   e la piazzola che le riguarda è già illuminata sul campo dietro, col
   suo raggio d'azione: si sceglie sapendo *dove* finisce la torre, che
   prima non si sapeva — la metteva il gioco, in fila, senza dirlo.

   Il ⅓ sulla carta è il preavviso che diventa una risposta: se fra poco
   arriva un Golem e il Golem regge la magia, la carta della magica se
   lo porta scritto addosso — «qui ne fai un terzo». Il nastro delle
   ondate dice chi arriva, qui c'è cosa farci — ed è lo stesso dato,
   letto nel momento in cui serve invece che tre righe più su.

   La carta segnata **non si disabilita**, e non è una svista: comprarla
   resta legittimo — una torre vive tutta la tappa e le ondate girano,
   quindi quella che oggi non morde domani è la migliore che hai. Il
   segno avverte, non decide al posto di chi gioca.

   Le carte care non si spengono: toccarle dice quanto manca. Un bottone
   morto non insegna niente.
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI, segnoDi } from '../../data/ops.js'
import RitrattoTorre from './RitrattoTorre.vue'

const props = defineProps({
  tappa: { type: Object, required: true },
  energia: { type: Number, default: 0 },
  costo: { type: Number, default: 0 },
  divisioni: { type: Boolean, default: true },
  /* il tipo di torre a cui chi sta per arrivare resiste */
  resiste: { type: String, default: null },
})
defineEmits(['scegli'])

const disponibile = k => props.tappa.torri.includes(k)
const segno = k => segnoDi(k, props.divisioni)
const cara = k => disponibile(k) && props.energia < props.costo
</script>

<template>
  <div class="carte">
    <button v-for="(T, k) in TORRI" :key="k" class="carta-torre" :style="{ '--c': T.colore }"
            :class="{ bloccata: !disponibile(k), cara: cara(k), fiacca: resiste === k }"
            :disabled="!disponibile(k)" :data-torre="k" @click="$emit('scegli', k)">
      <span v-if="resiste === k && disponibile(k)" class="terzo">⅓</span>
      <span class="figura">
        <RitrattoTorre v-if="disponibile(k)" :tipo="k" :lv="1" />
        <span v-else class="chiuso">🔒</span>
      </span>
      <b>{{ T.nome }}</b>
      <span class="descr">{{ T.descr }}</span>
      <i v-if="!disponibile(k)">non in questa tappa</i>
      <i v-else-if="cara(k)">servono {{ costo }} ⚡</i>
      <i v-else><em>{{ segno(k) }}</em> · {{ costo }} ⚡</i>
    </button>
  </div>
</template>

<style scoped src="./scelta.css"></style>
