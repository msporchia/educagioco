<script setup>
/* ═══════════════════════════════════════════════════════════════════
   SCHERMATA DEI GENITORI
   Le cose che un bambino non deve poter fare per sbaglio: portarsi via i
   progressi, rimetterli, cancellarli. Prima stavano sulla home, e
   "azzera i dati" a portata di dito era solo questione di tempo.

   Il PIN non è sicurezza: è un gradino contro il tocco distratto. Chi
   vuole entrare davvero apre gli strumenti del browser. Si cambia da qui
   dentro — quando i bambini imparano a leggerlo da sopra la spalla — e
   vive in `store/pin.js`, fuori dai profili.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { state, esportaTutto, importaTutto, resetPlayer, nomeCorrente,
         rinominaGiocatore, eliminaGiocatore, cestinaOra, ripristinaCestinato,
         spostaLEta,
         etaDelBambino,
         varianteAccesa, accendiVariante,
         tuttoAperto, accendiTuttoAperto,
         sperimentaliAccesi, accendiSperimentali,
         ritocca, accendiSapere, saperiSpenti, fissaGioco, rimettiAiDifetti,
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
import { CHIAVE_MENTE, SCALETTA } from '../data/asteroidi.js'
import Barra from '../components/Barra.vue'
import ManopolaEta from '../components/eta/Manopola.vue'
import { anniInLettere } from '../components/eta/lettere.js'
import Benvenuto from '../components/Benvenuto.vue'
import Prova from '../quiz/Prova.vue'
import ComeVa from '../quiz/ComeVa.vue'
import TempoDiGioco from '../components/TempoDiGioco.vue'

const emit = defineEmits(['vai'])

/* Il nome di chi sta giocando. Da quando esiste il roster `state.player`
   è un id e non un nome: scritto a schermo direbbe «Impostazioni di g2»
   a chi si è appena iscritto. Il nome sta nel roster, e si chiede lì. */
const chi = computed(() => nomeCorrente() || 'questo giocatore')

/* chi finisce dentro il salvataggio: si legge dal roster, così la carta
   dice la verità anche dopo che i genitori hanno aggiunto qualcuno */
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

/* Ricomincia la fattoria e basta. Passa da `campagne.js` come tutti i
   giochi nuovi: qui non si sa nemmeno com'è fatta dentro. */
async function azzeraFattoria() {
  await cestinaOra('fattoria')
  azzeraCampagna('fattoria')
  confermaFattoria.value = false
  esito.value = { ok: true, testo: 'La fattoria di ' + chi.value + ' riparte da zero.' }
  cestino.value = await leggiCestino()
}

/* ── il cestino ──
   Quello che si è cancellato di recente, e il tasto per rimetterlo. La
   sezione esiste solo se c'è qualcosa dentro: una riga «il cestino è
   vuoto» è una riga da leggere ogni volta per non sapere niente, come
   quella dei guasti. Perché ci sia un cestino, vedi
   `store/cestino.js`. */
const cestino = ref([])
const rimettendo = ref(null)     // la voce in attesa di conferma

/* ── la posta ──
   Le note che un grande deve leggere (`guide/novita.js`) e gli avvisi
   che il gioco si è scritto da solo. Stanno in cima a questa schermata e
   non in una scheda a parte: chi entra per un altro motivo le trova
   sulla strada, chi entra apposta non deve cercarle. */
const posta = ref({ note: [], avvisi: [] })
const cePosta = computed(() => posta.value.note.length + posta.value.avvisi.length > 0)

async function hoLetto() {
  await segnaLetta()
  posta.value = await laPosta()
}
const file = ref(null)
/* il cambio del codice: 'nuovo' mentre lo si sceglie, 'ripeti' mentre lo
   si conferma. Chiedere due volte non è una formalità — un codice
   sbagliato di un dito chiude fuori i grandi e basta. */
const modo = ref('')
const nuovo = ref('')
/* il codice dimenticato: la domanda al posto delle quattro cifre, stesso
   tastierino e stessa attesa (`store/pin.js`) */
const recupero = ref(false)

/* le due schede: quello che si vede ('giochi') e quello che si sa
   ('sa'). Erano una colonna sola e i macrogruppi l'avrebbero fatta
   lunga il doppio, con due cose diverse mescolate: quali giochi
   compaiono, e quali domande hanno senso per questo bambino. */
const scheda = ref('bambini')

/* i guasti registrati da `incidenti.js`: si leggono una volta all'entrata
   e non si stanno a guardare in diretta — chi apre questa pagina lo fa
   dopo, per capire cos'è successo prima */
const incidenti = ref([])

/* i giudizi sulle domande, dallo stesso posto e per lo stesso motivo:
   si sono accumulati mentre si giocava, e si guardano dopo */
const giudizi = ref([])

