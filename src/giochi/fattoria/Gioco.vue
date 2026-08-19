<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA — IL COORDINATORE

   L'unico file del gioco che sa che esistono le monete, il profilo e i
   contatori. Le regole stanno in `motore/fattoria.js` e girano senza
   schermo; il disegno in `scena/tela.js` e non conosce i prezzi; le
   tabelle in `dati/`. Se qualcosa qui dentro comincia a somigliare a una
   regola di gioco o a un `ctx.drawImage`, è nel file sbagliato.

   ── DOVE STA LA FATTORIA ──────────────────────────────────────────
   Non in un campo nuovo del profilo: sotto
   `profile.campagne.fattoria.cfg.stato`, che è l'unico posto sanzionato
   dove un gioco nuovo scrive (vedi `src/giochi/campagne.js`). È quello
   che torna da `Fattoria.serializza()`.

   Si salva **a ritardo**: trascinando una panchina si muovono venti volte
   al secondo delle celle, e persistere a ogni fotogramma vorrebbe dire
   scrivere in archivio venti volte al secondo per niente.

   ── LE MONETE SONO QUELLE VERE ────────────────────────────────────
   La borsa che il motore riceve è il salvadanaio del profilo. È il punto
   di tutto il gioco: la fattoria è il posto dove si *spende* quello che
   si è guadagnato facendo esercizi altrove, non un'altra lezione.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import Barra from '../../components/Barra.vue'
import { state, addCoins, segna, segnaBest, aspettoDi } from '../../store/profile.js'
import { scelta, ricorda } from '../campagne.js'

import { Fattoria } from './motore/fattoria.js'
import { comeAvere, comeFarePosto } from './motore/consiglio.js'
import { carrettoIn, cosaPuoiDare, cosaOffre, scambia, scompartiColmi, DAI }
  from './motore/vicino.js'
import { Camminatore } from './motore/camminata.js'
import { Tela, Attore } from './scena/tela.js'
import { CATALOGO, PER_ID, piedeDi, pezzoDi, assettoDi, puoGirare, puoSpecchiare,
         eCampo, eSilo, eVicino, siloDi, macchinaDi, statiDi } from './dati/catalogo.js'
import { animale, siDisegna } from './dati/animali.js'
import { BISOGNI, CHIAVI } from './dati/bisogni.js'
import { PRODOTTI, SILI, COLTURE, ricetteDi } from './dati/coltivazioni.js'
import { sogliaDi } from './dati/livelli.js'
import { pezzoAttore } from './dati/atlante.js'
import { CELLE, SCALA_INIZIALE, piazzolaDi } from './dati/mondo.js'

import Roba from './viste/Roba.vue'
import Vicino from './viste/Vicino.vue'
import Attrezzi from './viste/Attrezzi.vue'
import Battesimo from './viste/Battesimo.vue'
import Bestia from './viste/Bestia.vue'
import Campo from './viste/Campo.vue'
import Granaio from './viste/Granaio.vue'
import Livelli from './viste/Livelli.vue'
import Macchina from './viste/Macchina.vue'
import Provino from './viste/Provino.vue'
import './stile.css'

defineOptions({ name: 'LaFattoria' })
const emit = defineEmits(['vai'])

const CHIAVE = 'fattoria'
/* Quanto si tiene premuto prima che il gesto **si agganci**. Non è il
   momento in cui la cosa si solleva — quello lo decide il movimento (vedi
   `aggancio`): è solo il momento in cui il gioco smette di credere che
   tu voglia toccare e comincia a credere che tu voglia spostare. */
const ATTESA = 420

/* Quanto l'anello resta invisibile prima di cominciare a riempirsi. Un
   tocco normale dura un centinaio di millisecondi: senza questo ritardo
   l'anello partiva **a ogni tocco**, anche su un campo che il tocco
   secco apre da sé, e insegnava una regola falsa — «qui bisogna tenere
   premuto». Chi tocca e stacca adesso non lo vede mai; chi indugia lo
   vede comparire, ed è esattamente a chi sta indugiando che serve
   sapere che tenendo premuto succede qualcosa. */
const RITARDO_ANELLO = 180

/* ═══════════ lo stato ═══════════ */
const tela = ref(null)
const monete = computed(() => state.profile.coins || 0)
const avviso = ref('')
const pannello = ref(null)          // 'roba' | { tipo: 'piazzola'|'ostacolo', … }
const scelto = shallowRef(null)     // la cosa o l'attore selezionato
/* Il pennello del terreno **non è a schermo**, e lo si tiene spento di
   proposito: il motore sa già dipingere (`dipingi`/`spiana`, e la mappa
   delle materie in `dati/terreni.js`), ma finché il pittore non sa
   raccordare due materie diverse dare in mano un pennello vuol dire far
   disegnare pozze coi bordi sbagliati. La strada è pronta, il tasto
   arriva quando arriva il disegno. */
const pennello = ref(false)
/* La voce su cui aprire il baule, quando ad aprirlo è stato un
   consiglio («ti serve un campo»). Si azzera chiudendo, se no il baule
   aperto a mano il giorno dopo si riaprirebbe ancora lì sopra. */
const punta = ref('')
/* Quello che il gioco ha già mostrato: serve solo a capire quando il
   livello **sale**, che è l'unico momento in cui c'è qualcosa da dire.
   È un `ref` perché lo legge anche il gettone in alto, che deve
   ridisegnarsi quando il numero cambia. */
const livello = ref(1)
const avanza = ref(null)

let mondo = null                    // la Fattoria (motore)
let scena = null                    // la Tela (disegno)
let attori = []
let bambino = null
let salvaFra = 0, orologio = 0, ultimo = 0, giro = 0, bisogniFra = 0

/* La borsa che il motore usa: il salvadanaio vero. `paga(-n)` incassa —
   sgombrare il bosco rende, ed è l'unico modo di guadagnare qui dentro. */
const borsa = {
  quante: () => state.profile.coins || 0,
  paga: n => { addCoins(-n); return true },
}

/* Lo spazio in cui si cammina, come lo chiede `motore/camminata.js`:
   una funzione che dice se su quella cella ci si può stare. Il conto è
   tutto nel motore (`Fattoria.calpestabile`) — qui si passa e basta. */
const dovePasso = (x, y) => mondo.calpestabile(x, y)

function salva() {
  salvaFra = 1.2
  guardaIlLivello()
}

/* Il livello sale spendendo, e le spese passano tutte da un `salva()`:
   guardarlo qui vuol dire non doverselo ricordare in quindici posti —
   e un livello che arriva in silenzio non lo nota nessuno. Il foglio si
   apre da sé, perché quello che è appena arrivato va detto **quando**
   arriva: dopo, nel baule, non sembra una conquista ma una cosa che
   c'è sempre stata. */
function guardaIlLivello() {
  if (!mondo) return
  avanza.value = mondo.avanzamento
  const ora = avanza.value.livello
  if (ora <= livello.value) { livello.value = ora; return }
  livello.value = ora
  pannello.value = { tipo: 'livello', festa: true }
}

function apriLivelli() {
  avanza.value = mondo.avanzamento
  pannello.value = { tipo: 'livello', festa: false }
}
function salvaOra() {
  salvaFra = 0
  if (!mondo) return
  annotaLeBestie()
  ricorda(CHIAVE, 'stato', mondo.serializza())
}

/* Dove sono arrivate le bestie mentre giravano per il prato. Si scrive
   **al momento di salvare**, non a ogni passo: chi cammina si muove
   venti volte al secondo, e il motore non deve saperlo. Senza questa
   riga il cane chiuso nel recinto ricomparirebbe fuori alla riapertura,
   e sembrerebbe colpa del recinto. */
function annotaLeBestie() {
  for (const a of attori) {
    if (a === bambino) continue
    const c = a.corpo.cella
    mondo.annota(a.nome, c.x, c.y)
  }
}

function avvisa(testo) { avviso.value = testo; setTimeout(() => { avviso.value = '' }, 2600) }

/* Chiudere un foglio lascia il prato **pulito**: via il foglio e via la
   selezione. Sono due cose sole ma vanno insieme, perché la selezione
   non si vede finché il foglio è aperto e chi la lascia lì non se ne
   accorge — poi il foglio si chiude e ricompaiono degli attrezzi che
   nessuno ha chiesto. Vale anche per le bestie, che da selezionate
   **stanno ferme** (vedi il giro di `muovi` sugli attori): una capra
   che non riparte più dopo che le hai guardato la scheda sembra
   incantata, e nessuno collega le due cose. */
/* Chiudere azzera anche **dove** si stava per mettere qualcosa: quella
   cella vale per il baule che si è appena aperto tenendoci premuto
   sopra, e non un minuto dopo. Senza questa riga la prima cosa presa
   dal baule aperto col tasto in alto finirebbe dove si era tenuto
   premuto la volta prima — un posto che chi gioca non sta nemmeno
   guardando. */
function chiudi() {
  pannello.value = null; scelto.value = null; punta.value = ''
  dovePosare = null
}

/* Il baule dal tasto in alto: nessuna cella da ricordare, e quella di
   prima si butta. Il posto lo si sceglie dopo, come si è sempre fatto. */
function apriIlBaule() { dovePosare = null; pannello.value = 'roba' }

