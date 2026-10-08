<script setup>
/* La fattoria — il coordinatore: regole in motore/fattoria.js, disegno in scena/tela.js, tabelle
   in dati/. Salva in profile.campagne.fattoria.cfg.stato, a ritardo. Vedi docs/fattoria/regole.md. */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, toRaw, watch } from 'vue'
import Barra from '../../components/Barra.vue'
import { state, addCoins, segna, segnaBest, aspettoDi, cestinaOra, flushNow } from '../../store/profile.js'
import { scelta, ricorda } from '../campagne.js'

import { Fattoria } from './motore/fattoria.js'
import { fattoriaTipo } from './motore/tipo.js'
import { comeAvere, comeFarePosto } from './motore/consiglio.js'
import { carrettoIn, cosaPuoiDare, cosaOffre, scambia, scompartiColmi, DAI }
  from './motore/vicino.js'
import { aggiornaIlMercato, bancoDi, consegna, rifiuta } from './motore/mercato.js'
import { aggiornaLaBottega, aggiornaLeBotteghe, bottegaDi, consegnaInBottega,
         rifiutaInBottega } from './motore/botteghe.js'
import { postoDi } from './dati/catalogo.js'
import Bottega from './viste/Bottega.vue'
import { aggiornaLaMongolfiera, caricaLaCassa, naveDi, parti as partiLaMongolfiera }
  from './motore/mongolfiera.js'
import { eMongolfiera } from './dati/catalogo.js'
import Mongolfiera from './viste/Mongolfiera.vue'
import { Camminatore } from './motore/camminata.js'
import { Tela, Attore } from './scena/tela.js'
import { spintaAlBordo, conIlResto } from './scena/spinta.js'
import { SCARTO_DITO, SCARTO_MOUSE } from './scena/dito.js'
import { CATALOGO, PER_ID, ZONE, ANIMALI_ZONA, piedeDi, pezzoDi, assettoDi,
         puoGirare, puoSpecchiare, eCampo, eSilo, eVicino, eMercato, siloDi,
         macchinaDi, statiDi } from './dati/catalogo.js'
import { animale, siDisegna, IN_VENDITA, BOB, puntiDi } from './dati/animali.js'
import { addobbo } from './dati/addobbi.js'
import { BISOGNI, CHIAVI, foto } from './dati/bisogni.js'
import { PRODOTTI, SILI, COLTURE, ricetteDi, MINUTO } from './dati/coltivazioni.js'
import { RIPOSO_MIN } from './dati/mercato.js'
import { sogliaDi, chiaveDi, zonaDi } from './dati/livelli.js'
import { pezzoAttore, PEZZI } from './dati/atlante.js'
import { CELLE, T, SCALA_INIZIALE, COSTO_SPOSTARE, piazzolaDi } from './dati/mondo.js'
import { stagioneDi, semeDelGiorno, addobbiStagionali, FINESTRE } from './dati/stagioni.js'

import Roba from './viste/Roba.vue'
import Vicino from './viste/Vicino.vue'
import Mercato from './viste/Mercato.vue'
import Vestiario from './viste/Vestiario.vue'
import Attrezzi from './viste/Attrezzi.vue'
import Battesimo from './viste/Battesimo.vue'
import Bestia from './viste/Bestia.vue'
import Campo from './viste/Campo.vue'
import Granaio from './viste/Granaio.vue'
import Livelli from './viste/Livelli.vue'
import Macchina from './viste/Macchina.vue'
import Albero from './viste/Albero.vue'
import Chiudi from './viste/Chiudi.vue'
import { alberoDi } from './dati/albero.js'
import Provino from './viste/Provino.vue'
import Bolla from './viste/Bolla.vue'
import Merce from './viste/Merce.vue'
import './stile.css'

defineOptions({ name: 'LaFattoria' })
const emit = defineEmits(['vai'])

const CHIAVE = 'fattoria'
// Quanto tenere premuto perché il gesto si agganci — vedi docs/fattoria/come-si-tocca.md.
const ATTESA = 420

// Ritardo prima che l'anello compaia, per non mostrarlo su un tocco normale — vedi docs/fattoria/come-si-tocca.md.
const RITARDO_ANELLO = 180

/* ═══════════ lo stato ═══════════ */
const tela = ref(null)
const monete = computed(() => state.profile.coins || 0)
const avviso = ref('')
const pannello = ref(null)          // 'roba' | { tipo: 'piazzola'|'ostacolo', … }
const scelto = shallowRef(null)     // la cosa o l'attore selezionato
// Spento finché il pittore non sa raccordare due materie diverse — vedi docs/fattoria/da-fare.md.
const pennello = ref(false)
// Si azzera chiudendo, se no il baule si riaprirebbe sulla voce vecchia il giorno dopo.
const punta = ref('')
// Serve solo a sapere quando il livello sale; il gettone in alto lo rilegge per ridisegnarsi.
const livello = ref(1)
const avanza = ref(null)
// Vive qui (non nel foglio dei livelli) perché è il pallino sul gettone in alto.
const daPrendere = ref([])
// ref e non lettura diretta: il motore non è reattivo, annotaIPremi lo dice quando cambia.
const presi = ref([])

// Un foglio aperto toglie di mezzo la bolla: sotto il velo resterebbe a galleggiare sul niente.
watch(pannello, v => { if (v) chiudiBolla() })

const zoneDelBaule = computed(() => {
  const p = new Set(presi.value)
  return ZONE.filter(z => z.chiave === ANIMALI_ZONA
    ? IN_VENDITA.some(a => p.has(chiaveDi('bestia', a.chi)))
    : CATALOGO.some(v => zonaDi(v.id) === z.chiave && p.has(chiaveDi('cosa', v.id))))
})

// Si chiama dopo ogni cosa che può cambiarli: una spesa, un premio preso.
function annotaIPremi() {
  daPrendere.value = mondo.daReclamare()
  presi.value = Object.keys(mondo.reclamati)
}

let mondo = null                    // la Fattoria (motore)
let scena = null                    // la Tela (disegno)
let attori = []
let bambino = null
let salvaFra = 0, orologio = 0, ultimo = 0, giro = 0, bisogniFra = 0, alberoFra = 0
let bottegheFra = 0

// La stagione la decide dati/stagioni.js; qui solo il nome e le celle da vestire, rifatte ogni
// pochi secondi (non a ogni fotogramma). stagioneForzata è il cheat #stagione= — vedi docs/fattoria/stagioni.md.
const stagione = ref('')
let stagioneForzata = null, stagionali = [], stagioneFra = 0

// La borsa che il motore usa: il salvadanaio vero. paga(-n) incassa (si guadagna solo sgomberando).
const borsa = {
  quante: () => state.profile.coins || 0,
  paga: n => { addCoins(-n); return true },
}

const dovePasso = (x, y) => mondo.calpestabile(x, y)

function salva() {
  salvaFra = 1.2
  guardaIlLivello()
}

// Il livello sale spendendo: si controlla da qui (chiamato da salva()) invece che in quindici
// posti, e non apre più niente da solo — vedi docs/fattoria/livelli.md.
function guardaIlLivello() {
  if (!mondo) return
  avanza.value = mondo.avanzamento
  annotaIPremi()
  const ora = avanza.value.livello
  if (ora <= livello.value) { livello.value = ora; return }
  livello.value = ora
  const quanti = daPrendere.value.length
  avvisa(`⭐ Livello ${ora}! ` + (quanti
    ? `${quanti === 1 ? 'C\'è un premio' : `Ci sono ${quanti} premi`} da prendere: ` +
      'premi la ⭐ in alto.'
    : 'La fattoria cresce.'))
}

function apriLivelli() {
  avanza.value = mondo.avanzamento
  annotaIPremi()
  pannello.value = { tipo: 'livello' }
}

// Il foglio resta aperto: chi ne ha tre da prendere li prende uno dopo l'altro.
function reclama(chiave) {
  if (!mondo) return
  const r = mondo.reclama(chiave)
  if (!r.ok) return
  annotaIPremi()
  salvaOra()
}
function salvaOra({ subito = false } = {}) {
  salvaFra = 0
  if (!mondo) return
  annotaLeBestie()
  ricorda(CHIAVE, 'stato', mondo.serializza())
  if (subito) flushNow()      // `ricorda` scrive con 350 ms di ritardo: uscendo, la pagina può sparire prima
}

// Scheda nascosta o chiusa: il ciclo rAF si ferma e il ritardo del salvataggio non scatta più
// (docs/fattoria/regole.md). Il listener di storage.js gira prima: qui si riscrive e si svuota di nuovo.
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salvaOra({ subito: true })
}

// Si scrive solo al salvataggio, non a ogni passo: il motore non deve sapere che si cammina 20 volte al secondo.
function annotaLeBestie() {
  for (const a of attori) {
    if (a === bambino) continue
    const c = a.corpo.cella
    mondo.annota(a.nome, c.x, c.y)
  }
}

// Un solo timer: un avviso nuovo lo rimette da capo, se no il secondo sparirebbe prima di essere letto.
let avvisoTimer = null
function avvisa(testo) {
  avviso.value = testo
  clearTimeout(avvisoTimer)
  avvisoTimer = setTimeout(() => { avviso.value = '' }, 2600)
}

// Chiudere azzera anche la selezione (le bestie selezionate stanno ferme, vedi muovi) e dovePosare
// (la cella del baule tenuto premuto): senza, resterebbero da un gesto precedente.
function chiudi() {
  pannello.value = null; scelto.value = null; punta.value = ''
  dovePosare = null
  posaLEtichettaInSospeso()
}

// Aperto dal tasto in alto: nessuna cella da ricordare — vedi docs/fattoria/come-si-tocca.md.
function apriIlBaule(zona = 'lavoro') {
  dovePosare = null
  pannello.value = { tipo: 'roba', zona }
}

