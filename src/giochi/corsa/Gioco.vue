<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA CORSA DEI NUMERI — IL COORDINATORE

   Si corre da soli su tre corsie e si sceglie solo **dove**. Ogni tanto
   arriva un cancello — `×3`, `+50`, `÷5 +80` — e quello che c'è scritto
   succede alla truppa, che è un numero scritto in terra: cinque verdi
   fanno un rosso, cinque rossi un blu. Il conto **è** la mossa di gioco,
   non un pedaggio: sbagliarlo non è un voto brutto, è arrivare al mostro
   con meno soldati.

   Uno dei tre cancelli, ogni tanto, è d'oro e ha un libro: vale `×5`, ma
   bisogna fermarsi e fare un esercizio. Le tre condizioni che ne fanno
   **un'offerta e non una tassa** sono tutte rispettate qui e nel motore:
   si vede prima, non è mai obbligatorio, e sbagliare non toglie niente.

   Questo file mette insieme i pezzi ed è **l'unico che sa che esistono
   le monete e l'avanzamento**: le regole stanno in `motore/`, i numeri
   in `dati/`, il disegno in `scena/`, le schermate in `viste/`. E non sa
   che materie esistano: chiede una domanda con una difficoltà da 0 a 1 e
   la mostra. Se qualcosa qui dentro comincia a somigliare a una regola di
   gioco, vuol dire che è nel file sbagliato.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { state, addCoins, segna, segnaBest } from '../../store/profile.js'
import { progresso, aperta, stelleDi, completa, scelta, ricorda } from '../campagne.js'
import { domandaPerGioco } from '../../quiz/scelta.js'
import Domanda from '../../quiz/Domanda.vue'

import { CAMPAGNA, SCALINI, LIBERA, QUANTE_TAPPE, tappeDelloScalino, secondiCirca }
  from './dati/campagna.js'
import { veste } from './dati/vesti.js'
import { Regole, Partita } from './motore/corsa.js'
import { Pista } from './scena/pista.js'
import { Giostra } from './scena/giostra.js'

import Mappa from './viste/Mappa.vue'
import PistaVista from './viste/Pista.vue'
import Finale from './viste/Finale.vue'
import './stile.css'

defineOptions({ name: 'Corsa' })
const emit = defineEmits(['vai'])

const CHIAVE = 'corsa'
const RESPIRO = 700          // quanto si guarda la pista prima del cartello

/* ═══════════ dove siamo ═══════════ */
const vista = ref('mappa')          // mappa | pista
const tappaIdx = ref(-1)            // -1 = corsa infinita
const partita = shallowRef(null)    // il motore: NON reattivo dentro
const cruscotto = ref(vuoto())
const domanda = ref(null)           // l'esercizio del cancello d'oro
const finale = ref(null)
const brindisi = ref('')
const toccato = ref(false)

let ultimoModulo = null             // per non fare due domande di fila uguali
let pittore = null
let orologio = 0
let attesa = 0
let orologioBrindisi = 0
const giostra = new Giostra(passo)

const avanza = progresso(CHIAVE)
const libera = computed(() => tappaIdx.value < 0)
const regoleOra = computed(() => libera.value ? LIBERA : CAMPAGNA[tappaIdx.value] || CAMPAGNA[0])
const vestito = computed(() => veste(regoleOra.value.veste))

function vuoto() {
  return { truppa: 0, gruppi: [], piena: false, metri: 0, restano: 0,
           infinita: false, quota: 0, vinti: 0, mostro: null }
}

/* ═══════════ la mappa ═══════════
   Le tappe arrivano alla vista già decise: cosa è aperto, quante stelle,
   di che colore, quanto dura. La schermata non chiede niente a nessuno. */
const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    icona: veste(t.veste).icona,
    accento: veste(t.veste).accento,
    vesteNome: veste(t.veste).nome,
    secondi: secondiCirca(t),
    aperta: aperta(CHIAVE, t.indice),
    adesso: t.indice === avanza.tappa,
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

const statoLibera = computed(() => ({
  aperta: aperta(CHIAVE, QUANTE_TAPPE),
  quante: QUANTE_TAPPE,
  fatte: Math.min(avanza.tappa, QUANTE_TAPPE),
  primato: scelta(CHIAVE, 'primato', 0),
}))

const titolo = computed(() =>
  vista.value === 'pista' ? regoleOra.value.nome : 'La corsa dei numeri')

/* ═══════════ i suoni ═══════════
   Il motore non suona: dice cosa è successo e qui si decide come. E non
   porta informazione — col suono spento la corsa resta intera, perché
   tutto quello che conta è già scritto in strada. */
