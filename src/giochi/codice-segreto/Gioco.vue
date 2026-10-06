<script setup>
// Il coordinatore: l'unico file del gioco che sa che esistono le monete.
// Regole in `motore/`, disegni e tappe in `dati/`, animazioni in `scena/`,
// schermate in `viste/`.
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { addCoins, segna, segnaBest } from '../../store/profile.js'
import { progresso, aperta, adesso, stelleDi, completa, scelta, ricorda,
         primatoDi, segnaPrimato, sosta, salvaSosta, buttaSosta } from '../campagne.js'
import { fraseDiFine, primatoInParole } from '../primati.js'

import { SENZA_FINE } from './gioco.js'
import { CAMPAGNA, SCALINI, QUANTE_TAPPE, tappeDelloScalino } from './dati/campagna.js'
import { SCAGLIONI, PREDEFINITO } from './dati/difficolta.js'
import { TEMI, CHIAVI_TEMI } from './dati/temi.js'
import { Regole } from './motore/partita.js'
import { Corsa } from './motore/corsa.js'
import { passiSpiegazione } from './motore/indizi.js'
import { scrivi, leggi, dice } from './motore/sosta.js'
import { Coriandoli } from '../../grafica/coriandoli.js'

import Mappa from './viste/Mappa.vue'
import Libero from './viste/Libero.vue'
import Tavolo from './viste/Tavolo.vue'
import Finale from './viste/Finale.vue'
import Spiegazione from './viste/Spiegazione.vue'
import './stile.css'

defineOptions({ name: 'CodiceSegreto' })
const emit = defineEmits(['vai'])

const CHIAVE = 'codice'
const RESPIRO = 700        // quanto si guarda il tabellone prima del cartello

const vista = ref('mappa')          // mappa | manopole | tavolo
const tappaIdx = ref(-1)            // -1 = gioco libero
const corsa = ref(null)             // la tappa in corso (motore, reso reattivo)
const finale = ref(null)            // il cartello di fine, quando c'è
const spiega = ref(false)
const posata = ref(-1)              // l'ultima buca riempita: solo per il tonfo
const rifiuti = ref(0)              // dita finite su una riga già piena
const serie = ref(0)                // codici indovinati di fila (per l'albo)
// La serie del gioco libero: alimenta il record (`giochi/primati.js`) e
// riparte da zero ogni volta che si entra nel libero, a differenza di `serie`.
const fila = ref(0)
// Difficoltà e tema del libero in corso: le manopole della mappa possono
// essere cambiate dopo, e una partita ripresa porta le sue.
let delLibero = { difficolta: '', tema: '' }

const avanza = progresso(CHIAVE)
const libero = computed(() => tappaIdx.value < 0)
const partita = computed(() => corsa.value?.partita || null)

const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    icona: TEMI[t.tema].icona,
    accento: TEMI[t.tema].accento,
    temaNome: TEMI[t.tema].nome,
    aperta: aperta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

const statoLibero = computed(() => ({
  aperto: aperta(CHIAVE, QUANTE_TAPPE),
  quante: QUANTE_TAPPE,
  fatte: Math.min(avanza.tappa, QUANTE_TAPPE),
  primato: primatoInParole(primatoDi(CHIAVE), SENZA_FINE.misura),
}))

const scDifficolta = ref(scelta(CHIAVE, 'difficolta', PREDEFINITO))
const scTema = ref(scelta(CHIAVE, 'tema', CHIAVI_TEMI[0]))
const temiInElenco = CHIAVI_TEMI.map(k => ({ chiave: k, ...TEMI[k] }))
function scegliDifficolta(k) { scDifficolta.value = ricorda(CHIAVE, 'difficolta', k) }
function scegliTema(k) { scTema.value = ricorda(CHIAVE, 'tema', k) }

const accento = computed(() =>
  partita.value ? partita.value.regole.accento
  : libero.value ? TEMI[scTema.value].accento
  : '#4f6bd0')

const titolo = computed(() =>
  vista.value === 'tavolo' && !libero.value ? CAMPAGNA[tappaIdx.value].nome
  : vista.value === 'tavolo' ? 'gioco libero'
  : 'Codice Segreto')

const suoni = {
  posa: i => suono.nota(520 + i * 90, 520 + i * 90, 0.10, 'triangle', 0.10),
  pieno: () => suono.nota(660, 660, 0.12, 'triangle', 0.11),
  vuoto: () => suono.nota(430, 430, 0.14, 'triangle', 0.10),
  niente: () => suono.nota(200, 140, 0.16, 'sawtooth', 0.08),
}

let attesa = 0
onUnmounted(() => clearTimeout(attesa))

function alTavolo(nuovaCorsa, indice) {
  clearTimeout(attesa)
  tappaIdx.value = indice
  corsa.value = nuovaCorsa
  finale.value = null
  posata.value = -1
  vista.value = 'tavolo'
  primaVolta()
}

