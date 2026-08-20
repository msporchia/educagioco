<script setup>
/* ═══════════════════════════════════════════════════════════════════
   CHI HAI DAVANTI, MENTRE RISPONDI

   La riga sopra la domanda: la faccia, quanta vita gli resta, e —
   soprattutto — **quante risposte mancano a farlo cadere**. Quel numero
   è l'unica cosa che rende una spada una spada: senza, trovarne una
   migliore è un'emoji che cambia in una casella, con, è la fila di
   domande che si accorcia sotto gli occhi.

   Non calcola niente: riceve i numeri già fatti dal motore, che è
   l'unico che sa come si sommano.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  mostro: { type: Object, required: true },   // { em, nome, ossa, ossaMax, att, dif, chiave }
  colpo: { type: Number, required: true },
  restano: { type: Number, required: true },
  graffio: { type: Number, required: true },  // quello che passa anche rispondendo bene
  male: { type: Number, required: true },     // e quello che arriva sbagliando
  vita: { type: Number, required: true },
  vitaMax: { type: Number, required: true },
  scosso: { type: Number, default: 0 },
  /* com'è andato l'ultimo scambio: `{ dato, preso, caduto }`, o niente
     se non si è ancora risposto. È la riga che mancava — vedi sotto. */
  scambio: { type: Object, default: null },
})
</script>

<template>
  <!-- Anche rispondendo bene qualcosa passa: il conto sta **davanti**,
       prima di rispondere, perché è quello che fa decidere se restare o
       scappare. Dirlo dopo sarebbe raccontare una brutta sorpresa. -->
  <div class="sot-scontro">
  <div class="sot-nemico" :key="scosso">
    <div class="sot-faccia em" :class="{ 'sot-colpito': scosso }">{{ mostro.em }}</div>
    <div class="sot-dati">
      <b>{{ mostro.nome }}<span v-if="mostro.chiave" class="em"> 🗝️</span></b>
      <div class="sot-vita">
        <i :style="{ width: Math.max(0, mostro.ossa / mostro.ossaMax * 100) + '%' }"></i>
      </div>
      <div class="sot-ossa">
        <span class="em">❤️ {{ Math.max(0, mostro.ossa) }}</span>
        <span class="em">⚔️ {{ mostro.att }}</span>
        <span class="em">🛡️ {{ mostro.dif }}</span>
      </div>
      <div class="sot-costo">
        gli togli {{ colpo }} a colpo — ancora
        <b>{{ restano }}</b> {{ restano === 1 ? 'risposta' : 'risposte' }}
      </div>
    </div>
  </div>
  <!-- ═══ com'è andato il colpo ═══
       Il mostro picchia **anche quando rispondi bene**, ed è voluto: è
       quello che rende utile una pozione. Ma finché la cosa si vedeva
       solo nella barra che cala, chi aveva appena risposto giusto
       leggeva «hai sbagliato» — e il suono, che era quello dell'errore,
       glielo confermava. Detto con due numeri diventa quello che è: uno
       scambio, e uno scambio in cui hai avuto la meglio. -->
  <p v-if="scambio" class="sot-scambio" :class="{ 'sot-male': !scambio.dato }">
    <span v-if="scambio.dato" class="em">⚔️ gli hai tolto <b>{{ scambio.dato }}</b></span>
    <span v-if="scambio.dato && scambio.preso"> · </span>
    <span v-if="scambio.preso" class="em">
      {{ scambio.dato ? 'ti ha graffiato' : 'ti ha colpito' }} <b>{{ scambio.preso }}</b>
    </span>
    <span v-if="scambio.caduto" class="em"> · è caduto!</span>
  </p>

  <div class="sot-io-vita">
    <span class="sot-polso" :style="{ '--sot-polso': vita / vitaMax > 0.6 ? '#4fce7c'
                                      : vita / vitaMax > 0.3 ? '#f0b429' : '#e0432f' }">
      <i :style="{ width: Math.max(0, vita / vitaMax) * 100 + '%' }"></i>
      <b>{{ vita }}</b>
    </span>
    <span class="sot-botte em">
      ti graffia <b>{{ graffio }}</b> · se sbagli <b>{{ male }}</b>
    </span>
  </div>
  </div>
</template>
