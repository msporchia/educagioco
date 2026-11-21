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
import { segna, answer, guidaGiaVista, segnaGuidaVista } from '../../store/profile.js'
import { borsa } from '../../store/varieta.js'
import { progresso, aperta, adesso, stelleDi, completa, primatoDi, segnaPrimato,
         sosta, salvaSosta, buttaSosta } from '../campagne.js'
import { usaAmici } from '../../amici/usaAmici.js'
import { attesaDellEsito, PONDERA, TEMPO_MAX } from '../../quiz/nucleo/domanda.js'
import { fasciaAttiva } from '../../store/qualita.js'

import { CAMPAGNA, BLOCCHI, QUANTE_TAPPE, MONETE_A_DOSE, INFINITA, giroInfinito } from './dati/campagna.js'
import { SENZA_FINE } from './gioco.js'
import { fraseDiFine, primatoInParole } from '../primati.js'
import { mescola } from './dati/misure.js'
import { Bottega } from './motore/bottega.js'
import { MORTAIO, TAGLIERE, GRATTATO } from './motore/procedimento.js'
import { scrivi, leggi, dice, tappaDi } from './motore/sosta.js'
import { tappeDelLimite, tappaDiScuola, dopoNelGiro, risposteDellOrdine } from './motore/limite.js'
import { usaGuidaRichiamata } from '../guida.js'
import Guida from '../Guida.vue'
import { saltaLeSpiegazioni } from '../spiegazioni.js'
import { guidaDellePozioni } from './motore/guida.js'
import Mappa from './viste/Mappa.vue'
import Mercante from './viste/Mercante.vue'
import Fine from './viste/Fine.vue'
import './stile.css'

defineOptions({ name: 'Pozioni' })
const emit = defineEmits(['vai', 'risposta'])
// a scuola (docs/pozioni/scuola.md): `{ famiglie, gradini }`, le tappe da giocare in giro; a casa manca
const props = defineProps({ limite: { type: Object, default: null } })
const scelte = tappeDelLimite(props.limite)     // null a casa
// i PC della scuola sono lenti: col limite e la fascia bassa il banco si disegna leggero
const leggera = !!scelte && fasciaAttiva() === 'bassa'

const CHIAVE = 'pozioni'
const CIECO = 320           // una schermata appena comparsa non si tocca subito

// dove siamo
const vista = ref(scelte ? 'banco' : 'mappa')   // mappa | banco
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

/* la guida «Come si gioca» (motore/guida.js, docs/core/come-si-gioca.md): un ordine fino alla ricetta, alla prima pozione della vita
   (a scuola della pagina, con la ✕); il `?` la richiama. Qui non c'è un orologio: niente da fermare */
const radice = ref(null)
const guida = usaGuidaRichiamata({
  prima: !!scelte || (!saltaLeSpiegazioni() && !guidaGiaVista(CHIAVE)),
  saltabile: !!scelte,
  finita: () => { if (!scelte) segnaGuidaVista(CHIAVE) },
})
const passoGuida = computed(() => {
  const b = bottega.value
  if (!guida.accesa.value || vista.value !== 'banco' || !b || finale.value) return null
  return guidaDellePozioni({ occupato: occupato.value, finita: b.finita, pronta: b.pronta, sporco: b.macchie.length > 0,
                             bozza: bozza.value.length, ordinato: guida.fatto('ordine') })
})
guida.segui(radice, passoGuida)

const tappa = computed(() => (tappaIdx.value < 0 ? INFINITA : CAMPAGNA[tappaIdx.value]))
// il calderone senza fondo sta dietro l'ultima tappa: si apre con lei. Indice -1
const apertaQui = i => aperta(CHIAVE, i < 0 ? QUANTE_TAPPE - 1 : i)
const serie = ref(0)                // le pozioni fatte nel calderone senza fondo
let prossimo = null                 // quella dopo, già pronta: chi esce mentre fa festa la ritrova
const titolo = computed(() => (vista.value !== 'banco' ? 'Le pozioni'
  : scelte ? `${scelte.indexOf(tappaIdx.value) + 1}/${scelte.length} · ${tappa.value.nome}` : tappa.value.nome))

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

const infinita = computed(() => {
  const record = primatoInParole(primatoDi(CHIAVE), SENZA_FINE.misura)
  return { ...INFINITA, aperta: apertaQui(-1), record }
})

// giocare
let barra = 0, apertaIl = 0, nAnim = 0, inCorso = null
// un ingrediente finito senza traboccare paga, anche in una tappa rifatta (docs/pozioni/regole.md)
let borsellino = borsa(CHIAVE)

/* ── la tappa lasciata a metà ──
   Uscire non butta via niente: si scrive dove si era (motore/sosta.js) e la
   mappa la offre in cima. Vedi docs/pozioni/sosta.md. */
const laRipresa = () => {
  const d = dice(sosta(CHIAVE))
  if (!d || !apertaQui(d.indice)) return null
  const sbagli = d.traboccate ? ` · 💥 ${d.traboccate}` : ''
  return { emoji: d.emoji, nome: d.nome, dettaglio: `🧪 ${d.fatti} ingredienti su ${d.quanti}${sbagli}` }
}
const ripresa = ref(scelte ? null : laRipresa())
const chiede = ref(null)            // { nome, i }: la tappa nuova che butterebbe quella a metà

