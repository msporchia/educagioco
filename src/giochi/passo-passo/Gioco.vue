<script setup>
/* Passo passo — il coordinatore: quando succedono le cose e cosa valgono
   (monete, stelle, contatori dell'albo). Regole in `motore/`, disegno e
   tempi in `scena/`, schermate in `viste/`. Vedi docs/passo-passo/regole.md
   e docs/passo-passo/stelle-e-aiuti.md. */
import { ref, shallowRef, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { state, addCoins, segna, segnaBest, tappaAperta, spendi } from '../../store/profile.js'
import { progresso, stelleDi, completa, primatoDi, segnaPrimato, ricorda,
         sosta, salvaSosta, chiusaPerEta } from '../campagne.js'
import { tappaApertaQui } from '../../data/portata-giochi.js'
import { fraseDiFine, primatoInParole } from '../primati.js'

import { SENZA_FINE } from './gioco.js'
import { CAMPAGNA, SCALINI, FINE_STRADA, postoNelCursore, TAPPE_PICCOLE, TAPPE_PRIME,
         FILE, FILA_ATTUALE, riordina } from './dati/campagna.js'
import { STRADE, aperture, cosaManca, prossima, seguente, tappaDiAdesso, ereditaDi } from './motore/strade.js'
import { MASSIMO_FILA, LEGENDA } from './dati/mondo.js'
import { apri, apriSe, carteDi, conCicli, daScegliere, eApri, eSe, valoreDi, COLORI } from './dati/carte.js'
import { Livello } from './motore/livello.js'
import { esegui, stelleDellaVittoria, eCorta, TANA, SBATTE, SPLASH, PERSA, eErrore } from './motore/mondo.js'
import { mettiCarta, mettiScatola, togliPrima, scegliTesta } from './motore/fila.js'
import { suggerisci, minimoDi, carteUsate } from './motore/risolutore.js'
import { scalaDi, pensieroDi, dove, pezzoDiStrada } from './motore/aiuti.js'
import { mancano, chiedeConferma, SVELA } from '../aiuti.js'
import { generaSentiero, caso, premioDi, INGREDIENTI } from './motore/generatore.js'
import { Proiezione } from './scena/proiezione.js'
import { Regia } from './scena/regia.js'
import { guidaDelPrato, guidaDelRipeti } from './motore/guida.js'
import { usaGuida } from '../guida.js'
import { scrivi, leggi, dice, scriviFila, scriviSerie, pagatoDa, svelatoDa } from './motore/sosta.js'
import Ripresa from '../Ripresa.vue'

import Mappa from './viste/Mappa.vue'
import Campo from './viste/Campo.vue'
import Finale from './viste/Finale.vue'
import './stile.css'

defineOptions({ name: 'PassoPasso' })
const emit = defineEmits(['vai'])

const CHIAVE = 'passo'
/* la finestra cieca di sempre (`docs/core/interfaccia.md`): una schermata appena comparsa
   non si lascia toccare subito, perché il dito che ha appena premuto si
   lascia dietro un tocco */
const CIECA = 320

/* ═══════════ dove siamo ═══════════ */
const vista = ref('mappa')          // mappa | campo
const tappaIdx = ref(-1)            // -1 = il sentiero senza fine
const tappa = shallowRef(null)      // il dato del livello in gioco
const fila = ref([])
const cursore = ref(0)
const corrente = ref(-1)            // la tessera che sta girando
const guasto = ref(null)            // dove la fila si è fermata male
const inCorsa = ref(false)
const presi = ref(0)                // il gradino della scala del 💡 (docs/passo-passo/stelle-e-aiuti.md)
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
const provato = ref(null)           // la fila dell'ultimo ▶ in questo livello, per la guida
const fermoPrima = ref(false)       // all'ultimo ▶ il coniglio si è fermato prima della tana

let liv = null
let cieco = false
let sbarra = 0
let esitoInCorsa = null
let partitoAlle = 0
let passoCorrente = -1              // il passo che sta girando (coi cicli non è la carta)
/* la partita è già vinta prima che finisca la festa, ma si scrive solo a
   festa finita: un traguardo a metà festa coprirebbe il coniglio */
let inTana = false
/* il giro di prima: serve a far correre veloce la parte già vista */
let ultimoGiro = null               // { passi: [{ i, mossa }], riusciti }

/* il sentiero senza fine */
const sentieri = ref(0)             // quanti in questa seduta
const serie = ref(0)                // di fila, senza aiuti
let semeSeduta = 1
let famigliaPrima = null            // di che specie era il sentiero di prima
let chiusaDallAiuto = null          // la frase di quando l'aiuto ha chiuso la serie

const avanza = progresso(CHIAVE)
// riordino della fila di livelli: vedi docs/passo-passo/livelli.md
if (avanza.cfg.fila !== FILA_ATTUALE) {
  const vecchia = FILE[avanza.cfg.fila || 1]
  if (vecchia && ((avanza.tappa || 0) > 0 || Object.keys(avanza.stelle || {}).length)) {
    Object.assign(avanza, riordina(avanza, vecchia))
    // il cursore di prima delle due strade è un cursore come `tappa`, e si travasa con lei
    if (typeof avanza.cfg.eredita === 'number') avanza.cfg.eredita = riordina({ tappa: avanza.cfg.eredita }, vecchia).tappa
  }
  ricorda(CHIAVE, 'fila', FILA_ATTUALE)
}
/* le due strade: quello che il cursore di prima apriva resta aperto, e da
   qui si apre andando avanti su una strada (docs/passo-passo/livelli.md) */
if (typeof avanza.cfg.eredita !== 'number') ricorda(CHIAVE, 'eredita', avanza.tappa || 0)
const fatta = i => stelleDi(CHIAVE, i) > 0 || i < ereditaDi(avanza)
const perEta = i => chiusaPerEta(CHIAVE, i)
// aperta dall'età o dai grandi anche senza averci giocato
const daFuori = i => tappaApertaQui(CHIAVE, i, -1)
const strade = aperture(STRADE, { fatta, daFuori, perEta, eredita: ereditaDi(avanza) })
const aperta = i => strade.aperta(i)
const prossimaDopo = i => prossima(STRADE, i, aperta)
// in fondo a una strada (o davanti allo zaino chiuso) ▶ porta al sentiero, se è aperto
const sentieroDopo = i => { const s = seguente(STRADE, i); return s === null || s === TAPPE_PICCOLE }

/* ═══════════ la partita lasciata a metà ═══════════
   La fila di ogni livello e il sentiero in corso: vedi docs/passo-passo/sosta.md */
const quaderno = reactive(leggi(sosta(CHIAVE)))
// quello che non tornava se n'è andato: lo si dice anche all'archivio
if (JSON.stringify(scrivi(quaderno)) !== JSON.stringify(sosta(CHIAVE) || null))
  salvaSosta(CHIAVE, scrivi(quaderno))
let vinta = false                   // il posto in gioco è vinto: la sua fila non si tiene
const chiede = ref('')              // il sentiero nuovo che butterebbe quello a metà
// sulla mappa solo se il sentiero è ancora aperto a quell'età
const ripresa = computed(() => (sentieroAperto() ? dice(scrivi(quaderno)) : null))

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
// si apre alla fine delle buche, non della campagna: vedi docs/passo-passo/sentiero.md
const sentieroAperto = () => tappaAperta(TAPPE_PRIME, avanza.tappa)
// ingredienti sbloccati: vedi docs/passo-passo/sentiero.md
const sbloccati = () => SCALINI.filter(s => INGREDIENTI[s.chiave]).filter(s => {
  const u = CAMPAGNA.slice(0, FINE_STRADA).map(t => t.scalino).lastIndexOf(s.chiave)
  return fatta(u) || daFuori(u)
}).map(s => INGREDIENTI[s.chiave])

/* ═══════════ la mappa ═══════════
   Lo stato di ogni casella lo decide il gioco, la mappa lo disegna
   (docs/passo-passo/mappa.md): chiusa vince su fatta. */
const adessoQui = computed(() => tappaDiAdesso(STRADE, {
  ultima: Number.isInteger(avanza.cfg.ultima) ? avanza.cfg.ultima : null,
  cursore: avanza.tappa || 0, aperta, fatta,
}))
const voci = computed(() => CAMPAGNA.map((t, i) => {
  const s = SCALINI.find(x => x.chiave === t.scalino)
  const qui = aperta(i), stelle = stelleDi(CHIAVE, i)
  return {
    indice: i, nome: t.nome, icona: t.icona, racconto: t.racconto, stelle,
    stato: !qui ? 'chiusa' : i === adessoQui.value ? 'ora' : stelle > 0 ? 'fatta' : 'aperta',
    aMeta: !!quaderno.livelli[t.chiave],
    serve: qui ? '' : cosaManca(STRADE, i, { fatta, aperta, perEta }),
    scalino: { icona: s.icona, nome: s.nome },
  }
}))
// dove sta il segnalino: la tappa di adesso; non restando niente, il sentiero o l'ultima giocata
const doveSegnalino = computed(() => {
  if (adessoQui.value !== null) return adessoQui.value
  if (sentieroAperto()) return 'senza-fine'
  const u = avanza.cfg.ultima
  return Number.isInteger(u) && aperta(u) ? u : 0
})

const statoSentiero = computed(() => ({
  aperto: sentieroAperto(),
  record: primatoInParole(primatoDi(CHIAVE), SENZA_FINE.misura),
  quante: TAPPE_PRIME,
  fatte: Math.min(avanza.tappa, TAPPE_PRIME),
}))

// la guida della prima volta (motore/guida.js, docs/passo-passo/regole.md)
const radice = ref(null)
const passoGuida = computed(() => {
  const fermo = inCorsa.value || !!finale.value
  if (tappaIdx.value === TAPPE_PICCOLE && stelleDi(CHIAVE, TAPPE_PICCOLE) === 0)
    return guidaDelRipeti({ fermo, conScatola: conCicli(fila.value) || scelta.value != null })
  if (tappaIdx.value !== 0 || avanza.tappa > 0) return null
  return guidaDelPrato({ fila: fila.value, fermo, provato: provato.value !== null,
                         cambiato: provato.value !== JSON.stringify(fila.value),
                         sbattuto: guasto.value != null, fermoPrima: fermoPrima.value })
})
usaGuida(radice, passoGuida)

const titolo = computed(() => {
  if (vista.value !== 'campo' || !tappa.value) return 'Passo passo'
  if (sentiero.value) return `♾️ ${sentieri.value + 1} · ${tappa.value.nome}`
  return `${tappaIdx.value + 1}. ${tappa.value.nome}`
})

/* ═══════════ i suoni ═══════════ */
// nella parte veloce i passi non suonano: tre al secondo sarebbero una mitragliatrice
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
/* ═══════════ tenere la fila ═══════════
   Si scrive col ←, a pagina nascosta, prima di smontare, a ogni gradino
   del 💡 pagato e, mezzo secondo dopo, a ogni tocco sulla fila. */
function fotografa() {
  if (vista.value !== 'campo' || !tappa.value) return
  const qui = vinta ? null
    : scriviFila({ fila: fila.value, cursore: cursore.value, presi: presi.value, carta: ultimaCarta })
  if (sentiero.value)
    quaderno.sentiero = scriviSerie({ seme: semeSeduta, sentieri: sentieri.value, serie: serie.value,
                                      prima: famigliaPrima, chiusa: vinta ? null : chiusaDallAiuto,
                                      posto: vinta ? null : tappa.value, fila: qui })
  else if (qui) quaderno.livelli[tappa.value.chiave] = qui
  else delete quaderno.livelli[tappa.value.chiave]
}
let salvaTimer = 0
function salvaOra() {
  clearTimeout(salvaTimer)
  fotografa()
  salvaSosta(CHIAVE, scrivi(quaderno), { subito: true })
}
function salvaPresto() {
  clearTimeout(salvaTimer)
  salvaTimer = setTimeout(() => { fotografa(); salvaSosta(CHIAVE, scrivi(quaderno)) }, 500)
}
watch([fila, cursore, presi], () => { if (vista.value === 'campo') salvaPresto() })

// su un telefono l'app non si chiude, sparisce: è l'ultimo momento per scrivere
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salvaOra()
}
onMounted(() => {
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
  regia.spegni()
  clearTimeout(sbarra)
  clearTimeout(timerArmato)
  vintaAMeta()
  salvaOra()
})

