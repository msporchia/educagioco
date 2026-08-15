<script setup>
/* ═══════════════════════════════════════════════════════════════════
   TOWER DEFENSE — il guscio.

   Il campo si prende lo schermo. Non c'è più un banco di bottoni sotto:
   si compra **toccando il campo**, che è il posto dove si sta già
   guardando. Una piazzola vuota chiede che torre costruirci, una torre
   già in piedi apre la sua scheda — e in tutti e due i casi il conto da
   fare sale dal basso, dentro lo stesso foglio.

   Il campo non si ferma mentre si calcola: un minimo di fretta ci va. Il
   foglio però si appoggia sopra e basta, senza rimpicciolire niente —
   un'inquadratura che entra e esce a ogni tocco stanca l'occhio e il
   telefono, e per guardare la battaglia c'è già il gesto giusto:
   chiudere il foglio.

   L'energia ⚡ la lasciano i nemici fermati, e serve sia a costruire sia
   a potenziare — ma potenziare costa molto meno e rende molto di più,
   così il calcolo difficile è la strada conveniente invece che una
   tassa. Gli errori si pagano in energia, mai in vite: sbagliare
   rallenta la difesa, non la fa crollare. E l'ondata parte quando la
   chiama il bambino: il tempo per i conti è tutto suo, la fretta è
   facoltativa e viene pagata a parte.

   ── cosa è rimasto qui dentro ──
   Poco, e apposta. Questo file tiene **la fase** (mappa, gioco, fine) e
   **cosa sta guardando il dito**, e fa da centralino fra i pezzi:

     motore/castello/          le regole, che girano anche senza schermo
     grafica/castello/         i pittori
     components/castello/      campo, foglio, scelta, scheda, mappa, fine
     views/castello/cassa.js   che operazione compra una torre
     views/castello/scena.js   dal motore alla lista di cose in scena
     views/castello/trascino.js la regola del dito sul campo

   Le tre cose che il motore non sa fare — mostrare, far toccare, e
   chiedere un'operazione in colonna prima di pagare — sono l'unica
   ragione per cui questo file esiste.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { state, answer, level, addCoins, tdProgresso, tdCompleta,
         segna, segnaBest, divisioniAccese, tuttoAperto } from '../store/profile.js'
import { TORRI } from '../data/ops.js'
import { CFG, TAPPE, LIBERA, premioTappa } from '../data/castello.js'
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
import { Cassa } from './castello/cassa.js'
import { suono } from '../audio.js'

defineEmits(['vai'])

const fase = ref('mappa')          // mappa | gioco | vinta | trionfo | fine
/* il tabellone: il motore ci scrive dentro e lo schermo si aggiorna da sé */
const hud = reactive({ cuori: CFG.cuori, onda: 0, uccisi: 0, torri: 0, energia: 0 })
/* quello che il campo fa sapere alla schermata: si riempie a ogni fotogramma */
const vista = reactive({ inAttesa: false, pronti: false, restaAttesa: 0, bestia: null,
                         inCampo: 0, vitaOnda: 0, prossime: [] })
const messaggio = reactive({ testo: '', n: 0 })
const premio = ref(0)

const campo = ref(null)            // il componente del campo, non la tela
const cassa = new Cassa()

const progresso = computed(() => tdProgresso())
const tappaIdx = ref(0)            // -1 = partita libera
const tappa = computed(() => (tappaIdx.value < 0 ? LIBERA : TAPPE[tappaIdx.value]))
const campagna = computed(() => tappaIdx.value >= 0)
const divisioni = computed(() => divisioniAccese())
/* la partita libera si apre vincendo l'ultima tappa — o subito, se i
   genitori hanno acceso «tutto aperto» */
const libera = computed(() => progresso.value.libera || tuttoAperto())

/* ── il foglio ──
   Una cosa sola alla volta, e sa sempre *di che cosa* si sta parlando:

     { che: 'costruisci', piazzola }   una piazzola vuota, che torre?
     { che: 'torre', torre }           una torre in campo, e che ci faccio
     { che: 'conto', … }               il calcolo che paga la decisione

   Il terzo non nasce mai da solo: ci si arriva dal primo o dal secondo,
   e si porta dietro dove va a finire la torre. */
