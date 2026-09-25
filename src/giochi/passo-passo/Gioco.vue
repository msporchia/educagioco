<script setup>
/* ═══════════════════════════════════════════════════════════════════
   PASSO PASSO — IL COORDINATORE

   Il bambino compone una fila di frecce, preme ▶, e il coniglio la
   esegue **dall'inizio**, sempre: è un programma, non un telecomando.
   Mentre corre, la tessera che sta girando si accende. Se sbatte o fa
   splash, la tessera colpevole lampeggia, il coniglio fa la sua
   scenetta e torna alla partenza; al giro dopo la parte già vista e già
   riuscita scorre tre volte più veloce. Se la fila finisce prima della
   tana il coniglio si ferma e si chiede «e adesso?»: non è un errore, è
   un programma non finito.

   Dal gradino del ripeti la fila ha le **scatole** dei cicli e lo
   **zaino**: le modifiche col dito passano da `motore/fila.js` (pure:
   una scatola si toglie intera, la N nasce da scegliere), e mentre il
   coniglio corre la testa di ogni scatola dice a che giro è (`giri`).

   Questo file decide **quando** succedono le cose e cosa valgono: è
   l'unico che sa che esistono le monete, le stelle salvate e i
   contatori dell'albo. Le regole stanno in `motore/`, il disegno e i
   tempi in `scena/`, le schermate in `viste/`.

   ── NIENTE PUNIZIONI ──────────────────────────────────────────────
   Niente tempo, niente vite, niente partita persa. Sbagliare fa
   riprovare, e il suono dello sbaglio è un tonfo morbido, mai
   `suono.no()`: quello che insegna è guardare quale tessera lampeggia,
   e quella si vede anche a volume spento.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, shallowRef, computed, nextTick, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { state, addCoins, segna, segnaBest, tappaAperta, spendi } from '../../store/profile.js'
import { progresso, aperta, adesso, stelleDi, completa, primatoDi, segnaPrimato, ricorda } from '../campagne.js'
import { fraseDiFine, primatoInParole } from '../primati.js'

import { SENZA_FINE } from './gioco.js'
import { CAMPAGNA, SCALINI, QUANTE_TAPPE, TAPPE_PICCOLE, TAPPE_PRIME, tappeDelloScalino,
         FILE, FILA_ATTUALE, riordina } from './dati/campagna.js'
import { MASSIMO_FILA, LEGENDA } from './dati/mondo.js'
import { apri, apriSe, carteDi, conCicli, daScegliere, eApri, eSe, valoreDi, COLORI } from './dati/carte.js'
import { Livello } from './motore/livello.js'
import { esegui, stelleDellaVittoria, eCorta, TANA, SBATTE, SPLASH, PERSA, eErrore } from './motore/mondo.js'
import { mettiCarta, mettiScatola, togliPrima, scegliTesta } from './motore/fila.js'
import { suggerisci, minimoDi, carteUsate } from './motore/risolutore.js'
import { scalaDi, pensieroDi, dove, pezzoDiStrada } from './motore/aiuti.js'
import { mancano, chiedeConferma, SVELA } from '../aiuti.js'
import { generaSentiero, caso } from './motore/generatore.js'
import { Proiezione } from './scena/proiezione.js'
import { Regia } from './scena/regia.js'

import Mappa from './viste/Mappa.vue'
import Campo from './viste/Campo.vue'
import Finale from './viste/Finale.vue'
import './stile.css'

defineOptions({ name: 'PassoPasso' })
const emit = defineEmits(['vai'])

const CHIAVE = 'passo'
/* la finestra cieca di sempre (CLAUDE.md): una schermata appena comparsa
   non si lascia toccare subito, perché il dito che ha appena premuto si
   lascia dietro un tocco */
const CIECA = 320
/* quanto vale un sentiero senza fine vinto: un sentiero nuovo è
   esercizio vero (vedi `CALIBRAZIONE.md`), e ne chiede mezzo minuto */
const PREMIO_SENTIERO = 3

/* ═══════════ dove siamo ═══════════ */
const vista = ref('mappa')          // mappa | campo
const tappaIdx = ref(-1)            // -1 = il sentiero senza fine
const tappa = shallowRef(null)      // il dato del livello in gioco
const fila = ref([])
const cursore = ref(0)
const corrente = ref(-1)            // la tessera che sta girando
const guasto = ref(null)            // dove la fila si è fermata male
const inCorsa = ref(false)
/* la scala del 💡 (`motore/aiuti.js`): a che gradino si è, se in questo
   ingresso si è pagato qualcosa (la serie del sentiero e «Ci penso io»
   contano chi non ha comprato niente), e se la strada intera l'ha scritta
   il gioco (la terza stella) */