let ultimoSparo = 0
const VERSI = {
  cambio: () => suono.nota(420, 460, 0.05, 'square', 0.05),
  meglio: () => suono.compra(),
  peggio: () => suono.no(),
  cassa: () => suono.moneta(),
  cono: () => suono.nota(240, 120, 0.16, 'sawtooth', 0.1),
  libro: () => suono.nota(300, 600, 0.2, 'sine', 0.12),
  sparo: () => {
    const ora = performance.now()
    if (ora - ultimoSparo < 90) return
    ultimoSparo = ora
    suono.sparo()
  },
  caduto: () => suono.boom(),
  abbattuto: () => suono.livello(),
  colpito: () => suono.boss(),
  vittoria: () => suono.livello(),
  fine: () => suono.fine(),
}
const LAMPI = {
  meglio: ['#8ef0a8', 24], abbattuto: ['#9fd0ff', 40],
  /* il colpo che stende il mostro **si vede**: da quando i mostri
     abbattuti spariscono dalla strada invece di restarci a terra, senza
     questo lampo lo scontro finirebbe con una cosa che smette di
     esserci */
  caduto: ['#ffd98a', 30],
  cassa: ['#ffd98a', 10], peggio: ['#ff9d9d', 10],
}
function reagisci(eventi) {
  const visti = new Set()
  for (const e of eventi) {
    if (visti.has(e)) continue
    visti.add(e)
    VERSI[e]?.()
    const lampo = LAMPI[e]
    if (lampo && pittore) pittore.scoppio(partita.value?.corsiaX || 0, lampo[0], lampo[1])
  }
}

/* ═══════════ il battito ═══════════
   La corsa si ferma anche quando c'è **il cartello di un traguardo**
   davanti (`state.festa`, che `App.vue` mostra a schermo intero per tre
   secondi buoni): il velo copre la pista, e quando il bambino torna a
   vederla ha un mostro addosso. Un traguardo che si paga con la partita è
   un traguardo che si impara a temere. */
function passo(dt) {
  const p = partita.value
  if (!p) return
  const fermo = p.finita || p.inPausa || state.festa.length
  if (!fermo) p.avanza(dt)
  if (p.eventi.length) reagisci(p.svuotaEventi())

  /* il cancello d'oro: la domanda arriva quando il motore si è fermato,
     e finché è a schermo la corsa non avanza di un istante */
  if (p.inPausa && !domanda.value) {
    domanda.value = domandaPerGioco({
      difficolta: regoleOra.value.studio, evita: ultimoModulo,
    })
  }
  if (p.finita && !finale.value && !attesa) attesa = setTimeout(chiudiPartita, RESPIRO)

  orologio += dt
  if (orologio > 0.15) { orologio = 0; cruscotto.value = p.cruscotto }
  pittore?.disegna(p.scena(), fermo ? 0 : dt)
}

/* ═══════════ giocare ═══════════ */
function avvia(indice) {
  clearTimeout(attesa); attesa = 0
  tappaIdx.value = indice
  const t = indice < 0 ? LIBERA : CAMPAGNA[indice]
  partita.value = new Partita(new Regole(t))
  cruscotto.value = partita.value.cruscotto
  domanda.value = null
  finale.value = null
  brindisi.value = ''
  toccato.value = false
  vista.value = 'pista'
  pagata = false
  contata = false
  mostriSegnati = 0
  cancelliSegnati = 0
  if (pittore) prendiTela(pittore.tela)
}

function prendiTela(tela) {
  if (!tela) return
  pittore = new Pista(tela)
  giostra.avvia()
}

function ridimensiona() { pittore?.misura() }

/* Un tocco fa due cose insieme, e non è un doppio significato: è lo
   stesso gesto letto per intero. Sposta nella corsia toccata — se ci sei
   già, non sposta niente — e in ogni caso **spinge**. Serve a saltare i
   venti metri di strada vuota fra un cancello e l'altro senza stare lì ad
   aspettare; davanti alla scelta la spinta si spegne da sé, e quel pezzo
   lì si corre sempre al passo (vedi `motore/corsa.js`). */
function vai(delta) {
  toccato.value = true
  partita.value?.vai(delta)
  partita.value?.spingi()
}

/* Il dito (o il tasto) tenuto giù: si spinge finché resta giù. Col mouse
   è **il** gesto — battere il pulsante per andare avanti non lo fa
   nessuno — e sul telefono il pollice appoggiato è comodo quanto il
   tocco. Va rilasciato anche quando la schermata sparisce, se no la
   partita dopo comincia già in corsa. */
function premi(giu) {
  if (giu) toccato.value = true
  partita.value?.premi(giu)
}

/* ═══════════ l'esercizio si paga con niente ═══════════
   Chi indovina moltiplica la truppa; chi sbaglia resta com'era. Non c'è
   nessuna penale, e non è una gentilezza: è la condizione senza cui
   l'offerta tornerebbe a essere un pedaggio, cioè la cosa che i bambini
   pagano svogliati. */
