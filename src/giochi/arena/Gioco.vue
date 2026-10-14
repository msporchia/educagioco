<script setup>
// Il coordinatore: l'unico file che sa che esistono le monete vere e
// l'avanzamento. Le regole stanno in `motore/`, i numeri in `dati/`, il
// disegno in `scena/`, le schermate in `viste/`. Una scelta (costruire,
// potenziare, riparare…) si paga con monete di battaglia E con un calcolo:
// il calcolo lo chiede `domande.js`, il campo intanto rallenta (non si ferma:
// la pressione resta). Vedi docs/arena/regole.md.
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { segna, state, etaDelBambino } from '../../store/profile.js'
import { borsa } from '../../store/varieta.js'   // paga e dice se il salvadanaio è stanco
import { PAGA } from '../../data/paghe.js'
import { progresso, aperta, adesso, stelleDi, completa, sosta, salvaSosta, buttaSosta, ritocca } from '../campagne.js'
import { usaPausa } from '../pausa.js'
import VeloPausa from '../VeloPausa.vue'
import Domanda from '../../quiz/Domanda.vue'
import { Giostra } from './scena/giostra.js'

import { CAMPAGNA, SCALINI, QUANTE_TAPPE, tappeDelloScalino, scalinoDi, operazioniDi, operazionePer, stellePer, sfidaDi } from './dati/campagna.js'
import { TRUPPE, EDIFICI, EDIFICIO_DI, AZIONI, LIV_MAX, MINIERA_MAX, BOMBA, CALCOLANDO } from './dati/regole.js'
import { Partita } from './motore/partita.js'
import { scrivi, leggi, dice } from './motore/sosta.js'
import { Campo } from './scena/campo.js'
import { dettaglioTruppa, dettaglioAzione, ruoloDi } from './motore/dettagli.js'
import { domandaDi } from './domande.js'
import { basi, gradoDi, dopoLaRisposta } from './bravura.js'

import Mappa from './viste/Mappa.vue'
import CampoVista from './viste/Campo.vue'
import Finale from './viste/Finale.vue'
import Dettagli from './viste/Dettagli.vue'
import Scelta from './viste/Scelta.vue'
import './stile.css'

defineOptions({ name: 'CastleBattle' })
const emit = defineEmits(['vai'])

const CHIAVE = 'arena'
const RESPIRO = 900           // quanto si guarda il campo dopo l'ultima mossa, prima del cartello

let borsellino = borsa(CHIAVE)   // le monete vere di questa partita, un calcolo giusto alla volta

const vista = ref('mappa')            // mappa | campo
const tappaIdx = ref(0)
const partita = shallowRef(null)      // il motore: NON reattivo dentro
const cruscotto = ref(vuoto())
const pannello = ref({ caserme: [], azioni: [] })
const domanda = ref(null)             // la domanda che paga la scelta
const finale = ref(null)
const dettaglio = ref(null)           // la schermata dei dettagli: il campo sta fermo finché è aperta
const scelta = ref(null)              // quale truppa per un edificio da costruire: anche qui il campo sta fermo
const avviso = ref('')                // la riga che dice cosa è successo
const toccato = ref(false)

let voluta = null                     // la scelta che si sta pagando
let campo = null
let attesa = 0
let orologio = 0
let orologioAvviso = 0
let daSalvare = 0
let ora = 0
const giostra = new Giostra(passo)

const { inPausa, fermo, metti, togli, aiuto } = usaPausa({ anche: () => !!finale.value || !!dettaglio.value || !!scelta.value })

const avanza = progresso(CHIAVE)
const tappa = computed(() => CAMPAGNA[tappaIdx.value] || CAMPAGNA[0])
const scalino = computed(() => scalinoDi(tappa.value))
const siGioca = computed(() => vista.value === 'campo' && !domanda.value && !finale.value && !dettaglio.value && !scelta.value)

function vuoto() {
  return { resto: 0, monete: 0, alSecondo: 0, castello: 1, miniera: 1 }
}

const dovEravamo = computed(() => {
  const s = Math.max(0, Math.ceil(cruscotto.value.resto))
  return `⏱️ mancano ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} · 🪙 ${cruscotto.value.monete}`
})

/* ── la mappa ── */
const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    operazioni: operazioniDi(t),
    aperta: aperta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

/* ── la partita lasciata a metà ── */
const ripresa = ref(laRipresa())

