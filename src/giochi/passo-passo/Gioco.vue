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
import { addCoins, segna, segnaBest, tappaAperta } from '../../store/profile.js'
import { progresso, aperta, adesso, stelleDi, completa, primatoDi, segnaPrimato } from '../campagne.js'
import { fraseDiFine, primatoInParole } from '../primati.js'

import { SENZA_FINE } from './gioco.js'
import { CAMPAGNA, SCALINI, QUANTE_TAPPE, TAPPE_PICCOLE, tappeDelloScalino } from './dati/campagna.js'
import { MASSIMO_FILA } from './dati/mondo.js'
import { apri, carteDi, conCicli, daScegliere, eApri, volteDi } from './dati/carte.js'
import { Livello } from './motore/livello.js'
import { esegui, stelleDellaVittoria, TANA, SBATTE, SPLASH, eErrore } from './motore/mondo.js'
import { mettiCarta, mettiCiclo, togliPrima, scegliVolte } from './motore/fila.js'
import { suggerisci } from './motore/risolutore.js'
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
const aiutato = ref(false)          // in questo giro si è chiesto un aiuto
const brilla = ref(null)            // la freccia (o ▶) che l'aiuto accende
const sospette = ref(false)         // l'aiuto ha messo il cursore in mezzo alla fila
const aiutoInCoda = ref(false)      // il 💡 premuto mentre il coniglio corre
const colpo = ref(0)                // quante volte si è premuto il 💡: ogni volta risponde
const consiglio = ref(null)         // la carta che l'aiuto propone, in trasparenza nella fila
/* lo zaino e le scatole */
const scelta = ref(null)            // la scatola di cui si sta scegliendo il numero
const consiglioVolte = ref(null)    // il numero che l'aiuto accende nella scelta
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
const sentiero = computed(() => tappaIdx.value < 0)
/* quante carte tiene la fila: lo zaino, dove c'è, se no il tetto tecnico */
const piena = computed(() => (tappa.value && tappa.value.zaino
  ? carteDi(fila.value) >= tappa.value.zaino : fila.value.length >= MASSIMO_FILA))
const volteOra = computed(() => (scelta.value != null ? volteDi(fila.value[scelta.value]) : null))
/* Il sentiero senza fine si apre alla fine delle tappe dei piccoli, e
   senza guardare l'età: è il loro, e le tappe dello zaino che vengono
   dopo sono chiuse fino agli otto anni. Legarlo alla campagna intera,
   come quando la campagna finiva alle buche, l'avrebbe chiuso proprio a
   chi l'aveva già aperto. */
