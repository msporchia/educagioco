<script setup>
// Il campo di battaglia: il motore (regole, non pixel) e la tela (pixel,
// non regole) si toccano solo qui, che fa il travaso in una lista di cose
// in scena e raccoglie il dito. Come il campo si vede — il fondale della
// carta, le figure, i nomi dei mostri per vestito — lo dice la pelle
// (giochi/castello/scena/pelle.js); dove passa la strada lo sa il motore.
import { ref, onMounted, onUnmounted } from 'vue'
import { creaTela } from '../../grafica/tela.js'
import { PELLE } from '../../giochi/castello/scena/pelle.js'
import { creaBattaglia } from '../../motore/battaglia.js'
import { leggi } from '../../motore/castello/sosta.js'
import { scenaDi } from '../../views/castello/scena.js'
import { Trascino } from '../../views/castello/trascino.js'
import { costoNuovaTorre, MONDO, CFG } from '../../data/castello.js'
import SchedaMostro from '../SchedaMostro.vue'

const props = defineProps({
  hud: { type: Object, required: true },      // il tabellone: lo riempie il motore
  vista: { type: Object, required: true },    // quello che il foglio legge
  eventi: { type: Object, default: () => ({}) },
  attivo: { type: Boolean, default: false },  // si sta giocando
  calcolando: { type: Boolean, default: false },
  velocita: { type: Number, default: 1 },
  messaggio: { type: Object, default: () => ({ testo: '', n: 0 }) },
  // cosa sta guardando il foglio aperto (piazzola/torre/raggio): lo sa la
  // schermata, non il campo
  mira: { type: Object, default: null },
})
const emit = defineEmits(['esito', 'potenzia', 'piazzola'])

const tela = ref(null)
let campo = null           // la tela: sa di pixel, non di regole
let motore = null          // il motore: sa di regole, non di pixel
let tappa = null, seme = 1
let regali = null          // i regali in tasca: arrivano da fuori, il campo li passa al motore
let raf = 0, ultimo = 0, chiuso = false

const dito = new Trascino({
  tocca: torre => emit('potenzia', torre),
  apri: piazzola => emit('piazzola', piazzola),
  avvisa: t => props.eventi.avvisa?.(t),
  costo: CFG.spostamento,
  suona: che => props.eventi.suona?.(che),
})

function apparecchia(quale = tappa, s = seme, doni = regali) {
  if (!campo || !quale) return null
  tappa = quale; seme = s; regali = doni
  PELLE.vesti(tappa)
  motore = creaBattaglia({ tappa, misure: campo.misure, stato: props.hud,
                           eventi: props.eventi, regali })
  dito.attacca(motore, campo.misure.S)
  dipingiFondale()
  chiuso = false
  return motore
}

function avvia(quale, s, doni = null) {
  apparecchia(quale, s, doni)
  motore.inizia()
  chiuso = false
  aggiornaVista(true)
  return motore
}

// la partita lasciata a metà, sulla stessa tappa: `false` se non torna più
function riprendi(quale, s, doni, dato) {
  apparecchia(quale, s, doni)
  if (!leggi(dato, motore)) return false
  chiuso = false
  aggiornaVista(true)
  return true
}

// il vestito può non essere pronto: la pelle dà un fondale di ripiego e
// richiama quando lo è (se non si è cambiata tappa nel frattempo)
function dipingiFondale() {
  const quella = tappa
  campo.dipingiFondale(PELLE.fondale(tappa, () => {
    if (campo && tappa === quella) dipingiFondale()
  }))
}

function ridimensiona() {
  if (!campo) return
  const misure = campo.ridimensiona()
  if (!motore) return apparecchia()
  motore.ridimensiona(misure)
  dito.misura(misure.S)
  dipingiFondale()
}

