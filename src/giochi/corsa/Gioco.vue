<script setup>
// Il coordinatore: l'unico file che sa che esistono le monete e
// l'avanzamento. Le regole stanno in `motore/`, i numeri in `dati/`, il
// disegno in `scena/`, le schermate in `viste/`. Non sa che materie
// esistano: chiede una domanda con una difficoltà da 0 a 1 e la mostra.
// Vedi docs/corsa/regole.md.
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { segna, segnaBest } from '../../store/profile.js'
import { borsa } from '../../store/varieta.js'
import { PAGA } from '../../data/paghe.js'
import { progresso, aperta, adesso, stelleDi, completa,
         primatoDi, segnaPrimato } from '../campagne.js'
import { fraseDiFine, primatoInParole } from '../primati.js'
import { SENZA_FINE } from './gioco.js'
import { usaPausa } from '../pausa.js'
import VeloPausa from '../VeloPausa.vue'
import { domandaPerGioco } from '../../quiz/scelta.js'
import Domanda from '../../quiz/Domanda.vue'

import { CAMPAGNA, SCALINI, LIBERA, QUANTE_TAPPE, tappeDelloScalino, secondiCirca }
  from './dati/campagna.js'
import { veste } from './dati/vesti.js'
import { Regole, Partita } from './motore/corsa.js'
import { Pista } from './scena/pista.js'
import { Giostra } from './scena/giostra.js'

import Mappa from './viste/Mappa.vue'
import PistaVista from './viste/Pista.vue'
import Finale from './viste/Finale.vue'
import './stile.css'

defineOptions({ name: 'Corsa' })
const emit = defineEmits(['vai'])

const CHIAVE = 'corsa'
// le monete di questa corsa: un cancello preso giusto e un libro indovinato pagano
// quando succedono, a fine corsa si dice solo quante (docs/corsa/regole.md)
let borsellino = borsa(CHIAVE)
let cancelliPagati = 0
const RESPIRO = 700          // quanto si guarda la pista prima del cartello

// dove siamo
const vista = ref('mappa')          // mappa | pista
const tappaIdx = ref(-1)            // -1 = corsa infinita
const partita = shallowRef(null)    // il motore: NON reattivo dentro
const cruscotto = ref(vuoto())
const domanda = ref(null)           // l'esercizio del cancello d'oro
const finale = ref(null)
const brindisi = ref('')
const toccato = ref(false)

let ultimoModulo = null             // per non fare due domande di fila uguali
let pittore = null
let orologio = 0
let attesa = 0
let orologioBrindisi = 0
const giostra = new Giostra(passo)

// La pausa (giochi/pausa.js): qui si aggiunge la sola condizione di
// casa che sia reattiva — col cartello finale davanti non si corre —
// mentre quello che vive nel motore (p.finita, p.inPausa) si guarda
// dentro il battito: uno shallowRef non avvisa quando cambia un campo dentro.
const { inPausa, fermo, metti, togli, aiuto } = usaPausa({ anche: () => !!finale.value })

const avanza = progresso(CHIAVE)
const libera = computed(() => tappaIdx.value < 0)
const regoleOra = computed(() => libera.value ? LIBERA : CAMPAGNA[tappaIdx.value] || CAMPAGNA[0])
const vestito = computed(() => veste(regoleOra.value.veste))

function vuoto() {
  return { truppa: 0, gruppi: [], piena: false, metri: 0, restano: 0,
           infinita: false, quota: 0, vinti: 0, mostro: null }
}

// la mappa: le tappe arrivano alla vista già decise
const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    icona: veste(t.veste).icona,
    accento: veste(t.veste).accento,
    vesteNome: veste(t.veste).nome,
    secondi: secondiCirca(t),
    aperta: aperta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

// il record arriva già scritto in parole («312 m»): la mappa non deve
// sapere in che unità si misuri questo gioco
const statoLibera = computed(() => ({
  aperta: aperta(CHIAVE, QUANTE_TAPPE),
  quante: QUANTE_TAPPE,
  fatte: Math.min(avanza.tappa, QUANTE_TAPPE),
  primato: primatoInParole(primatoDi(CHIAVE), SENZA_FINE.misura),
}))

const titolo = computed(() =>
  vista.value === 'pista' ? regoleOra.value.nome : 'La corsa dei numeri')

// cosa si stava facendo, sul velo della pausa
const dovEravamo = computed(() => cruscotto.value.infinita
  ? `🏁 ${cruscotto.value.metri} m corsi`
  : `🏁 mancano ${cruscotto.value.restano} m`)