const presi = ref(0)
const pagato = ref(false)
const svelato = ref(false)
const pensiero = ref(null)          // la frase del gradino, sopra la mappa
const armato = ref(false)           // un gradino caro aspetta il secondo tocco
const poveroScossa = ref(0)         // 💡 senza monete: il prezzo sobbalza
const brilla = ref(null)            // la freccia (o ▶) che l'aiuto accende
const sospette = ref(false)         // l'aiuto ha messo il cursore in mezzo alla fila
const aiutoInCoda = ref(false)      // il 💡 premuto mentre il coniglio corre
const colpo = ref(0)                // quante volte si è premuto il 💡: ogni volta risponde
const consiglio = ref(null)         // la carta che l'aiuto propone, in trasparenza nella fila
/* lo zaino e le scatole */
const scelta = ref(null)            // la scatola di cui si sta scegliendo il numero
const consiglioValore = ref(null)   // il numero (o il colore) che l'aiuto accende nella scelta
const consiglioTesta = ref(null)    // la scatola a cui l'aiuto cambia il numero
const giri = ref(null)              // a che giro sono le scatole: mentre corre, o dove si è fermata
const scossa = ref(0)               // ▶ fermato da una N ancora da scegliere
const finale = ref(null)
const partito = ref(false)          // in questo livello si è già premuto ▶

let liv = null
let cieco = false
let sbarra = 0
let esitoInCorsa = null
let partitoAlle = 0
let passoCorrente = -1              // il passo che sta girando (coi cicli non è la carta)
/* il coniglio sta entrando nella tana: la partita è vinta anche se la
   festa non è finita. Un ■ in quel secondo non risponde, e un ← scrive
   la vittoria prima di uscire — una tana che il bambino ha appena visto
   raggiungere non si butta via. Non la si scrive subito, però: scrivere
   vuol dire anche guardare i traguardi, e il cartello di un traguardo a
   metà festa coprirebbe il coniglio che entra in casa. */
let inTana = false
/* il giro di prima: serve a far correre veloce la parte già vista */
let ultimoGiro = null               // { passi: [{ i, mossa }], riusciti }

/* il sentiero senza fine */
const sentieri = ref(0)             // quanti in questa seduta
const serie = ref(0)                // di fila, senza aiuti
let semeSeduta = 1
let chiusaDallAiuto = null          // la frase di quando l'aiuto ha chiuso la serie

const avanza = progresso(CHIAVE)
/* chi ha giocato con la fila di prima (senza le pecore) ritrova le
   stelle sui livelli giusti, e resta alla tappa dov'era: le pecore gli si
   aprono alle spalle (`riordina` in `dati/campagna.js`) */
if (avanza.cfg.fila !== FILA_ATTUALE) {
  const vecchia = FILE[avanza.cfg.fila || 1]
  if (vecchia && ((avanza.tappa || 0) > 0 || Object.keys(avanza.stelle || {}).length))
    Object.assign(avanza, riordina(avanza, vecchia))
  ricorda(CHIAVE, 'fila', FILA_ATTUALE)
}
const sentiero = computed(() => tappaIdx.value < 0)
/* quante carte tiene la fila: lo zaino, dove c'è, se no il tetto tecnico */
const piena = computed(() => (tappa.value && tappa.value.zaino
  ? carteDi(fila.value) >= tappa.value.zaino : fila.value.length >= MASSIMO_FILA))
const valoreOra = computed(() => (scelta.value != null ? valoreDi(fila.value[scelta.value]) : null))
const sceltaTipo = computed(() => (scelta.value != null && eSe(fila.value[scelta.value]) ? 'se' : 'ripeti'))
/* i colori delle lastre che ci sono in questa mappa: la scelta della
   testa offre solo quelli, un colore che non c'è non si può aspettare */
const colori = computed(() => {
  const qui = new Set(((tappa.value && tappa.value.mappa) || []).join('').split('')
    .map(ch => (LEGENDA[ch] || {}).lastra).filter(Boolean))
  return COLORI.filter(c => qui.has(c))
})
/* Il sentiero senza fine si apre alla fine delle buche, e senza
   guardare l'età: è dei piccoli, e le tappe dello zaino che vengono dopo
   sono chiuse fino agli otto anni. Legarlo alla campagna intera, come
   quando la campagna finiva alle buche, o alla fine delle pecore arrivate
   dopo, l'avrebbe chiuso proprio a chi l'aveva già aperto. */
const sentieroAperto = () => tappaAperta(TAPPE_PRIME, avanza.tappa)

/* ═══════════ la mappa ═══════════ */
const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    aperta: aperta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

const statoSentiero = computed(() => ({
  aperto: sentieroAperto(),
  record: primatoInParole(primatoDi(CHIAVE), SENZA_FINE.misura),
  quante: TAPPE_PRIME,
  fatte: Math.min(avanza.tappa, TAPPE_PRIME),
  /* sulla mappa sta dopo le buche */
  dopo: CAMPAGNA[TAPPE_PRIME - 1].scalino,
}))