function finestraCieca() {
  clearTimeout(sbarra)
  cieco = true
  sbarra = setTimeout(() => { cieco = false }, CIECA)
}

/* ═══════════ entrare in un livello ═══════════
   `gia` è la fila lasciata lì l'ultima volta, coi gradini del 💡 già pagati */
function entra(t, indice, gia = indice >= 0 ? quaderno.livelli[t.chiave] : null) {
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
  provato.value = null
  fermoPrima.value = false
  ultimoGiro = null
  passoCorrente = -1
  esitoInCorsa = null
  inTana = false
  chiusaDallAiuto = null
  vinta = false
  if (gia) {
    fila.value = gia.fila.slice()
    cursore.value = gia.cursore
    presi.value = gia.presi
    pagato.value = pagatoDa(gia.presi)
    svelato.value = svelatoDa(gia.presi)
    ultimaCarta = gia.carta
  }
  vista.value = 'campo'
  finestraCieca()
  nextTick(() => {
    regia.attacca(campo.value && campo.value.tela)
    regia.prepara(liv, t.tema)
    regia.avvia()
  })
}

// la tappa giocata per ultima: lì torna il segnalino (docs/passo-passo/mappa.md)
const avviaTappa = i => { ricorda(CHIAVE, 'ultima', i); entra(CAMPAGNA[i], i) }

