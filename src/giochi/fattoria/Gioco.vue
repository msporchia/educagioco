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
import { state, addCoins, segna, segnaBest, aspettoDi,
         varianteAccesa } from '../../store/profile.js'
import { scelta, ricorda } from '../campagne.js'

import { Fattoria } from './motore/fattoria.js'
import { Camminatore } from './motore/camminata.js'
import { Tela, Attore } from './scena/tela.js'
import { PER_ID, piedeDi, pezzoDi, puoGirare, eCampo, eSilo, macchinaDi,
         statiDi } from './dati/catalogo.js'
import { animale, siDisegna } from './dati/animali.js'
import { BISOGNI, CHIAVI } from './dati/bisogni.js'
import { PRODOTTI, ricetteDi, CHIAVE_VARIANTE } from './dati/coltivazioni.js'
import { pezzoAttore } from './dati/atlante.js'
import { CELLE, SCALA_INIZIALE, piazzolaDi } from './dati/mondo.js'

import Roba from './viste/Roba.vue'
import Attrezzi from './viste/Attrezzi.vue'
import Battesimo from './viste/Battesimo.vue'
import Bestia from './viste/Bestia.vue'
import Campo from './viste/Campo.vue'
import Granaio from './viste/Granaio.vue'
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

/* ═══════════ lo stato ═══════════ */
const tela = ref(null)
const monete = computed(() => state.profile.coins || 0)
/* Metà di questo posto si può spegnere dalla pagina dei grandi, ed è una
   variante e non un gioco: la carta della fattoria resta in home. Spenta,
   un campo torna il disegno che era — vedi `dati/coltivazioni.js`. */
const coltivazione = computed(() => varianteAccesa(CHIAVE_VARIANTE))
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

function salva() { salvaFra = 1.2 }
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