/* ── la manina della prima volta ──
   Chi apre il primo livello per la prima volta non sa leggere e non sa
   cosa fare: una manina indica la freccia, poi ▶. Non blocca niente, non
   si chiude, non dice niente — e sparisce al primo ▶, per non tornare
   più: da lì in poi si impara giocando. È la riga dei primi passi del
   castello, detta a chi non legge. */
const manina = computed(() => {
  if (inCorsa.value || finale.value) return null
  /* e la prima scatola: chi arriva allo zaino non sa che il 🔁 esiste,
     e lo scopre con lo zaino pieno. La manina lo indica finché nella
     fila non c'è una scatola */
  if (tappaIdx.value === TAPPE_PICCOLE && stelleDi(CHIAVE, TAPPE_PICCOLE) === 0)
    return conCicli(fila.value) || scelta.value != null ? null : 'ripeti'
  if (tappaIdx.value !== 0 || avanza.tappa > 0 || partito.value) return null
  return fila.value.length ? 'via' : 'destra'
})

const titolo = computed(() => {
  if (vista.value !== 'campo' || !tappa.value) return 'Passo passo'
  if (sentiero.value) return `♾️ ${sentieri.value + 1} · ${tappa.value.nome}`
  return `${tappaIdx.value + 1}. ${tappa.value.nome}`
})

/* ═══════════ i suoni ═══════════
   Sintetizzati, morbidi, e **nessuno dice niente che non si veda già**:
   il salto si vede saltare, lo splash si vede spruzzare. Col volume a
   zero il gioco è intero. Nella parte che scorre veloce i passi non
   suonano: tre volte al secondo sarebbero una mitragliatrice. */
let ultimoSuono = ''
const SUONI = {
  passo: () => suono.nota(392, 392, 0.05, 'triangle', 0.035),
  spinta: () => suono.rumore(0.22, 0.05, 520, 160),
  affonda: () => suono.nota(300, 110, 0.35, 'sine', 0.08),
  scivola: () => suono.rumore(0.3, 0.025, 2600, 900),
  salto: () => suono.nota(330, 700, 0.2, 'sine', 0.07),
  carota: () => { suono.nota(988, 1319, 0.1, 'triangle', 0.08); suono.nota(1319, 1568, 0.12, 'triangle', 0.07, 90) },
  buca: () => { suono.nota(700, 200, 0.22, 'sine', 0.07); suono.nota(200, 700, 0.22, 'sine', 0.06, 380) },
  sbatte: () => suono.nota(210, 160, 0.14, 'triangle', 0.09),
  tuffo: () => suono.rumore(0.4, 0.07, 1500, 250),
  tana: () => suono.ok(),
  /* la pecora che scappa fa un saltello; quella che non può, un «bee»
     che trema; quella incastrata un «bee» che scende */
  fugge: b => (b.e.ferma ? suono.nota(520, 500, 0.18, 'sawtooth', 0.025)
    : b.e.dentro ? suono.nota(784, 1047, 0.12, 'triangle', 0.06)
    : suono.nota(460, 620, 0.08, 'triangle', 0.04)),
  incastrata: () => suono.nota(480, 300, 0.4, 'sawtooth', 0.03),
  gregge: () => suono.ok(),
}
function suonaBattuta(b) {
  const che = b.e.che
  const prima = ultimoSuono
  ultimoSuono = che
  if (b.veloce && (che === 'passo' || che === 'scivola' || che === 'fugge')) return
  /* una scivolata è una fila di celle: suona la prima e basta */
  if (che === 'scivola' && prima === 'scivola') return
  SUONI[che]?.(b)
}

/* ═══════════ la regia ═══════════ */
const campo = ref(null)
const regia = new Regia({
  battuta: b => {
    suonaBattuta(b)
    if (b.e.che === 'tana') inTana = true
  },
  corrente: (i, n, g) => {
    corrente.value = i
    passoCorrente = n
    giri.value = g && g.length ? g : null
  },
  guasto: () => { if (esitoInCorsa) guasto.value = esitoInCorsa.dove },
  fine: () => fineGiro(),
})
onUnmounted(() => {
  regia.spegni()
  clearTimeout(sbarra)
  clearTimeout(timerArmato)
  vintaAMeta()
  if (sentiero.value) chiudiLaSerie()
})

function finestraCieca() {
  clearTimeout(sbarra)
  cieco = true
  sbarra = setTimeout(() => { cieco = false }, CIECA)
}

