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
import { ref, onMounted, onUnmounted } from 'vue'
import { creaTela } from '../../grafica/tela.js'
import { PITTORI } from '../../grafica/castello.js'
/* il fondale lo dipinge il terreno della tappa, non un prato solo: le
   quindici tavolozze stanno in `grafica/terreni/` */
import { campo as disegnaCampo } from '../../grafica/terreni/indice.js'
import { creaBattaglia } from '../../motore/battaglia.js'
import { scenaDi } from '../../views/castello/scena.js'
import { Trascino } from '../../views/castello/trascino.js'
import { costoSalita } from '../../data/castello.js'
import SchedaMostro from '../SchedaMostro.vue'

const props = defineProps({
  hud: { type: Object, required: true },      // il tabellone: lo riempie il motore
  vista: { type: Object, required: true },    // quello che il banco legge
  eventi: { type: Object, default: () => ({}) },
  attivo: { type: Boolean, default: false },  // si sta giocando
  calcolando: { type: Boolean, default: false },
  velocita: { type: Number, default: 1 },
  messaggio: { type: Object, default: () => ({ testo: '', n: 0 }) },
})
const emit = defineEmits(['esito', 'potenzia'])

const tela = ref(null)
let campo = null           // la tela: sa di pixel, non di regole
let motore = null          // il motore: sa di regole, non di pixel
let tappa = null, seme = 1
let raf = 0, ultimo = 0, chiuso = false

const dito = new Trascino({
  tocca: torre => emit('potenzia', torre),
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

/* ── quello che il banco legge ──
   Si riscrive a ogni fotogramma, ma le due liste che costano (le torri
   in campo e il preavviso) solo quando cambiano davvero: un array nuovo
   sessanta volte al secondo farebbe ridisegnare mezzo schermo per niente. */
let firmaTorri = '', firmaOnda = -1
function aggiornaVista(forza = false) {
  const v = props.vista
  v.inAttesa = motore.inAttesa()
  v.pronti = motore.pronti()
  v.restaAttesa = motore.restaAttesa()
  v.bestia = motore.bestia
  v.inCampo = motore.nemici.length
  v.vitaOnda = Math.round(motore.ondate.vitaDi(Math.max(1, props.hud.onda)))
  v.daPotenziare = motore.torri.some(t => t.lv < tappa.cap)

  const firma = motore.torri.map(t => t.tipo + t.lv).join('|') + '#' + props.hud.energia
  if (forza || firma !== firmaTorri) {
    firmaTorri = firma
    v.torri = motore.torri.map((t, i) => ({
      i, tipo: t.tipo, lv: t.lv, costo: costoSalita(t.lv),
      massimo: t.lv >= tappa.cap, posso: props.hud.energia >= costoSalita(t.lv),
    }))
  }
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
    S: campo.misure.S, trascino: dito.attivo, tetto: tappa ? tappa.cap : 10,
    energia: props.hud.energia, occupato: props.calcolando,
  }), motore ? motore.tempo : 0)
  raf = requestAnimationFrame(ciclo)
}

/* ── il dito ──
   Qui resta solo il DOM: dove ha toccato e chi si tiene il puntatore.
   La regola del gesto sta in `views/castello/trascino.js`. */
const puntoDi = ev => {
  const r = tela.value.getBoundingClientRect()
  return { x: ev.clientX - r.left, y: ev.clientY - r.top }
}

function giuIlDito(ev) {
  if (!props.attivo || props.calcolando || !tela.value || !motore) return
  const { x, y } = puntoDi(ev)
  if (!dito.giu(x, y)) return
  // il dito seguito anche fuori dal canvas, ma senza farne un dramma: su certi
  // browser la cattura fallisce, e un'eccezione qui mangerebbe tutto il gesto
  try { tela.value.setPointerCapture(ev.pointerId) } catch (e) { /* pazienza */ }
}

function muoviIlDito(ev) {
  if (!dito.attivo) return
  const { x, y } = puntoDi(ev)
  dito.muovi(x, y)
}

function suIlDito(ev) {
  if (!dito.attivo) return
  try { tela.value?.releasePointerCapture(ev.pointerId) } catch (e) { /* pazienza */ }
  dito.su()
}

onMounted(() => {
  campo = creaTela(tela.value, PITTORI)
  ridimensiona()
  window.addEventListener('resize', ridimensiona)
  raf = requestAnimationFrame(ciclo)
})
onUnmounted(() => { cancelAnimationFrame(raf); window.removeEventListener('resize', ridimensiona) })

defineExpose({ apparecchia, avvia, ridimensiona, motore: () => motore,
               misure: () => campo?.misure })
</script>

<template>
  <div class="campo">
    <canvas ref="tela" @pointerdown="giuIlDito" @pointermove="muoviIlDito"
            @pointerup="suIlDito" @pointercancel="suIlDito"></canvas>
    <SchedaMostro v-if="attivo && vista.bestia" :bestia="vista.bestia"
                  :vita="vista.vitaOnda" :quanti="vista.inCampo" />
    <div v-if="messaggio.testo" :key="messaggio.n" class="annuncio">{{ messaggio.testo }}</div>
  </div>
</template>

<style scoped src="./campo.css"></style>
