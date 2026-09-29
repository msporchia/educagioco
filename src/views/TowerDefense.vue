<script setup>
// Tower Defense: il guscio. Si compra toccando il campo (vedi
// docs/castello/torri.md), il conto sale dal basso nello stesso foglio, e il
// campo non si ferma mentre si calcola. Questo file tiene solo la fase
// (mappa, gioco, fine) e cosa sta guardando il dito, e fa da centralino fra
// motore/castello/ (regole), grafica/castello/ (pittori), components/castello/
// (campo, foglio, mappa) e views/castello/ (cassa, scena, trascino).
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { state, answer, addCoins, tdProgresso, tdCompleta,
         segna, segnaBest, divisioniAccese, tuttoAperto,
         guidaGiaVista, segnaGuidaVista } from '../store/profile.js'
import { saltaLeSpiegazioni } from '../guide/aiuto.js'
import { usaPausa } from '../giochi/pausa.js'
import { primatoDi, segnaPrimato, regaliDi, regaloPreso } from '../giochi/campagne.js'
import { fraseDiFine, recordInParole, sfidaDi } from '../giochi/primati.js'
import { GIOCHI } from '../data/giochi.js'
import VeloPausa from '../giochi/VeloPausa.vue'
import { TORRI } from '../data/ops.js'
import { immuniDellOnda } from '../data/mostri.js'
import { CFG, TAPPE, LIBERE, liberaDi, premioTappa, quantiRegali, blocchettoDi,
         prossimoAcquisto, sequenzaTorri } from '../data/castello.js'
import ColumnOp from '../components/ColumnOp.vue'
import Barra from '../components/Barra.vue'
import GettoniCampo from '../components/castello/GettoniCampo.vue'
import CampoDiBattaglia from '../components/castello/CampoDiBattaglia.vue'
import NastroOndate from '../components/castello/NastroOndate.vue'
import Foglio from '../components/castello/Foglio.vue'
import SceltaTorre from '../components/castello/SceltaTorre.vue'
import SchedaTorre from '../components/castello/SchedaTorre.vue'
import RitrattoTorre from '../components/castello/RitrattoTorre.vue'
import MappaTappe from '../components/castello/MappaTappe.vue'
import FineTappa from '../components/castello/FineTappa.vue'
import Regalo from '../components/castello/Regalo.vue'
import Potenziamenti from '../components/castello/Potenziamenti.vue'
import { Cassa } from './castello/cassa.js'
import { suono } from '../audio.js'

defineEmits(['vai'])
// Il castello a celle (giochi/castello/) è questa stessa schermata con
// un'altra pelle (`pelle`): tappe, conti e salvataggio restano quelli di `torri`.
defineProps({
  pelle: { type: Object, default: null },
  titolo: { type: String, default: 'Castello' },
  guida: { type: String, default: 'torri' },
})

const fase = ref('mappa')          // mappa | gioco | vinta | trionfo | fine

// La pausa (`giochi/pausa.js`) ferma il campo anche col telefono posato:
// serve perché il castello è l'unico gioco dove si resta fermi a fare un
// conto. `calcolando` non ci entra apposta: il campo non si ferma mentre si
// calcola. `anche` porta anche il regalo, che tiene fermo il campo come un
// traguardo senza mostrare il velo della pausa.
const { inPausa, fermo, metti, togli, aiuto } = usaPausa({
  anche: () => fase.value !== 'gioco' || regaloAperto.value,
})

const hud = reactive({ cuori: CFG.cuori, onda: 0, uccisi: 0, torri: 0, energia: 0 })
const vista = reactive({ inAttesa: false, pronti: false, restaAttesa: 0, bestia: null,
                         inCampo: 0, vitaOnda: 0, prossime: [],
                         regalo: 0, regaliPresi: 0,
                         puoiChiamare: false, premio: 0, potenziamenti: 0 })
const messaggio = reactive({ testo: '', n: 0 })

// Il regalo: finché ce n'è uno in sospeso (`vista.regalo`) l'ondata dopo non
// parte. `rimandato` è il «guardo prima il campo»: il velo si toglie, il
// regalo resta lì e torna al prossimo tentativo di chiamare l'ondata.
const regali = ref({})
const rimandato = ref(false)
const regaloAperto = computed(() => fase.value === 'gioco' && vista.regalo > 0 &&
                                    !rimandato.value && !state.festa.length)