/* ═══════════ entrare in un livello ═══════════ */
function entra(t, indice) {
  tappa.value = t
  tappaIdx.value = indice
  liv = Livello.da(t)
  fila.value = []
  cursore.value = 0
  corrente.value = -1
  guasto.value = null
  inCorsa.value = false
  presi.value = 0
  pagato.value = false
  svelato.value = false
  pensiero.value = null
  disarma()
  ultimaCarta = null
  brilla.value = null
  sospette.value = false
  aiutoInCoda.value = false
  consiglio.value = null
  scelta.value = null
  consiglioValore.value = null
  consiglioTesta.value = null
  giri.value = null
  finale.value = null
  partito.value = false
  ultimoGiro = null
  passoCorrente = -1
  esitoInCorsa = null
  inTana = false
  chiusaDallAiuto = null
  vista.value = 'campo'
  finestraCieca()
  nextTick(() => {
    regia.attacca(campo.value && campo.value.tela)
    regia.prepara(liv, t.tema)
    regia.avvia()
  })
}

const avviaTappa = i => entra(CAMPAGNA[i], i)

/* ═══════════ comporre la fila ═══════════
   Ogni tocco passa da `motore/fila.js`, che dice com'è la fila dopo: è
   lì che sta scritto cosa toglie ⌫ quando prima del cursore c'è una
   scatola (tutta) o la sua testa (il 🔁 e basta). */
const metti = r => { fila.value = r.fila; cursore.value = r.cursore }

/* una freccia, un salto — o, dal consiglio del 💡, una scatola già con
   la sua testa */
function freccia(t) {
  if (inCorsa.value || cieco || finale.value || piena.value) return
  if (eApri(t)) return scatola(eSe(t) ? 'se' : 'ripeti', t)
  metti(mettiCarta(fila.value, cursore.value, t))
  scelta.value = null
  cambiata()
  suono.nota(t.startsWith('salto-') ? 587 : 523, t.startsWith('salto-') ? 587 : 523, 0.06, 'triangle', 0.05)
}

/* 🔁 o ❓: una scatola dove sta il cursore, col cursore dentro. La testa
   nasce da scegliere e la scelta si apre da sola; se il 💡 aveva acceso
   quel tasto, nella scelta resta acceso il suo valore. Dal consiglio
   nella fila la scatola arriva già con la sua testa (`gia`) */
function scatola(tipo, gia = null) {
  if (inCorsa.value || cieco || finale.value || piena.value) return
  const suggerito = brilla.value === tipo ? consiglioValore.value : null
  const r = mettiScatola(fila.value, cursore.value, gia || (tipo === 'se' ? apriSe(null) : apri(null)))
  metti(r)
  cambiata()
  const daScegliere = valoreDi(r.fila[r.apertura]) == null
  scelta.value = daScegliere ? r.apertura : null
  consiglioValore.value = daScegliere ? suggerito : null
  suono.nota(494, 659, 0.1, 'triangle', 0.05)
}

/* la testa di una scatola: un numero, un colore, la casa */
function sceltaTesta(v) {
  if (inCorsa.value || cieco || finale.value || scelta.value == null) return
  fila.value = scegliTesta(fila.value, scelta.value, v)
  scelta.value = null
  cambiata()
  suono.nota(587, 784, 0.08, 'triangle', 0.05)
}

/* toccare la testa di una scatola: si riapre la scelta, e il cursore va
   in cima al suo corpo */
function testa(i) {
  if (inCorsa.value || cieco || finale.value) return
  const suggerito = consiglioTesta.value === i ? consiglioValore.value : null
  cursore.value = i + 1
  cambiata()
  scelta.value = i
  consiglioValore.value = suggerito
  suono.nota(660, 660, 0.03, 'triangle', 0.03)
}

function cancella() {
  if (inCorsa.value || cieco || finale.value || cursore.value === 0) return
  metti(togliPrima(fila.value, cursore.value))
  scelta.value = null
  cambiata()
  suono.nota(330, 300, 0.07, 'sine', 0.05)
}

function spostaCursore(i) {
  if (inCorsa.value || cieco || finale.value) return
  cursore.value = Math.max(0, Math.min(fila.value.length, i))
  scelta.value = null
  suono.nota(660, 660, 0.03, 'triangle', 0.03)
}

/* una fila che cambia non ha più il suo guasto: quella tessera magari
   non c'è più. E l'aiuto acceso si spegne al primo tocco, e con lui il
   giro scritto sulla scatola dove la fila si era fermata. */
function cambiata() {
  guasto.value = null
  /* la frase di un 🔎 o di un pezzo parla della fila di prima; quella
     che fa pensare parla del posto, e resta finché non la si tocca */
  if (pensiero.value && !pensiero.value.resta) pensiero.value = null
  disarma()
  brilla.value = null
  sospette.value = false
  consiglio.value = null
  consiglioValore.value = null
  consiglioTesta.value = null
  giri.value = null
}