function laRipresa() {
  const d = dice(sosta(CHIAVE))
  return d && { emoji: '⚔️', nome: d.nome, dettaglio: `mancano ${d.restano} · 🪙 ${d.monete}` }
}

function salva({ subito = false } = {}) {
  const p = partita.value
  if (!p) return
  daSalvare = 0
  salvaSosta(CHIAVE, scrivi(p, tappaIdx.value), { subito })
}

function scorda() {
  buttaSosta(CHIAVE)
  ripresa.value = null
}

function riprendiPartita() {
  const letto = leggi(sosta(CHIAVE))
  if (!letto) return scorda()          // la carta sparisce, la mappa resta
  clearTimeout(attesa); attesa = 0
  tappaIdx.value = letto.indice
  partita.value = letto.partita
  azzera()
  toccato.value = true
  metti({ auto: true })  // il campo ripreso nasce fermo: non l'ha chiesto nessuno
  vista.value = 'campo'
  ripresa.value = null
}

function azzera() {
  domanda.value = null
  finale.value = null
  dettaglio.value = null
  scelta.value = null
  avviso.value = ''
  voluta = null
  pagata = false
  contata = false
  borsellino = borsa(CHIAVE)
  aggiornaCruscotto()
}

/* ── i suoni: il motore non suona, dice cosa è successo. L'audio non porta
   informazione: ogni cosa che si sente si vede anche. ── */
let ultimoColpo = 0
function suona(eventi) {
  const visti = new Set()
  for (const e of eventi) {
    if (e.tipo === 'colpo') {
      const t = performance.now()
      if (t - ultimoColpo < 120) continue
      ultimoColpo = t
      suono.nota(e.lato === 'io' ? 720 : 520, 240, 0.05, 'triangle', 0.035)
      continue
    }
    if (visti.has(e.tipo)) continue
    visti.add(e.tipo)
    if (e.tipo === 'costruita' || e.tipo === 'potenziata' || e.tipo === 'castello' || e.tipo === 'miniera') suono.compra()
    else if (e.tipo === 'crollo') suono.rumore(0.4, 0.09, 400, 80)
    else if (e.tipo === 'bomba') { suono.rumore(0.6, 0.14, 300, 60); suono.nota(160, 40, 0.4, 'sawtooth', 0.1) }
    else if (e.tipo === 'cura') suono.vita()
  }
}

/* ── il battito ── */
function passo(dt) {
  const p = partita.value
  if (!p) return
  ora += dt
  const scala = fermo.value || p.fine ? 0 : domanda.value ? CALCOLANDO : 1
  if (scala) {
    p.avanza(dt * scala)
    daSalvare += dt
    if (daSalvare > 5) salva()
  }
  const eventi = p.prendiEventi()
  campo?.eventi(eventi, ora)
  if (eventi.length) suona(eventi)
  if (p.fine && !finale.value && !attesa) attesa = setTimeout(chiudiPartita, RESPIRO)
  orologio += dt
  if (orologio > 0.2) { orologio = 0; aggiornaCruscotto() }
  campo?.disegna(p, ora)
}

function aggiornaCruscotto() {
  const p = partita.value
  if (!p) return
  cruscotto.value = {
    resto: p.resto, monete: Math.floor(p.lati.io.monete), alSecondo: p.alSecondo('io'),
    castello: p.castello('io').liv, miniera: p.lati.io.miniera,
  }
  pannello.value = costruisciPannello(p)
}

/* le carte delle caserme: una per edificio. Costruito dice la sua truppa e si potenzia; da
   costruire apre la scelta fra le due truppe. */
