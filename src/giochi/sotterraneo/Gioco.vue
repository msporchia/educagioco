<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL SOTTERRANEO — IL COORDINATORE

   Un sotterraneo che si **cammina**, dall'alto, col dito: si tocca dove
   si vuole andare, si entra nelle stanze, si toccano le cose. Ogni cosa
   che vale qualcosa ha un prezzo, e il prezzo è **rispondere**.

   Non è il Dungeon a bivi di `src/giochi/dungeon/`, e non lo sostituisce:
   quello è un gioco a carte — una mappa a nodi, un bivio alla volta, non
   si torna indietro. Questo è un posto invece che un diagramma. I due
   fanno cose diverse con gli stessi esercizi; se un giorno se ne terrà
   uno solo, sarà perché i bambini avranno detto quale.

   Questo file mette insieme i pezzi ed è l'unico che sa che esistono le
   monete, l'avanzamento salvato e i quiz: le regole stanno in `motore/`,
   i numeri in `dati/`, il disegno in `scena/`, le schermate in `viste/`.
   Se qui dentro comincia a comparire una regola di gioco, vuol dire che
   è nel file sbagliato.

   ── LA DOMANDA LA CHIEDE IL MOTORE, LA TROVA QUESTO FILE ──────────
   `corsa.chiesta` dice soltanto **quanto dev'essere difficile**; qui si
   va a prenderne una vera dai moduli di quiz e la si mette in scena. Il
   gioco non sa di che materia sia, e `evita` serve solo a non far uscire
   due domande di fila della stessa.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, shallowRef, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { addCoins, segna, segnaBest } from '../../store/profile.js'
import { progresso, aperta, stelleDi, completa } from '../campagne.js'
import { domandaPerGioco } from '../../quiz/scelta.js'
import Domanda from '../../quiz/Domanda.vue'

import { CAMPAGNA, QUANTE_TAPPE, stelleDella } from './dati/campagna.js'
import { COSE, SEGNI } from './dati/cose.js'
import { TASCHE } from './dati/mondo.js'
import { Corsa } from './motore/corsa.js'
import { Tela } from './scena/tela.js'

import Campagna from './viste/Campagna.vue'
import Foglio from './viste/Foglio.vue'
import Scontro from './viste/Scontro.vue'
import Zaino from './viste/Zaino.vue'
import Mercante from './viste/Mercante.vue'
import Fine from './viste/Fine.vue'
import './stile.css'

defineOptions({ name: 'IlSotterraneo' })
const emit = defineEmits(['vai'])

const CHIAVE = 'sotterraneo'
/* Il dito si lascia dietro un click, e quel click va ingoiato: chi apre
   un foglio dal tocco su un canvas si ritrova il click sul foglio appena
   comparso, cioè su un tasto che si preme da solo. Col mouse non succede
   — lì il bersaglio si decide alla pressione — ed è il motivo per cui
   questi guasti si vedono solo dal telefono. Vedi `giochi/fattoria`. */
const FANTASMA_MS = 100
const FANTASMA_PX = 32
/* Un dito non sta fermo come un mouse: sotto i sedici pixel Android e
   iOS considerano il dito ancora fermo, e un gioco più severo del
   telefono butta via i tocchi di chi preme forte — cioè dei bambini. */
const FERMO_PX = 16

const tela = ref(null)
const corsa = shallowRef(null)
const tappaIdx = ref(-1)
const domanda = ref(null)
const fine = ref(null)
const avviso = ref('')
const zainoAperto = ref(false)
const scosso = ref(0)
const tic = ref(0)                 // batte quando cambia qualcosa che si vede
let ultimoModulo = null
let pittore = null
let orologio = 0
let ultimoAvviso = 0

const avanza = progresso(CHIAVE)

/* ═══════════ la mappa delle tappe ═══════════ */
const tappe = computed(() => CAMPAGNA.map((t, i) => ({
  ...t, indice: i,
  aperta: aperta(CHIAVE, i),
  adesso: i === avanza.tappa,
  stelle: stelleDi(CHIAVE, i),
})))

const titolo = computed(() =>
  corsa.value ? CAMPAGNA[tappaIdx.value].nome : 'Il sotterraneo')

