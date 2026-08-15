<script setup>
/* ═══════════════════════════════════════════════════════════════════
   TOWER DEFENSE — il guscio.

   Sopra i nemici avanzano lungo il percorso; sotto si sceglie che torre
   costruire e si risolve l'operazione corrispondente. La torre nasce
   quando l'operazione è finita, sempre al livello 1: per farla salire si
   tocca sul campo e si risolve il gradino successivo della scaletta.

   L'energia ⚡ la lasciano i nemici fermati, e serve sia a costruire sia
   a potenziare — ma potenziare costa molto meno e rende molto di più,
   così il calcolo difficile è la strada conveniente invece che una
   tassa. Gli errori si pagano in energia, mai in vite: sbagliare
   rallenta la difesa, non la fa crollare. E l'ondata parte quando la
   chiama il bambino: il tempo per i conti è tutto suo, la fretta è
   facoltativa e viene pagata a parte.

   ── cosa è rimasto qui dentro ──
   Poco, e apposta. Questo file tiene **la fase** (mappa, gioco, fine) e
   fa da centralino fra i pezzi:

     motore/castello/          le regole, che girano anche senza schermo
     grafica/castello/         i pittori
     components/castello/      campo, banco, mappa, gettoni, fine
     views/castello/cassa.js   che operazione compra una torre
     views/castello/scena.js   dal motore alla lista di cose in scena
     views/castello/trascino.js la regola del dito sul campo

   Le tre cose che il motore non sa fare — mostrare, far toccare, e
   chiedere un'operazione in colonna prima di pagare — sono l'unica
   ragione per cui questo file esiste.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, reactive, computed, onMounted } from 'vue'
import { state, answer, level, addCoins, tdProgresso, tdCompleta,
         segna, segnaBest, contiPermessi, tuttoAperto } from '../store/profile.js'
import { TORRI, emojiTorre } from '../data/ops.js'
import { CFG, TAPPE, LIBERA, premioTappa } from '../data/castello.js'
import ColumnOp from '../components/ColumnOp.vue'
import Barra from '../components/Barra.vue'
import GettoniCampo from '../components/castello/GettoniCampo.vue'
import CampoDiBattaglia from '../components/castello/CampoDiBattaglia.vue'
import BancoTorri from '../components/castello/BancoTorri.vue'
import MappaTappe from '../components/castello/MappaTappe.vue'
import FineTappa from '../components/castello/FineTappa.vue'
import { Cassa } from './castello/cassa.js'
import { suono } from '../audio.js'

defineEmits(['vai'])

const fase = ref('mappa')          // mappa | gioco | vinta | trionfo | fine
/* il tabellone: il motore ci scrive dentro e lo schermo si aggiorna da sé */
const hud = reactive({ cuori: CFG.cuori, onda: 0, uccisi: 0, torri: 0, energia: 0 })
/* quello che il campo fa sapere al banco: si riempie a ogni fotogramma */
const vista = reactive({ inAttesa: false, pronti: false, restaAttesa: 0, bestia: null,
                         inCampo: 0, vitaOnda: 0, daPotenziare: false, torri: [], prossime: [] })
const messaggio = reactive({ testo: '', n: 0 })
const premio = ref(0)

const campo = ref(null)            // il componente del campo, non la tela
const cassa = new Cassa()

const progresso = computed(() => tdProgresso())
const tappaIdx = ref(0)            // -1 = partita libera
const tappa = computed(() => (tappaIdx.value < 0 ? LIBERA : TAPPE[tappaIdx.value]))
const campagna = computed(() => tappaIdx.value >= 0)
const sa = computed(() => contiPermessi())
/* la partita libera si apre vincendo l'ultima tappa — o subito, se i
   genitori hanno acceso «tutto aperto» */
const libera = computed(() => progresso.value.libera || tuttoAperto())

/* ── l'acquisto ──
   Il prezzo lo si paga in energia, ma prima si paga in calcolo: la
   `Cassa` dice quale operazione, il motore mette in campo. */
const scelta = ref(null)           // tipo di torre in costruzione
const op = ref(null)
const bersaglio = ref(null)        // torre da potenziare; null = torre nuova
const prezzo = ref(0)              // energia che l'operazione in corso costerà

const massimo = computed(() => tappa.value.cap)
const costoNuova = computed(() => cassa.costoNuova(hud.torri))
const costoSalita = torre => cassa.costoSalita(torre)
const postiFiniti = computed(() => hud.torri >= tappa.value.posti)
const livelloOp = (t, torre) => cassa.gradino(torre)

function apriOperazione(t, torre, costo) {
  scelta.value = t
  bersaglio.value = torre || null
  prezzo.value = costo
  op.value = cassa.operazione(t, torre)
}

function scegliTorre(t) {
  if (fase.value !== 'gioco' || scelta.value) return
  if (!tappa.value.torri.includes(t)) return
  if (postiFiniti.value) { avvisa('Posti finiti: potenzia una torre'); suono.no(); return }
  if (hud.energia < costoNuova.value) { avvisa(`Servono ${costoNuova.value} ⚡`); suono.no(); return }
  apriOperazione(t, null, costoNuova.value)
}