const sentieroAperto = () => tappaAperta(TAPPE_PICCOLE, avanza.tappa)

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
  quante: TAPPE_PICCOLE,
  fatte: Math.min(avanza.tappa, TAPPE_PICCOLE),
  /* sulla mappa sta dopo l'ultimo gradino dei piccoli */
  dopo: CAMPAGNA[TAPPE_PICCOLE - 1].scalino,
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
}
function suonaBattuta(b) {
  const che = b.e.che
  const prima = ultimoSuono
  ultimoSuono = che
  if (b.veloce && (che === 'passo' || che === 'scivola')) return
  /* una scivolata è una fila di celle: suona la prima e basta */
  if (che === 'scivola' && prima === 'scivola') return
  SUONI[che]?.()
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
  aiutato.value = false
  brilla.value = null
  sospette.value = false
  aiutoInCoda.value = false
  consiglio.value = null
  scelta.value = null
  consiglioVolte.value = null
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

/* una freccia, un salto — o, dal consiglio del 💡, una scatola già col
   suo numero */
function freccia(t) {
  if (inCorsa.value || cieco || finale.value || piena.value) return
  if (eApri(t)) return ciclo(volteDi(t))
  metti(mettiCarta(fila.value, cursore.value, t))
  scelta.value = null
  cambiata()
  suono.nota(t.startsWith('salto-') ? 587 : 523, t.startsWith('salto-') ? 587 : 523, 0.06, 'triangle', 0.05)
}

/* 🔁: una scatola dove sta il cursore, col cursore dentro. La N nasce da
   scegliere e la scelta si apre da sola; se il 💡 aveva acceso il 🔁,
   nella scelta resta acceso il suo numero */
function ciclo(volte = null) {
  if (inCorsa.value || cieco || finale.value || piena.value) return
  const suggerito = brilla.value === 'ripeti' ? consiglioVolte.value : null
  const r = mettiCiclo(fila.value, cursore.value, volte)
  metti(r)
  cambiata()
  scelta.value = volte == null ? r.apertura : null
  consiglioVolte.value = volte == null ? suggerito : null
  suono.nota(494, 659, 0.1, 'triangle', 0.05)
}

/* il numero di una scatola */
function sceltaVolte(n) {
  if (inCorsa.value || cieco || finale.value || scelta.value == null) return
  fila.value = scegliVolte(fila.value, scelta.value, n)
  scelta.value = null
  cambiata()
  suono.nota(587, 784, 0.08, 'triangle', 0.05)
}

/* toccare la testa di una scatola: si riapre la scelta del numero, e il
   cursore va in cima al suo corpo */
function testa(i) {
  if (inCorsa.value || cieco || finale.value) return
  const suggerito = consiglioTesta.value === i ? consiglioVolte.value : null
  cursore.value = i + 1
  cambiata()
  scelta.value = i
  consiglioVolte.value = suggerito
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
  brilla.value = null
  sospette.value = false
  consiglio.value = null
  consiglioVolte.value = null
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
  const cattivo = esito.esito === SBATTE || esito.esito === SPLASH ? 1 : 0
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
   Non dice la soluzione: trova il pezzo più lungo della fila che va
   ancora bene, ci mette il cursore, e fa vedere la freccia giusta in
   due posti — in trasparenza **dentro la fila**, dove andrà, e sul suo
   tasto, che brilla. La mette il bambino, toccando l'una o l'altro.
   Costa la stella «senza aiuti» — il tasto lo dice prima di essere
   toccato — e da lì gli aiuti di questo giro sono gratis.

   ── IL 💡 RISPONDE SEMPRE ─────────────────────────────────────────
   Era spento mentre il coniglio correva, cioè anche nei due secondi
   della scenetta dopo uno sbaglio: il momento esatto in cui lo si
   cerca. E premuto una seconda volta riaccendeva la stessa freccia, e
   a schermo non cambiava niente. Tutte e due le volte, da fuori, era un
   tasto rotto: «ci premi e non fa nulla». Adesso durante la corsa si
   prenota — si accende, e il consiglio arriva quando il coniglio si
   ferma — e ogni tocco fa sobbalzare la lampadina (`colpo`). E il
   consiglio sta dentro la fila perché è lì che si guarda: l'anello
   attorno a un tasto della pulsantiera, da solo, non lo vedeva
   nessuno. */
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
  if (!aiutato.value) {
    aiutato.value = true
    if (sentiero.value) {
      const esito = chiudiLaSerie()
      chiusaDallAiuto = esito ? fraseDiFine(esito, SENZA_FINE.misura) : null
    }
  }
  guasto.value = null
  consiglio.value = null
  consiglioVolte.value = null
  consiglioTesta.value = null
  scelta.value = null
  sospette.value = false
  suono.nota(880, 1175, 0.14, 'sine', 0.06)
  switch (s.che) {
    case 'via':
      brilla.value = 'via'
      return
    /* con lo zaino un aiuto può dire anche altre tre cose: qui ci va una
       scatola (il 🔁 brilla, e la scatola sta in trasparenza nella fila),
       questa scatola va ripetuta tante volte (brilla la sua testa), e
       questa carta è di troppo (brilla ⌫, e lei lampeggia) */
    case 'ciclo':
      cursore.value = s.cursore
      brilla.value = 'ripeti'
      consiglio.value = apri(s.volte)
      consiglioVolte.value = s.volte
      break
    case 'volte':
      cursore.value = s.apri + 1
      brilla.value = null
      consiglioTesta.value = s.apri
      consiglioVolte.value = s.volte
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
  if (!aiutato.value) segna('ppDaSolo')
}

/* scrive la vittoria e torna il cartello da mostrare alla fine */
function vittoria(esito) {
  const stelle = stelleDellaVittoria({ carota: esito.carota, aiutato: aiutato.value })
  if (sentiero.value) return vittoriaSentiero(esito)

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
    carota: esito.carota, aiutato: aiutato.value, monete,
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

function prossimoSentiero() {
  const t = generaSentiero(sentieri.value, caso(semeSeduta * 1009 + sentieri.value))
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

function vittoriaSentiero(esito) {
  sentieri.value++
  addCoins(PREMIO_SENTIERO)
  contaLaVittoria(esito)
  let frase = chiusaDallAiuto || ''
  let record = false
  if (!aiutato.value) {
    serie.value++
    segnaBest('ppFila', serie.value)
    const prima = primatoDi(CHIAVE).best
    record = serie.value > prima
    frase = record && prima ? `${serie.value} di fila · nuovo record (era ${prima})`
          : record ? `${serie.value} di fila · il tuo primo record`
          : `${serie.value} di fila · il record è ${prima}`
  }
  return { che: 'sentiero', titolo: tappa.value.nome, frase, record, monete: PREMIO_SENTIERO }
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
             :costa="!aiutato" :sospette="sospette" :piena="piena"
             :manina="manina" :consiglio="consiglio" :colpo="colpo" :in-coda="aiutoInCoda"
             :carte="(tappa && tappa.carte) || []" :zaino="(tappa && tappa.zaino) || null"
             :giri="giri" :scelta="scelta" :volte-ora="volteOra" :consiglio-volte="consiglioVolte"
             :consiglio-testa="consiglioTesta" :scossa="scossa"
             @freccia="freccia" @cancella="cancella" @via="via" @ferma="ferma"
             @aiuto="aiuto" @cursore="spostaCursore" @ciclo="ciclo()" @volte="sceltaVolte"
             @testa="testa" />

      <Finale v-if="finale" v-bind="finale"
              @avanti="avanti" @rigioca="rigioca" @mappa="allaMappa" />
    </div>
  </div>
</template>
