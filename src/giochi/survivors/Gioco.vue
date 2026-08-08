<script setup>
/* ═══════════════════════════════════════════════════════════════════
   SURVIVORS — IL COORDINATORE

   L'eroe spara da solo al mostro più vicino: il bambino ha una cosa sola
   da fare col dito, schivare. I mostri lasciano gemme, le gemme fanno
   salire di livello, e **a ogni livello il gioco si ferma e propone tre
   carte che si pagano con una domanda** — facile, media o tosta a
   seconda di quanto è forte la carta. Chi sbaglia non resta a mani
   vuote: prende la più debole delle tre.

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

import { CAMPAGNA, SCALINI, LIBERO, QUANTE_TAPPE, tappeDelloScalino } from './dati/campagna.js'
import { scenario } from './dati/scenari.js'
import { Regole, Partita } from './motore/partita.js'
import { Campo } from './scena/campo.js'
import { Giostra } from './scena/giostra.js'

import Mappa from './viste/Mappa.vue'
import CampoVista from './viste/Campo.vue'
import Carte from './viste/Carte.vue'
import Finale from './viste/Finale.vue'
import './stile.css'

defineOptions({ name: 'Survivors' })
const emit = defineEmits(['vai'])

const CHIAVE = 'survivors'
const RESPIRO = 500          // quanto si guarda il campo prima del cartello

/* ═══════════ dove siamo ═══════════ */
const vista = ref('mappa')            // mappa | campo
const tappaIdx = ref(-1)              // -1 = gioco libero
const partita = shallowRef(null)      // il motore: NON reattivo dentro
const cruscotto = ref(vuoto())
const offerta = ref(null)             // le tre carte, a livello appena salito
const domanda = ref(null)             // la domanda che paga la carta scelta
const finale = ref(null)
const brindisi = ref('')
const toccato = ref(false)

let voluta = null                     // la carta che si sta pagando
let ultimoModulo = null               // per non fare due domande di fila uguali
let pittore = null
let orologio = 0
let attesa = 0
let orologioBrindisi = 0
const giostra = new Giostra(passo)

const avanza = progresso(CHIAVE)
const libera = computed(() => tappaIdx.value < 0)
const regoleOra = computed(() => libera.value ? LIBERO : CAMPAGNA[tappaIdx.value] || CAMPAGNA[0])
const veste = computed(() => scenario(regoleOra.value.scenario))

function vuoto() {
  return { cuori: 3, cuoriMax: 3, livello: 1, quota: 0, tempo: 0,
           restano: 0, infinita: false, uccisi: 0, presi: [] }
}

/* ═══════════ la mappa ═══════════
   Le tappe arrivano alla vista già decise: cosa è aperto, quante stelle,
   di che colore. La schermata non deve chiedere niente a nessuno. */
const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    icona: scenario(t.scenario).icona,
    accento: scenario(t.scenario).accento,
    scenarioNome: scenario(t.scenario).nome,
    aperta: aperta(CHIAVE, t.indice),
    adesso: t.indice === avanza.tappa,
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

const statoLibero = computed(() => ({
  aperto: aperta(CHIAVE, QUANTE_TAPPE),
  quante: QUANTE_TAPPE,
  fatte: Math.min(avanza.tappa, QUANTE_TAPPE),
  primato: scelta(CHIAVE, 'primato', 0),
}))

const titolo = computed(() =>
  vista.value === 'campo' ? regoleOra.value.nome : 'Survivors')

/* ═══════════ i suoni ═══════════
   Il motore non suona: dice cosa è successo e qui si decide come. Sono
   sintetizzati come in tutti gli altri giochi — un file audio in più nel
   build unico peserebbe più di tutto il gioco messo insieme. */
let ultimoTiro = 0
const VERSI = {
  tiro: () => {
    const ora = performance.now()
    if (ora - ultimoTiro < 90) return
    ultimoTiro = ora
    suono.nota(820, 260, 0.06, 'triangle', 0.05)
  },
  morto: () => suono.nota(220, 90, 0.09, 'square', 0.05),
  gemma: () => suono.nota(1180, 1760, 0.05, 'sine', 0.05),
  ahia: () => suono.nota(300, 70, 0.22, 'sawtooth', 0.12),
  livello: () => suono.livello(),
  fuoco: () => suono.rumore(0.22, 0.06, 900, 200),
  tuono: () => suono.rumore(0.18, 0.07, 2400, 120),
  fine: () => suono.fine(),
  trionfo: () => suono.livello(),
}
function suona(eventi) {
  const visti = new Set()
  for (const e of eventi) {
    if (visti.has(e)) continue      // dieci morti nello stesso istante fanno un morto
    visti.add(e)
    VERSI[e]?.()
  }
}

