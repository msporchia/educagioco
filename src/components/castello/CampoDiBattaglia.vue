<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO DI BATTAGLIA

   Il pezzo di schermo dove si combatte, e il posto dove i due mestieri
   si toccano senza mescolarsi:

     il motore (`motore/castello/`) fa passare il tempo e non sa che
     esiste uno schermo;
     la tela (`grafica/tela.js`) dipinge e non sa che esistono energia,
     ondate e prezzi;
     questo componente fa il travaso — una lista di cose in scena
     (`views/castello/scena.js`) — e raccoglie il dito.

   Non c'è una sola regola di gioco qui dentro. Quello che esce di qui
   sono tre cose: `vista`, che è quello che il banco deve poter leggere
   (chi arriva, cosa si può potenziare, se l'ondata può partire);
   l'esito, quando la partita si chiude; e il tocco su una torre.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { creaTela } from '../../grafica/tela.js'
import { PITTORI } from '../../grafica/castello.js'
/* il fondale lo dipinge il terreno della tappa, non un prato solo: le
   quindici tavolozze stanno in `grafica/terreni/` */
import { campo as disegnaCampo } from '../../grafica/terreni/indice.js'
import { creaBattaglia } from '../../motore/battaglia.js'
import { scenaDi } from '../../views/castello/scena.js'
import { Trascino } from '../../views/castello/trascino.js'
import { costoNuovaTorre, MONDO } from '../../data/castello.js'
import SchedaMostro from '../SchedaMostro.vue'

const props = defineProps({
  hud: { type: Object, required: true },      // il tabellone: lo riempie il motore
  vista: { type: Object, required: true },    // quello che il foglio legge
  eventi: { type: Object, default: () => ({}) },
  attivo: { type: Boolean, default: false },  // si sta giocando
  calcolando: { type: Boolean, default: false },
  velocita: { type: Number, default: 1 },
  messaggio: { type: Object, default: () => ({ testo: '', n: 0 }) },
  /* quello che il foglio aperto sta guardando: una piazzola, una torre,
     e il raggio da mostrare. Entra da fuori perché è la schermata a
     saperlo, non il campo. */
  mira: { type: Object, default: null },
  /* quanti pixel del campo sta coprendo il foglio: la telecamera si
     stringe di conseguenza, e chi calcola continua a vedere tutto */
  coperto: { type: Number, default: 0 },
})
const emit = defineEmits(['esito', 'potenzia', 'piazzola'])

const tela = ref(null)
let campo = null           // la tela: sa di pixel, non di regole
let motore = null          // il motore: sa di regole, non di pixel
let tappa = null, seme = 1
let raf = 0, ultimo = 0, chiuso = false

const dito = new Trascino({
  tocca: torre => emit('potenzia', torre),
  apri: piazzola => emit('piazzola', piazzola),
  suona: che => props.eventi.suona?.(che),
})

/* ── apparecchiare ──
   Un motore nuovo per la tappa che si sta guardando: costruisce il suo
   percorso e le sue piazzole, e da lì esce anche lo sfondo — dipinto una
   volta sola e poi solo ricopiato. */
function apparecchia(quale = tappa, s = seme) {
  if (!campo || !quale) return null
  tappa = quale; seme = s
  motore = creaBattaglia({ tappa, misure: campo.misure, stato: props.hud, eventi: props.eventi })
  dito.attacca(motore, campo.misure.S)
  dipingiFondale()
  chiuso = false
  return motore
}

function avvia(quale, s) {
  apparecchia(quale, s)
  motore.inizia()
  chiuso = false
  aggiornaVista(true)
  return motore
}

const dipingiFondale = () => campo.dipingiFondale(
  disegnaCampo({ via: motore.via, postazioni: motore.postazioni,
                 ambiente: tappa && tappa.ambiente, seme }))

/* Della misura dello schermo il gioco tiene solo quello che gli serve
   per giocare — quanto è largo il campo e quanto vale un'unità, che è
   la scala di raggi e velocità. Pixel e risoluzione se li vede la tela. */
function ridimensiona() {
  if (!campo) return
  const misure = campo.ridimensiona()
  if (!motore) return apparecchia()
  motore.ridimensiona(misure)
  dito.misura(misure.S)
  dipingiFondale()
}

/* ── quello che la schermata legge ──
   Si riscrive a ogni fotogramma, ma la lista che costa — il preavviso —
   solo quando cambia davvero: un array nuovo sessanta volte al secondo
   farebbe ridisegnare mezzo schermo per niente. */
let firmaOnda = -1
function aggiornaVista(forza = false) {
  const v = props.vista
  v.inAttesa = motore.inAttesa()
  v.pronti = motore.pronti()
  v.restaAttesa = motore.restaAttesa()
  v.bestia = motore.bestia
  v.inCampo = motore.nemici.length
  v.vitaOnda = Math.round(motore.ondate.vitaDi(Math.max(1, props.hud.onda)))
  if (forza || props.hud.onda !== firmaOnda) {
    firmaOnda = props.hud.onda
    v.prossime = motore.prossime()
  }
}

/* Un fotogramma: il motore fa passare il tempo, la tela lo mostra. Qui
   dentro non c'è nessuna regola — solo il travaso.

   Chi ha già capito non deve stare a guardare: la velocità moltiplica il
   tempo del campo — non quello delle operazioni, che restano a misura di
   bambino — ripetendo il passo invece di allungarlo, così nessun
   proiettile scavalca il bersaglio. */
function ciclo(ts) {
  const dt = Math.min(0.05, (ts - ultimo) / 1000 || 0); ultimo = ts
  if (motore && props.attivo && !chiuso) {
    for (let i = 0; i < props.velocita && !chiuso; i++) {
      const esito = motore.avanza(dt, props.calcolando)
      if (esito) { chiuso = true; emit('esito', esito) }
    }
    aggiornaVista()
  }
  campo?.disegna(scenaDi(motore, {
    S: campo.misure.S, trascino: dito, tetto: tappa ? tappa.cap : 10,
    energia: props.hud.energia, occupato: props.calcolando,
    costoNuova: costoNuovaTorre(motore ? motore.torri.length : 0),
    mira: props.mira,
  }), motore ? motore.tempo : 0)
  raf = requestAnimationFrame(ciclo)
}

/* ── il dito ──
   Qui resta solo il DOM: dove ha toccato, chi si tiene il puntatore, e
   la telecamera da rovesciare — perché il dito cade sui pixel dello
   schermo e il gioco vive nelle unità del campo. La regola del gesto
   sta in `views/castello/trascino.js`.

   ── una dita, due dita ──
   Un dito è del gioco: prende torri, le sposta, apre le piazzole. Due
   dita sono di chi guarda: spostano l'inquadratura e la ingrandiscono.
   Devono restare separate — un pan a un dito ruberebbe il gesto con cui
   si trascina una torre, che è quello che serve più spesso. */
const puntoDi = ev => {
  const r = tela.value.getBoundingClientRect()
  return campo.versoIlMondo(ev.clientX - r.left, ev.clientY - r.top)
}
/* i puntatori appoggiati adesso, in pixel di schermo: servono al pinch */
const dita = new Map()
let pizzico = null                 // { distanza, cx, cy } fra le due dita

const schermoDi = ev => {
  const r = tela.value.getBoundingClientRect()
  return { x: ev.clientX - r.left, y: ev.clientY - r.top }
}

function giuIlDito(ev) {
  if (!tela.value || !motore) return
  dita.set(ev.pointerId, schermoDi(ev))
  try { tela.value.setPointerCapture(ev.pointerId) } catch (e) { /* pazienza */ }
  if (dita.size === 2) { dito.su(); pizzico = fraLeDita(); return }
  if (!props.attivo || props.calcolando) return
  const { x, y } = puntoDi(ev)
  // il dito seguito anche fuori dal canvas, ma senza farne un dramma: su certi
  // browser la cattura fallisce, e un'eccezione qui mangerebbe tutto il gesto
  dito.giu(x, y)
}

function fraLeDita() {
  const [a, b] = [...dita.values()]
  return { distanza: Math.hypot(a.x - b.x, a.y - b.y),
           cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }
}

function muoviIlDito(ev) {
  if (dita.has(ev.pointerId)) dita.set(ev.pointerId, schermoDi(ev))
  if (dita.size >= 2) {
    if (!pizzico) { pizzico = fraLeDita(); return }
    const ora = fraLeDita()
    if (pizzico.distanza > 8) campo.pizzica(ora.distanza / pizzico.distanza)
    campo.trascina(ora.cx - pizzico.cx, ora.cy - pizzico.cy)
    pizzico = ora
    return
  }
  if (!dito.attivo) return
  const { x, y } = puntoDi(ev)
  dito.muovi(x, y)
}

function suIlDito(ev) {
  dita.delete(ev.pointerId)
  if (dita.size < 2) pizzico = null
  try { tela.value?.releasePointerCapture(ev.pointerId) } catch (e) { /* pazienza */ }
  if (dita.size) return             // un dito è ancora giù: il gesto non è finito
  if (dito.attivo) dito.su()
}

/* doppio tocco: la mappa torna tutta in quadro. È la via d'uscita da
   uno zoom in cui ci si è persi, e su un telefono è l'unica che un
   bambino prova per istinto. */
function rimetti() { campo?.rimetti() }

onMounted(() => {
  /* il mondo non lo decide lo schermo: è dichiarato, ed è lo stesso per
     tutti (`data/castello.js`). Quello che cambia da un telefono a un
     computer è solo quanto lo si vede grande. */
  campo = creaTela(tela.value, PITTORI, { mondo: MONDO })
  ridimensiona()
  window.addEventListener('resize', ridimensiona)
  raf = requestAnimationFrame(ciclo)
})
onUnmounted(() => { cancelAnimationFrame(raf); window.removeEventListener('resize', ridimensiona) })

/* Il foglio è salito o sceso: la telecamera si stringe o si riapre.
   Quello che arriva è **quanto è alto il foglio**, non quanto copre il
   campo: fra i due c'è lo spazio che sta sotto al canvas, e quando è
   abbastanza — su un telefono alto lo è quasi sempre — il foglio non
   copre niente e la telecamera non si muove. */
function quantoCopre(altezzaFoglio) {
  if (!tela.value) return 0
  const sotto = window.innerHeight - tela.value.getBoundingClientRect().bottom
  return Math.max(0, altezzaFoglio - sotto)
}
watch(() => props.coperto, h => campo?.inquadra(quantoCopre(h)))

defineExpose({ apparecchia, avvia, ridimensiona, motore: () => motore,
               misure: () => campo?.misure,
               /* dal mondo ai pixel: serve a chi deve posare un dito dove
                  sta una cosa, e le prove automatiche sono le prime */
               versoLoSchermo: (x, y) => campo?.versoLoSchermo(x, y) })
</script>

<template>
  <div class="campo">
    <canvas ref="tela" @pointerdown="giuIlDito" @pointermove="muoviIlDito"
            @pointerup="suIlDito" @pointercancel="suIlDito" @dblclick="rimetti"></canvas>
    <!-- durante la battaglia: chi si ha davanti. Fra un'ondata e
         l'altra lascia il posto al preavviso di chi arriverà -->
    <SchedaMostro v-if="attivo && vista.bestia && !vista.inAttesa" :bestia="vista.bestia"
                  :vita="vista.vitaOnda" :quanti="vista.inCampo" />
    <div v-if="messaggio.testo" :key="messaggio.n" class="annuncio">{{ messaggio.testo }}</div>
  </div>
</template>

<style scoped src="./campo.css"></style>
