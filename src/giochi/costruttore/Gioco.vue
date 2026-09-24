<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL COSTRUTTORE — IL COORDINATORE

   L'unico file del gioco che sa che esistono le monete, il profilo e
   l'archivio. Tiene il programma del livello aperto, applica le
   modifiche che l'editor chiede (`motore/modifica.js`), fa partire la
   regia e decide cosa dire quando si ferma.

   ── DOVE STANNO I PROGRAMMI ────────────────────────────────────────
   Il programma di ogni livello si tiene: chi esce a metà e torna domani
   ritrova quello che aveva scritto, progetti compresi. Sta **fuori dal
   profilo**, in archivio sotto `costruttore:<id del giocatore>`: il
   profilo si riscrive intero a ogni `persist()`, e tredici programmi
   dentro ogni scrittura sarebbero peso per sempre (la stessa scelta di
   `store/sessioni.js`). Si salva poco dopo ogni modifica e all'uscita.

   ── LE MONETE ───────────────────────────────────────────────────────
   Un livello paga **la prima volta** che si vince (`premio` in
   `dati/livelli.js`). Rifarlo è ricordarsi il programma, non scriverlo:
   non è esercizio, e non vale niente (vedi `CALIBRAZIONE.md`). Le
   stelle sono due: vinto, e vinto senza farsi mostrare la soluzione.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, reactive, computed, shallowRef, watch, nextTick, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { state, addCoins, segna } from '../../store/profile.js'
import { load, save } from '../../store/storage.js'
import { progresso, aperta, adesso, chiusaPerEta, stelleDi, completa, scelta, ricorda } from '../campagne.js'

import { CAPITOLI, QUANTE_TAPPE, FILE, FILA_ATTUALE, riordina } from './dati/campagna.js'
import { LIVELLI } from './dati/livelli.js'
import { LIBERO, APRE_DOPO } from './dati/libero.js'
import { copia, programma as scriviProgramma } from './dati/scrivi.js'
import * as mod from './motore/modifica.js'
import { fraseDi } from './motore/esecutore.js'
import { Regia, quadroFermo } from './regia.js'

import Mappa from './viste/Mappa.vue'
import Ordine from './viste/Ordine.vue'
import Campo from './viste/Campo.vue'
import Comandi from './viste/Comandi.vue'
import Editor from './viste/Editor.vue'
import Cassetta from './viste/Cassetta.vue'
import FoglioProgetto from './viste/FoglioProgetto.vue'
import FoglioLavagnetta from './viste/FoglioLavagnetta.vue'
import FoglioAiuto from './viste/FoglioAiuto.vue'
import FoglioCodice from './viste/FoglioCodice.vue'
import Finale from './viste/Finale.vue'
import './stile.css'

defineOptions({ name: 'Costruttore' })
const emit = defineEmits(['vai'])

const CHIAVE = 'costruttore'

/* ═══════════ dove siamo ═══════════ */
const vista = ref('mappa')             // mappa | cantiere
const idx = ref(-1)
/* il cantiere libero non è una tappa: ha un indice suo, fuori dalla fila */
const LIBERO_IDX = -2
const liv = computed(() => (idx.value === LIBERO_IDX ? LIBERO : idx.value >= 0 ? LIVELLI[idx.value] : null))
const avanza = progresso(CHIAVE)
/* chi ha giocato con una fila di livelli di prima ritrova le stelle sui
   livelli giusti (`riordina` in `dati/campagna.js`) */
if (avanza.cfg.fila !== FILA_ATTUALE) {
  const vecchia = FILE[avanza.cfg.fila || 1]
  if (vecchia && ((avanza.tappa || 0) > 0 || Object.keys(avanza.stelle || {}).length))
    Object.assign(avanza, riordina(avanza, vecchia))
  ricorda(CHIAVE, 'fila', FILA_ATTUALE)
}

/* ═══════════ i programmi, fuori dal profilo ═══════════ */
const archivio = reactive({ programmi: {} })
const VERSIONE = 2
const chiaveArchivio = () => `costruttore:${state.player || 'nessuno'}`
const pronto = load(chiaveArchivio()).then(d => {
  /* la versione 1 aveva il robot che volava e «vai su»: quei programmi
     parlano un'altra lingua, e si ricomincia da capo (l'avanzamento sta
     nel profilo e resta) */
  if (d && d.v === VERSIONE && d.programmi && typeof d.programmi === 'object') archivio.programmi = d.programmi
}).catch(() => {})
let salvaTimer = 0
function salvaOra() {
  clearTimeout(salvaTimer)
  if (!state.player) return
  save(chiaveArchivio(), { v: VERSIONE, programmi: JSON.parse(JSON.stringify(archivio.programmi)) })
}
const salvaPresto = () => { clearTimeout(salvaTimer); salvaTimer = setTimeout(salvaOra, 500) }