function salva({ subito = false } = {}) {
  const b = prossimo || bottega.value
  if (scelte || vista.value !== 'banco' || !b || b.finita) return
  salvaSosta(CHIAVE, scrivi(b, tappaIdx.value,
    { monete: { chiesto: borsellino.chiesto, dato: borsellino.dato } }), { subito })
}

function scorda() {
  if (sosta(CHIAVE)) buttaSosta(CHIAVE)
  ripresa.value = null
  chiede.value = null
}

function vuoleIniziare(i) {
  if (!apertaQui(i)) return
  if (!ripresa.value) return avviaTappa(i)
  chiede.value = { nome: i < 0 ? INFINITA.nome : CAMPAGNA[i].nome, i }
}
function comincia() { avviaTappa(chiede.value.i) }

function entra(i, b) {
  riferisci()
  comprate = []
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
  const b = t && apertaQui(t.indice) ? leggi(dato) : null
  if (!b) return scorda()
  serie.value = dato.giro?.n || 0
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
// per guardare una tappa (docs/core/comandi.md): #pozioni=maestro anche chiusa, &banco=1 a spesa fatta
function dallIndirizzo() {
  const p = new URLSearchParams(location.hash.slice(1)), i = CAMPAGNA.findIndex(t => t.chiave === p.get('pozioni'))
  if (i < 0) return
  avviaTappa(i, true)
  if (p.get('banco')) while (!bottega.value.pronta) bottega.value.salta()
}
onMounted(() => {
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
  if (scelte) avviaTappa(scelte[0], true)
  else dallIndirizzo()
})
// prima che i figli se ne vadano (onUnmounted sarebbe tardi)
onBeforeUnmount(() => {
  riferisci()
  salva({ subito: true })
  cancelAnimationFrame(barra)
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
})

function avviaInfinita() {
  scorda()
  borsellino = borsa(CHIAVE)
  serie.value = 0
  messaggio.value = { tipo: 'aiuto', righe: [INFINITA.dritta] }
  entra(-1, new Bottega(giroInfinito(0), { scorta: INFINITA.scorta }))
}

function avviaTappa(i, ancheChiusa = false) {
  if (!ancheChiusa && !apertaQui(i)) return
  if (i < 0) return avviaInfinita()
  scorda()
  borsellino = borsa(CHIAVE)
  const t = CAMPAGNA[i]
  messaggio.value = { tipo: 'aiuto', righe: t.aiuto === 'gioco'
    ? ['Fai le dosi spendendo meno gettoni che puoi: sono del mercante, non le tue monete.',
       'Scegli le ampolle e ordinale tutte insieme: ogni ordine paga la spedizione. Oltre il segno d\'oro trabocca, e poi c\'è da pulire.']
    : [t.dritta] }
  entra(i, new Bottega(tappaDiScuola(t, props.limite)))
}

function allaMappa() {
  cancelAnimationFrame(barra); attesa.value = 0
  finale.value = null
  bottega.value = null
  prossimo = null
  vista.value = 'mappa'
}

// dal banco il ← porta alla mappa, e la tappa a metà resta lì in cima
function indietro() {
  if (scelte) return
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
  guida.segna('ordine')
  bozza.value = []
  occupato.value = true
  messaggio.value = null
  suono.nota(300, 520, 0.12, 'triangle', 0.08)
  for (const e of r.esiti) {
    annota(e.annota)
    if (e.tipo === 'giusto' && !scelte) segna('misure')
    if (e.monete) borsellino.paga(e.monete)
  }
  if (scelte) daDire.push(...risposteDellOrdine(b, r.esiti, comprate, Math.min(TEMPO_MAX, performance.now() - apertaIl)))
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
  riferisci()
  const r = inCorso
  inCorso = null
  if (animazione.value?.tipo === 'festa') {
    occupato.value = false
    suono.livello()
    if (prossimo) return pozioneDopo()
    finale.value = chiusa
    return
  }
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
  const tritato = b.tagliere.length ? mescola(colori(b.tagliere)) : null
  const grattato = b.grattato.length ? mescola(colori(b.grattato)) : null
  const r = b.fai(azione, cosa)
  if (!r) return
  occupato.value = true
  messaggio.value = null
  if (r.monete) borsellino.paga(r.monete)
  if (r.finita) chiudiTappa()
  else salva({ subito: true })
  inCorso = r
  const fatti = r.giusto ? (r.versati || []) : []
  animazione.value = { n: ++nAnim, tipo: 'passo', azione, attrezzo, giusto: r.giusto, gratis: r.gratis, mortaio: (r.cosa || []).includes(MORTAIO), tagliere: (r.cosa || []).includes(TAGLIERE), ciotolino: (r.cosa || []).includes(GRATTATO),
                       colore: r.cosa?.includes(MORTAIO) ? pestato : r.cosa?.includes(TAGLIERE) ? tritato : r.cosa?.includes(GRATTATO) ? grattato : azione === 'metti' ? mescola(colori(b.mortaio)) : azione === 'appoggia' ? mescola(colori(b.tagliere)) : fatti.length ? mescola(colori(fatti)) : null,
                       brodo: b.brodo, arcobaleno: !b.mescolato, riempito: b.dentro.length / b.ingredienti.length }
}

function fermoPasso(r) {
  if (r.monete) suono.moneta()
  if (r.giusto) {
    if (r.monete || r.finita) suono.ok()
    if (r.finita) return festa()
  } else if (r.gratis) messaggio.value = { tipo: 'aiuto', righe: r.righe }
  else {
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

/* A scuola ogni dose va alla maestra (docs/pozioni/scuola.md): si decide all'ordine e si dice quando il mercante ha
   finito di versare, quello che il bambino vede; chi esce prima la manda lo stesso */
let daDire = [], comprate = []
function riferisci() {
  const r = daDire
  daDire = []
  for (const x of r) emit('risposta', x)
}

let chiusa = null
function chiudiTappa() {
  const q = bottega.value
  if (scelte) return chiudiNelGiro(q)
  if (!q.saltate) segna('pozioni')
  if (q.perfetta) segna('pozioniPerfette')
  if (tappaIdx.value < 0) return chiudiGiro(q)
  const giaFatta = avanza.tappa > tappaIdx.value
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

// a scuola: niente completa, contatori né monete; le stelle dicono lo stesso quanto si è speso
function chiudiNelGiro(q) {
  const righe = [`Hai speso ${q.speso} gettoni: il minimo era ${q.minimo}.`]
  if (q.extra > 0) for (const x of q.piuEconomico()) righe.push(`${x.nome}: ${x.pezzi.join(' + ')} (${x.costo})`)
  chiusa = { titolo: tappa.value.nome, stelle: q.stelle, mappa: false, righe }
}

// una pozione del calderone senza fondo è finita: si va avanti finché non si è in rosso
function chiudiGiro(q) {
  serie.value++
  if (q.resto >= 0) {
    prossimo = new Bottega(giroInfinito(serie.value), { scorta: q.resto })
    salva({ subito: true })
    return
  }
  scorda()
  const esito = segnaPrimato(CHIAVE, serie.value)
  chiusa = { titolo: INFINITA.nome, stelle: 0, monete: borsellino.dato, notaMonete: borsellino.nota(), ancora: true,
             righe: [`${serie.value === 1 ? 'Una pozione' : `${serie.value} pozioni`} di fila, poi i gettoni sono finiti.`, fraseDiFine(esito, SENZA_FINE.misura)] }
}

function pozioneDopo() {
  const b = prossimo
  prossimo = null
  messaggio.value = { tipo: 'aiuto', righe: [`Pozione ${serie.value + 1}: ${b.pozione.nome}.`, `Ti restano ${b.gettoni - b.minimo} gettoni di scorta.`] }
  entra(-1, b)
}

function prossima() {
  if (scelte) return avviaTappa(dopoNelGiro(scelte, tappaIdx.value), true)
  if (tappaIdx.value < 0) return avviaInfinita()
  if (tappaIdx.value >= QUANTE_TAPPE - 1) return allaMappa()
  avviaTappa(tappaIdx.value + 1)
}

/* per i test e per lo strumento delle foto: la stessa porta del gioco */
if (typeof window !== 'undefined')
  window.__poz = { vista, tappaIdx, serie, avviaInfinita, bottega, bozza, finale, occupato, avviaTappa, allaMappa, prossima,
                   aggiungi, togliVoce, ordina, fai, pulisci, salta, CAMPAGNA, MONETE_A_DOSE }
</script>

<template>
  <div ref="radice" class="schermo pz" :data-vista="vista">
    <Barra :titolo="titolo" guida="pozioni" scura :monete="vista === 'mappa'" :come="vista === 'banco' && !finale" @come="guida.alterna()" @indietro="indietro" />
    <Guida class="pz-guida" :passo="passoGuida" :spegnibile="guida.spegnibile.value" @spegni="guida.spegni()" />

    <Mappa v-if="vista === 'mappa'" :blocchi="blocchi" :infinita="infinita" :ripresa="ripresa"
           :chiede="chiede ? chiede.nome : ''" :davanti="amici.davanti" @gioca="vuoleIniziare"
           @riprendi="riprendiPartita" @scorda="scorda"
           @comincia="comincia" @annulla="chiede = null" />

    <Mercante v-else-if="bottega" :key="giro" :bottega="bottega" :bozza="bozza" :animazione="animazione"
              :messaggio="messaggio" :attesa="attesa" :bloccato="occupato || cieco" :leggera="leggera"
              @aggiungi="aggiungi" @togli="togliVoce" @ordina="ordina" @fai="fai" @comincia="(a, c) => bottega.comincia(a, c)" @pulisci="pulisci" @fermo="fermo" />
    <TastoSalta v-if="bottega && vista === 'banco' && !finale" @salta="salta" />

    <Fine v-if="finale" v-bind="finale" @avanti="prossima" @mappa="allaMappa" />
  </div>
</template>