/* toccare una torre già in campo apre il calcolo che la fa salire di livello */
function potenzia(torre) {
  if (fase.value !== 'gioco' || scelta.value || !torre) return
  if (!cassa.potenziabile(torre)) { avvisa('Già al massimo'); return }
  const costo = costoSalita(torre)
  if (hud.energia < costo) { avvisa(`Servono ${costo} ⚡`); suono.no(); return }
  apriOperazione(torre.tipo, torre, costo)
}
const potenziaIndice = i => potenzia(motore().torri[i])

function operazioneFinita({ errori, ms }) {
  const t = scelta.value, torre = bersaglio.value
  answer(cassa.chiave(t), { correct: errori === 0, ms })
  if (errori === 0) segna('perfette')
  // il conto: il prezzo pattuito più una penale per ogni errore. Si paga in
  // energia, non in vite: sbagliare rallenta la difesa, non la fa crollare.
  const penale = errori * CFG.malusErrore
  const conto = { prezzo: prezzo.value, penale }
  let testo
  if (torre) { motore().potenzia(torre, conto); testo = `${TORRI[t].nome} livello ${torre.lv}!` }
  else { motore().costruisci(t, conto); testo = `${TORRI[t].nome} costruita` }
  if (penale) { testo += ` · −${penale} ⚡`; suono.no() }
  avvisa(testo)
  annulla()
}

function annulla() {
  scelta.value = null; op.value = null; bersaglio.value = null; prezzo.value = 0
}

/* ── il campo ──
   Da qui in giù questa view non decide più niente di quello che succede
   sul campo: mostri, torri, colpi ed energia sono affare del motore, che
   gira anche senza uno schermo — ed è per questo che il bilanciamento si
   può simulare invece di provarlo a occhio. */
const motore = () => campo.value?.motore()

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

/* ── le fasi ── */
function inizia(i = tappaIdx.value) {
  tappaIdx.value = i
  cassa.perTappa(tappa.value)
  annulla()
  campo.value.avvia(tappa.value, i + 1)
  fase.value = 'gioco'
  avvisa('Costruisci la prima torre')
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
  suono.fine()
}

function allaMappa() {
  fase.value = 'mappa'
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
                  velocita, cambiaVelocita, chiamaOnda, potenzia, bersaglio,
                  inAttesa: computed(() => vista.inAttesa),
                  pronti: computed(() => vista.pronti),
                  prossime: () => vista.prossime,
                  massimo, costoNuova, costoSalita, CFG, sa,
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

    <!-- ════════ SOPRA: il campo ════════
         Il campo si ferma anche quando c'è il cartello di un traguardo
         davanti (`state.festa`): quel velo copre tutto per tre secondi, e
         un premio non deve costare un cuore a chi non vede più i mostri. -->
    <CampoDiBattaglia ref="campo" :hud="hud" :vista="vista" :eventi="eventi"
                      :attivo="fase === 'gioco' && !state.festa.length" :calcolando="!!scelta"
                      :velocita="velocita" :messaggio="messaggio"
                      @esito="finita" @potenzia="potenzia" />

    <!-- ════════ SOTTO: le operazioni ════════ -->
    <div class="banco">
      <!-- scelta della torre -->
      <BancoTorri v-if="fase === 'gioco' && !scelta" :tappa="tappa" :hud="hud" :vista="vista"
                  :costo-nuova="costoNuova" :posti-finiti="postiFiniti" :sa="sa"
                  @scegli="scegliTorre" @potenzia="potenziaIndice" @onda="chiamaOnda" />

      <!-- operazione in corso -->
      <template v-else-if="fase === 'gioco' && op">
        <div class="intestazione">
          <button class="tondo indietro" @click="annulla" title="cambia torre">‹</button>
          <span class="em">{{ emojiTorre(scelta, bersaglio ? bersaglio.lv + 1 : 1) }}</span>
          <b>{{ TORRI[scelta].nome }}</b>
          <span class="grado">{{ bersaglio ? 'livello ' + bersaglio.lv + ' → ' + (bersaglio.lv + 1)
                                           : 'nuova, livello 1' }}</span>
          <span class="prezzo">{{ prezzo }} ⚡</span>
        </div>
        <ColumnOp :op="op" @fatto="operazioneFinita" />
      </template>

      <!-- mappa della campagna -->
      <MappaTappe v-else-if="fase === 'mappa'" :tappe="TAPPE" :fatte="progresso.tappa"
                  :libera="libera" @gioca="inizia" @libera="inizia(-1)"
                  @indietro="$emit('vai','home')" />

      <!-- vinta · trionfo · sconfitta -->
      <FineTappa v-else :fase="fase" :tappa="tappa" :prossima="prossima" :hud="hud"
                 :premio="premio" :quante="TAPPE.length" :campagna="campagna"
                 :sa="sa"
                 @avanti="prossimaTappa" @mappa="allaMappa" @libera="inizia(-1)"
                 @riprova="inizia()" />
    </div>
  </div>
</template>

<style scoped src="./castello/td.css"></style>