/* ═══════════ il battito ═══════════
   Il campo si ferma anche quando c'è **il cartello di un traguardo**
   davanti (`state.festa`, che `App.vue` mostra a schermo intero per tre
   secondi buoni). Prima no, e voleva dire perdere cuori per aver preso un
   premio: il velo copre il campo, il bambino non vede più i mostri, e
   quando torna a vederlo ne ha tre addosso. Un traguardo che si paga con
   una vita è un traguardo che il bambino impara a temere. Il tempo qui è
   fermo davvero — `avanza` è l'unico posto dove passa — quindi si
   ricomincia esattamente dalla scena che si era lasciata. */
function passo(dt) {
  const p = partita.value
  if (!p) return
  if (!p.finita && !p.inPausa && !state.festa.length) p.avanza(dt)
  if (p.eventi.length) suona(p.svuotaEventi())

  if (p.inPausa && !offerta.value && !domanda.value) {
    offerta.value = p.offerta
    cruscotto.value = p.cruscotto
  }
  if (p.finita && !finale.value && !attesa) {
    attesa = setTimeout(chiudiPartita, RESPIRO)
  }

  orologio += dt
  if (orologio > 0.2) { orologio = 0; cruscotto.value = p.cruscotto }
  pittore?.disegna(p.scena())
}

/* ═══════════ giocare ═══════════ */
function avvia(indice) {
  clearTimeout(attesa); attesa = 0
  tappaIdx.value = indice
  const t = indice < 0 ? LIBERO : CAMPAGNA[indice]
  partita.value = new Partita(new Regole(t))
  cruscotto.value = partita.value.cruscotto
  offerta.value = null
  domanda.value = null
  finale.value = null
  brindisi.value = ''
  toccato.value = false
  vista.value = 'campo'
  pagata = false
  contata = false
  mostriSegnati = 0
  /* il pittore arriva quando la schermata monta e consegna il canvas */
  if (pittore) prendiTela(pittore.tela)
}

/* Il canvas: la vista lo consegna appena esiste. Da qui in poi il motore
   sa quanto è grande il campo — che è l'unica cosa di schermo che gli
   serve, per far entrare i mostri appena oltre il bordo. */
function prendiTela(tela) {
  if (!tela) return
  pittore = new Campo(tela)
  partita.value?.misuraCampo(pittore.larghezza, pittore.altezza)
  giostra.avvia()
}

function ridimensiona() {
  if (!pittore) return
  pittore.misura()
  partita.value?.misuraCampo(pittore.larghezza, pittore.altezza)
}

function muovi(dx, dy) {
  if (dx || dy) toccato.value = true
  partita.value?.muovi(dx, dy)
}

/* ═══════════ la carta si paga ═══════════
   Il gioco chiede una domanda **della difficoltà che costa la carta** e
   non sa di che materia sia: `evita` serve solo a non farne due di fila
   dello stesso modulo. */
function scegliCarta(chiave) {
  const p = partita.value
  voluta = p.offerta.find(c => c.chiave === chiave) || p.offerta[0]
  offerta.value = null
  domanda.value = domandaPerGioco({ difficolta: voluta.prezzo, evita: ultimoModulo })
  suono.ok()
}

/* Il potenziamento si vince rispondendo: chi sbaglia non lo prende. Al
   suo posto una monetina — non è un premio di consolazione mascherato da
   premio, è un «ci hai provato» che vale in cameretta e non in campo, e
   soprattutto non falsa la partita. Il giro dopo arriva presto: le gemme
   continuano a cadere. */
function risposto({ giusto }) {
  const p = partita.value
  ultimoModulo = domanda.value?.modulo || null
  domanda.value = null
  if (giusto) {
    const presa = p.prendi(voluta.chiave)
    brinda(`${presa.icona} ${presa.nome} — ${presa.chiaro}`, true)
    segna('survivorsCarte')
    /* la carta forte l'ha pagata la domanda tosta: è la cosa che questo
       gioco vuole premiare, e ha un traguardo suo */
    if (voluta.fascia === 'forte') segna('survivorsToste')
  } else {
    p.rinuncia()
    addCoins(1)
    brinda('🪙 +1 — niente carta, ma ci hai provato', false)
  }
  cruscotto.value = p.cruscotto
}

function brinda(testo, giusto) {
  if (!testo) return
  brindisi.value = testo
  suono[giusto ? 'compra' : 'moneta']()
  clearTimeout(orologioBrindisi)
  orologioBrindisi = setTimeout(() => { brindisi.value = '' }, 2600)
}

/* ═══════════ finire ═══════════
   Una partita si chiude fino a due volte: la prima al traguardo — la
   tappa è vinta, le stelle sono contate — e la seconda quando ti prendono,
   se hai scelto di restare in campo. I premi si pagano una volta sola
   (`pagata`), e i mostri si contano a delta, o chi resta li conterebbe
   due volte. */
