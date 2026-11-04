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
import { usaAmici } from '../../amici/usaAmici.js'
import { attesaDellEsito, PONDERA, TEMPO_MAX } from '../../quiz/nucleo/domanda.js'

import { CAMPAGNA, BLOCCHI, QUANTE_TAPPE, MONETE_A_DOSE } from './dati/campagna.js'
import { mescola, scrivi as scriviMisura } from './dati/misure.js'
import { Bottega } from './motore/bottega.js'
import { MORTAIO } from './motore/procedimento.js'
import { scrivi, leggi, dice, tappaDi } from './motore/sosta.js'
import Mappa from './viste/Mappa.vue'
import Mercante from './viste/Mercante.vue'
import Fine from './viste/Fine.vue'
import './stile.css'

defineOptions({ name: 'Pozioni' })
const emit = defineEmits(['vai'])

const CHIAVE = 'pozioni'
const CIECO = 320           // una schermata appena comparsa non si tocca subito

// dove siamo
const vista = ref('mappa')          // mappa | banco
const tappaIdx = ref(0)
const bottega = ref(null)
const bozza = ref([])               // l'ordine in preparazione: [{ i, k }]
const animazione = ref(null)
const messaggio = ref(null)
const occupato = ref(false)
const finale = ref(null)
const cieco = ref(false)
const attesa = ref(0)               // 0..1 della barra sotto un trabocco
const giro = ref(0)                 // una pozione nuova è una tela nuova
const avanza = progresso(CHIAVE)

const tappa = computed(() => CAMPAGNA[tappaIdx.value])
const titolo = computed(() => (vista.value === 'banco' ? tappa.value.nome : 'Le pozioni'))

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

// giocare
let barra = 0, apertaIl = 0, nAnim = 0, inCorso = null
// un ingrediente finito senza traboccare paga, anche in una tappa rifatta (docs/pozioni/regole.md)
let borsellino = borsa(CHIAVE)

/* ── la tappa lasciata a metà ──
   Uscire non butta via niente: si scrive dove si era (motore/sosta.js) e la
   mappa la offre in cima. Vedi docs/pozioni/sosta.md. */
const laRipresa = () => {
  const d = dice(sosta(CHIAVE))
  if (!d || !aperta(CHIAVE, d.indice)) return null
  const sbagli = d.traboccate ? ` · 💥 ${d.traboccate}` : ''
  return { emoji: d.emoji, nome: d.nome, dettaglio: `🧪 ${d.fatti} ingredienti su ${d.quanti}${sbagli}` }
}
const ripresa = ref(laRipresa())
const chiede = ref(null)            // { nome, i }: la tappa nuova che butterebbe quella a metà

