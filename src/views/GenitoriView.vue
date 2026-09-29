<script setup>
/* Schermata dei genitori, dietro il PIN (vedi docs/genitori/). */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { state, esportaTutto, resetPlayer, nomeCorrente,
         rinominaGiocatore, eliminaGiocatore, cestinaOra, ripristinaCestinato,
         spostaLEta,
         etaDelBambino,
         tuttoAperto, accendiTuttoAperto,
         sperimentaliAccesi, accendiSperimentali,
         ritocca, accendiSapere, saperiSpenti, fissaGioco, fissaSapere,
         rimettiAiDifetti,
         aspettoDi, scegliAspetto } from '../store/profile.js'
import { azzeraCampagna, haGiocato } from '../giochi/campagne.js'
import { leggiCestino } from '../store/cestino.js'
import { laPosta, segnaLetta, avvisa } from '../store/posta.js'
import { inGrassetto } from '../guide/aiuto.js'
import SceltaAspetto from '../components/SceltaAspetto.vue'
import { leggiPin, scriviPin, azzeraPin, PIN_INIZIALE, DOMANDA, rispostaGiusta,
         segnaSbaglio, azzeraSbagli, attesa } from '../store/pin.js'
import { leggi as leggiIncidenti, dimentica as scordaIncidenti, ripara } from '../incidenti.js'
import { giudiziAccesi, accendiGiudizi, leggi as leggiGiudizi,
         dimentica as svuotaGiudizi, riga as rigaGiudizio,
         pacco as paccoGiudizi, verdettoDi } from '../store/giudizi.js'
import { GIOCHI } from '../data/giochi.js'
import { INDIRIZZO, condividi, piattaforma, installata,
         CHI, CODICE, SEGNALA } from '../guide/aiuto.js'
import Barra from '../components/Barra.vue'
import ManopolaEta from '../components/eta/Manopola.vue'
import { anniInLettere } from '../components/eta/lettere.js'
import Benvenuto from '../components/Benvenuto.vue'
import Prova from '../quiz/Prova.vue'
import ComeVa from '../quiz/ComeVa.vue'
import MoneteGiocoPerGioco from '../components/varieta/Tetti.vue'
import ArchivioGenitori from '../components/genitori/Archivio.vue'

const emit = defineEmits(['vai'])

/* state.player è un id, non un nome: il nome si legge dal roster. */
const chi = computed(() => nomeCorrente() || 'questo giocatore')

const chiGioca = computed(() => {
  const nomi = state.giocatori.map(g => g.nome).filter(Boolean)
  if (nomi.length <= 1) return nomi[0] || 'tutti i progressi'
  return nomi.slice(0, -1).join(', ') + ' e ' + nomi[nomi.length - 1]
})

const pin = ref(PIN_INIZIALE)    // quello vero arriva dall'archivio, sotto
const cifre = ref('')
const dentro = ref(false)
const sbagliato = ref(false)
const esito = ref(null)          // { ok: bool, testo: string }
const confermaAzzera = ref(false)
const confermaFattoria = ref(false)

async function azzeraFattoria() {
  await cestinaOra('fattoria')
  azzeraCampagna('fattoria')
  confermaFattoria.value = false
  esito.value = { ok: true, testo: 'La fattoria di ' + chi.value + ' riparte da zero.' }
  cestino.value = await leggiCestino()
}

// il cestino: vedi docs/genitori/cestino-e-posta.md
const cestino = ref([])
const rimettendo = ref(null)     // la voce in attesa di conferma

// la posta: vedi docs/genitori/cestino-e-posta.md
const posta = ref({ note: [], avvisi: [] })
const cePosta = computed(() => posta.value.note.length + posta.value.avvisi.length > 0)

async function hoLetto() {
  await segnaLetta()
  posta.value = await laPosta()
}
// 'nuovo' mentre si sceglie il codice, 'ripeti' mentre lo si conferma
const modo = ref('')
const nuovo = ref('')
const recupero = ref(false)   // il codice dimenticato: vedi docs/genitori/codice.md

const scheda = ref('bambini')

const incidenti = ref([])   // letti una volta all'entrata, da src/incidenti.js
const giudizi = ref([])     // vedi docs/genitori/come-va.md

onMounted(async () => {
  // uscire e rientrare non azzera l'attesa dopo uno sbaglio: riprende da dove stava
  guardaLOrologio()
  if (conto.value.resta) {
    haSbagliato.value = true
    if (!battito) battito = setInterval(guardaLOrologio, 100)
  }
  pin.value = await leggiPin()
  incidenti.value = await leggiIncidenti()
  giudizi.value = await leggiGiudizi()
  cestino.value = await leggiCestino()
  posta.value = await laPosta()
})

function quando (iso) {
  const d = new Date(iso)
  if (isNaN(d)) return '?'
  const ore = d.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' })
  const oggi = new Date().toDateString() === d.toDateString()
  return oggi ? ore : d.toLocaleDateString('it', { day: 'numeric', month: 'short' }) + ' ' + ore
}

async function copiaGuasti () {
  const testo = incidenti.value.map(g =>
    `${g.quando} · ${g.dove} · ${g.versione}\n${g.testo}\n${g.pila || ''}`).join('\n\n')
  try {
    await navigator.clipboard.writeText(testo)
    esito.value = { ok: true, testo: 'Copiato negli appunti.' }
  } catch (e) {
    esito.value = { ok: false, testo: 'Non si riesce a copiare: si legge da qui.' }
  }
}

async function scordaGuasti () {
  await scordaIncidenti()
  incidenti.value = []
  esito.value = { ok: true, testo: 'Cancellati.' }
}

const riparaApp = () => ripara()

// modulo Tally con `versione` e `guasto` precompilati; la pila non ci sta
// (limite di lunghezza dell'indirizzo), per quella c'è «Copia». Trappole
// di Tally coi parametri nell'indirizzo: docs/genitori/come-va.md
const linkSegnala = computed(() => {
  const q = new URLSearchParams({ versione: __VERSIONE__.id })
  const ultimo = incidenti.value[incidenti.value.length - 1]
  if (ultimo) q.set('guasto', `${ultimo.dove} · ${ultimo.testo}`.slice(0, 300))
  return `${SEGNALA}?${q}`
})

// giudiziAccesi è del telefono e non di settings: cambiando bambino non si spegne
function cambiaGiudizi() {
  accendiGiudizi(!giudiziAccesi.value)
  esito.value = { ok: true, testo: giudiziAccesi.value
    ? 'Acceso: sopra ogni domanda compaiono 😴 😰 🐛.'
    : 'Spento: le domande tornano come prima.' }
}

const righeGiudizi = computed(() =>
  giudizi.value.slice().reverse().map(g => ({
    ico: verdettoDi(g.verdetto)?.ico || '·',
    testo: rigaGiudizio(g),
  })))

// modulo Tally separato da quello dei guasti: campi nascosti `giudizi` e `versione`
const SEGNALA_GIUDIZI = 'https://tally.so/r/lb28zp'

const paccoDaMandare = computed(() => paccoGiudizi(giudizi.value))
const linkGiudizi = computed(() => {
  const q = new URLSearchParams({
    versione: __VERSIONE__.id,
    giudizi: paccoDaMandare.value.testo,
  })
  return `${SEGNALA_GIUDIZI}?${q}`
})