const premio = ref(0)
const primato = ref(null)          // la partita libera appena finita, rispetto al record
const SENZA_FINE = GIOCHI.find(g => g.chiave === 'torri').senzaFine
// le quattro libere per la mappa, col record già in parole; si rilegge a
// ogni partita finita (`primato` cambia), non a ogni fotogramma
const libere = computed(() => (primato.value, LIBERE.map(l => ({
  chiave: l.chiave, nome: l.nome, emoji: l.emoji,
  primato: recordInParole(primatoDi('torri', l.chiave), sfidaDi(SENZA_FINE, l.chiave)),
}))))
const doteLibera = computed(() => quantiRegali(regali.value))

const campo = ref(null)            // il componente del campo, non la tela
const cassa = new Cassa()

const progresso = computed(() => tdProgresso())
const tappaIdx = ref(0)            // -1 = partita libera, quella di `liberaScelta`
const liberaScelta = ref(LIBERE[0].chiave)
const tappa = computed(() => (tappaIdx.value < 0 ? liberaDi(liberaScelta.value) || LIBERE[0]
                                                  : TAPPE[tappaIdx.value]))
const campagna = computed(() => tappaIdx.value >= 0)
const divisioni = computed(() => divisioniAccese())
const libera = computed(() => progresso.value.libera || tuttoAperto())

// Cosa si stava facendo, sul velo della pausa: a che ondata si era (i cuori
// e l'energia sono già nella barra sopra).
const dovEravamo = computed(() => {
  if (!hud.onda) return '⚔️ la battaglia non è ancora cominciata'
  return campagna.value ? `⚔️ ondata ${hud.onda} di ${tappa.value.ondate}`
                        : `⚔️ ondata ${hud.onda}`
})

// Il foglio: una cosa sola alla volta — { che: 'costruisci', piazzola } |
// { che: 'torre', torre } | { che: 'conto', … } (nasce sempre dai primi due).
const foglio = ref(null)
// la torre che sta cercando un posto nuovo: un modo, non una schermata — si
// annulla toccando qualunque altra cosa
const sposto = ref(null)

const scelta = ref(null)           // tipo di torre in costruzione

// La riga dei primi passi: non un tutorial che blocca, solo una riga in
// fondo che dura finché la prima torre non è in piedi (memoria in
// `guideViste`, per bambino).
const PRIMI_PASSI = 'torri:primi-passi'
const primiPassi = ref(false)
const passoFatto = ref(false)

function accendiPrimiPassi () {
  if (saltaLeSpiegazioni() || guidaGiaVista(PRIMI_PASSI)) return
  primiPassi.value = true
  passoFatto.value = false
}

// La riga cambia una volta sola: prima dice cosa toccare, poi (prima torre
// in piedi) che i soldi per la prossima escono dai conti.
const dritta = computed(() => {
  if (!primiPassi.value || fase.value !== 'gioco') return ''
  if (hud.torri === 0) return 'Tocca una piazzola: il conto che esce paga la torre'
  return 'Le torri sparano da sole · i soldi per la prossima escono dai conti'
})

watch(() => hud.torri, n => {
  if (!primiPassi.value || !n || passoFatto.value) return
  passoFatto.value = true
  segnaGuidaVista(PRIMI_PASSI)
  setTimeout(() => { primiPassi.value = false }, 6000)
})

const op = ref(null)
const bersaglio = ref(null)        // torre da potenziare; null = torre nuova
const prezzo = ref(0)              // energia che l'operazione in corso costerà
const dove = ref(null)             // su che piazzola nascerà
const strada = ref(null)           // e che ramo prenderà, se è il gradino del bivio

const massimo = computed(() => tappa.value.cap)
const costoNuova = tipo => cassa.costoNuova(hud.torri, tipo)
const costi = computed(() => Object.fromEntries(tappa.value.torri.map(k => [k, costoNuova(k)])))
const costoSalita = torre => cassa.costoSalita(torre)
const postiFiniti = computed(() => hud.torri >= tappa.value.posti)
const livelloOp = (t, torre) => cassa.gradino(torre)
const motore = () => campo.value?.motore()
const S = () => campo.value?.misure()?.S || 1