/* ═══════════ nascere ═══════════ */
onMounted(() => {
  mondo = new Fattoria({ borsa, dato: scelta(CHIAVE, 'stato', null) })
  // #fattoria=N porta a quel livello e non scende mai — vedi docs/fattoria/livelli.md.
  // #stagione=natale|halloween accende una stagione fuori periodo — vedi docs/fattoria/stagioni.md.
  const frammento = location.hash || ''       // letto una volta: il primo cheat lo cancella
  const stagioneCheat = /(?:^#?|&)stagione=(\w+)(?=&|$)/i.exec(frammento)
  if (stagioneCheat && FINESTRE[stagioneCheat[1].toLowerCase()]) {
    stagioneForzata = stagioneCheat[1].toLowerCase()
    try { location.hash = '' } catch (e) { /* pazienza */ }
  }
  // #fattoria-tipo=N sostituisce la fattoria con una già giocata di quel livello; il profilo va nel cestino — vedi docs/fattoria/livelli.md.
  const tipo = /(?:^#?|&)fattoria-tipo=(\d{1,2})(?=&|$)/i.exec(frammento)
  if (tipo) {
    try { location.hash = '' } catch (e) { /* pazienza */ }
    cestinaOra('fattoria tipo')          // la copia si prende subito, prima di qualunque attesa
    mondo = fattoriaTipo(parseInt(tipo[1], 10))
    mondo.borsa = borsa
    salvaOra()
    avvisa(`🧪 Fattoria di prova al livello ${mondo.livello}: quella di prima è nel cestino.`)
  }
  const cheat = /(?:^#?|&)fattoria=(\d{1,2})(?=&|$)/i.exec(frammento)
  if (cheat) {
    try { location.hash = '' } catch (e) { /* pazienza */ }
    const meta = parseInt(cheat[1], 10)
    // Si toglie l'esperienza già data dagli ordini, se no il cheat sommerebbe le due fonti.
    mondo.speso = Math.max(mondo.speso, sogliaDi(meta) - (mondo.guadagnato || 0))
    // I premi dei livelli già passati si prendono da sé; quelli del livello raggiunto restano da prendere.
    for (const p of mondo.daReclamare()) if (p.liv < meta) mondo.reclama(p.chiave)
    salvaOra()
  }
  // Prima di qualunque spesa, se no il primo acquisto sembrerebbe una salita di livello.
  livello.value = mondo.livello
  avanza.value = mondo.avanzamento
  annotaIPremi()

  scena = new Tela(tela.value)
  scena.scala = SCALA_INIZIALE
  vaiACasa()

  // Il personaggio è quello scelto nel profilo: indovinarlo sbaglierebbe per metà dei bambini.
  const c = centroDelleTerre()
  const casa = mondo.cellaLibera(Math.round(c.x), Math.round(c.y) + 2)
  bambino = new Attore(aspettoDi(), new Camminatore(casa.x, casa.y, { velocita: 3.6 }))
  attori = [bambino]

  metti_in_scena_le_bestie()

  scena.avvia()
  giro = requestAnimationFrame(passo)
  addEventListener('resize', vaiACasa)
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
  // Un puntatore può finire fuori dal canvas (mouse trascinato oltre la finestra, app in secondo
  // piano, gesto preso dal sistema): questi tre ascolti fermano solo lo scorrimento.
  addEventListener('pointerup', fermaLaSpinta)
  addEventListener('pointercancel', fermaLaSpinta)
  addEventListener('blur', fermaLaSpinta)
  setTimeout(() => avvisa('Tocca una cosa per le sue opzioni, o tienila premuta e trascinala ' +
                          'per spostarla. Sul prato, tieni premuto per il baule.'), 500)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(giro)
  if (scena) scena.ferma()
  removeEventListener('resize', vaiACasa)
  removeEventListener('pointerup', fermaLaSpinta)
  removeEventListener('pointercancel', fermaLaSpinta)
  removeEventListener('blur', fermaLaSpinta)
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
  smettiLaMano()
  salvaOra({ subito: true })
})

// Quelle senza sprite si saltano in silenzio: restano salvate, torneranno con il disegno.
function metti_in_scena_le_bestie() {
  for (const b of mondo.bestie) {
    if (!siDisegna(b.chi) || attori.some(a => a.nome === b.chi)) continue
    // Dove l'avevamo lasciata, non in mezzo al prato: così "l'ho messo nel recinto" resta vero domani.
    const dove = mondo.dovEra(b.chi)
    attori.push(new Attore(b.chi, new Camminatore(dove.x, dove.y, { velocita: 2.4, vaga: 2.4 }),
      { chi: b.nome || nomeDi(b.chi), bisogni: [], bob: BOB,
        addobbi: addobbiInScena(b.chi) }))
  }
  aggiornaIBisogni()
}

// La scena riceve fatti già decisi (figura, punti) e non sa cosa sia un cappello — come il
// fumetto sopra un recinto. Si rifà a ogni cambio, non a ogni fotogramma.
function addobbiInScena(chi) {
  return mondo.comeEVestita(chi)
    .map(a => ({ ...a, punti: puntiDi(chi, a.dove) }))
    .filter(a => a.punti)
}

function rivestiLaBestia(chi) {
  const a = attori.find(x => x.nome === chi)
  if (a) a.addobbi = addobbiInScena(chi)
}

// Si aggiorna ogni tanto (non a ogni fotogramma): un bisogno cala nel giro delle ore.
function aggiornaIBisogni() {
  for (const a of attori) {
    if (a === bambino) continue
    const b = mondo.stato(a.nome)
    if (!b) continue
    a.bisogni = CHIAVI.map(k => ({ colore: BISOGNI[k].colore, valore: b[k] ?? 1 }))
  }
}

function inquadraIlMondo() {
  if (scena) scena.mondo = mondo.limiti
}

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
  chiudiBolla()
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
  stagioneFra -= dt
  if (stagioneFra <= 0) { stagioneFra = 4; aggiornaLaStagione() }
  alberoFra -= dt
  if (alberoFra <= 0) {
    alberoFra = 5
    rinfrescaLAlbero(); rinfrescaLaMacchina(); rinfrescaLaMongolfiera(); rinfrescaLaBolla()
  }
  // Le botteghe si rimettono a posto anche a foglio chiuso: il fumetto deve comparire senza che nessuno la apra.
  bottegheFra -= dt
  if (bottegheFra <= 0) {
    bottegheFra = 7
    if (aggiornaLeBotteghe(mondo, Date.now(), Math.random)) salva()
  }
  scorriDalBordo(dt)
  scena.mostra({
    fattoria: mondo, attori, scelto: scelto.value, preso, anello, bersagli,
    orologio, pennello: anteprimaPennello(),
    stagione: stagione.value || null, stagionali,
  })
}

// La scelta delle celle è di addobbiStagionali (puro); qui solo quello che le serve, letto dal mondo.
function aggiornaLaStagione() {
  stagione.value = stagioneForzata || stagioneDi(new Date()) || ''
  if (!stagione.value) { stagionali = []; return }
  const libere = []
  for (const k of Object.keys(mondo.piazzole)) {
    const [px, py] = k.split(',').map(Number)
    for (let i = 0; i < CELLE; i++) for (let j = 0; j < CELLE; j++) {
      const x = px * CELLE + i, y = py * CELLE + j
      if (mondo.cellaBuona(x, y)) libere.push([x, y])
    }
  }
  const edifici = []
  for (const c of mondo.cose) {
    const v = PER_ID[c.id]; if (!v) continue
    const a = assettoDi(c, v)
    const p = PEZZI[a.pezzo]; if (!p) continue
    edifici.push({ x: c.x, y: c.y, w: a.piede[0], h: a.piede[1], alto: p[3] / T })
  }
  stagionali = addobbiStagionali(stagione.value, { libere, edifici, seme: semeDelGiorno(new Date()) })
}

// vedi docs/fattoria/come-si-tocca.md — la cosa in mano resta sotto il dito: muoviPreso ricalcola la cella.
function scorriDalBordo(dt) {
  if ((!preso && !inMano) || !ultimoTocco || !scena) return
  const s = spintaAlBordo({
    punto: ultimoTocco, L: scena.L, A: scena.A,
    vista: scena.vista, mondo: scena.riquadroMondo, dt,
  })
  // Pixel interi: quello che avanza (una frazione) si tiene da parte, se no metà della fascia non muove niente.
  const avanzo = conIlResto(restoSpinta, s.dx, s.dy)
  restoSpinta = avanzo.resto
  if (!avanzo.dx && !avanzo.dy) return
  scena.vista.x += avanzo.dx
  scena.vista.y += avanzo.dy
  scena.limita()
  if (preso) muoviPreso(ultimoTocco)
  else passaSopra(ultimoTocco)
}

// Dito alzato, uscito dalla finestra, o tocco annullato: il resto si azzera con la vista.
function fermaLaSpinta() {
  ultimoTocco = null
  restoSpinta = { x: 0, y: 0 }
}

/* ═══════════ il dito ═══════════ */
const dita = new Map()
let pizzico = null, giu = null, lungo = null, anello = null, preso = null, scorrendo = false
// ultimoTocco è null fuori dal trascinamento, ed è quello che tiene ferma la vista.
let ultimoTocco = null, restoSpinta = { x: 0, y: 0 }
// La cella su cui è stato aperto il baule tenendo premuto; si azzera appena usata.
let dovePosare = null
// { tipo: 'cosa'|'bestia'|'baule', voce, da, bestia } — vedi docs/fattoria/come-si-tocca.md.
let aggancio = null

// Quanto si perdona di mira, e il bersaglio minimo (44 px) — vedi docs/fattoria/come-si-tocca.md.
const GRAZIA = 6
const MINIMO_TOCCO = 44

// La tela comincia sotto la barra: senza togliere l'origine si tocca una cella e se ne prende un'altra.
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
  // Un tocco sul prato chiude la bolla; se tocca un'altra cosa, al rilascio si apre la sua.
  chiudiBolla()
  dita.set(e.pointerId, dove(e))
  if (dita.size === 2) {
    if (lungo) { clearTimeout(lungo); lungo = null }
    giu = null; anello = null; aggancio = null; scorrendo = false
    // Due dita sono un pizzico: la cosa in mano resta in mano, la vista smette di correre da sola.
    fermaLaSpinta()
    pizzico = { d0: centro().d, scala0: scena.scala }
    return
  }
  if (dita.size > 2) return

  const p = dove(e)
  giu = { ...p, x0: p.x, y0: p.y, mosso: false, mira: null }
  scorrendo = false
  if (pennello.value) return dipingi(p)

  // Una cosa già in mano si posa toccando dove deve andare (secondo tempo di chi ha toccato e lasciato).
  if (preso) { preso.pronto = true; return muoviPreso(p) }

  // bersaglio() decide una volta sola, con le stesse regole del rilascio — vedi docs/fattoria/come-si-tocca.md.
  const b = giu.mira = bersaglio(p)
  if (b.bestia && mondo.hoLaBestia(b.bestia.nome))
    return arma(p, { tipo: 'bestia', bestia: { chi: b.bestia.nome, attore: b.bestia } })
  if (b.cosa) return arma(p, { tipo: 'cosa', voce: PER_ID[b.cosa.id], da: b.cosa })

  // Si apre al rilascio, non allo scadere del tempo: altrimenti comparirebbe sotto un dito ancora fermo.
  const c = scena.cellaDa(p.x, p.y)
  if (mondo.cellaMia(c.x, c.y) && !mondo.ostacoloSotto(c.x, c.y))
    return arma(p, { tipo: 'baule', cella: { x: c.x, y: c.y } })
}

// Pieno vuol dire agganciato ("adesso puoi trascinare"), finché il dito non si muove o non si stacca.
function arma(p, quale) {
  anello = { x: p.x, y: p.y, q: -1, pronto: false }
  riempiAnello(performance.now())
  lungo = setTimeout(() => {
    lungo = null
    aggancio = quale
    if (anello) anello.pronto = true
  }, ATTESA)
}

// q sotto zero vuol dire "non disegnarlo ancora": il ritardo è tutto qui, la tela non lo sa.
function riempiAnello(t0) {
  const cresci = () => {
    if (!anello) return
    const t = performance.now() - t0 - RITARDO_ANELLO
    anello.q = Math.min(1, t / (ATTESA - RITARDO_ANELLO))
    if (anello.q < 1) requestAnimationFrame(cresci)
  }
  requestAnimationFrame(cresci)
}

// Il movimento apre il trascinamento: da qui in poi si sposta qualcosa, non si sceglie più.
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
    // Confronto con x0,y0 (dove l'ha presa) e non l'ultimo pointerdown: tirandola dal baule il
    // pointerdown è avvenuto sul foglio, già sparito.
    const premuto = e.pointerType !== 'mouse' || e.buttons > 0
    const scarto = e.pointerType === 'mouse' ? SCARTO_MOUSE : SCARTO_DITO
    if (premuto && Math.hypot(p.x - preso.x0, p.y - preso.y0) > scarto) preso.pronto = true
    // Da qui la vista scorre da sola verso il bordo (scorriDalBordo): il mouse senza premere non trascina niente.
    if (premuto) ultimoTocco = p
    else fermaLaSpinta()
    return muoviPreso(p)
  }
  if (!giu) return
  const dx = p.x - giu.x, dy = p.y - giu.y
  const scarto = e.pointerType === 'mouse' ? SCARTO_MOUSE : SCARTO_DITO
  if (Math.hypot(p.x - giu.x0, p.y - giu.y0) > scarto) {
    giu.mosso = true
    if (!pennello.value) scorrendo = true
    // Mosso prima dell'attesa: non si è agganciato niente, era uno scorrimento fin dall'inizio.
    if (lungo) { clearTimeout(lungo); lungo = null; anello = null }
    // Mosso dopo l'attesa: la cosa era agganciata, il trascinamento vince sullo scorrimento.
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

// Il click fantasma dopo il pointerup: vedi docs/core/il-dito.md e docs/fattoria/come-si-tocca.md.
const FANTASMA_MS = 100
const FANTASMA_PX = 32

// cancelable va chiesto: quando il browser scorre già da sé il touchend non si può annullare.
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
  fermaLaSpinta()
  const eraPizzico = !!pizzico
  dita.delete(e.pointerId)
  if (dita.size < 2) pizzico = null
  if (lungo) { clearTimeout(lungo); lungo = null }
  anello = null
  const p = dove(e)
  // Presa dal baule con un tocco secco: resta appesa al dito, si posa al tocco dopo.
  if (preso && !preso.pronto) { preso.pronto = true; giu = null; return }
  if (preso) { posaPreso(); giu = null; return }
  if (eraPizzico || !giu) { giu = null; return }
  // Un tocco fermo è un tocco, quanto lungo sia: non solo quello rilasciato in fretta.
  const fermo = !giu.mosso
  const agganciato = aggancio
  // Deciso alla pressione (bersaglio()), non al rilascio — vedi docs/fattoria/come-si-tocca.md.
  const mira = giu.mira || { bestia: null, cosa: null }
  aggancio = null
  giu = null
  if (!fermo || pennello.value) return

  // Fermo, senza mai muoversi: sul prato vuoto apre il baule (l'unica cosa che il tocco secco non fa).
  if (agganciato && agganciato.tipo === 'baule') {
    scelto.value = null
    // Se lì non ci sta, resta appesa al dito: è il modo di dire "scegline un altro" senza un cartello.
    dovePosare = agganciato.cella || null
    pannello.value = { tipo: 'roba', zona: 'lavoro' }
    return
  }

  // Tocca per fare, tieni premuto per sistemare (girare, rovesciare, mettere via).
  if (agganciato && agganciato.tipo === 'cosa') { scelto.value = agganciato.da; return }

  const c = scena.cellaDa(p.x, p.y)
  const px = piazzolaDi(c.x), py = piazzolaDi(c.y)

  // Prima di tutto: il bersaglio delle bestie è più largo della cella e sporgeva sul bosco accanto.
  if (mondo.comprabile(px, py)) { scelto.value = null; pannello.value = { tipo: 'piazzola', px, py }; return }

  const b = mira
  if (b.bestia) {
    scelto.value = b.bestia
    apriBestia(b.bestia.nome)
    // Accanto al bambino, non addosso: vaiA si accosta se lì non si può stare.
    b.bestia.corpo.vaiA(bambino.corpo.cella.x, bambino.corpo.cella.y + 1, dovePasso)
    return
  }

  if (b.cosa) {
    // Il tocco secco fa la cosa principale (semina, macina, guarda dentro); chi non ce l'ha mostra i suoi attrezzi.
    if (haFoglio(b.cosa)) { scelto.value = null; return apriLavoro(b.cosa) }
    scelto.value = b.cosa
    return
  }
  if (scelto.value) { scelto.value = null; return }

  const o = mondo.ostacoloSotto(c.x, c.y)
  if (o) { pannello.value = { tipo: 'ostacolo', o }; return }
  if (mondo.cellaMia(c.x, c.y)) bambino.corpo.vaiA(c.x, c.y, dovePasso)
}

