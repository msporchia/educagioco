<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA DELLE TAPPE

   La prima schermata: la campagna è una fila di tappe, ognuna con il
   suo percorso, un numero preciso di ondate e le torri che mette a
   disposizione. Le quattro operazioni entrano una per volta, con tappe
   di consolidamento in mezzo. Vinta l'ultima si apre la partita libera,
   senza fine.

   Una tappa chiusa resta visibile: sapere cosa c'è dopo è metà del
   motivo per finire quella di adesso. E se i genitori hanno acceso
   «tutto aperto», di chiuse non ce n'è nessuna — partita libera
   compresa, che è una campagna a tutti gli effetti.
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI } from '../../data/ops.js'
import { tappaAperta } from '../../store/profile.js'

const props = defineProps({
  tappe: { type: Array, required: true },
  fatte: { type: Number, default: 0 },      // quante ne ha già superate
  libera: { type: Boolean, default: false },
})
defineEmits(['gioca', 'libera', 'indietro'])

/* il lucchetto lo toglie anche l'interruttore dei genitori
   (`settings.tuttoAperto`): con quindici tappe, provare il gioco senza
   quel flag vorrebbe dire giocarsele tutte in fila */
const aperta = i => tappaAperta(i, props.fatte)
</script>

<template>
  <h2>Difendi il castello</h2>
  <p class="testo">I nemici fermati lasciano ⚡. Con l'energia si costruisce una
    torre, oppure — spendendo meno — si tocca una torre già in campo per farla
    salire di livello con un calcolo più difficile. L'ondata parte quando la
    chiami tu: il tempo per fare i conti è tutto tuo.</p>
  <div class="tappe">
    <button v-for="(T, i) in tappe" :key="i" class="tap"
            :class="{ fatta: i < fatte, chiusa: !aperta(i) }"
            :disabled="!aperta(i)" @click="$emit('gioca', i)">
      <span class="em">{{ aperta(i) ? T.emoji : '🔒' }}</span>
      <b>{{ i + 1 }}. {{ T.nome }}</b>
      <i>{{ T.ondate }} ondate ·
        <template v-for="k in T.torri" :key="k">{{ TORRI[k].emoji }}</template>
      </i>
      <span v-if="i < fatte" class="spunta">✔</span>
    </button>
  </div>
  <div class="riga">
    <button v-if="libera" class="bottone" @click="$emit('libera')">Partita libera ♾️</button>
    <button class="bottone chiaro" @click="$emit('indietro')">Indietro</button>
  </div>
</template>

<style scoped src="./mappa.css"></style>