/* ═══════════ com'è messo l'eroe, per la fascia ═══════════
   Già pronto da mostrare: la vista non somma bonus e non guarda dentro
   le tasche. `tic` è la dipendenza che fa ridisegnare — la corsa è
   `shallowRef` apposta, perché renderla reattiva in profondità vorrebbe
   dire un proxy su ogni cella del piano, sessanta volte al secondo. */
const eroe = computed(() => {
  tic.value
  const c = corsa.value
  if (!c) return null
  const q = c.vita / Math.max(1, c.vitaMax)
  return {
    vita: c.vita, vitaMax: c.vitaMax, quota: q,
    att: c.att, dif: c.dif, gemme: c.gemme,
    piano: c.piano + 1, piani: c.quantiPiani,
    chiave: c.chiaveDelPiano,
    polso: q > 0.6 ? '#4fce7c' : q > 0.3 ? '#f0b429' : '#e0432f',
  }
})

const foglio = computed(() => { tic.value; return corsa.value?.foglio || null })

const nemico = computed(() => {
  const f = foglio.value
  if (!f || f.che !== 'scontro') return null
  const c = corsa.value
  return { mostro: f.chi, colpo: c.colpo(f.chi), restano: c.colpiPer(f.chi) }
})

const zaino = computed(() => {
  tic.value
  const c = corsa.value
  if (!c) return null
  const voce = k => (k ? { chiave: k, ...COSE[k] } : null)
  return {
    mano: voce(c.mano), corpo: voce(c.corpo),
    tasche: Array.from({ length: TASCHE }, (_, i) => voce(c.zaino[i])),
  }
})

const merce = computed(() => {
  const f = foglio.value
  if (!f || f.che !== 'mercante') return []
  return (f.chi.roba || []).map(k => ({
    chiave: k, ...COSE[k], posso: corsa.value.gemme >= COSE[k].prezzo,
  }))
})

const segno = computed(() => {
  const f = foglio.value
  return f && f.che === 'porta' ? SEGNI[f.chi.segno] : null
})

/* ═══════════ i suoni ═══════════
   Col suono spento il gioco resta intero: qui dentro non c'è niente che
   si sappia solo sentendolo. */
const suoni = {
  passo: () => suono.nota(320, 320, 0.05, 'sine', 0.06),
  colpo: () => suono.boom(),
  ahia: () => suono.no(),
  bottino: () => suono.moneta(),
  tesoro: () => suono.livello(),
}

/* ═══════════ giocare ═══════════ */
/* Il seme dall'indirizzo (`#seme=812`), come i cheat delle monete e del
   codice dei genitori. Serve a poter dire «riaprilo col seme 812 e guarda
   la stanza in basso a destra» invece di «fidati»: senza, ogni discesa è
   un posto nuovo e non si può far vedere niente a nessuno. */
function semeDallIndirizzo() {
  const n = Number(new URLSearchParams(location.hash.slice(1)).get('seme'))
  return Number.isFinite(n) && n > 0 ? n : null
}

function avvia(i) {
  tappaIdx.value = i
  fine.value = null
  domanda.value = null
  zainoAperto.value = false
  corsa.value = new Corsa(CAMPAGNA[i], { seme: semeDallIndirizzo() })
  suono.nota(180, 90, 0.4, 'sawtooth', 0.12)
  nextTick(() => accendi())
}

function accendi() {
  if (!tela.value || !corsa.value) return
  if (!pittore) pittore = new Tela(tela.value)
  pittore.misura()
  pittore.segui(corsa.value.livello, corsa.value.eroe.x, corsa.value.eroe.y)
  pittore.avvia()
  giro()
}

/* ── il giro ──
   Il tempo lo tiene questo file, non il motore: `passo(dt)` è una
   funzione pura di quanto tempo è passato, e per questo il banco di
   prova può farla girare mille volte in un millisecondo. */