// Due giri, la grazia non ruba mai un bersaglio esatto — vedi docs/fattoria/come-si-tocca.md.
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

// Il rettangolo davvero disegnato (riquadroPosa); vince chi ha il fondo più in basso.
function cosaDisegnataSotto(sx, sy) {
  let vinta = null, fondo = -Infinity
  for (const cosa of mondo.cose) {
    if (!mondo.cellaMia(cosa.x, cosa.y)) continue
    const v = PER_ID[cosa.id]
    if (!v) continue
    // aspettoDi rende pezzo, piede e verso insieme: il piede è già scambiato su una cosa girata.
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

function almeno(r, lato) {
  const w = Math.max(r.w, lato), h = Math.max(r.h, lato)
  return { x: r.x - (w - r.w) / 2, y: r.y - (h - r.h) / 2, w, h }
}

function haFoglio(cosa) {
  return eCampo(cosa) || !!macchinaDi(cosa) || eSilo(cosa) || eVicino(cosa) ||
         eMercato(cosa) || !!postoDi(cosa) || eMongolfiera(cosa)
}

// Dal rettangolo davvero disegnato, non dalla cella: grazia perdona di lato e in basso, mai sopra la testa.
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
  fermaLaSpinta()
}

// Col mouse non si pizzica: la rotella fa lo stesso mestiere, a passi interi.
function rotella(e) {
  e.preventDefault()
  chiudiBolla()
  scena.zoomA(scena.scala + (e.deltaY < 0 ? 1 : -1), e.clientX, e.clientY)
}

// Un gesto per spostare, tirare dal baule o comprare: l'anteprima è agganciata alla griglia con
// l'ingombro vero. pronto distingue trascinare (si posa alzando il dito) da toccare (resta appesa).
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
  // Il baule era stato aperto tenendo premuto su una cella: si posa lì solo se ci sta davvero.
  if (!dove || !muoviSuCella(dove.x, dove.y) || !preso.ok) return

  // Posare può aprire un foglio sotto il dito (nome della bestia): va ingoiato il click fantasma — vedi docs/core/il-dito.md.
  if (opz.clic) zittisciIlFantasma(opz.clic.x, opz.clic.y)
  posaPreso()
}

// Come muoviPreso, ma da una cella invece che da un punto sullo schermo (per chi ha tenuto premuto sul prato).
function muoviSuCella(cx, cy) {
  if (!preso || !scena) return false
  const centro = scena.puntoDellaCella
    ? scena.puntoDellaCella(cx, cy) : null
  if (!centro) return false
  muoviPreso(centro)
  return true
}

// Una bestia sta in una cella e ci arriva camminando: si chiede calpestabile, non libera.
function muoviPreso(p) {
  if (!preso) return
  const { voce, da, bestia } = preso
  const finto = da || (voce ? { id: voce.id, g: 0 } : null)
  // Anche l'anteprima porta il verso: una cosa girata si vede girata dove sta per finire.
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

// Il motivo per esteso — vedi docs/fattoria/regole.md ("un rifiuto nomina la ragione vera").
function perchePosaNo(r) {
  if (r.motivo === 'poche-monete')
    return `Ti servono ${r.costo - monete.value} monete in più.`
  if (r.motivo === 'ne-hai-gia')
    return 'Ne hai già uno: di questo ce n\'è uno solo per fattoria.'
  if (r.motivo === 'non-sbloccato')
    return `Si apre al livello ${r.liv} della fattoria.`
  return 'Lì non ci sta.'
}

function posaPreso() {
  const p = preso
  preso = null
  if (!p || p.cx === null) return
  if (p.bestia) return posaLaBestia(p)
  const r = mondo.posa(p.voce.id, p.cx, p.cy, { sposta: p.da })
  if (!r.ok) {
    avvisa(perchePosaNo(r))
    return
  }
  if (!p.da) { segna('fattoriaPosati'); segnaBest('fattoriaVarieta', mondo.tipiPosseduti) }
  // Non resta selezionata: chi la sposta non si ritrova i tastini di "spostala" appena finito.
  scelto.value = null
  salva()
}

// Prima si sceglie il posto, poi il nome, poi si paga: come per una bestia già tua.
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
  // Si posa ferma: con la strada di prima ripartirebbe subito e sembrerebbe scappata di mano.
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
    // Chi non regge gira/rovescia non vede il tasto: uno che non fa niente è peggio di nessun tasto.
    ...(puoSpecchiare(v) ? [{ chiave: 'specchia', icona: '⇄', titolo: 'rovescialo' }] : []),
    { chiave: 'via', icona: '📦', titolo: `mettilo via (${COSTO_SPOSTARE} moneta)`,
      prezzo: COSTO_SPOSTARE },
  ]
})