const inizio = l => ({ ...scriviProgramma({ principale: [], progetti: copia(l.regalo || []), lavagnette: [] }), svelato: false })
const prog = computed(() => (liv.value ? archivio.programmi[liv.value.chiave] : null))
const lavagnetteOrdine = computed(() => (liv.value ? liv.value.ordini[0].lavagnette || {} : {}))
const nomiOrdine = computed(() => Object.keys(lavagnetteOrdine.value))

/* ═══════════ la mappa ═══════════ */
const capitoli = computed(() => CAPITOLI.map(c => ({
  ...c,
  livelli: LIVELLI.map((l, i) => ({ ...l, indice: i })).filter(l => l.capitolo === c.chiave).map(l => ({
    ...l,
    aperta: aperta(CHIAVE, l.indice),
    adesso: adesso(CHIAVE, l.indice),
    stelle: stelleDi(CHIAVE, l.indice),
    /* chiuso per età: andare avanti non lo apre, quindi sotto non si
       promette niente */
    perEta: chiusaPerEta(CHIAVE, l.indice),
  })),
})))

const liberoAperto = computed(() => (avanza.tappa || 0) >= APRE_DOPO)

async function apriLivello(i) {
  await pronto
  const l = i === LIBERO_IDX ? LIBERO : LIVELLI[i]
  if (!archivio.programmi[l.chiave]) archivio.programmi[l.chiave] = inizio(l)
  idx.value = i
  vista.value = 'cantiere'
  tab.value = null
  sel.value = null
  aperta_.value = null
  foglio.value = null
  finale.value = null
  aiutiVisti.value = 1
  ordineVisto.value = 0
  resetRisultato()
}

/* ═══════════ l'editor ═══════════ */
const tab = ref(null)
const sel = ref(null)
const aperta_ = ref(null)
const foglio = ref(null)               // cassetta | progetto | lavagnetta | aiuto
const dove = ref(null)                 // dove andrà la riga scelta in cassetta
const progettoInModifica = ref(null)
const attesaLavagnetta = ref(null)     // { riga } o { inserisci: dove }
const aiutiVisti = ref(1)
/* il colore di partenza di un mattone nuovo: con un colore solo nel
   livello è quello, con più colori è l'ultimo scelto dal bambino */
const ultimoColore = ref(null)
const ricominciaArmato = ref(false)
let ricominciaTimer = 0

/* I progetti scritti negli altri cantieri, da riprendere: uno per
   nome (se lo stesso nome sta in più livelli vince quello del livello
   più avanti, che di solito è il più rifinito), e non quelli che questo
   programma ha già. */
const altriProgetti = computed(() => {
  if (!liv.value || !prog.value) return []
  const qui = new Set((prog.value.progetti || []).map(p => p.nome))
  const visti = new Map()
  /* solo dallo stesso mondo: una colonna di mattoni nel porto non
     saprebbe cosa fare, e prendere una cassa nel cantiere nemmeno */
  const mondo = liv.value.mondo || 'cantiere'
  const fonti = [...LIVELLI.filter(l => (l.mondo || 'cantiere') === mondo).map(l => [l.chiave, l.nome, LIVELLI.indexOf(l)]),
                 ...(mondo === 'cantiere' ? [[LIBERO.chiave, LIBERO.nome, 999]] : [])]
  for (const [chiave, nomeLiv, ordine] of fonti) {
    if (chiave === liv.value.chiave) continue
    const p = archivio.programmi[chiave]
    for (const q of (p && p.progetti) || []) {
      if (qui.has(q.nome) || !q.corpo.length) continue
      const prima = visti.get(q.nome)
      if (!prima || prima.ordine < ordine)
        visti.set(q.nome, { chiave, nomeLivello: nomeLiv, ordine, progetto: q })
    }
  }
  return [...visti.values()]
})
function importa({ chiave, progetto }) {
  const sorgente = archivio.programmi[chiave]
  if (!sorgente) return
  const id = modifica(p => mod.importaProgetto(p, sorgente, progetto))
  foglio.value = null
  if (id) tab.value = id
}

