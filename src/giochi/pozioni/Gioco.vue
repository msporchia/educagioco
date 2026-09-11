<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL LABORATORIO DELLE POZIONI — IL COORDINATORE

   La ricetta chiede «1,5 kg di polvere di luna»; sullo scaffale ci
   sono tre ingredienti e sul banco una bilancia che conta in grammi.
   Si prende l'ingrediente giusto, lo si trascina sulla bilancia, si
   mettono i pesi finché il numero fa 1500 g, e via nel calderone.

   Il gioco vecchio chiedeva di convertire dalla prima ricetta con
   cinque bilance davanti. Questo è rifatto da zero attorno alla
   scaletta scritta in `dati/campagna.js`: prima il gesto, poi una
   cosa nuova per volta, spiegata finché serve.

   Questo file mette insieme i pezzi ed **è l'unico che sa che esistono
   le monete**: le regole stanno in `motore/`, le tappe in `dati/`, le
   schermate in `viste/`. Non c'è pausa perché non c'è un orologio: il
   tempo non è un avversario, e un ⏸ dove non scorre niente è un tasto
   che non fa niente.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { addCoins, segna, answer } from '../../store/profile.js'
import { progresso, aperta, stelleDi, completa } from '../campagne.js'
import { attesaDellEsito, PONDERA, TEMPO_MAX } from '../../quiz/nucleo/domanda.js'

import { CAMPAGNA, BLOCCHI, QUANTE_TAPPE, MONETE_A_DOSE } from './dati/campagna.js'
import { STRUMENTO, mescola } from './dati/misure.js'
import { Partita } from './motore/partita.js'
import Mappa from './viste/Mappa.vue'
import Banco from './viste/Banco.vue'
import Fine from './viste/Fine.vue'
import './stile.css'

defineOptions({ name: 'Pozioni' })
const emit = defineEmits(['vai'])

const CHIAVE = 'pozioni'
const CIECO = 320           // una schermata appena comparsa non si tocca subito
const TUFFO = 900           // quanto si guarda l'ingrediente andare nel calderone
const REPLICA = 3           // rifare una tappa già fatta paga un terzo

/* ═══════════ dove siamo ═══════════ */
const vista = ref('mappa')          // mappa | banco
const tappaIdx = ref(0)
const partita = ref(null)
const finale = ref(null)
const cieco = ref(false)
const attesa = ref(0)               // 0..1 della barra sotto un esito
const nelCalderone = ref([])        // gli ingredienti già tuffati, per il colore
const avanza = progresso(CHIAVE)

const tappa = computed(() => CAMPAGNA[tappaIdx.value])
const titolo = computed(() => (vista.value === 'banco' ? tappa.value.nome : 'Le pozioni'))

