<script setup>
// Chi hai davanti mentre rispondi: quante risposte mancano a farlo cadere è l'unica cosa che rende una
// spada una spada (senza, trovarne una migliore è solo un'emoji che cambia). Non calcola niente: riceve i
// numeri già fatti dal motore.
import Icona from './Icona.vue'
import Grosso from './Grosso.vue'
import Glifo from './Glifo.vue'

defineProps({
  mostro: { type: Object, required: true },   // { em, nome, ossa, ossaMax, att, dif, chiave }
  sprite: { type: String, default: null },    // il suo pezzo, quello che si vede sul campo
  grosso: { type: Object, default: null },    // il mostro grosso (dati/grossi.js): la sua figura disegnata in codice
  colpo: { type: Number, required: true },
  restano: { type: Number, required: true },
  graffio: { type: Number, required: true },  // quello che passa anche rispondendo bene
  male: { type: Number, required: true },     // e quello che arriva sbagliando
  vita: { type: Number, required: true },
  vitaMax: { type: Number, required: true },
  puoiScappare: { type: Boolean, default: true },   // lo usa il tasto sotto (Gioco.vue): qui solo per non finire sul div
  scosso: { type: Number, default: 0 },
  scambio: { type: Object, default: null },   // com'è andato l'ultimo scambio: { dato, preso, caduto, usata, veleno, colpiti, rimandato }
  stati: { type: Array, default: () => [] },   // cosa sta succedendo al mostro (avvelenato, gelato…): [{ glifo, n, dice }]
  mie: { type: Array, default: () => [] },     // e cosa protegge l'eroe in questo scontro (scudo, parato…)
})
</script>

<template>
  <!-- il conto sta prima di rispondere: è quello che fa decidere se restare o scappare -->
  <div class="sot-scontro">
  <div class="sot-nemico" :key="scosso">
    <div class="sot-faccia" :class="{ 'sot-colpito': scosso }">
      <Grosso v-if="grosso" :disegno="grosso.disegno" :colori="grosso.colori" :scala="2" />
      <Icona v-else :sprite="sprite" :em="mostro.em" :scala="3" :emAlto="42" />
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
      <div v-if="stati.length" class="sot-stati em" data-stati-mostro>
        <span v-for="x in stati" :key="x.chiave" :data-stato="x.chiave" :title="x.dice"><Glifo :nome="x.glifo" :misura="14" /> {{ x.n }}</span>
      </div>
      <div class="sot-costo">
        gli togli {{ colpo }} a colpo — ancora
        <b>{{ restano }}</b> {{ restano === 1 ? 'risposta' : 'risposte' }}
      </div>
    </div>
  </div>
  <!-- il mostro picchia anche rispondendo bene: senza questi due numeri sembra "hai sbagliato" -->
  <!-- una riga per fonte: da dove viene il danno (colpo, abilità, veleno) e cosa si è portato via quello che arriva -->
  <div v-if="scambio" class="sot-scambio" :class="{ 'sot-male': !scambio.dato && !scambio.veleno }" :data-usata="scambio.usata ? scambio.usata.id : null">
    <p v-if="scambio.dato" class="em" data-scambio="danno">
      <span v-if="scambio.usata" class="sot-scambio-abilita"><Glifo :nome="scambio.usata.glifo" :misura="16" /> {{ scambio.usata.nome }}: </span>
      fai <b>{{ scambio.dato }}</b> di danno<span v-if="scambio.usata && scambio.volte > 1 && scambio.base"> (il tuo colpo di {{ scambio.base }} ×{{ String(scambio.volte).replace('.', ',') }})</span><span v-else-if="scambio.primoTiro"> (da lontano: il mostro non risponde)</span>
    </p>
    <p v-else-if="scambio.usata" class="sot-scambio-abilita" data-scambio="abilita"><Glifo :nome="scambio.usata.glifo" :misura="16" /> {{ scambio.usata.nome }}</p>
    <p v-if="scambio.veleno" class="sot-scambio-abilita" data-scambio="veleno"><Glifo nome="veleno" :misura="14" /> altri <b>{{ scambio.veleno }}</b> di danno a ogni turno</p>
    <p v-if="scambio.colpiti" class="em" data-scambio="stanza">e colpisci altri {{ scambio.colpiti }} {{ scambio.colpiti === 1 ? 'mostro' : 'mostri' }} della stanza</p>
    <p v-if="scambio.rimandato" class="em" data-scambio="specchio">il suo colpo si ritorce contro di lui: <b>{{ scambio.rimandato }}</b> di danno</p>
    <p v-if="scambio.preso" class="em" data-scambio="preso">
      subisci <b>{{ scambio.preso }}</b> di danno<span v-if="scambio.gelato"> (il gelo gli dimezza il colpo)</span><span v-if="scambio.assorbito"> · la barriera ne para {{ scambio.assorbito }}</span>
    </p>
    <p v-else-if="scambio.assorbito" class="em" data-scambio="preso">la barriera para tutto: <b>{{ scambio.assorbito }}</b> di danno</p>
    <p v-else-if="scambio.schivato" class="em" data-scambio="preso">schivi il colpo</p>
    <p v-else-if="scambio.salvo" class="em" data-scambio="preso">
      {{ { fermo: 'è stordito: non ti attacca', intoccabile: 'sei invulnerabile: non subisci danni', parato: 'sei protetto: non subisci danni', quieto: 'non fa in tempo a risponderti' }[scambio.salvo] }}
    </p>
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
  <div v-if="mie.length" class="sot-stati sot-stati-mie em" data-stati-eroe>
    <span v-for="x in mie" :key="x.chiave" :data-stato="x.chiave"><Glifo :nome="x.glifo" :misura="14" /> {{ x.dice }}</span>
  </div>
  </div>
</template>