function risposto({ giusto }) {
  const p = partita.value
  ultimoModulo = domanda.value?.modulo || null
  domanda.value = null
  const esito = p?.rispondi(giusto)
  if (!esito) return
  if (giusto) {
    segna('corsaLibri')
    brinda(`📚 la truppa passa da ${esito.prima} a ${esito.dopo}!`, true)
  } else {
    brinda('niente ×5, ma non hai perso niente', false)
  }
  cruscotto.value = p.cruscotto
}

function brinda(testo, bene) {
  if (!testo) return
  brindisi.value = testo
  suono[bene ? 'compra' : 'moneta']()
  clearTimeout(orologioBrindisi)
  orologioBrindisi = setTimeout(() => { brindisi.value = '' }, 2400)
}

/* ═══════════ finire ═══════════ */
let pagata = false
let contata = false
let mostriSegnati = 0
let cancelliSegnati = 0

function chiudiPartita() {
  attesa = 0
  const p = partita.value
  if (!p) return
  giostra.ferma()
  let primato = false
  let monete = p.monete

  if (libera.value) {
    /* nella corsa infinita non si vince: si dura, e il primato sono i
       metri. Sta in `cfg`, l'unico cassetto che un gioco nuovo ha. */
    const metri = Math.floor(p.dist)
    primato = metri > scelta(CHIAVE, 'primato', 0)
    if (primato) ricorda(CHIAVE, 'primato', metri)
  } else if (p.vinta && !pagata) {
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: p.stelle })
    segna('corsaTappe')
    pagata = true
  } else if (!p.vinta) {
    monete = 0
  }

  if (monete) addCoins(monete)
  if (!contata) { segna('corsaPartite'); contata = true }
  if (p.vinti > mostriSegnati) { segna('corsaMostri', p.vinti - mostriSegnati); mostriSegnati = p.vinti }
  if (p.cancelli > cancelliSegnati) {
    segna('corsaCancelli', p.cancelli - cancelliSegnati)
    cancelliSegnati = p.cancelli
  }
  segnaBest('corsaTruppa', p.truppa)
  segnaBest('corsaMetri', Math.floor(p.dist))

  finale.value = {
    vinta: p.vinta, titolo: regoleOra.value.nome, stelle: p.stelle, monete,
    metri: Math.floor(p.dist), truppa: p.truppa, vinti: p.vinti,
    cancelli: p.cancelli, meglio: p.meglio, libri: p.libriGiusti,
    causa: p.causa, primato, libera: libera.value,
    ultima: p.vinta && !libera.value && tappaIdx.value === QUANTE_TAPPE - 1,
  }
}

/* «avanti» dopo una vinta porta alla tappa dopo: tornare ogni volta alla
   mappa per ripartire è un giro in più che nessun bambino chiede. */
function ancora() {
  const f = finale.value
  if (!f) return
  if (libera.value) return avvia(-1)
  if (f.vinta && tappaIdx.value + 1 < QUANTE_TAPPE) return avvia(tappaIdx.value + 1)
  if (f.vinta) return allaMappa()
  avvia(tappaIdx.value)
}

function allaMappa() {
  clearTimeout(attesa); attesa = 0
  giostra.ferma()
  partita.value = null
  pittore = null
  finale.value = null
  domanda.value = null
  vista.value = 'mappa'
}

function indietro() {
  if (vista.value === 'mappa') emit('vai', 'home')
  else allaMappa()
}

onMounted(() => addEventListener('resize', ridimensiona))
onUnmounted(() => {
  removeEventListener('resize', ridimensiona)
  clearTimeout(attesa)
  clearTimeout(orologioBrindisi)
  giostra.ferma()
})
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" monete :scura="vista === 'pista' && vestito.buio" @indietro="indietro" />

    <div class="co" :style="{ '--co-accento': vestito.accento }">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" :libera="statoLibera"
             @gioca="avvia" @libera="avvia(-1)" />

      <PistaVista v-else :cruscotto="cruscotto" :buio="vestito.buio"
                  :dritta="!toccato && cruscotto.metri < 14 && !finale"
                  @tela="prendiTela" @vai="vai" @premi="premi" />

      <div v-if="brindisi" class="co-brindisi em">{{ brindisi }}</div>

      <Domanda v-if="domanda" :domanda="domanda.domanda" :pittori="domanda.pittori"
               :titolo="`${domanda.icona} ${domanda.nome}`"
               :origine="domanda" gioco="corsa" @risposto="risposto" />

      <Finale v-if="finale" v-bind="finale" @ancora="ancora" @esci="allaMappa" />
    </div>
  </div>
</template>