/* ═══════════ ▶ e ■ ═══════════ */
function via() {
  if (inCorsa.value || cieco || finale.value) return
  /* una N ancora da scegliere: ▶ non parte, e apre la scelta che manca
     (che sobbalza, se era già aperta) */
  const manca = daScegliere(fila.value)
  if (manca.length) {
    scelta.value = manca[0]
    cursore.value = manca[0] + 1
    scossa.value++
    suono.nota(330, 262, 0.12, 'triangle', 0.06)
    return
  }
  scelta.value = null
  pensiero.value = null
  disarma()
  const esito = esegui(liv, fila.value)
  const pro = new Proiezione(liv, esito, { veloci: giaVisti(esito) })
  esitoInCorsa = esito
  guasto.value = null
  brilla.value = null
  sospette.value = false
  consiglio.value = null
  consiglioTesta.value = null
  giri.value = null
  passoCorrente = -1
  corrente.value = -1
  inCorsa.value = true
  partito.value = true
  partitoAlle = performance.now()
  ultimoSuono = ''
  regia.suona(pro)
  segna('ppProve')
}

/* quanti passi dall'inizio sono uguali al giro di prima, e allora erano
   andati bene: quelli scorrono veloci. Passi e non carte: coi cicli la
   stessa carta si esegue a ogni giro */
const passiDi = esito => esito.passi.map(p => ({ i: p.i, mossa: p.mossa }))
function giaVisti(esito) {
  if (!ultimoGiro) return 0
  const ora = esito.passi, prima = ultimoGiro.passi
  let n = 0
  while (n < ora.length && n < ultimoGiro.riusciti &&
         ora[n].i === prima[n].i && ora[n].mossa === prima[n].mossa) n++
  return n
}

/* ■: si ferma tutto e si torna com'era prima del ▶. Quello che era già
   girato bene resta «già visto» per il giro dopo.

   ■ sta dove stava ▶: un doppio tocco su ▶ fermerebbe la corsa appena
   partita, e da fuori sembrerebbe un ▶ che non fa niente. Per mezzo
   secondo ■ non risponde — e non risponde più nemmeno quando il coniglio
   è già entrato nella tana: quella partita è vinta. */
const FERMA_DOPO = 500
function ferma() {
  if (!inCorsa.value || performance.now() - partitoAlle < FERMA_DOPO || inTana) return
  if (esitoInCorsa) ultimoGiro = { passi: passiDi(esitoInCorsa), riusciti: Math.max(0, passoCorrente) }
  giri.value = null
  regia.ferma()
  inCorsa.value = false
  corrente.value = -1
  esitoInCorsa = null
  suono.nota(440, 330, 0.1, 'sine', 0.05)
  aiutoPrenotato()
}

function fineGiro() {
  const esito = esitoInCorsa
  esitoInCorsa = null
  inCorsa.value = false
  if (!esito) return aiutoPrenotato()
  const errore = eErrore(esito.esito)
  /* riusciti: tutti i passi tranne quello che ha sbattuto o fatto
     splash. Quando gira la testa (troppi passi) nessun passo è andato
     male: è la fila a non finire mai */
  const cattivo = esito.esito === SBATTE || esito.esito === SPLASH || esito.esito === PERSA ? 1 : 0
  ultimoGiro = { passi: passiDi(esito), riusciti: esito.passi.length - cattivo }
  corrente.value = -1
  if (esito.esito === TANA) {
    /* a casa non c'è niente da consigliare: l'aiuto prenotato si lascia
       cadere, e non costa la stella */
    aiutoInCoda.value = false
    inTana = false
    finale.value = vittoria(esito)
    suono.livello()
    return
  }
  if (errore) {
    /* la tessera colpevole resta segnata, e il cursore le si mette
       subito dopo: un ⌫ toglie proprio lei, e la freccia giusta entra
       al suo posto */
    guasto.value = esito.dove
    cursore.value = esito.dove + 1
    /* dentro una scatola il giro dove si è fermata resta scritto sulla
       sua testa: «al terzo giro» è mezza soluzione */
    const ultimo = esito.passi.at(-1)
    giri.value = ultimo && ultimo.giri && ultimo.giri.length ? ultimo.giri : null
  } else {
    giri.value = null
  }
  aiutoPrenotato()
}

/* ═══════════ 💡 ═══════════
   Una scala, e ogni tocco scende di un gradino (`motore/aiuti.js`, i
   prezzi in `giochi/aiuti.js`):

     🧠  gratis   cosa chiede questo posto, e la domanda giusta
     🔎  gratis   dove la fila comincia a sbagliare: il posto, non la carta
     💡  🪙10 ×3  la carta giusta in quel posto — in trasparenza **dentro
                  la fila**, dove andrà, e sul suo tasto, che brilla. La
                  mette il bambino, toccando l'una o l'altro
     🧩  🪙50     un pezzo di strada scritto nella fila: un terzo di quello
     🧩  🪙100    che manca, poi la metà
     ✅  🪙200    tutta la strada — e la terza stella resta spenta

   Costava la stella «senza aiuti», e una stella è un prezzo che un
   bambino non sente: il 💡 diventava il modo di finire un livello
   seguendo la lampadina. Il prezzo sta sul tasto **prima** di toccarlo;
   senza monete il prezzo sobbalza e non succede niente; dai cinquanta in
   su ci vuole un secondo tocco. La scala riparte a ogni ingresso: ogni
   gradino guarda la fila di adesso, e la fila riparte vuota.

   Due cose che il 💡 fa gratis a qualunque gradino: dire ▶ se la fila
   vince già, e riaccendere la carta di prima se la fila è rimasta
   com'era — pagare due volte la stessa carta perché non la si è ancora
   toccata sarebbe un furto.

   ── IL 💡 RISPONDE SEMPRE ─────────────────────────────────────────
   Era spento mentre il coniglio correva, cioè anche nei due secondi
   della scenetta dopo uno sbaglio: il momento esatto in cui lo si
   cerca. Adesso durante la corsa si prenota — si accende, e il gradino
   arriva quando il coniglio si ferma (se è un gradino caro, arriva
   armato: il secondo tocco resta del bambino) — e ogni tocco fa
   sobbalzare la lampadina (`colpo`). */
