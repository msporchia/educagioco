<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL DUNGEON A BIVI — IL COORDINATORE

   Si scende in un dungeon disegnato da capo ogni volta. A ogni bivio si
   sceglie fra due o tre stanze, e ognuna dice **prima** cosa promette e
   quanto chiede: il mostro grosso lascia il doppio ma vuole tre risposte
   difficili, lo scrigno non fa male ma se sbagli il tesoro resta lì.

   LA DOMANDA È IL PASSAGGIO. Quando c'è da passare — il mostro, la
   serratura, il guardiano — questo file va a prendere una domanda vera
   dai moduli di quiz (`src/quiz/scelta.js`) e la mette in scena. Chiede
   una difficoltà da 0 a 1 e **non sa di che materia sia**: né lui né il
   motore nominano mai un modulo. `evita` serve solo a non far uscire
   due domande di fila della stessa materia.

   Questo file mette insieme i pezzi ed è l'unico che sa che esistono le
   monete, l'avanzamento salvato e i quiz: le regole stanno in
   `motore/`, i numeri in `dati/`, la caverna in `scena/`, le schermate
   in `viste/`. Se qui dentro comincia a comparire una regola di gioco,
   vuol dire che è nel file sbagliato.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { addCoins, segna, segnaBest } from '../../store/profile.js'
import { progresso, aperta, stelleDi, completa, scelta, ricorda } from '../campagne.js'
import { domandaPerGioco } from '../../quiz/scelta.js'
import Domanda from '../../quiz/Domanda.vue'

import { CAMPAGNA, SCALINI, LIBERE, PREDEFINITA, QUANTE_TAPPE,
         tappeDelloScalino, tappaLibera } from './dati/campagna.js'
import { AMBIENTI, CHIAVI_AMBIENTI } from './dati/mostri.js'
import { TESORI } from './dati/tesori.js'
import { Corsa } from './motore/corsa.js'

import Campagna from './viste/Campagna.vue'
import CorsaVista from './viste/Corsa.vue'
import Stanza from './viste/Stanza.vue'
import Bottino from './viste/Bottino.vue'
import Eroe from './viste/Eroe.vue'
import Fine from './viste/Fine.vue'
import './stile.css'

defineOptions({ name: 'DungeonABivi' })
const emit = defineEmits(['vai'])

const CHIAVE = 'dungeon'
const RESPIRO = { entrata: 750, dopoColpo: 620, dopoRipresa: 350 }

/* ═══════════ dove siamo ═══════════ */
const corsa = ref(null)
const tappaIdx = ref(-1)          // -1 = discesa senza fondo
const domanda = ref(null)         // la domanda in scena, se c'è
const scosso = ref(0)             // cambia a ogni colpo: il mostro trema
const fine = ref(null)            // il cartello di fine discesa
let ultimoModulo = null           // per non ripetere la stessa materia
let attesa = 0

const avanza = progresso(CHIAVE)
const libera = computed(() => tappaIdx.value < 0)
const dove = computed(() => corsa.value ? corsa.value.dove : 'campagna')
const stanza = computed(() => corsa.value?.stanza || null)

onUnmounted(() => clearTimeout(attesa))

/* ═══════════ la mappa delle tappe ═══════════
   Le tappe arrivano alla vista già decise: cosa è aperto, quante
   stelle, di che colore. La schermata non chiede niente a nessuno. */
const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    icona: AMBIENTI[t.ambiente].icona,
    accento: AMBIENTI[t.ambiente].accento,
    ambienteNome: AMBIENTI[t.ambiente].nome,
    aperta: aperta(CHIAVE, t.indice),
    adesso: t.indice === avanza.tappa,
    stelle: stelleDi(CHIAVE, t.indice),
  })),
})))

const statoLibero = computed(() => ({
  aperto: aperta(CHIAVE, QUANTE_TAPPE),
  quante: QUANTE_TAPPE,
  fatte: Math.min(avanza.tappa, QUANTE_TAPPE),
}))

const profondita = ref(scelta(CHIAVE, 'profondita', PREDEFINITA))
function scegliProfondita(k) { profondita.value = ricorda(CHIAVE, 'profondita', k) }
/* nella discesa senza fondo l'ambiente non si sceglie: capita. È l'unica
   sorpresa rimasta a chi ha già visto tutte e nove le tappe */