function edificiDellaTappa() {
  return Object.keys(EDIFICI).filter(ed => EDIFICI[ed].varianti.some(id => tappa.value.truppe.includes(id)))
}
function costruisciPannello(p) {
  const caserme = edificiDellaTappa().map(ed => {
    const c = p.caserme.find(x => x.lato === 'io' && x.ed === ed)
    const ammesse = EDIFICI[ed].varianti.filter(id => tappa.value.truppe.includes(id))
    if (c) {
      const prezzo = p.prezzo('io', 'potenzia', c.id)
      const riposo = Math.max(0, c.riposo)
      return { ed, id: c.id, nome: TRUPPE[c.id].nome, presente: true, liv: c.liv, prezzo, varianti: ammesse,
               puoi: prezzo !== null && p.lati.io.monete >= prezzo && riposo <= 0,
               riposo }
    }
    const prezzi = ammesse.map(id => p.prezzo('io', 'costruisci', id)).filter(x => x !== null)
    const prezzo = prezzi.length ? Math.min(...prezzi) : null
    return { ed, id: null, nome: EDIFICI[ed].nome, presente: false, liv: p.lati.io.livelli[ed] || 0, prezzo, varianti: ammesse,
             puoi: prezzo !== null && p.lati.io.monete >= prezzo, riposo: 0 }
  })
  const azioni = ['miniera', 'ripara', 'castello', 'bomba'].map(a => {
    const prezzo = p.prezzo('io', a)
    let stato = ''
    if (a === 'miniera') stato = p.lati.io.miniera >= MINIERA_MAX ? 'MAX' : `Lv ${p.lati.io.miniera}`
    if (a === 'ripara') stato = `${p.riparabili('io').length} da curare`
    if (a === 'castello') stato = p.castello('io').liv >= LIV_MAX ? 'MAX' : `Lv ${p.castello('io').liv}`
    if (a === 'bomba') stato = p.lati.io.bombe ? `${p.lati.io.bombe} pronta${p.lati.io.bombe > 1 ? 'e' : ''}` : 'in arrivo'
    return { azione: a, nome: AZIONI[a].nome, op: AZIONI[a].op, prezzo, stato, livello: a === 'castello' ? p.castello('io').liv : 0, puoi: prezzo !== null && p.lati.io.monete >= prezzo,
             attesa: a === 'bomba' && p.lati.io.bombe < BOMBA.max ? Math.ceil(p.lati.io.bombaT) : 0 }
  })
  return { caserme, azioni }
}

/* ── giocare ── */
function avvia(indice) {
  clearTimeout(attesa); attesa = 0
  togli()   // una partita che comincia non comincia in pausa
  scorda()  // una partita nuova butta quella lasciata a metà (già chiesto dalla mappa)
  tappaIdx.value = indice
  partita.value = new Partita({ sfida: sfidaDi(CAMPAGNA[indice]), registra: true })
  azzera()
  toccato.value = false
  vista.value = 'campo'
}

function prendiTela(tela) {
  if (!tela) return
  campo = new Campo(tela, { vestito: scalino.value.vestito })
  campo.prepara().then(() => { campo.adatta() })
  giostra.avvia()
}

function ridimensiona() { campo?.adatta() }

/* i dettagli: com'è adesso, com'è al livello dopo, quanto costa. Il campo sta fermo. */
function apriDettagli({ id, azione }) {
  const p = partita.value
  if (!p || domanda.value || finale.value) return
  let d, scheda
  if (id) {
    const k = TRUPPE[id]
    const c = p.caserme.find(x => x.lato === 'io' && x.id === id)
    const liv = c ? c.liv : p.lati.io.livelli[EDIFICIO_DI[id]] || 0
    const det = dettaglioTruppa(id, liv, { costruire: !c })
    const az = c ? 'potenzia' : 'costruisci'
    d = { azione: az, id }
    scheda = { truppa: id, titolo: k.nome, nota: k.nota, ruolo: ruoloDi(id), livello: liv, sottotitolo: EDIFICI[EDIFICIO_DI[id]].nome,
               ...det,
               verbo: c ? '⬆️ Potenzia' : '🛖 Costruisci',
               puoi: p.puoFare('io', az, id) && !p.inRiposo('io', id),
               motivo: p.inRiposo('io', id) ? 'la caserma riposa ancora un po\'' : 'servono più monete',
               fine: 'È già al livello massimo.' }
  } else {
    const det = dettaglioAzione(azione, { miniera: p.lati.io.miniera, castello: p.castello('io').liv })
    d = { azione }
    scheda = { titolo: AZIONI[azione].nome, nota: AZIONI[azione].nota, ruolo: [], sottotitolo: azione === 'bomba' ? 'in regalo' : '', icona: { miniera: '⛏️', ripara: '🔧', bomba: '💣' }[azione],
               castello: azione === 'castello', ...det,
               verbo: azione === 'ripara' ? '🔧 Ripara' : azione === 'bomba' ? '💥 Lancia' : '⬆️ Potenzia',
               puoi: p.puoFare('io', azione),
               motivo: azione === 'bomba' ? (p.lati.io.bombe ? 'non ci sono truppe nemiche da colpire' : `la prossima arriva fra ${Math.ceil(p.lati.io.bombaT)} secondi`)
                     : azione === 'ripara' && !p.riparabili('io').length ? 'non c\'è niente da riparare' : 'servono più monete',
               fine: 'È già al livello massimo.' }
  }
  dettaglio.value = { ...scheda, scelta: d }
  toccato.value = true
}

