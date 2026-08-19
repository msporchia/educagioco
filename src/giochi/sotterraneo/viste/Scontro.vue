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