const ambienteACaso = () =>
  CHIAVI_AMBIENTI[Math.floor(Math.random() * CHIAVI_AMBIENTI.length)]

/* ═══════════ il vestito di dove siamo ═══════════ */
const ambiente = computed(() =>
  corsa.value ? corsa.value.ambiente : AMBIENTI[CAMPAGNA[Math.min(avanza.tappa, 8)].ambiente])
const accento = computed(() => ambiente.value.accento)

const titolo = computed(() =>
  !corsa.value ? 'Il Dungeon'
  : libera.value ? 'senza fondo'
  : CAMPAGNA[tappaIdx.value].nome)

/* Una discesa da quaranta file non si legge contando i pallini: si
   legge a piani. «Piano 2 di 3, fila 5 di 14» dice dove si è e quanto
   manca al prossimo capo, che è l'unica cosa che serve sapere. */
const piede = computed(() => {
  const c = corsa.value
  if (!c) return ''
  if (!c.qui) return 'tocca una stanza illuminata per entrare'
  return `piano ${c.piano + 1} di ${c.quantiPiani} — fila ${c.filaNelPiano} di ${c.fileDelPiano}`
})

/* ═══════════ com'è messo l'eroe ═══════════
   Quello che sta nella fascia in cima, già pronto da mostrare: la
   vista non va a sommare bonus né a guardare dentro le caselle. */
const eroe = computed(() => {
  const c = corsa.value
  if (!c) return null
  const q = c.vita / Math.max(1, c.vitaMax)
  return {
    vita: c.vita, vitaMax: c.vitaMax, quota: q,
    attacco: c.attacco, difesa: c.difesa,
    /* dal verde al rosso: «sto per morire» si deve vedere senza leggere */
    polso: q > 0.6 ? '#4fce7c' : q > 0.3 ? '#f0b429' : '#e0432f',
  }
})

/* Quello che ci si porta dietro. **Non sta più nella fascia in cima**:
   la fila di emoji cresceva a ogni oggetto e spingeva fuori i numeri,
   che sono la cosa che serve davvero mentre si gioca. Sta nella scheda
   dell'eroe, dove c'è lo spazio per dire anche cosa fa ognuno. */
const roba = computed(() => {
  const c = corsa.value
  if (!c) return []
  const voce = (k, dove) => ({ chiave: k, em: TESORI[k].em, nome: TESORI[k].nome,
                               desc: TESORI[k].desc, dove })
  return [
    c.mano && voce(c.mano, 'in mano'),
    c.addosso && voce(c.addosso, 'addosso'),
    ...Object.keys(c.presi).map(k => voce(k, null)),
  ].filter(Boolean)
})

/* la scheda dell'eroe, che si apre toccando i numeri in cima */
const schedaAperta = ref(false)

/* ═══════════ il cartello del bottino ═══════════
   Si mette davanti quando si prende qualcosa, perché un premio che
   passa in una riga di testo non è un premio. Il confronto prima→dopo
   si fa qui e non nel motore: le regole non hanno bisogno di sapere
   com'era il mondo un attimo fa, questa schermata sì. */
const bottino = ref(null)

function guarda() {
  const c = corsa.value
  if (!c) return null
  return { attacco: c.attacco, difesa: c.difesa, vitaMax: c.vitaMax, vita: c.vita,
           gemme: c.gemme, tesori: c.tesori, mano: c.mano, addosso: c.addosso,
           presi: Object.keys(c.presi).join() }
}

/* Cosa è cambiato da `prima` a adesso, e vale la pena mostrarlo?
   **Non si elencano i casi** — «se è il mercante, se è il fuoco, se è
   una stranezza» — perché la lista si dimentica sempre di un posto, e
   infatti la prima versione se n'era dimenticata tre: le stranezze,
   l'allenamento e il riposo. Si guarda la differenza e basta: qualunque
   cosa renda l'eroe più forte si merita il suo cartello, da qualunque
   stanza sia arrivata. */