// Cosa sta guardando il dito: la passa al campo (un dato, nessun pixel qui).
const mira = computed(() => {
  if (fase.value !== 'gioco') return null
  const m = motore()
  if (!m) return null
  const t = sposto.value
  if (t) return { torre: t, x: t.x, y: t.y, tipo: t.tipo,
                  raggio: t.raggio(S()), muovendo: true }
  const f = foglio.value
  if (!f) return null
  if (f.torre) return { torre: f.torre, x: f.torre.x, y: f.torre.y,
                        tipo: f.torre.tipo, raggio: f.torre.raggio(S()) }
  const p = m.postazioni[f.piazzola]
  if (!p) return null
  return { piazzola: f.piazzola, x: p.x, y: p.y, tipo: f.tipo || null,
           raggio: f.tipo ? TORRI[f.tipo].raggio * S() : 0 }
})

// le torri a cui chi sta per arrivare è immune, letto dal preavviso
const immune = computed(() => immuniDellOnda(vista.prossime[0]))

// Il blocchetto: una fotografia presa quando si apre (le torri del motore
// non sono reattive), rifatta a ogni apertura.
const blocchetto = ref(null)
function apriBlocchetto() {
  const m = motore()
  if (!m || fase.value !== 'gioco') return
  chiudi()
  blocchetto.value = blocchettoDi(m.torri.map(t => ({ tipo: t.tipo, lv: t.lv, ramo: t.ramo })),
                                  m.regali)
}

/* ── aprire e chiudere ── */
function apriPiazzola(i) {
  if (fase.value !== 'gioco' || op.value) return
  blocchetto.value = null
  if (sposto.value) return posala(i)
  foglio.value = { che: 'costruisci', piazzola: i }
}

function apriTorre(torre) {
  if (fase.value !== 'gioco' || op.value || !torre) return
  blocchetto.value = null
  sposto.value = null                 // toccare una torre annulla lo spostamento
  foglio.value = { che: 'torre', torre }
}

// Il tasto nella scheda apre il modo, il tocco su una piazzola lo chiude
// (il motore decide se si può e paga; qui si dice solo com'è andata).
function chiediSposta() {
  const t = foglio.value && foglio.value.torre
  if (!t) return
  sposto.value = t
  foglio.value = null
  avvisa('Tocca la piazzola dove spostarla')
}

function posala(i) {
  const t = sposto.value
  if (motore().sposta(t, i)) {
    sposto.value = null
    avvisa(`${TORRI[t.tipo].nome} spostata · −${CFG.spostamento} ⚡`)
  } else avvisa(`Servono ${CFG.spostamento} ⚡ per spostarla`)
}

const posti = () => (motore() ? motore().liberi().length : 0)

function chiudi() {
  foglio.value = null
  sposto.value = null
  blocchetto.value = null
  annulla()
}

function apriOperazione(t, torre, costo) {
  scelta.value = t
  bersaglio.value = torre || null
  prezzo.value = costo
  op.value = cassa.operazione(t, torre)
  foglio.value = { che: 'conto', torre, piazzola: dove.value, tipo: t }
}

// La piazzola è quella toccata; chi non ne ha toccata una (i test) prende
// la prima libera.
function scegliTorre(t) {
  if (fase.value !== 'gioco' || scelta.value) return
  if (!tappa.value.torri.includes(t)) return
  if (postiFiniti.value) { avvisa('Posti finiti: potenzia una torre'); suono.no(); return }
  const costo = costoNuova(t)
  if (hud.energia < costo) { avvisa(`Servono ${costo} ⚡`); suono.no(); return }
  const f = foglio.value
  dove.value = f && f.piazzola != null ? f.piazzola : (motore()?.liberi()[0] ?? null)
  apriOperazione(t, null, costo)
}

// Toccare una torre apre il calcolo che la fa salire; `ramo`, al bivio,
// dice anche cosa diventerà.
function potenzia(torre, ramo = null) {
  if (fase.value !== 'gioco' || scelta.value || !torre) return
  if (!cassa.potenziabile(torre)) { avvisa('Già al massimo'); return }
  const costo = costoSalita(torre)
  if (hud.energia < costo) { avvisa(`Servono ${costo} ⚡`); suono.no(); return }
  dove.value = null
  strada.value = ramo
  apriOperazione(torre.tipo, torre, costo)
}
const potenziaIndice = i => potenzia(motore().torri[i])
const salgo = ramo => potenzia(foglio.value && foglio.value.torre, ramo)
const rami = computed(() => {
  const f = foglio.value
  return f && f.che === 'torre' ? cassa.rami(f.torre) : []
})