let pagata = false
let contata = false
let mostriSegnati = 0

function chiudiPartita() {
  attesa = 0
  const p = partita.value
  if (!p) return
  giostra.ferma()
  const secondi = Math.floor(p.tempo)
  const extra = Math.floor(p.extra)
  let primato = false
  let monete = 0

  if (libera.value) {
    /* nel gioco libero non si vince: si resiste, e le monete sono il
       tempo. Il primato sta in `cfg`, che è l'unico cassetto che un
       gioco nuovo ha nel profilo. */
    monete = Math.min(20, Math.floor(secondi / 15))
    primato = secondi > scelta(CHIAVE, 'primato', 0)
    if (primato) ricorda(CHIAVE, 'primato', secondi)
  } else if (p.vinta && !pagata) {
    monete = p.monete
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: p.stelle })
    segna('survivorsTappe')
    pagata = true
  }
  /* chi è rimasto in campo dopo aver vinto si porta a casa anche il tempo
     regalato: poco, ma abbastanza perché restare non sia gratis */
  if (extra) monete += Math.min(12, Math.floor(extra / 20))

  if (monete) addCoins(monete)
  if (!contata) { segna('survivorsPartite'); contata = true }
  if (p.uccisi > mostriSegnati) {
    segna('survivorsMostri', p.uccisi - mostriSegnati)
    mostriSegnati = p.uccisi
  }
  segnaBest('survivorsLivello', p.livello)
  segnaBest('survivorsTempo', secondi)

  finale.value = {
    vinta: p.vinta, titolo: regoleOra.value.nome, stelle: p.stelle,
    monete, tempo: p.tempo, uccisi: p.uccisi, livello: p.livello,
    primato, libera: libera.value, extra,
    /* al traguardo si può restare: da lì in poi la marea sale e basta,
       e quello che si è vinto è già vinto */
    puoiRestare: p.alTraguardo,
    ultima: p.vinta && !libera.value && tappaIdx.value === QUANTE_TAPPE - 1,
  }
}

/* «resta in campo»: la partita riparte dove si era fermata, senza più un
   traguardo davanti. Non si può più vincere niente — si può solo durare. */
function resta() {
  const p = partita.value
  if (!p?.continua()) return
  finale.value = null
  cruscotto.value = p.cruscotto
  giostra.avvia()
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
  offerta.value = null
  domanda.value = null
  vista.value = 'mappa'
}

function indietro() {
  if (vista.value === 'mappa') emit('vai', 'home')
  else allaMappa()
}

/* ═══════════ il gancio per guardarsi ═══════════
   La schermata delle carte arriva dopo qualche minuto di partita, e chi
   scrive il gioco non può guardarla solo giocando: `salta()` fa salire
   di livello subito, e i potenziamenti passati fanno finta che la
   partita sia già avanti — è così che si scattano le carte mature senza
   giocare mezz'ora (lo faceva anche il prototipo, `poc/survivors.html`).

   Per chi gioca **non esiste**: `import.meta.env.DEV` è falso quando si
   costruisce il file unico e tutto questo blocco sparisce dal build. */
function gancioDiProva() {
  if (!import.meta.env.DEV) return
  window.__survivors = {
    salta(potenziamenti = null) {
      const p = partita.value
      if (!p) return false
      if (potenziamenti) { Object.assign(p.potenziamenti, potenziamenti); p.ricalcola() }
      p.xp = p.prossima                 // al prossimo battito sale, e si ferma
      return true
    },
  }
}

onMounted(() => { addEventListener('resize', ridimensiona); gancioDiProva() })
onUnmounted(() => {
  if (import.meta.env.DEV) delete window.__survivors
  removeEventListener('resize', ridimensiona)
  clearTimeout(attesa)
  clearTimeout(orologioBrindisi)
  giostra.ferma()
})
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" monete :scura="vista === 'campo' && veste.buio" @indietro="indietro" />

    <div class="sv" :style="{ '--sv-accento': veste.accento }">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" :libero="statoLibero"
             @gioca="avvia" @libero="avvia(-1)" />

      <CampoVista v-else :cruscotto="cruscotto" :buio="veste.buio"
                  :dritta="!toccato && cruscotto.tempo < 9 && !finale"
                  @tela="prendiTela" @muovi="muovi" />

      <div v-if="brindisi" class="sv-brindisi em">{{ brindisi }}</div>

      <Carte v-if="offerta" :carte="offerta" :livello="cruscotto.livello"
             @scegli="scegliCarta" />

      <Domanda v-if="domanda" :domanda="domanda.domanda" :pittori="domanda.pittori"
               :titolo="`${domanda.icona} ${domanda.nome}`" @risposto="risposto" />

      <Finale v-if="finale" v-bind="finale"
              @ancora="ancora" @esci="allaMappa" @resta="resta" />
    </div>
  </div>
</template>