onMounted(async () => {
  /* uscire e rientrare non azzera l'attesa: se ne era rimasta, si
     riprende da dove stava invece di ricominciare dal tastierino vivo */
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

/* l'ora e basta se è di oggi, altrimenti anche il giorno: «alle 17:42»
   è quello che un genitore confronta col «si è rotto prima di cena» */
function quando (iso) {
  const d = new Date(iso)
  if (isNaN(d)) return '?'
  const ore = d.toLocaleTimeString('it', { hour: '2-digit', minute: '2-digit' })
  const oggi = new Date().toDateString() === d.toDateString()
  return oggi ? ore : d.toLocaleDateString('it', { day: 'numeric', month: 'short' }) + ' ' + ore
}

/* copiare serve a mandarlo a chi ci mette le mani: negli appunti finisce
   tutto quello che c'è, pila compresa, che a schermo sarebbe illeggibile */
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

/* la riparazione ricarica la pagina da sé: non c'è niente da dire dopo */
const riparaApp = () => ripara()

/* ── segnalare ──
   Un modulo fuori dal gioco, e non un indirizzo di posta: su un telefono
   senza client configurato un `mailto:` è l'ennesimo tasto che non fa
   niente, ed è precisamente il guasto che questa pagina esiste per non
   avere. Ci va dentro quello che chi scrive non saprebbe dire — la
   versione, e l'ultimo inciampo se ce n'è uno — così che una segnalazione
   utile costi una frase invece di una traduzione.

   La pila non entra nell'indirizzo: sarebbe lunga il triplo del limite
   che i browser reggono in fila. Per quella c'è «Copia» qui sopra.

   ── COME ARRIVANO DALL'ALTRA PARTE ──
   In Tally i parametri dell'indirizzo riempiono **solo i campi
   nascosti**, che nell'editor si aggiungono scrivendo `/hidden`, e sono
   **sensibili alle maiuscole**: il nome del campo dev'essere identico
   al parametro, lettera per lettera. Un campo normale — una casella di
   testo, un indirizzo di posta — dall'indirizzo non si tocca affatto.
   Quindi un parametro che nel form non ha il suo campo nascosto non dà
   nessun errore: il modulo si apre come sempre e il dato sparisce.

   Questo qui vuole `versione` e `guasto`. */

const linkSegnala = computed(() => {
  const q = new URLSearchParams({ versione: __VERSIONE__.id })
  const ultimo = incidenti.value[incidenti.value.length - 1]
  if (ultimo) q.set('guasto', `${ultimo.dove} · ${ultimo.testo}`.slice(0, 300))
  return `${SEGNALA}?${q}`
})

/* ── i giudizi sulle domande ──
   L'interruttore mette tre tastini sopra ogni domanda dei quiz. Sta qui
   dentro e non in `settings` perché è del telefono e non di un bambino:
   chi giudica è il grande seduto di fianco, e cambiando giocatore non
   deve riaccenderlo. */
function cambiaGiudizi() {
  accendiGiudizi(!giudiziAccesi.value)
  esito.value = { ok: true, testo: giudiziAccesi.value
    ? 'Acceso: sopra ogni domanda compaiono 😴 😰 🐛.'
    : 'Spento: le domande tornano come prima.' }
}

/* la riga da leggere a schermo: la stessa che partirebbe nel modulo,
   che è il punto — quello che si manda si vede prima */
const righeGiudizi = computed(() =>
  giudizi.value.slice().reverse().map(g => ({
    ico: verdettoDi(g.verdetto)?.ico || '·',
    testo: rigaGiudizio(g),
  })))

/* ── dove vanno ──
   Non c'è un server a cui mandarli e non ci sarà: un modulo è l'unico
   canale che da un telefono senza posta configurata non chiede niente a
   nessuno.

   Ma è un modulo **suo**, non quello dei guasti, e i due non vanno
   mescolati: il primo lo compila chiunque inciampi nel gioco e chiede
   di raccontare cosa è successo, questo lo apre chi ha in mano il
   telefono di casa e non ha niente da scrivere — si apre e si tocca
   invia. Un campo obbligatorio, qui, sarebbe un pedaggio su un gesto
   che deve costare un tocco.

   Vuole un campo nascosto `giudizi` e uno `versione` (vedi sopra come
   si aggiungono). */
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

/* Cancellare è a mano, e apposta: il modulo si apre in un'altra scheda
   e da qui non si sa se è stato davvero inviato. Svuotare da soli dopo
   aver aperto il link vorrebbe dire buttare via i giudizi di chi ci ha
   ripensato a metà. */
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

/* ── l'attesa dopo un codice sbagliato ──
   Quanto dura lo decide `store/pin.js`, che tiene il conto degli sbagli
   anche se si esce e si rientra; qui si tiene solo il battito che fa
   scendere il numero e riempire la barretta. Senza barretta sarebbero
   trenta secondi di tastierino che non fa niente, cioè esattamente il
   guasto che si sta cercando di non avere. */
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

/* ---------- il codice dimenticato ----------
   Perché sia una domanda di cultura generale e non qualcosa di più
   serio sta scritto in `store/pin.js`. Qui conta solo che sbagliare
   costi *la stessa attesa* di un codice sbagliato: la risposta è un
   anno, cioè poche centinaia di possibilità, e senza il freno di
   `segnaSbaglio` si tirerebbero tutte in un pomeriggio. */
function apriRecupero() { recupero.value = true; cifre.value = ''; sbagliato.value = false }
function lasciaIlRecupero() { recupero.value = false; cifre.value = ''; sbagliato.value = false }

async function quattroDelRecupero() {
  if (!rispostaGiusta(cifre.value)) { cifre.value = ''; fermati(); return }
  cifre.value = ''
  recupero.value = false
  pin.value = await azzeraPin()
  azzeraSbagli()
  /* Lo scrive nella posta: se a rispondere non è stato il grande di
     casa, questo è l'unico modo che ha di scoprirlo — e la risposta a
     una domanda di cultura generale è alla portata di chiunque la
     cerchi (`store/pin.js`). Senza traccia scritta, un codice tornato a
     0000 sembra una stranezza dell'applicazione. */
  await avvisa('Il codice era stato dimenticato ed è stato rimesso a ' + PIN_INIZIALE
    + '. Se non sei stato tu, l\'ha fatto qualcuno che ha risposto alla domanda.')
  /* e si rilegge la posta: questa schermata la carica al montaggio, e
     qui dentro il montaggio è già passato — senza, l'avviso appena
     scritto si vedrebbe solo alla visita dopo, che è quanto dire mai */
  posta.value = await laPosta()
  dentro.value = true
  /* si entra e si sceglie subito quello nuovo: una casa lasciata a 0000
     è una casa senza codice, e chi è appena rientrato non ci ripensa da
     solo domani */
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

async function importa(ev) {
  esito.value = null
  const f = ev.target.files?.[0]
  if (!f) return
  try {
    const nomi = await importaTutto(JSON.parse(await f.text()))
    esito.value = { ok: true, testo: 'Rimessi i progressi di ' + nomi.join(' e ') + '.' }
  } catch (e) {
    esito.value = { ok: false, testo: e.message }
  }
  ev.target.value = ''   // stesso file due volte di fila deve poter funzionare
}

/* ── PASSARE IL GIOCO A UN'ALTRA FAMIGLIA ──
   Si condivide **l'indirizzo secco**, senza messaggio addosso: chi lo
   manda scrive di suo quello che ha da dire, e un testo preconfezionato
   in fondo a una chat suona come una catena di sant'Antonio.

   L'indirizzo lo scrive il build e non lo si legge da `location`: qui in
   casa il gioco arriva dal server di casa, e quell'indirizzo per un'altra
   famiglia non esiste. Vedi `guide/aiuto.js`. */
async function passaIlGioco () {
  esito.value = null
  const r = await condividi({ url: INDIRIZZO, titolo: 'Educagioco' })
  if (r.come === 'copiato') esito.value = { ok: true, testo: 'Indirizzo copiato: incollalo dove vuoi.' }
  else if (r.come === 'niente') esito.value = { ok: false, testo: INDIRIZZO }
}

/* Il salvataggio mandato dal foglio del telefono invece che scaricato.
   Su un telefono «scarica» finisce in una cartella che poi va ritrovata;
   di qui va dove serve — a se stessi in chat, nel cloud, sull'altro
   telefono — che è l'unico motivo per cui uno esporta i progressi.
   La carta compare solo dove la condivisione di file c'è davvero. */
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

/* Serve solo a decidere se vale la pena dire «installalo»: chi ci gioca
   già dall'icona non ha bisogno di sentirselo ripetere. */
const daInstallare = !installata() && piattaforma() !== 'computer'

/* ── chi gioca ──
   Aggiungere, rinominare, eliminare. Sta dietro il PIN e non in home
   perché sono i tre gesti che possono far sparire mesi di partite col
   dito sbagliato — eliminare cancella davvero, e non c'è un cestino.

   L'unica porta che non passa di qui è la prima: a roster vuoto il nome
   si chiede subito, senza codice (`components/Benvenuto.vue`). Un'app
   appena installata che chiede un PIN che nessuno ha ancora scelto non
   si apre più.

   Una schermata sola con tre stati, come il resto di questo file:
   `rinominando` tiene l'id di chi si sta ribattezzando, `eliminando`
   quello di chi sta per sparire, `aggiungendo` dice che si sta scrivendo
   un nome nuovo. Mai due aperti insieme. */
const rinominando = ref('')
const eliminando = ref('')
/* Il modulo del bambino nuovo non sta più qui: è la stessa schermata
   del primo avvio (`components/Benvenuto.vue`), aperta a tutto schermo.
   Qui resta solo l'interruttore che la apre. */
const aggiungendo = ref(false)
const nomeInCorso = ref('')

function chiudiTutto() {
  rinominando.value = ''; eliminando.value = ''; nomeInCorso.value = ''
}

/* ── QUANTI ANNI HA, CHE È L'UNICA MANOPOLA ──
   Qui c'erano due manopole per la stessa cosa: un `− 7,5 anni +` che
   spostava solo l'età, e dieci pixel più sotto un «Rimetti giochi e
   domande» che apriva le quattro fasce e riscriveva **tutto** — giochi,
   saperi, ritocchi — senza che niente, a guardarle, dicesse quale
   fosse quale.

   Adesso ce n'è una (`components/ManopolaEta.vue`) e dice cosa fa
   mentre la si muove. Il conto dei tre casi sta in `data/partenze.js`
   e non qui, perché è **lo stesso** che poi scrive: se la schermata se
   lo rifacesse per conto suo, il riassunto direbbe una cosa e il
   salvataggio ne farebbe un'altra.

     · dentro la stessa fascia — si sposta l'età e basta, muta
     · fascia diversa, ma nessuna scelta fatta a mano — si va dritti
     · fascia diversa, e c'era roba sistemata a mano — si chiede

   Il terzo caso è il motivo per cui il tasto «Rimetti» non serve più:
   quello che faceva succede qui, ma solo quando c'è davvero qualcosa
   da riscrivere, e detto prima invece che dopo. */
const giroEta = ref(0)
const anniOra = computed(() => (giroEta.value, etaDelBambino()))
const settaggi = computed(() => (giroEta.value, state.profile.settings || {}))

/* Qui non si decide più niente: la manopola muove la sua bozza, mostra
   il quadro di quell'età e chiede conferma da sé, con il cartello
   appiccicato in fondo — `scegli` arriva una volta sola, quando il
   grande ha premuto «Applica». Prima si scriveva a ogni tacca e la
   conferma compariva in fondo alla colonna, dove non la vedeva
   nessuno: si vedeva solo una freccia che smetteva di rispondere. */
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

/* ── LA CORREZIONE PICCOLA, DAL QUADRO ──
   L'età è la manopola grossa e sta sopra; questa è la riga per volta:
   *le stagioni le davamo per sapute, e a scuola sono indietro di mezzo
   anno*. La tacca (`components/eta/Taratura.vue`) non scrive niente e
   manda su cosa ha deciso — come fa già quella dell'età — e qui si
   sceglie fra le due scritture, che sono due affermazioni diverse:

     · **spostare** è un ritocco (`settings.ritocchi`), mezzo anno per
       scatto e non più di tre: la domanda resta, cambia solo dove cade;
     · **togliere** è un'altra cosa (`settings.sa`): il pezzo di scuola
       si spegne e le domande che lo danno per scontato spariscono da
       tutti i giochi, castello compreso.

   Riaccendere si fa solo se era spento davvero: `accendiSapere` accetta
   qualunque chiave, e passarle una tipologia di quiz scriverebbe una
   voce che non spegne niente e che nessuno andrebbe più a togliere. */
function ritoccaDalQuadro({ chiave, ritocco = 0, spenta = false }) {
  if (!chiave) return
  if (spenta) accendiSapere(chiave, false)
  else {
    if (saperiSpenti().includes(chiave)) accendiSapere(chiave, true)
    ritocca(chiave, ritocco)
  }
  giroEta.value++
}

/* ── e la ✎ di un gioco ──
   Non sposta niente di mezzo anno: dice **chi decide** se sta in casa.
   `'difetto'` toglie l'eccezione e lascia decidere all'età, che è il
   ripristino di una riga sola — quello di tutte insieme è il tasto in
   fondo al quadro. */
function fissaDalQuadro({ chiave, come }) {
  if (!chiave) return
  fissaGioco(chiave, come)
  giroEta.value++
}

/* ── rimettere tutto com'è di partenza ──
   Non tocca l'età e non tocca i progressi: butta le eccezioni — giochi
   messi a mano, pezzi di scuola tolti, domande spostate — e riparte dai
   valori della sua fascia. Il conto di cosa se ne va l'ha già mostrato
   il quadro prima di chiedere conferma, e viene dalla stessa funzione
   che qui scrive. */
function rimettiTutto() {
  const mossa = rimettiAiDifetti()
  giroEta.value++
  if (!mossa) return
  esito.value = { ok: true, testo: `Rimesso tutto com'è di partenza a `
    + `${inLettere(anniOra.value)}. I progressi non si sono toccati.` }
}

function apriRinomina(g) { chiudiTutto(); rinominando.value = g.id; nomeInCorso.value = g.nome }
function apriElimina(g) { chiudiTutto(); eliminando.value = g.id }

/* ── il bambino nuovo: la stessa schermata del primo avvio ──
   Qui c'era un modulo suo — nome, faccia, quattro carte — che era la
   copia peggiore di `components/Benvenuto.vue`: stessa domanda, altro
   disegno, e un tasto «Aggiungi» che si comportava diversamente. Il
   bambino nuovo nasceva e restava fermo; per farlo giocare bisognava
   uscire, tornare in home e sceglierlo, mentre lui guardava.

   Adesso si apre il wizard vero, a tutto schermo, e finisce **entrando
   in partita con lui**: è il motivo per cui si sta aggiungendo un
   bambino. Il codice dei genitori è già stato chiesto per arrivare fin
   qui, quindi non si chiede una seconda volta. */
function apriAggiungi() { chiudiTutto(); aggiungendo.value = true }
function fattoIlBambino() {
  aggiungendo.value = false
  /* `state.player` è cambiato, quindi `App.vue` rimonta questa
     schermata da capo e il codice torna a essere chiesto: si va in home
     invece di lasciare un tastierino davanti a chi ha appena finito. */
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

/* Da qui si elimina solo chi sta giocando adesso — è l'unico che ha una
   carta — quindi `eliminaGiocatore` sposta sempre `state.player` su
   qualcun altro (o su nessuno, se era l'ultimo). Restare fermi vorrebbe
   dire una schermata rimontata col tastierino davanti: si va in home,
   che è dove si sceglie chi gioca ed è la cosa da fare subito dopo. Ci
   pensa il `watch` di `App.vue`, che vale per ogni cambio di bambino. */
async function eliminaOra(g) {
  try {
    await eliminaGiocatore(g.id)
  } catch (e) {
    esito.value = { ok: false, testo: e.message }
  }
  chiudiTutto()
}

/* ── provare una domanda prima di decidere ──
   La scheda «Le domande» dice cosa esiste e a chi arriva; questo lo fa
   vedere. La domanda che si apre è quella vera, generata dallo stesso
   modulo che la darebbe al bambino: nessuno la scrive a mano e quindi
   nessuno se la dimentica aggiornata (`quiz/nucleo/esempi.js`).

   Provare non cambia niente: si guarda, si chiude, e la taratura è
   ancora dove stava.

   ── DUE SCHEDE DIVENTATE UNA ──
   Qui c'era anche «Cosa sa»: una carta per macrogruppo di scuola, con
   l'interruttore e le sottovoci. Mostrava **le stesse cose** della
   scheda delle domande dette in un altro modo — gli stessi gruppi, le
   stesse tipologie, gli stessi ritocchi — e due elenchi della stessa
   cosa sono due posti dove guardare e uno dove sbagliarsi. È rimasta
   quella per difficoltà, dove ogni riga porta con sé il ✕ che spegne
   il suo gruppo: spegnere un pezzo di scuola si fa da lì, e vale come
   prima anche per i giochi che leggono i saperi (il castello e le
   divisioni, il laboratorio e le conversioni). */
const prova = ref(null)          // { chiave, nome, eta } | { sorgente|giro|eta, nome } | null


/* Tutte le tappe aperte da subito. L'interruttore c'è e la scelta si
   salva nel profilo; i giochi però non lo leggono ancora, quindi per ora
   non cambia niente — ed è scritto sulla carta, perché un interruttore
   che sembra fare qualcosa e non la fa è peggio che non averlo. */
const aperto = computed(() => tuttoAperto())
function cambiaAperto() {
  accendiTuttoAperto(!aperto.value)
  esito.value = { ok: true, testo: aperto.value
    ? 'Segnato: tutte le tappe aperte. Ancora nessun gioco lo legge, quindi per ora non cambia niente.'
    : 'Tornato al normale: le tappe si aprono una per volta.' }
}

/* ── con che faccia si vede in mappa ──
   Si può cambiare solo per chi sta giocando adesso: il profilo degli
   altri fratelli non è caricato in memoria, e caricarlo solo per
   guardare un aspetto sarebbe un giro lungo per una carta che oggi non
   lo mostra. Sta nella carta di «Chi gioca» che ha la spunta 🎮, non
   quassù fra gli interruttori: è un attributo del bambino, come il nome,
   non una preferenza su cosa si vede in home. */
const aspettoAttuale = computed(() => aspettoDi())
function cambiaAspetto(nome) {
  if (nome === aspettoAttuale.value) return
  scegliAspetto(nome)
}

/* ── i giochi in prova ──
   Il cancello è uno per tutti. Chiuso, i giochi che ci stanno dietro non
   si elencano nemmeno: accendere il singolo non avrebbe nessun effetto,
   e un interruttore che non fa niente è peggio di un interruttore che
   non c'è. */
const inProva = computed(() => sperimentaliAccesi())
const sperimentali = computed(() =>
  inProva.value ? GIOCHI.filter(g => g.sperimentale) : [])
function cambiaProva() {
  accendiSperimentali(!inProva.value)
  esito.value = { ok: true, testo: inProva.value
    ? `I giochi in prova compaiono nella home di ${chi.value}. Sono a metà: aspettati che cambino.`
    : `I giochi in prova spariscono dalla home di ${chi.value}.` }
}
/* ── il calcolo a mente negli asteroidi ──
   Negli asteroidi le tabelline e i conti a mente stanno in una scaletta
   sola. Chi vuole solo le tabelline spegne qui: le tappe a mente
   spariscono dalla fila e i pianeti si richiudono in ordine, senza
   buchi. Non è un sapere spento (`data/saperi.js` dice cosa il bambino
   ha fatto a scuola, non che esercizi preferisce) e non è un gioco
   spento: la carta degli asteroidi resta in home. I progressi restano
   dove sono, e riaccendendo la fila torna intera. */
const menteAccesa = computed(() => varianteAccesa(CHIAVE_MENTE))
const quantiPianeti = SCALETTA.filter(v => v.tipo === 'pianeta').length
function cambiaMente() {
  accendiVariante(CHIAVE_MENTE, !menteAccesa.value)
  esito.value = { ok: true, testo: menteAccesa.value
    ? `Negli asteroidi ${chi.value} trova tutte e ${SCALETTA.length} le tappe.`
    : `Negli asteroidi restano i ${quantiPianeti} pianeti delle tabelline. ` +
      'I progressi a mente non si perdono: riaccendendo tornano dov\'erano.' }
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
  <!-- ── il bambino nuovo prende tutto lo schermo ──
       È la stessa schermata del primo avvio, e prende tutto lo schermo
       per lo stesso motivo per cui lo prende lì: chi la sta compilando
       sta rispondendo a tre domande di fila su un bambino che ancora
       non c'è, e avere dietro l'elenco delle impostazioni di un altro
       bambino è solo rumore. Non serve la barra: la via d'uscita ce
       l'ha dentro. -->
  <Benvenuto v-if="aggiungendo" :primo="false"
             @fatto="fattoIlBambino" @lasciaStare="aggiungendo = false" />

  <div v-else class="schermo">
    <Barra titolo="Impostazioni" :audio="false" @indietro="$emit('vai','home')" />

    <!-- ── il gradino ──
         Il titolo era «Solo per i grandi» e il codice sbagliato si
         annunciava in rosso: messe insieme, le due cose facevano di
         questa schermata un minigioco — c'è un segreto, e provare a
         indovinarlo dà una reazione a ogni tiro. Adesso dice cosa c'è
         dentro con la voce di un modulo da compilare, e sbagliare non
         risponde: aspetta (`store/pin.js`).

         Restava però una schermata che, a un bambino capitato qui, non
         diceva né di chi è né dove si torna: solo un tastierino e una
         freccia in cima. Adesso lo dice prima di tutto — «le cambia un
         grande», detto come si dice a chi ha girato la maniglia
         sbagliata, non come un divieto, che è pubblicità — e sotto il
         tastierino c'è la via d'uscita, larga uguale. -->
    <!-- ── il codice dimenticato ──
         Stesso tastierino, stessi quattro pallini, stessa attesa dopo uno
         sbaglio: al posto del codice si risponde a una domanda che si
         impara dopo le elementari. Non è una barriera — la risposta sta
         su internet — è la sola strada che un grande poco pratico
         percorre da solo, dal telefono, dentro l'app installata. Il
         ragionamento intero sta in `store/pin.js`. -->
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
      <!-- Dopo il primo sbaglio questo blocco non se ne va più: a
           tempo scaduto la barretta e il conto restano al loro posto,
           spenti. Sparendo si porterebbero dietro ottanta pixel, il
           tastierino salterebbe in su nell'istante esatto in cui torna
           a rispondere, e chi aveva il dito pronto premerebbe un altro
           numero. -->
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

      <!-- La via d'uscita, larga come il tastierino e sotto di esso: chi
           è arrivato qui senza il codice deve avere davanti una cosa da
           fare che non sia provare i numeri. La freccia della barra non
           basta — è piccola, sta in cima e vale per ogni schermata,
           quindi non dice «hai sbagliato porta, torna a giocare». -->
      <button class="bottone chiaro esci" data-azione="torna-ai-giochi"
              @click="$emit('vai','home')">← Torna ai giochi</button>

      <!-- Piccolo e ultimo, sotto la via d'uscita: chi il codice ce l'ha
           non deve nemmeno vederlo, e chi l'ha perso lo cerca. -->
      <button class="link" data-azione="codice-dimenticato" @click="apriRecupero">
        Non ricordi il codice?</button>
    </div>

    <!-- ── il codice nuovo: stesso tastierino, due giri ── -->
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

      <!-- ══ LA POSTA ══
           Quello che un grande deve sapere e che non ha nessun modo di
           venire a sapere: non c'è un server, non c'è un indirizzo di
           posta, e la famiglia che ha ricevuto il gioco da un'altra
           famiglia non la conosce nessuno. Sta in cima e non in una
           scheda sua: chi è entrato per un altro motivo la trova sulla
           strada. Perché una nota si scriva, vedi `guide/novita.js`. -->
      <div v-if="cePosta" class="posta" data-posta>
        <h2>C'è una cosa da dirti</h2>

        <div v-for="a in posta.avvisi" :key="a.quando" class="nota avviso">
          <b>Su questo telefono</b>
          <p>{{ a.testo }}</p>
          <small>{{ quando(a.quando) }}</small>
          <!-- un avviso che dice «guarda questa cosa» e non ci porta è
               metà avviso: la scheda si apre da qui, come per le note -->
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

        <!-- L'unica uscita, e per questo non c'è nessuna ✕ in giro: il
             nastro in home che manda qui non si può chiudere, così un
             bambino non può consumare l'ack per riflesso. Chi preme
             questo ha il codice, quindi è un grande. -->
        <button class="bottone" data-azione="ho-letto" @click="hoLetto">Ho letto</button>
      </div>

      <!-- ── TRE SCHEDE, E UNA SOLA TARA ──
           *Chi gioca su questo telefono*, *come sta andando*, *cosa gli
           arriva*. Erano tre anche prima ma dicevano un'altra cosa:
           «Domande» era l'elenco delle classi con quattro tondi per
           riga, «Giochi» una fila di interruttori, e tutte e due
           tornavano a dire quello che il quadro dell'età diceva già —
           con l'aggravante di una **seconda tacca dell'età**, che è
           esattamente il difetto (due manopole per la stessa cosa) che
           la manopola era nata per togliere.

           Adesso si tara in un posto solo, ed è il quadro: l'età in
           cima e la ✎ su ogni riga. La prima scheda non lo ospita più —
           ci si arrivava scorrendo due schermate di elenchi per
           cambiare il nome a un bambino — e tiene solo la riga che dice
           quanti anni ha, col rimando.

           L'ordine è quello in cui si legge: **chi è**, **cosa gli
           diamo**, **come sta andando**. «Come va» in fondo e non in
           mezzo perché è l'unica che non si tocca: si guarda, e semmai
           rimanda alla seconda col tasto già pronto. -->
      <div class="schede">
        <button :class="{ ora: scheda === 'bambini' }" data-scheda="bambini"
                @click="scheda = 'bambini'">Bambini</button>
        <button :class="{ ora: scheda === 'giochi' }" data-scheda="giochi"
                @click="scheda = 'giochi'">Giochi e domande</button>
        <!-- ══ «Come va», sospeso ══
             C'era un terzo tab: le tipologie che il bambino sbaglia
             quasi sempre o indovina quasi sempre, col tasto già pronto
             per ritoccarle (`quiz/ComeVa.vue`, e le soglie in
             `quiz/consiglio.js`). Il pezzo funziona ed è provato — il
             suo test sta in `test/integrazione/come-va.spento.mjs`, che
             si riaccende rinominandolo `.test.mjs` — ma il modo di
             presentarlo è da rivedere, quindi per ora non si mostra a
             nessuno invece di mostrarsi a metà. Si riaccende
             rimettendo questo bottone e il suo ramo qui sotto. -->
      </div>

      <!-- ══════════ scheda: i bambini ══════════ -->
      <template v-if="scheda === 'bambini'">
      <h2>Chi gioca</h2>
      <!-- ── UNA CARTA SOLA, E UN ELENCO ──
           Qui c'era il roster intero: tre bambini, ognuno con «Cambia
           nome» ed «Elimina» addosso, e sotto quello che stava giocando
           anche l'età, la faccia e un tasto che riscriveva tutto. Sei
           bottoni per tre righe, in una schermata dove tutto il resto
           parla di un bambino solo — e per giunta metà di quei comandi
           funzionava solo per uno dei tre, perché il profilo degli altri
           in memoria non c'è.

           Adesso è come il resto della schermata: **parla di chi sta
           giocando adesso**. Gli altri sono una riga di nomi, e si
           passa a loro da dove si è sempre fatto, cioè la home — che è
           anche l'unico posto dove un bambino può farlo da sé. -->
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
              <!-- ── l'età, qui, è solo una riga ──
                   La manopola col quadro sotto è alta due schermate, e
                   stava in mezzo alla carta di chi gioca: per cambiare
                   il nome a un bambino bisognava scorrere tutto
                   l'elenco delle domande. Qui resta la sola cosa che
                   serve leggere — quanti anni ha, che è la taratura e
                   non un'anagrafe — e il rimando alla scheda dove si
                   cambia. -->
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

        <!-- ── gli altri ──
             Nomi e basta: cambiarne uno vuol dire prima passare a lui,
             e si passa dalla home. Sono due tocchi in più su un gesto
             che si fa una volta l'anno, e in cambio nessuno modifica
             per sbaglio il bambino sbagliato — che è il guasto che
             questa riga di nomi rende impossibile. -->
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

        <button class="carta" @click="file.click()">
          <span class="ico">📂</span>
          <b>Rimetti da un file</b>
          <i>Sostituisce i progressi con quelli salvati</i>
        </button>
        <input ref="file" type="file" accept="application/json,.json" hidden @change="importa">

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

        <!-- Ricominciare UN gioco solo, che non è la stessa cosa di
             cancellare tutto. Sta in un blocco a sé e non dentro la catena
             qui sopra: infilata lì in mezzo spezzava il `v-else` del
             cancella-tutto, che smetteva di comparire — e il tasto rosso
             sembrava non fare niente. Compare solo se quel bambino la
             fattoria l'ha davvero aperta. -->
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

      <!-- ══ il cestino ══
           «Non si torna indietro» sulla carta rossa qui sopra non è più
           vero, ed è deliberato: chi cancella per sbaglio i progressi di
           un bambino è quasi sempre un grande stanco, non un bambino
           entrato di nascosto. Compare solo se c'è qualcosa dentro. -->
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

      <!-- ══ passarlo ad altri ══
           Sta qui dentro perché è roba da grandi, ma la stessa cosa c'è
           anche in «Come funziona», che è fuori dal codice: chi riceve il
           gioco da un'altra famiglia non ha motivo di conoscere il PIN, e
           il primo bisogno di un genitore nuovo è installarlo. -->
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

      <!-- ── SE QUALCOSA SI ROMPE ──
           Un guasto su un telefono che non è il tuo è, di solito, il
           racconto di un bambino: «si è piantato». Qui c'è scritto cosa
           è successo davvero, con l'ora e la versione, e sotto il tasto
           che rimette a posto la copia dell'app senza toccare i
           progressi. La sezione compare solo quando c'è qualcosa da
           dire: una riga «nessun guasto» sarebbe una riga in più da
           leggere ogni volta per non sapere niente. -->
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

      <!-- ── DIRMELO ──
           Questa sta fuori dal `v-if` di sopra, e il motivo è tutto qui:
           i guasti che il gioco si annota sono quelli che lanciano un
           errore, e la metà delle cose che non vanno non ne lancia
           nessuno — un livello troppo difficile, una parola sbagliata,
           un tasto che risponde ma fa la cosa storta. Se il modo di
           dirmelo comparisse solo quando c'è già un errore in archivio,
           mancherebbe esattamente quando serve di più. -->
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
      <template v-else>
      <!-- ── L'UNICO POSTO DOVE SI TARA ──
           L'età in cima e, sotto, il quadro di quell'età: i giochi in
           casa e le domande divise per come cadono rispetto a lui, ogni
           riga con la sua ✎. Qui c'erano due elenchi di interruttori —
           uno per gioco e uno per classe di domande — che dicevano le
           stesse cose in un modo che non si poteva confrontare con
           niente: la carta «Difendi il Castello» spenta non diceva che a
           quell'età sarebbe comparsa comunque, e la riga di una domanda
           non diceva a chi arrivava. -->
      <h2>Quanti anni ha</h2>
      <p class="mini">È la taratura, non un'anagrafe: decide quali giochi trova in home
        e quanto sono difficili le domande. Sotto c'è il quadro di quell'età — e ogni
        riga si può correggere con la ✎, se per {{ chi }} non è così.</p>

      <!-- `risposte` è com'è andata finora, tipologia per tipologia: le
           righe che vanno male portano il loro numero accanto al nome.
           È lo stesso conto dell'avviso che arriva in posta, quindi chi
           entra da lì ritrova qui la riga di cui parlava. -->
      <ManopolaEta :anni="anniOra" :giochi="settaggi.giochi || {}"
                   :sa="settaggi.sa || {}" :ritocchi="settaggi.ritocchi || {}"
                   :risposte="state.profile?.items || {}"
                   :sperimentali="inProva" conferma tarabile
                   @scegli="applicaAnni" @prova="prova = $event"
                   @ritocca="ritoccaDalQuadro" @gioco="fissaDalQuadro"
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

        <!-- ── un modo di giocare, dentro un gioco ──
             Non spegne una carta e non spegne un pezzo di scuola: spegne
             metà di un gioco. Sta fra gli interruttori di casa perché non
             dipende dall'età — a nessuna età «solo le tabelline» diventa
             vero o falso. -->
        <button class="carta interruttore" :class="{ spento: !menteAccesa }"
                data-flag="mente" @click="cambiaMente">
          <span class="ico">🧠</span>
          <b>Negli asteroidi, anche i conti a mente</b>
          <i>{{ menteAccesa
                ? 'La scaletta è intera: ' + SCALETTA.length + ' tappe, tabelline e conti a mente'
                : 'Solo le tabelline: ' + quantiPianeti + ' pianeti in fila. I progressi a mente restano' }}</i>
          <span class="leva"><span class="pallina"></span></span>
        </button>

        <button class="carta interruttore" :class="{ spento: !aperto }"
                data-flag="tuttoAperto" @click="cambiaAperto">
          <span class="ico">🔓</span>
          <b>Sblocca tutti i livelli</b>
          <i>{{ aperto ? 'Segnato — nessun gioco lo legge ancora: per ora non cambia niente'
                       : 'Le tappe si aprono una per volta, come adesso' }}</i>
          <span class="leva"><span class="pallina"></span></span>
        </button>
      </div>

      <!-- ── GIUDICARE LE DOMANDE ──
           L'altra metà di quello che non va, e quella che nessun errore
           segnala: una domanda giusta ma fuori misura. Il difetto non lo
           vede il gioco — per lui la domanda è ineccepibile — lo vede
           solo chi sta seduto di fianco mentre il bambino ci sbatte, e
           finora finiva su un foglietto. Acceso l'interruttore, tre
           tastini sopra ogni domanda: il verdetto lo dà il grande, tutto
           il resto (modulo, grado, tipologia, tempo, esito) se lo
           annota il gioco da solo. -->
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

      <p v-if="esito" :class="esito.ok ? 'mini' : 'avviso'">{{ esito.testo }}</p>
    </div>

    <!-- il pannello di prova copre tutto: si è entrati per guardare una
         cosa sola. Sta fuori dalle schede perché non è di nessuna delle
         due: è un modo di leggere una voce, non un'impostazione. -->
    <Prova v-if="prova" :chiave="prova.chiave || ''" :nome="prova.nome"
           :sorgente="prova.sorgente || null" :giro="prova.giro || null"
           :eta="prova.eta ?? null" @chiudi="prova = null" />
  </div>
</template>

<style scoped>
/* ── la riga che rimanda alla taratura ──
   Non è un interruttore e non è una carta: è una frase con un rimando,
   e si legge come tale. Quello che c'era prima al suo posto — la
   manopola col quadro sotto — era alto due schermate in mezzo alla
   carta di chi gioca. */
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

/* ── la posta ──
   Un blocco, non una carta: si legge, non si tocca. Il colore è quello
   dei nastri di casa e non un rosso d'allarme — non è mai urgente, e
   una cosa che grida ogni volta smette di essere letta. */
.posta { width:100%; max-width:400px; margin:0 0 16px; text-align:left }
.posta h2 { margin:0 0 8px }
.nota { background:#eef4ff; border:2px solid #cfe0f8; border-radius:14px;
        padding:11px 13px; margin-bottom:9px }
.nota.avviso { background:#fff2ee; border-color:#f6cdbe }
.nota b { display:block; font-size:14.5px; margin-bottom:4px }
.nota p { margin:0; font-size:13px; line-height:1.45 }
.nota small { display:block; margin-top:6px; font-size:11px; opacity:.6 }
.nota .bottone { margin-top:9px }

/* la domanda del codice dimenticato: più grande del testo intorno perché
   è la cosa a cui si sta rispondendo, e non un'istruzione */
.domanda { font-size:16px; font-weight:700; margin:2px 0 12px; text-align:center; max-width:300px }

.tastierino { display:grid; grid-template-columns:repeat(3,1fr); gap:11px; width:100%; max-width:260px }
.tasto { height:58px; border-radius:16px; background:#ffffffdd; color:var(--viola-scuro);
         font-size:23px; font-weight:800; box-shadow:0 4px 0 #d4dce6 }
.tasto:active { transform:translateY(2px); box-shadow:0 2px 0 #d4dce6 }
.tasto.canc { font-size:19px; color:var(--tenue) }
/* durante l'attesa il tastierino resta dov'è, spento: toglierlo di
   mezzo farebbe pensare a una schermata rotta, e chi guarda deve
   vedere che i tasti ci sono e che adesso non rispondono */
.tastierino.spento { opacity:.45 }
.tastierino.spento .tasto { box-shadow:0 4px 0 #d4dce6 }

/* niente rosso e niente punto esclamativo: è una porta chiusa, non un
   errore. La barretta è l'unica cosa che si muove — due secondi muti
   sono indistinguibili da un tasto rotto. */
.fermo { display:flex; flex-direction:column; align-items:center; gap:7px;
         width:100%; max-width:260px; margin:2px 0 }
.fermo small { font-size:12px; color:var(--tenue); opacity:.8 }
.fermo .barretta { display:block; width:100%; height:7px; border-radius:999px;
                   background:#ffffffcc; box-shadow:inset 0 0 0 1px #d4dce6; overflow:hidden }
.fermo .barretta i { display:block; height:100%; border-radius:999px;
                     background:var(--tenue); opacity:.55; transition:width .1s linear }
/* a tempo scaduto restano lì, invisibili: tengono il posto e basta */
.fermo .muta { visibility:hidden }

/* larga quanto il tastierino e subito sotto: è il tasto più grande della
   schermata, così la cosa ovvia da fare qui è andarsene */
.esci { width:100%; max-width:260px; margin-top:4px; font-size:16px; padding:13px 18px }

/* le due linguette: quella aperta è piena, l'altra è solo scritta —
   non c'è modo di sbagliarsi su dove si è */
/* tre schede stanno larghe uguali su un telefono da 390: il testo
   scende di un punto, il resto non cambia */
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
/* la carta di un sapere ha una riga in più: l'esempio di una domanda
   che sparisce, che è quello che fa capire cosa si sta spegnendo */
.carta.sapere { grid-template-rows:auto auto auto; padding:12px 16px }
.carta.sapere .ico, .carta.sapere .leva { grid-row:1/4 }
.carta.sapere small { font-size:11.5px; color:var(--tenue); opacity:.85 }
.carta.sapere.spento { opacity:.62 }

/* ── il dettaglio di un gruppo ──
   Sta sotto la sua carta e non è una carta a sua volta: deve leggersi
   come «dentro questo», non come «un'altra cosa allo stesso livello».
   Da qui il rientro, lo sfondo più tenue e la leva più piccola. */
/* Erano due scrittine da 12px senza sfondo, e una scrittina non si legge
   come un tasto: la si scavalca, e l'elenco delle domande di un gruppo
   restava una cosa che nessuno apriva. Adesso sono tasti veri — alti
   quanto un dito, con il loro fondo — e dicono **quante** domande ci
   sono dentro, che è la ragione per aprirli. */
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
/* ── la difficoltà di una voce ──
   Un numero e un pallino, sulla riga di sotto insieme al modulo. La
   prima versione era una barretta a segmento in fondo alla riga, e due
   cose non tornavano: rubava al nome la metà della larghezza (su un
   telefono i nomi lunghi andavano a capo tre volte), e a difficoltà 100
   il segmento partiva dal bordo destro e spariva sotto l'`overflow`.
   Il pallino colorato dice la stessa cosa in dodici pixel, e il numero
   dice il resto — un intervallo dove la tipologia esce a più gradi,
   perché una media non corrisponde a nessuna domanda vera. */
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

/* ── i due tasti che non spengono niente ──
   Sotto la carta, in fila e in piccolo: chi è venuto a spegnere tocca
   la carta e non li legge nemmeno, chi non sa cosa sta spegnendo li
   trova lì. Il rientro è lo stesso del dettaglio, così si vede che
   parlano della carta di sopra. */
.azioni-sapere { display:flex; align-items:center; gap:4px; flex-wrap:wrap;
                 margin:-6px 0 0 14px }
/* dentro la riga il rientro ce l'ha già il contenitore */
.azioni-sapere .dettaglio-tasto { margin:0 }
.prova-tasto { padding:8px 14px; min-height:40px; font-size:13px; font-weight:750;
               color:var(--viola); background:#7c5cff1f; border-radius:999px }
.prova-tasto:active { transform:translateY(1px) }
/* nel dettaglio la riga è stretta: resta il solo triangolino, e il
   nome della voce lo dice l'`aria-label` a chi legge con le orecchie.
   Colorato come il tasto grande, però: grigio si leggeva come «apri
   questa riga», e invece è la stessa cosa di sopra. */
.dettaglio .voce-riga { display:flex; align-items:center; gap:2px; background:var(--carta) }
.dettaglio .voce-riga .voce { flex:1; min-width:0 }
.prova-tasto.solo-segno { flex:none; padding:10px 14px; font-size:12px; border-radius:0;
                          background:none; color:var(--viola) }

/* sette carte di fila: più basse, e quelle spente si vedono da lontano */
.carta.gioco { padding:11px 16px }
.carta.gioco .ico { font-size:25px }
.carta.gioco.spento { opacity:.62 }
/* spento da un macrogruppo, non dai genitori: la leva è ferma e il
   motivo sta scritto sulla carta */
.carta.gioco.bloccato i { color:#b23a5a }
.carta.gioco.bloccato .leva { background:#e3dce8 }
/* un gioco in prova lo dice sulla carta: chi lo accende deve sapere che
   quello che troverà è a metà */
.carta.gioco.prova b small { margin-left:6px; font-size:10px; font-weight:900; letter-spacing:.4px;
                             text-transform:uppercase; color:#8a6a1f; background:#fff2cf;
                             border-radius:7px; padding:2px 6px; vertical-align:middle }

/* ── il libretto dei guasti ──
   Una carta che si legge, non che si preme: il testo dell'errore va a
   capo quanto serve e resta in monospazio, perché è roba da girare a chi
   ci mette le mani, non da capire a colpo d'occhio. */
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

/* l'unica carta che è un link e non un tasto: da sola prenderebbe il blu
   e la sottolineatura del browser, e in mezzo alle altre si leggerebbe
   come una cosa d'altro tipo */
.carta.segnala { text-decoration:none; color:inherit }
/* e l'unico bottone che è un link, per lo stesso motivo: «Manda» apre il
   modulo fuori dal gioco, ma in fila con «Copia» e «Cancella» deve
   sembrare uno dei tre */
a.bottone { text-decoration:none; display:inline-flex; align-items:center;
            justify-content:center }

/* ── da dove parte un bambino ──
   Tre righe da leggere e non tre pastiglie da premere: la differenza fra
   «terza» e «quarta» sta tutta nella riga sotto, e chi sceglie senza
   leggerla sceglie a caso. Per questo la scritta piccola c'è sempre,
   anche sulla scelta non selezionata. */
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
/* il consiglio si vede che è un'altra cosa dal resto della carta: non
   è una descrizione, è un fatto misurato più un tasto */
.carta.sapere.quanto > em.consiglio { color:var(--viola-scuro); font-weight:650 }
.fai { border:none; background:none; font-family:inherit; font-size:11px; font-weight:800;
       color:var(--viola); text-decoration:underline; padding:2px 0; cursor:pointer }
.livello:active { transform:translateY(1px) }


/* Cancellare non deve somigliare alle altre due: si vede da lontano che è
   quella che fa danni. */
.carta.pericolo b { color:#b23a5a }
.carta.pericolo.aperta { display:flex; flex-direction:column; gap:9px; align-items:center;
                         text-align:center; background:#fff0f3 }
.carta.pericolo.aperta i { max-width:34ch }
.bottone.rosso { background:linear-gradient(180deg,var(--rosso),#d63a5c); color:#fff;
                 box-shadow:0 6px 0 #a82a46; font-size:16px; padding:13px 22px }
.bottone.rosso:active { box-shadow:0 3px 0 #a82a46 }
.bottone.chiaro { font-size:16px; padding:13px 22px }

/* ── chi gioca ──
   La carta di un giocatore ha una riga in più delle altre: sotto il nome
   ci stanno i suoi tre gesti. I bottoni vanno a capo da soli, perché
   «Passa a Federica» più altri due su un telefono stretto non ci stanno
   in fila — ed è lo stesso motivo per cui la fila in home ora va a capo. */
.carta.chi-gioca { grid-template-rows:auto auto auto }
.carta.chi-gioca .ico { grid-row:1/4 }
.carta.chi-gioca .riga { grid-column:2; justify-content:flex-start; margin-top:7px }
.carta.chi-gioca .bottone { font-size:14px; padding:9px 15px; box-shadow:0 4px 0 #d4dce6 }
.carta.chi-gioca .bottone:active { transform:translateY(2px); box-shadow:0 2px 0 #d4dce6 }
/* l'aspetto è un quarto rigo che solo chi sta giocando adesso ha: le
   altre carte restano a tre righe, quindi occupa colonna intera invece
   di lasciare l'icona a mezz'aria sotto di sé */
.carta.chi-gioca .aspetto-sezione { grid-column:1/3; margin-top:9px;
  padding-top:9px; border-top:1px solid #8593a822 }
.carta.chi-gioca .aspetto-sezione .mini { text-align:left; margin:0 0 7px }
/* la carta aperta a scrivere un nome: stessa forma di quella che chiede
   conferma prima di cancellare, senza il rosso */
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
</style>
