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
import { segna, answer, sperimentaliAccesi } from '../../store/profile.js'
import { borsa } from '../../store/varieta.js'
import { progresso, aperta, adesso, stelleDi, completa,
         sosta, salvaSosta, buttaSosta } from '../campagne.js'
import { usaAmici } from '../../amici/usaAmici.js'
import { attesaDellEsito, PONDERA, TEMPO_MAX } from '../../quiz/nucleo/domanda.js'

import { CAMPAGNA, BLOCCHI, QUANTE_TAPPE, MONETE_A_DOSE } from './dati/campagna.js'
import { STRUMENTO, mescola } from './dati/misure.js'
import { PROVE } from './dati/bottega.js'
import { Partita } from './motore/partita.js'
import { Bottega } from './motore/bottega.js'
import { scrivi, leggi, dice, tappaDi } from './motore/sosta.js'
import Mappa from './viste/Mappa.vue'
import Banco from './viste/Banco.vue'
import Fine from './viste/Fine.vue'
import Mercante from './viste/Mercante.vue'
import './stile.css'

defineOptions({ name: 'Pozioni' })
const emit = defineEmits(['vai'])

const CHIAVE = 'pozioni'
const CIECO = 320           // una schermata appena comparsa non si tocca subito
const TUFFO = 900           // quanto si guarda l'ingrediente andare nel calderone

// dove siamo
const vista = ref('mappa')          // mappa | banco | mercante
const tappaIdx = ref(0)
const partita = ref(null)
const finale = ref(null)
const cieco = ref(false)
const attesa = ref(0)               // 0..1 della barra sotto un esito
const nelCalderone = ref([])        // gli ingredienti già tuffati, per il colore
const avanza = progresso(CHIAVE)

const tappa = computed(() => CAMPAGNA[tappaIdx.value])
const titolo = computed(() => (vista.value === 'banco' ? tappa.value.nome
  : vista.value === 'mercante' ? PROVE[prova.value].nome : 'Le pozioni'))

// gli amici dalla loro bacheca (docs/core/amici-nei-giochi.md): la tappa da fare di ognuno
const amici = usaAmici(CHIAVE)