/* ═══════════ nascere ═══════════ */
onMounted(() => {
  mondo = new Fattoria({ borsa, dato: scelta(CHIAVE, 'stato', null) })
  /* ── il cheat del livello ──
     `#fattoria=7` porta la fattoria a quel livello, come fa `#monete=`
     con il salvadanaio (`store/profile.js`). Serve a guardare col
     telefono una cosa che arriva al livello 9 senza spendere davvero
     tremila monete, e lo usa anche `integrazione/fattoria`. Sta nel
     frammento e si cancella subito, così una ricarica non lo ripete.

     Alza e basta: **non scende mai**, che è la regola del livello e
     varrebbe poco se un indirizzo potesse violarla. */
  const cheat = /(?:^#?|&)fattoria=(\d{1,2})(?=&|$)/i.exec(location.hash || '')
  if (cheat) {
    try { location.hash = '' } catch (e) { /* pazienza */ }
    mondo.speso = Math.max(mondo.speso, sogliaDi(parseInt(cheat[1], 10)))
    salvaOra()
  }
  /* Il livello di adesso si prende **prima** di qualunque spesa: se no
     la prima cosa comprata sembrerebbe una salita, e il foglio della
     festa si aprirebbe da solo appena entrati. */
  livello.value = mondo.livello
  avanza.value = mondo.avanzamento

  scena = new Tela(tela.value)
  scena.scala = SCALA_INIZIALE
  vaiACasa()

  /* Il personaggio è quello scelto nel profilo: senza, il gioco dovrebbe
     indovinare se è una bambina o un bambino, e indovinare vuol dire
     sbagliare per metà dei bambini. */
  const c = centroDelleTerre()
  const casa = mondo.cellaLibera(Math.round(c.x), Math.round(c.y) + 2)
  bambino = new Attore(aspettoDi(), new Camminatore(casa.x, casa.y, { velocita: 3.6 }))
  attori = [bambino]

  metti_in_scena_le_bestie()

  scena.avvia()
  giro = requestAnimationFrame(passo)
  addEventListener('resize', vaiACasa)
  setTimeout(() => avvisa('Tocca una cosa per le sue opzioni, o tienila premuta e trascinala ' +
                          'per spostarla. Sul prato, tieni premuto per il baule.'), 500)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(giro)
  if (scena) scena.ferma()
  removeEventListener('resize', vaiACasa)
  salvaOra()
})

/* Le bestie comprate entrano in scena. Quelle che oggi non si sanno
   disegnare si **saltano in silenzio**: restano nel salvataggio, e
   torneranno quando il loro sprite arriverà. Un travaso a senso unico
   non deve perdere niente per strada, ma nemmeno mostrare un buco. */
function metti_in_scena_le_bestie() {
  for (const b of mondo.bestie) {
    if (!siDisegna(b.chi) || attori.some(a => a.nome === b.chi)) continue
    /* Dove l'avevamo lasciata, non in mezzo al prato: è la metà che
       manca perché «l'ho messo nel recinto» resti vero domani. */
    const dove = mondo.dovEra(b.chi)
    attori.push(new Attore(b.chi, new Camminatore(dove.x, dove.y, { velocita: 2.4, vaga: 2.4 }),
      { chi: b.nome || nomeDi(b.chi), bisogni: [] }))
  }
  aggiornaIBisogni()
}

/* ── LE BARRETTE SOPRA LA TESTA, CHE C'ERANO E NON SI VEDEVANO ──────
   `Attore` sa disegnare le barrette dei bisogni e il 💭 di chi ha fame
   da quando esistono i bisogni (`scena/tela.js`), ma `bisogni` è un
   campo facoltativo e **nessuno lo riempiva**: il codice c'era, girava,
   e non mostrava niente. Da fuori è indistinguibile da una cosa mai
   fatta — un cane che ha fame e non lo dice, e te ne accorgi solo se lo
   apri.

   Si aggiorna ogni tanto e non a ogni fotogramma: un bisogno cala nel
   giro delle ore, e rifare il conto sessanta volte al secondo sarebbe
   sessanta volte lo stesso numero. */
function aggiornaIBisogni() {
  for (const a of attori) {
    if (a === bambino) continue
    const b = mondo.stato(a.nome)
    if (!b) continue
    a.bisogni = CHIAVI.map(k => ({ colore: BISOGNI[k].colore, valore: b[k] ?? 1 }))
  }
}

/* La telecamera segue il mondo che cresce: comprato un pezzo di terra
   sul bordo, la mappa si allarga, e i limiti di qui devono allargarsi
   con lei — se no compare del prato nuovo contro un muro invisibile. */
function inquadraIlMondo() {
  if (scena) scena.mondo = mondo.limiti
}

/* Il centro della terra posseduta, in celle: non è più il centro del
   mondo, che adesso cresce da tutte le parti e non vuol dire più niente. */
function centroDelleTerre() {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const k of Object.keys(mondo.piazzole)) {
    const [px, py] = k.split(',').map(Number)
    x0 = Math.min(x0, px); y0 = Math.min(y0, py)
    x1 = Math.max(x1, px); y1 = Math.max(y1, py)
  }
  return { x: (x0 + x1 + 1) / 2 * CELLE, y: (y0 + y1 + 1) / 2 * CELLE }
}

function vaiACasa() {
  if (!scena) return
  scena.misura()
  inquadraIlMondo()
  const c = centroDelleTerre()
  scena.vista.x = c.x * scena.cellaPx - scena.L / 2
  scena.vista.y = c.y * scena.cellaPx - scena.A / 2
  scena.limita()
}

function passo(ora) {
  giro = requestAnimationFrame(passo)
  const dt = Math.min(0.05, (ora - ultimo) / 1000 || 0)
  ultimo = ora
  orologio += dt
  for (const a of attori) { if (a !== scelto.value) a.corpo.muovi(dt, dovePasso) }
  if (salvaFra > 0) { salvaFra -= dt; if (salvaFra <= 0) salvaOra() }
  bisogniFra -= dt
  if (bisogniFra <= 0) { bisogniFra = 3; aggiornaIBisogni() }
  scena.mostra({
    fattoria: mondo, attori, scelto: scelto.value, preso, anello,
    orologio, pennello: anteprimaPennello(),
  })
}

/* ═══════════ il dito ═══════════ */
const dita = new Map()
let pizzico = null, giu = null, lungo = null, anello = null, preso = null, scorrendo = false
/* La cella su cui è stato aperto il baule, se è stato aperto tenendo
   premuto sul prato. Vive **fuori** dal pannello perché il pannello si
   chiude nell'istante in cui si preme una voce, e quella cella serve un
   attimo dopo. Si azzera appena usata: il baule aperto dal tasto in alto
   non ha nessun posto da ricordare. */
let dovePosare = null
/* ── L'AGGANCIO: PASSATA L'ATTESA, LA COSA NON È ANCORA IN MANO ────
   Prima il tempo decideva da solo: scaduti i 420 ms la cosa era presa, e
   al rilascio si poteva solo posarla — la scheda con «giralo» e «mettila
   via» non compariva più. Chi teneva premuto un po' troppo si ritrovava
   in un trascinamento che non aveva chiesto («mi parte secco in drag e
   non mi dà le altre opzioni»), e il confine fra i due gesti era il
   tempo: una cosa che non si vede e che un bambino non dosa.

   Adesso l'attesa **aggancia** e basta: la cosa resta dov'è, e a
   decidere è il movimento, che si vede. Oltre `SCARTO_DITO` comincia il
   trascinamento; il dito che si stacca senza essersi mai mosso è un
   tocco — per quanto a lungo sia rimasto giù — e apre le opzioni.

   `{ tipo: 'cosa'|'bestia'|'baule', voce, da, bestia }` */
let aggancio = null

/* Da quanto in là comincia lo scorrimento — cioè quando il tocco smette
   di essere un tocco. Un mouse sta fermo dove lo lasci; un dito no: si
   appoggia largo, e mentre preme il punto che il telefono chiama «il
   dito» si sposta di qualche pixel da solo. Con la stessa misura per
   tutti e due, sul computer andava sempre e sul telefono si perdevano
   i tocchi — quelli di chi preme con più forza, cioè i bambini.
   Sedici pixel restano sotto quello che Android e iOS considerano
   ancora fermo, quindi non si ruba niente allo scorrimento.

   Ed è una **distanza vera**, non la somma dei due lati come prima: un
   dito che deriva di 9 px in diagonale ne fa 12,7 di distanza, ma 18 di
   somma, e veniva buttato via da una soglia che sulla verticale ne
   perdonava 16. Cioè: il tocco storto — quello dei bambini — si perdeva,
   e si perdeva più di quanto dicesse il numero scritto qui. */
const SCARTO_DITO = 16
const SCARTO_MOUSE = 6

/* Quanto si perdona a un dito che ha sbagliato mira, e quanto grande
   dev'essere come minimo un bersaglio. I 44 px sono la misura che
   Android e iOS chiedono da anni per un tasto: alla scala più stretta
   un campo ne misura 32 e un silo 16, cioè meno di un polpastrello. */
const GRAZIA = 6
const MINIMO_TOCCO = 44

/* Le coordinate del dito arrivano in pagina, ma la tela comincia sotto
   la barra: senza togliere l'origine si tocca una cella e se ne prende
   un'altra, e l'errore cresce con l'altezza della barra. */
const riquadro = () => tela.value.getBoundingClientRect()

function dove(e) {
  const r = riquadro()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function centro() {
  const v = [...dita.values()]
  return { x: (v[0].x + v[1].x) / 2, y: (v[0].y + v[1].y) / 2,
           d: Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y) }
}

function anteprimaPennello() {
  if (!pennello.value || !giu) return null
  const c = scena.cellaDa(giu.x, giu.y)
  return { celle: new Set([c.x + ',' + c.y]),
           ok: mondo.cellaMia(c.x, c.y) && mondo.libera(c.x, c.y, 1, 1) }
}