const avviaTappa = i => alTavolo(Corsa.perTappa(CAMPAGNA[i]), i)

const avviaLibero = () => {
  fila.value = 0
  delLibero = { difficolta: scDifficolta.value, tema: scTema.value }
  alTavolo(new Corsa(Regole.libere(delLibero.difficolta, delLibero.tema), Infinity), -1)
}

// La serie si chiude (e si scrive) al codice sbagliato o col «lascio
// perdere» della carta: uscire non la chiude più, resta nella sosta. Se si
// scrivesse a ogni vittoria le «ultime partite» del quaderno sarebbero i
// gradini di una stessa serie invece di partite diverse.
let esitoFila = null       // il primato scritto all'ultimo codice sbagliato, per il cartello
function chiudiLaFila(quanti = fila.value) {
  if (!quanti) return null
  const esito = segnaPrimato(CHIAVE, quanti)
  fila.value = 0
  return esito
}

function primatoDelLibero(vinta) {
  if (!vinta) {
    const esito = esitoFila
    return esito ? { record: esito.record, frase: fraseDiFine(esito, SENZA_FINE.misura) } : null
  }
  const prima = primatoDi(CHIAVE).best
  const record = fila.value > prima
  return {
    record,
    frase: record && prima ? `${fila.value} di fila · nuovo record (era ${prima})`
         : record ? `${fila.value} di fila · il tuo primo record`
         : `${fila.value} di fila · il record è ${prima}`,
  }
}

function posa(simbolo) {
  const buca = partita.value.posa(simbolo)
  if (buca === false) { rifiuti.value++; suono.no(); return }
  posata.value = buca
  suoni.posa(buca)
  salva()
}

function togli(i) {
  if (partita.value.togli(i)) {
    posata.value = -1
    suono.nota(300, 300, 0.09, 'sine', 0.08)
    salva()
  }
}

function conferma() {
  const p = partita.value
  const prova = p.conferma()
  if (!prova) return
  posata.value = -1
  suono.ok()
  if (!p.finita) return

  const tappaFinita = corsa.value.registra()
  esitoFila = null
  if (p.vinta) {
    addCoins(p.monete)
    segna('codici')
    serie.value++
    segnaBest('serieCodici', serie.value)
    if (libero.value) fila.value++
  } else {
    serie.value = 0
    if (libero.value) esitoFila = chiudiLaFila()
  }
  // la tappa si porta a casa subito, non dopo il respiro: chi esce nel
  // frattempo non deve perdere le stelle di un codice già vinto
  if (tappaFinita) {
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: corsa.value.stelle })
    segna('codiciTappe')
  }
  salva({ subito: true })

  attesa = setTimeout(() => mostraFinale(tappaFinita), RESPIRO)
}

function mostraFinale(tappaFinita) {
  const p = partita.value
  const c = corsa.value
  if (tappaFinita) {
    finale.value = { che: 'tappa', vinta: true, codice: p.codice, stelle: c.stelle,
                     monete: c.monete, titolo: CAMPAGNA[tappaIdx.value].nome, rimaste: 0 }
    suono.livello()
    coriandoli()
  } else {
    finale.value = { che: 'partita', vinta: p.vinta, codice: p.codice,
                     stelle: p.stelle, monete: p.monete, rimaste: c.rimaste,
                     titolo: '', primato: libero.value ? primatoDelLibero(p.vinta) : null }
    if (p.vinta) { suono.moneta(); coriandoli() } else suono.fine()
  }
}

function avanti() {
  if (finale.value?.che === 'tappa') return allaMappa()
  finale.value = null
  posata.value = -1        // il tonfo appartiene alla riga di prima
  festa?.ferma()
  corsa.value.avanti()
}

function allaMappa() {
  clearTimeout(attesa)
  festa?.ferma()
  salva({ subito: true })  // uscire non butta via niente: si scrive dov'era
  finale.value = null
  corsa.value = null
  vista.value = 'mappa'
  ripresa.value = laRipresa()
}

/* ── la partita lasciata a metà ──
   Uscire non butta via niente (motore/sosta.js, docs/codice-segreto/sosta.md):
   i codici vinti della tappa, il codice in corso con le righe già giocate
   e la serie del libero. La mappa la offre in cima. */
const ripresa = ref(laRipresa())
const chiede = ref(null)   // { nome, i }: la partita nuova che butterebbe quella a metà

function laRipresa() {
  const d = dice(sosta(CHIAVE))
  if (!d) return null
  const righe = !d.righe ? '' : d.righe === 1 ? ' · 1 riga giocata' : ` · ${d.righe} righe giocate`
  const dove = d.libero ? `${d.fila} di fila` : `codice ${d.codice} di ${d.di}`
  return { emoji: d.libero ? '🎲' : TEMI[d.tema].icona, nome: d.nome,
           dettaglio: `🔑 ${dove}${righe}` }
}