const foglio = ref(null)
/* la torre che sta cercando un posto nuovo: il foglio si toglie di
   mezzo e il campo aspetta che gli si dica dove. È un modo e non una
   schermata — si annulla toccando qualunque altra cosa. */
const sposto = ref(null)

/* ── l'acquisto ──
   Il prezzo lo si paga in energia, ma prima si paga in calcolo: la
   `Cassa` dice quale operazione, il motore mette in campo. */
const scelta = ref(null)           // tipo di torre in costruzione
const op = ref(null)
const bersaglio = ref(null)        // torre da potenziare; null = torre nuova
const prezzo = ref(0)              // energia che l'operazione in corso costerà
const dove = ref(null)             // su che piazzola nascerà
const strada = ref(null)           // e che ramo prenderà, se è il gradino del bivio

const massimo = computed(() => tappa.value.cap)
const costoNuova = computed(() => cassa.costoNuova(hud.torri))
const costoSalita = torre => cassa.costoSalita(torre)
const postiFiniti = computed(() => hud.torri >= tappa.value.posti)
const livelloOp = (t, torre) => cassa.gradino(torre)
const motore = () => campo.value?.motore()
const S = () => campo.value?.misure()?.S || 1

/* ── cosa sta guardando il dito ──
   La passa al campo, che la traduce in un alone e in un cerchio di
   raggio d'azione. È l'unica cosa che la schermata dice al campo su
   cosa disegnare, e resta un dato: nessuno qui tocca un pixel. */
const mira = computed(() => {
  if (fase.value !== 'gioco') return null
  const m = motore()
  if (!m) return null
  /* mentre si cerca dove posarla, il campo mostra lei e tutte le
     piazzole libere: è l'unica domanda aperta */
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

/* la torre che fa doppio danno a chi sta per arrivare: il preavviso,
   letto nel momento in cui si sceglie che cosa costruire */
const debole = computed(() => (vista.prossime[0] && vista.prossime[0].debole) || null)

/* ── aprire e chiudere ── */
function apriPiazzola(i) {
  if (fase.value !== 'gioco' || op.value) return
  if (sposto.value) return posala(i)
  foglio.value = { che: 'costruisci', piazzola: i }
}

function apriTorre(torre) {
  if (fase.value !== 'gioco' || op.value || !torre) return
  sposto.value = null                 // toccare una torre annulla lo spostamento
  foglio.value = { che: 'torre', torre }
}

/* ── spostare ──
   Il tasto nella scheda apre il modo; il tocco su una piazzola lo
   chiude. Chi paga e chi decide se si può è il motore: qui si dice solo
   com'è andata. */
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
  annulla()
}

function apriOperazione(t, torre, costo) {
  scelta.value = t
  bersaglio.value = torre || null
  prezzo.value = costo
  op.value = cassa.operazione(t, torre)
  foglio.value = { che: 'conto', torre, piazzola: dove.value, tipo: t }
}

/* ── costruire ──
   La piazzola è quella che si è toccata; chi arriva da fuori senza
   averne toccata una (i test, e chi gioca di fretta) prende la prima
   libera, che è l'ordine di sempre. */
function scegliTorre(t) {
  if (fase.value !== 'gioco' || scelta.value) return
  if (!tappa.value.torri.includes(t)) return
  if (postiFiniti.value) { avvisa('Posti finiti: potenzia una torre'); suono.no(); return }
  if (hud.energia < costoNuova.value) { avvisa(`Servono ${costoNuova.value} ⚡`); suono.no(); return }
  const f = foglio.value
  dove.value = f && f.piazzola != null ? f.piazzola : (motore()?.liberi()[0] ?? null)
  apriOperazione(t, null, costoNuova.value)
}

/* toccare una torre già in campo apre il calcolo che la fa salire di
   livello — e se è il gradino del bivio, `ramo` dice anche che cosa
   diventerà. La scelta non costa un calcolo in più: è quello che il
   calcolo compra. */
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
/* dalla scheda: la torre di cui si sta guardando la scheda */
const salgo = ramo => potenzia(foglio.value && foglio.value.torre, ramo)
/* i due mestieri, quando è il momento di sceglierli */
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
  moneta: () => { addCoins(level.value); suono.moneta() },
}