function premi(e) {
  dita.set(e.pointerId, dove(e))
  if (dita.size === 2) {
    if (lungo) { clearTimeout(lungo); lungo = null }
    giu = null; anello = null; aggancio = null; scorrendo = false
    pizzico = { d0: centro().d, scala0: scena.scala }
    return
  }
  if (dita.size > 2) return

  const p = dove(e)
  giu = { ...p, x0: p.x, y0: p.y, mosso: false, mira: null }
  scorrendo = false
  if (pennello.value) return dipingi(p)

  /* Una cosa già in mano si posa toccando dove deve andare: è il
     secondo tempo del gesto che parte dal baule, per chi ha toccato e
     lasciato invece di trascinare. */
  if (preso) { preso.pronto = true; return muoviPreso(p) }

  /* Chi c'è sotto il dito lo decide `bersaglio()`, una volta sola e con
     le stesse regole con cui lo deciderà il rilascio: se la pressione
     aggancia una cosa e il tocco ne aprisse un'altra, il gioco
     risponderebbe a due domande diverse allo stesso dito.

     Tenerla premuta **aggancia** — un cane si sposta come una panchina,
     ed è così che si mette in un recinto — ma finché il dito non si
     muove è ancora un tocco. */
  const b = giu.mira = bersaglio(p)
  if (b.bestia && mondo.hoLaBestia(b.bestia.nome))
    return arma(p, { tipo: 'bestia', bestia: { chi: b.bestia.nome, attore: b.bestia } })
  if (b.cosa) return arma(p, { tipo: 'cosa', voce: PER_ID[b.cosa.id], da: b.cosa })

  /* Tenere premuto sul prato vuoto apre il baule. È lo stesso gesto con
     cui si prende una cosa che c'è già — «tieni premuto dove vuoi agire»
     — e risparmia il viaggio fino al tasto in alto: si tiene premuto
     **dove** si vuole mettere qualcosa. Il baule si apre **al rilascio**
     e non allo scadere del tempo: allo scadere del tempo comparirebbe
     sotto un dito ancora appoggiato, e chi nel frattempo ha deciso di
     spostare la vista si troverebbe un foglio in faccia. */
  const c = scena.cellaDa(p.x, p.y)
  if (mondo.cellaMia(c.x, c.y) && !mondo.ostacoloSotto(c.x, c.y))
    return arma(p, { tipo: 'baule', cella: { x: c.x, y: c.y } })
}

/* L'anello che si riempie sotto il dito, e quello che vuol dire: finché
   non è pieno non è successo niente; quando è pieno la cosa è
   **agganciata** — «adesso puoi trascinare» — e resta lì a dirlo finché
   il dito non si muove o non si stacca. */
function arma(p, quale) {
  anello = { x: p.x, y: p.y, q: -1, pronto: false }
  riempiAnello(performance.now())
  lungo = setTimeout(() => {
    lungo = null
    aggancio = quale
    if (anello) anello.pronto = true
  }, ATTESA)
}

/* `q` sotto zero vuol dire «non disegnarlo ancora»: la scena non tocca
   un anello con la frazione a zero o meno, quindi il ritardo è tutto
   qui e la tela non deve sapere niente di quanto dura un tocco. */
function riempiAnello(t0) {
  const cresci = () => {
    if (!anello) return
    const t = performance.now() - t0 - RITARDO_ANELLO
    anello.q = Math.min(1, t / (ATTESA - RITARDO_ANELLO))
    if (anello.q < 1) requestAnimationFrame(cresci)
  }
  requestAnimationFrame(cresci)
}

/* Il movimento, che è quello che si vede, apre il trascinamento: da qui
   in poi si sta spostando qualcosa e non si sta più scegliendo. Sul
   prato vuoto non c'è niente da prendere, e muoversi vuol dire
   semplicemente spostare la vista. */
function cominciaATrascinare(quale, p) {
  if (quale.tipo === 'baule') return false
  if (quale.tipo === 'bestia') prendi(null, null, p, { bestia: quale.bestia })
  else prendi(quale.voce, quale.da, p)
  return true
}

function muovi(e) {
  if (dita.has(e.pointerId)) dita.set(e.pointerId, dove(e))
  if (pizzico && dita.size >= 2) {
    const c = centro()
    if (c.d > 24) scena.zoomA(pizzico.scala0 * (c.d / pizzico.d0), c.x, c.y)
    return
  }
  const p = dove(e)
  if (preso) {
    /* Trascinata per davvero: da qui in poi lasciare vuol dire posare.
       Il confronto è col punto in cui l'ha presa (`x0`, `y0`) e non con
       l'ultimo `pointerdown`, perché tirandola fuori dal baule il
       `pointerdown` è avvenuto sul foglio, che nel frattempo è sparito e
       qui non è mai arrivato. Col dito un `pointermove` c'è solo se il
       dito è appoggiato; col mouse bisogna chiederlo (`buttons`), se no
       basterebbe passarci sopra. */
    const premuto = e.pointerType !== 'mouse' || e.buttons > 0
    const scarto = e.pointerType === 'mouse' ? SCARTO_MOUSE : SCARTO_DITO
    if (premuto && Math.hypot(p.x - preso.x0, p.y - preso.y0) > scarto) preso.pronto = true
    return muoviPreso(p)
  }
  if (!giu) return
  const dx = p.x - giu.x, dy = p.y - giu.y
  const scarto = e.pointerType === 'mouse' ? SCARTO_MOUSE : SCARTO_DITO
  if (Math.hypot(p.x - giu.x0, p.y - giu.y0) > scarto) {
    giu.mosso = true
    if (!pennello.value) scorrendo = true
    /* Mosso prima dell'attesa: non si è agganciato niente, era uno
       scorrimento fin dall'inizio. */
    if (lungo) { clearTimeout(lungo); lungo = null; anello = null }
    /* Mosso **dopo** l'attesa: la cosa era agganciata, e adesso comincia
       davvero a spostarsi. Il trascinamento vince sullo scorrimento — si
       sposta la panchina, non la vista. */
    if (aggancio) {
      const quale = aggancio
      aggancio = null; anello = null
      if (cominciaATrascinare(quale, p)) { scorrendo = false; return }
    }
  }
  if (pennello.value && giu.mosso) dipingi(p)
  else if (scorrendo) {
    scena.vista.x -= Math.round(dx); scena.vista.y -= Math.round(dy); scena.limita()
  }
  giu.x = p.x; giu.y = p.y
  if (anello) { anello.x = p.x; anello.y = p.y }
}

/* ── IL FANTASMA DEL TOCCO ──────────────────────────────────────────
   Alzato il dito, il browser manda **anche** un `click`, e lo manda a
   chi si trova sotto il dito *in quel momento* — non a chi c'era quando
   il dito si è appoggiato. Se il tocco ha appena aperto un pannello, il
   bersaglio è il velo comparso un istante prima, che si chiude da sé
   (`@click.self`): il pannello lampeggia e sparisce, e il tasto sembra
   non aver fatto niente.

   Col mouse non succede: lì il bersaglio del click è deciso alla
   pressione, ed è il canvas. È tutta la differenza fra «sul computer
   va» e «sul telefono no» — e il «qualche volta sì» era il dito che
   capitava dove compare il foglio, dove il click finisce sul foglio
   invece che sul velo e il pannello resta aperto.

   Il rimedio buono è dirlo al browser: `preventDefault()` sul
   `touchend` che nasce sul campo, e il click non viene proprio
   generato. Nessun click che nasce da un dito appoggiato sul CAMPO
   serve a qualcuno — qui si gioca coi puntatori — e i click veri, sui
   tasti e sui fogli, nascono da un dito appoggiato su quelli e non
   passano da questo `touchend`.

   ── PERCHÉ NON BASTAVA INGOIARE IL CLICK ──────────────────────────
   Prima si restava in ascolto di UN click qualunque per 350 ms e lo si
   buttava. Va bene quando il fantasma arriva davvero: se lo mangia lui
   e l'ascolto finisce. Ma **il fantasma non arriva sempre** — dopo uno
   scorrimento, dopo un pizzico, dopo un tocco annullato il browser non
   manda nessun click — e allora quell'ascolto restava lì aperto e si
   mangiava il **primo click vero dei 350 ms dopo**: il tasto del baule
   premuto subito dopo aver trascinato la mappa, il «Compra» toccato in
   fretta. A schermo è esattamente «ogni tanto non mi fa toccare le
   cose, sembra un doppio click» — perché il secondo tocco funziona.

   Resta come rete di sicurezza per chi non manda eventi touch (una
   penna, un browser strano), ma **stretto**: solo un click che arriva
   subito (100 ms) e proprio lì dove il dito si è alzato (32 px) è un
   fantasma. Un click più tardi o più in là è di qualcuno che ha
   premuto davvero, e non si tocca. */
const FANTASMA_MS = 100
const FANTASMA_PX = 32

/* `cancelable` va chiesto: quando il browser ha già cominciato a
   scorrere per conto suo il `touchend` non si può più annullare, e
   provarci scrive un errore in console — cioè fa sembrare rotto proprio
   il pezzo che serve a non farlo sembrare rotto. Nei casi in cui non si
   può, il click lo prende `zittisciIlFantasma` qui sotto. */
function nienteClickDalCampo(e) { if (e.cancelable) e.preventDefault() }

function zittisciIlFantasma(x, y) {
  const t0 = performance.now()
  const smetti = () => removeEventListener('click', zitto, true)
  const zitto = ev => {
    if (performance.now() - t0 > FANTASMA_MS) return smetti()
    if (Math.hypot(ev.clientX - x, ev.clientY - y) > FANTASMA_PX) return
    ev.stopPropagation(); ev.preventDefault(); smetti()
  }
  addEventListener('click', zitto, true)
  setTimeout(smetti, FANTASMA_MS + 20)
}