// Scrive dov'era la partita. A partita finita (o non ancora cominciata)
// `scrivi` torna null e la sosta si toglie.
function salva({ subito = false } = {}) {
  if (!corsa.value || vista.value !== 'tavolo') return
  const chiave = libero.value ? '' : CAMPAGNA[tappaIdx.value].chiave
  salvaSosta(CHIAVE, scrivi(corsa.value, { chiave, ...delLibero, fila: fila.value,
                                           serie: serie.value }), { subito })
}

// «Lascio perdere»: la serie del libero si scrive adesso, come primato
function scorda() {
  const dato = sosta(CHIAVE)
  if (dato && !dato.chiave && Number.isInteger(dato.fila)) chiudiLaFila(dato.fila)
  buttaSosta(CHIAVE)
  ripresa.value = null
  chiede.value = null
}

// una tappa nuova con una sosta aperta chiede prima: il dito di un bambino
// sulla mappa ci finisce comunque
function vuoleIniziare(i) {
  if (!ripresa.value) return parti(i)
  chiede.value = { nome: i < 0 ? 'il gioco libero' : CAMPAGNA[i].nome, i }
}
function comincia() {
  const { i } = chiede.value
  scorda()
  parti(i)
}
const parti = i => i < 0 ? vista.value = 'manopole' : avviaTappa(i)

// un salvataggio che non torna si butta, e la mappa resta com'è
function riprendiPartita() {
  const r = leggi(sosta(CHIAVE))
  if (!r) return scorda()
  clearTimeout(attesa)
  delLibero = { difficolta: r.difficolta || '', tema: r.tema || '' }
  fila.value = r.fila
  serie.value = r.serie
  esitoFila = null
  tappaIdx.value = r.indice
  corsa.value = r.corsa
  finale.value = null
  posata.value = -1
  vista.value = 'tavolo'     // il gioco non ha orologio: riprende com'era
  ripresa.value = null
  chiede.value = null
}

// il telefono che si mette in tasca: visibilitychange è l'ultimo momento
// in cui si può ancora scrivere
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden')
    salva({ subito: true })
}
onMounted(() => {
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
onBeforeUnmount(() => {   // prima: dopo, il tavolo non c'è più
  salva({ subito: true })
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
})

function indietro() {
  if (vista.value === 'mappa') emit('vai', 'home')
  else allaMappa()
}

const tela = ref(null)
let festa = null
function coriandoli() {
  if (!tela.value) return
  festa = festa || new Coriandoli(tela.value)
  festa.lancia()
}

const esempio = computed(() => {
  const pool = partita.value ? partita.value.regole.pool : TEMI[CAMPAGNA[0].tema].simboli
  const codice = [pool[0], pool[1], pool[2]]
  const tentativo = [pool[0], pool[2], pool[3]]
  return { codice, tentativo, passi: passiSpiegazione(codice, tentativo) }
})

function primaVolta() {
  if (!scelta(CHIAVE, 'spiegata', false)) spiega.value = true
}
function chiudiSpiegazione() {
  spiega.value = false
  ricorda(CHIAVE, 'spiegata', true)
}
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" guida="codice" monete @indietro="indietro">
      <button class="tondo" aria-label="come si gioca" @click="spiega = true">?</button>
    </Barra>

    <div class="cs" :style="{ '--cs-accento': accento }">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" :libero="statoLibero"
             :ripresa="ripresa" :chiede="chiede ? chiede.nome : ''"
             @gioca="vuoleIniziare" @libero="vuoleIniziare(-1)"
             @riprendi="riprendiPartita" @scorda="scorda"
             @comincia="comincia" @annulla="chiede = null" />

      <Libero v-else-if="vista === 'manopole'"
              :scaglioni="SCAGLIONI" :temi="temiInElenco"
              :difficolta="scDifficolta" :tema="scTema"
              @difficolta="scegliDifficolta" @tema="scegliTema" @gioca="avviaLibero" />

      <Tavolo v-else-if="partita" :partita="partita" :posata="posata" :rifiuti="rifiuti"
              @posa="posa" @togli="togli" @conferma="conferma" />

      <canvas ref="tela" class="cs-coriandoli" hidden></canvas>

      <Finale v-if="finale" v-bind="finale" :libero="libero"
              @avanti="avanti" @esci="allaMappa" />

      <Spiegazione v-if="spiega" :codice="esempio.codice" :tentativo="esempio.tentativo"
                   :passi="esempio.passi" :suona="t => suoni[t]?.()"
                   @chiudi="chiudiSpiegazione" />
    </div>
  </div>
</template>
