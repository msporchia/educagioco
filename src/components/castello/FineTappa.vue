<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LE SCHERMATE DI FINE

   Tre, e dicono la stessa cosa in tre modi: com'è andata, e cosa si può
   fare adesso. Quella che conta è la prima — dopo una tappa vinta si
   annuncia **la torre nuova** della tappa dopo, con l'operazione che la
   compra: è il momento in cui si capisce che il gioco sta insegnando
   qualcosa di nuovo, e non va sprecato.
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI, segnoDi } from '../../data/ops.js'

const props = defineProps({
  fase: { type: String, required: true },      // vinta | trionfo | fine
  tappa: { type: Object, required: true },
  prossima: { type: Object, default: null },
  hud: { type: Object, required: true },
  premio: { type: Number, default: 0 },
  quante: { type: Number, default: 0 },        // le tappe della campagna
  campagna: { type: Boolean, default: true },
  divisioni: { type: Boolean, default: true },
})
defineEmits(['avanti', 'mappa', 'libera', 'riprova'])

/* le torri che la tappa dopo porta in dote e questa non aveva */
const nuove = () => (props.prossima
  ? props.prossima.torri.filter(k => !props.tappa.torri.includes(k)) : [])
const segno = k => segnoDi(k, props.divisioni)
</script>

<template>
  <!-- tappa superata -->
  <template v-if="fase === 'vinta'">
    <h2>{{ tappa.emoji }} Tappa superata!</h2>
    <p class="testo"><b>{{ tappa.nome }}</b> è al sicuro: {{ tappa.ondate }} ondate,
      <b>{{ hud.uccisi }}</b> nemici fermati, <b>{{ hud.torri }}</b> torri costruite.
      Premio: <b>+{{ premio }} 🪙</b></p>
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
      Premio: <b>+{{ premio }} 🪙</b>. Si apre la <b>partita libera</b>, senza fine.</p>
    <div class="riga">
      <button class="bottone" @click="$emit('libera')">Partita libera ♾️</button>
      <button class="bottone chiaro" @click="$emit('mappa')">Mappa</button>
    </div>
  </template>

  <!-- sconfitta -->
  <template v-else>
    <h2>Il castello è caduto</h2>
    <p class="testo">
      <template v-if="campagna">{{ tappa.emoji }} {{ tappa.nome }}: ondate superate
        <b>{{ hud.onda - 1 }}</b> su {{ tappa.ondate }}</template>
      <template v-else>Ondate superate: <b>{{ hud.onda - 1 }}</b></template>
      · nemici fermati: <b>{{ hud.uccisi }}</b> · torri costruite: <b>{{ hud.torri }}</b></p>
    <div class="riga">
      <button class="bottone" @click="$emit('riprova')">Riprova ▶</button>
      <button class="bottone chiaro" @click="$emit('mappa')">Mappa</button>
    </div>
  </template>
</template>

<style scoped>
.dritta { font-size:13px; color:var(--tenue); font-weight:700; text-align:center }
</style>
