<script setup>
// Chi hai davanti mentre rispondi: quante risposte mancano a farlo cadere è l'unica cosa che rende una
// spada una spada (senza, trovarne una migliore è solo un'emoji che cambia). Non calcola niente: riceve i
// numeri già fatti dal motore.
import Icona from './Icona.vue'

defineProps({
  mostro: { type: Object, required: true },   // { em, nome, ossa, ossaMax, att, dif, chiave }
  sprite: { type: String, default: null },    // il suo pezzo, quello che si vede sul campo
  colpo: { type: Number, required: true },
  restano: { type: Number, required: true },
  graffio: { type: Number, required: true },  // quello che passa anche rispondendo bene
  male: { type: Number, required: true },     // e quello che arriva sbagliando
  vita: { type: Number, required: true },
  vitaMax: { type: Number, required: true },
  scosso: { type: Number, default: 0 },
  scambio: { type: Object, default: null },   // com'è andato l'ultimo scambio: { dato, preso, caduto }
})
</script>

<template>
  <!-- il conto sta prima di rispondere: è quello che fa decidere se restare o scappare -->
  <div class="sot-scontro">
  <div class="sot-nemico" :key="scosso">
    <div class="sot-faccia" :class="{ 'sot-colpito': scosso }">
      <Icona :sprite="sprite" :em="mostro.em" :scala="3" :emAlto="42" />
    </div>
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
  <!-- il mostro picchia anche rispondendo bene: senza questi due numeri sembra "hai sbagliato" -->
  <p v-if="scambio" class="sot-scambio" :class="{ 'sot-male': !scambio.dato }">
    <span v-if="scambio.dato" class="em">⚔️ gli hai tolto <b>{{ scambio.dato }}</b></span>
    <span v-if="scambio.dato && scambio.preso"> · </span>
    <span v-if="scambio.preso" class="em">
      {{ scambio.dato ? 'ti ha graffiato' : 'ti ha colpito' }} <b>{{ scambio.preso }}</b>
    </span>
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