function lascia(e) {
  if (e.pointerType !== 'mouse') zittisciIlFantasma(e.clientX, e.clientY)
  const eraPizzico = !!pizzico
  dita.delete(e.pointerId)
  if (dita.size < 2) pizzico = null
  if (lungo) { clearTimeout(lungo); lungo = null }
  anello = null
  const p = dove(e)
  /* Presa dal baule con un tocco secco, la cosa resta appesa al dito:
     si posa al tocco dopo, quando si vede dove va. */
  if (preso && !preso.pronto) { preso.pronto = true; giu = null; return }
  if (preso) { posaPreso(); giu = null; return }
  if (eraPizzico || !giu) { giu = null; return }
  /* Un tocco fermo è un tocco, quanto lungo sia: il limite di tempo che
     c'era buttava via le pressioni un po' lente, cioè proprio quelle di
     chi ha imparato che «si tiene premuto per prendere». */
  const fermo = !giu.mosso
  const agganciato = aggancio
  /* ── IL BERSAGLIO SI DECIDE QUANDO IL DITO SI APPOGGIA ──────────
     Non quando si stacca. Sembra la stessa cosa e non lo è: fra i due
     momenti passa mezzo secondo, e in mezzo mezzo secondo **le bestie
     camminano**. Chiedendo di nuovo al rilascio, la capra che stavi
     toccando si era già spostata di due passi e il tocco apriva quello
     che era rimasto lì sotto — o niente. Più il dito indugia, più è
     probabile: cioè capita ai bambini e non a chi prova.

     È la stessa regola che il browser applica al click col mouse — il
     bersaglio è quello della pressione — e che invece col dito non
     applica: il motivo per cui esiste `zittisciIlFantasma` qui sopra. */
  const mira = giu.mira || { bestia: null, cosa: null }
  aggancio = null
  giu = null
  if (!fermo || pennello.value) return

  /* Il dito si è staccato senza essersi mai mosso: era un tocco, per
     quanto a lungo sia rimasto giù. Sul prato vuoto vuol dire il baule —
     ed è l'unica cosa che il tocco lungo fa e il tocco secco no, perché
     lì il tocco secco manda il bambino a camminare. Per tutto il resto
     si prosegue col percorso del tocco normale, qui sotto: una cosa si
     seleziona e mostra i suoi attrezzi, una bestia apre la sua scheda. */
  if (agganciato && agganciato.tipo === 'baule') {
    scelto.value = null
    /* **Il baule si porta dietro dove l'hai aperto.** Tenere premuto in
       mezzo al prato vuol dire «voglio metterci qualcosa *qui*», e
       farselo poi chiedere una seconda volta è chiedere due volte la
       stessa cosa: si sceglie la panchina e la si posa dov'era il dito.
       Se lì non ci sta — il pezzo è più largo di quanto c'è libero — si
       torna al gesto di sempre e resta appesa al dito, che è il modo di
       dire «scegli tu un altro posto» senza un cartello. */
    dovePosare = agganciato.cella || null
    pannello.value = 'roba'
    return
  }

  /* ── IL TOCCO LUNGO È LA CASSETTA DEGLI ATTREZZI ──────────────────
     Fermo, senza trascinare: compaiono «giralo» e «mettilo via». È lo
     stesso gesto con cui la si sposta, meno il trascinamento — «tieni
     premuto per sistemare» — e vale per tutto quello che si posa, il
     campo e il silo compresi.

     Prima ci arrivava il **tocco secco**, e su una cosa che lavora era
     un guaio: il tocco secco apriva il foglio *e* selezionava, quindi
     chiudendo il foglio — o seminando, o raccogliendo — gli attrezzi
     riemergevano da soli sopra la cosa appena lavorata, a proporre di
     spostarla. Un menù che ricompare da solo dopo che hai finito è un
     menù che devi chiudere due volte. Adesso i due gesti dicono due
     cose diverse: **tocca per fare, tieni premuto per sistemare.** */
  if (agganciato && agganciato.tipo === 'cosa') { scelto.value = agganciato.da; return }

  const c = scena.cellaDa(p.x, p.y)
  const px = piazzolaDi(c.x), py = piazzolaDi(c.y)

  /* Comprare la terra viene PRIMA di tutto. Le bestie non ci vanno mai —
     restano su quello che è tuo — ma il loro bersaglio è più largo della
     cella su cui poggiano, e sporgendo sul bosco accanto si mangiava il
     tocco: alcune piazzole diventavano incomprabili a seconda di dove si
     era fermato il cane, il che è il tipo di guasto che sembra un caso. */
  if (mondo.comprabile(px, py)) { scelto.value = null; pannello.value = { tipo: 'piazzola', px, py }; return }

  const b = mira
  if (b.bestia) {
    scelto.value = b.bestia
    apriBestia(b.bestia.nome)
    /* Accanto al bambino, non addosso: se lì non si può stare — c'è
       una panchina, è acqua — ci pensa `vaiA` ad accostarsi il più
       vicino possibile invece di lasciare la bestia ferma. */
    b.bestia.corpo.vaiA(bambino.corpo.cella.x, bambino.corpo.cella.y + 1, dovePasso)
    return
  }

  if (b.cosa) {
    /* Il tocco secco fa **la cosa principale**: un campo si semina, un
       mulino macina, un silo si guarda dentro — lo stesso gesto con cui
       si tocca un cane, ed è il motivo per cui non c'è niente di nuovo
       da imparare. Chi una cosa principale non ce l'ha — una panchina,
       un albero, una casa — mostra i suoi attrezzi, che lì sono l'unica
       cosa che ci si può fare. */
    if (haFoglio(b.cosa)) { scelto.value = null; return apriLavoro(b.cosa) }
    scelto.value = b.cosa
    return
  }
  if (scelto.value) { scelto.value = null; return }

  const o = mondo.ostacoloSotto(c.x, c.y)
  if (o) { pannello.value = { tipo: 'ostacolo', o }; return }
  if (mondo.cellaMia(c.x, c.y)) bambino.corpo.vaiA(c.x, c.y, dovePasso)
}

/* ═══════════ CHI C'È SOTTO IL DITO ═══════════
   Due giri, e una regola sola a tenerli insieme: **la grazia non ruba
   mai un bersaglio esatto.**

   Il primo giro chiede solo i bersagli esatti — la bestia dov'è
   disegnata, la cosa sulla cella dove appoggia. Il secondo allarga: una
   cosa si prende anche dove si *vede*, e una bestia con qualche pixel di
   margine.

   Il secondo giro serve perché uno sprite si appoggia col fondo sul suo
   piede e tutto il resto sporge in su: il silo occupa due celle per una
   ed è alto quasi quattro, quindi si vedeva grande e si toccava solo
   nella striscia in basso — sopra quella striscia il dito finiva sul
   prato dietro, e il bambino ci andava a camminare.

   L'ordine è la parte che conta. Messo così, allargare non toglie niente
   a nessuno: il prato dietro una casa è un bersaglio esatto e si tocca
   ancora, e la pecora che passa sopra un campo non se lo mangia più —
   prima lo faceva, perché il suo rettangolo veniva per primo e portava
   già la sua grazia addosso. È lo stesso guasto che aveva reso certe
   piazzole incomprabili a seconda di dove si fermava il cane, e lì era
   stato tappato spostando una riga; qui la regola è scritta una volta. */
function bersaglio(p) {
  const c = scena.cellaDa(p.x, p.y)
  const esatta = attoreSotto(p.x, p.y, 0)
  if (esatta) return { bestia: esatta, cosa: null }
  const sopra = mondo.cosaSotto(c.x, c.y)
  if (sopra) return { bestia: null, cosa: mondo.cellaMia(c.x, c.y) ? sopra : null }
  const vista = cosaDisegnataSotto(p.x, p.y)
  if (vista) return { bestia: null, cosa: vista }
  return { bestia: attoreSotto(p.x, p.y, GRAZIA), cosa: null }
}

/* Il secondo giro per le cose: il rettangolo **davvero disegnato**, che
   la tela sa calcolare (`riquadroPosa`) perché è lo stesso conto con cui
   lo posa. Vince chi ha il fondo più in basso, cioè chi si vede davanti:
   fra il silo e l'albero che gli spunta dietro, il dito prende il silo.

   Le cose che hanno un foglio — un campo, un silo, una macchina — non
   scendono mai sotto `MINIMO_TOCCO`: sono quelle che si toccano dieci
   volte a partita, e alla scala più stretta un campo misurava 32 px. */
function cosaDisegnataSotto(sx, sy) {
  let vinta = null, fondo = -Infinity
  for (const cosa of mondo.cose) {
    if (!mondo.cellaMia(cosa.x, cosa.y)) continue
    const v = PER_ID[cosa.id]
    if (!v) continue
    /* `aspettoDi` rende pezzo, piede e verso insieme, ed è quello che
       tiene il bersaglio del dito incollato al disegno anche su una
       cosa girata: il piede è già scambiato, e il riquadro pure. */
    const a = assettoDi(cosa, v)
    const piede = a.piede
    const r = scena.riquadroPosa(a.pezzo, cosa.x, cosa.y, piede, a)
    if (!r) continue
    const g = haFoglio(cosa) ? almeno(r, MINIMO_TOCCO) : r
    if (sx < g.x || sx > g.x + g.w || sy < g.y || sy > g.y + g.h) continue
    const giu = cosa.y + piede[1]
    if (giu > fondo) { fondo = giu; vinta = cosa }
  }
  return vinta
}

/* Un rettangolo che non scende sotto una misura, allargato dal centro
   così resta dov'è. */
function almeno(r, lato) {
  const w = Math.max(r.w, lato), h = Math.max(r.h, lato)
  return { x: r.x - (w - r.w) / 2, y: r.y - (h - r.h) / 2, w, h }
}

/* Chi ha una scheda da aprire, e quindi qualcosa da *fare* al tocco: un
   campo si semina, una macchina trasforma, un silo si guarda dentro. Una
   panchina no, e infatti al tocco mostra i suoi attrezzi e basta. */
function haFoglio(cosa) {
  return eCampo(cosa) || !!macchinaDi(cosa) || eSilo(cosa) || eVicino(cosa)
}

/* Le bestie si guardano dal rettangolo davvero disegnato, non dalla
   cella: è l'unico modo perché toccare un cane grosso funzioni dove il
   cane si vede, e non solo dove appoggia. `grazia` è quanto si perdona
   di lato e in basso — zero nel giro esatto, qualche pixel nel secondo.
   Sopra la testa non si perdona niente: lì c'è già lo sprite. */