async function copiaGiudizi() {
  try {
    await navigator.clipboard.writeText(paccoDaMandare.value.testo)
    esito.value = { ok: true, testo: 'Copiati negli appunti.' }
  } catch (e) {
    esito.value = { ok: false, testo: 'Non si riesce a copiare: si legge da qui.' }
  }
}

// cancellare è a mano: da qui non si sa se il modulo è stato davvero inviato
async function scordaGiudizi () {
  await svuotaGiudizi()
  giudizi.value = []
  esito.value = { ok: true, testo: 'Cancellati.' }
}

const pallini = computed(() => [0, 1, 2, 3].map(i => i < cifre.value.length))
const titoloCambio = computed(() => modo.value === 'ripeti' ? 'Ripeti il codice nuovo' : 'Il codice nuovo')

function premi(n) {
  if (fermo.value) return          // durante l'attesa il tastierino non risponde
  if (cifre.value.length >= 4) return
  sbagliato.value = false
  cifre.value += n
  if (cifre.value.length < 4) return
  if (recupero.value) return quattroDelRecupero()
  if (modo.value) return quattroDelCambio()
  if (cifre.value === pin.value) { dentro.value = true; cifre.value = ''; azzeraSbagli() }
  else { cifre.value = ''; fermati() }
}

// la durata la tiene store/pin.js; qui solo il battito che riempie la barretta
const conto = ref({ resta: 0, quanto: 0 })
const haSbagliato = ref(false)
let battito = null
const fermo = computed(() => conto.value.resta > 0)
const mancano = computed(() => Math.ceil(conto.value.resta / 1000))
const riempita = computed(() => conto.value.quanto
  ? Math.min(100, 100 - conto.value.resta / conto.value.quanto * 100) : 0)

function guardaLOrologio() {
  conto.value = attesa()
  if (conto.value.resta) return
  clearInterval(battito); battito = null
}

function fermati() {
  haSbagliato.value = true
  segnaSbaglio()
  guardaLOrologio()
  if (!battito) battito = setInterval(guardaLOrologio, 100)
}

onUnmounted(() => clearInterval(battito))

function cancella() { cifre.value = cifre.value.slice(0, -1); sbagliato.value = false }

// il codice dimenticato: vedi docs/genitori/codice.md
function apriRecupero() { recupero.value = true; cifre.value = ''; sbagliato.value = false }
function lasciaIlRecupero() { recupero.value = false; cifre.value = ''; sbagliato.value = false }

async function quattroDelRecupero() {
  if (!rispostaGiusta(cifre.value)) { cifre.value = ''; fermati(); return }
  cifre.value = ''
  recupero.value = false
  pin.value = await azzeraPin()
  azzeraSbagli()
  // traccia in posta: è l'unico modo di sapere che è stato aperto senza il codice
  await avvisa('Il codice era stato dimenticato ed è stato rimesso a ' + PIN_INIZIALE
    + '. Se non sei stato tu, l\'ha fatto qualcuno che ha risposto alla domanda.')
  // si rilegge: il montaggio (che ricarica la posta) è già passato
  posta.value = await laPosta()
  dentro.value = true
  cambiaCodice()
  esito.value = { ok: true,
    testo: 'Il codice è tornato a ' + PIN_INIZIALE + '. Scegline uno nuovo adesso.' }
}

/* ---------- cambiare il codice ---------- */
function cambiaCodice() { modo.value = 'nuovo'; nuovo.value = ''; cifre.value = ''; esito.value = null }
function lasciaStare() { modo.value = ''; nuovo.value = ''; cifre.value = ''; sbagliato.value = false }

async function quattroDelCambio() {
  if (modo.value === 'nuovo') { nuovo.value = cifre.value; cifre.value = ''; modo.value = 'ripeti'; return }
  // 'ripeti': due volte uguali o si ricomincia, senza dire quale delle due era
  if (cifre.value !== nuovo.value) {
    cifre.value = ''; nuovo.value = ''; modo.value = 'nuovo'; sbagliato.value = true
    esito.value = { ok: false, testo: 'Le due volte non erano uguali. Riprova.' }
    return
  }
  try {
    pin.value = await scriviPin(nuovo.value)
    esito.value = { ok: true, testo: 'Codice cambiato. Da adesso si entra con quello nuovo.' }
  } catch (e) {
    esito.value = { ok: false, testo: e.message }
  }
  lasciaStare()
}

/* ---------- salvataggio ---------- */
async function esporta() {
  esito.value = null
  try {
    const dati = await esportaTutto()
    const oggi = new Date().toISOString().slice(0, 10)
    scarica(`giochi-progressi-${oggi}.json`, JSON.stringify(dati, null, 2))
    esito.value = { ok: true, testo: 'Salvataggio scaricato. Tienilo da parte: se il telefono si rompe, è tutto lì dentro.' }
  } catch (e) {
    esito.value = { ok: false, testo: 'Non sono riuscito a salvare: ' + e.message }
  }
}

