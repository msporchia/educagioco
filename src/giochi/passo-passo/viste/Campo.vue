<script setup>
/* Il campo — la schermata della partita: mappa, fila, frecce, e in fondo
   ⌫ ▶ 💡 (vedi docs/passo-passo/regole.md e stelle-e-aiuti.md). Il canvas
   sta qui ma lo dipinge `scena/tela.js`, ricevuto da `Gioco.vue`
   (`defineExpose`): questa vista non sa disegnare. */
import { ref } from 'vue'
import Fila from './Fila.vue'
import { computed } from 'vue'
import Icona from './Icona.vue'
import Lastra from './Lastra.vue'
import Figura from './Figura.vue'
import Scritta from './Scritta.vue'
import { nomeDellaMossa, LASTRE, VERSI, CHIAVI_VERSI } from '../dati/mondo.js'
import { VOLTE, CASA } from '../dati/carte.js'
import { usaTasti } from '../../tastiera.js'
import TastoTastiera from '../../../components/TastoTastiera.vue'

const props = defineProps({
  fila: { type: Array, required: true },
  cursore: { type: Number, required: true },
  corrente: { type: Number, default: -1 },
  guasto: { type: Number, default: null },
  inCorsa: { type: Boolean, default: false },
  salti: { type: Boolean, default: false },
  attacca: { type: Boolean, default: false },    // sulla mappa ci sono guardie
  brilla: { type: String, default: null },       // la freccia (o 'via') che l'aiuto accende
  prezzo: { type: Number, default: null },       // il prossimo gradino del 💡: 0 gratis, null finita
  povero: { type: Boolean, default: false },     // le monete non bastano
  armato: { type: Boolean, default: false },     // un gradino caro aspetta il secondo tocco
  poveroScossa: { type: Number, default: 0 },    // 💡 toccato senza monete: il prezzo sobbalza
  pensiero: { type: Object, default: null },     // la frase del gradino: { testo, che }
  sospette: { type: Boolean, default: false },
  piena: { type: Boolean, default: false },      // la fila ha toccato il tetto tecnico
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
  tasti: { type: Boolean, default: true },       // la tastiera comanda (spenta sotto il finale e i fogli)
})
const emit = defineEmits(['freccia', 'cancella', 'via', 'ferma', 'aiuto', 'cursore', 'sposta', 'scatola', 'testa-scelta', 'testa',
                          'chiudi-pensiero'])
const ICONA_PENSIERO = { pensa: '🧠', dove: '🔎', pezzo: '🧩', svela: '✅' }

/* le scatole che il livello mette in mano: 🔁 se ha almeno una testa
   del ripeti, ❓ se ha il se */
const conRipeti = computed(() => ['ripeti', 'fino', 'casa'].some(c => props.carte.includes(c)))
const conSe = computed(() => props.carte.includes('se'))
/* cosa si può scegliere per la testa di questa scatola */
const numeri = computed(() => (props.sceltaTipo === 'ripeti' && props.carte.includes('ripeti') ? VOLTE : []))
const altri = computed(() => {
  if (props.sceltaTipo === 'se') return [...props.colori, ...(props.carte.includes('varco') ? CHIAVI_VERSI : [])]
  return [...(props.carte.includes('fino') ? props.colori : []), ...(props.carte.includes('casa') ? [CASA] : [])]
})
/* senza numeri i tasti sono una riga sola: sopra, cosa si sta scegliendo */
const domanda = computed(() => {
  if (props.sceltaTipo !== 'se') return 'Ripeti…'
  return altri.value.every(v => VERSI[v]) ? 'Se di là si passa…' : 'Se…'
})
const inParole = v => (v === CASA ? 'fino a casa' : VERSI[v] ? `se ${VERSI[v].nome} si passa`
  : `${props.sceltaTipo === 'se' ? 'se' : 'fino a'} ${(LASTRE[v] || {}).nome || v}`)