function attoreSotto(sx, sy, grazia = GRAZIA) {
  for (let i = attori.length - 1; i >= 0; i--) {
    const a = attori[i]
    if (a === bambino) continue
    const p2 = pezzoAttore(a.nome, a.corpo.verso === 'sinistra' ? 'lato' : a.corpo.verso, 0)
    const r = a.riquadro(scena.cellaPx, scena.vista, p2)
    if (sx >= r.x - grazia && sx <= r.x + r.w + grazia &&
        sy >= r.y && sy <= r.y + r.h + grazia) return a
  }
  return null
}

const nomeDi = chi => (animale(chi) || {}).nome || chi

function annulla() {
  if (lungo) { clearTimeout(lungo); lungo = null }
  dita.clear(); pizzico = null; anello = null; preso = null; giu = null; aggancio = null
}

/* col mouse non si pizzica: la rotella fa lo stesso mestiere, ma a passi
   interi — moltiplicare per 1,18 arrotondato lascerebbe la scala dov'è */
function rotella(e) {
  e.preventDefault()
  scena.zoomA(scena.scala + (e.deltaY < 0 ? 1 : -1), e.clientX, e.clientY)
}

/* ═══════════ prendere e posare ═══════════
   Un gesto solo per tre cose che sembravano diverse: spostare quello
   che c'è già, tirare fuori dal baule quello che si ha da parte, e
   comprare quello che non si ha ancora. In tutti e tre i casi
   l'anteprima è agganciata alla griglia **con l'ingombro vero** — la
   casa occupa cinque celle per due, e vederlo prima di lasciare è
   l'unico modo di scegliere davvero dove va.

   `pronto` è la differenza fra i due modi di finire il gesto:
   trascinando (`pronto` da subito) si posa alzando il dito; toccando e
   basta nel baule la cosa **resta appesa** e si posa col tocco dopo,
   dove la si vuole. Senza, un tocco svelto nel baule comprerebbe e
   poserebbe sotto al dito, cioè dove il foglio copriva la mappa: una
   spesa fatta senza aver visto dove finiva. */
function prendi(voce, da, p, opz = {}) {
  const bestia = opz.bestia || null
  if (!voce && !bestia) return
  const dove = dovePosare
  dovePosare = null
  preso = { voce, da, bestia, cx: null, cy: null, ok: false,
            piede: [1, 1], pezzo: null, pronto: opz.pronto !== false,
            x0: p ? p.x : 0, y0: p ? p.y : 0 }
  scelto.value = bestia ? bestia.attore || null : (da || null)
  pannello.value = null
  if (p) muoviPreso(p)
  /* Il baule era stato aperto tenendo premuto su una cella: quella
     scelta è già stata fatta, e si posa lì. Solo se ci sta davvero —
     `muoviSuCella` lo dice — se no la cosa resta appesa al dito come
     sempre, e la si mette dove si vuole. */
  if (!dove || !muoviSuCella(dove.x, dove.y) || !preso.ok) return

  /* ── E QUI IL DITO SI LASCIA DIETRO UN CLICK ──────────────────────
     Il guasto è quello scritto in CLAUDE.md, preso in pieno: posare
     subito può **far comparire un foglio esattamente sotto il dito** —
     una bestia comprata chiede il nome — e un attimo dopo arriva il
     click fantasma di quello stesso tocco. Va a finire sul velo appena
     nato, che si chiude da sé (`@click.self`): il foglio sparisce e
     l'animale non si compra più. Da fuori è «tocco l'animale, mi si
     chiude la schermata e non riesco a metterlo».

     Prima non capitava perché premere nel baule non apriva niente:
     lasciava la cosa appesa al dito, e il fantasma cadeva sul prato
     dove non fa niente. Col mouse non capita affatto, ed è il motivo
     per cui questi guasti si vedono solo dal telefono.

     `opz.clic` sono le coordinate **dello schermo** (non della tela):
     `zittisciIlFantasma` confronta con `clientX/clientY`, e passargli
     quelle della tela avrebbe ingoiato il click sbagliato — cioè
     nessuno. */
  if (opz.clic) zittisciIlFantasma(opz.clic.x, opz.clic.y)
  posaPreso()
}

/* Come `muoviPreso`, ma partendo da una **cella** invece che da un
   punto sullo schermo: chi ha tenuto premuto sul prato una cella la
   sapeva già, e ripassare per i pixel vorrebbe dire rifare al contrario
   il conto che la telecamera ha appena fatto. Torna se il conto si è
   potuto fare. */
function muoviSuCella(cx, cy) {
  if (!preso || !scena) return false
  const centro = scena.puntoDellaCella
    ? scena.puntoDellaCella(cx, cy) : null
  if (!centro) return false
  muoviPreso(centro)
  return true
}

/* L'ingombro vero e la figura vera di quello che si ha in mano. Una
   bestia sta in una cella sola e ci va **camminandoci**, quindi la
   domanda che le si fa è `calpestabile` e non `libera`: una bestia si
   posa dove potrebbe arrivare da sé, e in acqua o dentro una casa no. */
function muoviPreso(p) {
  if (!preso) return
  const { voce, da, bestia } = preso
  const finto = da || (voce ? { id: voce.id, g: 0 } : null)
  /* Anche l'anteprima si porta dietro il verso: chi sposta una cosa
     girata la vede girata dove sta per lasciarla, se no il fantasma
     dice il posto sbagliato proprio a chi sta decidendo dove metterla. */
  const a = bestia ? null : assettoDi(finto, voce)
  const piede = bestia ? [1, 1] : a.piede
  const c = scena.cellaDa(p.x, p.y)
  preso.piede = piede
  preso.verso = a
  preso.pezzo = bestia ? bestia.chi + '_giu0' : a.pezzo
  preso.cx = c.x - ((piede[0] - 1) / 2 | 0)
  preso.cy = c.y
  preso.ok = bestia
    ? mondo.calpestabile(preso.cx, preso.cy)
    : mondo.libera(preso.cx, preso.cy, piede[0], piede[1], da)
}

function posaPreso() {
  const p = preso
  preso = null
  if (!p || p.cx === null) return
  if (p.bestia) return posaLaBestia(p)
  const r = mondo.posa(p.voce.id, p.cx, p.cy, { sposta: p.da })
  if (!r.ok) {
    avvisa(r.motivo === 'poche-monete'
      ? `Ti servono ${r.costo - monete.value} monete in più.`
      : 'Lì non ci sta.')
    return
  }
  if (!p.da) { segna('fattoriaPosati'); segnaBest('fattoriaVarieta', mondo.tipiPosseduti) }
  /* Posata, e basta. Prima restava selezionata, quindi appena finito di
     spostare una panchina ci si ritrovava addosso i tastini per
     spostarla: la risposta alla domanda che si era appena finito di
     fare. Chi la vuole girare tiene premuto, che è il gesto che ha
     appena usato. */
  scelto.value = null
  salva()
}

/* Una bestia già tua si sposta e basta; una che si sta comprando passa
   prima dal nome — «prima si sceglie il nome, poi si paga» vale anche
   adesso che si sceglie pure il posto. */
function posaLaBestia(p) {
  const { chi, attore, compra } = p.bestia
  if (!p.ok) { scelto.value = null; return avvisa('Lì non ci può stare.') }
  if (compra) {
    pannello.value = { tipo: 'battesimo', chi, che: compra.nome, prezzo: compra.prezzo,
                       dove: { x: p.cx, y: p.cy } }
    return
  }
  const r = mondo.spostaBestia(chi, p.cx, p.cy)
  if (!r.ok) return avvisa('Lì non ci può stare.')
  /* La si posa *ferma*: se restasse la strada di prima, ripartirebbe
     subito verso dove stava andando e sembrerebbe scappata di mano. */
  attore.corpo.fermati()
  attore.corpo.x = p.cx + 0.5
  attore.corpo.y = p.cy + 0.5
  scelto.value = null
  salva()
}

function dipingi(p) {
  const c = scena.cellaDa(p.x, p.y)
  const r = mondo.dipingiAcqua(c.x, c.y)
  if (r.ok && r.costo) salva()
  else if (r.motivo === 'poche-monete') { pennello.value = false; avvisa('Monete finite.') }
}

/* ═══════════ gli attrezzi della cosa scelta ═══════════ */
const gestiDiScelto = computed(() => {
  const s = scelto.value
  if (!s || !s.id) return []
  const v = PER_ID[s.id]
  return [
    ...(puoGirare(v) ? [{ chiave: 'gira', icona: '↻', titolo: 'giralo' }] : []),
    /* ⇄ compare su quasi tutto, perché quasi tutto si può rovesciare, e
       ↻ su poco, perché girare di novanta gradi ha senso solo per quello
       che è disegnato a piombo dall'alto. Chi non li regge non li vede:
       un tasto che si preme e non fa niente è peggio di un tasto che
       non c'è. */
    ...(puoSpecchiare(v) ? [{ chiave: 'specchia', icona: '⇄', titolo: 'rovescialo' }] : []),
    { chiave: 'via', icona: '📦', titolo: 'mettilo via' },
  ]
})

/* Quanto è larga la barretta degli attrezzi, ricavata invece che
   cablata. Erano 140 px scritti a mano, giusti finché i tasti sono tre;
   il primo che ne aggiunge uno se la trova mezza fuori dallo schermo da
   un lato, e non se ne accorge finché non tocca proprio un oggetto sul
   bordo. Le misure sono quelle di `.fa-attrezzi` in `stile.css`: tasto
   44 (il minimo di un polpastrello), 6 di stacco, 5 di margine, 2 di
   bordo. */
const larghezzaAttrezzi = quanti => 44 * quanti + 6 * (quanti - 1) + 14

/* Gli attrezzi non stanno mai sotto un foglio aperto. Non è solo che
   non si vedrebbero: chiudendo il foglio **ricomparirebbero**, ed è così
   che il menù tornava da solo sopra il campo appena seminato. */