/* Quanto schermo copre il foglio in questo momento, misurato sul foglio
   vero e non indovinato: la telecamera centra l'eroe in quello che resta.
   Una quota fissa non funziona — un foglio con dentro una domanda
   disegnata è alto il doppio di uno con due righe di testo, e la cosa
   che si sta guardando finisce sotto il pannello proprio mentre serve.
   Si rilegge ogni sei fotogrammi: è una misura del DOM, non un conto.

   Lo scontro non è più fra questi: sta al centro (`.sot-velo`), non
   porta la classe `.sot-foglio`, e quindi qui misura zero e la
   telecamera resta ferma. È voluto — muovere la scena mentre comincia
   una battaglia era la metà peggiore del problema. */
let altoFoglio = 0, contaGiri = 0
function misuraFoglio() {
  const f = document.querySelector('.sot-foglio')
  altoFoglio = f ? f.getBoundingClientRect().height : 0
}

let raf = 0, prima = 0
function giro() {
  cancelAnimationFrame(raf)
  prima = performance.now()
  const passo = ora => {
    raf = requestAnimationFrame(passo)
    const dt = Math.min(0.05, (ora - prima) / 1000)
    prima = ora
    orologio += dt
    const c = corsa.value
    if (!c || c.finita) return
    c.passo(dt)
    /* col foglio aperto la telecamera alza l'eroe, così la porta o il
       forziere di cui si sta leggendo restano visibili sopra il
       pannello (lo scontro no: quello sta al centro e non chiede spazio) */
    if ((contaGiri++ % 6) === 0) misuraFoglio()
    pittore.segui(c.livello, c.eroe.x, c.eroe.y, altoFoglio)
    pittore.mostra({ corsa: c, orologio })
    guarda(c)
  }
  raf = requestAnimationFrame(passo)
}

/* Cosa è cambiato di quello che si vede. Un `tic` a ogni fotogramma
   farebbe ricalcolare mezza schermata sessanta volte al secondo per
   niente: si confronta una firma corta e si batte solo quando serve. */
let firma = ''
function guarda(c) {
  const f = `${c.vita}|${c.gemme}|${c.foglio ? c.foglio.che : '-'}|${c.chiesta ? c.chiesta.id : 0}` +
            `|${c.piano}|${c.zaino.length}|${c.mano}|${c.corpo}|${c.chiaveDelPiano}|${c.finita}`
  if (f !== firma) { firma = f; tic.value++ }
  if (c.avvisi.length) {
    avviso.value = c.avvisi.shift()
    ultimoAvviso = orologio
  } else if (avviso.value && orologio - ultimoAvviso > 1.8) avviso.value = ''
}

/* ═══════════ la domanda ═══════════
   L'unico punto del gioco in cui si nomina un quiz.

   `tic` non è di contorno, è **la dipendenza**: la corsa sta in uno
   `shallowRef`, quindi Vue non guarda dentro e `corsa.value.chiesta`
   cambia senza dire niente a nessuno. Senza il `tic` in cima, questo
   watcher scatterebbe solo quando nasce una corsa nuova — cioè la
   domanda non comparirebbe **mai**, e il gioco resterebbe fermo su un
   foglio vuoto senza un errore da nessuna parte. Si è visto giocandolo,
   non leggendolo. */
watch(() => { tic.value; return corsa.value?.chiesta?.id }, (id) => {
  if (!id) { domanda.value = null; return }
  const chiesta = corsa.value.chiesta
  try {
    const q = domandaPerGioco({ difficolta: chiesta.difficolta, evita: ultimoModulo })
    if (!q?.domanda) throw new Error('nessun modulo di quiz')
    ultimoModulo = q.modulo
    domanda.value = q
  } catch (e) {
    /* senza moduli non si blocca un bambino davanti a una porta: si apre
       e via. È l'unico caso in cui una domanda vale sì. */
    domanda.value = null
    risolvi(true)
  }
})

function risposto({ giusto }) {
  domanda.value = null
  risolvi(giusto)
}

function risolvi(giusto) {
  const c = corsa.value
  if (!c) return
  const esito = c.rispondi(giusto)
  tic.value++
  if (!esito) return
  scosso.value++
  switch (esito.che) {
    case 'colpo': suoni.colpo(); break
    case 'caduto': suoni.colpo(); setTimeout(() => suoni.bottino(), 260); break
    case 'ferito': suoni.ahia(); break
    case 'svenuto': suono.fine(); break
    case 'tesoro': suoni.tesoro(); break
    case 'aperta': suono.ok(); break
    case 'bevuto': suoni.tesoro(); break
    default: suono.no()
  }
}