function operazioneFinita({ errori, ms }) {
  const t = scelta.value, torre = bersaglio.value
  answer(cassa.chiave(t), { correct: errori === 0, ms })
  if (errori === 0) segna('perfette')
  // il conto: il prezzo pattuito più una penale per ogni errore. Si paga in
  // energia, non in vite: sbagliare rallenta la difesa, non la fa crollare.
  const penale = errori * CFG.malusErrore
  const conto = { prezzo: prezzo.value, penale, posto: dove.value, ramo: strada.value }
  let testo
  if (torre) { motore().potenzia(torre, conto); testo = `${TORRI[t].nome} livello ${torre.lv}!` }
  else { motore().costruisci(t, conto); testo = `${TORRI[t].nome} costruita` }
  if (penale) { testo += ` · −${penale} ⚡`; suono.no() }
  avvisa(testo)
  chiudi()
}

function annulla() {
  scelta.value = null; op.value = null; bersaglio.value = null
  prezzo.value = 0; dove.value = null; strada.value = null
}

/* dal conto si torna a quello che l'ha aperto, non allo schermo vuoto:
   chi ha sbagliato torre vuole sceglierne un'altra, non ricominciare */
function indietro() {
  const f = foglio.value
  const torre = bersaglio.value, piazzola = f ? f.piazzola : null
  annulla()
  foglio.value = torre ? { che: 'torre', torre }
                       : piazzola != null ? { che: 'costruisci', piazzola } : null
}

/* ── il campo ──
   Da qui in giù questa view non decide più niente di quello che succede
   sul campo: mostri, torri, colpi ed energia sono affare del motore, che
   gira anche senza uno schermo — ed è per questo che il bilanciamento si
   può simulare invece di provarlo a occhio. */

const eventi = {
  avvisa: t => avvisa(t),
  suona: che => {
    if (che === 'colpito') suono.nota(320, 140, 0.08, 'square', 0.07)
    else suono[che]?.()
  },
  /* il motore conta quello che succede, il profilo sa cosa farsene */
  segna: (che, valore) => {
    if (che === 'onda-massima') segnaBest('onda', valore)
    else segna(che)
  },
  // 🪙1 ogni CFG.perMoneta ondate rette (docs/castello/taratura.md): niente moltiplicatore di livello
  moneta: () => { addCoins(1); suono.moneta() },
}

/* Chi ha già capito non deve stare a guardare: la velocità moltiplica il
   tempo del campo, non quello delle operazioni. */
const VELOCITA = [1, 2, 3]
const velocita = ref(1)
function cambiaVelocita() {
  velocita.value = VELOCITA[(VELOCITA.indexOf(velocita.value) + 1) % VELOCITA.length]
}

/* Chiamare l'ondata con un regalo in sospeso **riapre il regalo** invece
   di mandare i mostri: è il modo in cui «guardo prima il campo» non
   perde niente. Il motore rifiuta comunque (`chiamaOnda` guarda
   `daScegliere`), ma se qui non si riaprisse il velo il tasto
   sembrerebbe rotto.
   Lo stesso tasto c'è anche **durante** l'ondata, appena è uscita tutta
   dalla bocca: la prossima parte subito, con i mostri di adesso ancora
   in campo, e il premio sul tasto dice quanto rende la fretta. */
function chiamaOnda() {
  if (vista.regalo > 0) { rimandato.value = false; return }
  motore()?.chiamaOnda()
}

/* ── un regalo scelto ──
   Due scritture, e sono due cose diverse: nel profilo (definitivo,
   vale da domani) e nel motore (subito, sulle torri già in piedi). */
function prendiRegalo(id) {
  regali.value = regaloPreso('torri', id)
  /* il suono lo fa il motore (`suona('livello')`), come per ogni altra
     cosa che succede in campo: due colpi di gong per lo stesso gesto si
     sentono come un guasto */
  const m = motore()
  m?.prendiRegalo(id)
  /* ── e qui si rilegge il motore a mano, che è l'unico punto di tutto
     il file dove si fa ──
     `vista` la riempie il campo a ogni fotogramma, ma col velo aperto il
     campo è fermo (`fermo` lo include), e `fermo` dipende da
     `vista.regalo`: aspettare il prossimo fotogramma vorrebbe dire
     aspettare un fotogramma che non arriverà mai, cioè un velo che non
     si chiude più. */
  vista.regalo = m ? m.regaliDaScegliere : 0
  vista.regaliPresi = m ? m.regaliPresi : 0
  rimandato.value = false
}
function avvisa(t) { messaggio.testo = t; messaggio.n++ }