function procediDaiDettagli() {
  const d = dettaglio.value
  dettaglio.value = null
  scelta.value = null
  if (d) scegli(d.scelta)
}

/* un edificio da costruire: le sue due truppe una accanto all'altra, coi prezzi */
function apriScelta({ ed }) {
  const p = partita.value
  if (!p || domanda.value || finale.value || p.fine) return
  const livello = p.lati.io.livelli[ed] || 0
  scelta.value = {
    ed, nome: EDIFICI[ed].nome, livello,
    varianti: EDIFICI[ed].varianti.map(id => {
      const ammessa = tappa.value.truppe.includes(id)
      const prezzo = TRUPPE[id].costo
      return { id, nome: TRUPPE[id].nome, nota: TRUPPE[id].nota, ruolo: ruoloDi(id).slice(0, 2), prezzo, ammessa,
               puoi: ammessa && p.puoFare('io', 'costruisci', id) }
    }),
  }
  toccato.value = true
}

function costruisciDallaScelta(id) {
  scelta.value = null
  scegli({ azione: 'costruisci', id })
}

/* una scelta: il calcolo la apre, la risposta la fa */
function scegli({ azione, id }) {
  const p = partita.value
  if (!p || fermo.value || domanda.value || p.fine) return
  if (!p.puoFare('io', azione, id) || (id && p.inRiposo('io', id))) return
  const cal = p.calcoloDi('io', azione, id)
  const op = operazionePer(cal.op, operazioniDi(tappa.value))
  voluta = { azione, id, op }
  toccato.value = true
  domanda.value = domandaDi(op, gradoDi(laBase(op), cal.peso))
  suono.ok()
}

/* la base del bambino per un'operazione: la sua, o da dove parte la prima volta (bravura.js) */
const laBase = op => basi(progresso(CHIAVE).bravura, { eta: etaDelBambino(), items: state.profile.items })[op]

function risposto({ giusto, saltata, tempo }) {
  const p = partita.value
  const v = voluta
  domanda.value = null
  voluta = null
  togli()
  if (!p || !v) return
  if (!saltata) {
    const nuova = dopoLaRisposta(laBase(v.op), { giusto, tempo })
    ritocca(CHIAVE, c => { c.bravura = { ...(c.bravura || {}), [v.op]: nuova } })
  }
  if (giusto) {
    if (p.fai('io', v.azione, v.id)) {
      // il tasto «salta» dei grandi dà la scelta ma non paga e non conta (docs/core/comandi.md)
      if (!saltata) { borsellino.paga(PAGA.mossa); segna('arenaCalcoli') }
      if (v.azione === 'costruisci' || v.azione === 'potenzia') segna('arenaCaserme')
      dici(frase(v))
    } else dici('le monete non bastavano più')
  } else {
    if (v.azione === 'potenzia') p.sbagliata('io', v.id)
    dici(v.azione === 'potenzia' ? 'conto sbagliato: la caserma riposa un po\'' : 'conto sbagliato: ci riprovi quando vuoi')
  }
  aggiornaCruscotto()
  salva()
}

function frase(v) {
  const nome = v.id ? TRUPPE[v.id].nome : ''
  return { costruisci: `🛖 ${v.id ? EDIFICI[EDIFICIO_DI[v.id]].nome : ''}: ${nome}`, potenzia: `⬆️ ${nome} sale di livello`, miniera: '⛏️ le monete arrivano più in fretta',
           ripara: '🔧 riparato', castello: '🏰 il castello è più forte', bomba: '💥 la bomba ha spazzato le truppe nemiche' }[v.azione] || ''
}

function dici(testo) {
  avviso.value = testo
  clearTimeout(orologioAvviso)
  orologioAvviso = setTimeout(() => { avviso.value = '' }, 2600)
}

/* ── finire ── */
let pagata = false
let contata = false

