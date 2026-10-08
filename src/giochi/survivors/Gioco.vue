<script setup>
// Il coordinatore: l'unico file che sa che esistono le monete e
// l'avanzamento. Le regole stanno in `motore/`, i numeri in `dati/`, il
// disegno in `scena/`, le schermate in `viste/`. Non sa che materie
// esistano: chiede una domanda con una difficoltà da 0 a 1 e la
// mostra. Vedi docs/survivors/regole.md.
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { segna, segnaBest } from '../../store/profile.js'
import { borsa } from '../../store/varieta.js'   // paga e dice se il salvadanaio è stanco
import { PAGA } from '../../data/paghe.js'
import { progresso, aperta, adesso, stelleDi, completa, primatoDi, segnaPrimato,
         sosta, salvaSosta, buttaSosta } from '../campagne.js'
import { fraseDiFine, recordInParole } from '../primati.js'
import { SENZA_FINE } from './gioco.js'
import { usaPausa } from '../pausa.js'
import VeloPausa from '../VeloPausa.vue'
import { domandaPerGioco } from '../../quiz/scelta.js'
import Domanda from '../../quiz/Domanda.vue'

import { CAMPAGNA, SCALINI, LIBERO, QUANTE_TAPPE, tappeDelloScalino } from './dati/campagna.js'
import { scenario } from './dati/scenari.js'
import { Regole, Partita } from './motore/partita.js'
import { scrivi, leggi, dice } from './motore/sosta.js'
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
let borsellino = borsa(CHIAVE)   // le monete di questa partita, una risposta giusta alla volta
const RESPIRO = 500          // quanto si guarda il campo prima del cartello

// dove siamo
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

// La pausa (giochi/pausa.js): qui si aggiunge la sola condizione che sia
// reattiva (col cartello finale davanti non si combatte). `inAttesa` è
// sparito: il "tocca per ripartire" scritto a mano per una partita
// ripresa era la stessa idea del velo comune, e tenerli tutti e due
// dava due riprese diverse per lo stesso gesto — adesso riprendere
// mette in pausa (metti({ auto: true })), come il telefono posato.
const { inPausa, fermo, metti, togli, aiuto } = usaPausa({ anche: () => !!finale.value })

const avanza = progresso(CHIAVE)
const libera = computed(() => tappaIdx.value < 0)
const regoleOra = computed(() => libera.value ? LIBERO : CAMPAGNA[tappaIdx.value] || CAMPAGNA[0])
const veste = computed(() => scenario(regoleOra.value.scenario))

// dove il gioco scorre davvero: le tre carte, la domanda e il cartello
// finale sono già veli sopra una partita ferma
const siGioca = computed(() => vista.value === 'campo'
  && !offerta.value && !domanda.value && !finale.value)