const problemi = computed(() => new Set(prog.value ? mod.problemi(prog.value, lavagnetteOrdine.value).map(p => p.id) : []))

function modifica(fn) {
  if (stato.inCorso || !prog.value) return null
  const r = fn(prog.value)
  resetRisultato()
  salvaPresto()
  return r
}

function seleziona(id) { sel.value = id; aperta_.value = null }
function apri(a) { aperta_.value = a; if (a) sel.value = null }
function imposta({ id, campo, valore }) {
  if (campo === 'colore') ultimoColore.value = valore
  modifica(p => mod.imposta(p, id, campo, valore))
}

function aggiungi(posto) {
  dove.value = { progetto: tab.value, ...posto }
  foglio.value = 'cassetta'
  aperta_.value = null
}

function sceltoBlocco({ blocco, progetto, verso, dove: posto, lato }) {
  const p = prog.value
  if (blocco === 'assegna' && !(p.lavagnette || []).length) {
    attesaLavagnetta.value = { inserisci: dove.value }
    foglio.value = 'lavagnetta'
    return
  }
  const pr = progetto ? (p.progetti || []).find(q => q.id === progetto) : null
  const colori = liv.value.colori
  const colore = colori.length === 1 ? colori[0] : (ultimoColore.value || colori[0])
  const riga = mod.rigaNuova(blocco, { colore, verso, dove: posto, lato, lavagnette: p.lavagnette, progetto: pr })
  const id = modifica(q => mod.inserisci(q, dove.value, riga))
  foglio.value = null
  apriLaPrimaScelta(id, riga)
}

/* una riga appena nata con qualcosa da scegliere (la N, la domanda)
   apre subito quella scelta: è la cosa che il bambino deve fare dopo */
function apriLaPrimaScelta(id, riga) {
  const s = mod.primaDaScegliere(riga, prog.value)
  if (s) { aperta_.value = { id, campo: s.campo, tipo: s.tipo }; sel.value = null }
  else { sel.value = id; aperta_.value = null }
}

function azione({ tipo, id }) {
  modifica(p => {
    if (tipo === 'su') mod.sposta(p, id, -1)
    else if (tipo === 'giu') mod.sposta(p, id, +1)
    else if (tipo === 'duplica') sel.value = mod.duplica(p, id)
    else if (tipo === 'togli') { mod.togli(p, id); sel.value = null }
    else if (tipo === 'altrimenti') {
      const t = mod.trova(p, id)
      if (t) t.nodo.altrimenti = t.nodo.altrimenti ? null : []
    }
  })
}

function nuovaLavagnetta(idRiga = null) {
  attesaLavagnetta.value = idRiga ? { riga: idRiga } : null
  foglio.value = 'lavagnetta'
  aperta_.value = null
}
function creaLavagnetta(nome) {
  const attesa = attesaLavagnetta.value
  modifica(p => {
    mod.nuovaLavagnetta(p, nome)
    if (attesa && attesa.riga) mod.imposta(p, attesa.riga, 'nome', nome)
    if (attesa && attesa.inserisci) {
      const riga = mod.rigaNuova('assegna', { lavagnette: [nome] })
      apriLaPrimaScelta(mod.inserisci(p, attesa.inserisci, riga), riga)
    }
  })
  attesaLavagnetta.value = null
  foglio.value = null
}
const nomiPresi = computed(() => (prog.value
  ? [...(prog.value.lavagnette || []), ...nomiOrdine.value,
     ...(prog.value.progetti || []).flatMap(p => p.misure || [])]
  : []))

function apriProgetto(id) {
  progettoInModifica.value = id
  foglio.value = 'progetto'
  aperta_.value = null
}
function salvaProgetto({ nome, icona, misure }) {
  const id = progettoInModifica.value
  modifica(p => {
    if (id) mod.aggiornaProgetto(p, id, { nome, icona, misure })
    else tab.value = mod.nuovoProgetto(p, { nome, icona, misure: misure.map(m => ({ nome: m.nome, tipo: m.tipo })) })
  })
  foglio.value = null
}
function eliminaProgetto() {
  const id = progettoInModifica.value
  modifica(p => mod.togliProgetto(p, id))
  tab.value = null
  foglio.value = null
}