const doveAttrezzi = computed(() => {
  const s = scelto.value
  if (!s || !s.id || !scena || preso || pannello.value) return null
  const g = mondo.ingombro(s)
  const larga = larghezzaAttrezzi(gestiDiScelto.value.length + 1)   // +1 è il ✓
  return {
    x: Math.max(8, Math.min(scena.L - larga - 8,
                            (g.x + g.w / 2) * scena.cellaPx - scena.vista.x - larga / 2)),
    y: Math.max(8, g.y * scena.cellaPx - scena.vista.y - 60 - scena.cellaPx),
  }
})

function attrezzo(chiave) {
  const s = scelto.value
  if (!s) return
  if (chiave === 'gira') {
    const r = mondo.gira(s)
    if (!r.ok) avvisa('Girato non ci sta: fagli spazio.')
    else salva()
  }
  /* Rovesciare non cambia l'ingombro, quindi non può mai mancare il
     posto e non c'è niente da spiegare a nessuno: si fa e si salva. */
  if (chiave === 'specchia' && mondo.specchia(s).ok) salva()
  if (chiave === 'via') {
    /* Adesso può dire no: un campo seminato e un mulino al lavoro non si
       mettono via, perché nel baule non c'è posto per un grano a metà
       crescita. Prima non c'era niente da rifiutare e il valore di
       ritorno si buttava — ora buttarlo vorrebbe dire un tasto che non fa
       niente senza spiegare perché. */
    const r = mondo.mettiVia(s)
    if (!r.ok) return avvisa(r.motivo === 'campo-seminato'
      ? 'Nel campo c\'è qualcosa che sta crescendo: raccoglilo prima.'
      : `${(PER_ID[s.id] || {}).nome || 'La macchina'} sta lavorando: ` +
        'ritira quello che ha fatto, prima.')
    scelto.value = null
    salva()
  }
}

/* ═══════════ i campi e le macchine ═══════════
   Il tocco su una cosa che *lavora* apre la sua scheda. Chi non lavora —
   una panchina, una casa — non apre niente e resta solo selezionato, come
   ha sempre fatto.

   *C'era una variante* che spegneva la coltivazione dalla pagina dei
   grandi, e non c'è più: la fattoria **è** la coltivazione, e senza non
   resterebbe un posto più semplice ma un prato con dei mobili. */
function apriLavoro(cosa, con = '') {
  if (eCampo(cosa)) return apriCampo(cosa)
  if (macchinaDi(cosa)) return apriMacchina(cosa)
  /* Il silo non lavora — non trasforma niente — ma **contiene**: è la
     cosa che tiene il raccolto, e toccarla è il modo di guardarci
     dentro. Era una linguetta del baule, in mezzo alle cose da
     comprare; il perché del cambio sta in `viste/Granaio.vue`. */
  if (eSilo(cosa)) return apriGranaio(siloDi(cosa))
  /* `con` arriva solo da un consiglio, e solo il carretto lo usa: chi
     ci è mandato perché un certo scomparto è pieno il primo passo
     l'ha già fatto, e ripeterglielo è il compito che il consiglio
     doveva togliere. */
  if (eVicino(cosa)) return apriVicino(con)
}

/* Il carretto: due passi, e il secondo si ricalcola ogni volta invece di
   tenerlo da parte. Cosa il vicino può offrire dipende da cosa c'è
   ancora posto per ricevere, e il posto cambia dopo ogni scambio — un
   elenco tenuto in mano da prima proporrebbe una merce che nel
   frattempo è diventata colma, cioè cinque pezzi dati via per niente. */
function apriVicino(scelto = '') {
  pannello.value = {
    tipo: 'vicino', scelto,
    puoiDare: cosaPuoiDare(mondo),
    offerte: scelto ? cosaOffre(mondo, scelto) : [],
    colmi: scompartiColmi(mondo).length,
  }
}

function alVicino(verso) {
  const { scelto } = pannello.value
  const r = scambia(mondo, scelto, verso)
  if (!r.ok) return avvisa(r.motivo === 'poca-roba'
    ? `Ne servono ${DAI} per darglieli.`
    : 'Lì non ci starebbe più: prova con qualcos\'altro.')
  const dato = `${r.quanti} ${PRODOTTI[r.dato].emoji}`
  avvisa(r.verso
    ? `${dato} → ${r.ricevuti} ${PRODOTTI[r.verso].emoji}. Il vicino ringrazia!`
    : `${dato} al vicino. «Grazie!»`)
  salva()
  /* Si resta sul carretto, al primo passo: chi ne aveva trenta di una
     cosa ne ha ancora venticinque, e chiudere il foglio vorrebbe dire
     riaprirlo cinque volte. */
  apriVicino('')
}

/* Si apre **quel** silo, non «il granaio»: sono due magazzini separati
   con due tetti separati, e toccare il silo bianco per vedere il grano
   sarebbe la stessa confusione di prima con un'altra faccia. */
function apriGranaio(famiglia) {
  pannello.value = { tipo: 'granaio', famiglia,
                     scomparti: mondo.scomparti(famiglia),
                     livello: mondo.livelloDelSilo(famiglia),
                     costo: mondo.costoDellIngrandimento(famiglia) }
}

/* Ingrandire è la sola cosa che si fa da dentro un silo, e il foglio si
   rifà con i numeri nuovi invece di chiudersi: si guarda il posto che
   si è appena comprato, e chi ne vuole altri due è già lì. */
function ingrandisci() {
  const { famiglia } = pannello.value
  const r = mondo.ingrandisci(famiglia)
  if (!r.ok) return avvisa(r.motivo === 'poche-monete'
    ? `Ti servono 🪙${r.costo - monete.value} in più.`
    : 'Questo silo non c\'è ancora.')
  apriGranaio(famiglia)
  avvisa(`${SILI[famiglia].emoji} Più grande: adesso ci stanno ${r.capienza} cose di ogni tipo.`)
  salva()
}

/* ═══════════ IL PROSSIMO PASSO ═══════════
   Le regole di cosa consigliare stanno nel motore (`motore/consiglio.js`)
   e girano senza schermo; qui c'è solo il braccio che **esegue** quello
   che il consiglio ha deciso. Quattro forme e non una di più: se ne
   servisse una quinta, il posto dove aggiungerla è quel file, non
   questo.

   Il foglio da cui si è partiti si chiude sempre: il consiglio manda
   da un'altra parte, e lasciare aperto quello di prima vorrebbe dire
   due fogli sovrapposti — e un tasto «chiudi» che scopre una schermata
   che non si stava guardando. */
function faiIlPasso(azione) {
  if (!azione) return chiudi()
  chiudi()
  if (azione.che === 'apri') {
    /* Non basta aprirne il foglio: la cosa può stare fuori dallo
       schermo, e chiudendo il foglio ci si ritroverebbe a guardare il
       prato sbagliato senza sapere dove si è finiti. */
    guarda(azione.cosa)
    return apriLavoro(azione.cosa, azione.con)
  }
  if (azione.che === 'compra') { punta.value = azione.voce; pannello.value = 'roba'; return }
  if (azione.che === 'ingrandisci') return ingrandisciIlSilo(azione.famiglia)
}

/* La telecamera si sposta su una cosa, se non si vede già: se si vede,
   fermo. Un salto di mezzo schermo per centrare una cosa che era già
   davanti agli occhi fa perdere il posto a chi guardava. */
function guarda(cosa) {
  if (!scena || !cosa) return
  const g = mondo.ingombro(cosa)
  const x = (g.x + g.w / 2) * scena.cellaPx, y = (g.y + g.h / 2) * scena.cellaPx
  const dentro = x - scena.vista.x > 40 && x - scena.vista.x < scena.L - 40 &&
                 y - scena.vista.y > 40 && y - scena.vista.y < scena.A - 40
  if (dentro) return
  scena.vista.x = Math.round(x - scena.L / 2)
  scena.vista.y = Math.round(y - scena.A / 2)
  scena.limita()
}

/* Ingrandire un silo **senza passare dal suo foglio**: è il tasto che
   compare in fondo a un campo pronto che non ha dove scaricare. Chi lo
   preme sta guardando il campo, non il silo, quindi non si apre il
   granaio: si paga, si dice cos'è cambiato, e il campo si ritrova
   raccoglibile. */
function ingrandisciIlSilo(famiglia) {
  const r = mondo.ingrandisci(famiglia)
  if (!r.ok) return avvisa(r.motivo === 'poche-monete'
    ? `Ti servono 🪙${r.costo - monete.value} in più.`
    : 'Questo silo non c\'è ancora.')
  avvisa(`${SILI[famiglia].emoji} Più grande: adesso ci stanno ${r.capienza} cose di ogni tipo.`)
  salva()
}

/* Quello che il gioco dice quando una roba non ha dove finire. Sono due
   cose da fare diverse — costruire il silo, o ingrandirlo — e un
   cartello che dice quella sbagliata è peggio di nessun cartello.

   Da quando ogni merce ha il suo scomparto, il pieno è **di quella
   merce** e non del silo: dirlo per esteso («lo scomparto del mais è
   pieno») è la differenza fra un bambino che guarda il silo e non
   capisce cosa c'è di pieno, e uno che sa che le carote entrano
   ancora. */
function nonCiSta(r) {
  const si = SILI[r.famiglia] || SILI.terra
  const pr = PRODOTTI[r.prodotto] || { emoji: '📦', nome: 'roba' }
  if (r.motivo === 'silo-manca')
    return `${pr.emoji} non ha dove andare: ti serve il ${si.nome.toLowerCase()}` +
           ` (🪙${mondo.quantoCosta(si.cosa)}).`
  return `Lo scomparto ${pr.emoji} è pieno (${mondo.capienzaDi(r.famiglia)}).` +
         ' Le altre cose entrano ancora.'
}

/* Lo stato si rilegge **a ogni apertura** e non si tiene da parte: è un
   conto sull'orologio vero (`statoCampo`), e uno tenuto in mano da ieri
   direbbe che manca ancora mezz'ora a un grano già pronto. */