const dovEravamo = computed(() => {
  const c = cruscotto.value
  const s = Math.max(0, Math.ceil(c.oltre ? c.extra : c.infinita ? c.tempo : c.restano))
  const mmss = `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  return c.infinita || c.oltre
    ? `⏱️ ${mmss} in campo · livello ${c.livello}`
    : `⏱️ mancano ${mmss} · livello ${c.livello}`
})

function vuoto() {
  return { cuori: 3, cuoriMax: 3, livello: 1, quota: 0, tempo: 0,
           restano: 0, infinita: false, uccisi: 0, presi: [], cassa: false }
}

// la partita lasciata a metà: uscire non butta più via niente, si
// scrive dove si era (motore/sosta.js) e la mappa la offre in cima
const ripresa = ref(laRipresa())
let daSalvare = 0

function laRipresa() {
  const d = dice(sosta(CHIAVE), CAMPAGNA, LIBERO)
  return d && { ...d, icona: d.libera ? '♾️' : scenario(d.scenario).icona }
}

function salva({ subito = false } = {}) {
  const p = partita.value
  if (!p) return
  daSalvare = 0
  const dato = scrivi(p, tappaIdx.value)
  // `scrivi` torna null a partita finita o già vinta: la sosta va tolta
  salvaSosta(CHIAVE, dato, { subito })
}

function scorda() {
  buttaSosta(CHIAVE)
  ripresa.value = null
}

// se il salvataggio non si legge più si comincia la tappa da capo
function riprendiPartita() {
  const dato = sosta(CHIAVE)
  const t = dato ? (dato.tappa < 0 ? LIBERO : CAMPAGNA[dato.tappa]) : null
  const p = t ? leggi(dato, t) : null
  if (!p) return scorda()          // la carta sparisce, la mappa resta
  clearTimeout(attesa); attesa = 0
  tappaIdx.value = dato.tappa
  partita.value = p
  cruscotto.value = p.cruscotto
  offerta.value = null
  domanda.value = null
  finale.value = null
  brindisi.value = ''
  toccato.value = true   // la dritta è per chi comincia, non per chi riprende
  metti({ auto: true })  // il campo ripreso nasce fermo: non l'ha chiesto nessuno
  vista.value = 'campo'
  pagata = false
  contata = false
  mostriSegnati = 0
  borsellino = borsa(CHIAVE)
  ripresa.value = null
  if (pittore) prendiTela(pittore.tela)
}

// la mappa: le tappe arrivano già decise
const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    icona: scenario(t.scenario).icona,
    accento: scenario(t.scenario).accento,
    scenarioNome: scenario(t.scenario).nome,
    aperta: aperta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

const statoLibero = computed(() => ({
  aperto: aperta(CHIAVE, QUANTE_TAPPE),
  quante: QUANTE_TAPPE,
  fatte: Math.min(avanza.tappa, QUANTE_TAPPE),
  primato: recordInParole(primatoDi(CHIAVE), SENZA_FINE),
}))

const titolo = computed(() =>
  vista.value === 'campo' ? regoleOra.value.nome : 'Survivors')

// i suoni: il motore non suona, dice cosa è successo
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
  oggetto: () => suono.nota(1400, 1900, 0.09, 'sine', 0.05),
  cuore: () => suono.vita(),
  calamita: () => suono.nota(380, 1500, 0.35, 'sine', 0.07),
  cassa: () => suono.compra(),
  presa: () => suono.nota(600, 1200, 0.12, 'triangle', 0.06),
  gelo: () => suono.nota(1800, 700, 0.3, 'sine', 0.05),
  capo: () => { suono.nota(110, 70, 0.6, 'sawtooth', 0.1); suono.rumore(0.5, 0.07, 200, 60) },
  bomba: () => { suono.rumore(0.7, 0.16, 300, 60); suono.nota(160, 40, 0.5, 'sawtooth', 0.12) },
  muro: () => suono.rumore(0.5, 0.09, 500, 120),   // un brontolio, senza dire da che parte
  livello: () => suono.livello(),
  fuoco: () => suono.rumore(0.22, 0.06, 900, 200),
  tuono: () => suono.rumore(0.18, 0.07, 2400, 120),
  lancia: () => suono.nota(700, 180, 0.14, 'sawtooth', 0.06),
  fendente: () => suono.rumore(0.12, 0.09, 2000, 400),
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

// il battito: il campo si ferma anche davanti al cartello di un
// traguardo (state.festa) — un traguardo che si paga con una vita è un
// traguardo che si impara a temere. `fermo` (giochi/pausa.js) tiene
// l'elenco di cosa blocca; qui resta solo roba del motore, non reattiva.
function passo(dt) {
  const p = partita.value
  if (!p) return
  const bloccato = fermo.value || p.finita || p.inPausa
  if (!bloccato) {
    p.avanza(dt)
    // ogni tanto, non a ogni fotogramma: scrivere sessanta volte al
    // secondo su un telefono si sente, cinque secondi persi non sono niente
    daSalvare += dt
    if (daSalvare > 5) salva()
  }
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

// giocare
function avvia(indice) {
  clearTimeout(attesa); attesa = 0
  togli()   // una partita che comincia non comincia in pausa
  scorda()  // una partita nuova butta quella lasciata a metà (già chiesto dalla mappa)
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
  borsellino = borsa(CHIAVE)
  if (pittore) prendiTela(pittore.tela)
}

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

function potenzia() {
  const p = partita.value
  if (!p || fermo.value || p.apriOfferta() === null) return
  cruscotto.value = p.cruscotto
}

function bomba() {
  const p = partita.value
  if (!p || fermo.value || p.lanciaBomba() === null) return
  cruscotto.value = p.cruscotto
}

function muovi(dx, dy) {
  if (dx || dy) toccato.value = true
  partita.value?.muovi(dx, dy)
}

// la carta si paga: una domanda della difficoltà che costa la carta,
// senza sapere di che materia sia
function scegliCarta(chiave) {
  const p = partita.value
  voluta = p.offerta.find(c => c.chiave === chiave) || p.offerta[0]
  offerta.value = null
  domanda.value = domandaPerGioco({ difficolta: voluta.prezzo, evita: ultimoModulo })
  suono.ok()
}

// il potenziamento si vince rispondendo, e la risposta giusta paga subito;
// sbagliare non dà niente (niente monetina di consolazione — sarebbe il modo
// più veloce di farne, vedi docs/apprendimento/calibrazione.md)
function risposto({ giusto, saltata }) {
  const p = partita.value
  ultimoModulo = domanda.value?.modulo || null
  domanda.value = null
  // rispondere è il tocco che riprende: il freno può essersi acceso
  // durante la domanda, senza questa riga il campo resterebbe fermo
  // dietro un velo comparso dal niente
  togli()
  if (giusto) {
    // il tasto «salta» dei grandi dà la carta ma non paga e non conta (docs/core/comandi.md)
    if (!saltata) borsellino.paga(PAGA.domanda)
    const presa = p.prendi(voluta.chiave)
    brinda(`${presa.icona} ${presa.nome} — ${presa.chiaro}`, true)
    if (!saltata) {
      segna('survivorsCarte')
      if (voluta.fascia === 'forte') segna('survivorsToste')
    }
  } else {
    p.rinuncia()
    brinda('niente carta — ci riprovi alla prossima', false)
  }
  cruscotto.value = p.cruscotto
  salva()   // una carta è il momento in cui si perde di più se non si salva
}

function brinda(testo, giusto) {
  if (!testo) return
  brindisi.value = testo
  suono[giusto ? 'compra' : 'moneta']()
  clearTimeout(orologioBrindisi)
  orologioBrindisi = setTimeout(() => { brindisi.value = '' }, 2600)
}

// finire: una partita si chiude fino a due volte (al traguardo, e
// quando ti prendono se hai scelto di restare); la tappa si segna una
// volta sola, i mostri si contano a delta. Le monete sono già arrivate
// a ogni risposta giusta (`borsellino`): qui si dice solo quante
let pagata = false
let contata = false
let mostriSegnati = 0

function chiudiPartita() {
  attesa = 0
  const p = partita.value
  if (!p) return
  giostra.ferma()
  scorda()          // finita o vinta, non c'è più niente da riprendere
  const secondi = Math.floor(p.tempo)
  const extra = Math.floor(p.extra)
  let primato = null

  if (libera.value) {
    const esito = segnaPrimato(CHIAVE, secondi, Date.now(),
                               { uccisi: p.uccisi, livello: p.livello })
    primato = { ...esito, frase: fraseDiFine(esito, SENZA_FINE.misura) }
  } else if (p.vinta && !pagata) {
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: p.stelle })
    segna('survivorsTappe')
    pagata = true
  }
  if (!contata) { segna('survivorsPartite'); contata = true }
  if (p.uccisi > mostriSegnati) {
    segna('survivorsMostri', p.uccisi - mostriSegnati)
    mostriSegnati = p.uccisi
  }
  segnaBest('survivorsLivello', p.livello)
  segnaBest('survivorsTempo', secondi)

  finale.value = {
    vinta: p.vinta, titolo: regoleOra.value.nome, stelle: p.stelle,
    monete: borsellino.dato, notaMonete: borsellino.nota(), tempo: p.tempo, uccisi: p.uccisi, livello: p.livello,
    primato, libera: libera.value, extra,
    puoiRestare: p.alTraguardo,
    ultima: p.vinta && !libera.value && tappaIdx.value === QUANTE_TAPPE - 1,
  }
}

function resta() {
  const p = partita.value
  if (!p?.continua()) return
  togli()
  finale.value = null
  cruscotto.value = p.cruscotto
  giostra.avvia()
}

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
  togli()
  giostra.ferma()
  partita.value = null
  pittore = null
  finale.value = null
  offerta.value = null
  domanda.value = null
  vista.value = 'mappa'
}

// uscire a metà non chiude più la partita: si scrive dove si era e la
// mappa la offre in cima; si salva sempre, anche dopo pochi secondi
function indietro() {
  if (vista.value === 'mappa') return emit('vai', 'home')
  const p = partita.value
  if (p && !p.finita) {
    salva({ subito: true })
    ripresa.value = laRipresa()
  }
  allaMappa()
}

// il telefono che si mette in tasca: visibilitychange è l'ultimo
// momento in cui si può ancora scrivere. giochi/pausa.js ferma il
// campo per conto suo sullo stesso evento; qui resta solo la scrittura.
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden')
    salva({ subito: true })
}

// il gancio per guardarsi: fa salire di livello subito, per scattare le
// carte mature senza giocare mezz'ora. Sparisce dal build (import.meta.env.DEV).
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

onMounted(() => {
  addEventListener('resize', ridimensiona)
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
  gancioDiProva()
})
onUnmounted(() => {
  if (import.meta.env.DEV) delete window.__survivors
  salva({ subito: true })
  removeEventListener('resize', ridimensiona)
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
  clearTimeout(attesa)
  clearTimeout(orologioBrindisi)
  giostra.ferma()
})
</script>

<template>
  <div class="schermo">
    <!-- il ⏸ c'è solo dove scorre qualcosa -->
    <Barra :titolo="titolo" guida="survivors" @aiuto="aiuto" monete
           :pausa="siGioca" @pausa="metti()"
           :scura="vista === 'campo' && veste.buio" @indietro="indietro" />

    <div class="sv" :style="{ '--sv-accento': veste.accento }">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" :libero="statoLibero"
             :ripresa="ripresa"
             @gioca="avvia" @libero="avvia(-1)"
             @riprendi="riprendiPartita" @scorda="scorda" />

      <CampoVista v-else :cruscotto="cruscotto" :buio="veste.buio"
                  :dritta="!toccato && cruscotto.tempo < 9 && !finale"
                  @tela="prendiTela" @muovi="muovi" @bomba="bomba" @potenzia="potenzia" />

      <div v-if="brindisi" class="sv-brindisi em">{{ brindisi }}</div>

      <Carte v-if="offerta" :carte="offerta" :livello="cruscotto.livello"
             :cassa="cruscotto.cassa" @scegli="scegliCarta" />

      <Domanda v-if="domanda" :domanda="domanda.domanda" :pittori="domanda.pittori"
               :titolo="`${domanda.icona} ${domanda.nome}`"
               :origine="domanda" gioco="survivors" @risposto="risposto" />

      <Finale v-if="finale" v-bind="finale"
              @ancora="ancora" @esci="allaMappa" @resta="resta" />

      <!-- il velo copre tutto lo schermo: le carte, la domanda e il
           cartello finale hanno già la loro pausa -->
      <VeloPausa v-if="inPausa && siGioca" :dove="dovEravamo" @riprendi="togli" @esci="indietro" />
    </div>
  </div>
</template>
