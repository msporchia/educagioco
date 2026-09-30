<script setup>
// Il coordinatore: l'unico file che sa che esistono monete, avanzamento
// salvato e quiz. Quando c'è da passare (mostro, serratura, guardiano) va a
// prendere una domanda vera da src/quiz/scelta.js — chiede una difficoltà
// 0..1 e non sa mai di che materia sia. Le regole stanno in motore/, i
// numeri in dati/, la caverna in scena/, le schermate in viste/.
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { segna, segnaBest } from '../../store/profile.js'
import { borsa } from '../../store/varieta.js'
import { PAGA } from '../../data/paghe.js'
import { progresso, aperta, adesso, stelleDi, completa, scelta, ricorda } from '../campagne.js'
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

const corsa = ref(null)
const tappaIdx = ref(-1)          // -1 = discesa senza fondo
const domanda = ref(null)         // la domanda in scena, se c'è
const scosso = ref(0)             // cambia a ogni colpo: il mostro trema
const fine = ref(null)            // il cartello di fine discesa
let ultimoModulo = null           // per non ripetere la stessa materia

const avanza = progresso(CHIAVE)
// una risposta giusta paga subito, e basta: niente premio a fine discesa
// (docs/apprendimento/calibrazione.md). Una ogni cinque secondi: 🪙1, non 3
let borsellino = borsa(CHIAVE)
const libera = computed(() => tappaIdx.value < 0)
const dove = computed(() => corsa.value ? corsa.value.dove : 'campagna')
const stanza = computed(() => corsa.value?.stanza || null)

// Niente ⏸: il gioco è a turni, non scorre niente da fermare (docs/dungeon/regole.md).
// L'unico orologio è un setTimeout — il respiro prima della domanda — che si
// congela a schermo spento o col foglio del `?` aperto, e riparte da quanto
// restava (come l'attesa dell'esito di quiz/Domanda.vue). Qui il ritorno
// riprende da solo, al contrario di pausa.js: non c'è una partita in corsa.
let attesa = 0          // il timer, 0 = nessuno
let scade = 0           // quando scatterebbe, in `performance.now()`
let restava = 0         // quanto le mancava quando l'hanno congelata
let alFreddo = false    // schermo spento, o foglio del `?` aperto

function congela() {
  alFreddo = true
  if (!attesa) return
  restava = Math.max(0, scade - performance.now())
  clearTimeout(attesa)
  attesa = 0
}

function scongela() {
  alFreddo = false
  if (attesa || !restava) return
  chiediFra(restava)
}

// spento per davvero (non una pausa): senza azzerare il residuo, una domanda
// vecchia comparirebbe in una stanza in cui non si è più
function spegniLAttesa() {
  clearTimeout(attesa)
  attesa = 0
  restava = 0
}

function aiuto(aperto) { aperto ? congela() : scongela() }

// `visibilitychange` si ascolta sul document (dove viene lanciato), alla finestra arriva solo perché risale
function schermo(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') congela()
  else scongela()
}

onMounted(() => {
  document.addEventListener('visibilitychange', schermo)
  addEventListener('pagehide', schermo)
})
onUnmounted(() => {
  spegniLAttesa()
  document.removeEventListener('visibilitychange', schermo)
  removeEventListener('pagehide', schermo)
})