// i suoni: il motore non suona, dice cosa è successo. Non portano
// informazione — col suono spento la corsa resta intera, è già scritta in strada.
let ultimoSparo = 0
const VERSI = {
  cambio: () => suono.nota(420, 460, 0.05, 'square', 0.05),
  meglio: () => suono.compra(),
  peggio: () => suono.no(),
  cassa: () => suono.moneta(),
  cono: () => suono.nota(240, 120, 0.16, 'sawtooth', 0.1),
  libro: () => suono.nota(300, 600, 0.2, 'sine', 0.12),
  sparo: () => {
    const ora = performance.now()
    if (ora - ultimoSparo < 90) return
    ultimoSparo = ora
    suono.sparo()
  },
  caduto: () => suono.boom(),
  abbattuto: () => suono.livello(),
  colpito: () => suono.boss(),
  vittoria: () => suono.livello(),
  fine: () => suono.fine(),
}
const LAMPI = {
  meglio: ['#8ef0a8', 24], abbattuto: ['#9fd0ff', 40],
  caduto: ['#ffd98a', 30],   // il colpo si vede: i mostri abbattuti spariscono subito dalla strada
  cassa: ['#ffd98a', 10], peggio: ['#ff9d9d', 10],
}
function reagisci(eventi) {
  const visti = new Set()
  for (const e of eventi) {
    if (visti.has(e)) continue
    visti.add(e)
    VERSI[e]?.()
    const lampo = LAMPI[e]
    if (lampo && pittore) pittore.scoppio(partita.value?.corsiaX || 0, lampo[0], lampo[1])
  }
}

// il battito: la corsa si ferma quando qualcosa le sta davanti (`fermo`,
// di giochi/pausa.js — la pausa, il telefono posato, un traguardo, il
// foglio del `?`). Quello che resta scritto qui è roba del motore, non
// reattiva, riguardata a ogni fotogramma.
function passo(dt) {
  const p = partita.value
  if (!p) return
  const bloccato = fermo.value || p.finita || p.inPausa
  if (!bloccato) p.avanza(dt)
  if (p.eventi.length) reagisci(p.svuotaEventi())
  if (p.meglio > cancelliPagati) {
    borsellino.paga((p.meglio - cancelliPagati) * PAGA.cancello)
    cancelliPagati = p.meglio
  }

  // il cancello d'oro: la domanda arriva quando il motore si è fermato,
  // e finché è a schermo la corsa non avanza
  if (p.inPausa && !domanda.value) {
    domanda.value = domandaPerGioco({
      difficolta: regoleOra.value.studio, evita: ultimoModulo,
    })
  }
  if (p.finita && !finale.value && !attesa) attesa = setTimeout(chiudiPartita, RESPIRO)

  orologio += dt
  if (orologio > 0.15) { orologio = 0; cruscotto.value = p.cruscotto }
  pittore?.disegna(p.scena(), bloccato ? 0 : dt)
}

// giocare
function avvia(indice) {
  clearTimeout(attesa); attesa = 0
  togli()   // una partita che comincia non comincia in pausa: il freno resterebbe acceso da prima
  tappaIdx.value = indice
  const t = indice < 0 ? LIBERA : CAMPAGNA[indice]
  partita.value = new Partita(new Regole(t))
  cruscotto.value = partita.value.cruscotto
  domanda.value = null
  finale.value = null
  brindisi.value = ''
  toccato.value = false
  vista.value = 'pista'
  pagata = false
  contata = false
  mostriSegnati = 0
  cancelliSegnati = 0
  borsellino = borsa(CHIAVE)
  cancelliPagati = 0
  if (pittore) prendiTela(pittore.tela)
}

function prendiTela(tela) {
  if (!tela) return
  pittore = new Pista(tela)
  giostra.avvia()
}

function ridimensiona() { pittore?.misura() }

// un tocco sposta nella corsia toccata (o non sposta niente, se ci sei
// già) e in ogni caso spinge: serve a saltare i venti metri vuoti fra un
// cancello e l'altro
function vai(delta) {
  toccato.value = true
  partita.value?.vai(delta)
  partita.value?.spingi()
}

// il dito (o il tasto) tenuto giù: si spinge finché resta giù
function premi(giu) {
  if (giu) toccato.value = true
  partita.value?.premi(giu)
}

// l'esercizio si paga con niente: chi indovina moltiplica la truppa,
// chi sbaglia resta com'era
function risposto({ giusto }) {
  const p = partita.value
  ultimoModulo = domanda.value?.modulo || null
  domanda.value = null
  // rispondere è il tocco che riprende: il freno può essersi acceso
  // durante la domanda (telefono posato), e senza questa riga la corsa
  // resterebbe ferma dietro un velo che non c'è più
  togli()
  const esito = p?.rispondi(giusto)
  if (!esito) return
  if (giusto) {
    borsellino.paga(PAGA.domanda)
    segna('corsaLibri')
    brinda(`📚 la truppa passa da ${esito.prima} a ${esito.dopo}!`, true)
  } else {
    brinda('niente ×5, ma non hai perso niente', false)
  }
  cruscotto.value = p.cruscotto
}