const SCALA = scalaDi()
const prossimo = computed(() => SCALA[presi.value] || null)
const monete = computed(() => state.profile.coins || 0)
/* il prezzo che il tasto mostra: niente quando la scala è finita (da lì
   il 💡 rimette gratis la strada già pagata) */
const prezzoDelProssimo = computed(() => (prossimo.value ? prossimo.value.prezzo : null))
const povero = computed(() => mancano(monete.value, prossimo.value) > 0)

let ultimaCarta = null              // la fila di quando si è comprata l'ultima carta
let timerArmato = 0
function disarma() { armato.value = false; clearTimeout(timerArmato) }
const firma = () => JSON.stringify([fila.value, cursore.value])

function aiuto() {
  if (cieco || finale.value) return
  if (inCorsa.value) {
    if (!aiutoInCoda.value) suono.nota(660, 880, 0.08, 'sine', 0.04)
    aiutoInCoda.value = true
    return
  }
  const s = suggerisci(liv, fila.value)
  if (!s) return
  colpo.value++
  /* la fila vince già: lo si dice, e non costa niente */
  if (s.che === 'via') { spegniConsigli(); brilla.value = 'via'; disarma(); suona(); return }
  const p = prossimo.value
  /* la carta di prima, con la fila com'era: si riaccende gratis — ma
     solo se quello che si comprerebbe è un'altra carta, che sarebbe la
     stessa. Se dopo viene un pezzo di strada si va avanti: il pezzo
     parte da dove la fila va bene, e quella carta ce la mette lui */
  if (ultimaCarta && ultimaCarta === firma() && p && p.cosa === 'carta') { mostraCarta(s); suona(); return }
  /* la scala è finita: quello che si è pagato si rimette */
  if (!p) { scriviPezzo(SCALA[SCALA.length - 1]); return }
  if (povero.value) { poveroScossa.value++; suono.nota(330, 262, 0.12, 'triangle', 0.06); return }
  if (chiedeConferma(p) && !armato.value) {
    armato.value = true
    clearTimeout(timerArmato)
    timerArmato = setTimeout(() => { armato.value = false }, 4000)
    suono.nota(660, 660, 0.05, 'triangle', 0.05)
    return
  }
  disarma()
  if (!spendi(p.prezzo)) return
  presi.value++
  if (p.prezzo && !pagato.value) {
    pagato.value = true
    /* la serie del sentiero conta i sentieri fatti senza comprare aiuti:
       si chiude al primo gradino pagato, non a quelli che fanno pensare */
    if (sentiero.value) {
      const esito = chiudiLaSerie()
      chiusaDallAiuto = esito ? fraseDiFine(esito, SENZA_FINE.misura) : null
    }
  }
  if (p.cosa === 'pensa') { pensiero.value = { testo: pensieroDi(liv).join(' '), che: 'pensa', resta: true }; suona(); return }
  if (p.cosa === 'dove') { mostraDove(); suona(); return }
  if (p.cosa === 'carta') { mostraCarta(s); ultimaCarta = firma(); suona(); return }
  scriviPezzo(p)
}
const suona = () => suono.nota(880, 1175, 0.14, 'sine', 0.06)

function spegniConsigli() {
  guasto.value = null
  consiglio.value = null
  consiglioValore.value = null
  consiglioTesta.value = null
  scelta.value = null
  sospette.value = false
  brilla.value = null
}

/* 🔎 il posto, e non la carta */
function mostraDove() {
  spegniConsigli()
  const d = dove(liv, fila.value)
  if (!d) return
  pensiero.value = { testo: d.testo, che: 'dove' }
  if (d.che === 'via') brilla.value = 'via'
  else if (d.che === 'testa') { cursore.value = d.apri + 1; consiglioTesta.value = d.apri }
  else if (d.che === 'togli') { cursore.value = d.carta + 1; guasto.value = d.carta }
  else { cursore.value = d.cursore; sospette.value = d.sospette }
}