function mostraBottino(prima) {
  const c = corsa.value
  if (!c || !prima) return

  /* un oggetto nuovo addosso: si scopre confrontando le caselle, non
     facendoselo dire da chi ha chiamato */
  const nuovo = c.mano !== prima.mano ? c.mano
    : c.addosso !== prima.addosso ? c.addosso
    : Object.keys(c.presi).join() !== prima.presi
      ? Object.keys(c.presi).find(k => !prima.presi.split(',').includes(k))
      : null

  if (nuovo && TESORI[nuovo]) {
    const t = TESORI[nuovo]
    /* quale dei tre numeri è cambiato: si guarda, non si deduce dal
       tipo di oggetto — così un oggetto nuovo non chiede una riga qui */
    const salto = c.attacco !== prima.attacco ? { segno: '⚔️', prima: prima.attacco, dopo: c.attacco }
      : c.difesa !== prima.difesa ? { segno: '🛡️', prima: prima.difesa, dopo: c.difesa }
      : c.vitaMax !== prima.vitaMax ? { segno: '❤️', prima: prima.vitaMax, dopo: c.vitaMax }
      : {}
    bottino.value = { em: t.em, nome: t.nome, cosaFa: t.fa, ...salto,
                      invece: c.ultimoLasciato || null }
    return suoni.tesoro()
  }

  /* allenarsi al fuoco è un potenziamento come un altro, e va
     festeggiato uguale: è la stessa cosa che succede */
  if (c.attacco > prima.attacco)
    return festeggia('💪', 'Braccio più forte', 'I mostri cadranno un po\' prima.',
                     { segno: '⚔️', prima: prima.attacco, dopo: c.attacco })
  if (c.difesa > prima.difesa)
    return festeggia('🧘', 'Guardia più solida', 'Quando sbagli farà un po\' meno male.',
                     { segno: '🛡️', prima: prima.difesa, dopo: c.difesa })
  if (c.vitaMax > prima.vitaMax)
    return festeggia('❤️', 'Più resistente', 'Adesso reggi più colpi prima di cadere.',
                     { segno: '❤️', prima: prima.vitaMax, dopo: c.vitaMax })
  if (c.vita > prima.vita)
    return festeggia('🧪', 'Rimesso in sesto', 'Puoi tornare a picchiare.',
                     { segno: '❤️', prima: prima.vita, dopo: c.vita })

  const guadagno = c.gemme - prima.gemme
  if (guadagno > 0) {
    bottino.value = {
      em: '💎', nome: guadagno === 1 ? 'Una gemma' : `${guadagno} gemme`,
      /* le gemme sono l'unica cosa che si raccoglie e non si usa
         subito: senza questa riga un bambino le prende per punteggio */
      cosaFa: 'Servono dal mercante 🏪, per comprare armi, armature e pozioni.',
      gemme: guadagno, totale: c.gemme,
    }
    suoni.bottino()
  }
}

function festeggia(em, nome, cosaFa, salto) {
  bottino.value = { em, nome, cosaFa, ...salto }
  suoni.tesoro()
}

const chiudiBottino = () => { bottino.value = null }

/* ═══════════ i suoni ═══════════ */
const suoni = {
  passo: () => suono.nota(320, 320, 0.05, 'sine', 0.06),
  colpo: () => suono.boom(),
  ahia: () => suono.no(),
  bottino: () => suono.moneta(),
  tesoro: () => suono.livello(),
}

/* ═══════════ giocare ═══════════ */
function avvia(tappa, indice) {
  clearTimeout(attesa)
  tappaIdx.value = indice
  fine.value = null
  domanda.value = null
  /* L'eroe si porta dietro quello che ha imparato: vita, attacco e
     difesa di partenza crescono con le tappe già portate a casa
     (`dati/eroe.js`). Non è un campo nuovo nel profilo — è
     `avanza.tappa`, che c'era già — e per questo un bambino che
     riapre il gioco dopo un mese ritrova l'eroe come l'aveva
     lasciato senza che nessuno abbia salvato niente. */
  corsa.value = new Corsa(tappa, { tappeFatte: avanza.tappa })
  suono.nota(180, 90, 0.4, 'sawtooth', 0.12)
}

const avviaTappa = i => avvia(CAMPAGNA[i], i)
const avviaLibera = () => avvia(tappaLibera(profondita.value, ambienteACaso()), -1)

/* entrare in una stanza: la camminata l'ha già fatta la vista */
function entra(id) {
  const c = corsa.value
  if (!c || c.dove !== 'mappa') return
  const st = c.entra(id)
  suoni.passo()
  if (!st) return
  if (st.che === 'sfida') {
    if (st.tipo === 'boss') suono.boss()
    chiediFra(RESPIRO.entrata)
  }
}