/* ═══════════ nascere ═══════════ */
onMounted(() => {
  mondo = new Fattoria({ borsa, dato: scelta(CHIAVE, 'stato', null) })

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
  giu = { ...p, x0: p.x, y0: p.y, mosso: false }
  scorrendo = false
  if (pennello.value) return dipingi(p)

  /* Una cosa già in mano si posa toccando dove deve andare: è il
     secondo tempo del gesto che parte dal baule, per chi ha toccato e
     lasciato invece di trascinare. */
  if (preso) { preso.pronto = true; return muoviPreso(p) }

  const c = scena.cellaDa(p.x, p.y)

  /* Le bestie prima di tutto: stanno **sopra** al prato e sopra alle
     cose, e il loro bersaglio è quello che si vede. Tenerla premuta
     l'aggancia — un cane si sposta come una panchina, ed è così che si
     mette in un recinto — ma finché il dito non si muove è ancora un
     tocco, e un tocco su una bestia apre la sua scheda. */
  const bestia = attoreSotto(p.x, p.y)
  if (bestia && mondo.hoLaBestia(bestia.nome))
    return arma(p, { tipo: 'bestia', bestia: { chi: bestia.nome, attore: bestia } })

  const cosa = mondo.cosaSotto(c.x, c.y)

  /* Tenere premuto sul prato vuoto apre il baule. È lo stesso gesto con
     cui si prende una cosa che c'è già — «tieni premuto dove vuoi agire»
     — e risparmia il viaggio fino al tasto in alto: si tiene premuto
     **dove** si vuole mettere qualcosa. Il baule si apre **al rilascio**
     e non allo scadere del tempo: allo scadere del tempo comparirebbe
     sotto un dito ancora appoggiato, e chi nel frattempo ha deciso di
     spostare la vista si troverebbe un foglio in faccia. */
  if (!cosa && mondo.cellaMia(c.x, c.y) && !mondo.ostacoloSotto(c.x, c.y))
    return arma(p, { tipo: 'baule' })

  if (!cosa || !mondo.cellaMia(c.x, c.y)) return
  arma(p, { tipo: 'cosa', voce: PER_ID[cosa.id], da: cosa })
}

/* L'anello che si riempie sotto il dito, e quello che vuol dire: finché
   non è pieno non è successo niente; quando è pieno la cosa è
   **agganciata** — «adesso puoi trascinare» — e resta lì a dirlo finché
   il dito non si muove o non si stacca. */
function arma(p, quale) {
  anello = { x: p.x, y: p.y, q: 0, pronto: false }
  riempiAnello(performance.now())
  lungo = setTimeout(() => {
    lungo = null
    aggancio = quale
    if (anello) anello.pronto = true
  }, ATTESA)
}

function riempiAnello(t0) {
  const cresci = () => {
    if (!anello) return
    anello.q = Math.min(1, (performance.now() - t0) / ATTESA)
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
    pannello.value = 'roba'
    return
  }

  const c = scena.cellaDa(p.x, p.y)
  const px = piazzolaDi(c.x), py = piazzolaDi(c.y)

  /* Comprare la terra viene PRIMA di tutto. Le bestie non ci vanno mai —
     restano su quello che è tuo — ma il loro bersaglio è più largo della
     cella su cui poggiano, e sporgendo sul bosco accanto si mangiava il
     tocco: alcune piazzole diventavano incomprabili a seconda di dove si
     era fermato il cane, il che è il tipo di guasto che sembra un caso. */
  if (mondo.comprabile(px, py)) { pannello.value = { tipo: 'piazzola', px, py }; return }

  const bestia = attoreSotto(p.x, p.y)
  if (bestia) {
    scelto.value = bestia
    apriBestia(bestia.nome)
    /* Accanto al bambino, non addosso: se lì non si può stare — c'è
       una panchina, è acqua — ci pensa `vaiA` ad accostarsi il più
       vicino possibile invece di lasciare la bestia ferma. */
    bestia.corpo.vaiA(bambino.corpo.cella.x, bambino.corpo.cella.y + 1, dovePasso)
    return
  }

  /* Un tocco secco su una cosa la **seleziona**: compaiono i suoi
     attrezzi, e da lì la si gira o la si mette via. Prima non faceva
     niente e per muoverla si teneva premuto — ma chi la teneva premuta
     una seconda volta finiva dritto nel trascinamento, senza mai vedere
     il tastino «mettila via». Adesso i due gesti sono separati: tocchi
     per scegliere, tieni premuto per spostare. */
  const cosa = mondo.cosaSotto(c.x, c.y)
  if (cosa && mondo.cellaMia(c.x, c.y)) {
    scelto.value = cosa
    /* Un campo e un mulino si toccano come si tocca un cane: il tocco
       apre la loro scheda, e da lì si semina o si macina. Gli attrezzi
       («giralo», «mettilo via») restano dietro al foglio e tornano
       quando lo si chiude — sono la cosa che si fa una volta, non quella
       che si fa ogni volta. */
    apriLavoro(cosa)
    return
  }
  if (scelto.value) { scelto.value = null; return }

  const o = mondo.ostacoloSotto(c.x, c.y)
  if (o) { pannello.value = { tipo: 'ostacolo', o }; return }
  if (mondo.cellaMia(c.x, c.y)) bambino.corpo.vaiA(c.x, c.y, dovePasso)
}

/* Chi c'è sotto il dito. Si guarda il rettangolo davvero disegnato, non
   la cella: è l'unico modo perché toccare un cane grosso funzioni dove
   il cane si vede, e non solo dove appoggia. */
function attoreSotto(sx, sy) {
  for (let i = attori.length - 1; i >= 0; i--) {
    const a = attori[i]
    if (a === bambino) continue
    const p2 = pezzoAttore(a.nome, a.corpo.verso === 'sinistra' ? 'lato' : a.corpo.verso, 0)
    const r = a.riquadro(scena.cellaPx, scena.vista, p2)
    if (sx >= r.x - 4 && sx <= r.x + r.w + 4 && sy >= r.y && sy <= r.y + r.h + 4) return a
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
  preso = { voce, da, bestia, cx: null, cy: null, ok: false,
            piede: [1, 1], pezzo: null, pronto: opz.pronto !== false,
            x0: p ? p.x : 0, y0: p ? p.y : 0 }
  scelto.value = bestia ? bestia.attore || null : (da || null)
  pannello.value = null
  if (p) muoviPreso(p)
}

/* L'ingombro vero e la figura vera di quello che si ha in mano. Una
   bestia sta in una cella sola e ci va **camminandoci**, quindi la
   domanda che le si fa è `calpestabile` e non `libera`: una bestia si
   posa dove potrebbe arrivare da sé, e in acqua o dentro una casa no. */
function muoviPreso(p) {
  if (!preso) return
  const { voce, da, bestia } = preso
  const finto = da || (voce ? { id: voce.id, g: 0 } : null)
  const piede = bestia ? [1, 1] : piedeDi(finto, voce)
  const c = scena.cellaDa(p.x, p.y)
  preso.piede = piede
  preso.pezzo = bestia ? bestia.chi + '_giu0' : pezzoDi(finto, voce)
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
  if (r.cosa) scelto.value = r.cosa
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
    { chiave: 'via', icona: '📦', titolo: 'mettilo via' },
  ]
})