/* 💡 la carta giusta, dove va: il consiglio di sempre */
function mostraCarta(s) {
  spegniConsigli()
  pensiero.value = null
  switch (s.che) {
    /* con lo zaino un aiuto può dire anche altre tre cose: qui ci va una
       scatola (il suo tasto brilla, e la scatola sta in trasparenza nella
       fila, con la sua testa), questa scatola vuole un'altra testa (brilla
       la testa, e nella scelta il valore giusto), e questa carta è di
       troppo (brilla ⌫, e lei lampeggia) */
    case 'scatola':
      cursore.value = s.cursore
      brilla.value = eSe(s.testa) ? 'se' : 'ripeti'
      consiglio.value = s.testa
      consiglioValore.value = valoreDi(s.testa)
      break
    case 'testa':
      cursore.value = s.apri + 1
      consiglioTesta.value = s.apri
      consiglioValore.value = s.valore
      return
    case 'togli':
      cursore.value = s.cursore
      brilla.value = 'cancella'
      guasto.value = s.cursore - 1
      return
    default:
      cursore.value = s.cursore
      brilla.value = s.mossa
      consiglio.value = s.mossa
  }
  sospette.value = s.cursore < fila.value.length
}

/* 🧩 ✅ un pezzo di strada, scritto nella fila */
function scriviPezzo(p) {
  const r = pezzoDiStrada(liv, fila.value, p.quota)
  if (!r) return
  fila.value = r.fila
  cursore.value = r.cursore
  cambiata()
  if (p.che === SVELA) svelato.value = true
  pensiero.value = { che: p.che, testo: r.resto
    ? 'Ti ho scritto un pezzo di strada: il resto è tuo.'
    : 'Ecco la strada fino a casa: premi ▶ e guarda.' }
  suono.compra()
}

/* il 💡 premuto durante la corsa: adesso che il coniglio è fermo */
function aiutoPrenotato() {
  if (!aiutoInCoda.value) return
  aiutoInCoda.value = false
  aiuto()
}

/* ═══════════ a casa ═══════════ */
/* I contatori si muovono **dopo** aver salvato la tappa: `segna()` è
   anche il momento in cui si guardano i traguardi, e un traguardo sulle
   tappe guardato prima di `completa()` scatterebbe al ▶ dopo, in mezzo a
   un'altra corsa. Le monete invece vanno **prima**, così il salvataggio
   subito di `completa()` le porta con sé. */
function contaLaVittoria(esito) {
  segna('ppTane')
  if (esito.carota) segna('ppCarote')
  if (liv && liv.cane) segna('ppPecore', liv.pecore.length)
  if (!pagato.value) segna('ppDaSolo')
}

/* La quarta stella, e cosa dire a chi non l'ha presa: quante carte ha
   usato e quante ne bastavano. Il minimo si chiede adesso e non
   all'ingresso: costa una ricerca (qualche centesimo di secondo nei
   prati del cane), e chi esce senza vincere non l'avrebbe mai letto. */
function misuraLaStrada(esito) {
  const minimo = minimoDi(liv)
  const usate = carteUsate(fila.value, esito)
  const carota = esito.carota || (!!minimo && !minimo.carota)
  return { minimo: minimo ? minimo.carte : 0, usate,
           corta: eCorta({ usate, carota: esito.carota, minimo }),
           /* la riga «si può fare con meno»: solo a carota presa — senza,
              la stella della carota spenta dice già cosa manca */
           lunga: !!minimo && carota && usate > minimo.carte }
}

/* scrive la vittoria e torna il cartello da mostrare alla fine */
function vittoria(esito) {
  const strada = misuraLaStrada(esito)
  const stelle = stelleDellaVittoria({ carota: esito.carota, svelato: svelato.value, corta: strada.corta })
  if (sentiero.value) return vittoriaSentiero(esito, strada)

  const i = tappaIdx.value
  /* il premio si paga una volta sola, alla prima vittoria: il livello è
     fisso, e rigiocarlo è ricordarlo, non esercitarsi */
  const primaVolta = stelleDi(CHIAVE, i) === 0
  const monete = primaVolta ? CAMPAGNA[i].premio : 0
  if (monete) addCoins(monete)
  completa(CHIAVE, i, QUANTE_TAPPE, { stelle })
  contaLaVittoria(esito)
  return {
    che: 'tappa', titolo: CAMPAGNA[i].nome, stelle,
    carota: esito.carota, cane: !!(liv && liv.cane), svelato: svelato.value, monete,
    ...strada, zaino: !!liv.zaino,
    racconto: CAMPAGNA[i].racconto,
    /* dopo l'ultima tappa dei piccoli ▶ porta sul sentiero senza fine,
       che si è appena aperto, a chi non ha ancora l'età dello zaino:
       finire non è una porta chiusa */
    prossima: aperta(CHIAVE, i + 1) || (i + 1 === TAPPE_PICCOLE && sentieroAperto()),
  }
}

