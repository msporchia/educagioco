<script setup>
// Le tre schermate di fine (vinta/trionfo/sconfitta). Dopo una tappa vinta
// si annuncia la torre nuova della tappa dopo, con l'operazione che la
// compra: è il momento in cui si vede che il gioco insegna qualcosa di nuovo.
import { TORRI, segnoDi } from '../../data/ops.js'
import Festa from '../../giochi/Festa.vue'

const props = defineProps({
  fase: { type: String, required: true },      // vinta | trionfo | fine
  tappa: { type: Object, required: true },
  prossima: { type: Object, default: null },
  hud: { type: Object, required: true },
  monete: { type: Number, default: 0 },        // prese in questa partita, un conto alla volta
  notaMonete: { type: String, default: '' },   // il salvadanaio stanco: docs/genitori/varieta.md
  quante: { type: Number, default: 0 },        // le tappe della campagna
  campagna: { type: Boolean, default: true },
  /* cosa il bambino può calcolare: { div, mul }. Era un booleano
     («le divisioni»), ed è diventato una coppia quando anche le
     moltiplicazioni si sono potute spegnere. */
  sa: { type: Object, default: () => ({}) },
  /* solo nella partita libera: { record, frase } da `giochi/primati.js`
     — lì non si vince, e l'unica cosa da dire è se si è fatto meglio */
  primato: { type: Object, default: null },
})
defineEmits(['avanti', 'mappa', 'libera', 'riprova'])

/* le torri che la tappa dopo porta in dote e questa non aveva */
const nuove = () => (props.prossima
  ? props.prossima.torri.filter(k => !props.tappa.torri.includes(k)) : [])
const segno = k => segnoDi(k, props.sa)
</script>

<template>
  <!-- tappa superata -->
  <template v-if="fase === 'vinta'">
    <h2>{{ tappa.emoji }} Tappa superata!</h2>
    <p class="testo"><b>{{ tappa.nome }}</b> è al sicuro: {{ tappa.ondate }} ondate,
      <b>{{ hud.uccisi }}</b> nemici fermati, <b>{{ hud.torri }}</b> torri costruite.
      <template v-if="monete">Coi conti: <b data-monete-prese>+{{ monete }} 🪙</b></template></p>
    <p v-if="notaMonete" class="dritta" data-nota-monete>{{ notaMonete }}</p>
    <p v-if="prossima" class="dritta">Ora tocca a
      {{ prossima.emoji }} {{ prossima.nome }}<template v-for="k in nuove()" :key="k">
        — nuova torre {{ TORRI[k].emoji }} {{ TORRI[k].nome }} ({{ segno(k) }})</template>
    </p>
    <div class="riga">
      <button class="bottone" @click="$emit('avanti')">Tappa successiva ▶</button>
      <button class="bottone chiaro" @click="$emit('mappa')">Mappa</button>
    </div>
  </template>

  <!-- campagna vinta -->
  <template v-else-if="fase === 'trionfo'">
    <h2>🎉 Campagna vinta!</h2>
    <p class="testo">Tutte e {{ quante }} le tappe sono superate: il regno è salvo.
      <template v-if="monete">Coi conti di quest'ultima: <b data-monete-prese>+{{ monete }} 🪙</b>. </template>Si
      aprono le <b>partite libere</b>, senza fine: una per terreno.</p>
    <p v-if="notaMonete" class="dritta" data-nota-monete>{{ notaMonete }}</p>
    <div class="riga">
      <button class="bottone" @click="$emit('libera')">{{ tappa.emoji }} Partita libera ♾️</button>
      <button class="bottone chiaro" @click="$emit('mappa')">Mappa</button>
    </div>
  </template>

  <!-- sconfitta -->
  <template v-else>
    <Festa v-if="primato && primato.record" />
    <h2>Il castello è caduto</h2>
    <p class="testo">
      <template v-if="campagna">{{ tappa.emoji }} {{ tappa.nome }}: ondate superate
        <b>{{ hud.onda - 1 }}</b> su {{ tappa.ondate }}</template>
      <template v-else>Ondate superate: <b>{{ hud.onda - 1 }}</b></template>
      · nemici fermati: <b>{{ hud.uccisi }}</b> · torri costruite: <b>{{ hud.torri }}</b><template
        v-if="monete"> · coi conti: <b data-monete-prese>+{{ monete }} 🪙</b></template></p>
    <p v-if="notaMonete" class="dritta" data-nota-monete>{{ notaMonete }}</p>
    <p v-if="primato && primato.record" class="primato" data-primato="nuovo">🥇 {{ primato.frase }}</p>
    <p v-else-if="primato && primato.frase" class="dritta" data-primato="no">🏁 {{ primato.frase }}</p>
    <div class="riga">
      <button class="bottone" @click="$emit('riprova')">Riprova ▶</button>
      <button class="bottone chiaro" @click="$emit('mappa')">Mappa</button>
    </div>
  </template>
</template>

<style scoped>
.dritta { font-size:13px; color:var(--tenue); font-weight:700; text-align:center }
.primato { color:#d1481f; font-weight:900; font-size:15px; text-align:center }
</style>