function apriCampo(cosa) {
  const stato = mondo.statoCampo(cosa)
  if (!stato) return
  pannello.value = { tipo: 'campo', cosa, stato,
                     /* solo quelle che il livello ha aperto: due al
                        primo campo, e due scelte a quattro anni sono
                        una scelta — cinque sono un elenco */
                     /* Ognuna con **quanto ne hai già** e quanto ci sta
                        ancora: seminare è una scelta fra cinque cose, e
                        senza quel numero si sceglie a memoria — cioè si
                        semina sempre la stessa e ci si accorge del silo
                        tappato dieci minuti dopo, a raccolto pronto. */
                     colture: COLTURE.filter(c => (c.liv || 1) <= mondo.livello)
                       .map(c => ({ ...c, hai: mondo.quantoHo(c.da),
                                    ciSta: mondo.quantoCiSta(c.da) })),
                     ciSta: stato.coltura ? mondo.quantoCiSta(stato.coltura.da) : 99,
                     /* si dice **prima di seminare** che servirà un posto
                        dove metterlo: scoprirlo a raccolto pronto vuol
                        dire aver aspettato dieci minuti per niente */
                     senzaSilo: !mondo.eCostruito('terra'),
                     prezzoSilo: mondo.quantoCosta(SILI.terra.cosa),
                     /* Il passo si calcola **solo quando serve**: è una
                        camminata sulla catena, e farla a ogni apertura
                        di ogni campo sarebbe lavoro buttato nove volte
                        su dieci. */
                     passo: stato.coltura && stato.pronto &&
                            mondo.quantoCiSta(stato.coltura.da) < stato.coltura.resa
                       ? comeFarePosto(mondo, stato.coltura.da) : null }
}

function semina(coltura) {
  const { cosa } = pannello.value
  const r = mondo.seminaCampo(cosa, coltura.id)
  if (!r.ok) return avvisa(r.motivo === 'poche-monete'
    ? `Ti ${r.costo - monete.value === 1 ? 'serve' : 'servono'} 🪙${r.costo - monete.value} in più.`
    : 'Qui c\'è già qualcosa.')
  /* Non si conta la semina: chi semina raccoglie, e due contatori per lo
     stesso giro darebbero due numeri che dicono la stessa cosa e si
     scostano solo per i campi ancora in crescita. */
  chiudi()
  avvisa(`${coltura.emoji} Seminato. Torna fra ${coltura.minuti} minuti.`)
  salva()
}

function raccogli() {
  const { cosa } = pannello.value
  const r = mondo.raccogli(cosa)
  if (!r.ok) return avvisa(
    r.motivo === 'poche-monete' ? `Ti servono 🪙${r.costo - monete.value} in più: il campo ti aspetta.`
    : r.motivo === 'silo-manca' || r.motivo === 'silo-pieno' ? nonCiSta(r)
    : `Non è ancora pronto: manca ${r.manca} min.`)
  segna('fattoriaRaccolti')
  chiudi()
  avvisa(`${PRODOTTI[r.prodotto].emoji} +${r.quanto} nel silo!` + quantoNeResta(r))
  salva()
}

/* Quanti posti restano, in coda all'avviso di quando è appena entrata
   della roba: è il momento in cui la domanda «e adesso quanto ci sta?»
   viene da sola, ed è l'unico posto in cui la si può leggere senza
   aprire niente. Una riga in coda e non un cartello suo — un cartello
   in più a ogni raccolto diventa una cosa da chiudere, non da leggere —
   e si tace quando il silo è ancora largo, perché un numero che non
   preoccupa detto ogni volta smette di essere letto. */
function quantoNeResta(r) {
  const fam = (PRODOTTI[r.prodotto] || {}).silo
  const resta = mondo.quantoCiSta(r.prodotto)
  if (!fam || resta > 2) return ''
  return resta ? ` Restano ${resta} posti.` : ' Adesso è pieno: toccalo per ingrandirlo.'
}

/* Le ricette arrivano al pannello **già con quello che manca**: il conto
   è del motore (`cheMancaPer`), e il foglio lo mostra. Un tasto spento
   senza il perché è un tasto rotto. */
function apriMacchina(cosa) {
  const stato = mondo.statoMacchina(cosa)
  if (!stato) return
  pannello.value = {
    tipo: 'macchina', cosa, stato,
    /* Il nome viene dal catalogo e non dal pannello: le macchine adesso
       sono sette, e un foglio che dice «Il mulino» sopra un pollaio è la
       cosa che fa smettere di fidarsi di quello che c'è scritto. */
    nome: (PER_ID[cosa.id] || {}).nome || 'La macchina',
    bestie: !!statiDi(cosa),
    /* Solo quelle che il livello ha aperto: il pastone vuole il mais,
       che arriva sette livelli dopo il mulino, e mostrarlo prima era un
       tasto spento per cinque ore di esercizi (`dati/coltivazioni.js`). */
    ricette: ricetteDi(stato.macchina, mondo.livello).map(ricetta => {
      const m = mondo.cheMancaPer(ricetta.id)
      /* **Quanto ne hai già**, di quello che entra e di quello che esce.
         È la domanda che si fa davanti a una macchina con quattro
         ricette — non «posso?», a cui rispondono già il tasto spento e
         il numero che manca, ma «mi serve?». Senza, si preme sempre la
         prima. */
      const hai = { [ricetta.da]: mondo.quantoHo(ricetta.da) }
      for (const k of Object.keys(ricetta.prende)) hai[k] = mondo.quantoHo(k)
      /* Dove andare a prendere la **prima** cosa che manca. Una sola e
         non tutte: due consigli affiancati sono due tasti che portano
         in due posti, e chi legge sceglie di non premere né l'uno né
         l'altro. Fatta quella, alla riapertura il consiglio è il
         prossimo — che è il modo in cui una catena si percorre. */
      const primo = (m.manca || [])[0]
      return { ricetta, ...m, hai,
               passo: primo ? comeAvere(mondo, primo.prodotto) : null }
    }),
    ciSta: stato.ricetta ? mondo.quantoCiSta(stato.ricetta.da) : 99,
    /* Quale silo tocca a quello che sta uscendo, e se c'è: il pollaio
       riempie quello della stalla, il mulino quello del raccolto, e
       «metti un silo» senza dire *quale* manderebbe a comprare quello
       sbagliato — che costa 120 monete. */
    ...(stato.ricetta ? nomeDelSilo(stato.ricetta.da) : {}),
    /* E se quello che è pronto non ha dove finire, dove andarlo a
       mettere: stessa domanda del campo maturo, stessa risposta. */
    passo: stato.ricetta && stato.pronto &&
           mondo.quantoCiSta(stato.ricetta.da) < stato.ricetta.resa
      ? comeFarePosto(mondo, stato.ricetta.da) : null,
  }
}

/* Come si chiama il silo di questo prodotto, se è costruito e quanto
   costa. Serve ai fogli, che di silos non sanno niente. */
function nomeDelSilo(prodotto) {
  const fam = (PRODOTTI[prodotto] || {}).silo || 'terra'
  return { silo: SILI[fam].nome, senzaSilo: !mondo.eCostruito(fam),
           prezzoSilo: mondo.quantoCosta(SILI[fam].cosa) }
}

function avvia(ricetta) {
  const { cosa } = pannello.value
  const r = mondo.avvia(cosa, ricetta.id)
  if (!r.ok) return avvisa(r.motivo === 'poche-monete'
    ? `Ti servono 🪙${r.costo - monete.value} in più.` : 'Non c\'è abbastanza roba.')
  chiudi()
  /* Diceva «Il mulino è partito» anche sopra un pollaio — la stessa
     bugia che il pannello aveva già smesso di dire. Il nome della
     macchina però non si può infilare in questa frase: «la conigliera
     è partito» è peggio del difetto che ripara, e le sette macchine
     hanno tre generi fra loro. Quindi si dice **quello che sta
     arrivando**, che è l'unica cosa che chi ha appena premuto non sa
     già — la macchina ce l'ha sotto il dito. */
  avvisa(`${ricetta.emoji} ${ricetta.nome} fra ${ricetta.minuti} minuti.`)
  salva()
}

function ritira() {
  const { cosa } = pannello.value
  const r = mondo.ritira(cosa)
  if (!r.ok) return avvisa(r.motivo === 'silo-manca' || r.motivo === 'silo-pieno'
    ? nonCiSta(r) : `Manca ancora ${r.manca} min.`)
  segna('fattoriaRitiri')
  chiudi()
  avvisa(`${PRODOTTI[r.prodotto].emoji} +${r.quanto} nel silo!` + quantoNeResta(r))
  salva()
}

/* ═══════════ i pannelli ═══════════ */
function compraPiazzola() {
  const { px, py } = pannello.value
  const r = mondo.compraPiazzola(px, py)
  if (!r.ok) return avvisa(`Ti servono ${r.costo - monete.value} monete in più.`)
  segna('fattoriaTerre')
  /* Il mondo può essere appena cresciuto: la telecamera lo deve sapere
     **subito**, o il prato nuovo resta dietro un muro invisibile fino
     al prossimo giro di disegno. */
  inquadraIlMondo()
  scena.limita()
  chiudi()
  salva()
}

function sgombra() {
  const { o } = pannello.value
  const r = mondo.sgombra(o.x, o.y)
  if (!r.ok) return avvisa(`Ti servono ${r.costo - monete.value} monete in più.`)
  segna('fattoriaSgomberi')
  chiudi()
  salva()
}

/* Prima si sceglie il posto, poi il nome, poi si paga. Il nome prima del
   pagamento è la regola di sempre — un animale battezzato «dopo» resta
   «il cane» per sempre, perché quel dopo non arriva mai — e il posto è
   arrivato davanti a tutto da quando anche una bestia si posa: comprarla
   e trovarsela in mezzo al prato vorrebbe dire spostarla subito. */
function prendiUnaBestia({ bestia, x, y }) {
  pannello.value = null
  if (mondo.hoLaBestia(bestia.chi)) return avvisa(`${bestia.nome} è già tuo.`)
  if (bestia.prezzo > monete.value)
    return avvisa(`Ti servono ${bestia.prezzo - monete.value} monete in più.`)
  prendi(null, null, { x: x - riquadro().left, y: y - riquadro().top },
         { bestia: { chi: bestia.chi, compra: bestia }, pronto: false, clic: { x, y } })
}

