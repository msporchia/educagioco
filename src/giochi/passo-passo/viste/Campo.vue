<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO — la schermata della partita

   Dall'alto in basso: la mappa, la fila, le frecce, e in fondo ⌫ ▶ 💡.
   È l'ordine in cui si pensa: guardo dove devo andare, guardo cosa ho
   scritto, aggiungo una freccia, provo.

   Le frecce sono **assolute**: ↑ vuol dire verso la cima dello schermo,
   sempre, comunque sia girato il coniglio. La seconda fila, quella dei
   salti, c'è solo nei livelli che la usano. La terza, quella delle
   carte, dal gradino del ripeti: 🔁 (e dal gradino del se, ❓) mette una
   scatola dove sta il cursore, col cursore dentro, e sopra le frecce
   compare la scelta della testa — i numeri da due a nove, i colori
   delle lastre che ci sono nella mappa, la casa: solo quello che il
   livello accende, e niente già scelto. La N resta N finché non la tocca
   il bambino (è la regola del costruttore: un valore di comodo si legge
   come l'unico possibile). La scelta copre le frecce e non le sposta: se
   la pulsantiera cambiasse altezza, la mappa sopra ballerebbe.

   Il 💡 dice **prima** di essere toccato cosa costa il prossimo
   gradino della sua scala (`motore/aiuti.js`): niente sui due gradini
   gratis, un bollino con la moneta sugli altri — 🪙10, 50, 100, 200.
   Senza monete il bollino si spegne e sobbalza al tocco; da cinquanta
   in su il primo tocco lo arma (il bollino chiede «?») e paga il
   secondo. La frase di un gradino compare **sopra la mappa**, in cima,
   e non sposta niente: una striscia in mezzo farebbe ballare la tela.
   Si chiude toccandola.

   Il canvas sta qui dentro ma lo dipinge `scena/tela.js`, che lo riceve
   da `Gioco.vue` (`defineExpose`): questa vista non sa disegnare.
   ═══════════════════════════════════════════════════════════════════ */
import { ref } from 'vue'
import Fila from './Fila.vue'
import { computed } from 'vue'
import Icona from './Icona.vue'
import Lastra from './Lastra.vue'
import { nomeDellaMossa, LASTRE } from '../dati/mondo.js'
import { VOLTE, CASA } from '../dati/carte.js'

const props = defineProps({
  fila: { type: Array, required: true },
  cursore: { type: Number, required: true },
  corrente: { type: Number, default: -1 },
  guasto: { type: Number, default: null },
  inCorsa: { type: Boolean, default: false },
  salti: { type: Boolean, default: false },
  brilla: { type: String, default: null },       // la freccia (o 'via') che l'aiuto accende
  prezzo: { type: Number, default: null },       // il prossimo gradino del 💡: 0 gratis, null finita
  povero: { type: Boolean, default: false },     // le monete non bastano
  armato: { type: Boolean, default: false },     // un gradino caro aspetta il secondo tocco
  poveroScossa: { type: Number, default: 0 },    // 💡 toccato senza monete: il prezzo sobbalza
  pensiero: { type: Object, default: null },     // la frase del gradino: { testo, che }
  sospette: { type: Boolean, default: false },
  piena: { type: Boolean, default: false },      // la fila ha toccato il tetto tecnico
  manina: { type: String, default: null },       // la prima volta: dove toccare
  consiglio: { type: String, default: null },    // la carta che l'aiuto propone
  colpo: { type: Number, default: 0 },           // ogni 💡 premuto: la lampadina sobbalza
  inCoda: { type: Boolean, default: false },     // 💡 premuto durante la corsa: arriva alla fine
  carte: { type: Array, default: () => [] },     // le carte oltre alle frecce: ['ripeti']
  zaino: { type: Number, default: null },        // quante carte tiene la fila
  giri: { type: Array, default: null },          // a che giro sono le scatole
  colori: { type: Array, default: () => [] },    // i colori delle lastre che ci sono nella mappa
  scelta: { type: Number, default: null },       // la scatola di cui si sceglie la testa
  sceltaTipo: { type: String, default: 'ripeti' }, // ripeti | se
  valoreOra: { type: [Number, String], default: null },       // quello che ha adesso (null: è una N)
  consiglioValore: { type: [Number, String], default: null }, // quello che l'aiuto accende
  consiglioTesta: { type: Number, default: null }, // la scatola a cui l'aiuto cambia la testa
  scossa: { type: Number, default: 0 },          // ▶ fermato da una N: la scelta sobbalza
})
const emit = defineEmits(['freccia', 'cancella', 'via', 'ferma', 'aiuto', 'cursore', 'scatola', 'testa-scelta', 'testa',
                          'chiudi-pensiero'])
const ICONA_PENSIERO = { pensa: '🧠', dove: '🔎', pezzo: '🧩', svela: '✅' }

/* le scatole che il livello mette in mano: 🔁 se ha almeno una testa
   del ripeti, ❓ se ha il se */
const conRipeti = computed(() => ['ripeti', 'fino', 'casa'].some(c => props.carte.includes(c)))
const conSe = computed(() => props.carte.includes('se'))
/* cosa si può scegliere per la testa di questa scatola */
const numeri = computed(() => (props.sceltaTipo === 'ripeti' && props.carte.includes('ripeti') ? VOLTE : []))
const altri = computed(() => {
  if (props.sceltaTipo === 'se') return props.colori
  return [...(props.carte.includes('fino') ? props.colori : []), ...(props.carte.includes('casa') ? [CASA] : [])]
})
const inParole = v => (v === CASA ? 'fino a casa' : `${props.sceltaTipo === 'se' ? 'se' : 'fino a'} ${(LASTRE[v] || {}).nome || v}`)

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
      <!-- la frase del 💡: in cima alla mappa, e non sposta niente -->
      <button v-if="pensiero && !inCorsa" type="button" class="pp-pensiero" :class="'pp-pensiero-' + pensiero.che"
              data-pensiero :data-che="pensiero.che" @click="emit('chiudi-pensiero')">
        <span class="pp-em" aria-hidden="true">{{ ICONA_PENSIERO[pensiero.che] || '💡' }}</span>
        <span class="pp-pensiero-testo">{{ pensiero.testo }}</span>
      </button>
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
        <div v-if="conRipeti || conSe" class="pp-riga pp-carte" :class="{ 'pp-due': conRipeti && conSe }">
          <button v-if="conRipeti" class="pp-tasto pp-ripeti" :class="{ 'pp-brilla': brilla === 'ripeti' }"
                  data-carta="ripeti" aria-label="ripeti" :disabled="inCorsa || piena" @click="emit('scatola', 'ripeti')">
            <span class="pp-em" aria-hidden="true">🔁</span><span class="pp-parola">ripeti</span>
            <span v-if="manina === 'ripeti'" class="pp-manina pp-em" data-manina aria-hidden="true">👆</span>
          </button>
          <button v-if="conSe" class="pp-tasto pp-ripeti pp-tasto-se" :class="{ 'pp-brilla': brilla === 'se' }"
                  data-carta="se" aria-label="se" :disabled="inCorsa || piena" @click="emit('scatola', 'se')">
            <span class="pp-em" aria-hidden="true">❓</span><span class="pp-parola">se</span>
          </button>
        </div>
        <!-- la testa: copre le frecce finché non si sceglie, e non le
             sposta. Si chiude scegliendo, o toccando qualunque altra cosa.
             I numeri su una riga sola quando sotto ci sono anche i colori -->
        <div v-if="scelta != null && !inCorsa" :key="scossa" class="pp-scelta-volte"
             :class="{ 'pp-scossa': scossa > 0, 'pp-con-colori': numeri.length && altri.length,
                       'pp-solo-colori': !numeri.length, 'pp-scelta-se': sceltaTipo === 'se' }" data-scelta-volte>
          <button v-for="n in numeri" :key="n" class="pp-tasto pp-volte"
                  :class="{ 'pp-brilla': consiglioValore === n, 'pp-ora': valoreOra === n }"
                  :data-volte-scegli="n" :aria-label="`${n} volte`" @click="emit('testa-scelta', n)">{{ n }}</button>
          <button v-for="c in altri" :key="c" class="pp-tasto pp-volte pp-colore"
                  :class="{ 'pp-brilla': consiglioValore === c, 'pp-ora': valoreOra === c }"
                  :data-volte-scegli="c" :aria-label="inParole(c)" @click="emit('testa-scelta', c)">
            <span v-if="sceltaTipo !== 'se'" class="pp-fino">fino a</span><Lastra :colore="c" />
          </button>
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
        <button class="pp-tasto pp-aiuto" :class="{ 'pp-in-coda': inCoda, 'pp-armato': armato }"
                data-azione="suggerimento" aria-label="suggerimento" :data-in-coda="inCoda ? '' : null"
                :data-armato="armato ? '' : null" @click="emit('aiuto')">
          <span :key="colpo" class="pp-em" :class="{ 'pp-sobbalza': colpo > 0 }">💡</span>
          <!-- il prezzo, prima: una moneta col suo numero. Sui gradini
               gratis non c'è niente da dire, e il bollino non c'è -->
          <span v-if="prezzo" :key="'p' + poveroScossa" class="pp-costo"
                :class="{ 'pp-povero': povero, 'pp-scossa': poveroScossa > 0 && povero }"
                data-costa :data-prezzo="prezzo" aria-hidden="true">
            <span class="pp-em">🪙</span><b>{{ prezzo }}</b><b v-if="armato" class="pp-chiede">?</b>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