// Ricavata e non cablata: il primo tasto in più la troverebbe mezza fuori schermo. Misure in .fa-attrezzi (stile.css).
const larghezzaAttrezzi = quanti => 44 * quanti + 6 * (quanti - 1) + 14

// Mai sotto un foglio aperto: chiudendolo ricomparirebbero da soli sopra la cosa appena usata.
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
  // Rovesciare non cambia l'ingombro: non può mai mancare il posto.
  if (chiave === 'specchia' && mondo.specchia(s).ok) salva()
  if (chiave === 'via') {
    // Un campo seminato o una macchina al lavoro non si mettono via: nel baule non c'è posto per una cosa a metà.
    const r = mondo.mettiVia(s)
    if (!r.ok) return avvisa(
      r.motivo === 'campo-seminato'
        ? 'Nel campo c\'è qualcosa che sta crescendo: raccoglilo prima.'
      : r.motivo === 'poche-monete'
        // Mettere via costa quanto spostare: senza questa riga il tasto non avrebbe detto perché.
        ? `Mettere via costa 🪙${r.costo}: ti ${r.costo - monete.value === 1 ? 'serve' : 'servono'} ` +
          `🪙${r.costo - monete.value} in più.`
        : `${(PER_ID[s.id] || {}).nome || 'La macchina'} ha della roba in fila: ` +
          'aspetta che finisca e ritirala, prima.')
    scelto.value = null
    salva()
  }
}

// Chi non lavora (una panchina, una casa) non apre niente e resta solo selezionato — vedi docs/fattoria/regole.md.
function apriLavoro(cosa, con = '') {
  // Campi e macchine aprono la bolla da trascinare; il foglio intero sta dietro il suo 📋.
  if (eCampo(cosa) || macchinaDi(cosa)) return apriBolla(cosa)
  // Il silo non lavora ma contiene: toccarlo è il modo di guardarci dentro.
  if (eSilo(cosa)) return apriGranaio(siloDi(cosa))
  // con arriva solo da un consiglio: il primo passo l'ha già fatto, non si ripete.
  if (eVicino(cosa)) return apriVicino(con)
  if (eMercato(cosa)) return apriMercato()
  if (postoDi(cosa)) return apriBottega(cosa.id)
  if (eMongolfiera(cosa)) return apriMongolfiera()
}

// Il pallone si rimette a posto aprendo (e dal battito, per il fumetto); il foglio resta aperto fra un gesto e l'altro.
function apriMongolfiera() {
  if (aggiornaLaMongolfiera(mondo, Date.now(), Math.random)) salva()
  pannello.value = { tipo: 'mongolfiera', nave: naveDi(mondo, Date.now()) }
}

function caricaCassa({ fila, cassa }) {
  const r = caricaLaCassa(mondo, fila, cassa, Math.random)
  if (!r.ok) return avvisa(r.motivo === 'manca-roba'
    ? 'Ti manca ancora qualcosa: guarda le caselle vuote.'
    : 'Quella cassa non c\'è più.')
  avvisa(r.tutto
    ? `🎈 Tutto pieno! ⭐ ${r.xp}, e nel baule c'è una sorpresa: ${(PER_ID[r.sorpresa] || {}).nome || 'un regalo'}.`
    : r.bonusFila ? `📦 Fila piena! ⭐ ${r.xp} di esperienza.`
    : `📦 Caricata! ⭐ ${r.xp} di esperienza.`)
  // Una mongolfiera piena conta come un ordine consegnato; una cassa sola no, se no varrebbe nove ordini.
  if (r.tutto) segna('fattoriaOrdini', 1)
  salva()
  apriMongolfiera()
}

function partiMongolfiera() {
  const r = partiLaMongolfiera(mondo, Date.now())
  if (!r.ok) return
  avvisa(`🎈 È partita! La prossima arriva fra ${r.minuti} minuti.`)
  salva()
  apriMongolfiera()
}

// Dal battito: un pallone che atterra mentre si guarda il prato.
function rinfrescaLaMongolfiera() {
  if (aggiornaLaMongolfiera(mondo, Date.now(), Math.random)) salva()
  const p = pannello.value
  if (p && p.tipo === 'mongolfiera')
    pannello.value = { tipo: 'mongolfiera', nave: naveDi(mondo, Date.now()) }
}

// La bottega si rimette a posto aprendola (oltre che dal battito); si resta dentro dopo una consegna.
function apriBottega(id) {
  if (aggiornaLaBottega(mondo, id, Date.now(), Math.random)) salva()
  pannello.value = { tipo: 'bottega', bottega: bottegaDi(mondo, id, Date.now()) }
}

function consegnaAllaBottega(n) {
  const id = pannello.value && pannello.value.bottega && pannello.value.bottega.id
  if (!id) return
  const r = consegnaInBottega(mondo, id, n, Date.now(), Math.random)
  if (!r.ok) return avvisa(r.motivo === 'manca-roba'
    ? 'Ti manca ancora qualcosa: guarda le caselle vuote.'
    : 'Quel cliente non c\'è più.')
  segna('fattoriaOrdini', 1)
  avvisa(r.cresciuta
    ? `✅ ⭐ ${r.xp} — e la bottega cresce: c'è un bancone in più!`
    : `✅ Consegnato! ⭐ ${r.xp} di esperienza.`)
  salva()
  apriBottega(id)
}

function rifiutaAllaBottega(n) {
  const id = pannello.value && pannello.value.bottega && pannello.value.bottega.id
  if (!id) return
  const r = rifiutaInBottega(mondo, id, n, Date.now(), Math.random)
  if (!r.ok) return avvisa('Quel cliente non c\'è più.')
  avvisa(`Va bene: il prossimo arriva fra ${r.attesa} minuti.`)
  salva()
  apriBottega(id)
}

// I tre posti al banco si rimettono a posto aprendo, con l'ora vera; il caso arriva da qui
// (Math.random) perché il motore non ne ha uno suo — una partita si deve poter rifare identica.
function apriMercato() {
  if (aggiornaIlMercato(mondo, Date.now(), Math.random)) salva()
  pannello.value = { tipo: 'mercato', ...bancoDi(mondo, Date.now()) }
}

function consegnaOrdine(id) {
  const r = consegna(mondo, id, Date.now(), Math.random)
  if (!r.ok) return avvisa(r.motivo === 'manca-roba'
    ? 'Ti manca ancora qualcosa: guarda le caselle vuote.'
    : 'Quell\'ordine non c\'è più.')
  // Il contatore è del profilo, non della fattoria: i traguardi non sanno niente di un salvataggio.
  segna('fattoriaOrdini', 1)
  avvisa(`✅ Consegnato! ⭐ ${r.xp} di esperienza.`)
  salva()
  // Si resta al banco: chi ne ha due pronti li consegna senza riaprire il foglio.
  apriMercato()
}

function rifiutaOrdine(id) {
  const r = rifiuta(mondo, id, Date.now())
  if (!r.ok) return avvisa('Quell\'ordine non c\'è più.')
  avvisa(`Va bene: ne arriva un altro fra ${RIPOSO_MIN} minuti.`)
  salva()
  apriMercato()
}

// Il secondo passo si ricalcola ogni volta: il posto libero cambia dopo ogni scambio.
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
  // Si resta sul carretto: chi ne aveva trenta di una cosa ne ha ancora venticinque.
  apriVicino('')
}

// Si apre quel silo, non "il granaio": sono due magazzini separati.
function apriGranaio(famiglia) {
  pannello.value = { tipo: 'granaio', famiglia,
                     scomparti: mondo.scomparti(famiglia),
                     // Gli scomparti sono solo quelli aperti (il silo non racconta il futuro).
                     posti: mondo.capienzaDi(famiglia),
                     livello: mondo.livelloDelSilo(famiglia),
                     costo: mondo.costoDellIngrandimento(famiglia) }
}

// Il consiglio srotolato: si apre sempre con una merce già scelta e si ricompone a ogni apertura.
function apriAlbero(prodotto) {
  if (!prodotto) return
  const albero = alberoDi(mondo, prodotto)
  if (!albero) return
  pannello.value = { tipo: 'albero', prodotto, albero }
}

// L'albero mostra fino a cinque orologi insieme: un conto alla rovescia che non scende mente proprio
// a chi è lì per sapere quanto manca. Si rifà ogni 5 secondi dal battito della scena, niente setInterval suo.
function rinfrescaLAlbero() {
  const p = pannello.value
  if (!p || p.tipo !== 'albero') return
  pannello.value = { ...p, albero: alberoDi(mondo, p.prodotto) }
}

// Il foglio si rifà con i numeri nuovi invece di chiudersi: chi ne vuole altri due è già lì.
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

// Le regole di cosa consigliare stanno nel motore (motore/consiglio.js); qui solo il braccio che esegue.
// Il foglio da cui si è partiti si chiude sempre: il consiglio manda altrove.
function faiIlPasso(azione) {
  if (!azione) return chiudi()
  chiudi()
  if (azione.che === 'apri') {
    // La cosa può stare fuori schermo: si guarda prima di aprire il foglio.
    guarda(azione.cosa)
    return apriLavoro(azione.cosa, azione.con)
  }
  if (azione.che === 'premio') return apriLivelli()  // arrivata ma non ancora presa
  if (azione.che === 'compra') {
    punta.value = azione.voce
    pannello.value = { tipo: 'roba', zona: '' }  // la zona la decide punta
    return
  }
  if (azione.che === 'ingrandisci') return ingrandisciIlSilo(azione.famiglia)
}

// Si sposta solo se la cosa non si vede già: un salto per centrare quello che era già davanti fa perdere il posto.
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

