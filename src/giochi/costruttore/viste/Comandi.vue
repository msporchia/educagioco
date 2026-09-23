<script setup>
/* ═══════════════════════════════════════════════════════════════════
   I COMANDI — via, stop, la velocità, l'aiuto, e le lavagnette

   Un tasto solo che dice sempre cosa succede se lo premi: **▶ Via**
   quando è fermo, **■ Stop** mentre gira — ed è la stessa regola del
   Generale. Accanto la velocità, a tre tacche: piano per capire, veloce
   per vedere il castello venir su.

   Sotto, le **lavagnette**: quelle dell'ordine col lucchetto, quelle del
   bambino col loro valore che cambia mentre il robot lavora. Sono il
   pezzo che rende una variabile una cosa che si vede.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  inCorso: { type: Boolean, default: false },
  velocita: { type: String, default: 'normale' },
  ordine: { type: Object, default: () => ({}) },       // le lavagnette dell'ordine: { lungo: 7 }
  lavagnette: { type: Array, default: () => [] },       // i nomi di quelle del bambino
  valori: { type: Object, default: () => ({}) },        // i loro valori, se sta girando
  conLavagnette: { type: Boolean, default: false },     // si possono creare
  aiuti: { type: Number, default: 0 },                  // quanti aiuti ha già visto
})
import { colore } from '../dati/colori.js'
const emit = defineEmits(['via', 'stop', 'velocita', 'aiuto', 'nuova-lavagnetta'])
const VELOCITA = [['lenta', '🐢'], ['normale', '🐇'], ['veloce', '🚀']]
</script>

<template>
  <div class="cst-comandi">
    <div class="cst-fila-comandi">
      <button v-if="!inCorso" type="button" class="cst-via" data-azione="via" @click="emit('via')">▶ Via</button>
      <button v-else type="button" class="cst-via cst-stop" data-azione="stop" @click="emit('stop')">■ Stop</button>
      <div class="cst-velocita" role="group" aria-label="velocità">
        <button v-for="[v, e] in VELOCITA" :key="v" type="button" :class="{ 'cst-su': velocita === v }"
                :data-velocita="v" :aria-label="v" @click="emit('velocita', v)">{{ e }}</button>
      </div>
      <!-- `suggerimento` e non `aiuto`: quello è il ? della barra, che c'è in tutti i giochi -->
      <button type="button" class="cst-lampadina" data-azione="suggerimento" aria-label="suggerimento" @click="emit('aiuto')">
        💡
      </button>
    </div>
    <div v-if="Object.keys(ordine).length || lavagnette.length || conLavagnette" class="cst-lavagnette" data-lavagnette>
      <span v-for="(v, n) in ordine" :key="'o' + n" class="cst-lavagnetta cst-bloccata" :data-lavagnetta="n">
        🔒 {{ n }}
        <b v-if="typeof v === 'string'" class="cst-valore-colore"><i class="cst-quadretto"
           :style="{ '--cst-tinta': (colore(v) || {}).tinta }"></i>{{ (colore(v) || {}).nome || v }}</b>
        <b v-else>{{ v }}</b>
      </span>
      <span v-for="n in lavagnette" :key="n" class="cst-lavagnetta" :data-lavagnetta="n">
        📝 {{ n }} <b>{{ valori[n] ?? 0 }}</b>
      </span>
      <button v-if="conLavagnette && !inCorso" type="button" class="cst-lavagnetta cst-nuova"
              data-azione="nuova-lavagnetta" @click="emit('nuova-lavagnetta')">＋ lavagnetta</button>
    </div>
  </div>
</template>
