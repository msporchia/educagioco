<script setup>
// Il coordinatore: l'unico file che sa che esistono le monete vere e
// l'avanzamento. Le regole stanno in `motore/`, i numeri in `dati/`, il
// disegno in `scena/`, le schermate in `viste/`. Comprare una pianta costa
// soli E un conto: il conto lo chiede `domande.js`, e mentre si calcola (e
// mentre si sceglie la cella) il campo sta fermo. Vedi docs/giardino/regole.md.
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { segna, state, etaDelBambino } from '../../store/profile.js'
import { borsa } from '../../store/varieta.js'   // paga e dice se il salvadanaio è stanco
import { PAGA } from '../../data/paghe.js'
import { progresso, aperta, adesso, stelleDi, completa, sosta, salvaSosta, buttaSosta, ritocca } from '../campagne.js'
import { usaPausa } from '../pausa.js'
import VeloPausa from '../VeloPausa.vue'
import Domanda from '../../quiz/Domanda.vue'
import { Giostra } from './scena/giostra.js'
import { Campo } from './scena/campo.js'

import { CAMPAGNA, SCALINI, QUANTE_TAPPE, tappeDelloScalino, scalinoDi, sfidaDi, stellePer } from './dati/campagna.js'
import { PIANTE } from './dati/piante.js'
import { Partita } from './motore/partita.js'
import { scrivi, leggi, dice } from './motore/sosta.js'
import { domandaDi } from './domande.js'
// la bravura è la stessa di Castle Battle (pura): un conto sceglie il grado di partenza
// dal bambino e lo muove giocando. Sta in `campagne.giardino.bravura`.
import { basi, gradoDi, dopoLaRisposta } from '../arena/bravura.js'

import Mappa from './viste/Mappa.vue'
import CampoVista from './viste/Campo.vue'
import Finale from './viste/Finale.vue'
import './stile.css'

defineOptions({ name: 'Giardino' })
const emit = defineEmits(['vai'])

const CHIAVE = 'giardino'
const RESPIRO = 900           // quanto si guarda il campo dopo l'ultima mossa, prima del cartello

let borsellino = borsa(CHIAVE)   // le monete vere di questa partita, un calcolo giusto alla volta

const vista = ref('mappa')            // mappa | campo
const tappaIdx = ref(0)
const partita = shallowRef(null)      // il motore: NON reattivo dentro
const cruscotto = ref(vuoto())
const domanda = ref(null)             // la domanda che paga la pianta
const inMano = ref(null)              // la pianta pagata col conto, che aspetta la sua cella
const finale = ref(null)
const avviso = ref('')

let voluta = null                     // la pianta che si sta pagando
let campo = null
let attesa = 0
let orologio = 0
let orologioAvviso = 0
let daSalvare = 0
let ora = 0
const giostra = new Giostra(passo)

// ferma durante il conto e mentre si sceglie la cella: il tempo conta solo quando si gioca
const { inPausa, fermo, metti, togli, aiuto } = usaPausa({ anche: () => !!finale.value || !!domanda.value || !!inMano.value })

const avanza = progresso(CHIAVE)
const tappa = computed(() => CAMPAGNA[tappaIdx.value] || CAMPAGNA[0])
const scalino = computed(() => scalinoDi(tappa.value))
const siGioca = computed(() => vista.value === 'campo' && !domanda.value && !finale.value && !inMano.value)

function vuoto() { return { soli: 0, restano: 0, totale: 0, carte: [] } }

const dovEravamo = computed(() => `🧟 ne restano ${cruscotto.value.restano} · ☀️ ${cruscotto.value.soli}`)

/* ── la mappa ── */
const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    carte: t.piante.map(id => PIANTE[id].emoji).join(' '),
    aperta: aperta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

/* ── la partita lasciata a metà ── */
const ripresa = ref(laRipresa())

function laRipresa() {
  const d = dice(sosta(CHIAVE))
  return d && { emoji: '🌻', nome: d.nome, dettaglio: `ne restano ${d.restano} · ☀️ ${d.soli}` }
}

function salva({ subito = false } = {}) {
  const p = partita.value
  if (!p) return
  daSalvare = 0
  salvaSosta(CHIAVE, scrivi(p, tappaIdx.value), { subito })
}

function scorda() {
  buttaSosta(CHIAVE)
  ripresa.value = null
}

function riprendiPartita() {
  const letto = leggi(sosta(CHIAVE))
  if (!letto) return scorda()          // la carta sparisce, la mappa resta
  clearTimeout(attesa); attesa = 0
  tappaIdx.value = letto.indice
  partita.value = letto.partita
  azzera()
  metti({ auto: true })                // il campo ripreso nasce fermo: non l'ha chiesto nessuno
  vista.value = 'campo'
  ripresa.value = null
}

