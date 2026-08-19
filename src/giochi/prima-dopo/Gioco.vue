<script setup>
/* ═══════════════════════════════════════════════════════════════════
   PRIMA E DOPO — IL COORDINATORE

   Si rimettono in fila le vignette di una storia: il seme, il
   germoglio, il fiore. Niente trascinamento — si tocca una vignetta e
   vola nel primo posto libero — e niente da leggere per giocare: la
   consegna è la freccia del tempo in cima, il testo sotto è per chi
   legge e per i genitori.

   Una storia sbagliata non punisce e non si liquida in mezzo secondo:
   si conta l'errore e si apre la spiegazione (`viste/Spiegazione.vue`),
   che fa vedere la storia intera in grande, un passo per riga, con
   sotto cos'è — e si va avanti quando lo dice il bambino. Questo file
   decide solo *quando* aprirla. È anche l'unico file del gioco che sa
   che esistono le monete: le regole stanno in `motore/`, le storie e i
   verbi in `dati/`, le schermate in `viste/`.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { addCoins, segna, segnaBest } from '../../store/profile.js'
import { progresso, aperta, stelleDi, completa } from '../campagne.js'

import { CAMPAGNA, SCALINI, QUANTE_TAPPE, tappeDelloScalino } from './dati/campagna.js'
import { verbo as datiVerbo } from './dati/verbi.js'
import { Corsa } from './motore/corsa.js'
import { spiegazione } from './motore/quesito.js'

import Mappa from './viste/Mappa.vue'
import Storia from './viste/Storia.vue'
import Spiegazione from './viste/Spiegazione.vue'
import Finale from './viste/Finale.vue'
import './stile.css'

defineOptions({ name: 'PrimaEDopo' })
const emit = defineEmits(['vai'])

const CHIAVE = 'prima'
const RESPIRO = 550        // quanto resta a schermo il segno di giusto
/* La finestra cieca di sempre (vedi CLAUDE.md): una domanda appena
   comparsa non si lascia toccare subito. Qui serve due volte — dopo la
   spunta di una storia giusta e dopo il «ho capito» della spiegazione —
   perché la domanda dopo nasce esattamente sotto il dito che ha appena
   premuto, e su un telefono quel dito si lascia dietro un click. */
const CIECA = 320

/* ═══════════ dove siamo ═══════════ */
const vista = ref('mappa')          // mappa | tavolo
const tappaIdx = ref(-1)
const corsa = ref(null)             // la tappa in corso (motore, reso reattivo)
const finale = ref(null)            // il cartello di fine tappa, quando c'è
const spiega = ref(null)            // la spiegazione dell'errore, quando c'è
const fase = ref('gioca')           // gioca | vinta | spiega
const cieco = ref(false)            // la domanda è appena comparsa: non si tocca
const serie = ref(0)                // storie filate senza un errore, di fila

const avanza = progresso(CHIAVE)
const quesito = computed(() => corsa.value?.quesito || null)
const verboAttuale = computed(() => quesito.value ? datiVerbo(quesito.value.verbo) : null)

/* ═══════════ la mappa ═══════════ */
const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    aperta: aperta(CHIAVE, t.indice),
    adesso: t.indice === avanza.tappa,
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

/* ═══════════ il colore di dove siamo ═══════════
   Ogni tappa porta il suo accento (dichiarato in `dati/campagna.js`):
   qui non c'è un tema da cui ricavarlo, come nel Codice Segreto — la
   storia stessa è già il vestito. */
const accento = computed(() => tappaIdx.value >= 0 ? CAMPAGNA[tappaIdx.value].accento : '#2f9e44')
const titolo = computed(() => tappaIdx.value >= 0 ? CAMPAGNA[tappaIdx.value].nome : 'Prima e dopo')

