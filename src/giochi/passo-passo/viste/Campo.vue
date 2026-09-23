<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO — la schermata della partita

   Dall'alto in basso: la mappa, la fila, le frecce, e in fondo ⌫ ▶ 💡.
   È l'ordine in cui si pensa: guardo dove devo andare, guardo cosa ho
   scritto, aggiungo una freccia, provo.

   Le frecce sono **assolute**: ↑ vuol dire verso la cima dello schermo,
   sempre, comunque sia girato il coniglio. La seconda fila, quella dei
   salti, c'è solo nei livelli che la usano.

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
})
const emit = defineEmits(['freccia', 'cancella', 'via', 'ferma', 'aiuto', 'cursore'])

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
          :in-corsa="inCorsa" :sospette="sospette" @cursore="i => emit('cursore', i)" />

    <div class="pp-tasti">
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
      <div class="pp-riga pp-azioni">
        <button class="pp-tasto pp-cancella" data-azione="cancella" aria-label="togli la freccia"
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
        <!-- `suggerimento` e non `aiuto`: quello è il ? della barra, che c'è in tutti i giochi -->
        <button class="pp-tasto pp-aiuto" data-azione="suggerimento" aria-label="suggerimento"
                :disabled="inCorsa" @click="emit('aiuto')">
          <span class="pp-em">💡</span>
          <!-- il prezzo, prima: una stella che se ne va -->
          <span v-if="costa" class="pp-costo" data-costa aria-hidden="true">
            <span class="pp-em">⭐</span><b>−</b>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