function scarica(nome, testo) {
  const url = URL.createObjectURL(new Blob([testo], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  // il browser deve fare in tempo a leggere il blob prima che sparisca
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// si condivide l'indirizzo secco, senza messaggio: vedi docs/genitori/guide.md
async function passaIlGioco () {
  esito.value = null
  const r = await condividi({ url: INDIRIZZO, titolo: 'Educagioco' })
  if (r.come === 'copiato') esito.value = { ok: true, testo: 'Indirizzo copiato: incollalo dove vuoi.' }
  else if (r.come === 'niente') esito.value = { ok: false, testo: INDIRIZZO }
}

// la carta compare solo dove la condivisione di file esiste davvero
const puoMandareFile = (() => {
  try { return !!navigator.canShare?.({ files: [new File(['{}'], 'p.json', { type: 'application/json' })] }) }
  catch { return false }
})()

async function mandaSalvataggio () {
  esito.value = null
  try {
    const dati = await esportaTutto()
    const oggi = new Date().toISOString().slice(0, 10)
    const f = new File([JSON.stringify(dati, null, 2)], `giochi-progressi-${oggi}.json`,
                       { type: 'application/json' })
    const r = await condividi({ file: f, titolo: 'Progressi Educagioco' })
    if (r.come === 'niente') esporta()      // niente foglio: resta il download di sempre
    else if (r.come === 'condiviso') esito.value = { ok: true,
      testo: 'Mandato. Dentro ci sono i nomi dei bambini e cosa hanno giocato: tienilo dove terresti le foto.' }
  } catch (e) {
    esito.value = { ok: false, testo: 'Non sono riuscito a mandarlo: ' + e.message }
  }
}

const daInstallare = !installata() && piattaforma() !== 'computer'

// aggiungere, rinominare, eliminare: dietro il PIN. Eliminare passa dal
// cestino (store/cestino.js), quindi non è mai davvero senza ritorno.
// `rinominando`/`eliminando`/`aggiungendo` sono mai due aperti insieme.
const rinominando = ref('')
const eliminando = ref('')
// il modulo del bambino nuovo è components/Benvenuto.vue, a tutto schermo
const aggiungendo = ref(false)
const nomeInCorso = ref('')

function chiudiTutto() {
  rinominando.value = ''; eliminando.value = ''; nomeInCorso.value = ''
}

// la manopola dell'età: vedi docs/genitori/manopola.md
const giroEta = ref(0)
const anniOra = computed(() => (giroEta.value, etaDelBambino()))
const settaggi = computed(() => (giroEta.value, state.profile.settings || {}))

// `scegli` arriva una sola volta, quando si preme «Applica» nel cartello
function applicaAnni(anni) {
  const mossa = spostaLEta(anni)
  giroEta.value++
  if (!mossa) return
  esito.value = { ok: true, testo: `${chi.value} è tarato su ${inLettere(anni)}. `
    + (mossa.riscrive
      ? 'Giochi e domande sono ripartiti dai valori di quell\'età.'
      : 'Le domande si spostano di conseguenza; i giochi restano come li avevi messi.') }
}

const inLettere = anniInLettere

// la ✎ del quadro: vedi docs/genitori/ritocchi.md
function ritoccaDalQuadro({ chiave, ritocco = 0, spenta = false }) {
  if (!chiave) return
  if (spenta) accendiSapere(chiave, false)
  else if (saperiSpenti().includes(chiave)) accendiSapere(chiave, true)
  // il ritocco si scrive in tutti e due i casi: senza, «rimettila com'era»
  // su un pezzo che l'età ha spento lascerebbe il vecchio ritocco ad ambrarla
  ritocca(chiave, ritocco)
  giroEta.value++
}

// la ✎ di un gioco: sceglie chi decide se sta in casa, non sposta l'età
function fissaDalQuadro({ chiave, come }) {
  if (!chiave) return
  fissaGioco(chiave, come)
  giroEta.value++
}

// la ✎ di un pezzo di scuola appeso a un gioco (es. le divisioni del castello)
function fissaSapereDalQuadro({ chiave, come }) {
  if (!chiave) return
  fissaSapere(chiave, come)
  giroEta.value++
}

function rimettiTutto() {
  const mossa = rimettiAiDifetti()
  giroEta.value++
  if (!mossa) return
  esito.value = { ok: true, testo: `Rimesso tutto com'è di partenza a `
    + `${inLettere(anniOra.value)}. I progressi non si sono toccati.` }
}

function apriRinomina(g) { chiudiTutto(); rinominando.value = g.id; nomeInCorso.value = g.nome }
function apriElimina(g) { chiudiTutto(); eliminando.value = g.id }

// il bambino nuovo apre il wizard del primo avvio e finisce entrando in
// partita con lui; il codice non si richiede due volte
function apriAggiungi() { chiudiTutto(); aggiungendo.value = true }
function fattoIlBambino() {
  aggiungendo.value = false
  // state.player è cambiato: App.vue rimonterebbe con un tastierino davanti
  emit('vai', 'home')
}

async function salvaNome() {
  const nome = nomeInCorso.value.trim()
  if (!nome) return
  try {
    const prima = nomeCorrente()
    await rinominaGiocatore(rinominando.value, nome)
    esito.value = { ok: true, testo: `Adesso si chiama ${nome}. I progressi di ${prima === nome ? 'prima' : prima} sono rimasti tutti dov'erano.` }
    chiudiTutto()
  } catch (e) {
    esito.value = { ok: false, testo: e.message }
  }
}

// eliminaGiocatore sposta state.player su un altro (o su nessuno): il
// watch di App.vue porta in home da solo, per ogni cambio di bambino
async function eliminaOra(g) {
  try {
    await eliminaGiocatore(g.id)
  } catch (e) {
    esito.value = { ok: false, testo: e.message }
  }
  chiudiTutto()
}

// la domanda vera generata dal modulo che la darebbe al bambino; provare
// non cambia niente (vedi docs/genitori/quadro.md)
const prova = ref(null)          // { chiave, nome, eta } | { sorgente|giro|eta, nome } | null


const aperto = computed(() => tuttoAperto())
function cambiaAperto() {
  accendiTuttoAperto(!aperto.value)
  esito.value = { ok: true, testo: aperto.value
    ? 'Segnato: tutte le tappe aperte. Ancora nessun gioco lo legge, quindi per ora non cambia niente.'
    : 'Tornato al normale: le tappe si aprono una per volta.' }
}

// solo per chi gioca adesso: il profilo degli altri non è in memoria
const aspettoAttuale = computed(() => aspettoDi())
function cambiaAspetto(nome) {
  if (nome === aspettoAttuale.value) return
  scegliAspetto(nome)
}

const inProva = computed(() => sperimentaliAccesi())
const sperimentali = computed(() =>
  inProva.value ? GIOCHI.filter(g => g.sperimentale) : [])
function cambiaProva() {
  accendiSperimentali(!inProva.value)
  esito.value = { ok: true, testo: inProva.value
    ? `I giochi in prova compaiono nella home di ${chi.value}. Sono a metà: aspettati che cambino.`
    : `I giochi in prova spariscono dalla home di ${chi.value}.` }
}
async function azzera() {
  await resetPlayer()
  confermaAzzera.value = false
  confermaFattoria.value = false
  esito.value = { ok: true, testo: 'I progressi di ' + chi.value
    + ' sono stati cancellati. Se non era quello che volevi, qui sotto c\'è ancora la copia.' }
  cestino.value = await leggiCestino()
}

async function rimetti(v) {
  try {
    const nome = await ripristinaCestinato(v.quando)
    esito.value = { ok: true, testo: 'I progressi di ' + nome + ' sono tornati come erano '
      + quando(v.quando) + '.' }
  } catch (e) {
    esito.value = { ok: false, testo: e.message }
  }
  rimettendo.value = null
  cestino.value = await leggiCestino()
}
</script>

<template>
  <!-- il bambino nuovo: la stessa schermata del primo avvio, a tutto schermo -->
  <Benvenuto v-if="aggiungendo" :primo="false"
             @fatto="fattoIlBambino" @lasciaStare="aggiungendo = false" />

  <div v-else class="schermo">
    <Barra titolo="Impostazioni" :audio="false" @indietro="$emit('vai','home')" />

    <!-- il codice dimenticato: stesso tastierino, stessa attesa dopo uno
         sbaglio; vedi docs/genitori/codice.md -->
    <div v-if="!dentro && recupero" class="centro">
      <h2>Il codice dimenticato</h2>
      <p class="testo">Rispondi e il codice torna a <b>{{ PIN_INIZIALE }}</b>, così puoi
        sceglierne uno nuovo. I progressi non si toccano.</p>
      <p class="domanda">{{ DOMANDA.testo }}</p>

      <div class="pallini">
        <span v-for="(pieno, i) in pallini" :key="i" :class="{ pieno }"></span>
      </div>
      <div v-if="haSbagliato" class="fermo">
        <span class="barretta" :class="{ muta: !fermo }"><i :style="{ width: riempita + '%' }"></i></span>
        <small :class="{ muta: !fermo }">fra {{ mancano }} second{{ mancano === 1 ? 'o' : 'i' }} si riprova</small>
      </div>

      <div class="tastierino" :class="{ spento: fermo }">
        <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" class="tasto"
                :disabled="fermo" @click="premi(String(n))">{{ n }}</button>
        <span></span>
        <button class="tasto" :disabled="fermo" @click="premi('0')">0</button>
        <button class="tasto canc" :disabled="fermo" @click="cancella">⌫</button>
      </div>
      <button class="link" data-azione="lascia-recupero" @click="lasciaIlRecupero">lascia stare</button>
    </div>

    <div v-else-if="!dentro" class="centro">
      <h2>Impostazioni</h2>
      <p class="testo">Quali giochi si vedono, chi gioca, il salvataggio dei progressi.
        <b>Le cambia un grande</b>, col codice di casa.</p>

      <div class="pallini">
        <span v-for="(pieno, i) in pallini" :key="i" :class="{ pieno }"></span>
      </div>
      <!-- resta anche a tempo scaduto, spento: sparendo il tastierino
           salterebbe proprio quando torna a rispondere -->
      <div v-if="haSbagliato" class="fermo">
        <span class="barretta" :class="{ muta: !fermo }"><i :style="{ width: riempita + '%' }"></i></span>
        <small :class="{ muta: !fermo }">fra {{ mancano }} second{{ mancano === 1 ? 'o' : 'i' }} si riprova</small>
      </div>

      <div class="tastierino" :class="{ spento: fermo }">
        <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" class="tasto"
                :disabled="fermo" @click="premi(String(n))">{{ n }}</button>
        <span></span>
        <button class="tasto" :disabled="fermo" @click="premi('0')">0</button>
        <button class="tasto canc" :disabled="fermo" @click="cancella">⌫</button>
      </div>

      <button class="bottone chiaro esci" data-azione="torna-ai-giochi"
              @click="$emit('vai','home')">← Torna ai giochi</button>

      <button class="link" data-azione="codice-dimenticato" @click="apriRecupero">
        Non ricordi il codice?</button>
    </div>

    <!-- il codice nuovo: stesso tastierino, due giri -->
    <div v-else-if="modo" class="centro">
      <h2>{{ titoloCambio }}</h2>
      <p class="testo">Quattro cifre. Te lo chiedo due volte, così un dito
        storto non ti chiude fuori.</p>

      <div class="pallini">
        <span v-for="(pieno, i) in pallini" :key="i" :class="{ pieno }"></span>
      </div>
      <p v-if="esito && !esito.ok" class="avviso">{{ esito.testo }}</p>

      <div class="tastierino">
        <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" class="tasto" @click="premi(String(n))">{{ n }}</button>
        <span></span>
        <button class="tasto" @click="premi('0')">0</button>
        <button class="tasto canc" @click="cancella">⌫</button>
      </div>
      <button class="link" @click="lasciaStare">lascia stare</button>
    </div>

    <!-- ── dentro ── -->
    <div v-else class="centro">
      <h2>Impostazioni di {{ chi }}</h2>

      <!-- la posta dei grandi: vedi docs/genitori/cestino-e-posta.md -->
      <div v-if="cePosta" class="posta" data-posta>
        <h2>C'è una cosa da dirti</h2>

        <div v-for="a in posta.avvisi" :key="a.quando" class="nota avviso">
          <b>Su questo telefono</b>
          <p>{{ a.testo }}</p>
          <small>{{ quando(a.quando) }}</small>
          <button v-if="a.azione" class="bottone chiaro" data-azione="posta-vai"
                  @click="scheda = a.azione.scheda">{{ a.azione.testo }}</button>
        </div>

        <div v-for="n in posta.note" :key="n.id" class="nota">
          <b>{{ n.titolo }}</b>
          <p v-html="inGrassetto(n.testo)"></p>
          <small>{{ n.quando }}</small>
          <button v-if="n.azione" class="bottone chiaro" data-azione="posta-vai"
                  @click="scheda = n.azione.scheda">{{ n.azione.testo }}</button>
        </div>

        <!-- niente ✕: solo «Ho letto», che vuole il codice -->
        <button class="bottone" data-azione="ho-letto" @click="hoLetto">Ho letto</button>
      </div>

      <!-- tre schede, e si tara in una sola: vedi docs/genitori/come-va.md -->
      <div class="schede">
        <button :class="{ ora: scheda === 'bambini' }" data-scheda="bambini"
                @click="scheda = 'bambini'">Bambini</button>
        <button :class="{ ora: scheda === 'giochi' }" data-scheda="giochi"
                @click="scheda = 'giochi'">Giochi e domande</button>
        <button :class="{ ora: scheda === 'comeva' }" data-scheda="comeva"
                @click="scheda = 'comeva'">Come va</button>
      </div>

      <!-- ══════════ scheda: i bambini ══════════ -->
      <template v-if="scheda === 'bambini'">
      <h2>Chi gioca</h2>
      <!-- parla solo di chi sta giocando adesso; gli altri sono nomi, e si passa da lì dalla home -->
      <p class="mini">Queste impostazioni sono di <b>{{ chi }}</b>, che sta giocando adesso.
        Ogni bambino ha le sue e i suoi progressi.</p>

      <div class="carte">
        <template v-for="g in state.giocatori.filter(x => x.id === state.player)" :key="g.id">
          <!-- in rinomina il campo prende il posto della carta -->
          <div v-if="rinominando === g.id" class="carta aperta" :data-giocatore="g.id">
            <b>Come si chiama?</b>
            <form class="riga campo" @submit.prevent="salvaNome">
              <input v-model="nomeInCorso" class="nome" type="text" maxlength="20"
                     autocomplete="off" spellcheck="false" aria-label="il nome">
              <button class="bottone chiaro" type="button" @click="chiudiTutto">Lascia stare</button>
              <button class="bottone" type="submit" :disabled="!nomeInCorso.trim()">Salva</button>
            </form>
            <i>Cambia solo il nome scritto: monete, animali e traguardi restano suoi.</i>
          </div>

          <div v-else-if="eliminando === g.id" class="carta pericolo aperta" :data-giocatore="g.id">
            <b>Eliminare {{ g.nome }}?</b>
            <i>Spariscono anche tutti i suoi progressi, e non si torna indietro.
               Se non l'hai ancora fatto, salva prima su file.</i>
            <div class="riga">
              <button class="bottone chiaro" @click="chiudiTutto">No, lascia stare</button>
              <button class="bottone rosso" @click="eliminaOra(g)">Sì, elimina</button>
            </div>
          </div>

          <div v-else class="carta chi-gioca" :data-giocatore="g.id">
            <span class="ico">🎮</span>
            <b>{{ g.nome }}</b>
            <i>sta giocando adesso</i>

            <div class="aspetto-sezione">
              <!-- qui l'età è solo una riga col rimando: la manopola sta nell'altra scheda -->
              <button class="riga-eta" data-azione="vai-alla-tara"
                      @click="scheda = 'giochi'">
                <span><b>{{ chi }} ha {{ inLettere(anniOra) }}</b>
                  <i>decide i giochi in casa e la difficoltà delle domande</i></span>
                <em>modifica ›</em>
              </button>

              <p class="mini">Con che faccia si vede in mappa</p>
              <SceltaAspetto :scelto="aspettoAttuale" data-scelta="aspetto"
                             @scegli="cambiaAspetto" />

              <div class="riga">
                <button class="bottone chiaro" data-azione="rinomina"
                        @click="apriRinomina(g)">Cambia nome</button>
                <button class="bottone chiaro" data-azione="elimina"
                        @click="apriElimina(g)">Elimina</button>
              </div>
            </div>
          </div>
        </template>

        <div v-if="state.giocatori.length > 1" class="carta altri" data-altri-giocatori>
          <span class="ico">🙂</span>
          <b>Giocano anche {{ state.giocatori.filter(g => g.id !== state.player)
                                  .map(g => g.nome).join(', ') }}</b>
          <i>Per cambiare le loro, passa a loro dalla home — è lo stesso posto
             dove si sceglie chi gioca.</i>
        </div>

        <button class="carta" data-azione="aggiungi-giocatore" @click="apriAggiungi">
          <span class="ico">➕</span>
          <b>Aggiungi un bambino</b>
          <i>Nome, faccia ed età: poi tocca a lui giocare</i>
        </button>
      </div>


      <h2>Progressi</h2>
      <p class="mini">Monete, animali, campagne e traguardi: si salvano su un file, si
        rimettono da un file, o si cancellano per ricominciare da zero.</p>

      <div class="carte">
        <button class="carta" @click="esporta">
          <span class="ico">💾</span>
          <b>Salva su file</b>
          <i>Scarica tutto: {{ chiGioca }}</i>
        </button>

        <!-- Solo dove il foglio di condivisione esiste (i telefoni): sul
             computer «scarica» è già la cosa giusta, e una carta in più
             sarebbe solo un'altra decisione da prendere. -->
        <button v-if="puoMandareFile" class="carta" data-azione="manda-salvataggio"
                @click="mandaSalvataggio">
          <span class="ico">📤</span>
          <b>Mandalo dove vuoi</b>
          <i>A te stesso in chat, nel cloud, sull'altro telefono</i>
        </button>

        <ArchivioGenitori @esito="v => esito = v" />

        <button v-if="!confermaAzzera" class="carta pericolo" @click="confermaAzzera = true">
          <span class="ico">🗑️</span>
          <b>Cancella i progressi di {{ chi }}</b>
          <i>Riparte da zero. Una copia resta qui sotto per un po'</i>
        </button>
        <div v-else class="carta pericolo aperta">
          <b>Cancellare i progressi di {{ chi }}?</b>
          <i>Monete, animali, traguardi: riparte tutto da zero. Ne resta una
             copia qui sotto, ma per essere tranquillo salva su file.</i>
          <div class="riga">
            <button class="bottone chiaro" @click="confermaAzzera = false">No, lascia stare</button>
            <button class="bottone rosso" @click="azzera">Sì, cancella</button>
          </div>
        </div>

        <!-- ricomincia solo la fattoria, non tutto: compare solo se l'ha aperta -->
        <template v-if="haGiocato('fattoria')">
          <button v-if="!confermaFattoria" class="carta pericolo"
                  data-azione="azzera-fattoria" @click="confermaFattoria = true">
            <span class="ico">🚜</span>
            <b>Ricomincia la fattoria di {{ chi }}</b>
            <i>Solo la fattoria: il resto dei progressi non si tocca</i>
          </button>
          <div v-else class="carta pericolo aperta">
            <b>Ricominciare la fattoria di {{ chi }}?</b>
            <i>Terra, cose comprate e animali spariscono, e il prato torna
               vuoto. <b>Le monete spese non tornano indietro.</b> Tutto il
               resto — gli altri giochi, i traguardi, il salvadanaio — resta
               com'è.</i>
            <div class="riga">
              <button class="bottone chiaro" @click="confermaFattoria = false">No, lascia stare</button>
              <button class="bottone rosso" @click="azzeraFattoria">Sì, ricomincia</button>
            </div>
          </div>
        </template>
      </div>

      <!-- il cestino: vedi docs/genitori/cestino-e-posta.md -->
      <template v-if="cestino.length">
        <h2>Cancellati di recente</h2>
        <p class="mini">Le ultime copie messe da parte prima di cancellare. Rimetterne una
          sostituisce i progressi di adesso di quel bambino, e non consuma la copia.</p>

        <div class="carte">
          <template v-for="v in cestino" :key="v.quando">
            <button v-if="rimettendo?.quando !== v.quando" class="carta"
                    data-azione="rimetti-cestino" @click="rimettendo = v">
              <span class="ico">♻️</span>
              <b>Rimetti i progressi di {{ v.nome }}</b>
              <i>Com'erano {{ quando(v.quando) }}</i>
            </button>
            <div v-else class="carta pericolo aperta">
              <b>Rimettere i progressi di {{ v.nome }} di {{ quando(v.quando) }}?</b>
              <i>Quelli che {{ v.nome }} ha adesso vengono sostituiti da quella copia.</i>
              <div class="riga">
                <button class="bottone chiaro" @click="rimettendo = null">No, lascia stare</button>
                <button class="bottone rosso" data-azione="conferma-rimetti"
                        @click="rimetti(v)">Sì, rimetti</button>
              </div>
            </div>
          </template>
        </div>
      </template>

      <h2>Passa il gioco</h2>
      <p class="mini">Non c'è un negozio da cui scaricarlo: si passa l'indirizzo, e chi lo
        riceve se lo aggiunge alla schermata del telefono. È gratis e non chiede niente
        a nessuno.</p>

      <div class="carte">
        <button class="carta" data-azione="condividi-gioco" @click="passaIlGioco">
          <span class="ico">🔗</span>
          <b>Condividi il gioco</b>
          <i>{{ INDIRIZZO.replace(/^https?:\/\//, '') }}</i>
        </button>

        <button class="carta" data-azione="vai-guide" @click="$emit('vai','guide')">
          <span class="ico">📖</span>
          <b>Come funziona</b>
          <i v-if="daInstallare">Cos'è, installarlo sul telefono, l'età, le domande, i progressi</i>
          <i v-else>Cos'è, chi l'ha fatto, l'età, la difficoltà delle domande, i progressi</i>
        </button>
      </div>

      <h2>Codice</h2>
      <p class="mini">Le quattro cifre che aprono questa schermata. Stanno sul telefono,
        non dentro un bambino: valgono per tutti quelli che giocano qui.</p>

      <div class="carte">
        <button class="carta" data-azione="cambia-codice" @click="cambiaCodice">
          <span class="ico">🔑</span>
          <b>Cambia il codice</b>
          <i v-if="pin === PIN_INIZIALE">È ancora {{ PIN_INIZIALE }}, cioè come non
            averlo. Se lo dimentichi si recupera dal tastierino</i>
          <i v-else>Quattro cifre nuove, chieste due volte</i>
        </button>
      </div>

      <!-- solo se c'è qualcosa da dire: vedi docs/core/guasti.md -->
      <template v-if="incidenti.length">
        <h2>Se qualcosa si è rotto</h2>
        <p class="mini">Gli errori che il gioco si è annotato da solo, con l'ora e la
          versione: servono a capire cos'è successo su un telefono che non è il tuo.</p>

        <div class="carte">
          <div class="carta guasti" data-azione="guasti">
            <span class="ico">🔧</span>
            <b>Ultimi inciampi</b>
            <i>Da leggere se il gioco si è chiuso o un tasto non rispondeva</i>
            <ul class="lista-guasti">
              <li v-for="(g, i) in incidenti.slice().reverse()" :key="i">
                <b>{{ quando(g.quando) }}</b>
                <span>{{ g.testo }}</span>
                <small>{{ g.dove }}{{ g.versione ? ' · ' + g.versione : '' }}{{
                  g.volte > 1 ? ' · ' + g.volte + ' volte' : '' }}</small>
              </li>
            </ul>
            <div class="riga">
              <button class="bottone chiaro" data-azione="copia-guasti" @click="copiaGuasti">
                Copia</button>
              <button class="bottone chiaro" data-azione="scorda-guasti" @click="scordaGuasti">
                Cancella</button>
            </div>
          </div>

          <button class="carta" data-azione="ripara" @click="riparaApp">
            <span class="ico">♻️</span>
            <b>Riscarica il gioco</b>
            <i>Se fa cose strane o sembra fermo a una versione vecchia: lo riscarica
              da internet e riparte pulito. Ci vuole qualche secondo e la connessione.
              <b>I progressi restano dove sono</b></i>
          </button>
        </div>
      </template>

      <!-- fuori dal v-if di sopra: metà delle cose che non vanno non lancia un errore -->
      <h2>Dirmi che qualcosa non va</h2>
      <p class="mini">Un livello impossibile, una parola sbagliata, un tasto che risponde e
        fa la cosa storta: le cose che nessun errore in archivio racconta.</p>

      <div class="carte">
        <a class="carta segnala" data-azione="segnala" :href="linkSegnala"
           target="_blank" rel="noopener">
          <span class="ico">✉️</span>
          <b>Segnala un problema</b>
          <i v-if="incidenti.length">Si apre un modulo che ha già dentro la versione
            e l'ultimo inciampo: non resta da scrivere niente di tecnico</i>
          <i v-else>Si apre un modulo, con già dentro la versione del gioco</i>
        </a>
      </div>
      </template>

      <!-- ══════════ scheda: giochi e domande ══════════ -->
      <template v-else-if="scheda === 'giochi'">
      <!-- l'unico posto dove si tara: vedi docs/genitori/manopola.md, docs/genitori/quadro.md -->
      <h2>Quanti anni ha</h2>
      <p class="mini">È la taratura, non un'anagrafe: decide quali giochi trova in home
        e quanto sono difficili le domande. Sotto c'è il quadro di quell'età — e ogni
        riga si può correggere con la ✎, se per {{ chi }} non è così.</p>

      <ManopolaEta :anni="anniOra" :giochi="settaggi.giochi || {}"
                   :sa="settaggi.sa || {}" :ritocchi="settaggi.ritocchi || {}"
                   :risposte="state.profile?.items || {}"
                   :sperimentali="inProva" conferma tarabile
                   @scegli="applicaAnni" @prova="prova = $event"
                   @ritocca="ritoccaDalQuadro" @gioco="fissaDalQuadro"
                   @sapere="fissaSapereDalQuadro"
                   @rimetti="rimettiTutto" />

      <h2>Interruttori di casa</h2>
      <p class="mini">Non dipendono dall'età e non sono di un gioco solo.</p>

      <div class="carte">
        <button class="carta interruttore" :class="{ spento: !inProva }"
                data-flag="sperimentali" @click="cambiaProva">
          <span class="ico">🧪</span>
          <b>Mostra i giochi in prova</b>
          <i>{{ inProva ? (sperimentali.length === 1
                            ? '1 gioco in prova, ed è nel quadro qui sopra'
                            : sperimentali.length + ' giochi in prova, e sono nel quadro qui sopra')
                        : 'Nascosti: non compaiono in home e nemmeno nel quadro' }}</i>
          <span class="leva"><span class="pallina"></span></span>
        </button>

        <button class="carta interruttore" :class="{ spento: !aperto }"
                data-flag="tuttoAperto" @click="cambiaAperto">
          <span class="ico">🔓</span>
          <b>Sblocca tutti i livelli</b>
          <!-- lo leggono il Generale, il castello, le lingue, la bancarella e gli asteroidi -->
          <i>{{ aperto ? 'Segnato: nei giochi a tappe si apre tutto, anche quello che non ha ancora fatto'
                       : 'Le tappe si aprono una per volta, come adesso' }}</i>
          <span class="leva"><span class="pallina"></span></span>
        </button>
      </div>

      <MoneteGiocoPerGioco :chi="chi" />

      <!-- il quaderno dei giudizi: vedi docs/genitori/come-va.md -->
      <h2>Le domande dei quiz</h2>
      <p class="mini">Acceso, sopra ogni domanda compaiono tre tastini per dire com'era:
        😴 troppo facile, 😰 troppo difficile, 🐛 storta. Serve a correggere le tarature
        sbagliate, ed esce di qui col modulo di segnalazione.</p>

      <div class="carte">
        <button class="carta interruttore" :class="{ spento: !giudiziAccesi }"
                data-flag="giudizi" @click="cambiaGiudizi">
          <span class="ico">😰</span>
          <b>Giudicare le domande</b>
          <i>{{ giudiziAccesi
                ? 'Sopra ogni domanda ci sono 😴 troppo facile, 😰 troppo difficile, 🐛 storta'
                : 'Spento: nessun tastino in più mentre si gioca' }}</i>
          <span class="leva"><span class="pallina"></span></span>
        </button>

        <div v-if="giudizi.length" class="carta guasti" data-azione="giudizi">
          <span class="ico">📝</span>
          <b>{{ giudizi.length === 1 ? '1 domanda segnata' : giudizi.length + ' domande segnate' }}</b>
          <i>Questo è quello che parte: verdetto, chi giocava, il modulo col grado,
            la tipologia, quanto ci ha messo e com'è finita</i>
          <ul class="lista-guasti">
            <li v-for="(g, i) in righeGiudizi" :key="i">
              <span>{{ g.ico }} {{ g.testo }}</span>
            </li>
          </ul>
          <p v-if="paccoDaMandare.lasciati" class="mini">
            Nel modulo ci stanno gli ultimi {{ paccoDaMandare.mandati }}: gli altri
            {{ paccoDaMandare.lasciati }} restano qui, e si mandano con «Copia».
          </p>
          <div class="riga">
            <a class="bottone chiaro" data-azione="manda-giudizi" :href="linkGiudizi"
               target="_blank" rel="noopener">Manda</a>
            <button class="bottone chiaro" data-azione="copia-giudizi" @click="copiaGiudizi">
              Copia</button>
            <button class="bottone chiaro" data-azione="scorda-giudizi" @click="scordaGiudizi">
              Cancella</button>
          </div>
        </div>
      </div>

      </template>

      <!-- ══════════ scheda: come va ══════════ vedi docs/genitori/come-va.md -->
      <template v-if="scheda === 'comeva'">
        <ComeVa :chi="chi" @prova="prova = $event" />
      </template>

      <p v-if="esito" :class="esito.ok ? 'mini' : 'avviso'">{{ esito.testo }}</p>

      <!-- la firma: riga corta in fondo, non in cima; il resto sta in "Chi l'ha fatto" -->
      <footer class="firma" data-firma>
        <p>Educagioco è di <b>{{ CHI }}</b>, che l'ha scritto per i suoi due figli.
          Gratis, senza pubblicità e senza account: <b>niente esce da questo
          telefono</b>.</p>
        <div class="fuori">
          <a :href="CODICE" target="_blank" rel="noopener" data-fuori="codice">
            Il codice, aperto ↗</a>
        </div>
      </footer>
    </div>

    <!-- fuori dalle schede: non è un'impostazione, è un modo di leggere una voce -->
    <Prova v-if="prova" :chiave="prova.chiave || ''" :nome="prova.nome"
           :sorgente="prova.sorgente || null" :giro="prova.giro || null"
           :eta="prova.eta ?? null" @chiudi="prova = null" />
  </div>
</template>

<style scoped>
/* non è un interruttore né una carta: è una frase col rimando */
.riga-eta { display:flex; align-items:center; gap:10px; width:100%; text-align:left;
            background:#f5f2ff; border:none; border-radius:14px; padding:10px 12px;
            cursor:pointer; font-family:inherit }
.riga-eta span { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px }
.riga-eta b { font-size:14px; font-weight:800; color:var(--viola-scuro) }
.riga-eta i { font-style:normal; font-size:11px; color:var(--tenue); line-height:1.3 }
.riga-eta em { font-style:normal; font-size:12px; font-weight:800; color:var(--viola);
               white-space:nowrap }
.riga-eta:active { transform:translateY(1px) }

.pallini { display:flex; gap:14px; margin:4px 0 2px }
.pallini span { width:15px; height:15px; border-radius:50%; background:#ffffffcc;
                box-shadow:inset 0 0 0 2px #d4dce6; transition:.12s }
.pallini span.pieno { background:var(--viola); box-shadow:none; transform:scale(1.1) }

/* un blocco che si legge, non una carta; il colore è quello dei nastri di casa, mai rosso d'allarme */
.posta { width:100%; max-width:400px; margin:0 0 16px; text-align:left }
.posta h2 { margin:0 0 8px }
.nota { background:#eef4ff; border:2px solid #cfe0f8; border-radius:14px;
        padding:11px 13px; margin-bottom:9px }
.nota.avviso { background:#fff2ee; border-color:#f6cdbe }
.nota b { display:block; font-size:14.5px; margin-bottom:4px }
.nota p { margin:0; font-size:13px; line-height:1.45 }
.nota small { display:block; margin-top:6px; font-size:11px; opacity:.6 }
.nota .bottone { margin-top:9px }

/* più grande del testo intorno: è la cosa a cui si sta rispondendo */
.domanda { font-size:16px; font-weight:700; margin:2px 0 12px; text-align:center; max-width:300px }

.tastierino { display:grid; grid-template-columns:repeat(3,1fr); gap:11px; width:100%; max-width:260px }
.tasto { height:58px; border-radius:16px; background:#ffffffdd; color:var(--viola-scuro);
         font-size:23px; font-weight:800; box-shadow:0 4px 0 #d4dce6 }
.tasto:active { transform:translateY(2px); box-shadow:0 2px 0 #d4dce6 }
.tasto.canc { font-size:19px; color:var(--tenue) }
/* resta dov'è, spento: toglierlo farebbe pensare a una schermata rotta */
.tastierino.spento { opacity:.45 }
.tastierino.spento .tasto { box-shadow:0 4px 0 #d4dce6 }

/* niente rosso: è una porta chiusa, non un errore. La barretta si muove
   perché due secondi muti sono indistinguibili da un tasto rotto */
.fermo { display:flex; flex-direction:column; align-items:center; gap:7px;
         width:100%; max-width:260px; margin:2px 0 }
.fermo small { font-size:12px; color:var(--tenue); opacity:.8 }
.fermo .barretta { display:block; width:100%; height:7px; border-radius:999px;
                   background:#ffffffcc; box-shadow:inset 0 0 0 1px #d4dce6; overflow:hidden }
.fermo .barretta i { display:block; height:100%; border-radius:999px;
                     background:var(--tenue); opacity:.55; transition:width .1s linear }
/* a tempo scaduto restano lì, invisibili: tengono il posto e basta */
.fermo .muta { visibility:hidden }

/* il tasto più grande della schermata: la cosa ovvia da fare qui è andarsene */
.esci { width:100%; max-width:260px; margin-top:4px; font-size:16px; padding:13px 18px }

/* tre schede larghe uguali su un telefono da 390 */
.schede { display:flex; gap:6px; width:100%; max-width:400px; margin:-4px 0 2px }
.schede button { flex:1; padding:11px 6px; border-radius:14px; font-size:14px; font-weight:800;
                 color:var(--tenue); background:#ffffff88 }
.schede button.ora { background:var(--viola); color:#fff; box-shadow:0 4px 0 #00000018 }
.schede button:active { transform:translateY(2px) }

h3.materia { margin:10px 0 -2px; font-size:13px; font-weight:900; letter-spacing:.6px;
             text-transform:uppercase; color:var(--tenue); align-self:flex-start;
             width:100%; max-width:400px }

.carte { display:flex; flex-direction:column; gap:11px; width:100%; max-width:400px }
.carta { display:grid; grid-template-columns:auto 1fr; grid-template-rows:auto auto;
         gap:2px 14px; align-items:center; text-align:left; padding:15px 18px;
         border-radius:18px; background:var(--carta); box-shadow:0 4px 14px #8593a822 }
.carta .ico { grid-row:1/3; font-size:29px }
.carta b { font-size:16px; font-weight:800; color:var(--viola-scuro) }
.carta i { font-style:normal; font-size:12.5px; color:var(--tenue) }
.carta:active { transform:translateY(2px) }

/* l'interruttore: la leva a destra dice acceso/spento senza leggere */
.carta.interruttore { grid-template-columns:auto 1fr auto }
.carta.interruttore .leva { grid-column:3; grid-row:1/3; width:46px; height:27px; border-radius:999px;
                            background:#38c172; position:relative; transition:.15s }
.carta.interruttore .pallina { position:absolute; top:3px; left:22px; width:21px; height:21px;
                               border-radius:50%; background:#fff; transition:.15s;
                               box-shadow:0 1px 3px #00000033 }
.carta.interruttore.spento .leva { background:#c9c2d6 }
.carta.interruttore.spento .pallina { left:3px }
/* una riga in più: l'esempio della domanda che sparisce spegnendola */
.carta.sapere { grid-template-rows:auto auto auto; padding:12px 16px }
.carta.sapere .ico, .carta.sapere .leva { grid-row:1/4 }
.carta.sapere small { font-size:11.5px; color:var(--tenue); opacity:.85 }
.carta.sapere.spento { opacity:.62 }

/* sta sotto la sua carta, non a fianco: si legge come "dentro questo" */
.dettaglio-tasto { align-self:flex-start; margin:-6px 0 0 14px; padding:8px 14px;
                   min-height:40px; border-radius:999px;
                   font-size:13px; font-weight:750; color:var(--viola-scuro);
                   background:#8593a81f;
                   display:flex; align-items:center; gap:8px }
.dettaglio-tasto em { font-style:normal; font-size:11px; font-weight:700; color:#b23a5a;
                      background:#b23a5a1a; border-radius:999px; padding:2px 7px }
.dettaglio { display:flex; flex-direction:column; gap:1px; margin:-4px 0 4px 14px;
             border-radius:14px; overflow:hidden; background:#8593a81a }
.dettaglio .voce { display:flex; align-items:center; justify-content:space-between; gap:10px;
                   width:100%; padding:9px 12px; text-align:left; background:var(--carta);
                   font-size:13.5px; font-weight:700; color:var(--viola-scuro) }
.dettaglio .voce-chi { flex:1; min-width:0 }
.dettaglio .voce-chi b { display:block; font-size:13.5px; font-weight:750 }
.dettaglio .voce-chi i { display:block; font-style:normal; font-size:11px; color:var(--tenue);
                         font-weight:600 }
/* un intervallo, non una media: la tipologia esce a più gradi di difficoltà */
.dettaglio .voce-chi i .pallino { display:inline-block; width:8px; height:8px;
                                  border-radius:50%; margin-right:2px; vertical-align:-1px }
.dettaglio .voce.spento .voce-chi i .pallino { opacity:.45 }
.dettaglio .voce:active { transform:translateY(1px) }
.dettaglio .voce.spento { color:var(--tenue) }
.dettaglio .voce .leva { flex:none; width:38px; height:22px; border-radius:999px;
                         background:#38c172; position:relative; transition:.15s }
.dettaglio .voce .pallina { position:absolute; top:3px; left:19px; width:16px; height:16px;
                            border-radius:50%; background:#fff; transition:.15s;
                            box-shadow:0 1px 3px #00000033 }
.dettaglio .voce.spento .leva { background:#c9c2d6 }
.dettaglio .voce.spento .pallina { left:3px }
.carta.sapere.spento i { color:#b23a5a }

/* i due tasti che non spengono niente: stesso rientro del dettaglio, sotto la sua carta */
.azioni-sapere { display:flex; align-items:center; gap:4px; flex-wrap:wrap;
                 margin:-6px 0 0 14px }
.azioni-sapere .dettaglio-tasto { margin:0 }
.prova-tasto { padding:8px 14px; min-height:40px; font-size:13px; font-weight:750;
               color:var(--viola); background:#7c5cff1f; border-radius:999px }
.prova-tasto:active { transform:translateY(1px) }
/* qui resta solo il triangolino: il nome lo dice l'aria-label */
.dettaglio .voce-riga { display:flex; align-items:center; gap:2px; background:var(--carta) }
.dettaglio .voce-riga .voce { flex:1; min-width:0 }
.prova-tasto.solo-segno { flex:none; padding:10px 14px; font-size:12px; border-radius:0;
                          background:none; color:var(--viola) }

.carta.gioco { padding:11px 16px }
.carta.gioco .ico { font-size:25px }
.carta.gioco.spento { opacity:.62 }
/* spento da un macrogruppo, non dai genitori: la leva resta ferma */
.carta.gioco.bloccato i { color:#b23a5a }
.carta.gioco.bloccato .leva { background:#e3dce8 }
.carta.gioco.prova b small { margin-left:6px; font-size:10px; font-weight:900; letter-spacing:.4px;
                             text-transform:uppercase; color:#8a6a1f; background:#fff2cf;
                             border-radius:7px; padding:2px 6px; vertical-align:middle }

/* si legge, non si preme: il monospazio è per chi ci mette le mani, non a colpo d'occhio */
.carta.guasti { grid-template-rows:auto auto auto auto }
.carta.guasti .ico { grid-row:1/3 }
.lista-guasti { grid-column:1/3; margin:8px 0 0; padding:0; list-style:none;
                display:flex; flex-direction:column; gap:7px }
.lista-guasti li { display:flex; flex-direction:column; gap:1px; padding:7px 10px;
                   background:#fff0e6; border-radius:11px }
.lista-guasti b { font-size:12px; color:#b4603f }
.lista-guasti span { font-size:11.5px; line-height:1.35; word-break:break-word;
                     font-family:ui-monospace,monospace; color:var(--viola-scuro) }
.lista-guasti small { font-size:10.5px; color:var(--tenue); opacity:.8 }
.carta.guasti .riga { grid-column:1/3; justify-content:flex-start; margin-top:9px }
.carta.guasti .bottone { font-size:14px; padding:9px 15px; box-shadow:0 4px 0 #d4dce6 }

/* l'unica carta che è un link: senza queste regole prenderebbe blu e sottolineatura */
.carta.segnala { text-decoration:none; color:inherit }
/* «Manda» è un link ma deve sembrare un bottone come «Copia» e «Cancella» */
a.bottone { text-decoration:none; display:inline-flex; align-items:center;
            justify-content:center }

/* tre righe da leggere, non pastiglie: la scritta piccola c'è sempre, anche non selezionata */
.carta.sapere.quanto { display:flex; flex-direction:column; gap:5px; align-items:flex-start;
                       text-align:left; cursor:default }
.carta.sapere.quanto.spento { opacity:.62 }
.carta.sapere.quanto > em { font-style:normal; font-size:11px; color:var(--tenue) }
.livelli { display:flex; gap:5px; flex-wrap:wrap; margin-top:3px }
.livello { padding:7px 12px; min-height:36px; border:none; border-radius:999px;
           font-family:inherit; font-size:12.5px; font-weight:750; cursor:pointer;
           color:var(--viola-scuro); background:#eceff4 }
.livello.on { color:#fff; background:linear-gradient(180deg,var(--viola),var(--viola-scuro)) }
.livello.freccia { background:#eef2ff; color:var(--viola) }
.livello:disabled { opacity:.4 }
.livello.spegni.on { background:linear-gradient(180deg,#b23a5a,#8d2a45) }
/* il consiglio è un fatto misurato, non una descrizione: si vede che è un'altra cosa */
.carta.sapere.quanto > em.consiglio { color:var(--viola-scuro); font-weight:650 }
.fai { border:none; background:none; font-family:inherit; font-size:11px; font-weight:800;
       color:var(--viola); text-decoration:underline; padding:2px 0; cursor:pointer }
.livello:active { transform:translateY(1px) }


/* si vede da lontano che è quella che fa danni */
.carta.pericolo b { color:#b23a5a }
.carta.pericolo.aperta { display:flex; flex-direction:column; gap:9px; align-items:center;
                         text-align:center; background:#fff0f3 }
.carta.pericolo.aperta i { max-width:34ch }
.bottone.rosso { background:linear-gradient(180deg,var(--rosso),#d63a5c); color:#fff;
                 box-shadow:0 6px 0 #a82a46; font-size:16px; padding:13px 22px }
.bottone.rosso:active { box-shadow:0 3px 0 #a82a46 }
.bottone.chiaro { font-size:16px; padding:13px 22px }

/* una riga in più delle altre carte: sotto il nome i suoi tre gesti, a capo se serve */
.carta.chi-gioca { grid-template-rows:auto auto auto }
.carta.chi-gioca .ico { grid-row:1/4 }
.carta.chi-gioca .riga { grid-column:2; justify-content:flex-start; margin-top:7px }
.carta.chi-gioca .bottone { font-size:14px; padding:9px 15px; box-shadow:0 4px 0 #d4dce6 }
.carta.chi-gioca .bottone:active { transform:translateY(2px); box-shadow:0 2px 0 #d4dce6 }
/* colonna intera: le altre carte restano a tre righe */
.carta.chi-gioca .aspetto-sezione { grid-column:1/3; margin-top:9px;
  padding-top:9px; border-top:1px solid #8593a822 }
.carta.chi-gioca .aspetto-sezione .mini { text-align:left; margin:0 0 7px }
/* stessa forma della conferma prima di cancellare, senza il rosso */
.carta.aperta { display:flex; flex-direction:column; gap:9px; align-items:center; text-align:center }
.carta.aperta i { max-width:34ch }
.campo { width:100% }
.campo .nome {
  flex:1 1 130px; min-width:0; padding:12px 14px; border:none; border-radius:14px;
  font-size:17px; font-family:inherit; text-align:center;
  background:#fff; color:var(--viola-scuro); box-shadow:inset 0 0 0 2px #e3e8ef;
}
.campo .nome:focus { outline:3px solid var(--viola); outline-offset:1px }
.campo .bottone { font-size:15px; padding:11px 17px }

/* sbiadita: l'ultima cosa della colonna, non deve competere con un'impostazione */
.firma { width:100%; max-width:400px; margin:26px 0 6px; padding-top:14px;
         border-top:1px solid #8593a826; text-align:center }
.firma p { font-size:12.5px; line-height:1.5; color:var(--tenue); margin:0 }
.firma b { color:var(--viola-scuro); font-weight:800 }
.firma .fuori { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:10px 0 }
.firma .fuori a { font-size:12.5px; font-weight:800; color:var(--viola);
                  text-decoration:none; padding:7px 12px; border-radius:999px;
                  background:#f5f2ff }
.firma .fuori a:active { transform:translateY(1px) }
</style>