function ricomincia() {
  if (!ricominciaArmato.value) {
    ricominciaArmato.value = true
    clearTimeout(ricominciaTimer)
    ricominciaTimer = setTimeout(() => { ricominciaArmato.value = false }, 3000)
    return
  }
  ricominciaArmato.value = false
  if (stato.inCorso) return
  archivio.programmi[liv.value.chiave] = inizio(liv.value)
  tab.value = null
  sel.value = null
  resetRisultato()
  salvaPresto()
}

/* ═══════════ gli aiuti ═══════════ */
function svela() {
  const s = { ...copia(liv.value.soluzione), svelato: true }
  archivio.programmi[liv.value.chiave] = s
  tab.value = null
  sel.value = null
  foglio.value = null
  resetRisultato()
  salvaPresto()
}

/* ═══════════ la prova ═══════════ */
const stato = reactive({ inCorso: false, ordine: 0, montaggio: false, riga: null, progetto: null,
                         guasto: null, pila: [], valori: {}, ordineValori: {}, giro: null, esiti: [], tic: 0 })
const velocita = ref(scelta(CHIAVE, 'velocita', 'normale'))
const quadro = shallowRef(null)
const ordineVisto = ref(0)
const messaggio = ref(null)            // { tipo: 'errore' | 'sbagliato', testo }
const finale = ref(null)
let regia = null
let mattoni = 0

function resetRisultato() {
  if (!liv.value) return
  stato.guasto = null
  stato.pila = []
  stato.giro = null
  stato.esiti = []
  messaggio.value = null
  quadro.value = quadroFermo(liv.value, ordineVisto.value)
}

function vedi(i) {
  if (stato.inCorso) return
  ordineVisto.value = i
  resetRisultato()
}

function cambiaVelocita(v) {
  velocita.value = v
  ricorda(CHIAVE, 'velocita', v)
  regia?.cambiaVelocita(v)
}

const suoni = {
  passo: () => { if (velocita.value !== 'veloce' && !stato.montaggio) suono.nota(700, 700, 0.03, 'triangle', 0.04) },
  posa: () => { if (!stato.montaggio) suono.nota(330, 260, 0.07, 'square', 0.06) },
  errore: () => suono.nota(300, 200, 0.25, 'triangle', 0.1),
  splash: () => suono.blub(),
  ok: () => suono.nota(660, 880, 0.12, 'triangle', 0.08),
  /* il porto: prendere è un colpetto più alto del posare, la gru un
     tonfo basso e morbido, il cliente servito un «ding» */
  prendi: () => { if (!stato.montaggio) suono.nota(420, 520, 0.06, 'square', 0.05) },
  cala: () => { if (!stato.montaggio) suono.nota(180, 140, 0.12, 'triangle', 0.06) },
  servito: () => suono.nota(880, 1320, 0.1, 'triangle', 0.07),
}

const tabDellaRiga = id => {
  const t = prog.value && id ? mod.trova(prog.value, id) : null
  return t ? t.progetto : null
}

function via() {
  if (!prog.value || stato.inCorso) return
  aperta_.value = null
  sel.value = null
  foglio.value = null
  const guai = mod.problemi(prog.value, lavagnetteOrdine.value)
  if (guai.length) {
    const g = guai[0]
    stato.guasto = g.id
    tab.value = tabDellaRiga(g.id)
    messaggio.value = { tipo: 'errore', testo: fraseDi(g) }
    /* se è una cosa da scegliere, la scelta si apre già: è lì che bisogna andare */
    if (g.campo) aperta_.value = { id: g.id, campo: g.campo, tipo: g.tipo }
    return
  }
  messaggio.value = null
  mattoni = 0
  regia = new Regia({
    livello: liv.value, programma: prog.value, stato, velocita: velocita.value,
    su: {
      quadro: (q, i) => { quadro.value = q; ordineVisto.value = i },
      suono: tipo => suoni[tipo]?.(),
      mattone: () => { mattoni++ },
      fine: esito => fine(esito),
    },
  })
  regia.avvia()
}

function stop() {
  regia?.ferma()
  regia = null
  if (mattoni) segna('coMattoni', mattoni)
  mattoni = 0
  resetRisultato()
}