function brinda(testo, bene) {
  if (!testo) return
  brindisi.value = testo
  suono[bene ? 'compra' : 'moneta']()
  clearTimeout(orologioBrindisi)
  orologioBrindisi = setTimeout(() => { brindisi.value = '' }, 2400)
}

// finire
let pagata = false
let contata = false
let mostriSegnati = 0
let cancelliSegnati = 0

function chiudiPartita() {
  attesa = 0
  const p = partita.value
  if (!p) return
  giostra.ferma()
  let primato = null

  if (libera.value) {
    // nella corsa infinita non si vince: si dura, e il conto/la frase
    // stanno in giochi/primati.js
    const esito = segnaPrimato(CHIAVE, p.dist)
    primato = { ...esito, frase: fraseDiFine(esito, SENZA_FINE.misura) }
  } else if (p.vinta && !pagata) {
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: p.stelle })
    segna('corsaTappe')
    pagata = true
  }

  if (!contata) { segna('corsaPartite'); contata = true }
  if (p.vinti > mostriSegnati) { segna('corsaMostri', p.vinti - mostriSegnati); mostriSegnati = p.vinti }
  if (p.cancelli > cancelliSegnati) {
    segna('corsaCancelli', p.cancelli - cancelliSegnati)
    cancelliSegnati = p.cancelli
  }
  segnaBest('corsaTruppa', p.truppa)
  segnaBest('corsaMetri', Math.floor(p.dist))

  finale.value = {
    vinta: p.vinta, titolo: regoleOra.value.nome, stelle: p.stelle,
    monete: borsellino.dato, notaMonete: borsellino.nota(),
    metri: Math.floor(p.dist), truppa: p.truppa, vinti: p.vinti,
    cancelli: p.cancelli, meglio: p.meglio, libri: p.libriGiusti,
    causa: p.causa, primato, libera: libera.value,
    ultima: p.vinta && !libera.value && tappaIdx.value === QUANTE_TAPPE - 1,
  }
}

// «avanti» dopo una vinta porta alla tappa dopo
function ancora() {
  const f = finale.value
  if (!f) return
  if (libera.value) return avvia(-1)
  if (f.vinta && tappaIdx.value + 1 < QUANTE_TAPPE) return avvia(tappaIdx.value + 1)
  if (f.vinta) return allaMappa()
  avvia(tappaIdx.value)
}

function allaMappa() {
  clearTimeout(attesa); attesa = 0
  togli()
  giostra.ferma()
  partita.value = null
  pittore = null
  finale.value = null
  domanda.value = null
  vista.value = 'mappa'
}

function indietro() {
  if (vista.value === 'mappa') emit('vai', 'home')
  else allaMappa()
}

onMounted(() => addEventListener('resize', ridimensiona))
onUnmounted(() => {
  removeEventListener('resize', ridimensiona)
  clearTimeout(attesa)
  clearTimeout(orologioBrindisi)
  giostra.ferma()
})
</script>

<template>
  <div class="schermo">
    <!-- il ⏸ c'è solo dove scorre qualcosa: sulla mappa non c'è niente
         da fermare, e dietro una domanda il gioco è già fermo -->
    <Barra :titolo="titolo" guida="corsa" @aiuto="aiuto" monete
           :pausa="vista === 'pista' && !domanda" @pausa="metti()"
           :scura="vista === 'pista' && vestito.buio" @indietro="indietro" />

    <div class="co" :style="{ '--co-accento': vestito.accento }">
      <Mappa v-if="vista === 'mappa'" :scalini="scalini" :libera="statoLibera"
             @gioca="avvia" @libera="avvia(-1)" />

      <PistaVista v-else :cruscotto="cruscotto" :buio="vestito.buio"
                  :dritta="!toccato && cruscotto.metri < 14 && !finale"
                  @tela="prendiTela" @vai="vai" @premi="premi" />

      <div v-if="brindisi" class="co-brindisi em">{{ brindisi }}</div>

      <Domanda v-if="domanda" :domanda="domanda.domanda" :pittori="domanda.pittori"
               :titolo="`${domanda.icona} ${domanda.nome}`"
               :origine="domanda" gioco="corsa" @risposto="risposto" />

      <Finale v-if="finale" v-bind="finale" @ancora="ancora" @esci="allaMappa" />

      <!-- il velo copre tutto lo schermo, quindi sta in fondo e fuori da
           qualunque cosa: la domanda e il cartello finale hanno già la
           loro pausa, e sopra di loro non ci va -->
      <VeloPausa v-if="inPausa && vista === 'pista' && !domanda && !finale"
                 :dove="dovEravamo" @riprendi="togli" />
    </div>
  </div>
</template>