function salva({ subito = false } = {}) {
  if (vista.value !== 'banco' || !bottega.value || bottega.value.finita) return
  salvaSosta(CHIAVE, scrivi(bottega.value, tappaIdx.value,
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

function entra(i, b) {
  cancelAnimationFrame(barra); attesa.value = 0
  tappaIdx.value = i
  bottega.value = b
  bozza.value = []
  giro.value++
  finale.value = null
  occupato.value = false
  animazione.value = null
  inCorso = null
  vista.value = 'banco'
  apertaIl = performance.now()
  accieca()
}

// se il salvataggio non si legge più la carta sparisce e resta la mappa
function riprendiPartita() {
  const dato = sosta(CHIAVE)
  const t = tappaDi(dato)
  const b = t && aperta(CHIAVE, t.indice) ? leggi(dato) : null
  if (!b) return scorda()
  borsellino = borsa(CHIAVE, dato.monete)
  ripresa.value = null
  chiede.value = null
  messaggio.value = null
  entra(t.indice, b)
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
  cancelAnimationFrame(barra)
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
})

function avviaTappa(i) {
  if (!aperta(CHIAVE, i)) return
  scorda()
  borsellino = borsa(CHIAVE)
  const t = CAMPAGNA[i]
  messaggio.value = { tipo: 'aiuto', righe: t.aiuto === 'gioco'
    ? ['Fai le dosi spendendo meno gettoni che puoi.',
       'Scegli le ampolle e ordinale: le verserà il mercante. Oltre il segno d\'oro trabocca, e poi c\'è da pulire.']
    : [t.dritta] }
  const b = new Bottega(t)
  const inCasa = b.ingredienti.find(g => g.casa)
  if (inCasa) messaggio.value.righe.push(`In casa hai già ${scriviMisura(inCasa.casa, inCasa.unita)} di ${inCasa.nome}.`)
  entra(i, b)
}

function allaMappa() {
  cancelAnimationFrame(barra); attesa.value = 0
  finale.value = null
  bottega.value = null
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
const libero = () => bottega.value && !occupato.value && !cieco.value

function aggiungi(i, k) {
  if (!libero() || bozza.value.length >= bottega.value.quanteInOrdine || bottega.value.fatto(i)) return
  bozza.value = [...bozza.value, { i, k }]
  suono.nota(520, 640, 0.06, 'triangle', 0.06)
}
function togliVoce(n) {
  if (!libero()) return
  bozza.value = bozza.value.filter((_, j) => j !== n)
  suono.nota(420, 300, 0.06, 'sine', 0.06)
}

/* L'ordine si paga e il mercante versa: il motore decide tutto subito (e
   le monete, l'SRS e la fine della tappa si scrivono qui, così uscire a
   metà animazione non perde niente), la scena suona le ampolle una dopo
   l'altra, e il perché si legge alla fine. */
function ordina() {
  if (!libero() || attesa.value > 0 || !bozza.value.length) return
  const b = bottega.value
  const prima = b.ingredienti.map(g => g.messo)    // la pergamena li segue mentre versa
  const r = b.ordina(bozza.value)
  if (!r) return
  bozza.value = []
  occupato.value = true
  messaggio.value = null
  suono.nota(300, 520, 0.12, 'triangle', 0.08)
  for (const e of r.esiti) {
    annota(e.annota)
    if (e.tipo === 'giusto') segna('misure')
    if (e.monete) borsellino.paga(e.monete)
  }
  salva({ subito: true })
  inCorso = r
  animazione.value = { n: ++nAnim, tipo: 'ordine', prima, voci: r.esiti.map(e => {
    const g = b.ingredienti[e.ingrediente]
    return { i: e.ingrediente, testo: e.testo, colore: g.colore, famiglia: g.famiglia, misura: e.base / g.dose,
             trabocca: e.tipo === 'trabocca', pieno: !!e.pieno, messo: e.dopo, livello: e.dopo / g.dose,
             pezzi: e.pezzi.map(p => p / g.dose) }
  }) }
}

function fermo(n) {
  if (n !== nAnim) return
  const r = inCorso
  inCorso = null
  if (animazione.value?.tipo === 'festa') { occupato.value = false; finale.value = chiusa; suono.livello(); return }
  apertaIl = performance.now()
  if (!r) { occupato.value = false; salva({ subito: true }); return }
  if (r.azione) return fermoPasso(r)
  const trabocco = r.esiti.some(e => e.tipo === 'trabocca')
  if (r.esiti.some(e => e.monete)) suono.moneta()
  if (trabocco) suono.no(); else suono.ok()
  const righe = r.esiti.flatMap(e => e.righe)
  messaggio.value = { tipo: trabocco ? 'trabocca' : 'giusto', righe }
  if (trabocco) leggiPrima(righe)
  if (r.pronta && !trabocco) messaggio.value = ALLA_RICETTA
  occupato.value = false
}

function festa() {
  animazione.value = { n: ++nAnim, tipo: 'festa', colore: bottega.value.pozione.colore }
}

/* Il procedimento: anche qui il motore decide subito e la scena suona dopo. */
const ALLA_RICETTA = { tipo: 'aiuto', righe: ['Hai tutto! Leggi la ricetta e trascina la roba e gli attrezzi dove serve.'] }
const colori = lista => lista.map(i => bottega.value.ingredienti[i].colore)

function fai(azione, cosa = [], attrezzo = null) {
  if (!libero() || attesa.value > 0) return
  const b = bottega.value
  const pestato = b.mortaio.length ? mescola(colori(b.mortaio)) : null
  const r = b.fai(azione, cosa)
  if (!r) return
  occupato.value = true
  messaggio.value = null
  if (r.monete) borsellino.paga(r.monete)
  if (r.finita) chiudiTappa()
  else salva({ subito: true })
  inCorso = r
  const fatti = r.giusto ? (r.versati || []) : []
  animazione.value = { n: ++nAnim, tipo: 'passo', azione, attrezzo, giusto: r.giusto, mortaio: (r.cosa || []).includes(MORTAIO),
                       colore: r.cosa?.includes(MORTAIO) ? pestato : azione === 'metti' ? mescola(colori(b.mortaio)) : fatti.length ? mescola(colori(fatti)) : null,
                       polvere: fatti.some(i => b.ingredienti[i].famiglia !== 'capacita'),
                       brodo: b.brodo, arcobaleno: !b.mescolato, riempito: b.dentro.length / b.ingredienti.length }
}

function fermoPasso(r) {
  if (r.monete) suono.moneta()
  if (r.giusto) {
    if (r.monete || r.finita) suono.ok()
    if (r.finita) return festa()
  } else {
    suono.no()
    messaggio.value = { tipo: 'trabocca', righe: r.righe }
    leggiPrima(r.righe)
  }
  occupato.value = false
  salva({ subito: true })
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

function pulisci() {
  if (!libero() || attesa.value > 0 || !bottega.value.macchie.length) return
  const n = bottega.value.pulisci()
  occupato.value = true
  suono.nota(300, 600, 0.25, 'sine', 0.06)
  messaggio.value = { tipo: 'aiuto', righe: [n === 1 ? 'A posto: costa un gettone.' : `A posto: ${n} gettoni, uno a strumento.`] }
  animazione.value = { n: ++nAnim, tipo: 'pulisci' }
}

// il tasto dei grandi (docs/core/comandi.md): l'ingrediente è fatto e pagato, ma nessuno ha misurato
function salta() {
  if (!libero()) return
  const e = bottega.value.salta()
  if (!e) return
  borsellino.paga(e.monete)
  suono.moneta()
  if (e.finita) { occupato.value = true; chiudiTappa(); festa() }
  else salva({ subito: true })
}

function annota(a) {
  if (!a) return
  const ms = Math.min(TEMPO_MAX, Math.max(0, performance.now() - apertaIl))
  answer(a.chiave, { correct: a.giusto, ms })
}

let chiusa = null
function chiudiTappa() {
  const q = bottega.value
  const giaFatta = avanza.tappa > tappaIdx.value
  if (!q.saltate) segna('pozioni')
  if (q.perfetta) segna('pozioniPerfette')
  completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: q.stelle })
  scorda()
  const ultima = tappaIdx.value === QUANTE_TAPPE - 1
  const righe = [`Hai speso ${q.speso} gettoni: il minimo era ${q.minimo}.`]
  if (q.traboccate) righe.push(`${q.traboccate === 1 ? 'Un\'ampolla è traboccata' : `${q.traboccate} ampolle sono traboccate`}: si paga l'ampolla, e un gettone la spugna.`)
  if (q.pasticci) righe.push(`${q.pasticci === 1 ? 'Un pasticcio' : `${q.pasticci} pasticci`} col procedimento: un gettone l'uno.`)
  if (q.extra > 0) for (const x of q.piuEconomico()) righe.push(`${x.nome}: ${x.pezzi.join(' + ')} (${x.costo})`)
  chiusa = { titolo: tappa.value.nome, stelle: q.stelle, monete: borsellino.dato, notaMonete: borsellino.nota(),
             maestro: ultima && !giaFatta, ultima, righe }
}

function prossima() {
  if (tappaIdx.value >= QUANTE_TAPPE - 1) return allaMappa()
  avviaTappa(tappaIdx.value + 1)
}

/* per i test e per lo strumento delle foto: la stessa porta del gioco */
if (typeof window !== 'undefined')
  window.__poz = { vista, tappaIdx, bottega, bozza, finale, avviaTappa, allaMappa, prossima,
                   aggiungi, togliVoce, ordina, fai, pulisci, salta, CAMPAGNA, MONETE_A_DOSE }
</script>

<template>
  <div class="schermo pz" :data-vista="vista">
    <Barra :titolo="titolo" guida="pozioni" scura :monete="vista === 'mappa'" @indietro="indietro" />

    <Mappa v-if="vista === 'mappa'" :blocchi="blocchi" :ripresa="ripresa"
           :chiede="chiede ? chiede.nome : ''" :davanti="amici.davanti" @gioca="vuoleIniziare"
           @riprendi="riprendiPartita" @scorda="scorda"
           @comincia="comincia" @annulla="chiede = null" />

    <Mercante v-else-if="bottega" :key="giro" :bottega="bottega" :bozza="bozza" :animazione="animazione"
              :messaggio="messaggio" :attesa="attesa" :bloccato="occupato || cieco"
              @aggiungi="aggiungi" @togli="togliVoce" @ordina="ordina" @fai="fai" @pulisci="pulisci" @fermo="fermo" />
    <TastoSalta v-if="bottega && vista === 'banco' && !finale" @salta="salta" />

    <Fine v-if="finale" v-bind="finale" @avanti="prossima" @mappa="allaMappa" />
  </div>
</template>