function azzera() {
  domanda.value = null
  inMano.value = null
  finale.value = null
  avviso.value = ''
  voluta = null
  pagata = false
  contata = false
  borsellino = borsa(CHIAVE)
  aggiornaCruscotto()
}

/* ── i suoni: il motore non suona, dice cosa è successo. L'audio non porta
   informazione: ogni cosa che si sente si vede anche. ── */
function suona(eventi) {
  const visti = new Set()
  for (const e of eventi) {
    if (visti.has(e.tipo)) continue
    visti.add(e.tipo)
    if (e.tipo === 'piantata') suono.compra()
    else if (e.tipo === 'sole') suono.nota(880, 120, 0.04, 'triangle', 0.03)
    else if (e.tipo === 'carretto') suono.rumore(0.4, 0.09, 400, 80)
  }
}

/* ── il battito ── */
function passo(dt) {
  const p = partita.value
  if (!p) return
  ora += dt
  if (!fermo.value && !p.fine) {
    p.avanza(dt)
    daSalvare += dt
    if (daSalvare > 5) salva()
  }
  const eventi = p.prendiEventi()
  if (eventi.length) suona(eventi)
  if (p.fine && !finale.value && !attesa) attesa = setTimeout(chiudiPartita, RESPIRO)
  orologio += dt
  if (orologio > 0.2) { orologio = 0; aggiornaCruscotto() }
  campo?.disegna(p, ora, { piazza: !!inMano.value })
}

function aggiornaCruscotto() {
  const p = partita.value
  if (!p) return
  cruscotto.value = {
    soli: Math.floor(p.soli), restano: p.restano, totale: p.totale,
    carte: tappa.value.piante.map(id => {
      const P = PIANTE[id]
      return { id, nome: P.nome, emoji: P.emoji, costo: P.costo, op: P.op, resta: p.cd[id], ricarica: P.ricarica, puoi: p.puoComprare(id) }
    }),
  }
}

/* ── giocare ── */
function avvia(indice) {
  clearTimeout(attesa); attesa = 0
  togli()   // una partita che comincia non comincia in pausa
  scorda()  // una partita nuova butta quella lasciata a metà (già chiesto dalla mappa)
  tappaIdx.value = indice
  partita.value = new Partita({ sfida: sfidaDi(CAMPAGNA[indice]) })
  azzera()
  vista.value = 'campo'
}

function prendiTela(tela) {
  if (!tela) return
  campo = new Campo(tela)
  campo.adatta()
  giostra.avvia()
}

function ridimensiona() { campo?.adatta() }

/* la carta di una pianta: il conto la apre, la risposta giusta la mette in mano */
function scegli(id) {
  const p = partita.value
  if (!p || fermo.value || domanda.value || inMano.value || p.fine) return
  if (p.cd[id] > 0) return dici('si sta ancora ricaricando…')
  if (!p.puoComprare(id)) return dici('servono più soli ☀️')
  const cal = p.calcoloDi(id)
  voluta = { id, op: cal.op }
  domanda.value = domandaDi(cal.op, gradoDi(laBase(cal.op), cal.peso))
  suono.ok()
}

/* la base del bambino per un'operazione: la sua, o da dove parte la prima volta (bravura.js) */
const laBase = op => basi(progresso(CHIAVE).bravura, { eta: etaDelBambino(), items: state.profile.items })[op]

function risposto({ giusto, saltata, tempo }) {
  const v = voluta
  domanda.value = null
  voluta = null
  if (!v) return
  if (!saltata) {
    const nuova = dopoLaRisposta(laBase(v.op), { giusto, tempo })
    ritocca(CHIAVE, c => { c.bravura = { ...(c.bravura || {}), [v.op]: nuova } })
  }
  if (giusto) {
    // il tasto «salta» dei grandi dà la pianta ma non paga e non conta (docs/core/comandi.md)
    if (!saltata) { borsellino.paga(PAGA.mossa); segna('giardinoCalcoli') }
    inMano.value = { id: v.id, emoji: PIANTE[v.id].emoji }
  } else {
    dici('conto sbagliato: ci riprovi quando vuoi')
  }
}

function annulla() { inMano.value = null }

