<script setup>
/* ═══════════════════════════════════════════════════════════════════
   CHE TORRE COSTRUISCO QUI

   Il foglio che sale quando si tocca una piazzola vuota. Quattro carte,
   e la piazzola che le riguarda è già illuminata sul campo dietro, col
   suo raggio d'azione: si sceglie sapendo *dove* finisce la torre, che
   prima non si sapeva — la metteva il gioco, in fila, senza dirlo.

   Il «non lo tocca» sulla carta è il preavviso che diventa una
   risposta: se fra poco arriva un Golem, e frecce e magia non gli fanno
   niente, le carte dell'arciere e della magica se lo portano scritto
   addosso. Il nastro delle ondate dice chi arriva, qui c'è cosa farci —
   ed è lo stesso dato, letto nel momento in cui serve invece che tre
   righe più su.

   La carta segnata **non si disabilita**, e non è una svista: comprarla
   resta legittimo — una torre vive tutta la tappa e le ondate girano,
   quindi quella che oggi non morde domani è la migliore che hai. Il
   segno avverte, non decide al posto di chi gioca.

   ── ogni carta il suo prezzo ──
   Le torri non costano più uguale (`CARATTERE` in `data/castello.js`):
   l'arciere è quello debole che costa poco, le bombe le più forti e le
   più care. Il prezzo sta su ogni carta, ed è la metà della scelta.

   Le carte care non si spengono: toccarle dice quanto manca. Un bottone
   morto non insegna niente.
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI, segnoDi } from '../../data/ops.js'
import RitrattoTorre from './RitrattoTorre.vue'

const props = defineProps({
  tappa: { type: Object, required: true },
  energia: { type: Number, default: 0 },
  /* quanto costa ognuna, qui e adesso: `{ tipo: ⚡ }` */
  costi: { type: Object, default: () => ({}) },
  divisioni: { type: Boolean, default: true },
  /* le torri a cui chi sta per arrivare è immune */
  immune: { type: Array, default: () => [] },
})
defineEmits(['scegli'])

const disponibile = k => props.tappa.torri.includes(k)
const segno = k => segnoDi(k, props.divisioni)
const costo = k => props.costi[k] ?? 0
const cara = k => disponibile(k) && props.energia < costo(k)
const ignorata = k => props.immune.includes(k)
</script>

<template>
  <div class="carte">
    <button v-for="(T, k) in TORRI" :key="k" class="carta-torre" :style="{ '--c': T.colore }"
            :class="{ bloccata: !disponibile(k), cara: cara(k), fiacca: ignorata(k) }"
            :disabled="!disponibile(k)" :data-torre="k" :data-costo="costo(k)"
            @click="$emit('scegli', k)">
      <span v-if="ignorata(k) && disponibile(k)" class="terzo" data-non-tocca>non lo tocca</span>
      <span class="figura">
        <RitrattoTorre v-if="disponibile(k)" :tipo="k" :lv="1" />
        <span v-else class="chiuso">🔒</span>
      </span>
      <b>{{ T.nome }}</b>
      <span class="descr">{{ T.descr }}</span>
      <i v-if="!disponibile(k)">non in questa tappa</i>
      <i v-else-if="cara(k)">servono {{ costo(k) }} ⚡</i>
      <i v-else><em>{{ segno(k) }}</em> · {{ costo(k) }} ⚡</i>
    </button>
  </div>
</template>

<style scoped src="./scelta.css"></style>
