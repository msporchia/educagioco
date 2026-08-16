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
  scosso: { type: Number, default: 0 },
})
</script>

<template>
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
</template>