const FRASI_OMINO = {
  muro: 'L\'omino non riesce a passare: c\'è un gradino troppo alto.',
  splash: 'Splash! L\'omino è finito in acqua.',
  caduta: 'Ahia! Un salto troppo alto per l\'omino.',
  fuori: 'L\'omino è uscito dal cantiere.',
  perso: 'L\'omino gira a vuoto e non arriva alla bandiera.',
}
const quanti = (n, uno, tanti) => `${n} ${n === 1 ? uno : tanti}`
function fraseConfronto(c) {
  const pezzi = []
  if (c.mancano.length) pezzi.push(`${c.mancano.length === 1 ? 'manca' : 'mancano'} ${quanti(c.mancano.length, 'mattone', 'mattoni')}`)
  if (c.troppi.length) pezzi.push(`${quanti(c.troppi.length, 'mattone è', 'mattoni sono')} di troppo`)
  if (c.sbagliati.length) pezzi.push(`${quanti(c.sbagliati.length, 'mattone è', 'mattoni sono')} del colore sbagliato`)
  return `Il disegno non torna: ${pezzi.join(', ')}.`
}

function fine(esito) {
  regia = null
  if (mattoni) segna('coMattoni', mattoni)
  mattoni = 0
  const l = liv.value
  if (l.libero) {
    messaggio.value = { tipo: 'fatto', testo: 'Fatto! Il cantiere libero non si vince: si costruisce. Cambia il programma e riprova.' }
    return
  }
  if (esito.vinto) return vittoria()
  const prefisso = l.ordini.length > 1 ? `Con «${l.ordini[esito.ordine].nome}»: ` : ''
  if (esito.errore) {
    tab.value = tabDellaRiga(esito.errore.id)
    messaggio.value = { tipo: 'errore', testo: prefisso + esito.errore.frase }
  } else if (esito.confronto) messaggio.value = { tipo: 'sbagliato', testo: prefisso + fraseConfronto(esito.confronto) }
  /* il porto: a sera, cosa non torna — con i numeri, non «riprova» */
  else if (esito.giornata) messaggio.value = { tipo: 'sbagliato', testo: prefisso + esito.giornata.frasi.join(' ') }
  else if (esito.omino) messaggio.value = { tipo: 'sbagliato', testo: prefisso + (FRASI_OMINO[esito.omino.esito] || 'L\'omino non arriva.') }
}

function vittoria() {
  const i = idx.value
  const l = liv.value
  const primaVolta = stelleDi(CHIAVE, i) === 0
  const stelle = prog.value.svelato ? 1 : 2
  /* le monete prima della tappa: `completa` scrive subito su disco, e
     così porta con sé anche loro — al contrario, chiudere l'app appena
     vinto poteva perderle */
  const monete = primaVolta ? l.premio : 0
  if (monete) addCoins(monete)
  completa(CHIAVE, i, QUANTE_TAPPE, { stelle })
  suono.livello()
  finale.value = { titolo: l.nome, stelle, monete, ordini: l.ordini.map(o => o.nome),
                   svelato: !!prog.value.svelato, ultimo: i === LIVELLI.length - 1 }
}

function avanti() {
  const i = idx.value + 1
  finale.value = null
  if (i < LIVELLI.length && aperta(CHIAVE, i)) apriLivello(i)
  else allaMappa()
}

function allaMappa() {
  stop()
  salvaOra()
  finale.value = null
  foglio.value = null
  idx.value = -1
  vista.value = 'mappa'
}

function indietro() {
  if (vista.value === 'cantiere') allaMappa()
  else { salvaOra(); emit('vai', 'home') }
}

/* la riga che sta girando resta a vista, anche in un programma lungo */
watch(() => stato.riga, id => {
  if (!id || velocita.value === 'veloce') return
  nextTick(() => document.querySelector(`[data-riga="${id}"]`)?.scrollIntoView({ block: 'nearest' }))
})
watch(() => stato.guasto, id => {
  if (id) nextTick(() => document.querySelector(`[data-riga="${id}"]`)?.scrollIntoView({ block: 'center' }))
})

/* mentre gira la scheda segue il robot dentro i progetti — tranne a
   tutta velocità e nel montaggio, dove cambierebbe troppo in fretta
   per dire qualcosa */
const tabMostrato = computed(() =>
  stato.inCorso && !stato.montaggio && velocita.value !== 'veloce' ? stato.progetto : tab.value)

onUnmounted(() => { regia?.ferma(); salvaOra(); clearTimeout(ricominciaTimer) })