// la mappa
const blocchi = computed(() => BLOCCHI.map(b => ({
  ...b,
  tappe: b.tappe.map(t => ({
    ...t,
    aperta: aperta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
    stelle: stelleDi(CHIAVE, t.indice),
    amici: amici.sullaTappa(t.indice),
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
  // `#pozioni=mercante&prova=2`: la bottega in prova, anche coi giochi in prova spenti
  const h = new URLSearchParams((location.hash || '').slice(1))
  if (h.get('pozioni') === 'mercante') avviaProva(Math.max(0, Math.min(PROVE.length - 1, (Number(h.get('prova')) || 1) - 1)))
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
  bottega.value = null
  vista.value = 'mappa'
}

// dal banco il ← porta alla mappa, e la tappa a metà resta lì in cima
function indietro() {
  if (vista.value === 'mappa') return emit('vai', 'home')
  if (vista.value === 'mercante') return allaMappa()   // in prova: niente sosta
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
  // il tasto «salta» dei grandi (docs/core/comandi.md): dose fatta e pagata, ma nessuno ha misurato
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
  if (vista.value === 'mercante') return prova.value < PROVE.length - 1 ? avviaProva(prova.value + 1) : allaMappa()
  if (tappaIdx.value >= QUANTE_TAPPE - 1) return allaMappa()
  avviaTappa(tappaIdx.value + 1)
}

/* ── la bottega del mercante, in prova (docs/pozioni/bottega.md) ──
   Non è nella campagna: niente sosta né stelle sulla mappa. Le monete sì,
   un ingrediente finito senza traboccare come una dose del banco. */
const prova = ref(0)
const bottega = ref(null)
const animazione = ref(null)
const messaggio = ref(null)
const occupato = ref(false)
const prove = computed(() => (sperimentaliAccesi() ? PROVE : []))
const giro = ref(0)                 // una pozione nuova è una tela nuova
let nAnim = 0, inCorso = null

function avviaProva(i) {
  clearTimeout(timer); cancelAnimationFrame(barra); attesa.value = 0
  prova.value = i
  bottega.value = new Bottega(PROVE[i])
  giro.value++
  borsellino = borsa(CHIAVE)
  finale.value = null
  occupato.value = false
  animazione.value = null
  const g = bottega.value.ingredienti[0]
  messaggio.value = { tipo: 'aiuto', righe: ['Componi la pozione spendendo meno gettoni che puoi.',
    `Tocca un'ampolla: la compri e va nel misurino di ${g.nome}. Oltre la tacca d'oro trabocca, e poi c'è da pulire.`] }
  vista.value = 'mercante'
  apertaIl = performance.now()
  accieca()
}
const liberaB = () => bottega.value && !occupato.value && !cieco.value && attesa.value === 0

function compra(k) {
  if (!liberaB()) return
  const b = bottega.value
  const e = b.compra(k)
  if (!e) return
  occupato.value = true
  annota(e.annota)
  if (e.tipo === 'giusto') { segna('misure'); suono.nota(520, 700, 0.12, 'triangle', 0.08) }
  else suono.no()
  const g = b.ingredienti[e.ingrediente]
  inCorso = e
  messaggio.value = null
  animazione.value = { n: ++nAnim, tipo: 'versa', k, i: e.ingrediente, trabocca: e.tipo === 'trabocca', pieno: !!e.pieno,
                       colore: g.colore, famiglia: g.famiglia,
                       macchia: b.macchia && { i: b.macchia.ingrediente, colore: b.macchia.colore } }
}

function fermo(n) {
  if (n !== nAnim) return
  const e = inCorso
  inCorso = null
  if (animazione.value?.tipo === 'festa') return provaFinita()
  apertaIl = performance.now()
  if (!e) { occupato.value = false; return }
  messaggio.value = { tipo: e.tipo, righe: e.righe }
  if (e.monete) { borsellino.paga(e.monete); suono.moneta() }
  if (e.tipo === 'trabocca') leggiPrima(e.righe)
  if (e.finita) {
    animazione.value = { n: ++nAnim, tipo: 'festa', colore: mescola(bottega.value.ingredienti.map(i => i.colore)) }
    suono.ok()
    return
  }
  occupato.value = false
}

// dopo il trabocco si legge il perché, con la barra, prima di pulire (docs/apprendimento/la-domanda.md)
function leggiPrima(righe) {
  const ms = attesaDellEsito({ righe, pavimento: PONDERA })
  const t0 = performance.now()
  attesa.value = 1
  const tick = () => {
    attesa.value = Math.max(0, 1 - (performance.now() - t0) / ms)
    if (attesa.value > 0) barra = requestAnimationFrame(tick)
  }
  barra = requestAnimationFrame(tick)
}

function scegli(i) {
  if (!liberaB()) return
  if (bottega.value.scegli(i)) { suono.nota(400, 480, 0.06, 'sine', 0.06); messaggio.value = null }
}

function pulisci() {
  if (!liberaB() || !bottega.value.macchia) return
  bottega.value.pulisci()
  occupato.value = true
  suono.nota(300, 600, 0.25, 'sine', 0.06)
  messaggio.value = { tipo: 'aiuto', righe: ['Pulito. La spugna costa un gettone.'] }
  animazione.value = { n: ++nAnim, tipo: 'pulisci' }
}

function provaFinita() {
  const b = bottega.value
  segna('pozioni')
  if (!b.traboccate) segna('pozioniPerfette')
  const righe = [`Hai speso ${b.speso} gettoni: il minimo era ${b.minimo}.`]
  if (b.traboccate) righe.push(`${b.traboccate === 1 ? 'Un\'ampolla è traboccata' : `${b.traboccate} ampolle sono traboccate`}: si paga l'ampolla, e un gettone la spugna.`)
  if (b.extra > 0) for (const x of b.piuEconomico()) righe.push(`${x.nome}: ${x.pezzi.join(' + ')} (${x.costo})`)
  finale.value = { titolo: b.pozione.nome, stelle: b.stelle, monete: borsellino.dato, notaMonete: borsellino.nota(),
                   pozioni: 1, perfette: b.traboccate ? 0 : 1, ultima: prova.value === PROVE.length - 1, righe }
  occupato.value = false
  suono.livello()
}

/* per i test e per lo strumento delle foto: la stessa porta del gioco */
if (typeof window !== 'undefined')
  window.__poz = { vista, tappaIdx, partita, finale, avviaTappa, allaMappa, prossima,
                   prendi, posa, metti, togli, svuota, riponi, conferma, CAMPAGNA, MONETE_A_DOSE,
                   bottega, avviaProva, compra, scegli, pulisci, PROVE }
</script>

<template>
  <div class="schermo pz" :data-vista="vista">
    <Barra :titolo="titolo" guida="pozioni" scura :monete="vista === 'mappa'" @indietro="indietro">
      <template v-if="partita && vista === 'banco'">
        <div class="gettone" data-clienti>🧍 <b>{{ Math.min(partita.n + 1, tappa.clienti) }}/{{ tappa.clienti }}</b></div>
      </template>
    </Barra>

    <Mappa v-if="vista === 'mappa'" :blocchi="blocchi" :ripresa="ripresa"
           :chiede="chiede ? chiede.nome : ''" :davanti="amici.davanti" :prove="prove"
           @gioca="vuoleIniziare" @prova="avviaProva"
           @riprendi="riprendiPartita" @scorda="scorda"
           @comincia="comincia" @annulla="chiede = null" />

    <Banco v-else-if="vista === 'banco' && partita" :partita="partita" :bloccato="cieco" :attesa="attesa"
           :calderone="calderone" :strumenti-tutti="strumentiTutti"
           @prendi="prendi" @posa="posa" @metti="metti" @togli="togli"
           @svuota="svuota" @riponi="riponi" @conferma="conferma()" />
    <Mercante v-else-if="vista === 'mercante' && bottega" :key="giro"
              :bottega="bottega" :animazione="animazione" :messaggio="messaggio" :attesa="attesa"
              :bloccato="occupato || cieco" :manca="PROVE[prova].manca"
              @compra="compra" @scegli="scegli" @pulisci="pulisci" @fermo="fermo" />
    <TastoSalta v-if="partita && vista === 'banco' && !finale" @salta="conferma(true)" />

    <Fine v-if="finale" v-bind="finale" @avanti="prossima" @mappa="allaMappa" />
  </div>
</template>