/* ═══════════ la domanda ═══════════
   L'unico punto del gioco in cui si nomina un quiz. Il gioco dice
   quanto dev'essere difficile e chi la sceglie fa il resto. */
function chiediFra(quando) {
  clearTimeout(attesa)
  attesa = setTimeout(chiedi, quando)
}

function chiedi() {
  const st = stanza.value
  if (!st || st.che !== 'sfida' || st.momento !== 'domanda') return
  try {
    const q = domandaPerGioco({ difficolta: st.difficolta, evita: ultimoModulo })
    if (!q?.domanda) throw new Error('nessun modulo di quiz')
    ultimoModulo = q.modulo
    domanda.value = q
  } catch (e) {
    /* senza moduli non si blocca un bambino davanti a un mostro: la
       porta si apre e via. È l'unico caso in cui una domanda vale sì. */
    domanda.value = null
    risolvi(true)
  }
}

function risposto({ giusto }) {
  domanda.value = null
  risolvi(giusto)
}

function risolvi(giusto) {
  const c = corsa.value
  const prima = guarda()
  const esito = c.rispondi(giusto)
  if (!esito) return
  scosso.value++

  switch (esito.che) {
    case 'colpo': suoni.colpo(); chiediFra(RESPIRO.dopoColpo); break
    case 'vinto':
      suoni.colpo()
      /* il cartello aspetta che il colpo si sia sentito: arrivare
         addosso al «bam» vorrebbe dire non vedere il mostro cadere */
      setTimeout(() => mostraBottino(prima), 300)
      break
    case 'sfumato': suono.no(); break
    case 'ferito': suoni.ahia(); break
    case 'trionfo': suono.livello(); break
    case 'morto': chiudi(); break
  }
}

function continua() {
  corsa.value.continua()
  chiediFra(RESPIRO.dopoRipresa)
}

function scappa() {
  corsa.value.scappa()
  suoni.passo()
}

/* le stanze senza domande */
function scegli(chiave) {
  const c = corsa.value
  const prima = guarda()
  const esito = c.scegli(chiave)
  if (c.dove === 'fine') return chiudi()

  /* comprare, allenarsi, riposare, o farsi baciare dalla fortuna in una
     stranezza: se qualcosa è migliorato lo si festeggia uguale, da
     qualunque stanza sia arrivato */
  const prezzo = c.gemme < prima.gemme
  mostraBottino(prima)
  if (bottino.value) { if (prezzo) suono.compra() }
  else if (esito) suono.ok()
}

/* si esce dalla stanza e si torna sulla mappa — o si chiude la discesa */
function avanti() {
  clearTimeout(attesa)
  corsa.value.esci()
  if (corsa.value.dove === 'fine') chiudi()
  else suoni.passo()
}

/* ═══════════ com'è finita ═══════════ */
function chiudi() {
  clearTimeout(attesa)
  domanda.value = null
  const c = corsa.value
  const vinta = c.vinta

  /* prima l'avanzamento, poi i contatori: i traguardi si controllano
     dentro `segna()`, e devono vedere la tappa già segnata come fatta */
  if (vinta && !libera.value)
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: c.stelle })

  /* i contatori si muovono a fine discesa, non stanza per stanza:
     salvare dodici volte per partita non aggiunge niente */
  segna('dungeonStanze', c.visitate)
  if (c.tesori) segna('dungeonTesori', c.tesori)
  segnaBest('dungeonFila', c.piuGiu + 1)
  if (vinta) {
    addCoins(c.monete)
    segna('dungeonBoss')
    /* «uscirne interi» adesso vuol dire *quasi* interi, ed è l'unica
       lettura possibile: uno scambio vinto costa comunque un graffio,
       quindi «senza perdere niente» sarebbe un traguardo che non si
       prende mai. La soglia è quella delle tre stelle, così le due cose
       che il bambino vede — le stelle e il traguardo — dicono lo
       stesso, invece di due cose diverse a un punto di distanza. */
    if (c.stelle === 3) segna('dungeonInteri')
    suono.livello()
  } else suono.fine()

  fine.value = {
    vinta,
    titolo: libera.value ? 'discesa senza fondo' : CAMPAGNA[tappaIdx.value].nome,
    bossNome: c.ambiente.bossNome,
    stelle: c.stelle,
    monete: c.monete,
    doni: roba.value,
    libera: libera.value,
    fatti: { stanze: c.visitate, domande: c.domande, gemme: c.gemme,
             fila: c.piuGiu + 1, file: c.quanteFile },
  }
}