/* ═══════════ i tasti dei fogli ═══════════ */
function scappa() { corsa.value.scappa(); domanda.value = null; tic.value++; suoni.passo() }
function chiudiFoglio() { corsa.value.chiudi(); domanda.value = null; tic.value++ }
function riprendi() { corsa.value.riprendi(); tic.value++ }
function compra(k) { const e = corsa.value.compra(k); tic.value++; if (e?.che === 'comprato') suono.compra() }
function usa(i) { corsa.value.usa(i); tic.value++; suono.ok() }

function scendi() {
  const e = corsa.value.scendi()
  tic.value++
  if (e?.che === 'finita') return chiudi()
  suono.livello()
}

/* ═══════════ com'è finita ═══════════ */
function chiudi() {
  const c = corsa.value
  if (!c) return
  if (!c.finita) c.risali()
  const e = c.esito
  const stelle = stelleDella(e)

  /* prima l'avanzamento, poi i contatori: i traguardi si controllano
     dentro `segna()` e devono vedere la tappa già segnata come fatta */
  if (e.vinta) completa(CHIAVE, tappaIdx.value, QUANTE_TAPPE, { stelle })

  /* i contatori si muovono a fine discesa, non stanza per stanza:
     salvare venti volte per partita non aggiunge niente e costa a ogni
     tocco */
  segna('sotStanze', e.stanze)
  segna('sotPiani', e.piani)
  if (e.mostri) segna('sotMostri', e.mostri)
  if (e.tesori) segna('sotTesori', e.tesori)
  segnaBest('sotGemme', e.gemme)

  const monete = e.vinta ? CAMPAGNA[tappaIdx.value].premio * Math.max(1, stelle) : 0
  if (monete) addCoins(monete)
  if (e.vinta) { if (e.svenimenti === 0) segna('sotInteri'); suono.livello() } else suono.fine()

  fine.value = { vinta: e.vinta, titolo: CAMPAGNA[tappaIdx.value].nome, stelle, monete, fatti: e }
}

function ancora() {
  const vinta = fine.value.vinta
  fine.value = null
  if (vinta) return allaMappa()
  avvia(tappaIdx.value)
}

function allaMappa() {
  cancelAnimationFrame(raf)
  if (pittore) pittore.ferma()
  fine.value = null
  domanda.value = null
  corsa.value = null
}

function indietro() {
  if (!corsa.value && !fine.value) return emit('vai', 'home')
  /* Chi esce senza aver fatto niente non si merita un cartello che gli
     dice che è tornato su a mani vuote: si era solo affacciato. Il
     cartello serve a raccontare com'è andata, e se non è andata niente
     non c'è niente da raccontare. */
  if (corsa.value && !fine.value && !corsa.value.finita) {
    const e = corsa.value.esito
    if (!e.domande && !e.piani) return allaMappa()
    return chiudi()
  }
  allaMappa()
}

/* ═══════════ il dito ═══════════ */
const dita = new Map()
let pizzico = 0, premuto = false, giu = null, ultimoTrascina = 0