// Compare in fondo a un campo pronto senza dove scaricare: chi lo preme guarda il campo, non il silo.
function ingrandisciIlSilo(famiglia) {
  const r = mondo.ingrandisci(famiglia)
  if (!r.ok) return avvisa(r.motivo === 'poche-monete'
    ? `Ti servono 🪙${r.costo - monete.value} in più.`
    : 'Questo silo non c\'è ancora.')
  avvisa(`${SILI[famiglia].emoji} Più grande: adesso ci stanno ${r.capienza} cose di ogni tipo.`)
  salva()
}

// Il pieno è di quella merce, non del silo: dirlo per esteso evita di far credere pieno tutto il silo.
function nonCiSta(r) {
  const si = SILI[r.famiglia] || SILI.terra
  const pr = PRODOTTI[r.prodotto] || { emoji: '📦', nome: 'roba' }
  if (r.motivo === 'silo-manca')
    return `${pr.emoji} non ha dove andare: ti serve il ${si.nome.toLowerCase()}` +
           ` (🪙${mondo.quantoCosta(si.cosa)}).`
  return `Lo scomparto ${pr.emoji} è pieno (${mondo.capienzaDi(r.famiglia)}).` +
         ' Le altre cose entrano ancora.'
}

// Si rilegge a ogni apertura: un conto sull'orologio tenuto da ieri direbbe che manca ancora mezz'ora a un grano pronto.
function apriCampo(cosa) {
  const stato = mondo.statoCampo(cosa)
  if (!stato) return
  pannello.value = { tipo: 'campo', cosa, stato,
                     // Solo quelle che il livello ha aperto: cinque scelte a quattro anni sono un elenco, non una scelta.
                     // hai e ciSta, per scegliere "mi serve?" invece che a memoria.
                     colture: COLTURE.filter(c => mondo.colturaAperta(c.id))
                       .map(c => ({ ...c, hai: mondo.quantoHo(c.da),
                                    ciSta: mondo.quantoCiSta(c.da) })),
                     ciSta: stato.coltura ? mondo.quantoCiSta(stato.coltura.da) : 99,
                     // Si dice prima di seminare che servirà un posto, non a raccolto pronto.
                     senzaSilo: !mondo.eCostruito('terra'),
                     prezzoSilo: mondo.quantoCosta(SILI.terra.cosa),
                     // Il passo si calcola solo quando serve: è una camminata sulla catena.
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
  // Non si conta la semina, solo il raccolto: due contatori per lo stesso giro direbbero la stessa cosa.
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

// In coda all'avviso di raccolto: si tace quando il silo è ancora largo, un numero che non preoccupa smette di essere letto.
function quantoNeResta(r) {
  const fam = (PRODOTTI[r.prodotto] || {}).silo
  const resta = mondo.quantoCiSta(r.prodotto)
  if (!fam || resta > 2) return ''
  return resta ? ` Restano ${resta} posti.` : ' Adesso è pieno: toccalo per ingrandirlo.'
}

// Le ricette arrivano già con quello che manca (cheMancaPer): un tasto spento senza il perché è un tasto rotto.
function apriMacchina(cosa) {
  const stato = mondo.statoMacchina(cosa)
  if (!stato) return
  const { siRitira, fuori } = quantiSiRitirano(stato)
  pannello.value = {
    tipo: 'macchina', cosa, stato,
    // Dal catalogo e non dal pannello: sette macchine, un nome sbagliato è quello che rompe la fiducia.
    nome: (PER_ID[cosa.id] || {}).nome || 'La macchina',
    bestie: !!statiDi(cosa),
    // Solo quelle che il livello ha aperto (vedi dati/coltivazioni.js).
    ricette: ricetteDi(stato.macchina, mondo.livello).map(ricetta => {
      const m = mondo.cheMancaPer(ricetta.id)
      // Quanto ne hai già, di quello che entra e di quello che esce: risponde a "mi serve?", non "posso?".
      const hai = { [ricetta.da]: mondo.quantoHo(ricetta.da) }
      for (const k of Object.keys(ricetta.prende)) hai[k] = mondo.quantoHo(k)
      // Solo la prima cosa che manca: due consigli affiancati non si premono né l'uno né l'altro.
      const primo = (m.manca || [])[0]
      return { ricetta, ...m, hai,
               passo: primo ? comeAvere(mondo, primo.prodotto) : null }
    }),
    siRitira, nonCiSta: fuori ? fuori.da : '',
    // Quale silo tocca a quello rimasto fuori: dirlo senza il nome manderebbe a comprare quello sbagliato.
    ...(fuori ? nomeDelSilo(fuori.da) : stato.ricetta ? nomeDelSilo(stato.ricetta.da) : {}),
    // E se il pronto non ha dove finire, dove andarlo a mettere.
    passo: fuori ? comeFarePosto(mondo, fuori.da) : null,
  }
}

// Quanti pezzi pronti entrerebbero adesso, e il primo che resterebbe fuori (stesso giro di ritira, sulla carta).
function quantiSiRitirano(stato) {
  const posto = {}
  let siRitira = 0, fuori = null
  for (const p of stato.coda) {
    if (!p.pronto) continue
    const k = p.ricetta.da
    if (!(k in posto)) posto[k] = mondo.quantoCiSta(k)
    if (posto[k] >= p.ricetta.resa) { posto[k] -= p.ricetta.resa; siRitira++ }
    else fuori = fuori || p.ricetta
  }
  return { siRitira, fuori }
}

// Resta aperto dopo ogni gesto (per metterne tre di fila) e si rifà anche dal battito della scena.
function rinfrescaLaMacchina() {
  const p = pannello.value
  if (!p || p.tipo !== 'macchina') return
  // toRaw: confronta l'identità vera, non il proxy di Vue — vedi docs/fattoria/come-si-tocca.md.
  const cosa = toRaw(p.cosa)
  if (!mondo.cose.includes(cosa)) return chiudi()
  apriMacchina(cosa)
}

function nomeDelSilo(prodotto) {
  const fam = (PRODOTTI[prodotto] || {}).silo || 'terra'
  return { silo: SILI[fam].nome, senzaSilo: !mondo.eCostruito(fam),
           prezzoSilo: mondo.quantoCosta(SILI[fam].cosa) }
}

function avvia(ricetta) {
  const { cosa } = pannello.value
  const r = mondo.avvia(cosa, ricetta.id)
  if (!r.ok) return avvisa(r.motivo === 'poche-monete'
    ? `Ti servono 🪙${r.costo - monete.value} in più.`
    : r.motivo === 'fila-piena' ? 'La fila è piena: ritira quello che è pronto, o allungala.'
    : 'Non c\'è abbastanza roba.')
  apriMacchina(cosa)
  // Il nome della macchina non entra nella frase (sette macchine, tre generi): si dice cosa sta arrivando.
  // In fila dietro a un altro, i minuti sono fino alla fine di questo, non la sua durata.
  const fra = r.subito ? ricetta.minuti : Math.max(1, Math.ceil((r.fine - Date.now()) / MINUTO))
  avvisa(r.subito ? `${ricetta.emoji} ${ricetta.nome} fra ${fra} minuti.`
                  : `${ricetta.emoji} ${ricetta.nome} in fila: pronto fra ${fra} minuti.`)
  salva()
}

// Torna tutto, roba e monete, e lo si dice: se no la ✕ sembra un cestino.
function togliDallaFila(indice) {
  const { cosa } = pannello.value
  const r = mondo.togliDallaFila(cosa, indice)
  if (!r.ok) return avvisa(r.motivo === 'silo-manca' || r.motivo === 'silo-pieno'
    ? `${PRODOTTI[r.prodotto].emoji} non ci sta più nel silo: lo lascio in fila.`
    : 'Quello è già partito: si può solo aspettare.')
  apriMacchina(cosa)
  const roba = Object.entries(r.reso).map(([k, n]) => `${PRODOTTI[k].emoji} ${n}`).join(' ')
  avvisa(`Tolto dalla fila: tornano ${roba}${r.monete ? ` e 🪙${r.monete}` : ''}.`)
  salva()
}

function ingrandisciLaFila() {
  const { cosa } = pannello.value
  const r = mondo.ingrandisciLaFila(cosa)
  if (!r.ok) return avvisa(r.motivo === 'poche-monete'
    ? `Ti servono 🪙${r.costo - monete.value} in più.` : 'La fila è già lunga quanto si può.')
  apriMacchina(cosa)
  avvisa(`Adesso la fila ha ${r.posti} posti.`)
  salva()
}

function ritira() {
  const { cosa } = pannello.value
  const r = mondo.ritira(cosa)
  if (!r.ok) return avvisa(r.motivo === 'silo-manca' || r.motivo === 'silo-pieno'
    ? nonCiSta(r) : `Manca ancora ${r.manca} min.`)
  segna('fattoriaRitiri')
  apriMacchina(cosa)
  // Tutto quello che è entrato, merce per merce; se qualcosa resta sulla macchina lo si dice.
  const presi = r.presi.map(p => `${PRODOTTI[p.prodotto].emoji} +${p.quanto}`).join(' ')
  avvisa(`${presi} nel silo!` +
         (r.restano ? ` ${r.restano === 1 ? 'Uno resta' : `${r.restano} restano`} qui: non ci ${r.restano === 1 ? 'sta' : 'stanno'}.`
                    : quantoNeResta(r)))
  salva()
}

/* ═══════════ la bolla: semi, cesto e ricette da trascinare ═══════════ */
// Toccato un campo o una macchina, sopra compaiono i gettoni: si prendono e si portano sul prato —
// un seme passato sopra tre campi vuoti li semina tutti e tre. Vedi docs/fattoria/come-si-tocca.md.
const bolla = ref(null)       // { tipo: 'semina'|'raccogli'|'cresce'|'macchina', cosa, x, y, sotto, … }
const mano = ref(null)        // il gettone che segue il dito, in pixel della tela: { merce, icona, x, y, sopra }
let inMano = null             // { g, tipo, da, id, x0, y0, mosso, ultimo, fatti, fermo }
let bersagli = []             // [{ x, y, piede, cosa, vivo }]: dove il gettone in mano fa qualcosa, per la tela

function chiudiBolla() {
  if (inMano) return          // il dito la sta usando: si chiude quando si alza
  bolla.value = null
}

// Larghezza e altezza a stima, per non farla uscire dallo schermo: le misure sono quelle di .fa-gettone.
function misuraBolla(b) {
  const n = (b.gettoni || []).length
  const colonne = Math.max(1, Math.min(5, n))
  const righe = Math.ceil(n / 5)
  return { w: Math.max(170, colonne * 62 + 22), h: 34 + righe * 70 + (b.attesa ? 40 : 0) + 30 }
}

// Sopra la cosa, dove la si vede disegnata (un mulino è più alto del suo piede); sotto se in cima non ci sta.
function mostraBolla(cosa, dati) {
  if (!scena) return
  scelto.value = null
  const g = mondo.ingombro(cosa)
  const a = assettoDi(cosa, PER_ID[cosa.id])
  const r = scena.riquadroPosa(a.pezzo, cosa.x, cosa.y, a.piede, a)
  const cima = Math.min(r ? r.y : Infinity, g.y * scena.cellaPx - scena.vista.y)
  const fondo = (g.y + g.h) * scena.cellaPx - scena.vista.y
  const cx = (g.x + g.w / 2) * scena.cellaPx - scena.vista.x
  const { w, h } = misuraBolla(dati)
  const sotto = cima - 8 - h < 8
  bolla.value = {
    ...dati, cosa, scelta: '', sotto,
    x: Math.round(Math.max(w / 2 + 8, Math.min(scena.L - w / 2 - 8, cx))),
    y: Math.round(sotto ? Math.min(fondo + 8, scena.A - h - 8) : cima - 8),
  }
}

function apriBolla(cosa) {
  if (eCampo(cosa)) return bollaDelCampo(cosa)
  if (macchinaDi(cosa)) return bollaDellaMacchina(cosa)
}

function bollaDelCampo(cosa) {
  const s = mondo.statoCampo(cosa)
  if (!s) return
  if (s.vuoto) return mostraBolla(cosa, {
    tipo: 'semina', titolo: 'Cosa semini?', invito: 'Trascinalo sui campi vuoti',
    // Solo quelle che il livello ha aperto; il numerino è quanto ne hai già (mi serve?), oro se è pieno.
    gettoni: COLTURE.filter(c => mondo.colturaAperta(c.id)).map(c => ({
      chiave: c.id, merce: c.da, coltura: c, hai: mondo.quantoHo(c.da),
      nota: `${c.minuti} min`, colmo: mondo.quantoCiSta(c.da) < c.resa,
      spento: c.semina > monete.value })),
  })
  if (!s.pronto) return mostraBolla(cosa, {
    tipo: 'cresce', titolo: s.coltura.nome, foglio: true,
    attesa: { merce: s.coltura.da, quanto: s.quanto, manca: s.manca },
  })
  const c = s.coltura
  // Un cesto che non può raccogliere si vede spento; toccato apre il foglio, che dice perché e cosa fare.
  const pieno = mondo.quantoCiSta(c.da) < c.resa
  mostraBolla(cosa, {
    tipo: 'raccogli', titolo: 'È pronto!', invito: 'Passa il cesto sui campi pronti',
    gettoni: [{ chiave: 'cesto', icona: '🧺', nota: c.raccolta ? `🪙${c.raccolta}` : '',
                spento: pieno || c.raccolta > monete.value }],
  })
}

// Quello che è pronto si ritira al tocco, come in Hay Day; se non ci sta, il foglio dice dove fare posto.
function bollaDellaMacchina(cosa, { ritira = true } = {}) {
  let stato = mondo.statoMacchina(cosa)
  if (!stato) return
  if (ritira && stato.pronto) {
    const r = mondo.ritira(cosa)
    if (!r.ok) return apriMacchina(cosa)
    segna('fattoriaRitiri')
    r.presi.forEach((p, i) =>
      volaVia(cosa, `+${p.quanto} ${PRODOTTI[p.prodotto].emoji}`, i))
    avvisa(`${r.presi.map(p => `${PRODOTTI[p.prodotto].emoji} +${p.quanto}`).join(' ')} nel silo!` +
           (r.restano ? ` ${r.restano === 1 ? 'Uno resta' : `${r.restano} restano`} qui: non ci ${r.restano === 1 ? 'sta' : 'stanno'}.`
                      : quantoNeResta(r)))
    salva()
    stato = mondo.statoMacchina(cosa)
  }
  const nome = (PER_ID[cosa.id] || {}).nome || 'La macchina'
  mostraBolla(cosa, {
    tipo: 'macchina', titolo: nome, foglio: true,
    invito: stato.liberi ? `Trascinalo su: ${nome.toLowerCase()}` : 'La fila è piena',
    fila: [...stato.coda.map(p => ({ merce: p.ricetta.da,
                                     come: p.pronto ? 'pronto' : p.lavora ? 'lavora' : 'aspetta' })),
           ...Array.from({ length: stato.liberi }, () => null)],
    gettoni: ricetteDi(stato.macchina, mondo.livello).map(ricetta => {
      const m = mondo.cheMancaPer(ricetta.id)
      return {
        chiave: ricetta.id, merce: ricetta.da, ricetta, hai: mondo.quantoHo(ricetta.da),
        nota: `${ricetta.minuti} min`, costo: ricetta.costo, manca: m.manca, monete: m.monete,
        spento: !!m.manca.length || !!m.monete || !stato.liberi,
        // Le caselle: una per pezzo, accese se ce l'hai — come nel foglio della macchina.
        caselle: Object.entries(ricetta.prende).flatMap(([k, n]) =>
          Array.from({ length: n }, (_, i) => ({ prodotto: k, piena: i < mondo.quantoHo(k) }))),
      }
    }),
  })
}

// Dal battito: i minuti di un campo che cresce, la fila di una macchina. Mai mentre il dito la usa.
function rinfrescaLaBolla() {
  const b = bolla.value
  if (!b || inMano) return
  const cosa = toRaw(b.cosa)
  if (!mondo.cose.includes(cosa)) return chiudiBolla()
  if (eCampo(cosa)) bollaDelCampo(cosa)
  else bollaDellaMacchina(cosa, { ritira: false })
}

// Il 📋: il foglio di prima, con la fila per intero, l'albero di quello che manca, il silo pieno.
function bollaAlFoglio() {
  const b = bolla.value
  if (!b) return
  const cosa = toRaw(b.cosa)
  bolla.value = null
  if (eCampo(cosa)) apriCampo(cosa)
  else apriMacchina(cosa)
}

// "+1 🌾" che sale dalla cosa: la stessa etichetta del premio di una bestia.
function volaVia(cosa, testo, i = 0) {
  if (!scena) return
  const g = mondo.ingombro(cosa)
  scena.etichetta(testo, g.x + g.w / 2, g.y - i * 0.7)
}

// Un colpetto nel telefono a ogni campo fatto; dove non c'è (iOS, il computer) non succede niente.
function vibra() {
  try { if (navigator.vibrate) navigator.vibrate(12) } catch (e) { /* pazienza */ }
}

function prendiGettone(g, e) {
  const b = bolla.value
  if (!b || inMano || (e.pointerType === 'mouse' && e.button !== 0)) return
  try { e.currentTarget.setPointerCapture(e.pointerId) } catch (er) { /* pazienza */ }
  inMano = { g, tipo: b.tipo, da: toRaw(b.cosa), id: e.pointerId,
             x0: e.clientX, y0: e.clientY, mosso: false, ultimo: null, fatti: [], fermo: null }
  b.scelta = g.chiave
  addEventListener('pointermove', muoviMano)
  addEventListener('pointerup', lasciaMano)
  addEventListener('pointercancel', annullaMano)
}

function smettiLaMano() {
  removeEventListener('pointermove', muoviMano)
  removeEventListener('pointerup', lasciaMano)
  removeEventListener('pointercancel', annullaMano)
}

function muoviMano(e) {
  if (!inMano || e.pointerId !== inMano.id) return
  const scarto = e.pointerType === 'mouse' ? SCARTO_MOUSE : SCARTO_DITO
  if (!inMano.mosso) {
    if (Math.hypot(e.clientX - inMano.x0, e.clientY - inMano.y0) <= scarto) return
    inMano.mosso = true
    bersagli = bersagliDi(inMano)
  }
  const p = dove(e)
  mano.value = { merce: inMano.g.merce, icona: inMano.g.icona, x: p.x, y: p.y, sopra: false }
  // Da qui la vista scorre da sola verso il bordo (scorriDalBordo), come trascinando una panchina.
  ultimoTocco = p
  passaSopra(p)
}

// Semi e cesto lavorano passando: ogni campo sotto il dito, anche quelli saltati da un gesto svelto.
function passaSopra(p) {
  if (!inMano || !inMano.mosso) return
  if (inMano.tipo === 'macchina') {
    const m = macchinaSotto(p, inMano.g.ricetta)
    for (const b of bersagli) b.vivo = b.cosa === m
    if (mano.value) mano.value = { ...mano.value, sopra: !!m }
    return
  }
  const da = inMano.ultimo || p
  const passo = Math.max(4, scena.cellaPx / 3)
  const n = Math.max(1, Math.ceil(Math.hypot(p.x - da.x, p.y - da.y) / passo))
  for (let i = 1; i <= n; i++) {
    const q = { x: da.x + (p.x - da.x) * i / n, y: da.y + (p.y - da.y) * i / n }
    const campo = campoSotto(q)
    if (!campo || inMano.fatti.includes(campo)) continue
    if (inMano.tipo === 'semina') seminaPassando(campo)
    else if (inMano.tipo === 'raccogli') raccogliPassando(campo)
  }
  inMano.ultimo = p
}

function campoSotto(p) {
  const c = scena.cellaDa(p.x, p.y)
  if (!mondo.cellaMia(c.x, c.y)) return null
  const cosa = mondo.cosaSotto(c.x, c.y)
  return cosa && eCampo(cosa) ? cosa : null
}

// La cella sotto il dito, o il disegno (un mulino si vede più alto del suo piede): basta che sia del tipo giusto.
function macchinaSotto(p, ricetta) {
  const c = scena.cellaDa(p.x, p.y)
  const giusta = cosa => cosa && macchinaDi(cosa) === ricetta.dove ? cosa : null
  return (mondo.cellaMia(c.x, c.y) && giusta(mondo.cosaSotto(c.x, c.y))) ||
         giusta(cosaDisegnataSotto(p.x, p.y))
}

function bersagliDi(m) {
  const vale = m.tipo === 'semina' ? c => eCampo(c) && mondo.statoCampo(c).vuoto
    : m.tipo === 'raccogli' ? c => eCampo(c) && mondo.statoCampo(c).pronto
    : c => macchinaDi(c) === m.g.ricetta.dove
  return mondo.cose.filter(c => mondo.cellaMia(c.x, c.y) && vale(c)).map(c => {
    const g = mondo.ingombro(c)
    return { x: g.x, y: g.y, piede: [g.w, g.h], cosa: c, vivo: false }
  })
}

function fatto(campo) {
  inMano.fatti.push(campo)
  bersagli = bersagli.filter(b => b.cosa !== campo)
  vibra()
  salva()
}

// Il primo no si dice, gli altri campi dello stesso gesto tacciono: un avviso per campo si coprirebbe da solo.
function seminaPassando(campo) {
  const s = mondo.statoCampo(campo)
  if (!s || !s.vuoto) return
  const r = mondo.seminaCampo(campo, inMano.g.coltura.id)
  if (!r.ok) {
    if (!inMano.fermo) {
      inMano.fermo = r
      avvisa(r.motivo === 'poche-monete'
        ? `Ti ${r.costo - monete.value === 1 ? 'serve' : 'servono'} 🪙${r.costo - monete.value} in più.`
        : 'Qui c\'è già qualcosa.')
    }
    return
  }
  fatto(campo)
}

function raccogliPassando(campo) {
  const s = mondo.statoCampo(campo)
  if (!s || !s.pronto) return
  const r = mondo.raccogli(campo)
  if (!r.ok) {
    if (!inMano.fermo) {
      inMano.fermo = r
      avvisa(r.motivo === 'poche-monete'
        ? `Ti servono 🪙${r.costo - monete.value} in più: il campo ti aspetta.`
        : nonCiSta(r))
    }
    return
  }
  segna('fattoriaRaccolti')
  volaVia(campo, `+${r.quanto} ${PRODOTTI[r.prodotto].emoji}`)
  inMano.ultimoRaccolto = r
  fatto(campo)
}

function annullaMano(e) {
  if (!inMano || e.pointerId !== inMano.id) return
  smettiLaMano()
  inMano = null; mano.value = null; bersagli = []
  fermaLaSpinta()
}

function lasciaMano(e) {
  if (!inMano || e.pointerId !== inMano.id) return
  smettiLaMano()
  if (e.pointerType !== 'mouse') zittisciIlFantasma(e.clientX, e.clientY)
  fermaLaSpinta()
  const m = inMano
  inMano = null; mano.value = null; bersagli = []
  if (!m.mosso) return toccaIlGettone(m)
  if (m.tipo === 'macchina') {
    const dove2 = macchinaSotto(dove(e), m.g.ricetta)
    if (dove2) return mettiInFila(dove2, m.g)
    if (bolla.value) bolla.value.scelta = ''
    return
  }
  finisciIlGiro(m)
}

// Il riassunto del gesto, una riga: quanti campi, e quanto manca.
function finisciIlGiro(m) {
  const n = m.fatti.length
  if (!n) { if (bolla.value) bolla.value.scelta = ''; return }
  bolla.value = null
  if (m.tipo === 'semina') {
    const c = m.g.coltura
    return avvisa(`${c.emoji} ${n === 1 ? 'Seminato' : `${n} campi seminati`}. ` +
                  `Torna fra ${c.minuti} minuti.`)
  }
  const r = m.ultimoRaccolto
  avvisa(`${PRODOTTI[r.prodotto].emoji} ${n === 1 ? 'Raccolto' : `${n} campi raccolti`}: ` +
         'è tutto nel silo!' + quantoNeResta(r))
}

// Toccare un gettone senza trascinarlo fa il gesto sulla cosa da cui si è partiti: seme, cesto o ricetta.
function toccaIlGettone(m) {
  const { g, da } = m
  if (m.tipo === 'macchina') {
    if (!g.spento) return mettiInFila(da, g)
    return avvisa(percheNoLaRicetta(g))
  }
  if (m.tipo === 'raccogli' && g.spento) { bolla.value = null; return apriCampo(da) }
  inMano = m
  bersagli = bersagliDi(m)
  if (m.tipo === 'semina') seminaPassando(da)
  else raccogliPassando(da)
  inMano = null
  const altri = bersagli.length
  bersagli = []
  finisciIlGiro(m)
  // Detto solo quando servirebbe: ci sono altri campi su cui il gesto lungo avrebbe lavorato.
  if (m.fatti.length && altri) avvisa(avviso.value + ' Trascinando, ne fai tanti in un colpo.')
}

function percheNoLaRicetta(g) {
  if (g.manca && g.manca.length) {
    const cosa = g.manca.map(x => `${x.quanti} ${PRODOTTI[x.prodotto].nome.toLowerCase()}`).join(' e ')
    return `Ti ${g.manca.length + (g.monete ? 1 : 0) > 1 || g.manca[0].quanti > 1 ? 'servono' : 'serve'} ancora ${cosa}.`
  }
  if (g.monete) return `Ti servono 🪙${g.monete} in più.`
  return 'La fila è piena: ritira quello che è pronto, o allungala dal 📋.'
}

// La bolla resta aperta: chi ne vuole tre di fila trascina tre volte.
function mettiInFila(cosa, g) {
  const ricetta = g.ricetta
  const r = mondo.avvia(cosa, ricetta.id)
  if (!r.ok) {
    if (bolla.value) bolla.value.scelta = ''
    return avvisa(r.motivo === 'poche-monete' ? `Ti servono 🪙${r.costo - monete.value} in più.`
      : r.motivo === 'fila-piena' ? 'La fila è piena: ritira quello che è pronto, o allungala dal 📋.'
      : percheNoLaRicetta({ ...g, manca: (mondo.cheMancaPer(ricetta.id) || {}).manca || [] }))
  }
  vibra()
  const fra = r.subito ? ricetta.minuti : Math.max(1, Math.ceil((r.fine - Date.now()) / MINUTO))
  avvisa(r.subito ? `${ricetta.emoji} ${ricetta.nome} fra ${fra} minuti.`
                  : `${ricetta.emoji} ${ricetta.nome} in fila: pronto fra ${fra} minuti.`)
  salva()
  bollaDellaMacchina(cosa, { ritira: false })
}

/* ═══════════ i pannelli ═══════════ */
function compraPiazzola() {
  const { px, py } = pannello.value
  const r = mondo.compraPiazzola(px, py)
  if (!r.ok) return avvisa(`Ti servono ${r.costo - monete.value} monete in più.`)
  segna('fattoriaTerre')
  // Il mondo può essere appena cresciuto: la telecamera lo deve sapere subito.
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

// Prima il posto, poi il nome, poi si paga: un animale battezzato "dopo" resta "il cane" per sempre.
function prendiUnaBestia({ bestia, x, y, trascina }) {
  pannello.value = null
  if (mondo.hoLaBestia(bestia.chi)) return avvisa(`${bestia.nome} è già tuo.`)
  if (bestia.prezzo > monete.value)
    return avvisa(`Ti servono ${bestia.prezzo - monete.value} monete in più.`)
  prendi(null, null, { x: x - riquadro().left, y: y - riquadro().top },
         { bestia: { chi: bestia.chi, compra: bestia }, pronto: !!trascina, clic: { x, y } })
}

// stato è una fotografia dei bisogni, non il record del motore (sempre lo stesso oggetto): un foglio
// con le stesse prop non si ridisegna, e la barra restava ferma finché non arrivava un altro cambio.
function apriBestia(chi) {
  const b = mondo.laBestia(chi)
  if (!b) return
  pannello.value = { tipo: 'bestia', chi, che: nomeDi(chi), nome: b.nome || '',
                     stato: foto(mondo.stato(chi)) }
}

// Il guardaroba è del motore; qui in più: premere quello che non hai lo compra (come nel baule).
function apriVestiario(chi) {
  const b = mondo.laBestia(chi)
  if (!b) return
  pannello.value = {
    tipo: 'vestiario', chi, che: nomeDi(chi), nome: b.nome || '',
    // In vendita più quello sospeso che ha già: comprato prima della sospensione resta un tasto.
    addobbi: mondo.vestiarioDi(chi),
    portati: { ...mondo.addobbiDi(chi) },
    guardaroba: { ...mondo.guardaroba },
  }
}

function metti(id) {
  const { chi } = pannello.value
  const a = addobbo(id)
  // Quello che ha già addosso non si ricompra: un addobbo indossato non sta più in guardaroba.
  if (a && mondo.addobbiDi(chi)[a.dove] === id) return
  if (mondo.quantiAddobbi(id) < 1) {
    const c = mondo.compraAddobbo(id)
    if (!c.ok) return avvisa(c.motivo === 'poche-monete'
      ? `Ti ${c.costo - monete.value === 1 ? 'manca' : 'mancano'} 🪙${c.costo - monete.value}: ` +
        'fai un po\' di esercizi negli altri giochi.'
      // Un sospeso che non si ha non compare nel vestiario: qui solo per un tasto vecchio a schermo.
      : c.motivo === 'sospeso'
      ? 'Questo per ora non si vende.'
      : 'Non è andata: riprova.')
  }
  const r = mondo.vestiBestia(chi, id)
  if (!r.ok && r.motivo !== 'gia-addosso') return avvisa(r.motivo === 'non-gli-sta'
    ? `${nomeDi(chi)} lì non ci mette niente.` : 'Non è andata: riprova.')
  if (r.ok) avvisa(`${r.addobbo.emoji} ${r.addobbo.nome} addosso!`)
  // Un primato, non un contatore: mettere e togliere lo stesso cappello venti volte non vale venti.
  segnaBest('fattoriaVestiti', mondo.addobbiAddosso)
  rivestiLaBestia(chi)
  salva()
  apriVestiario(chi)
}

function togli(dove) {
  const { chi } = pannello.value
  const r = mondo.spogliaBestia(chi, dove)
  if (!r.ok) return
  avvisa(`${(addobbo(r.id) || {}).nome || 'Tolto'}: torna nel guardaroba.`)
  rivestiLaBestia(chi)
  salva()
  apriVestiario(chi)
}

function nutri(cibo) {
  const chi = pannello.value.chi
  const nome = pannello.value.nome || pannello.value.che
  const r = mondo.nutri(chi, cibo)
  if (!r.ok) return avvisa(
    r.motivo === 'non-gli-piace' ? `${nome} non mangia ${cibo.nome.toLowerCase()}.`
    : r.motivo === 'non-ha-fame' ? 'Ha la pancia piena.'
    // Il mangime non si compra: manca la roba, non le monete.
    : r.motivo === 'manca-roba' ? `Non hai ${cibo.nome.toLowerCase()}: passa dal mulino.`
    : `Ti servono ${r.costo - monete.value} monete in più.`)
  if (r.premio) festeggiaIlBenessere(chi, nome, r.premio)
  salva(); apriBestia(chi)
}

function coccola(gesto) {
  const chi = pannello.value.chi
  const nome = pannello.value.nome || pannello.value.che
  const r = mondo.coccola(chi, gesto)
  if (!r.ok) return avvisa(
    r.motivo === 'poche-monete'
      ? `Ti serve ${r.costo} moneta: falla giocare dopo qualche esercizio.`
      // La copertina si paga in lana, non in monete: manca la roba, non le monete.
    : r.motivo === 'manca-roba' ? 'Non hai lana: tieni delle pecore, o dei conigli.'
    : 'Non ne ha bisogno adesso.')
  if (r.premio) festeggiaIlBenessere(chi, nome, r.premio)
  salva(); apriBestia(chi)
}

// Il motore ha già deciso e già contato: qui si dice, in due posti — l'avviso in cima e un "+9 ⭐"
// che sale dalla testa della bestia sul prato.
function festeggiaIlBenessere(chi, nome, premio) {
  const faccia = (animale(chi) || {}).emoji || '🐾'
  avvisa(`${faccia} ${nome} sta benissimo! ⭐ +${premio.xp} di esperienza.`)
  etichettaInSospeso = { chi, testo: `+${premio.xp} ⭐` }
  // La scheda si riapre a tutta altezza: l'etichetta si posa quando il foglio chiude, o subito se non c'è.
  nextTick(() => { if (!pannello.value) posaLEtichettaInSospeso() })
}

let etichettaInSospeso = null
function posaLEtichettaInSospeso() {
  const e = etichettaInSospeso
  if (!e) return
  etichettaInSospeso = null
  const a = attori.find(x => x.nome === e.chi)
  if (a && scena) scena.etichetta(e.testo, a.corpo.x, a.corpo.y - 1.6)
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

// Toccata una cosa nel baule, la posa comincia lì: il foglio si toglie di mezzo, il prezzo si paga posando.
// Quasi tutti i prezzi sono di catalogo, il campo no (rincara a ogni copia): si rilegge a ogni apertura.
function prezziCorrenti() {
  const p = {}
  for (const v of CATALOGO) if (v.cresce) p[v.id] = mondo.quantoCosta(v.id)
  return p
}

// I due silos, unici: si guarda la mappa (quantiInMappa) e non quanteNeHo, che conta anche il baule —
// un silo messo via deve restare prendibile.
function giaPosati() {
  return CATALOGO.filter(v => v.unico && mondo.quantiInMappa(v.id) > 0).map(v => v.id)
}

// trascina: il dito è uscito di lato ed è ancora giù (si posa dove si alza); altrimenti resta appesa.
function tiraVoce({ voce, x, y, trascina }) {
  pannello.value = null
  const r = riquadro()
  prendi(voce, null, { x: x - r.left, y: y - r.top }, { pronto: !!trascina, clic: { x, y } })
}
</script>

<template>
  <div class="schermo">
    <Barra titolo="La fattoria" guida="fattoria" monete @indietro="emit('vai', 'home')" />

    <div class="fa">
    <!-- touchend esiste solo per non far nascere il click fantasma (zittisciIlFantasma). -->
    <canvas ref="tela" class="fa-tela"
            @pointerdown="premi" @pointermove="muovi" @pointerup="lascia"
            @pointercancel="annulla" @touchend="nienteClickDalCampo"
            @wheel.prevent="rotella"></canvas>

    <div class="fa-tasti">
      <!-- Sempre visibile: non si apre più niente da solo (vedi guardaIlLivello). -->
      <button v-if="avanza" class="fa-liv" :class="{ dono: daPrendere.length }"
              data-livelli title="i livelli della fattoria"
              @click="apriLivelli">
        ⭐ {{ avanza.livello }}
        <i><u :style="{ width: Math.round(avanza.quanto * 100) + '%' }"></u></i>
        <b v-if="daPrendere.length" class="fa-bollo">{{ daPrendere.length }}</b>
      </button>
      <!-- Le tre metà del baule, una per tasto: solo quelle con qualcosa dentro. -->
      <button v-for="z in zoneDelBaule" :key="z.chiave" class="fa-tondo"
              :data-baule="z.chiave" :title="z.nome"
              @click="apriIlBaule(z.chiave)">{{ z.icona }}</button>
    </div>

    <p v-if="avviso" class="fa-avviso">{{ avviso }}</p>

    <Bolla v-if="bolla" :x="bolla.x" :y="bolla.y" :sotto="bolla.sotto"
           :titolo="bolla.titolo" :invito="bolla.invito" :gettoni="bolla.gettoni || []"
           :scelta="bolla.scelta" :attesa="bolla.attesa || null" :fila="bolla.fila || null"
           :foglio="!!bolla.foglio" :trascina="!!mano"
           @prendi="prendiGettone" @foglio="bollaAlFoglio" />
    <div v-if="mano" :class="['fa-mano', { sopra: mano.sopra }]"
         :style="{ left: mano.x + 'px', top: mano.y + 'px' }">
      <Merce v-if="mano.merce" :merce="mano.merce" :lato="44" />
      <span v-else>{{ mano.icona }}</span>
    </div>

    <Attrezzi v-if="doveAttrezzi" :x="doveAttrezzi.x" :y="doveAttrezzi.y"
              :gesti="gestiDiScelto" @fai="attrezzo" @fine="scelto = null" />

    <div v-if="pannello" class="fa-velo" @click.self="chiudi()">
      <Roba v-if="pannello.tipo === 'roba'" class="fa-foglio"
            :monete="monete" :magazzino="mondo.magazzino" :bestie="mondo.bestie"
            :prezzi="prezziCorrenti()" :presi="presi" :posati="giaPosati()"
            :punta="punta" :zona-iniziale="pannello.zona" :stagione="stagione"
            @tira="tiraVoce" @tira-bestia="prendiUnaBestia"
            @chiudi="chiudi()" />

      <Bestia v-else-if="pannello.tipo === 'bestia'"
              :chi="pannello.chi" :che="pannello.che" :nome="pannello.nome"
              :stato="pannello.stato" :monete="monete" :granaio="mondo.granaio"
              @nutri="nutri" @coccola="coccola"
              @vesti="apriVestiario(pannello.chi)"
              @rinomina="pannello = { tipo: 'battesimo', chi: pannello.chi,
                                      che: pannello.che, nome: pannello.nome, prezzo: 0 }"
              @chiudi="chiudi()" />

      <Vestiario v-else-if="pannello.tipo === 'vestiario'"
                 :chi="pannello.chi" :che="pannello.che" :nome="pannello.nome"
                 :addobbi="pannello.addobbi" :portati="pannello.portati"
                 :guardaroba="pannello.guardaroba" :monete="monete"
                 @metti="metti" @togli="togli" @chiudi="chiudi()" />

      <Campo v-else-if="pannello.tipo === 'campo'"
             :stato="pannello.stato" :monete="monete" :ci-sta="pannello.ciSta"
             :colture="pannello.colture" :passo="pannello.passo"
             :senza-silo="pannello.senzaSilo" :prezzo-silo="pannello.prezzoSilo"
             @semina="semina" @raccogli="raccogli" @passo="faiIlPasso"
             @chiudi="chiudi()" />

      <Livelli v-else-if="pannello.tipo === 'livello'"
               :stato="avanza" :presi="presi"
               @reclama="reclama" @chiudi="chiudi()" />

      <Vicino v-else-if="pannello.tipo === 'vicino'"
              :puoi-dare="pannello.puoiDare" :offerte="pannello.offerte"
              :colmi="pannello.colmi" :scelto="pannello.scelto"
              @scegli="apriVicino" @scambia="alVicino" @regala="alVicino(null)"
              @chiudi="chiudi()" />

      <Mongolfiera v-else-if="pannello.tipo === 'mongolfiera'"
                   :nave="pannello.nave" @albero="apriAlbero"
                   @carica="caricaCassa" @parti="partiMongolfiera"
                   @chiudi="chiudi()" />

      <Mercato v-else-if="pannello.tipo === 'mercato'"
               :ordini="pannello.ordini" :riposi="pannello.riposi"
               @albero="apriAlbero"
               @consegna="consegnaOrdine" @rifiuta="rifiutaOrdine"
               @chiudi="chiudi()" />

      <Bottega v-else-if="pannello.tipo === 'bottega'"
               :bottega="pannello.bottega"
               @albero="apriAlbero"
               @consegna="consegnaAllaBottega" @rifiuta="rifiutaAllaBottega"
               @chiudi="chiudi()" />

      <Granaio v-else-if="pannello.tipo === 'granaio'"
               :famiglia="pannello.famiglia"
               :scomparti="pannello.scomparti" :livello="pannello.livello"
               :posti="pannello.posti"
               :costo="pannello.costo" :monete="monete"
               @ingrandisci="ingrandisci" @albero="apriAlbero" @chiudi="chiudi()" />

      <Albero v-else-if="pannello.tipo === 'albero'"
              :albero="pannello.albero"
              @fai="faiIlPasso" @chiudi="chiudi()" />

      <Macchina v-else-if="pannello.tipo === 'macchina'"
                :stato="pannello.stato" :ricette="pannello.ricette"
                :nome="pannello.nome" :bestie="pannello.bestie"
                :si-ritira="pannello.siRitira" :non-ci-sta="pannello.nonCiSta"
                :silo="pannello.silo" :passo="pannello.passo"
                :senza-silo="pannello.senzaSilo" :prezzo-silo="pannello.prezzoSilo"
                @avvia="avvia" @ritira="ritira" @togli="togliDallaFila"
                @ingrandisci="ingrandisciLaFila" @passo="faiIlPasso"
                @albero="apriAlbero" @chiudi="chiudi()" />

      <Battesimo v-else-if="pannello.tipo === 'battesimo'"
                 :chi="pannello.chi" :che="pannello.che" :nome="pannello.nome || ''"
                 :prezzo="pannello.prezzo"
                 @conferma="battezza" @chiudi="chiudi()" />

      <div v-else-if="pannello.tipo === 'piazzola'" class="fa-foglio">
        <Chiudi @chiudi="chiudi()" />
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
        <Chiudi @chiudi="chiudi()" />
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