/* ═══════════ comporre la fila ═══════════
   Ogni tocco passa da `motore/fila.js`, che dice com'è la fila dopo. */
const metti = r => { fila.value = r.fila; cursore.value = r.cursore }

function freccia(t) {
  if (inCorsa.value || cieco || finale.value || piena.value) return
  if (eApri(t)) return scatola(eSe(t) ? 'se' : 'ripeti', t)
  metti(mettiCarta(fila.value, cursore.value, t))
  scelta.value = null
  cambiata()
  suono.nota(t.startsWith('salto-') ? 587 : 523, t.startsWith('salto-') ? 587 : 523, 0.06, 'triangle', 0.05)
}

// dal consiglio del 💡 la scatola arriva già con la sua testa (`gia`)
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
  provato.value = JSON.stringify(fila.value)
  fermoPrima.value = false
  partitoAlle = performance.now()
  ultimoSuono = ''
  regia.suona(pro)
  segna('ppProve')
}

// passi e non carte: coi cicli la stessa carta si esegue a ogni giro
const passiDi = esito => esito.passi.map(p => ({ i: p.i, mossa: p.mossa }))
function giaVisti(esito) {
  if (!ultimoGiro) return 0
  const ora = esito.passi, prima = ultimoGiro.passi
  let n = 0
  while (n < ora.length && n < ultimoGiro.riusciti &&
         ora[n].i === prima[n].i && ora[n].mossa === prima[n].mossa) n++
  return n
}