/* un tocco sulla tela: un sole se ce n'è uno, altrimenti la cella per la pianta in mano */
function tocca(e) {
  const p = partita.value
  if (!p || !campo || finale.value || domanda.value || p.fine) return
  const { x, y } = campo.mondo(e.clientX, e.clientY)
  const i = p.raccolte.findIndex(s => Math.hypot(s.x - x, s.y - y) < 34)
  if (i >= 0) { p.raccogli(i); aggiornaCruscotto(); return }
  const m = inMano.value
  if (!m) return
  const c = Math.floor(x / 64), r = Math.floor(y / 64)
  if (!p.libera(c, r)) return
  if (p.pianta(m.id, c, r)) {
    segna('giardinoPiante')
    inMano.value = null
    aggiornaCruscotto()
    salva()
  } else {
    inMano.value = null
    dici('i soli non bastavano più')
  }
}

function dici(testo) {
  avviso.value = testo
  clearTimeout(orologioAvviso)
  orologioAvviso = setTimeout(() => { avviso.value = '' }, 2200)
}

/* ── finire ── */
let pagata = false
let contata = false

function chiudiPartita() {
  attesa = 0
  const p = partita.value
  if (!p) return
  giostra.ferma()
  scorda()          // finita o vinta, non c'è più niente da riprendere
  const vinto = p.fine === 'vinto'
  const stelle = stellePer({ vinto, carretti: p.usati })
  if (vinto && !pagata) {
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle })
    if (stelle === 3) segna('giardinoSenzaGraffi')
    pagata = true
  }
  if (!contata) { segna('giardinoPartite'); contata = true }
  suono[vinto ? 'livello' : 'fine']()
  finale.value = {
    vinta: vinto, titolo: tappa.value.nome, stelle, carretti: p.usati,
    monete: borsellino.dato, notaMonete: borsellino.nota(),
    ultima: vinto && tappaIdx.value === QUANTE_TAPPE - 1,
  }
}

function ancora() {
  const f = finale.value
  if (!f) return
  if (f.vinta && tappaIdx.value + 1 < QUANTE_TAPPE && aperta(CHIAVE, tappaIdx.value + 1)) return avvia(tappaIdx.value + 1)
  if (f.vinta) return allaMappa()
  avvia(tappaIdx.value)
}

function allaMappa() {
  clearTimeout(attesa); attesa = 0
  togli()
  giostra.ferma()
  partita.value = null
  campo = null
  finale.value = null
  domanda.value = null
  inMano.value = null
  vista.value = 'mappa'
}

// uscire a metà non chiude la partita: si scrive dove si era e la mappa la offre in cima
function indietro() {
  if (vista.value === 'mappa') return emit('vai', 'home')
  const p = partita.value
  if (p && !p.fine) {
    salva({ subito: true })
    ripresa.value = laRipresa()
  }
  allaMappa()
}

// il telefono che si mette in tasca: visibilitychange è l'ultimo momento in cui si può scrivere
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true })
}

// il gancio per guardarsi: la partita e qualche leva, per scattare e provare senza giocare
// mezz'ora. Sparisce dal build (import.meta.env.DEV).
function gancioDiProva() {
  if (!import.meta.env.DEV) return
  window.__giardino = {
    get partita() { return partita.value },
    get fermo() { return fermo.value },
    get domanda() { return domanda.value },
    metti, togli, scegli,
  }
}

onMounted(() => {
  gancioDiProva()
  addEventListener('resize', ridimensiona)
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
onUnmounted(() => {
  if (import.meta.env.DEV) delete window.__giardino
  salva({ subito: true })
  removeEventListener('resize', ridimensiona)
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
  clearTimeout(attesa)
  clearTimeout(orologioAvviso)
  giostra.ferma()
})
</script>

<template>
  <div class="schermo">
    <!-- il ⏸ c'è solo dove scorre qualcosa -->
    <Barra :titolo="vista === 'campo' ? tappa.nome : 'Il giardino'" monete
           :pausa="siGioca" @pausa="metti()" @aiuto="aiuto" @indietro="indietro" />

    <div class="gi">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" :ripresa="ripresa"
             @gioca="avvia" @riprendi="riprendiPartita" @scorda="scorda" />

      <CampoVista v-else :cruscotto="cruscotto" :avviso="avviso" :in-mano="inMano"
                  @tela="prendiTela" @tocca="tocca" @scegli="scegli" @annulla="annulla" />

      <!-- il calcolo prende tutto lo schermo; il campo intanto sta fermo -->
      <Domanda v-if="domanda" :domanda="domanda.domanda" :pittori="domanda.pittori"
               :titolo="`${domanda.icona} ${domanda.nome}`"
               :origine="domanda" gioco="giardino" @risposto="risposto" />

      <Finale v-if="finale" v-bind="finale" @ancora="ancora" @esci="allaMappa" />

      <VeloPausa v-if="inPausa && siGioca" :dove="dovEravamo" @riprendi="togli" @esci="indietro" />
    </div>
  </div>
</template>