const scalini = computed(() => SCALINI.map(s => ({
  ...s,
  tappe: tappeDelloScalino(s.chiave).map(t => ({
    ...t,
    icona: AMBIENTI[t.ambiente].icona,
    accento: AMBIENTI[t.ambiente].accento,
    ambienteNome: AMBIENTI[t.ambiente].nome,
    aperta: aperta(CHIAVE, t.indice),
    adesso: adesso(CHIAVE, t.indice),
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
// nella discesa senza fondo l'ambiente non si sceglie: capita
const ambienteACaso = () =>
  CHIAVI_AMBIENTI[Math.floor(Math.random() * CHIAVI_AMBIENTI.length)]

const ambiente = computed(() =>
  corsa.value ? corsa.value.ambiente : AMBIENTI[CAMPAGNA[Math.min(avanza.tappa, 8)].ambiente])
const accento = computed(() => ambiente.value.accento)

const titolo = computed(() =>
  !corsa.value ? 'Il Dungeon'
  : libera.value ? 'senza fondo'
  : CAMPAGNA[tappaIdx.value].nome)

// una discesa da quaranta file si legge a piani, non contando i pallini
const piede = computed(() => {
  const c = corsa.value
  if (!c) return ''
  if (!c.qui) return 'tocca una stanza illuminata per entrare'
  return `piano ${c.piano + 1} di ${c.quantiPiani} — fila ${c.filaNelPiano} di ${c.fileDelPiano}`
})

const eroe = computed(() => {
  const c = corsa.value
  if (!c) return null
  const q = c.vita / Math.max(1, c.vitaMax)
  return {
    vita: c.vita, vitaMax: c.vitaMax, quota: q,
    attacco: c.attacco, difesa: c.difesa,
    polso: q > 0.6 ? '#4fce7c' : q > 0.3 ? '#f0b429' : '#e0432f',   // dal verde al rosso, si vede senza leggere
  }
})

// non sta più nella fascia in cima: una fila di emoji spingeva fuori i numeri (viste/Eroe.vue)
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

const schedaAperta = ref(false)

// il confronto prima→dopo si fa qui e non nel motore: le regole non sanno com'era il mondo un attimo fa
const bottino = ref(null)

function guarda() {
  const c = corsa.value
  if (!c) return null
  return { attacco: c.attacco, difesa: c.difesa, vitaMax: c.vitaMax, vita: c.vita,
           gemme: c.gemme, tesori: c.tesori, mano: c.mano, addosso: c.addosso,
           presi: Object.keys(c.presi).join() }
}

// si guarda la differenza e basta, non si elencano i casi (mercante, fuoco,
// stranezza...): una lista dimentica sempre un posto (ne mancavano tre)
function mostraBottino(prima) {
  const c = corsa.value
  if (!c || !prima) return

  // un oggetto nuovo addosso: si scopre confrontando le caselle
  const nuovo = c.mano !== prima.mano ? c.mano
    : c.addosso !== prima.addosso ? c.addosso
    : Object.keys(c.presi).join() !== prima.presi
      ? Object.keys(c.presi).find(k => !prima.presi.split(',').includes(k))
      : null

  if (nuovo && TESORI[nuovo]) {
    const t = TESORI[nuovo]
    // quale dei tre numeri è cambiato: si guarda, non si deduce dal tipo di oggetto
    const salto = c.attacco !== prima.attacco ? { segno: '⚔️', prima: prima.attacco, dopo: c.attacco }
      : c.difesa !== prima.difesa ? { segno: '🛡️', prima: prima.difesa, dopo: c.difesa }
      : c.vitaMax !== prima.vitaMax ? { segno: '❤️', prima: prima.vitaMax, dopo: c.vitaMax }
      : {}
    bottino.value = { em: t.em, nome: t.nome, cosaFa: t.fa, ...salto,
                      invece: c.ultimoLasciato || null }
    return suoni.tesoro()
  }

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
      // senza questa riga un bambino prende le gemme per punteggio
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

const suoni = {
  passo: () => suono.nota(320, 320, 0.05, 'sine', 0.06),
  colpo: () => suono.boom(),
  ahia: () => suono.no(),
  bottino: () => suono.moneta(),
  tesoro: () => suono.livello(),
}

function avvia(tappa, indice) {
  spegniLAttesa()
  tappaIdx.value = indice
  fine.value = null
  domanda.value = null
  corsa.value = new Corsa(tappa, { tappeFatte: avanza.tappa })
  borsellino = borsa(CHIAVE)
  suono.nota(180, 90, 0.4, 'sawtooth', 0.12)
}

const avviaTappa = i => avvia(CAMPAGNA[i], i)
const avviaLibera = () => avvia(tappaLibera(profondita.value, ambienteACaso()), -1)

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

// l'unico punto del gioco in cui si nomina un quiz
function chiediFra(quando) {
  clearTimeout(attesa)
  attesa = 0
  // fra il tocco e l'ingresso c'è la camminata della pedina: posare il
  // telefono lì armerebbe il respiro a schermo già spento
  if (alFreddo) { restava = quando; return }
  restava = 0
  scade = performance.now() + quando
  attesa = setTimeout(chiedi, quando)
}

function chiedi() {
  attesa = 0
  const st = stanza.value
  if (!st || st.che !== 'sfida' || st.momento !== 'domanda') return
  try {
    const q = domandaPerGioco({ difficolta: st.difficolta, evita: ultimoModulo })
    if (!q?.domanda) throw new Error('nessun modulo di quiz')
    ultimoModulo = q.modulo
    domanda.value = q
  } catch (e) {
    // senza moduli non si blocca un bambino davanti a un mostro: l'unico caso in cui una domanda vale sì
    domanda.value = null
    risolvi(true)
  }
}

function risposto({ giusto }) {
  domanda.value = null
  if (giusto) borsellino.paga(PAGA.mossa)
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
      setTimeout(() => mostraBottino(prima), 300)   // aspetta che il colpo si sia sentito
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

// le stanze senza domande
function scegli(chiave) {
  const c = corsa.value
  const prima = guarda()
  const esito = c.scegli(chiave)
  if (c.dove === 'fine') return chiudi()

  const prezzo = c.gemme < prima.gemme
  mostraBottino(prima)
  if (bottino.value) { if (prezzo) suono.compra() }
  else if (esito) suono.ok()
}

function avanti() {
  spegniLAttesa()
  corsa.value.esci()
  if (corsa.value.dove === 'fine') chiudi()
  else suoni.passo()
}

function chiudi() {
  spegniLAttesa()
  domanda.value = null
  const c = corsa.value
  const vinta = c.vinta

  // prima l'avanzamento, poi i contatori: i traguardi in segna() devono vedere la tappa già segnata
  if (vinta && !libera.value)
    completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle: c.stelle })

  segna('dungeonStanze', c.visitate)
  if (c.tesori) segna('dungeonTesori', c.tesori)
  segnaBest('dungeonFila', c.piuGiu + 1)
  if (vinta) {
    segna('dungeonBoss')
    // "interi" vuol dire quasi interi (un graffio si prende comunque): soglia alle tre stelle, come il bambino vede
    if (c.stelle === 3) segna('dungeonInteri')
    suono.livello()
  } else suono.fine()

  fine.value = {
    vinta,
    titolo: libera.value ? 'discesa senza fondo' : CAMPAGNA[tappaIdx.value].nome,
    bossNome: c.ambiente.bossNome,
    stelle: c.stelle,
    monete: borsellino.dato,
    notaMonete: borsellino.nota(),
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
  // persa: si riprova la stessa tappa, ma il dungeon si rimescola
  if (libera.value) avviaLibera()
  else avviaTappa(tappaIdx.value)
}

function allaMappa() {
  spegniLAttesa()
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
    <!-- niente ⏸ (non scorre niente da fermare); il `?` invece ferma il respiro mentre si legge -->
    <Barra :titolo="titolo" guida="dungeon" :monete="!corsa" scura
           @aiuto="aiuto" @indietro="indietro">
      <!-- un bottone solo, non cinque gettoni: le emoji degli oggetti spingevano fuori i numeri -->
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

      <!-- la mappa resta sotto anche a discesa finita: il cartello di fine sta sopra il dungeon, non su nero -->
      <CorsaVista v-else-if="dove === 'mappa' || dove === 'fine'"
                  :stanze="corsa.vetrina()" :sentieri="corsa.sentieri()"
                  :pedina="corsa.qui ? { x: corsa.qui.xn, y: corsa.qui.riga / Math.max(1, corsa.quanteFile - 1) } : null"
                  :vestito="{ pietra: ambiente.pietra, accento: ambiente.accento }"
                  :piede="piede" @vai="entra" />

      <Stanza v-else-if="stanza" :stanza="stanza" :eroe="eroe" :scosso="scosso"
              :stretta="!!domanda"
              @scegli="scegli" @continua="continua" @scappa="scappa" @avanti="avanti" />

      <!-- la domanda non copre niente: si continua a vedere il mostro e la sua vita (stile.css, .dng-stretta) -->
      <div v-if="domanda" class="dng-domanda">
        <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                 :titolo="`${domanda.icona} ${domanda.nome}`"
                 :origine="domanda" gioco="dungeon" @risposto="risposto" />
      </div>

      <Bottino v-if="bottino" :bottino="bottino" @chiudi="chiudiBottino" />

      <Eroe v-if="schedaAperta && eroe" :eroe="eroe" :gemme="corsa.gemme" :roba="roba"
            @chiudi="schedaAperta = false" />

      <Fine v-if="fine" v-bind="fine" @ancora="ancora" @esci="allaMappa" />
    </div>
  </div>
</template>