/* Il campo cambia misura quando si entra e si esce dalla partita —
   anteprima in alto fuori, schermo intero dentro — e nessun `resize`
   glielo dice. Da quando il mondo è dichiarato una volta per tutte,
   rimisurare a partita in corso non sposta più niente sul campo: cambia
   solo quanto lo si vede grande. */
watch(fase, () => nextTick(() => campo.value?.ridimensiona()))

/* ── le fasi ──
   `i` è l'indice della tappa, o -1 per una partita libera: quale, lo
   dice `quale` (la chiave di una di `LIBERE`), e chi non lo dice
   rigioca quella di prima. */
function inizia(i = tappaIdx.value, quale = null) {
  accendiPrimiPassi()
  /* una tappa che comincia non comincia in pausa: il telefono posato
     sulla mappa, o davanti al cartello di fine, lascia il freno acceso —
     e senza questa riga la battaglia nuova nascerebbe dietro un velo che
     nessuno ha chiesto */
  togli()
  if (quale && liberaDi(quale)) liberaScelta.value = quale
  tappaIdx.value = i
  cassa.perTappa(tappa.value)
  chiudi()
  // i regali si rileggono dal profilo: nella campagna il motore li ignora
  // da sé (la tappa non li prevede)
  regali.value = regaliDi('torri')
  rimandato.value = false
  campo.value.avvia(tappa.value, i + 1, regali.value)
  fase.value = 'gioco'
  avvisa('Tocca una piazzola per costruire')
}

function finita(esito) {
  if (esito === 'vinta') tappaSuperata()
  else finePartita()
}

/* la tappa è superata quando l'ultima ondata è finita e il campo è pulito */
function tappaSuperata() {
  if (!campagna.value) return           // la partita libera non finisce mai
  const ultima = tappaIdx.value === TAPPE.length - 1
  // il premio è della prima volta: rigiocare una tappa già vinta lascia una
  // moneta di cortesia, non uno stipendio
  const giaFatta = progresso.value.tappa > tappaIdx.value
  const p = tdCompleta(tappaIdx.value, TAPPE.length)
  // premioTappa già paga per i conti che la tappa chiede: niente moltiplicatore di livello
  premio.value = giaFatta ? 1 : premioTappa(tappaIdx.value)
  addCoins(premio.value)
  fase.value = ultima ? 'trionfo' : 'vinta'
  suono.livello(); suono.moneta()
  return p
}

const prossimaTappa = () => inizia(Math.min(TAPPE.length - 1, tappaIdx.value + 1))
const prossima = computed(() => (campagna.value ? TAPPE[tappaIdx.value + 1] || null : null))
// la partita libera del terreno appena giocato: quella offerta dal trionfo
const liberaDiQui = () => (LIBERE.find(l => l.campagna === tappa.value.campagna) || LIBERE[0]).chiave

function finePartita() {
  fase.value = 'fine'
  chiudi()
  suono.fine()
  primato.value = null
  if (!campagna.value) {
    const sfida = sfidaDi(SENZA_FINE, tappa.value.chiave)
    const esito = segnaPrimato('torri', Math.max(0, hud.onda - 1), Date.now(),
                               { uccisi: hud.uccisi, torri: hud.torri }, tappa.value.chiave)
    primato.value = { ...esito, frase: fraseDiFine(esito, sfida.misura) }
  }
}

function allaMappa() {
  togli()
  fase.value = 'mappa'
  chiudi()
  tappaIdx.value = Math.min(TAPPE.length - 1, progresso.value.tappa)
  campo.value.apparecchia(tappa.value, tappaIdx.value + 1)
}