// La lista che costa (il preavviso) si riscrive solo quando cambia davvero:
// un array nuovo 60 volte al secondo farebbe ridisegnare mezzo schermo per niente.
let firmaOnda = -1
// Il nome di un mostro è quello della figura che ha in questo vestito (la
// chiave resta quella del motore); `bestia` cambia solo a ogni ondata, e
// la copia col nome si rifà solo allora.
const nomeDi = x => ({ ...x, nome: PELLE.nome(tappa, x.id) || x.nome })
const conNome = b => (b ? { ...nomeDi(b), ...(b.con ? { con: nomeDi(b.con) } : {}) } : b)
let bestiaDa = null, bestiaVista = null
function aggiornaVista(forza = false) {
  const v = props.vista
  v.inAttesa = motore.inAttesa()
  v.pronti = motore.pronti()
  v.restaAttesa = motore.restaAttesa()
  v.puoiChiamare = motore.puoiChiamare()
  v.premio = motore.premioFretta()
  let gradini = 0
  for (const t of motore.torri) gradini += t.lv - 1
  v.potenziamenti = gradini + motore.regaliPresi
  if (motore.bestia !== bestiaDa) { bestiaDa = motore.bestia; bestiaVista = conNome(bestiaDa) }
  v.bestia = bestiaVista
  v.inCampo = motore.nemici.length
  v.vitaOnda = Math.round(motore.ondate.vitaDi(Math.max(1, props.hud.onda)))
  v.regalo = motore.regaliDaScegliere
  v.regaliPresi = motore.regaliPresi
  if (forza || props.hud.onda !== firmaOnda) {
    firmaOnda = props.hud.onda
    v.prossime = motore.prossime().map(conNome)
  }
}

// Un fotogramma: la velocità moltiplica il tempo del campo (non quello
// delle operazioni) ripetendo il passo invece di allungarlo, così nessun
// proiettile scavalca il bersaglio.
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
    // le piazzole si accendono se si può comprare almeno la torre più economica
    costoNuova: Math.min(...(tappa?.torri || ['add'])
      .map(k => costoNuovaTorre(motore ? motore.torri.length : 0, k))),
    mira: props.mira,
  }), motore ? motore.tempo : 0)
  raf = requestAnimationFrame(ciclo)
}

// Il dito: un dito è del gioco (prende torri, apre piazzole), due dita sono
// di chi guarda (spostano e ingrandiscono l'inquadratura). Devono restare
// separate, o un pan a un dito ruberebbe il trascinamento di una torre.
const puntoDi = ev => {
  const r = tela.value.getBoundingClientRect()
  return campo.versoIlMondo(ev.clientX - r.left, ev.clientY - r.top)
}
const dita = new Map() // i puntatori appoggiati adesso, in pixel di schermo: servono al pinch
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

function rimetti() { campo?.rimetti() } // doppio tocco: la mappa torna tutta in quadro

onMounted(() => {
  campo = creaTela(tela.value, PELLE.pittori, { mondo: MONDO })
  PELLE.prepara()
  ridimensiona()
  window.addEventListener('resize', ridimensiona)
  raf = requestAnimationFrame(ciclo)
})
onUnmounted(() => {
  cancelAnimationFrame(raf); window.removeEventListener('resize', ridimensiona)
  campo = null
})


defineExpose({ apparecchia, avvia, riprendi, ridimensiona, motore: () => motore,
               misure: () => campo?.misure,
               versoLoSchermo: (x, y) => campo?.versoLoSchermo(x, y) })
</script>

<template>
  <div class="campo">
    <canvas ref="tela" @pointerdown="giuIlDito" @pointermove="muoviIlDito"
            @pointerup="suIlDito" @pointercancel="suIlDito" @dblclick="rimetti"></canvas>
    <SchedaMostro v-if="attivo && vista.bestia && !vista.inAttesa" :bestia="vista.bestia"
                  :vita="vista.vitaOnda" :quanti="vista.inCampo" />
    <div v-if="messaggio.testo" :key="messaggio.n" class="annuncio">{{ messaggio.testo }}</div>
  </div>
</template>

<style scoped src="./campo.css"></style>