const doveAttrezzi = computed(() => {
  const s = scelto.value
  if (!s || !s.id || !scena || preso) return null
  const g = mondo.ingombro(s)
  return {
    x: Math.max(8, Math.min(scena.L - 140, (g.x + g.w / 2) * scena.cellaPx - scena.vista.x - 60)),
    y: Math.max(8, g.y * scena.cellaPx - scena.vista.y - 54 - scena.cellaPx),
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
  if (chiave === 'via') {
    /* Adesso può dire no: un campo seminato e un mulino al lavoro non si
       mettono via, perché nel baule non c'è posto per un grano a metà
       crescita. Prima non c'era niente da rifiutare e il valore di
       ritorno si buttava — ora buttarlo vorrebbe dire un tasto che non fa
       niente senza spiegare perché. */
    const r = mondo.mettiVia(s)
    if (!r.ok) return avvisa(r.motivo === 'campo-seminato'
      ? 'Nel campo c\'è qualcosa che sta crescendo: raccoglilo prima.'
      : 'Il mulino sta lavorando: ritira quello che ha fatto, prima.')
    scelto.value = null
    salva()
  }
}

/* ═══════════ i campi e le macchine ═══════════
   Il tocco su una cosa che *lavora* apre la sua scheda. Chi non lavora —
   una panchina, una casa — non apre niente e resta solo selezionato, come
   ha sempre fatto.

   A variante spenta non si apre niente: un campo torna il disegno che
   era, e questa è l'unica riga che se ne accorge. */
function apriLavoro(cosa) {
  if (!coltivazione.value) return
  if (eCampo(cosa)) return apriCampo(cosa)
  if (macchinaDi(cosa)) return apriMacchina(cosa)
  /* Il silo non lavora — non trasforma niente — ma **contiene**: è la
     cosa che tiene il raccolto, e toccarla è il modo di guardarci
     dentro. Era una linguetta del baule, in mezzo alle cose da
     comprare; il perché del cambio sta in `viste/Granaio.vue`. */
  if (eSilo(cosa)) return apriGranaio()
}

function apriGranaio() {
  pannello.value = { tipo: 'granaio', granaio: mondo.granaio,
                     capienza: mondo.capienzaDelGranaio,
                     silos: mondo.quantiSilos }
}

/* Lo stato si rilegge **a ogni apertura** e non si tiene da parte: è un
   conto sull'orologio vero (`statoCampo`), e uno tenuto in mano da ieri
   direbbe che manca ancora mezz'ora a un grano già pronto. */
function apriCampo(cosa) {
  const stato = mondo.statoCampo(cosa)
  if (!stato) return
  pannello.value = { tipo: 'campo', cosa, stato,
                     ciSta: stato.coltura ? mondo.quantoCiSta(stato.coltura.da) : 99 }
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
  pannello.value = null
  avvisa(`${coltura.emoji} Seminato. Torna fra ${coltura.minuti} minuti.`)
  salva()
}

function raccogli() {
  const { cosa } = pannello.value
  const r = mondo.raccogli(cosa)
  if (!r.ok) return avvisa(
    r.motivo === 'poche-monete' ? `Ti servono 🪙${r.costo - monete.value} in più: il campo ti aspetta.`
    : r.motivo === 'granaio-pieno' ? 'Il granaio è pieno: serve un silo.'
    : `Non è ancora pronto: manca ${r.manca} min.`)
  segna('fattoriaRaccolti')
  pannello.value = null
  avvisa(`${PRODOTTI[r.prodotto].emoji} +${r.quanto} nel granaio!` + seNonHaiSilos())
  salva()
}

/* Il granaio si guarda toccando un silo (`viste/Granaio.vue`), quindi chi
   non ne ha uno **non ha ancora nessun modo di vederlo** — e non deve
   scoprirlo il giorno che un campo non si raccoglie perché è pieno. Si
   dice qui: nel momento esatto in cui è appena entrata della roba, che è
   quando la domanda «dove è finita?» viene da sola. Una riga in coda
   all'avviso e non un cartello suo: un cartello in più a ogni raccolto
   diventa una cosa da chiudere, non da leggere. */
function seNonHaiSilos() {
  return mondo.quantiSilos ? '' : ' Metti un silo per vedere cosa hai.'
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
    ricette: ricetteDi(stato.macchina)
      .map(ricetta => ({ ricetta, ...mondo.cheMancaPer(ricetta.id) })),
    ciSta: stato.ricetta ? mondo.quantoCiSta(stato.ricetta.da) : 99,
  }
}

function avvia(ricetta) {
  const { cosa } = pannello.value
  const r = mondo.avvia(cosa, ricetta.id)
  if (!r.ok) return avvisa(r.motivo === 'poche-monete'
    ? `Ti servono 🪙${r.costo - monete.value} in più.` : 'Non c\'è abbastanza roba.')
  pannello.value = null
  avvisa(`${ricetta.emoji} Il mulino è partito: ${ricetta.minuti} minuti.`)
  salva()
}

function ritira() {
  const { cosa } = pannello.value
  const r = mondo.ritira(cosa)
  if (!r.ok) return avvisa(r.motivo === 'granaio-pieno'
    ? 'Il granaio è pieno: serve un silo.' : `Manca ancora ${r.manca} min.`)
  segna('fattoriaRitiri')
  pannello.value = null
  avvisa(`${PRODOTTI[r.prodotto].emoji} +${r.quanto} nel granaio!` + seNonHaiSilos())
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
  pannello.value = null
  salva()
}

function sgombra() {
  const { o } = pannello.value
  const r = mondo.sgombra(o.x, o.y)
  if (!r.ok) return avvisa(`Ti servono ${r.costo - monete.value} monete in più.`)
  segna('fattoriaSgomberi')
  pannello.value = null
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
         { bestia: { chi: bestia.chi, compra: bestia }, pronto: false })
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
function tiraVoce({ voce, x, y }) {
  pannello.value = null
  const r = riquadro()
  prendi(voce, null, { x: x - r.left, y: y - r.top }, { pronto: false })
}
</script>

<template>
  <div class="schermo">
    <Barra titolo="La fattoria" monete @indietro="emit('vai', 'home')" />

    <div class="fa">
    <!-- `touchend` esiste solo per **non** far nascere il click fantasma
         (vedi `zittisciIlFantasma`): il gioco si tocca coi puntatori,
         qui sotto un click non serve mai a nessuno. -->
    <canvas ref="tela" class="fa-tela"
            @pointerdown="premi" @pointermove="muovi" @pointerup="lascia"
            @pointercancel="annulla" @touchend="nienteClickDalCampo"
            @wheel.prevent="rotella"></canvas>

    <div class="fa-tasti">
      <button class="fa-tondo" title="il baule" @click="pannello = 'roba'">📦</button>
    </div>

    <p v-if="avviso" class="fa-avviso">{{ avviso }}</p>

    <Attrezzi v-if="doveAttrezzi" :x="doveAttrezzi.x" :y="doveAttrezzi.y"
              :gesti="gestiDiScelto" @fai="attrezzo" @fine="scelto = null" />

    <div v-if="pannello" class="fa-velo" @click.self="pannello = null">
      <Roba v-if="pannello === 'roba'" class="fa-foglio"
            :monete="monete" :magazzino="mondo.magazzino" :bestie="mondo.bestie"
            :granaio="mondo.granaio" :capienza="mondo.capienzaDelGranaio"
            :coltivazione="coltivazione"
            @tira="tiraVoce" @tira-bestia="prendiUnaBestia"
            @chiudi="pannello = null" />

      <Bestia v-else-if="pannello.tipo === 'bestia'"
              :chi="pannello.chi" :che="pannello.che" :nome="pannello.nome"
              :stato="pannello.stato" :monete="monete" :granaio="mondo.granaio"
              @nutri="nutri" @coccola="coccola"
              @rinomina="pannello = { tipo: 'battesimo', chi: pannello.chi,
                                      che: pannello.che, nome: pannello.nome, prezzo: 0 }"
              @chiudi="pannello = null" />

      <Campo v-else-if="pannello.tipo === 'campo'"
             :stato="pannello.stato" :monete="monete" :ci-sta="pannello.ciSta"
             @semina="semina" @raccogli="raccogli" @chiudi="pannello = null" />

      <Granaio v-else-if="pannello.tipo === 'granaio'"
               :granaio="pannello.granaio" :capienza="pannello.capienza"
               :silos="pannello.silos" @chiudi="pannello = null" />

      <Macchina v-else-if="pannello.tipo === 'macchina'"
                :stato="pannello.stato" :ricette="pannello.ricette"
                :nome="pannello.nome" :bestie="pannello.bestie"
                :ci-sta="pannello.ciSta"
                @avvia="avvia" @ritira="ritira" @chiudi="pannello = null" />

      <Battesimo v-else-if="pannello.tipo === 'battesimo'"
                 :chi="pannello.chi" :che="pannello.che" :nome="pannello.nome || ''"
                 :prezzo="pannello.prezzo"
                 @conferma="battezza" @chiudi="pannello = null" />

      <div v-else-if="pannello.tipo === 'piazzola'" class="fa-foglio">
        <h2>Un altro pezzo di terra</h2>
        <p>Costa <b>🪙{{ mondo.prezzoDellaProssima }}</b>. Ogni pezzo dopo
           costa un po' di più.</p>
        <div class="fa-fila">
          <button class="fa-bot piano" @click="pannello = null">Lascia stare</button>
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
          <button class="fa-bot piano" @click="pannello = null">Lascia stare</button>
          <button class="fa-bot forte" :disabled="monete < pannello.o.costo"
                  @click="sgombra">Sgombra</button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