onMounted(() => {
  tappaIdx.value = Math.min(TAPPE.length - 1, progresso.value.tappa)
  cassa.perTappa(tappa.value)
  regali.value = regaliDi('torri')
  campo.value.apparecchia(tappa.value, tappaIdx.value + 1)
  // il gancio dei test: gioca una partita senza toccare lo schermo (non lo
  // usa nessuna parte del gioco)
  window.__td = { hud, fase, scelta, op, inizia, scegliTorre, operazioneFinita,
                  blocchetto, apriBlocchetto, vista,
                  // la mossa del giocatore modello, con la stessa funzione
                  // del simulatore (`prossimoAcquisto`)
                  mossaModello: (largo = false) => {
                    const m = motore(), t = tappa.value
                    if (!m) return null
                    const mossa = prossimoAcquisto(m.torri.map(x => ({ tipo: x.tipo, lv: x.lv })), t,
                      { posti: t.posti, largo, sequenza: sequenzaTorri(t, Math.max(32, t.posti)),
                        onda: m.tabellone.onda })
                    return mossa && mossa.che === 'salita' ? { ...mossa, torre: m.torri[mossa.indice] } : mossa
                  },
                  nemici: () => motore().nemici, torri: () => motore().torri,
                  /* il motore stesso, per le prove che devono arrivare a
                     un'ondata lontana (il capo) senza giocarle tutte */
                  motore: () => motore(),
                  colpi: () => motore().colpi, livelloOp,
                  TAPPE, tappaIdx, postazioni: () => motore().postazioni,
                  velocita, cambiaVelocita, chiamaOnda, potenzia, potenziaIndice, bersaglio,
                  // i regali della partita libera: quanti se ne hanno, e prenderne uno
                  regali, regaloAperto, prendiRegalo,
                  inAttesa: computed(() => vista.inAttesa),
                  pronti: computed(() => vista.pronti),
                  prossime: () => vista.prossime,
                  massimo, costoNuova, costoSalita, CFG, divisioni,
                  // il foglio: aprirlo da fuori è come toccare il campo
                  foglio, apriPiazzola, apriTorre, chiudi,
                  liberi: () => motore().liberi(),
                  versoLoSchermo: (x, y) => campo.value.versoLoSchermo(x, y),
                  // -1 è una partita libera: nessun traguardo. Quale, lo dice
                  // la chiave (`libera-bosco`…); senza, la prima
                  iniziaLibera: (quale = LIBERE[0].chiave) => inizia(-1, quale),
                  LIBERE, liberaScelta,
                  // aggancio per i test: apre un'operazione a un livello preciso
                  forzaOp: (t, lv) => { scelta.value = t; op.value = cassa.operazioneA(t, lv) } }
})
</script>