/* l'ordine dei tasti: sinistra, su, giù, destra — le due frecce verticali
   in mezzo, come sulla tastiera di un computer */
const ORDINE = ['sinistra', 'su', 'giu', 'destra']

/* la tastiera fa quello che fanno i pulsanti, con gli stessi divieti (docs/passo-passo/regole.md, «La tastiera») */
const libero = () => !props.inCorsa && !props.piena
const passo = v => () => libero() && emit('freccia', v)
const salto = v => () => props.salti && libero() && emit('freccia', 'salto-' + v)
const scegliNumero = n => () => props.scelta != null && !props.inCorsa && numeri.value.includes(n) && emit('testa-scelta', n)
usaTasti({
  ArrowLeft: passo('sinistra'), ArrowUp: passo('su'), ArrowDown: passo('giu'), ArrowRight: passo('destra'),
  'Shift+ArrowLeft': salto('sinistra'), 'Shift+ArrowUp': salto('su'), 'Shift+ArrowDown': salto('giu'), 'Shift+ArrowRight': salto('destra'),
  a: () => props.attacca && libero() && emit('freccia', 'attacca'),
  r: () => conRipeti.value && libero() && emit('scatola', 'ripeti'),
  s: () => conSe.value && libero() && emit('scatola', 'se'),
  Backspace: () => !props.inCorsa && props.cursore > 0 && emit('cancella'),
  Enter: () => emit(props.inCorsa ? 'ferma' : 'via'),
  Spazio: () => emit(props.inCorsa ? 'ferma' : 'via'),
  ...Object.fromEntries(VOLTE.map(n => [String(n), scegliNumero(n)])),
}, { attivo: () => props.tasti })

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
          @cursore="i => emit('cursore', i)" @sposta="s => emit('sposta', s)" @freccia="m => emit('freccia', m)"
          @testa="i => emit('testa', i)" />

    <div class="pp-tasti">
      <div class="pp-pulsantiera">
        <div class="pp-riga">
          <button v-for="v in ORDINE" :key="v" class="pp-tasto pp-passo"
                  :class="{ 'pp-brilla': brilla === v }"
                  :data-freccia="v" :aria-label="nomeDellaMossa(v)"
                  :disabled="inCorsa || piena" @click="emit('freccia', v)">
            <Icona :mossa="v" />
          </button>
        </div>
        <div v-if="salti" class="pp-riga">
          <button v-for="v in ORDINE" :key="v" class="pp-tasto pp-salto"
                  :class="{ 'pp-brilla': brilla === 'salto-' + v }"
                  :data-salto="v" :aria-label="nomeDellaMossa('salto-' + v)"
                  :disabled="inCorsa || piena" @click="emit('freccia', 'salto-' + v)">
            <Icona :mossa="'salto-' + v" />
            <TastoTastiera class="pp-tasto-tastiera" nome="⇧" />
          </button>
        </div>
        <div v-if="conRipeti || conSe || attacca" class="pp-riga pp-carte"
             :style="{ '--pp-quante': [conRipeti, conSe, attacca].filter(Boolean).length }">
          <button v-if="attacca" class="pp-tasto pp-ripeti pp-attacca" :class="{ 'pp-brilla': brilla === 'attacca', 'pp-stretta': conRipeti && conSe }"
                  data-freccia="attacca" aria-label="attacca" :disabled="inCorsa || piena" @click="emit('freccia', 'attacca')">
            <Figura nome="attacca" /><Scritta v-if="!(conRipeti && conSe)" testo="attacca" />
            <TastoTastiera class="pp-tasto-tastiera" nome="A" />
          </button>
          <button v-if="conRipeti" class="pp-tasto pp-ripeti" :class="{ 'pp-brilla': brilla === 'ripeti' }"
                  data-carta="ripeti" aria-label="ripeti" :disabled="inCorsa || piena" @click="emit('scatola', 'ripeti')">
            <Figura nome="ripeti" /><Scritta testo="ripeti" />
            <TastoTastiera class="pp-tasto-tastiera" nome="R" />
          </button>
          <button v-if="conSe" class="pp-tasto pp-ripeti pp-tasto-se" :class="{ 'pp-brilla': brilla === 'se' }"
                  data-carta="se" aria-label="se" :disabled="inCorsa || piena" @click="emit('scatola', 'se')">
            <Figura nome="se" /><Scritta testo="se" />
            <TastoTastiera class="pp-tasto-tastiera" nome="S" />
          </button>
        </div>
        <!-- la testa: copre le frecce finché non si sceglie, e non le
             sposta. Si chiude scegliendo, o toccando qualunque altra cosa.
             I numeri su una riga sola quando sotto ci sono anche i colori -->
        <div v-if="scelta != null && !inCorsa" :key="scossa" class="pp-scelta-volte"
             :class="{ 'pp-scossa': scossa > 0, 'pp-con-colori': numeri.length && altri.length,
                       'pp-solo-colori': !numeri.length, 'pp-scelta-se': sceltaTipo === 'se' }"
             :style="{ '--pp-quanti': Math.min(4, altri.length) }" data-scelta-volte>
          <p v-if="!numeri.length" class="pp-scelta-domanda"><Scritta :testo="domanda" /></p>
          <button v-for="n in numeri" :key="n" class="pp-tasto pp-volte"
                  :class="{ 'pp-brilla': consiglioValore === n, 'pp-ora': valoreOra === n }"
                  :data-volte-scegli="n" :aria-label="`${n} volte`" @click="emit('testa-scelta', n)"><Scritta :testo="n" /></button>
          <button v-for="c in altri" :key="c" class="pp-tasto pp-volte pp-colore"
                  :class="{ 'pp-brilla': consiglioValore === c, 'pp-ora': valoreOra === c }"
                  :data-volte-scegli="c" :aria-label="inParole(c)" @click="emit('testa-scelta', c)">
            <Scritta v-if="sceltaTipo !== 'se'" class="pp-fino" testo="fino a" /><Lastra :colore="c" />
          </button>
        </div>
      </div>
      <div class="pp-riga pp-azioni">
        <button class="pp-tasto pp-cancella" :class="{ 'pp-brilla': brilla === 'cancella' }"
                data-azione="cancella" aria-label="togli la freccia"
                :disabled="inCorsa || cursore === 0" @click="emit('cancella')">
          <Figura nome="cancella" />
          <TastoTastiera class="pp-tasto-tastiera" nome="⌫" />
        </button>
        <button v-if="!inCorsa" class="pp-tasto pp-via" :class="{ 'pp-brilla': brilla === 'via' }"
                data-azione="via" aria-label="via" @click="emit('via')">
          <Figura nome="via" />
          <TastoTastiera class="pp-tasto-tastiera" nome="↵" />
        </button>
        <button v-else class="pp-tasto pp-ferma" data-azione="ferma" aria-label="ferma" @click="emit('ferma')">
          <Figura nome="ferma" />
          <TastoTastiera class="pp-tasto-tastiera" nome="↵" />
        </button>
        <!-- `suggerimento` e non `aiuto`: quello è il ? della barra, che c'è in tutti i giochi.
             Non si spegne mai, nemmeno mentre il coniglio corre: lì si prenota -->
        <button class="pp-tasto pp-aiuto" :class="{ 'pp-in-coda': inCoda, 'pp-armato': armato }"
                data-azione="suggerimento" aria-label="suggerimento" :data-in-coda="inCoda ? '' : null"
                :data-armato="armato ? '' : null" @click="emit('aiuto')">
          <span :key="colpo" class="pp-lampadina" :class="{ 'pp-sobbalza': colpo > 0 }"><Figura nome="lampadina" /></span>
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
