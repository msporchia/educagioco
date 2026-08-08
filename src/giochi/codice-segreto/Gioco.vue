<script setup>
/* ═══════════════════════════════════════════════════════════════════
   CODICE SEGRETO — IL COORDINATORE

   Il gioco nasconde un codice di disegni. Il bambino prova una
   combinazione, il gioco risponde con i pallini: verde pieno = disegno
   giusto al posto giusto, cerchio arancione = disegno giusto ma nel
   posto sbagliato. Sei prove (otto nello scaglione più duro).

   Non c'è matematica e non c'è un regolamento da leggere: la prima volta
   si apre da sola una spiegazione senza parole di pochi secondi, che
   mostra da dove vengono i due pallini. È la scommessa di questo gioco.

   Questo file mette insieme i pezzi e **è l'unico che sa che esistono le
   monete**: le regole stanno in `motore/`, i disegni e le tappe in
   `dati/`, le animazioni in `scena/`, le schermate in `viste/`. Se
   qualcosa qui dentro comincia a somigliare a una regola di gioco, vuol
   dire che è nel file sbagliato.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { addCoins, segna, segnaBest } from '../../store/profile.js'
import { progresso, aperta, stelleDi, completa, scelta, ricorda } from '../campagne.js'

import { CAMPAGNA, SCALINI, QUANTE_TAPPE, tappeDelloScalino } from './dati/campagna.js'
import { SCAGLIONI, PREDEFINITO } from './dati/difficolta.js'
import { TEMI, CHIAVI_TEMI } from './dati/temi.js'
import { Regole } from './motore/partita.js'
import { Corsa } from './motore/corsa.js'
import { passiSpiegazione } from './motore/indizi.js'
import { Coriandoli } from './scena/coriandoli.js'

import Mappa from './viste/Mappa.vue'
import Libero from './viste/Libero.vue'
import Tavolo from './viste/Tavolo.vue'
import Finale from './viste/Finale.vue'
import Spiegazione from './viste/Spiegazione.vue'
import './stile.css'

defineOptions({ name: 'CodiceSegreto' })
const emit = defineEmits(['vai'])

const CHIAVE = 'codice'
const RESPIRO = 700        // quanto si guarda il tabellone prima del cartello

/* ═══════════ dove siamo ═══════════ */
const vista = ref('mappa')          // mappa | manopole | tavolo
const tappaIdx = ref(-1)            // -1 = gioco libero
const corsa = ref(null)             // la tappa in corso (motore, reso reattivo)
const finale = ref(null)            // il cartello di fine, quando c'è
const spiega = ref(false)
const posata = ref(-1)              // l'ultima buca riempita: solo per il tonfo
const rifiuti = ref(0)              // dita finite su una riga già piena
const serie = ref(0)                // codici indovinati di fila

const avanza = progresso(CHIAVE)
const libero = computed(() => tappaIdx.value < 0)
const partita = computed(() => corsa.value?.partita || null)

/* ═══════════ la mappa ═══════════
   Le tappe arrivano alla vista già decise: cosa è aperto, quante stelle,
   di che colore. La schermata non deve chiedere niente a nessuno. */
const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    icona: TEMI[t.tema].icona,
    accento: TEMI[t.tema].accento,
    temaNome: TEMI[t.tema].nome,
    aperta: aperta(CHIAVE, t.indice),
    adesso: t.indice === avanza.tappa,
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

/* il libero si apre a campagna finita — o subito, se i genitori hanno
   tolto i lucchetti a tutto: `aperta` sa già anche di quello */
const statoLibero = computed(() => ({
  aperto: aperta(CHIAVE, QUANTE_TAPPE),
  quante: QUANTE_TAPPE,
  fatte: Math.min(avanza.tappa, QUANTE_TAPPE),
}))

/* ═══════════ le manopole del gioco libero ═══════════ */
const scDifficolta = ref(scelta(CHIAVE, 'difficolta', PREDEFINITO))
const scTema = ref(scelta(CHIAVE, 'tema', CHIAVI_TEMI[0]))
const temiInElenco = CHIAVI_TEMI.map(k => ({ chiave: k, ...TEMI[k] }))
function scegliDifficolta(k) { scDifficolta.value = ricorda(CHIAVE, 'difficolta', k) }
function scegliTema(k) { scTema.value = ricorda(CHIAVE, 'tema', k) }

/* ═══════════ il colore di dove siamo ═══════════ */
const accento = computed(() =>
  partita.value ? partita.value.regole.accento
  : libero.value ? TEMI[scTema.value].accento
  : '#4f6bd0')

const titolo = computed(() =>
  vista.value === 'tavolo' && !libero.value ? CAMPAGNA[tappaIdx.value].nome
  : vista.value === 'tavolo' ? 'gioco libero'
  : 'Codice Segreto')

/* ═══════════ i suoni ═══════════
   Sintetizzati come in tutti gli altri giochi: un file audio in più nel
   build unico peserebbe più di tutto il gioco messo insieme. */
const suoni = {
  posa: i => suono.nota(520 + i * 90, 520 + i * 90, 0.10, 'triangle', 0.10),
  pieno: () => suono.nota(660, 660, 0.12, 'triangle', 0.11),
  vuoto: () => suono.nota(430, 430, 0.14, 'triangle', 0.10),
  niente: () => suono.nota(200, 140, 0.16, 'sawtooth', 0.08),
}