function punto(e) {
  const r = tela.value.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function premi(e) {
  dita.set(e.pointerId, e)
  if (corsa.value?.foglio || zainoAperto.value || fine.value) return
  if (dita.size > 1) { premuto = false; return }
  premuto = true
  giu = { x: e.clientX, y: e.clientY }
  tela.value.setPointerCapture?.(e.pointerId)
  vai(punto(e), true)
}

/* Tenendo premuto e trascinando, l'eroe insegue il dito: è il modo di
   girare in un posto grande senza toccare quaranta volte. Si ricalcola
   di rado apposta — a ogni fotogramma il percorso tremerebbe e il passo
   verrebbe a scatti. */
function muovi(e) {
  if (dita.has(e.pointerId)) dita.set(e.pointerId, e)
  if (dita.size === 2) return pizzica()
  if (!premuto || corsa.value?.foglio) return
  if (giu && Math.hypot(e.clientX - giu.x, e.clientY - giu.y) < FERMO_PX) return
  const ora = performance.now()
  if (ora - ultimoTrascina < 140) return
  ultimoTrascina = ora
  vai(punto(e), false)
}

function pizzica() {
  premuto = false                                   // due dita non camminano
  const [a, b] = [...dita.values()]
  const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  if (!pizzico) { pizzico = d; return }
  if (Math.abs(d - pizzico) < 45) return
  if (pittore.zoomA(pittore.scala + (d > pizzico ? 1 : -1))) suoni.passo()
  pizzico = d
}

function lascia(e) {
  if (e.pointerType !== 'mouse') zittisciIlFantasma(e.clientX, e.clientY)
  dita.delete(e.pointerId)
  if (dita.size < 2) pizzico = 0
  premuto = false
  giu = null
}

/* Il click che il dito si lascia dietro va ingoiato prima che arrivi a
   un tasto del foglio appena comparso. */
function zittisciIlFantasma(x, y) {
  const t0 = performance.now()
  const smetti = () => removeEventListener('click', zitto, true)
  const zitto = ev => {
    if (performance.now() - t0 > FANTASMA_MS) return smetti()
    if (Math.hypot(ev.clientX - x, ev.clientY - y) > FANTASMA_PX) return
    ev.stopPropagation(); ev.preventDefault(); smetti()
  }
  addEventListener('click', zitto, true)
  setTimeout(smetti, FANTASMA_MS + 20)
}

function vai(p, preciso) {
  const c = corsa.value
  if (!c || c.finita) return
  c.vaiVerso(pittore.cellaDa(p.x, p.y), preciso)
  tic.value++
}

function rotella(e) {
  if (!pittore) return
  pittore.zoomA(pittore.scala + (e.deltaY < 0 ? 1 : -1))
}

function nienteClickDalCampo(e) { if (e.cancelable) e.preventDefault() }

onMounted(() => { addEventListener('resize', ridimensiona) })
onUnmounted(() => {
  removeEventListener('resize', ridimensiona)
  cancelAnimationFrame(raf)
  if (pittore) pittore.ferma()
})
function ridimensiona() { if (pittore) pittore.misura() }
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" :monete="!corsa" scura @indietro="indietro">
      <button v-if="corsa && eroe" class="sot-io" data-azione="zaino"
              aria-label="lo zaino" @click="zainoAperto = true">
        <span class="sot-polso" :style="{ '--sot-polso': eroe.polso }">
          <i :style="{ width: eroe.quota * 100 + '%' }"></i>
          <b>{{ eroe.vita }}</b>
        </span>
        <span class="sot-n em">⚔️<b>{{ eroe.att }}</b></span>
        <span class="sot-n em">🛡️<b>{{ eroe.dif }}</b></span>
        <span class="sot-n em">💎<b>{{ eroe.gemme }}</b></span>
        <span class="sot-n em">🎒</span>
      </button>
    </Barra>

    <div class="sot">
      <Campagna v-if="!corsa" :tappe="tappe" @gioca="avvia" />

      <template v-else>
        <div class="sot-campo">
          <!-- il campo si tocca coi puntatori: un click qui sotto non
               serve mai a nessuno, e quello che il dito si lascia dietro
               finirebbe sul foglio appena aperto -->
          <canvas ref="tela" class="sot-tela"
                  @pointerdown="premi" @pointermove="muovi" @pointerup="lascia"
                  @pointercancel="lascia" @touchend="nienteClickDalCampo"
                  @wheel.prevent="rotella"></canvas>

          <p class="sot-piede">
            piano {{ eroe.piano }} di {{ eroe.piani }} ·
            <span v-if="eroe.chiave" class="em">🗝️ la scala è aperta</span>
            <span v-else>la chiave ce l'ha qualcuno, qua sotto</span>
          </p>
          <p v-if="avviso" class="sot-avviso">{{ avviso }}</p>
        </div>

        <!-- ═══ lo scontro: al centro, non dal basso ═══
             Gli altri fogli salgono dal basso e lasciano vedere il campo,
             che è giusto: ci si sta decidendo se aprire una porta, e la
             caverna intorno è metà della decisione. Una battaglia no. Un
             mostro addosso arriva **mentre si cammina**, quindi il foglio
             compariva in fondo allo schermo, dove chi stava guardando il
             proprio eroe non lo vedeva affatto; e per non lasciarlo
             sotto il pannello la telecamera si spostava — cioè la scena
             si muoveva da sola nel momento peggiore. Al centro il mostro
             è dove stanno già gli occhi e niente si sposta.

             Non porta la classe `sot-foglio` apposta: `misuraFoglio()`
             cerca quella, e non trovandola la telecamera smette da sé di
             fare spazio a un pannello che spazio non ne chiede. -->
        <div v-if="foglio && foglio.che === 'scontro'" class="sot-velo">
          <div class="sot-modale">
            <Scontro v-bind="nemico" :scosso="scosso" />
            <div v-if="domanda" class="sot-domanda">
              <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                       :origine="domanda" gioco="sotterraneo" :respiro="900"
                       @risposto="risposto" />
            </div>
            <button class="sot-grosso sot-chiaro" data-azione="scappa" @click="scappa">
              <span class="em">🏃</span> scappo via
            </button>
          </div>
        </div>

        <Foglio v-else-if="foglio && foglio.che === 'porta'" em="🚪" titolo="Una porta chiusa"
                :dice="segno ? segno.em + ' ' + segno.dice : ''">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            ci torno dopo
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'forziere'" em="🎁" titolo="Un forziere"
                dice="Una domanda sola. Se la sbagli, resta chiuso per sempre.">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            non me la sento
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'fonte'" em="⛲" titolo="Una fonte"
                dice="Acqua pulita. Rispondi e bevi.">
          <div v-if="domanda" class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori"
                     :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="risposto" />
          </div>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            più tardi
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'mercante'" em="🧙" titolo="Il mercante"
                :dice="`Hai 💎 ${eroe.gemme}. Quello che compri finisce nello zaino.`">
          <Mercante :roba="merce" :gemme="eroe.gemme" @compra="compra" @chiudi="chiudiFoglio" />
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'chiusa'" em="🔒" titolo="La scala è chiusa"
                :dice="foglio.visto && foglio.chi
                  ? `Un cancello di ferro. La chiave ce l'ha ${foglio.chi.nome.toLowerCase()}, ed è segnato in oro sulla mappina.`
                  : 'Un cancello di ferro, e la serratura non ha buco per le dita. La chiave ce l\'ha qualcuno, qua sotto.'">
          <button class="sot-grosso" data-azione="cerca" @click="chiudiFoglio">
            vado a cercarla
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'scala'" em="🕳️" titolo="La scala che scende"
                :dice="foglio.ultimo
                  ? 'Da qui si risale, e quello che hai trovato resta la tua storia.'
                  : 'Sotto è più buio, i mostri hanno più ossa e le domande si fanno toste. Quello che hai addosso scende con te.'">
          <button class="sot-grosso" data-azione="scendi" @click="scendi">
            {{ foglio.ultimo ? 'esco dal sotterraneo' : `scendo al piano ${eroe.piano + 1}` }}
          </button>
          <button class="sot-grosso sot-chiaro" data-azione="dopo" @click="chiudiFoglio">
            prima giro ancora
          </button>
        </Foglio>

        <Foglio v-else-if="foglio && foglio.che === 'svenuto'" em="💫"
                titolo="Ti sei svegliato all'ingresso"
                dice="Qualcuno ti ha trascinato fuori. Le gemme che avevi in tasca non ci sono più, ma quello che avevi addosso sì.">
          <button class="sot-grosso" data-azione="riprendi" @click="riprendi">riprovo</button>
        </Foglio>

        <Foglio v-else-if="zainoAperto" em="🎒" titolo="Lo zaino">
          <Zaino v-bind="zaino" :att="eroe.att" :dif="eroe.dif" :gemme="eroe.gemme"
                 :piano="eroe.piano" :piani="eroe.piani"
                 @usa="usa" @chiudi="zainoAperto = false" />
        </Foglio>

        <Fine v-if="fine" v-bind="fine" @ancora="ancora" @esci="allaMappa" />
      </template>
    </div>
  </div>
</template>