/* ■ sta dove stava ▶: senza un ritardo, un doppio tocco su ▶ fermerebbe
   subito la corsa appena partita. Non risponde più una volta in tana: quella
   partita è già vinta. */
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
  // riusciti: tutti i passi tranne quello che ha sbattuto o fatto splash
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
    fermoPrima.value = true
  }
  aiutoPrenotato()
}

/* ═══════════ 💡 ═══════════ vedi docs/passo-passo/stelle-e-aiuti.md */
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

/* un gradino pagato si scrive subito, insieme alle monete spese: uscendo
   e rientrando non si ripaga */
function aiuto() {
  const prima = presi.value
  scendi()
  if (presi.value !== prima) salvaOra()
}

function scendi() {
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
  // la carta di prima si riaccende gratis, solo se si comprerebbe di nuovo lei
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
  switch (s.che) {  // le quattro cose che l'aiuto può dire: docs/passo-passo/zaino.md
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
/* i contatori si muovono dopo `completa()`, non prima: `segna()` guarda anche
   i traguardi, e uno sulle tappe scatterebbe al ▶ dopo se guardato troppo presto */
function contaLaVittoria(esito) {
  segna('ppTane')
  if (esito.carota) segna('ppCarote')
  if (liv && liv.cane) segna('ppPecore', liv.pecore.length)
  if (!pagato.value) segna('ppDaSolo')
}

// il minimo si chiede a vittoria avvenuta, non all'ingresso: costa una ricerca
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

/* scrive la vittoria e torna il cartello da mostrare alla fine; un posto
   vinto non tiene più la sua fila (rigiocarlo è una partita nuova) */
function vittoria(esito) {
  const cartello = scriviVittoria(esito)
  vinta = true
  salvaOra()
  return cartello
}

function scriviVittoria(esito) {
  const strada = misuraLaStrada(esito)
  const stelle = stelleDellaVittoria({ carota: esito.carota, svelato: svelato.value, corta: strada.corta })
  if (sentiero.value) return vittoriaSentiero(esito, strada)

  const i = tappaIdx.value
  const primaVolta = stelleDi(CHIAVE, i) === 0  // il premio si paga una volta sola: docs/passo-passo/stelle-e-aiuti.md
  const monete = primaVolta ? CAMPAGNA[i].premio : 0
  if (monete) addCoins(monete)
  // le tappe del cane in coda non muovono il cursore (docs/passo-passo/livelli.md)
  completa(CHIAVE, i, FINE_STRADA, { stelle, posto: postoNelCursore(i) })
  contaLaVittoria(esito)
  return {
    che: 'tappa', titolo: CAMPAGNA[i].nome, stelle,
    carota: esito.carota, cane: !!(liv && liv.cane), svelato: svelato.value, monete,
    ...strada, zaino: !!liv.zaino,
    racconto: CAMPAGNA[i].racconto,
    // ▶ va avanti sulla strada che si sta facendo; in fondo può portare al sentiero senza fine
    prossima: prossimaDopo(i) !== null || (sentieroDopo(i) && sentieroAperto()),
  }
}

/* ═══════════ il sentiero senza fine ═══════════ */
function avviaSentiero() {
  if (quaderno.sentiero) scordaSentiero()
  sentieri.value = 0
  serie.value = 0
  semeSeduta = (Date.now() % 100000) + 1
  famigliaPrima = null
  prossimoSentiero()
}

/* il prossimo posto: fra le cose che sa, e di una specie diversa da
   quello di prima, se il caso lo concede */
function prossimoSentiero() {
  const t = generaSentiero(sentieri.value, caso(semeSeduta * 1009 + sentieri.value),
                           { sbloccati: sbloccati(), prima: famigliaPrima })
  famigliaPrima = t.famiglia
  entra({ ...t, chiave: `sentiero-${sentieri.value}` }, -1)
}

/* la serie è un risultato solo quando si chiude, non a ogni sentiero vinto:
   con un aiuto pagato, con «lascio perdere» o con un sentiero nuovo, mai
   uscendo. La sosta la perde nello stesso salvataggio che scrive il
   record, così non si scrive due volte */
function chiudiLaSerie() {
  const n = serie.value
  if (!n) return null
  serie.value = 0
  if (quaderno.sentiero) { quaderno.sentiero.serie = 0; salvaSosta(CHIAVE, scrivi(quaderno)) }
  return segnaPrimato(CHIAVE, n)
}

/* «torno da dove ero»: il posto di allora con la sua fila, o il prossimo,
   che rinasce uguale dal seme */
function riprendiSentiero() {
  const s = quaderno.sentiero
  chiede.value = ''
  if (!s) return avviaSentiero()
  sentieri.value = s.sentieri
  serie.value = s.serie
  semeSeduta = s.seme
  famigliaPrima = s.prima
  if (!s.posto) return prossimoSentiero()
  const posto = JSON.parse(JSON.stringify(s.posto))
  entra({ ...posto, chiave: `sentiero-${s.sentieri}` }, -1, s.fila)
  chiusaDallAiuto = s.chiusa
}

// «lascio perdere»: la serie finisce davvero, e il suo record si scrive
function scordaSentiero() {
  const s = quaderno.sentiero
  chiede.value = ''
  if (s && s.serie) { serie.value = s.serie; chiudiLaSerie() }
  serie.value = 0
  quaderno.sentiero = null
  salvaSosta(CHIAVE, scrivi(quaderno), { subito: true })
}

function vuoleSentiero() {
  if (ripresa.value) chiede.value = 'un sentiero nuovo'
  else avviaSentiero()
}

function vittoriaSentiero(esito, strada) {
  const monete = premioDi(tappa.value)
  sentieri.value++
  addCoins(monete)
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
  return { che: 'sentiero', titolo: tappa.value.nome, frase, record, monete,
           ...strada, zaino: !!liv.zaino }
}

/* ═══════════ dopo il cartello ═══════════ */
function avanti() {
  if (sentiero.value) return prossimoSentiero()
  const i = tappaIdx.value, p = prossimaDopo(i)
  if (p !== null) avviaTappa(p)
  // il sentiero lasciato a metà si riprende: cominciarne un altro ne chiuderebbe la serie
  else if (sentieroDopo(i) && sentieroAperto()) riprendiSentiero()
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
  salvaOra()
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
  <div ref="radice" class="schermo">
    <Barra :titolo="titolo" guida="passo" monete @indietro="indietro" />

    <div class="pp">
      <Mappa v-if="vista === 'mappa'" :voci="voci" :senza-fine="statoSentiero"
             :dove="doveSegnalino" :chi="state.player || ''"
             @gioca="avviaTappa" @senza-fine="vuoleSentiero">
        <Ripresa :ripresa="ripresa" :chiede="chiede"
                 @riprendi="riprendiSentiero" @scorda="scordaSentiero"
                 @comincia="avviaSentiero" @annulla="chiede = ''" />
      </Mappa>

      <Campo v-else ref="campo"
             :fila="fila" :cursore="cursore" :corrente="corrente" :guasto="guasto"
             :in-corsa="inCorsa" :salti="!!(tappa && tappa.salti)" :brilla="brilla"
             :prezzo="prezzoDelProssimo" :povero="povero" :armato="armato" :povero-scossa="poveroScossa"
             :pensiero="pensiero" :sospette="sospette" :piena="piena"
             :consiglio="consiglio" :colpo="colpo" :in-coda="aiutoInCoda"
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