<template>
  <div class="schermo td">
    <!-- il ⏸ c'è solo dove il campo cammina -->
    <Barra :titolo="titolo" :guida="guida" @aiuto="aiuto"
           :pausa="fase === 'gioco' && !state.festa.length" @pausa="metti()"
           :monete="fase !== 'gioco'" @indietro="$emit('vai','home')">
      <GettoniCampo v-if="fase === 'gioco'" :hud="hud" :velocita="velocita"
                    :ondate="campagna ? tappa.ondate : ''" @velocita="cambiaVelocita" />
    </Barra>

    <!-- L'arena: il campo cammina quando non è `fermo` (giochi/pausa.js) -->
    <div class="arena" :class="{ gioca: fase === 'gioco' }">
      <CampoDiBattaglia ref="campo" :hud="hud" :vista="vista" :eventi="eventi"
                        :attivo="!fermo" :calcolando="!!scelta"
                        :velocita="velocita" :messaggio="messaggio"
                        :mira="mira" :pelle="pelle"
                        @esito="finita" @potenzia="apriTorre" @piazzola="apriPiazzola" />

      <!-- la prima partita in assoluto: non blocca niente, se ne va da sé -->
      <div v-if="dritta" class="primi-passi">{{ dritta }}</div>

      <button v-if="fase === 'gioco' && !foglio && !blocchetto" class="tondo su-potenziamenti"
              data-azione="potenziamenti" aria-label="potenziamenti" @click="apriBlocchetto">
        ⬆️<b>{{ vista.potenziamenti }}</b>
      </button>

      <button v-if="fase === 'gioco' && sposto" class="bottone chiaro stretto onda"
              @click="sposto = null">Tocca dove spostarla · annulla</button>

      <template v-else-if="fase === 'gioco' && vista.inAttesa">
        <div class="preavviso-alto"><NastroOndate :prossime="vista.prossime"
                                                   :pittori="pelle ? pelle.pittori : null" /></div>
        <button class="bottone stretto onda" :class="{ svelto: vista.pronti }"
                data-azione="chiama-onda" @click="chiamaOnda">
          {{ hud.onda ? 'Manda l\'ondata' : 'Comincia la battaglia' }} ▶<template
            v-if="vista.pronti"> · +{{ vista.premio }} ⚡</template><template
            v-else-if="vista.restaAttesa <= 9"> · fra {{ vista.restaAttesa }}</template>
        </button>
      </template>

      <button v-else-if="fase === 'gioco' && vista.puoiChiamare && !foglio && !blocchetto"
              class="bottone stretto onda svelto" data-azione="chiama-prossima" @click="chiamaOnda">
        Manda la prossima ▶<template v-if="vista.premio"> · +{{ vista.premio }} ⚡</template>
      </button>

      <div v-else class="banco">
        <MappaTappe v-if="fase === 'mappa'" :tappe="TAPPE" :fatte="progresso.tappa"
                    :libera="libera" :libere="libere" :regali="doteLibera"
                    @gioca="inizia" @libera="quale => inizia(-1, quale)"
                    @indietro="$emit('vai','home')" />
        <FineTappa v-else :fase="fase" :tappa="tappa" :prossima="prossima" :hud="hud"
                   :premio="premio" :quante="TAPPE.length" :campagna="campagna"
                   :divisioni="divisioni" :primato="primato"
                   @avanti="prossimaTappa" @mappa="allaMappa" @libera="inizia(-1, liberaDiQui())"
                   @riprova="inizia()" />
      </div>

      <!-- ════════ IL FOGLIO ════════
           Quello che sale dal basso: la scelta della torre, la scheda di
           quella che c'è già, e il conto che paga l'una o l'altra. -->
      <Foglio v-if="fase === 'gioco'" :aperto="!!foglio"
              :titolo="foglio && foglio.che === 'costruisci' ? 'Che torre costruisci qui?' : ''"
              :indietro="!!(foglio && foglio.che === 'conto')"
              @chiudi="chiudi" @indietro="indietro">
        <SceltaTorre v-if="foglio && foglio.che === 'costruisci'"
                     :tappa="tappa" :energia="hud.energia" :costi="costi"
                     :divisioni="divisioni" :immune="immune" @scegli="scegliTorre"
                     :pittori="pelle ? pelle.pittori : null" />

        <SchedaTorre v-else-if="foglio && foglio.che === 'torre'"
                     :torre="foglio.torre" :cap="massimo" :costo="costoSalita(foglio.torre)"
                     :pittori="pelle ? pelle.pittori : null"
                     :energia="hud.energia" :divisioni="divisioni" :rami="rami"
                     :costo-sposta="CFG.spostamento" :puoi-spostare="posti() > 0"
                     @potenzia="salgo" @sposta="chiediSposta" />

        <template v-else-if="foglio && foglio.che === 'conto' && op">
          <div class="intestazione">
            <span class="ritratto">
              <RitrattoTorre :tipo="scelta" :lv="bersaglio ? bersaglio.lv + 1 : 1"
                             :pittori="pelle ? pelle.pittori : null"
                             :ramo="strada || (bersaglio && bersaglio.ramo)" :unita="52" />
            </span>
            <b>{{ TORRI[scelta].nome }}</b>
            <span class="grado">{{ bersaglio ? 'livello ' + bersaglio.lv + ' → ' + (bersaglio.lv + 1)
                                             : 'nuova, livello 1' }}</span>
            <span class="prezzo">{{ prezzo }} ⚡</span>
          </div>
          <ColumnOp :op="op" @fatto="operazioneFinita" />
        </template>
      </Foglio>

      <Foglio v-if="fase === 'gioco'" :aperto="!!blocchetto" titolo="I tuoi potenziamenti"
              @chiudi="blocchetto = null">
        <Potenziamenti v-if="blocchetto" :blocchetto="blocchetto"
                       :pittori="pelle ? pelle.pittori : null" />
      </Foglio>

      <!-- il regalo sta sopra il foglio e sotto la pausa -->
      <Regalo v-if="regaloAperto && !inPausa" :presi="vista.regaliPresi" :gradi="regali"
              @scegli="prendiRegalo" @piu-tardi="rimandato = true" />

      <VeloPausa v-if="inPausa && fase === 'gioco' && !state.festa.length"
                 :dove="dovEravamo" @riprendi="togli" />
    </div>
  </div>
</template>

<style scoped src="./castello/td.css"></style>