/* Toccare una bestia mostra **come sta**, non chiede il nome: il nome
   glielo dai una volta, lo stato lo guardi ogni volta. */
function apriBestia(chi) {
  const b = mondo.laBestia(chi)
  if (!b) return
  pannello.value = { tipo: 'bestia', chi, che: nomeDi(chi), nome: b.nome || '',
                     stato: mondo.stato(chi) }
}

function nutri(cibo) {
  const chi = pannello.value.chi
  const nome = pannello.value.nome || pannello.value.che
  const r = mondo.nutri(chi, cibo)
  if (!r.ok) return avvisa(
    r.motivo === 'non-gli-piace' ? `${nome} non mangia ${cibo.nome.toLowerCase()}.`
    : r.motivo === 'non-ha-fame' ? 'Ha la pancia piena.'
    /* Il mangime non si compra: manca la roba, non le monete, e dirgli
       «ti servono 0 monete» sarebbe la risposta giusta alla domanda
       sbagliata. */
    : r.motivo === 'manca-roba' ? `Non hai ${cibo.nome.toLowerCase()}: passa dal mulino.`
    : `Ti servono ${r.costo - monete.value} monete in più.`)
  salva(); apriBestia(chi)
}

function coccola(gesto) {
  const chi = pannello.value.chi
  const r = mondo.coccola(chi, gesto)
  if (!r.ok) return avvisa(
    r.motivo === 'poche-monete'
      ? `Ti serve ${r.costo} moneta: falla giocare dopo qualche esercizio.`
    /* La copertina si paga in lana, non in monete: manca la roba, e
       dirgli «ti servono 0 monete» sarebbe la risposta giusta alla
       domanda sbagliata. Stessa forma del mangime in `nutri`. */
    : r.motivo === 'manca-roba' ? 'Non hai lana: tieni delle pecore, o dei conigli.'
    : 'Non ne ha bisogno adesso.')
  salva(); apriBestia(chi)
}

function battezza(nome) {
  const b = pannello.value
  pannello.value = null
  if (b.prezzo) {
    const r = mondo.compraBestia(b.chi, b.prezzo, nome, b.dove)
    if (!r.ok) return avvisa('Non è andata: riprova.')
    metti_in_scena_le_bestie()
    avvisa(nome ? `${nome} è arrivato!` : `${b.che} è arrivato!`)
  } else {
    mondo.rinominaBestia(b.chi, nome)
    avvisa(nome ? `Adesso si chiama ${nome}.` : 'Nome tolto.')
    apriBestia(b.chi)
  }
  salva()
}

/* Premuta una cosa nel baule, la posa comincia lì: il foglio si toglie
   di mezzo e l'anteprima è già agganciata alla griglia. Chi non ce l'ha
   la compra posandola — un gesto solo, e il prezzo si paga quando si sa
   già dove va. Le coordinate arrivano in pagina e la tela comincia sotto
   la barra: senza togliere l'origine l'anteprima nasce spostata. */
/* I prezzi che il baule deve mostrare **adesso**: quasi tutti sono
   quelli di catalogo, il campo no — rincara a ogni copia (`cresce` in
   `dati/catalogo.js`). È una funzione e non un `computed` perché
   `mondo` è un oggetto normale e non uno stato reattivo: si rilegge a
   ogni apertura del baule, che è esattamente quando serve. */
function prezziCorrenti() {
  const p = {}
  for (const v of CATALOGO) if (v.cresce) p[v.id] = mondo.quantoCosta(v.id)
  return p
}

/* Le cose uniche che stanno **già in mappa**: i due silos. Il baule non
   le mostra più, perché posarne una seconda non si può e un tasto che
   risponde «ne hai già uno» è un tasto rotto. Si guarda la mappa e non
   `quanteNeHo`, che conta anche il baule: un silo comprato e non ancora
   messo giù deve restare prendibile. */
function giaPosati() {
  return CATALOGO.filter(v => v.unico && mondo.cose.some(c => c.id === v.id))
    .map(v => v.id)
}

function tiraVoce({ voce, x, y }) {
  pannello.value = null
  const r = riquadro()
  prendi(voce, null, { x: x - r.left, y: y - r.top }, { pronto: false, clic: { x, y } })
}
</script>

<template>
  <div class="schermo">
    <Barra titolo="La fattoria" guida="fattoria" monete @indietro="emit('vai', 'home')" />

    <div class="fa">
    <!-- `touchend` esiste solo per **non** far nascere il click fantasma
         (vedi `zittisciIlFantasma`): il gioco si tocca coi puntatori,
         qui sotto un click non serve mai a nessuno. -->
    <canvas ref="tela" class="fa-tela"
            @pointerdown="premi" @pointermove="muovi" @pointerup="lascia"
            @pointercancel="annulla" @touchend="nienteClickDalCampo"
            @wheel.prevent="rotella"></canvas>

    <div class="fa-tasti">
      <!-- il livello sta in alto e si vede sempre: la domanda «e
           adesso?» viene guardando il prato, non aprendo un menù -->
      <button v-if="avanza" class="fa-liv" title="i livelli della fattoria"
              @click="apriLivelli">
        ⭐ {{ avanza.livello }}
        <i><u :style="{ width: Math.round(avanza.quanto * 100) + '%' }"></u></i>
      </button>
      <button class="fa-tondo" title="il baule" @click="apriIlBaule">📦</button>
    </div>

    <p v-if="avviso" class="fa-avviso">{{ avviso }}</p>

    <Attrezzi v-if="doveAttrezzi" :x="doveAttrezzi.x" :y="doveAttrezzi.y"
              :gesti="gestiDiScelto" @fai="attrezzo" @fine="scelto = null" />

    <div v-if="pannello" class="fa-velo" @click.self="chiudi()">
      <Roba v-if="pannello === 'roba'" class="fa-foglio"
            :monete="monete" :magazzino="mondo.magazzino" :bestie="mondo.bestie"
            :prezzi="prezziCorrenti()" :livello="livello" :posati="giaPosati()"
            :punta="punta"
            @tira="tiraVoce" @tira-bestia="prendiUnaBestia"
            @chiudi="chiudi()" />

      <Bestia v-else-if="pannello.tipo === 'bestia'"
              :chi="pannello.chi" :che="pannello.che" :nome="pannello.nome"
              :stato="pannello.stato" :monete="monete" :granaio="mondo.granaio"
              @nutri="nutri" @coccola="coccola"
              @rinomina="pannello = { tipo: 'battesimo', chi: pannello.chi,
                                      che: pannello.che, nome: pannello.nome, prezzo: 0 }"
              @chiudi="chiudi()" />

      <Campo v-else-if="pannello.tipo === 'campo'"
             :stato="pannello.stato" :monete="monete" :ci-sta="pannello.ciSta"
             :colture="pannello.colture" :passo="pannello.passo"
             :senza-silo="pannello.senzaSilo" :prezzo-silo="pannello.prezzoSilo"
             @semina="semina" @raccogli="raccogli" @passo="faiIlPasso"
             @chiudi="chiudi()" />

      <Livelli v-else-if="pannello.tipo === 'livello'"
               :stato="avanza" :festa="pannello.festa"
               @chiudi="chiudi()" />

      <Vicino v-else-if="pannello.tipo === 'vicino'"
              :puoi-dare="pannello.puoiDare" :offerte="pannello.offerte"
              :colmi="pannello.colmi" :scelto="pannello.scelto"
              @scegli="apriVicino" @scambia="alVicino" @regala="alVicino(null)"
              @chiudi="chiudi()" />

      <Granaio v-else-if="pannello.tipo === 'granaio'"
               :famiglia="pannello.famiglia"
               :scomparti="pannello.scomparti" :livello="pannello.livello"
               :costo="pannello.costo" :monete="monete"
               @ingrandisci="ingrandisci" @chiudi="chiudi()" />

      <Macchina v-else-if="pannello.tipo === 'macchina'"
                :stato="pannello.stato" :ricette="pannello.ricette"
                :nome="pannello.nome" :bestie="pannello.bestie"
                :ci-sta="pannello.ciSta" :silo="pannello.silo" :passo="pannello.passo"
                :senza-silo="pannello.senzaSilo" :prezzo-silo="pannello.prezzoSilo"
                @avvia="avvia" @ritira="ritira" @passo="faiIlPasso"
                @chiudi="chiudi()" />

      <Battesimo v-else-if="pannello.tipo === 'battesimo'"
                 :chi="pannello.chi" :che="pannello.che" :nome="pannello.nome || ''"
                 :prezzo="pannello.prezzo"
                 @conferma="battezza" @chiudi="chiudi()" />

      <div v-else-if="pannello.tipo === 'piazzola'" class="fa-foglio">
        <h2>Un altro pezzo di terra</h2>
        <p>Costa <b>🪙{{ mondo.prezzoDellaProssima }}</b>. Ogni pezzo dopo
           costa un po' di più.</p>
        <div class="fa-fila">
          <button class="fa-bot piano" @click="chiudi()">Lascia stare</button>
          <button class="fa-bot forte" :disabled="monete < mondo.prezzoDellaProssima"
                  @click="compraPiazzola">Compra</button>
        </div>
      </div>

      <div v-else class="fa-foglio">
        <h2>{{ pannello.o.nome }}</h2>
        <Provino :pezzo="pannello.o.pezzo" :lato="64" />
        <p>Toglierlo costa <b>🪙{{ pannello.o.costo }}</b>, e libera il posto
           per metterci quello che vuoi.</p>
        <div class="fa-fila">
          <button class="fa-bot piano" @click="chiudi()">Lascia stare</button>
          <button class="fa-bot forte" :disabled="monete < pannello.o.costo"
                  @click="sgombra">Sgombra</button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