/* Chi ha già capito non deve stare a guardare: la velocità moltiplica il
   tempo del campo, non quello delle operazioni. */
const VELOCITA = [1, 2, 3]
const velocita = ref(1)
function cambiaVelocita() {
  velocita.value = VELOCITA[(VELOCITA.indexOf(velocita.value) + 1) % VELOCITA.length]
}

function chiamaOnda() { motore()?.chiamaOnda() }
function avvisa(t) { messaggio.testo = t; messaggio.n++ }

/* Il campo cambia misura quando si entra e si esce dalla partita —
   anteprima in alto fuori, schermo intero dentro — e nessun `resize`
   glielo dice. Da quando il mondo è dichiarato una volta per tutte,
   rimisurare a partita in corso non sposta più niente sul campo: cambia
   solo quanto lo si vede grande. */
watch(fase, () => nextTick(() => campo.value?.ridimensiona()))

/* ── le fasi ── */
function inizia(i = tappaIdx.value) {
  tappaIdx.value = i
  cassa.perTappa(tappa.value)
  chiudi()
  campo.value.avvia(tappa.value, i + 1)
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
  premio.value = giaFatta ? 1 : level.value * premioTappa(tappaIdx.value)
  addCoins(premio.value)
  fase.value = ultima ? 'trionfo' : 'vinta'
  suono.livello(); suono.moneta()
  return p
}

const prossimaTappa = () => inizia(Math.min(TAPPE.length - 1, tappaIdx.value + 1))
const prossima = computed(() => (campagna.value ? TAPPE[tappaIdx.value + 1] || null : null))

function finePartita() {
  fase.value = 'fine'
  chiudi()
  suono.fine()
}

function allaMappa() {
  fase.value = 'mappa'
  chiudi()
  tappaIdx.value = Math.min(TAPPE.length - 1, progresso.value.tappa)
  campo.value.apparecchia(tappa.value, tappaIdx.value + 1)
}

onMounted(() => {
  tappaIdx.value = Math.min(TAPPE.length - 1, progresso.value.tappa)
  cassa.perTappa(tappa.value)
  campo.value.apparecchia(tappa.value, tappaIdx.value + 1)
  /* il gancio dei test: da fuori si gioca una partita senza toccare lo
     schermo. Non lo usa nessuna parte del gioco. */
  window.__td = { hud, fase, scelta, op, inizia, scegliTorre, operazioneFinita,
                  nemici: () => motore().nemici, torri: () => motore().torri,
                  colpi: () => motore().colpi, livelloOp,
                  TAPPE, tappaIdx, postazioni: () => motore().postazioni,
                  velocita, cambiaVelocita, chiamaOnda, potenzia, potenziaIndice, bersaglio,
                  inAttesa: computed(() => vista.inAttesa),
                  pronti: computed(() => vista.pronti),
                  prossime: () => vista.prossime,
                  massimo, costoNuova, costoSalita, CFG, divisioni,
                  // il foglio: aprirlo da fuori è come toccare il campo
                  foglio, apriPiazzola, apriTorre, chiudi,
                  liberi: () => motore().liberi(),
                  versoLoSchermo: (x, y) => campo.value.versoLoSchermo(x, y),
                  // -1 è la partita libera: tutte le torri, nessun traguardo
                  iniziaLibera: () => inizia(-1),
                  // aggancio per i test: apre un'operazione a un livello preciso
                  forzaOp: (t, lv) => { scelta.value = t; op.value = cassa.operazioneA(t, lv) } }
})
</script>