/* ═══════════ la mappa ═══════════ */
const blocchi = computed(() => BLOCCHI.map(b => ({
  ...b,
  tappe: b.tappe.map(t => ({
    ...t,
    aperta: aperta(CHIAVE, t.indice),
    adesso: t.indice === avanza.tappa,
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

/* il calderone: il colore è la mescolanza vera di quello che c'è dentro */
const calderone = computed(() => ({
  colore: mescola(nelCalderone.value.map(i => i.colore)),
  dentro: nelCalderone.value.map(i => i.emoji),
}))
const strumentiTutti = computed(() => (partita.value ? partita.value.tappa.strumenti.map(k => STRUMENTO[k]) : []))

/* ═══════════ giocare ═══════════ */
let timer = 0, barra = 0, apertaIl = 0
onUnmounted(() => { clearTimeout(timer); cancelAnimationFrame(barra) })

function avviaTappa(i) {
  if (!aperta(CHIAVE, i)) return
  clearTimeout(timer)
  tappaIdx.value = i
  partita.value = new Partita(CAMPAGNA[i])
  finale.value = null
  nelCalderone.value = []
  vista.value = 'banco'
  apertaIl = performance.now()
  accieca()
}

function allaMappa() {
  clearTimeout(timer); cancelAnimationFrame(barra)
  finale.value = null
  partita.value = null
  vista.value = 'mappa'
}

function indietro() {
  if (vista.value === 'mappa') emit('vai', 'home')
  else allaMappa()
}

function accieca() {
  cieco.value = true
  setTimeout(() => (cieco.value = false), CIECO)
}

/* ── i gesti, girati al motore ── */
const p = () => partita.value
const libero = () => p() && !cieco.value && !p().occupato

function prendi(nome) {
  if (!libero()) return
  const e = p().prendi(nome)
  if (e && e.ok) { suono.nota(520, 640, 0.08, 'triangle', 0.08); if (!apertaIl) apertaIl = performance.now() }
  else if (e && e.tipo === 'sbaglio') sbagliato(e)
}
function posa(chiave) {
  if (!libero()) return
  const e = p().posa(chiave)
  if (e && e.ok) suono.nota(300, 420, 0.1, 'sine', 0.1)
  else if (e && e.tipo === 'sbaglio') sbagliato(e)
}
function metti(pezzo) {
  if (!libero()) return
  if (p().metti(pezzo)) suono.nota(640, 820, 0.05, 'triangle', 0.08)
  else suono.nota(200, 160, 0.1, 'sawtooth', 0.06)
}
function togli() { if (libero() && p().togli() != null) suono.nota(420, 300, 0.06, 'sine', 0.06) }
function svuota() { if (libero()) p().svuota() }
function riponi() { if (libero()) p().riponi() }

function conferma() {
  if (!libero()) return
  const e = p().conferma()
  if (!e) return
  if (e.tipo === 'sbaglio') return sbagliato(e)
  /* giusto: il gesto è stato fatto davvero, e la conversione — se
     c'era e non era scritta — va al motore di apprendimento */
  suono.ok()
  segna('misure')
  annota(e.annota)
  nelCalderone.value = [...nelCalderone.value, { emoji: e.ingrediente.emoji, colore: e.ingrediente.colore }]
  setTimeout(() => suono.nota(320, 150, 0.2, 'sine', 0.1), 400)
  timer = setTimeout(avanti, TUFFO)
}

/* uno sbaglio si legge: il perché e come si fa, con la barra che dice
   quanto manca. È la stessa attesa dei quiz di casa — un pavimento di
   quattro secondi, di più se c'è da leggere di più. */
function sbagliato(e) {
  suono.no()
  annota(e.annota)
  const righe = [e.testo, e.spiegazione && e.spiegazione.passi, e.spiegazione && e.spiegazione.come]
    .filter(Boolean)
  const ms = attesaDellEsito({ righe, pavimento: PONDERA })
  const t0 = performance.now()
  attesa.value = 1
  const tick = () => {
    attesa.value = Math.max(0, 1 - (performance.now() - t0) / ms)
    if (attesa.value > 0) barra = requestAnimationFrame(tick)
  }
  barra = requestAnimationFrame(tick)
  timer = setTimeout(avanti, ms)
}

function annota(a) {
  if (!a) return
  const ms = Math.min(TEMPO_MAX, Math.max(0, performance.now() - apertaIl))
  answer(a.chiave, { correct: a.giusto, ms })
}

function avanti() {
  cancelAnimationFrame(barra); attesa.value = 0
  const r = p().riprendi()
  apertaIl = performance.now()
  accieca()
  if (!r) return
  if (r.che === 'nuovoCliente' || r.che === 'tappaFinita') {
    segna('pozioni')
    if (r.perfetta) segna('pozioniPerfette')
    suono.moneta()
    nelCalderone.value = []
  }
  if (r.che === 'tappaFinita') tappaFinita()
}

function tappaFinita() {
  const q = p()
  const giaFatta = avanza.tappa > tappaIdx.value
  const monete = giaFatta ? Math.ceil(q.monete / REPLICA) : q.monete
  completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: q.stelle })
  if (monete) addCoins(monete)
  const ultima = tappaIdx.value === QUANTE_TAPPE - 1
  finale.value = { titolo: tappa.value.nome, stelle: q.stelle, monete,
                   pozioni: q.pozioni, perfette: q.perfette,
                   maestro: ultima && !giaFatta, ultima }
  suono.livello()
}

function prossima() {
  if (tappaIdx.value >= QUANTE_TAPPE - 1) return allaMappa()
  avviaTappa(tappaIdx.value + 1)
}

/* per i test e per lo strumento delle foto: la stessa porta del gioco */
if (typeof window !== 'undefined')
  window.__poz = { vista, tappaIdx, partita, finale, avviaTappa, allaMappa, prossima,
                   prendi, posa, metti, togli, svuota, riponi, conferma, CAMPAGNA, MONETE_A_DOSE }
</script>

<template>
  <div class="schermo pz" :data-vista="vista">
    <Barra :titolo="titolo" guida="pozioni" scura :monete="vista === 'mappa'" @indietro="indietro">
      <template v-if="partita && vista === 'banco'">
        <div class="gettone" data-clienti>🧍 <b>{{ Math.min(partita.n + 1, tappa.clienti) }}/{{ tappa.clienti }}</b></div>
      </template>
    </Barra>

    <Mappa v-if="vista === 'mappa'" :blocchi="blocchi" @gioca="avviaTappa" />

    <Banco v-else-if="partita" :partita="partita" :bloccato="cieco" :attesa="attesa"
           :calderone="calderone" :strumenti-tutti="strumentiTutti"
           @prendi="prendi" @posa="posa" @metti="metti" @togli="togli"
           @svuota="svuota" @riponi="riponi" @conferma="conferma" />

    <Fine v-if="finale" v-bind="finale" @avanti="prossima" @mappa="allaMappa" />
  </div>
</template>