function chiudiPartita() {
  attesa = 0
  const p = partita.value
  if (!p) return
  giostra.ferma()
  scorda()          // finita o vinta, non c'è più niente da riprendere
  const vinto = p.fine === 'vinto'
  const stelle = stellePer({ vinto, vitaBase: p.vitaBase('io') })
  if (vinto && !pagata) {
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle })
    if (stelle === 3) segna('arenaSenzaGraffi')
    pagata = true
  }
  if (!contata) { segna('arenaPartite'); contata = true }
  suono[vinto ? 'livello' : 'fine']()
  finale.value = {
    vinta: vinto, pari: p.fine === 'pari', titolo: tappa.value.nome, stelle,
    monete: borsellino.dato, notaMonete: borsellino.nota(), tempo: p.t,
    ultima: vinto && tappaIdx.value === QUANTE_TAPPE - 1,
  }
}

function ancora() {
  const f = finale.value
  if (!f) return
  if (f.vinta && tappaIdx.value + 1 < QUANTE_TAPPE && aperta(CHIAVE, tappaIdx.value + 1)) return avvia(tappaIdx.value + 1)
  if (f.vinta) return allaMappa()
  avvia(tappaIdx.value)
}

function allaMappa() {
  clearTimeout(attesa); attesa = 0
  togli()
  giostra.ferma()
  partita.value = null
  campo = null
  finale.value = null
  domanda.value = null
  vista.value = 'mappa'
}

// uscire a metà non chiude la partita: si scrive dove si era e la mappa la offre in cima
function indietro() {
  if (vista.value === 'mappa') return emit('vai', 'home')
  const p = partita.value
  if (p && !p.fine) {
    salva({ subito: true })
    ripresa.value = laRipresa()
  }
  allaMappa()
}

// il telefono che si mette in tasca: visibilitychange è l'ultimo momento in cui si può scrivere
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true })
}

// il gancio per guardarsi: la partita e qualche leva, per scattare e provare senza giocare
// mezz'ora. Sparisce dal build (import.meta.env.DEV).
function gancioDiProva() {
  if (!import.meta.env.DEV) return
  window.__arena = {
    get partita() { return partita.value },
    get fermo() { return fermo.value },
    get domanda() { return domanda.value },
    get dettaglio() { return dettaglio.value },
    metti, togli, scegli,
  }
}

onMounted(() => {
  gancioDiProva()
  addEventListener('resize', ridimensiona)
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
onUnmounted(() => {
  if (import.meta.env.DEV) delete window.__arena
  salva({ subito: true })
  removeEventListener('resize', ridimensiona)
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
  clearTimeout(attesa)
  clearTimeout(orologioAvviso)
  giostra.ferma()
})
</script>

<template>
  <div class="schermo">
    <!-- il ⏸ c'è solo dove scorre qualcosa -->
    <Barra :titolo="vista === 'campo' ? tappa.nome : 'Castle Battle'" monete
           :pausa="siGioca" @pausa="metti()" @aiuto="aiuto" @indietro="indietro" />

    <div class="ar">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" :ripresa="ripresa"
             @gioca="avvia" @riprendi="riprendiPartita" @scorda="scorda" />

      <CampoVista v-else :cruscotto="cruscotto" :pannello="pannello" :avviso="avviso"
                  :dritta="!toccato && !finale"
                  @tela="prendiTela" @scegli="scegli" @dettagli="apriDettagli" @edificio="apriScelta" />

      <!-- il calcolo prende tutto lo schermo; il campo intanto rallenta (non si ferma) -->
      <Domanda v-if="domanda" :domanda="domanda.domanda" :pittori="domanda.pittori"
               :titolo="`${domanda.icona} ${domanda.nome}`"
               :origine="domanda" gioco="arena" @risposto="risposto" />

      <Scelta v-if="scelta" :s="scelta" @chiudi="scelta = null" @costruisci="costruisciDallaScelta"
              @dettagli="id => apriDettagli({ id })" />

      <Dettagli v-if="dettaglio" :d="dettaglio" @chiudi="dettaglio = null" @procedi="procediDaiDettagli" />

      <Finale v-if="finale" v-bind="finale" @ancora="ancora" @esci="allaMappa" />

      <VeloPausa v-if="inPausa && siGioca" :dove="dovEravamo" @riprendi="togli" @esci="indietro" />
    </div>
  </div>
</template>