/* ═══════════ il sentiero senza fine ═══════════ */
function avviaSentiero() {
  sentieri.value = 0
  serie.value = 0
  semeSeduta = (Date.now() % 100000) + 1
  prossimoSentiero()
}

/* chi ha portato il gregge nel recinto (l'ultima tappa del cane) trova
   le pecore anche nel sentiero, un sentiero sì e uno no */
const GREGGE = CAMPAGNA.findIndex(t => t.chiave === 'gregge')
function prossimoSentiero() {
  const cane = stelleDi(CHIAVE, GREGGE) > 0
  const t = generaSentiero(sentieri.value, caso(semeSeduta * 1009 + sentieri.value), { cane })
  entra({ ...t, chiave: `sentiero-${sentieri.value}` }, -1)
}

/* La serie è un risultato quando si chiude — all'aiuto chiesto, o
   quando si torna alla mappa — non a ogni sentiero: se si scrivesse a
   ogni vittoria le «ultime partite» del quaderno sarebbero 1, 2, 3 della
   stessa serie. */
function chiudiLaSerie() {
  if (!serie.value) return null
  const esito = segnaPrimato(CHIAVE, serie.value)
  serie.value = 0
  return esito
}

function vittoriaSentiero(esito, strada) {
  sentieri.value++
  addCoins(PREMIO_SENTIERO)
  contaLaVittoria(esito)
  let frase = chiusaDallAiuto || ''
  let record = false
  if (!pagato.value) {
    serie.value++
    segnaBest('ppFila', serie.value)
    const prima = primatoDi(CHIAVE).best
    record = serie.value > prima
    frase = record && prima ? `${serie.value} di fila · nuovo record (era ${prima})`
          : record ? `${serie.value} di fila · il tuo primo record`
          : `${serie.value} di fila · il record è ${prima}`
  }
  /* nel sentiero non ci sono stelle, ma la strada lunga si dice lo
     stesso: è lì che si vedevano le file da quaranta frecce */
  return { che: 'sentiero', titolo: tappa.value.nome, frase, record, monete: PREMIO_SENTIERO,
           ...strada }
}

/* ═══════════ dopo il cartello ═══════════ */
function avanti() {
  if (sentiero.value) return prossimoSentiero()
  const i = tappaIdx.value + 1
  if (i < QUANTE_TAPPE && aperta(CHIAVE, i)) avviaTappa(i)
  else if (i === TAPPE_PICCOLE && sentieroAperto()) avviaSentiero()
  else allaMappa()
}

function rigioca() {
  if (sentiero.value) return
  avviaTappa(tappaIdx.value)
}

/* si esce mentre il coniglio entra in casa: la vittoria si scrive adesso,
   senza cartello */
function vintaAMeta() {
  if (!inTana || !esitoInCorsa) return
  inTana = false
  vittoria(esitoInCorsa)
  esitoInCorsa = null
}

function allaMappa() {
  vintaAMeta()
  if (sentiero.value) chiudiLaSerie()
  regia.ferma()
  regia.spegni()
  finale.value = null
  inCorsa.value = false
  aiutoInCoda.value = false
  esitoInCorsa = null
  vista.value = 'mappa'
  tappaIdx.value = -1
  tappa.value = null
}

function indietro() {
  if (vista.value === 'mappa') emit('vai', 'home')
  else allaMappa()
}
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" guida="passo" monete @indietro="indietro" />

    <div class="pp">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" :senza-fine="statoSentiero"
             @gioca="avviaTappa" @senza-fine="avviaSentiero" />

      <Campo v-else ref="campo"
             :fila="fila" :cursore="cursore" :corrente="corrente" :guasto="guasto"
             :in-corsa="inCorsa" :salti="!!(tappa && tappa.salti)" :brilla="brilla"
             :prezzo="prezzoDelProssimo" :povero="povero" :armato="armato" :povero-scossa="poveroScossa"
             :pensiero="pensiero" :sospette="sospette" :piena="piena"
             :manina="manina" :consiglio="consiglio" :colpo="colpo" :in-coda="aiutoInCoda"
             :carte="(tappa && tappa.carte) || []" :zaino="(tappa && tappa.zaino) || null"
             :giri="giri" :scelta="scelta" :scelta-tipo="sceltaTipo" :valore-ora="valoreOra"
             :consiglio-valore="consiglioValore" :consiglio-testa="consiglioTesta" :scossa="scossa"
             :colori="colori"
             @freccia="freccia" @cancella="cancella" @via="via" @ferma="ferma"
             @aiuto="aiuto" @cursore="spostaCursore" @scatola="t => scatola(t)" @testa-scelta="sceltaTesta"
             @testa="testa" @chiudi-pensiero="pensiero = null" />

      <Finale v-if="finale" v-bind="finale"
              @avanti="avanti" @rigioca="rigioca" @mappa="allaMappa" />
    </div>
  </div>
</template>