const titolo = computed(() => (liv.value ? liv.value.nome : 'Il costruttore'))
const progettoAperto = computed(() =>
  progettoInModifica.value ? (prog.value.progetti || []).find(p => p.id === progettoInModifica.value) : null)
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" guida="costruttore" monete @indietro="indietro" />

    <div class="cst">
      <Mappa v-if="vista === 'mappa'" :capitoli="capitoli" :libero="{ ...LIBERO, aperto: liberoAperto }"
             @gioca="apriLivello" @libero="apriLivello(LIBERO_IDX)" />

      <div v-else-if="liv && prog" class="cst-cantiere">
        <div class="cst-sopra">
          <Ordine :livello="liv" :visto="ordineVisto" :esiti="stato.esiti" :in-corso="stato.inCorso" @vedi="vedi" />
          <div v-if="stato.montaggio && stato.inCorso" class="cst-montaggio" data-montaggio>
            e adesso con «{{ liv.ordini[stato.ordine].nome }}»…
          </div>
          <Campo :quadro="quadro" />
          <Comandi :in-corso="stato.inCorso" :velocita="velocita"
                   :ordine="liv.ordini[ordineVisto].lavagnette || {}"
                   :lavagnette="prog.lavagnette || []" :valori="stato.inCorso || stato.guasto ? stato.valori : {}"
                   :con-lavagnette="liv.cassetta.includes('assegna')" :aiuti="aiutiVisti"
                   :turno="liv.mondo === 'porto' && stato.inCorso ? (stato.turno || 0) : null"
                   @via="via" @stop="stop" @velocita="cambiaVelocita" @aiuto="foglio = 'aiuto'"
                   @nuova-lavagnetta="nuovaLavagnetta(null)" />
          <p v-if="messaggio" class="cst-messaggio" :class="'cst-' + messaggio.tipo" data-messaggio>{{ messaggio.testo }}</p>
        </div>
        <Editor :programma="prog" :livello="liv" :tab="tabMostrato" :sel="sel" :aperta="aperta_"
                :accesa="stato.inCorso ? stato.riga : null" :guasto="stato.guasto" :problemi="problemi"
                :giro="stato.inCorso ? stato.giro : null" :sola="stato.inCorso" :pila="stato.pila"
                @tab="t => { tab = t; sel = null; aperta_ = null }" @seleziona="seleziona" @apri="apri"
                @imposta="imposta" @aggiungi="aggiungi" @azione="azione"
                @nuova-lavagnetta="nuovaLavagnetta" @progetto="apriProgetto" @ricomincia="ricomincia"
                @codice="foglio = 'codice'" />
        <p v-if="ricominciaArmato" class="cst-messaggio cst-errore cst-fisso">Tocca ancora «ricomincia» per cancellare tutto il programma di questo livello.</p>
      </div>

      <Cassetta v-if="foglio === 'cassetta'" :cassetta="liv.cassetta" :posti="liv.posti || ['sotto']"
                :porto="liv.mondo === 'porto'"
                :progetti="prog.progetti || []"
                :lavagnette="prog.lavagnette || []" :dentro-progetto="dove && dove.progetto"
                :altri="altriProgetti"
                @scegli="sceltoBlocco" @nuovo-progetto="apriProgetto(null)" @importa="importa" @chiudi="foglio = null" />
      <FoglioProgetto v-if="foglio === 'progetto'" :progetto="progettoAperto" :con-misure="!!liv.misure"
                      :con-colori="!!liv.misure && liv.colori.length > 1"
                      :nomi-presi="(prog.progetti || []).map(p => p.nome)"
                      @salva="salvaProgetto" @elimina="eliminaProgetto" @chiudi="foglio = null" />
      <FoglioLavagnetta v-if="foglio === 'lavagnetta'" :prese="nomiPresi"
                        @crea="creaLavagnetta" @chiudi="foglio = null; attesaLavagnetta = null" />
      <FoglioAiuto v-if="foglio === 'aiuto'" :aiuti="liv.aiuti" :visti="aiutiVisti" :svelato="!!prog.svelato"
                   @altro="aiutiVisti++" @svela="svela" @chiudi="foglio = null" />
      <FoglioCodice v-if="foglio === 'codice'" :programma="prog" :ordine="liv.ordini[ordineVisto].lavagnette || {}"
                    @chiudi="foglio = null" />
      <Finale v-if="finale" v-bind="finale" @avanti="avanti" @mappa="allaMappa" @resta="finale = null" />
    </div>
  </div>
</template>
