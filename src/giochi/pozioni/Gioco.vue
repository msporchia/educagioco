<script setup>
// Il coordinatore: l'unico file che sa che esistono le monete. Le
// regole stanno in `motore/`, le tappe in `dati/`, le schermate in
// `viste/`. Niente pausa: non c'è un orologio, il tempo non è un
// avversario. Vedi docs/pozioni/regole.md; la tappa lasciata a metà,
// docs/pozioni/sosta.md.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Barra from '../../components/Barra.vue'
import TastoSalta from '../../components/TastoSalta.vue'
import { suono } from '../../audio.js'
import { segna, answer } from '../../store/profile.js'
import { borsa } from '../../store/varieta.js'
import { progresso, aperta, adesso, stelleDi, completa,
         sosta, salvaSosta, buttaSosta } from '../campagne.js'
import { attesaDellEsito, PONDERA, TEMPO_MAX } from '../../quiz/nucleo/domanda.js'

import { CAMPAGNA, BLOCCHI, QUANTE_TAPPE, MONETE_A_DOSE } from './dati/campagna.js'
import { STRUMENTO, mescola } from './dati/misure.js'
import { Partita } from './motore/partita.js'
import { scrivi, leggi, dice, tappaDi } from './motore/sosta.js'
import Mappa from './viste/Mappa.vue'
import Banco from './viste/Banco.vue'
import Fine from './viste/Fine.vue'
import './stile.css'

defineOptions({ name: 'Pozioni' })
const emit = defineEmits(['vai'])

const CHIAVE = 'pozioni'
const CIECO = 320           // una schermata appena comparsa non si tocca subito
const TUFFO = 900           // quanto si guarda l'ingrediente andare nel calderone

// dove siamo
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