<template>
  <div class="schermo td">
    <!-- la barra è quella di tutte le schermate: si torna indietro sempre
         allo stesso modo, e il gioco ci appende i suoi indicatori -->
    <Barra titolo="Castello" :monete="fase !== 'gioco'" @indietro="$emit('vai','home')">
      <GettoniCampo v-if="fase === 'gioco'" :hud="hud" :velocita="velocita"
                    :ondate="campagna ? tappa.ondate : ''" @velocita="cambiaVelocita" />
    </Barra>

    <!-- ════════ L'ARENA ════════
         Il campo, quello che gli sta intorno, e il foglio che ci sale
         sopra. Il campo si ferma anche quando c'è il cartello di un
         traguardo davanti (`state.festa`): quel velo copre tutto per tre
         secondi, e un premio non deve costare un cuore a chi non vede
         più i mostri. -->
    <div class="arena" :class="{ gioca: fase === 'gioco' }">
      <CampoDiBattaglia ref="campo" :hud="hud" :vista="vista" :eventi="eventi"
                        :attivo="fase === 'gioco' && !state.festa.length" :calcolando="!!scelta"
                        :velocita="velocita" :messaggio="messaggio"
                        :mira="mira"
                        @esito="finita" @potenzia="apriTorre" @piazzola="apriPiazzola" />

      <!-- Sopra il campo, e solo fra un'ondata e l'altra: chi sta
           arrivando, e il tasto che lo fa arrivare. Durante la
           battaglia lasciano il posto alla scheda del mostro che è in
           campo — le due cose non servono mai insieme, e su un telefono
           lo spazio in alto è uno solo. -->
      <!-- mentre si cerca dove posare una torre, il fondo dice cosa sta
           succedendo e come tirarsene fuori -->
      <button v-if="fase === 'gioco' && sposto" class="bottone chiaro stretto onda"
              @click="sposto = null">Tocca dove spostarla · annulla</button>

      <template v-else-if="fase === 'gioco' && vista.inAttesa">
        <div class="preavviso-alto"><NastroOndate :prossime="vista.prossime" /></div>
        <button class="bottone stretto onda" :class="{ svelto: vista.pronti }"
                @click="chiamaOnda">
          {{ hud.onda ? 'Manda l\'ondata' : 'Comincia la battaglia' }} ▶<template
            v-if="vista.pronti"> · +{{ CFG.bonusPronti }} ⚡</template><template
            v-else-if="vista.restaAttesa <= 9"> · fra {{ vista.restaAttesa }}</template>
        </button>
      </template>

      <!-- mappa della campagna · vinta · trionfo · sconfitta -->
      <div v-else class="banco">
        <MappaTappe v-if="fase === 'mappa'" :tappe="TAPPE" :fatte="progresso.tappa"
                    :libera="libera" @gioca="inizia" @libera="inizia(-1)"
                    @indietro="$emit('vai','home')" />
        <FineTappa v-else :fase="fase" :tappa="tappa" :prossima="prossima" :hud="hud"
                   :premio="premio" :quante="TAPPE.length" :campagna="campagna"
                   :divisioni="divisioni"
                   @avanti="prossimaTappa" @mappa="allaMappa" @libera="inizia(-1)"
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
                     :tappa="tappa" :energia="hud.energia" :costo="costoNuova"
                     :divisioni="divisioni" :debole="debole" @scegli="scegliTorre" />

        <SchedaTorre v-else-if="foglio && foglio.che === 'torre'"
                     :torre="foglio.torre" :cap="massimo" :costo="costoSalita(foglio.torre)"
                     :energia="hud.energia" :divisioni="divisioni" :rami="rami"
                     :costo-sposta="CFG.spostamento" :puoi-spostare="posti() > 0"
                     @potenzia="salgo" @sposta="chiediSposta" />

        <template v-else-if="foglio && foglio.che === 'conto' && op">
          <div class="intestazione">
            <span class="ritratto">
              <RitrattoTorre :tipo="scelta" :lv="bersaglio ? bersaglio.lv + 1 : 1"
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
    </div>
  </div>
</template>

<style scoped src="./castello/td.css"></style>