/* ═══════════ giocare ═══════════ */
let attesa = 0
onUnmounted(() => clearTimeout(attesa))

function alTavolo(nuovaCorsa, indice) {
  clearTimeout(attesa)
  tappaIdx.value = indice
  corsa.value = nuovaCorsa
  finale.value = null
  posata.value = -1
  vista.value = 'tavolo'
  primaVolta()
}

const avviaTappa = i => alTavolo(Corsa.perTappa(CAMPAGNA[i]), i)

/* nel libero non si contano i codici: si gioca finché va. La corsa non
   finisce mai, e ogni codice è una partita a sé. */
const avviaLibero = () =>
  alTavolo(new Corsa(Regole.libere(scDifficolta.value, scTema.value), Infinity), -1)

function posa(simbolo) {
  const buca = partita.value.posa(simbolo)
  if (buca === false) { rifiuti.value++; suono.no(); return }
  posata.value = buca
  suoni.posa(buca)
}

function togli(i) {
  if (partita.value.togli(i)) {
    posata.value = -1
    suono.nota(300, 300, 0.09, 'sine', 0.08)
  }
}

function conferma() {
  const p = partita.value
  const prova = p.conferma()
  if (!prova) return
  posata.value = -1
  suono.ok()
  if (!p.finita) return

  /* la corsa tira la riga: una persa non fa arretrare, ma si vede nelle
     stelle della tappa */
  const tappaFinita = corsa.value.registra()
  if (p.vinta) {
    addCoins(p.monete)
    segna('codici')
    serie.value++
    segnaBest('serieCodici', serie.value)
  } else serie.value = 0

  attesa = setTimeout(() => mostraFinale(tappaFinita), RESPIRO)
}

function mostraFinale(tappaFinita) {
  const p = partita.value
  const c = corsa.value
  if (tappaFinita) {
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: c.stelle })
    segna('codiciTappe')
    finale.value = { che: 'tappa', vinta: true, codice: p.codice, stelle: c.stelle,
                     monete: c.monete, titolo: CAMPAGNA[tappaIdx.value].nome, rimaste: 0 }
    suono.livello()
    coriandoli()
  } else {
    finale.value = { che: 'partita', vinta: p.vinta, codice: p.codice,
                     stelle: p.stelle, monete: p.monete, rimaste: c.rimaste,
                     titolo: '' }
    if (p.vinta) { suono.moneta(); coriandoli() } else suono.fine()
  }
}

function avanti() {
  if (finale.value?.che === 'tappa') return allaMappa()
  finale.value = null
  posata.value = -1        // il tonfo appartiene alla riga di prima
  festa?.ferma()
  corsa.value.avanti()
}

function allaMappa() {
  clearTimeout(attesa)
  festa?.ferma()
  finale.value = null
  corsa.value = null
  vista.value = 'mappa'
}

function indietro() {
  if (vista.value === 'mappa') emit('vai', 'home')
  else allaMappa()
}

/* ═══════════ coriandoli ═══════════ */
const tela = ref(null)
let festa = null
function coriandoli() {
  if (!tela.value) return
  festa = festa || new Coriandoli(tela.value)
  festa.lancia()
}

/* ═══════════ la spiegazione senza parole ═══════════
   Si apre da sola la prima volta, e poi solo col «?» in barra. I disegni
   sono quelli della tappa in cui si sta entrando: la spiegazione è un
   esempio di questo gioco, non di un altro. */
const esempio = computed(() => {
  const pool = partita.value ? partita.value.regole.pool : TEMI[CAMPAGNA[0].tema].simboli
  const codice = [pool[0], pool[1], pool[2]]
  const tentativo = [pool[0], pool[2], pool[3]]
  return { codice, tentativo, passi: passiSpiegazione(codice, tentativo) }
})

function primaVolta() {
  if (!scelta(CHIAVE, 'spiegata', false)) spiega.value = true
}
function chiudiSpiegazione() {
  spiega.value = false
  ricorda(CHIAVE, 'spiegata', true)
}
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" monete @indietro="indietro">
      <button class="tondo" aria-label="come si gioca" @click="spiega = true">?</button>
    </Barra>

    <div class="cs" :style="{ '--cs-accento': accento }">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" :libero="statoLibero"
             @gioca="avviaTappa" @libero="vista = 'manopole'" />

      <Libero v-else-if="vista === 'manopole'"
              :scaglioni="SCAGLIONI" :temi="temiInElenco"
              :difficolta="scDifficolta" :tema="scTema"
              @difficolta="scegliDifficolta" @tema="scegliTema" @gioca="avviaLibero" />

      <Tavolo v-else-if="partita" :partita="partita" :posata="posata" :rifiuti="rifiuti"
              @posa="posa" @togli="togli" @conferma="conferma" />

      <canvas ref="tela" class="cs-coriandoli" hidden></canvas>

      <Finale v-if="finale" v-bind="finale" :libero="libero"
              @avanti="avanti" @esci="allaMappa" />

      <Spiegazione v-if="spiega" :codice="esempio.codice" :tentativo="esempio.tentativo"
                   :passi="esempio.passi" :suona="t => suoni[t]?.()"
                   @chiudi="chiudiSpiegazione" />
    </div>
  </div>
</template>