// la mappa
const blocchi = computed(() => BLOCCHI.map(b => ({
  ...b,
  tappe: b.tappe.map(t => ({
    ...t,
    aperta: aperta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

/* il calderone: il colore è la mescolanza vera di quello che c'è dentro */
const calderone = computed(() => ({
  colore: mescola(nelCalderone.value.map(i => i.colore)),
  dentro: nelCalderone.value.map(i => i.emoji),
}))
const strumentiTutti = computed(() => (partita.value ? partita.value.tappa.strumenti.map(k => STRUMENTO[k]) : []))

// giocare
let timer = 0, barra = 0, apertaIl = 0
// una dose giusta al primo colpo paga quando va nel calderone, anche in una tappa rifatta
// (docs/pozioni/regole.md)
let borsellino = borsa(CHIAVE)

/* ── la tappa lasciata a metà ──
   Uscire non butta via niente: si scrive dove si era (motore/sosta.js) e la
   mappa la offre in cima. Vedi docs/pozioni/sosta.md. */
const laRipresa = () => {
  const d = dice(sosta(CHIAVE))
  if (!d || !aperta(CHIAVE, d.indice)) return null
  const sbagli = d.sbagli ? ` · 💥 ${d.sbagli} ${d.sbagli === 1 ? 'sbaglio' : 'sbagli'}` : ''
  return { emoji: d.emoji, nome: d.nome,
           dettaglio: `🧍 cliente ${d.cliente} di ${d.clienti}${sbagli}` }
}
const ripresa = ref(laRipresa())
const chiede = ref(null)            // { nome, i }: la tappa nuova che butterebbe quella a metà

function salva({ subito = false } = {}) {
  if (vista.value !== 'banco' || !partita.value) return
  salvaSosta(CHIAVE, scrivi(partita.value, tappaIdx.value,
    { monete: { chiesto: borsellino.chiesto, dato: borsellino.dato } }), { subito })
}

function scorda() {
  if (sosta(CHIAVE)) buttaSosta(CHIAVE)
  ripresa.value = null
  chiede.value = null
}

function vuoleIniziare(i) {
  if (!aperta(CHIAVE, i)) return
  if (!ripresa.value) return avviaTappa(i)
  chiede.value = { nome: CAMPAGNA[i].nome, i }
}
function comincia() { avviaTappa(chiede.value.i) }

// se il salvataggio non si legge più la carta sparisce e resta la mappa
function riprendiPartita() {
  const dato = sosta(CHIAVE)
  const t = tappaDi(dato)
  const p = t && aperta(CHIAVE, t.indice) ? leggi(dato) : null
  if (!p) return scorda()
  clearTimeout(timer); cancelAnimationFrame(barra); attesa.value = 0
  tappaIdx.value = t.indice
  partita.value = p
  borsellino = borsa(CHIAVE, dato.monete)
  finale.value = null
  nelCalderone.value = p.ricetta.ingredienti.filter(i => i.fatto)
    .map(i => ({ emoji: i.emoji, colore: i.colore }))
  ripresa.value = null
  chiede.value = null
  vista.value = 'banco'
  apertaIl = performance.now()
  accieca()
  // la dose era già nel calderone: manca solo andare avanti
  if (p.esito) timer = setTimeout(avanti, TUFFO)
}

// su un telefono l'app non si chiude, sparisce: è l'ultimo momento per scrivere
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true })
}
onMounted(() => {
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
// prima che i figli se ne vadano (onUnmounted sarebbe tardi)
onBeforeUnmount(() => {
  salva({ subito: true })
  clearTimeout(timer); cancelAnimationFrame(barra)
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
})

function avviaTappa(i) {
  if (!aperta(CHIAVE, i)) return
  scorda()
  clearTimeout(timer)
  tappaIdx.value = i
  partita.value = new Partita(CAMPAGNA[i])
  borsellino = borsa(CHIAVE)
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

// dal banco il ← porta alla mappa, e la tappa a metà resta lì in cima
function indietro() {
  if (vista.value === 'mappa') return emit('vai', 'home')
  salva({ subito: true })
  ripresa.value = laRipresa()
  allaMappa()
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
  salva()
}
function posa(chiave) {
  if (!libero()) return
  const e = p().posa(chiave)
  if (e && e.ok) suono.nota(300, 420, 0.1, 'sine', 0.1)
  else if (e && e.tipo === 'sbaglio') sbagliato(e)
  salva()
}
function metti(pezzo) {
  if (!libero()) return
  if (p().metti(pezzo)) suono.nota(640, 820, 0.05, 'triangle', 0.08)
  else suono.nota(200, 160, 0.1, 'sawtooth', 0.06)
  salva()
}
function togli() { if (libero() && p().togli() != null) { suono.nota(420, 300, 0.06, 'sine', 0.06); salva() } }
function svuota() { if (libero()) { p().svuota(); salva() } }
function riponi() { if (libero()) { p().riponi(); salva() } }

function conferma(saltata = false) {
  if (!libero()) return
  // il tasto «salta» dei grandi (docs/core/comandi.md): dose fatta, ma nessuno ha misurato
  const e = saltata ? p().salta() : p().conferma()
  if (!e) return
  if (e.tipo === 'sbaglio') return sbagliato(e)
  /* giusto: il gesto è stato fatto davvero, e la conversione — se
     c'era e non era scritta — va al motore di apprendimento */
  suono.ok()
  if (!e.saltata) segna('misure')
  if (p().dosi.at(-1)?.giusta) borsellino.paga(MONETE_A_DOSE)   // al primo colpo, come prima
  annota(e.annota)
  nelCalderone.value = [...nelCalderone.value, { emoji: e.ingrediente.emoji, colore: e.ingrediente.colore }]
  setTimeout(() => suono.nota(320, 150, 0.2, 'sine', 0.1), 400)
  timer = setTimeout(avanti, TUFFO)
  salva({ subito: true })   // pagata e imparata: la sosta lo sa
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
  salva({ subito: true })
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
    if (!r.saltata) segna('pozioni')
    if (r.perfetta) segna('pozioniPerfette')
    suono.moneta()
    nelCalderone.value = []
  }
  if (r.che === 'tappaFinita') tappaFinita()
  else salva({ subito: true })
}

function tappaFinita() {
  const q = p()
  const giaFatta = avanza.tappa > tappaIdx.value
  completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: q.stelle })
  scorda()
  const ultima = tappaIdx.value === QUANTE_TAPPE - 1
  finale.value = { titolo: tappa.value.nome, stelle: q.stelle,
                   monete: borsellino.dato, notaMonete: borsellino.nota(),
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

    <Mappa v-if="vista === 'mappa'" :blocchi="blocchi" :ripresa="ripresa"
           :chiede="chiede ? chiede.nome : ''" @gioca="vuoleIniziare"
           @riprendi="riprendiPartita" @scorda="scorda"
           @comincia="comincia" @annulla="chiede = null" />

    <Banco v-else-if="partita" :partita="partita" :bloccato="cieco" :attesa="attesa"
           :calderone="calderone" :strumenti-tutti="strumentiTutti"
           @prendi="prendi" @posa="posa" @metti="metti" @togli="togli"
           @svuota="svuota" @riponi="riponi" @conferma="conferma()" />
    <TastoSalta v-if="partita && vista === 'banco' && !finale" @salta="conferma(true)" />

    <Fine v-if="finale" v-bind="finale" @avanti="prossima" @mappa="allaMappa" />
  </div>
</template>
