<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL BANCO — dove si sceglie cosa comprare.

   Tre file e un bottone: che torre costruire, le torri già in campo da
   far salire, il preavviso di chi arriva, e il tasto che manda l'ondata.

   Che le torri già in campo si potessero potenziare era il difetto più
   grosso dell'interfaccia: il ＋ sul campo lo vedeva solo chi lo sapeva
   già. Adesso stanno qui in fila, con scritto quanto costa salire.

   Il banco non decide niente e non conosce il motore: riceve i numeri
   già fatti e manda su tre segnali — «voglio questa torre», «fai salire
   quella», «manda l'ondata».
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI, emojiTorre, segnoDi } from '../../data/ops.js'
import { CFG } from '../../data/castello.js'
import NastroOndate from './NastroOndate.vue'

const props = defineProps({
  tappa: { type: Object, required: true },
  hud: { type: Object, required: true },
  vista: { type: Object, required: true },
  costoNuova: { type: Number, default: 0 },
  postiFiniti: { type: Boolean, default: false },
  /* cosa il bambino può calcolare: { div, mul } — vedi data/ops.js */
  sa: { type: Object, default: () => ({}) },
})
defineEmits(['scegli', 'potenzia', 'onda'])

const disponibile = k => props.tappa.torri.includes(k)
const segno = k => segnoDi(k, props.sa)
const cara = k => disponibile(k) && (props.hud.energia < props.costoNuova || props.postiFiniti)
</script>

<template>
  <div class="dritta">{{ !hud.torri ? 'Costruisci la prima torre, poi manda la battaglia'
    : vista.daPotenziare ? 'Tocca una torre sul campo per potenziarla: costa meno e rende di più'
                         : 'Che torre vuoi costruire?' }}</div>

  <!-- chi sta per arrivare: si sceglie la torre sapendo contro chi -->
  <NastroOndate :prossime="vista.prossime" />

  <div class="torri">
    <button v-for="(T, k) in TORRI" :key="k" class="tsc" :style="{ '--c': T.colore }"
            :class="{ bloccata: !disponibile(k), cara: cara(k) }"
            :disabled="!disponibile(k)" @click="$emit('scegli', k)">
      <span class="em">{{ disponibile(k) ? T.emoji : '🔒' }}</span>
      <b>{{ T.nome }}</b>
      <i v-if="!disponibile(k)">{{ segno(k) }}</i>
      <i v-else-if="postiFiniti">posti finiti</i>
      <i v-else>{{ segno(k) }} · {{ costoNuova }} ⚡</i>
    </button>
  </div>

  <template v-if="vista.torri.length">
    <div class="dritta piccola">Torri in campo — toccane una per farla salire</div>
    <div class="squadra">
      <button v-for="t in vista.torri" :key="t.i" class="pot" :style="{ '--c': TORRI[t.tipo].colore }"
              :class="{ cara: !t.posso && !t.massimo, massimo: t.massimo }"
              :disabled="t.massimo" @click="$emit('potenzia', t.i)">
        <span class="em">{{ emojiTorre(t.tipo, t.lv) }}</span>
        <b>liv. {{ t.lv }}</b>
        <i>{{ t.massimo ? 'al massimo' : t.costo + ' ⚡' }}</i>
      </button>
    </div>
  </template>

  <button class="bottone stretto" :class="{ invisibile: !vista.inAttesa, svelto: vista.pronti }"
          :disabled="!vista.inAttesa" @click="$emit('onda')">
    {{ hud.onda ? 'Manda l\'ondata' : 'Comincia la battaglia' }} ▶<template
      v-if="vista.pronti"> · +{{ CFG.bonusPronti }} ⚡</template><template
      v-else-if="vista.restaAttesa <= 9"> · fra {{ vista.restaAttesa }}</template>
  </button>
</template>

<style scoped src="./banco.css"></style>