/* ═══════════ i suoni ═══════════
   Sintetizzati come in tutti gli altri giochi, e **nessuno di loro dice
   niente che non si veda già**: il verso del tempo lo dice la freccia in
   cima e le vignette che si accendono in fila, non l'altezza della nota.
   Una scala che sale sarebbe informazione affidata all'audio, e l'audio
   qui si spegne dalla barra — un gioco che col silenzio non si capisce
   più è un gioco rotto per metà dei bambini.
   Sono due soltanto: il tonfo di una vignetta che si posa e la nota
   che scende quando la fila era sbagliata. La spiegazione che segue
   non suona niente — si guarda e, se c'è un grande, si legge; una nota
   per vignetta coprirebbe la voce di chi legge, che lì è la cosa più
   utile che ci sia.
   NOTA PER DOMANI: quando ci sarà la voce italiana, la consegna letta
   ad alta voce entra qui, non nella vista — `Storia.vue` riceve solo
   funzioni già decise. */
const suoni = {
  posa: () => suono.nota(520, 520, 0.09, 'triangle', 0.10),
  storto: () => suono.nota(320, 260, 0.2, 'sine', 0.08),
}

/* ═══════════ giocare ═══════════ */
let attesa = 0
let sbarra = 0
onUnmounted(() => { clearTimeout(attesa); clearTimeout(sbarra) })

/* Una domanda nuova a schermo: per un istante non risponde a niente. */
function domandaNuova() {
  clearTimeout(sbarra)
  cieco.value = true
  sbarra = setTimeout(() => { cieco.value = false }, CIECA)
}

function alTavolo(nuovaCorsa, indice) {
  clearTimeout(attesa)
  tappaIdx.value = indice
  corsa.value = nuovaCorsa
  finale.value = null
  spiega.value = null
  fase.value = 'gioca'
  vista.value = 'tavolo'
  domandaNuova()
}

const avviaTappa = i => alTavolo(Corsa.perTappa(CAMPAGNA[i]), i)

function tocca(id) {
  if (fase.value !== 'gioca' || cieco.value || !quesito.value) return
  const q = quesito.value
  const esito = q.tocca(id)
  if (!esito) return                // tocco ignorato: fuori posto, o niente da togliere
  if (!q.finita) { suoni.posa(); return }   // un posa/togli che non ha ancora deciso niente

  if (q.esito === 'giusta') vinta()
  else sbagliata()
}

function vinta() {
  corsa.value.registraSuccesso()
  segna('storie')
  serie.value++
  segnaBest('serieStorie', serie.value)
  addCoins(2)
  suono.ok()
  fase.value = 'vinta'
  attesa = setTimeout(prossimo, RESPIRO)
}

function prossimo() {
  const c = corsa.value
  if (c.finita) { mostraFinale(); return }
  fase.value = 'gioca'
  c.avanti()
  domandaNuova()
}

function sbagliata() {
  corsa.value.registraErrore()
  serie.value = 0
  suoni.storto()
  /* la spiegazione si prepara **adesso**, con il quesito ancora nello
     stato sbagliato: è da lì che si sa cosa era stato scelto */
  spiega.value = spiegazione(quesito.value)
  fase.value = 'spiega'
}

/* «ho capito», o il foglio che si chiude da sé: la stessa storia,
   riproposta in un'altra forma. Rimetterla identica come la si è appena
   vista sarebbe copiare, non ripensarci. */
function fineSpiegazione() {
  corsa.value.riprova()
  spiega.value = null
  fase.value = 'gioca'
  domandaNuova()
}

function mostraFinale() {
  const c = corsa.value
  completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: c.stelle })
  segna('storieTappe')
  finale.value = { titolo: CAMPAGNA[tappaIdx.value].nome, stelle: c.stelle,
                   monete: c.monete, errori: c.errori }
  suono.livello()
}

function allaMappa() {
  clearTimeout(attesa)
  finale.value = null
  spiega.value = null
  corsa.value = null
  vista.value = 'mappa'
}

function indietro() {
  if (vista.value === 'mappa') emit('vai', 'home')
  else allaMappa()
}
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" guida="prima" monete @indietro="indietro" />

    <div class="pd" :style="{ '--pd-accento': accento }">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" @gioca="avviaTappa" />

      <Storia v-else-if="quesito" :quesito="quesito" :verbo="verboAttuale" :fase="fase"
              @tocca="tocca" />

      <Spiegazione v-if="spiega" :spiega="spiega" @avanti="fineSpiegazione" />
      <Finale v-if="finale" v-bind="finale" @avanti="allaMappa" />
    </div>
  </div>
</template>
