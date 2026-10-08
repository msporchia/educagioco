<script setup>
// Il coordinatore: l'unico file che sa che esistono le monete e il
// profilo. Regole in `motore/`, specie e tappe in `dati/`, schermate in
// `viste/`.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Barra from '../../components/Barra.vue'
import TastoSalta from '../../components/TastoSalta.vue'
import { suono } from '../../audio.js'
import { segna, segnaBest } from '../../store/profile.js'
import { incassa, premioDetto } from '../../store/varieta.js'   // pagano e dicono se il salvadanaio è stanco
import { aperta, adesso, stelleDi, completa, sosta, salvaSosta, buttaSosta } from '../campagne.js'

import { CAMPAGNA, SCALINI, QUANTE_TAPPE, tappeDelloScalino } from './dati/campagna.js'
import { MONDI, facciaDi } from './dati/mondi.js'
import { Corsa } from './motore/corsa.js'
import { scrivi, leggi, dice } from './motore/sosta.js'

import Mappa from './viste/Mappa.vue'
import Prato from './viste/Prato.vue'
import Finale from './viste/Finale.vue'
import './stile.css'

defineOptions({ name: 'ContaGliAnimali' })
const emit = defineEmits(['vai'])

const CHIAVE = 'conta'

const vista = ref('mappa')          // mappa | gioco
const tappaIdx = ref(-1)
const corsa = ref(null)             // la tappa in corso (motore, reso reattivo)
const finale = ref(null)
const erroreSegnale = ref(0)        // sale a ogni risposta sbagliata: lo guarda Prato
const monete = ref(0)               // le monete raccolte in questa tappa
let chieste = 0                     // quelle che la tappa prometteva: col salvadanaio stanco sono di più
const premioDellaTappa = () => premioDetto(CHIAVE, chieste, monete.value)
const serie = ref(0)                // risposte giuste di fila

const tappaCorrente = computed(() => tappaIdx.value >= 0 ? CAMPAGNA[tappaIdx.value] : null)

const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    icona: facciaDi(t.mondo),
    accento: MONDI[t.mondo].accento,
    mondoNome: MONDI[t.mondo].nome,
    aperta: aperta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

const accento = computed(() => tappaCorrente.value ? MONDI[tappaCorrente.value.mondo].accento : '#65a30d')
const titolo = computed(() => vista.value === 'gioco' ? tappaCorrente.value.nome : 'Conta gli animali')

// la tappa lasciata a metà: uscire non butta via niente, si scrive dove
// si era (motore/sosta.js) e la mappa la offre in cima
const ripresa = ref(laRipresa())
const chiede = ref(null)            // { nome, i }: la tappa nuova che butterebbe quella a metà

function laRipresa() {
  const dato = sosta(CHIAVE)
  const d = dice(dato)
  if (dato && !d) buttaSosta(CHIAVE)   // un salvataggio che non torna si butta
  return d && { emoji: facciaDi(d.mondo), nome: d.nome, dettaglio: `🐾 domanda ${d.domanda} di ${d.di}` }
}

// `scrivi` torna null a tappa finita: la sosta si toglie
function salva({ subito = false } = {}) {
  if (!corsa.value) return
  const dato = scrivi(corsa.value, { monete: { chiesto: chieste, dato: monete.value }, serie: serie.value })
  salvaSosta(CHIAVE, dato, { subito })
}

function scorda() {
  if (sosta(CHIAVE)) buttaSosta(CHIAVE)
  ripresa.value = null
  chiede.value = null
}

function vuoleIniziare(i) {
  if (!ripresa.value) return avviaTappa(i)
  chiede.value = { nome: CAMPAGNA[i].nome, i }
}

// senza orologio non c'è pausa: la tappa riprende com'era
function riprendiPartita() {
  const letto = leggi(sosta(CHIAVE))
  if (!letto) return scorda()          // la carta sparisce, la mappa resta
  tappaIdx.value = letto.indice
  corsa.value = letto.corsa
  finale.value = null
  erroreSegnale.value = 0
  monete.value = letto.monete.dato
  chieste = letto.monete.chiesto
  serie.value = letto.serie
  ripresa.value = null
  chiede.value = null
  vista.value = 'gioco'
}

function avviaTappa(i) {
  scorda()                             // cominciarne una nuova butta quella a metà
  tappaIdx.value = i
  corsa.value = Corsa.perTappa(CAMPAGNA[i])
  finale.value = null
  erroreSegnale.value = 0
  monete.value = 0
  chieste = 0
  vista.value = 'gioco'
}

function rispondi(valore, { saltata = false } = {}) {
  const giusta = corsa.value.rispondi(valore)
  if (giusta) {
    // il tasto «salta» dei grandi (docs/core/comandi.md): la tappa avanza, ma non paga né conta
    if (!saltata) {
      const pagato = incassa(tappaCorrente.value.premio)
      monete.value += pagato.dato
      chieste += pagato.chiesto
      segna('contate')
      serie.value++
      segnaBest('serieConta', serie.value)
    }
    suono.ok()
    if (corsa.value.finita) mostraFinale()
  } else {
    serie.value = 0
    erroreSegnale.value++     // Prato si accorge da sé, e conta insieme
  }
  salva()
}

function mostraFinale() {
  completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: corsa.value.stelle })
  segna('contaTappe')
  finale.value = { titolo: tappaCorrente.value.nome, stelle: corsa.value.stelle, monete: monete.value,
                   notaMonete: premioDellaTappa() }
  suono.livello()
}

function allaMappa() {
  finale.value = null
  corsa.value = null
  tappaIdx.value = -1
  vista.value = 'mappa'
}

function indietro() {
  if (vista.value === 'mappa') return emit('vai', 'home')
  salva({ subito: true })
  ripresa.value = laRipresa()
  allaMappa()
}

// il telefono che si mette in tasca: l'ultimo momento utile per scrivere
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden')
    salva({ subito: true })
}

onMounted(() => {
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
onBeforeUnmount(() => {
  salva({ subito: true })
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
})
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" guida="conta" monete @indietro="indietro" />

    <div class="ct" :style="{ '--ct-accento': accento }">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" :ripresa="ripresa"
             :chiede="chiede ? chiede.nome : ''"
             @gioca="vuoleIniziare" @riprendi="riprendiPartita" @scorda="scorda"
             @comincia="avviaTappa(chiede.i)" @annulla="chiede = null" />

      <Prato v-else-if="corsa" :domanda="corsa.domanda" :errore-segnale="erroreSegnale"
             @rispondi="rispondi" />
      <TastoSalta v-if="vista === 'gioco' && corsa && !finale"
                  @salta="rispondi(corsa.domanda.rispostaGiusta, { saltata: true })" />

      <Finale v-if="finale" v-bind="finale" @avanti="allaMappa" />
    </div>
  </div>
</template>
