<script setup>
// Il coordinatore: si rimettono in fila le vignette di una storia. Una
// storia sbagliata non punisce e non si liquida in mezzo secondo: si
// conta l'errore e si apre la spiegazione (viste/Spiegazione.vue), che
// fa vedere la storia intera e si va avanti quando lo dice il bambino
// — questo file decide solo *quando* aprirla. È l'unico file del gioco
// che sa che esistono le monete: le regole stanno in `motore/`, le
// storie e i verbi in `dati/`, le schermate in `viste/`.
import { ref, computed, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { segna, segnaBest } from '../../store/profile.js'
import { borsa } from '../../store/varieta.js'
import { PAGA } from '../../data/paghe.js'
import { aperta, adesso, chiusaPerEta, stelleDi, completa } from '../campagne.js'

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
// La finestra cieca di sempre (docs/core/interfaccia.md): serve due
// volte qui — dopo la spunta di una storia giusta e dopo il «ho capito»
// della spiegazione — perché la domanda dopo nasce sotto il dito che ha
// appena premuto.
const CIECA = 320

const vista = ref('mappa')          // mappa | tavolo
const tappaIdx = ref(-1)
const corsa = ref(null)             // la tappa in corso (motore, reso reattivo)
const finale = ref(null)            // il cartello di fine tappa, quando c'è
const spiega = ref(null)            // la spiegazione dell'errore, quando c'è
const fase = ref('gioca')           // gioca | vinta | spiega
const cieco = ref(false)            // la domanda è appena comparsa: non si tocca
const serie = ref(0)                // storie filate senza un errore, di fila

const quesito = computed(() => corsa.value?.quesito || null)
const verboAttuale = computed(() => quesito.value ? datiVerbo(quesito.value.verbo) : null)

const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    aperta: aperta(CHIAVE, t.indice),
    perEta: chiusaPerEta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

// ogni tappa porta il suo accento (dati/campagna.js): qui non c'è un
// tema da cui ricavarlo, la storia stessa è già il vestito
const accento = computed(() => tappaIdx.value >= 0 ? CAMPAGNA[tappaIdx.value].accento : '#2f9e44')
const titolo = computed(() => tappaIdx.value >= 0 ? CAMPAGNA[tappaIdx.value].nome : 'Prima e dopo')

// nessuno dei due suoni dice niente che non si veda già: il verso del
// tempo lo dice la freccia in cima, non l'altezza della nota
const suoni = {
  posa: () => suono.nota(520, 520, 0.09, 'triangle', 0.10),
  storto: () => suono.nota(320, 260, 0.2, 'sine', 0.08),
}

let attesa = 0
let borsellino = borsa(CHIAVE)   // le monete di questa tappa, una storia alla volta
let sbarra = 0
onUnmounted(() => { clearTimeout(attesa); clearTimeout(sbarra) })

function domandaNuova() {
  clearTimeout(sbarra)
  cieco.value = true
  sbarra = setTimeout(() => { cieco.value = false }, CIECA)
}

function alTavolo(nuovaCorsa, indice) {
  clearTimeout(attesa)
  tappaIdx.value = indice
  corsa.value = nuovaCorsa
  borsellino = borsa(CHIAVE)
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
  borsellino.paga(PAGA.storia)   // subito, e a fine tappa niente di più: docs/prima-dopo/presentazione.md
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
  // si prepara adesso, col quesito ancora nello stato sbagliato: è da lì che si sa cosa era stato scelto
  spiega.value = spiegazione(quesito.value)
  fase.value = 'spiega'
}

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
                   monete: borsellino.dato, notaMonete: borsellino.nota(), errori: c.errori }
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