function ancora() {
  const vinta = fine.value.vinta
  fine.value = null
  if (vinta) return allaMappa()
  /* persa: si riprova la stessa tappa, ma il dungeon si rimescola */
  if (libera.value) avviaLibera()
  else avviaTappa(tappaIdx.value)
}

function allaMappa() {
  clearTimeout(attesa)
  fine.value = null
  domanda.value = null
  corsa.value = null
}

function indietro() {
  if (!corsa.value && !fine.value) emit('vai', 'home')
  else allaMappa()
}
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" guida="dungeon" :monete="!corsa" scura @indietro="indietro">
      <!-- Un bottone solo, non cinque gettoni: i numeri che servono a
           decidere, e toccandoli si apre la scheda con l'equipaggiamento.
           Le emoji degli oggetti stavano qui e spingevano fuori il
           resto — su un telefono la fascia perdeva pezzi proprio mentre
           servivano. -->
      <button v-if="corsa && eroe" class="dng-io" data-azione="scheda"
              aria-label="la tua scheda" @click="schedaAperta = true">
        <span class="dng-eroe-vita" :style="{ '--dng-polso': eroe.polso }">
          <i :style="{ width: eroe.quota * 100 + '%' }"></i>
          <b>{{ eroe.vita }}</b>
        </span>
        <span class="dng-io-n em">⚔️<b>{{ eroe.attacco }}</b></span>
        <span class="dng-io-n em">🛡️<b>{{ eroe.difesa }}</b></span>
        <span class="dng-io-n em">💎<b>{{ corsa.gemme }}</b></span>
      </button>
    </Barra>

    <div class="dng" :style="{ '--dng-accento': accento }">
      <Campagna v-if="dove === 'campagna'" :scalini="scalini" :libero="statoLibero"
                :profondita="LIBERE" :scelta="profondita"
                @gioca="avviaTappa" @libera="avviaLibera" @profondita="scegliProfondita" />

      <!-- la mappa resta sotto anche a discesa finita: il cartello di
           fine sta sopra il dungeon che si è appena percorso, non sopra
           una schermata nera -->
      <CorsaVista v-else-if="dove === 'mappa' || dove === 'fine'"
                  :stanze="corsa.vetrina()" :sentieri="corsa.sentieri()"
                  :pedina="corsa.qui ? { x: corsa.qui.xn, y: corsa.qui.riga / Math.max(1, corsa.quanteFile - 1) } : null"
                  :vestito="{ pietra: ambiente.pietra, accento: ambiente.accento }"
                  :piede="piede" @vai="entra" />

      <Stanza v-else-if="stanza" :stanza="stanza" :eroe="eroe" :scosso="scosso"
              :stretta="!!domanda"
              @scegli="scegli" @continua="continua" @scappa="scappa" @avanti="avanti" />

      <!-- La domanda non copre niente: è l'ultimo pezzo della colonna,
           appoggiato in fondo, e la stanza si tiene tutto il resto —
           così mentre si risponde si continua a vedere chi si ha davanti
           e quanta vita gli resta, senza una striscia vuota in mezzo.
           Coprire tutto vorrebbe dire rispondere a una scheda, non
           battere un mostro. Come si divide lo schermo sta in
           `stile.css`, sotto `.dng-stretta`. -->
      <div v-if="domanda" class="dng-domanda">
        <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                 :titolo="`${domanda.icona} ${domanda.nome}`"
                 :origine="domanda" gioco="dungeon" @risposto="risposto" />
      </div>

      <!-- il bottino sta sopra a tutto: è il momento in cui si è
           diventati più forti, e va guardato prima di andare avanti -->
      <Bottino v-if="bottino" :bottino="bottino" @chiudi="chiudiBottino" />

      <Eroe v-if="schedaAperta && eroe" :eroe="eroe" :gemme="corsa.gemme" :roba="roba"
            @chiudi="schedaAperta = false" />

      <Fine v-if="fine" v-bind="fine" @ancora="ancora" @esci="allaMappa" />
    </div>
  </div>
</template>
