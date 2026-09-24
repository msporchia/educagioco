<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO — la schermata della partita

   Dall'alto in basso: la mappa, la fila, le frecce, e in fondo ⌫ ▶ 💡.
   È l'ordine in cui si pensa: guardo dove devo andare, guardo cosa ho
   scritto, aggiungo una freccia, provo.

   Le frecce sono **assolute**: ↑ vuol dire verso la cima dello schermo,
   sempre, comunque sia girato il coniglio. La seconda fila, quella dei
   salti, c'è solo nei livelli che la usano. La terza, quella delle
   carte, dal gradino del ripeti: 🔁 mette una scatola dove sta il
   cursore, col cursore dentro, e sopra le frecce compare la scelta del
   numero — da due a nove, e nessuno già scelto: la N resta N finché non
   la tocca il bambino (è la regola del costruttore: un valore di comodo
   si legge come l'unico possibile). La scelta copre le frecce e non le
   sposta: se la pulsantiera cambiasse altezza, la mappa sopra ballerebbe.

   Il 💡 dice **prima** di essere toccato cosa costa: la stella «senza
   aiuti», con un segno che si vede e non si legge. Toccato una volta,
   il segno sparisce: la stella è già spesa, e da lì gli aiuti sono
   gratis per il resto di questo giro.

   Il canvas sta qui dentro ma lo dipinge `scena/tela.js`, che lo riceve
   da `Gioco.vue` (`defineExpose`): questa vista non sa disegnare.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'
import Fila from './Fila.vue'
import Icona from './Icona.vue'
import { nomeDellaMossa } from '../dati/mondo.js'
import { VOLTE } from '../dati/carte.js'

defineProps({
  fila: { type: Array, required: true },
  cursore: { type: Number, required: true },
  corrente: { type: Number, default: -1 },
  guasto: { type: Number, default: null },
  inCorsa: { type: Boolean, default: false },
  salti: { type: Boolean, default: false },
  brilla: { type: String, default: null },       // la freccia (o 'via') che l'aiuto accende
  costa: { type: Boolean, default: true },       // l'aiuto costa ancora la stella
  sospette: { type: Boolean, default: false },
  piena: { type: Boolean, default: false },      // la fila ha toccato il tetto tecnico
  manina: { type: String, default: null },       // la prima volta: dove toccare
  consiglio: { type: String, default: null },    // la carta che l'aiuto propone
  colpo: { type: Number, default: 0 },           // ogni 💡 premuto: la lampadina sobbalza
  inCoda: { type: Boolean, default: false },     // 💡 premuto durante la corsa: arriva alla fine
  carte: { type: Array, default: () => [] },     // le carte oltre alle frecce: ['ripeti']
  zaino: { type: Number, default: null },        // quante carte tiene la fila
  giri: { type: Array, default: null },          // a che giro sono le scatole
  scelta: { type: Number, default: null },       // la scatola di cui si sceglie il numero
  volteOra: { type: Number, default: null },     // il numero che ha adesso (null: è una N)
  consiglioVolte: { type: Number, default: null }, // il numero che l'aiuto accende
  consiglioTesta: { type: Number, default: null }, // la scatola a cui l'aiuto cambia il numero
  scossa: { type: Number, default: 0 },          // ▶ fermato da una N: la scelta sobbalza
})
const emit = defineEmits(['freccia', 'cancella', 'via', 'ferma', 'aiuto', 'cursore', 'ciclo', 'volte', 'testa'])

/* l'ordine dei tasti: sinistra, su, giù, destra — le due frecce verticali
   in mezzo, come sulla tastiera di un computer */
const ORDINE = ['sinistra', 'su', 'giu', 'destra']

const tela = ref(null)
defineExpose({ tela })
</script>

<template>
  <div class="pp-campo">
    <div class="pp-scena">
      <canvas ref="tela" class="pp-tela" data-tela></canvas>
    </div>

    <Fila :fila="fila" :cursore="cursore" :corrente="corrente" :guasto="guasto"
          :in-corsa="inCorsa" :sospette="sospette" :consiglio="consiglio" :piena="piena"
          :zaino="zaino" :giri="giri" :scelta="scelta" :consiglio-testa="consiglioTesta"
          @cursore="i => emit('cursore', i)" @freccia="m => emit('freccia', m)"
          @testa="i => emit('testa', i)" />

    <div class="pp-tasti">
      <div class="pp-pulsantiera">
        <div class="pp-riga">
          <button v-for="v in ORDINE" :key="v" class="pp-tasto pp-passo"
                  :class="{ 'pp-brilla': brilla === v }"
                  :data-freccia="v" :aria-label="nomeDellaMossa(v)"
                  :disabled="inCorsa || piena" @click="emit('freccia', v)">
            <Icona :mossa="v" />
            <span v-if="manina === v" class="pp-manina pp-em" data-manina aria-hidden="true">👆</span>
          </button>
        </div>
        <div v-if="salti" class="pp-riga">
          <button v-for="v in ORDINE" :key="v" class="pp-tasto pp-salto"
                  :class="{ 'pp-brilla': brilla === 'salto-' + v }"
                  :data-salto="v" :aria-label="nomeDellaMossa('salto-' + v)"
                  :disabled="inCorsa || piena" @click="emit('freccia', 'salto-' + v)">
            <Icona :mossa="'salto-' + v" />
          </button>
        </div>
        <div v-if="carte.includes('ripeti')" class="pp-riga pp-carte">
          <button class="pp-tasto pp-ripeti" :class="{ 'pp-brilla': brilla === 'ripeti' }"
                  data-carta="ripeti" aria-label="ripeti" :disabled="inCorsa || piena" @click="emit('ciclo')">
            <span class="pp-em" aria-hidden="true">🔁</span><span class="pp-parola">ripeti</span>
            <span v-if="manina === 'ripeti'" class="pp-manina pp-em" data-manina aria-hidden="true">👆</span>
          </button>
        </div>
        <!-- quante volte: copre le frecce finché non si sceglie, e non le
             sposta. Si chiude scegliendo, o toccando qualunque altra cosa -->
        <div v-if="scelta != null && !inCorsa" :key="scossa" class="pp-scelta-volte"
             :class="{ 'pp-scossa': scossa > 0 }" data-scelta-volte>
          <button v-for="n in VOLTE" :key="n" class="pp-tasto pp-volte"
                  :class="{ 'pp-brilla': consiglioVolte === n, 'pp-ora': volteOra === n }"
                  :data-volte-scegli="n" :aria-label="`${n} volte`" @click="emit('volte', n)">{{ n }}</button>
        </div>
      </div>
      <div class="pp-riga pp-azioni">
        <button class="pp-tasto pp-cancella" :class="{ 'pp-brilla': brilla === 'cancella' }"
                data-azione="cancella" aria-label="togli la freccia"
                :disabled="inCorsa || cursore === 0" @click="emit('cancella')">
          <svg viewBox="-20 -20 40 40" aria-hidden="true">
            <path class="pp-icona-pieno" d="M-6 -12 H15 Q17 -12 17 -10 V10 Q17 12 15 12 H-6 L-17 0 Z" />
            <path class="pp-icona-segno" d="M-1 -5 L9 5 M9 -5 L-1 5" />
          </svg>
        </button>
        <button v-if="!inCorsa" class="pp-tasto pp-via" :class="{ 'pp-brilla': brilla === 'via' }"
                data-azione="via" aria-label="via" @click="emit('via')">
          <svg viewBox="-20 -20 40 40" aria-hidden="true">
            <path class="pp-icona-pieno" d="M-9 -14 L15 0 L-9 14 Z" />
          </svg>
          <span v-if="manina === 'via'" class="pp-manina pp-em" data-manina aria-hidden="true">👆</span>
        </button>
        <button v-else class="pp-tasto pp-ferma" data-azione="ferma" aria-label="ferma" @click="emit('ferma')">
          <svg viewBox="-20 -20 40 40" aria-hidden="true">
            <rect class="pp-icona-pieno" x="-11" y="-11" width="22" height="22" rx="3" />
          </svg>
        </button>
        <!-- `suggerimento` e non `aiuto`: quello è il ? della barra, che c'è in tutti i giochi.
             Non si spegne mai, nemmeno mentre il coniglio corre: lì si prenota -->
        <button class="pp-tasto pp-aiuto" :class="{ 'pp-in-coda': inCoda }" data-azione="suggerimento"
                aria-label="suggerimento" :data-in-coda="inCoda ? '' : null" @click="emit('aiuto')">
          <span :key="colpo" class="pp-em" :class="{ 'pp-sobbalza': colpo > 0 }">💡</span>
          <!-- il prezzo, prima: una stella che se ne va -->
          <span v-if="costa" class="pp-costo" data-costa aria-hidden="true">
            <span class="pp-em">⭐</span><b>−</b>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
