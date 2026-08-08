<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL LABORATORIO DELLE POZIONI — le misure diventano un gesto.

   La ricetta è scritta in unità grandi (0,75 l), gli attrezzi del banco
   sono tarati in unità piccole (ml): la conversione non è una domanda a
   cui rispondere, è il modo di usare l'attrezzo.

     🫗 versa   tieni premuto per riempire in fretta, poi la goccia fine
     ⚖️ pesa    metti i pesi sul piatto finché fanno la quantità
     ✂️ taglia  trascini la lama sul righello e tagli

   Si sbaglia col troppo: la boccia trabocca e la pozione fa BOOM. Non
   costa una vita — costa tempo, e il tempo è il vero avversario.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { state, answer, level, addCoins, segna, segnaBest, strengthOf,
         difficoltaOra, labProgresso, labCompleta, tappaAperta } from '../store/profile.js'
import { generaRicetta, taratura, scomponi, mescola, laboratorioLibero, premioTappa,
         ATTREZZI, vaBene, SCALINI, TAPPE, CUORI, CUORI_MAX } from '../data/pozioni.js'
import { suono } from '../audio.js'
import Barra from '../components/Barra.vue'

defineEmits(['vai'])

const PER_MONETA = 2            // nel libero: una moneta ogni due pozioni
const SERIE_CUORE = 5           // nel libero: cinque perfette di fila ridanno un cuore
const VOLO = 480                // quanto ci mette l'ingrediente ad arrivare nel paiolo
const fase = ref('mappa')       // mappa | gioco | vinta | trionfo | fine
const ricetta = ref(null)
const hud = reactive({ cuori: CUORI, pozioni: 0, perfette: 0, serie: 0 })

/* ═══════════ la campagna ═══════════
   Otto tappe: la prima chiede solo di pesare, l'ultima tutte e nove le
   conversioni insieme. Finita la fila si apre il laboratorio libero, ed è
   l'unico posto dove a decidere quanto strizzare torna a essere il motore
   di apprendimento invece del punto del viaggio. */
const progresso = computed(() => labProgresso())
const tappaIdx = ref(0)                     // -1 = laboratorio libero
const campagna = computed(() => tappaIdx.value >= 0)
const sbloccata = i => tappaAperta(i, progresso.value.tappa)
const nCliente = ref(0)                     // quale cliente della tappa
const premio = ref(0)
/* ---------- il calderone ---------- */
const brodo = ref([])           // gli ingredienti già finiti dentro
const ribolle = ref(false)      // il ribollire forte dei primi istanti
const pronta = ref(false)       // la pozione è finita: il colore diventa il suo
const volo = ref(null)          // l'ingrediente in aria fra il banco e il paiolo
const BOLLE = [0, 1, 2, 3, 4, 5, 6]
const passo = ref(0)            // indice dell'ingrediente su cui si sta lavorando
const dose = ref(0)             // quanto c'è nell'attrezzo adesso
const pesati = ref([])          // i pesi messi sul piatto
const versando = ref(false)
const strumento = ref(null)     // null = si è ancora davanti allo scaffale
const aiuto = ref(false)        // la scala delle misure appesa al muro
let grezzo = 0                  // il livello continuo prima dello scatto di tacca
const esito = ref('')           // '' | 'boom' | 'ok'
const battuta = ref('')
const cartello = ref('')        // la mancia, quando arriva
const moneta = ref(0)
const restaPazienza = ref(0)
let raf = 0, ultimo = 0, apertoIl = 0, occupato = false, sbagli = 0, dettoFretta = false

/* Nel libero quanto strizzare lo chiede al motore comune, come tutti gli
   altri giochi: chi ha già convertito litri per mezz'ora non riparte da capo
   solo perché ha chiuso la scheda. In campagna invece decide la tappa —
   se no «la quarta è più dura della terza» non sarebbe vero per tutti. */
const livello = computed(() => difficoltaOra('misure'))
const tappa = computed(() =>
  campagna.value ? TAPPE[tappaIdx.value] : laboratorioLibero(livello.value))
const ing = computed(() => ricetta.value?.ingredienti[passo.value] || null)
const attrezzo = computed(() => (ing.value ? ATTREZZI[ing.value.scala.tipo] : null))
const finiti = computed(() => ricetta.value?.ingredienti.filter(i => i.fatto).length || 0)

const pick = a => a[Math.floor(Math.random() * a.length)]
const ORDINA = ['Mi serve una…', 'Preparami…', 'Vorrei…', 'Presto, una…']
/* il cliente esigente si annuncia da sé: chi arriva in carrozza vuole la
   pozione fatta bene, e paga */
const PRETESE = ['La voglio perfetta.', 'Niente errori, mago.', 'Ti pago bene…',
                 'Vediamo se sei bravo.']
const GRAZIE = ['Impeccabile! 👑', 'Tieni la mancia!', 'Sei un maestro!']
const BENE   = ['Perfetta! ✨', 'Che meraviglia!', 'Grazie mago!', 'Funziona!']
const MALE   = ['Ahia!', 'Che disastro…', 'Ricomincia…', 'Puzza di bruciato']
const FRETTA = ['Fai in fretta…', 'Quanto manca?', 'Uhm…']
const VIA    = ['Me ne vado!', 'Troppo lento!', 'Vado da un altro mago!']
const SBAGLIATO = ['Con quello non ci arrivi…', 'Serve un altro attrezzo!', 'Non è lo strumento giusto']

/* ---------- il totale nell'attrezzo, qualunque esso sia ---------- */
const dentro = computed(() => {
  if (!ing.value) return 0
  return ing.value.scala.tipo === 'polvere'
    ? pesati.value.reduce((s, p) => s + p, 0)
    : dose.value
})
/* non c'è tolleranza: la dose o è quella o non è quella. Il versare scatta di
   tacca in tacca proprio perché la dose esatta sia sempre raggiungibile. */
const troppo = computed(() => !!ing.value && dentro.value > ing.value.piccolo)
/* le tacche dello strumento scelto, non della dose: è tutta la differenza */
const S = computed(() => strumento.value)
function scegliStrumento(a) { strumento.value = a; dose.value = 0; grezzo = 0; pesati.value = [] }
function riponi() { strumento.value = null; svuota() }

/* ═══════════ il calderone ═══════════
   Il colore di quello che bolle è la mescolanza vera degli ingredienti già
   versati: il giallo delle stelle tritate nel blu dell'acqua di sirena fa
   verde. È l'unico posto del gioco che non chiede niente e non conta niente:
   serve solo a far vedere che quella dose è servita a qualcosa. */
const colore = computed(() =>
  pronta.value && ricetta.value ? ricetta.value.colore : mescola(brodo.value.map(g => g.colore)))

/* l'ingrediente parte da dove si stava dosando e cade nel paiolo: le due
   posizioni si chiedono al documento, perché il banco cambia forma a seconda
   dell'attrezzo e a occhio si sbaglierebbe di venti pixel */
function tuffo(i) {
  const p = document.querySelector('.paiolo')?.getBoundingClientRect()
  const b = document.querySelector('.banco')?.getBoundingClientRect()
  if (!p || !b) return
  const x = b.left + b.width / 2, y = b.top + 34
  volo.value = { emoji: i.emoji, x, y,
                 dx: p.left + p.width / 2 - x, dy: p.top + p.height * 0.16 - y }
  setTimeout(() => (volo.value = null), VOLO)
}

/* il gorgoglio: una nota bassa che scende e un fruscio d'acqua */
function gluglu() {
  suono.nota(320, 150, 0.2, 'sine', 0.1)
  suono.rumore(0.34, 0.05, 480, 130)
}

/* ═══════════ la giornata ═══════════ */

/* La mano del motore di apprendimento, e **solo nel laboratorio libero**:
   fra le conversioni esce quella che si sa peggio, con un pizzico di caso
   perché non diventi un interrogatorio sempre sullo stesso scalino. */
function piuDebole(scale) {
  let peggio = scale[0], meno = Infinity
  for (const s of scale) {
    const f = strengthOf('pozioni:' + s.id) + Math.random() * 0.8
    if (f < meno) { meno = f; peggio = s }
  }
  return peggio
}

function nuovaRicetta() {
  ricetta.value = generaRicetta(tappa.value,
    campagna.value ? { n: nCliente.value } : { pesca: piuDebole })
  restaPazienza.value = ricetta.value.pazienza
  passo.value = 0; dose.value = 0; grezzo = 0; pesati.value = []; strumento.value = null
  esito.value = ''; sbagli = 0; occupato = false; dettoFretta = false
  brodo.value = []; pronta.value = false; ribolle.value = false; volo.value = null
  apertoIl = performance.now()
  battuta.value = pick(ricetta.value.esigente ? PRETESE : ORDINA)
}

function inizia(i = tappaIdx.value) {
  if (i >= 0 && !sbloccata(i)) return
  tappaIdx.value = i
  hud.cuori = CUORI; hud.pozioni = 0; hud.perfette = 0; hud.serie = 0
  nCliente.value = 0; premio.value = 0
  fase.value = 'gioco'
  nuovaRicetta()
  ultimo = 0
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(ciclo)
}

const allaMappa = () => {
  cancelAnimationFrame(raf)
  fase.value = 'mappa'
  tappaIdx.value = Math.min(TAPPE.length - 1, progresso.value.tappa)
}

function ciclo(ts) {
  const dt = Math.min(0.05, (ts - ultimo) / 1000 || 0); ultimo = ts
  if (fase.value === 'gioco') {
    if (versando.value && ing.value) {
      // la boccia si riempirebbe tutta in cinque secondi, ma il livello scatta
      // di tacca in tacca: si versa in fretta, e la dose esatta resta possibile
      const a = S.value
      grezzo = Math.min(a.cap * 1.2, grezzo + a.cap * dt / 5)
      dose.value = Math.floor(grezzo / a.grana + 1e-9) * a.grana
      if (troppo.value) trabocca()
    }
    if (!occupato) {
      restaPazienza.value -= dt
      if (!dettoFretta && barra.value < 32) { dettoFretta = true; battuta.value = pick(FRETTA) }
      if (restaPazienza.value <= 0) scaduta()
    }
  }
  raf = requestAnimationFrame(ciclo)
}

const barra = computed(() => Math.max(0, Math.min(100,
  restaPazienza.value / (ricetta.value?.pazienza || 1) * 100)))

/* Il cliente se ne va: è l'unica cosa che costa un cuore. Il cliente dopo
   arriva comunque — la fila della tappa non si allunga per chi è lento. */
function scaduta() {
  occupato = true
  hud.serie = 0
  battuta.value = pick(VIA)
  answer(ing.value?.chiave || 'pozioni:l-ml', { correct: false, ms: performance.now() - apertoIl })
  suono.no()
  if (--hud.cuori <= 0) return chiudi()
  nCliente.value++
  if (campagna.value && nCliente.value >= tappa.value.clienti) return setTimeout(tappaVinta, 900)
  setTimeout(() => nuovaRicetta(), 900)
}

/* ═══════════ i gesti ═══════════ */

/* --- versa: si tiene premuto --- */
function giu() {
  if (occupato || esito.value || !S.value || ing.value?.scala.tipo !== 'liquido' || troppo.value) return
  grezzo = dose.value
  versando.value = true
}
function su() { versando.value = false; grezzo = dose.value }

/* la goccia fine: un solo scatto per volta, per arrivare in punta di piedi */
function goccia() {
  const a = S.value
  if (!a || occupato || esito.value) return
  dose.value = Math.round((dose.value + a.grana) / a.grana) * a.grana
  grezzo = dose.value
  suono.nota(900, 1100, 0.04, 'sine', 0.06)
  if (troppo.value) trabocca()
}

function trabocca() {
  versando.value = false
  sbagli++
  esito.value = 'boom'
  suono.no()
  restaPazienza.value = Math.max(3, restaPazienza.value - 4)
  battuta.value = pick(MALE)
  setTimeout(() => { esito.value = ''; svuota() }, 700)
}

const svuota = () => { dose.value = 0; grezzo = 0; pesati.value = [] }

/* --- pesa: si toccano i pesi --- */
function metti(p) {
  if (occupato || esito.value) return
  pesati.value.push(p)
  suono.nota(640, 820, 0.05, 'triangle', 0.08)
  if (troppo.value) trabocca()
}
const togli = () => { if (!occupato) pesati.value.pop() }

/* --- taglia: si trascina la lama --- */
function trascina(e, el) {
  if (occupato || esito.value || !S.value) return
  const r = el.getBoundingClientRect()
  const x = (e.clientX ?? e.touches?.[0]?.clientX ?? 0) - r.left
  const a = S.value
  const crudo = Math.max(0, Math.min(a.cap, x / r.width * a.cap))
  dose.value = Math.round(crudo / a.grana) * a.grana   // le tacche calamitano
}

/* --- conferma --- */
function conferma() {
  const i = ing.value
  if (!i || occupato || esito.value) return
  if (dentro.value !== i.piccolo) {
    sbagli++
    esito.value = 'boom'
    suono.no()
    restaPazienza.value = Math.max(3, restaPazienza.value - 4)
    battuta.value = vaBene(S.value, i.piccolo) ? pick(MALE) : pick(SBAGLIATO)
    setTimeout(() => { esito.value = ''; svuota() }, 700)
    return
  }
  i.fatto = true
  answer(i.chiave, { correct: sbagli === 0, ms: performance.now() - apertoIl })
  segna('misure')
  esito.value = 'ok'
  suono.nota(760, 1180, 0.1, 'triangle', 0.11)
  tuffo(i)
  // l'ingrediente entra nel paiolo quando ci arriva, non quando si conferma:
  // il colore deve cambiare sotto l'occhio di chi guarda cadere la roba
  setTimeout(() => {
    brodo.value = [...brodo.value, { emoji: i.emoji, colore: i.colore }]
    ribolle.value = true
    gluglu()
    setTimeout(() => (ribolle.value = false), 1000)
  }, VOLO)
  setTimeout(() => {
    esito.value = ''; svuota(); strumento.value = null
    const next = ricetta.value.ingredienti.findIndex(x => !x.fatto)
    if (next < 0) return finita()
    passo.value = next
  }, VOLO + 280)
}

function finita() {
  occupato = true
  const perfetta = sbagli === 0
  hud.pozioni++
  segna('pozioni')
  if (perfetta) { hud.perfette++; hud.serie++; segna('pozioniPerfette') } else hud.serie = 0
  battuta.value = pick(perfetta && ricetta.value.esigente ? GRAZIE : BENE)
  pronta.value = true              // il brodo prende il colore della pozione
  suono.moneta()

  /* La mancia del cliente esigente: servito senza un errore lascia un cuore,
     e se i cuori sono già al massimo lascia il doppio delle monete. È quello
     che rende sostenibile una tappa lunga — e il primo motivo vero per non
     sbagliare, dato che il 💥 da solo costa poco. */
  if (ricetta.value.esigente) mancia(perfetta ? 2 : 1, perfetta)
  // nel libero non ci sono clienti esigenti: il premio è la costanza
  else if (!campagna.value && perfetta && hud.serie % SERIE_CUORE === 0)
    mancia(1, true, '🔥 ' + hud.serie + ' di fila!')
  else if (!campagna.value && hud.pozioni % PER_MONETA === 0) paga(level.value)

  nCliente.value++
  if (campagna.value && nCliente.value >= tappa.value.clienti)
    return setTimeout(tappaVinta, 1400)
  setTimeout(() => nuovaRicetta(), 1400)
}

/* monete che volano via dal calderone */
function paga(n) {
  if (n <= 0) return
  addCoins(n); moneta.value = n
  setTimeout(() => (moneta.value = 0), 1100)
}

function mancia(monete, cuore, testo = '👑 Mancia!') {
  const posto = cuore && hud.cuori < CUORI_MAX
  if (posto) { hud.cuori++; suono.vita() }
  paga(level.value * (posto ? monete : monete * 2))
  cartello.value = posto ? testo + '  +1 ♥' : testo
  setTimeout(() => (cartello.value = ''), 1300)
}

/* ── fine della tappa: si è arrivati in fondo alla fila ── */
function tappaVinta() {
  cancelAnimationFrame(raf)
  segnaBest('pozioni', hud.pozioni)
  const giaFatta = progresso.value.tappa > tappaIdx.value
  labCompleta(tappaIdx.value, TAPPE.length)
  // rifare una tappa già superata paga il minimo: le monete si guadagnano
  // una volta, il ripasso vale comunque qualcosa
  premio.value = giaFatta ? 1 : level.value * premioTappa(tappaIdx.value)
  addCoins(premio.value)
  fase.value = tappaIdx.value === TAPPE.length - 1 && !giaFatta ? 'trionfo' : 'vinta'
  suono.livello()
}

function prossima() {
  if (tappaIdx.value >= TAPPE.length - 1) return allaMappa()
  inizia(tappaIdx.value + 1)
}

function chiudi() {
  fase.value = 'fine'
  cancelAnimationFrame(raf)
  segnaBest('pozioni', hud.pozioni)
  suono.fine()
}

/* ---------- disegno ---------- */
const pct = computed(() => (S.value ? Math.min(100, dentro.value / S.value.cap * 100) : 0))
const tacche = computed(() => {
  const a = S.value
  if (!a || ing.value?.scala.tipo === 'polvere') return []
  const out = []
  for (let n = 0; n <= a.tacche; n++) {
    const v = Math.round(a.grana * n * 1000) / 1000
    out.push({ v, q: n / a.tacche * 100, grande: v % a.etichetta === 0 })
  }
  return out
})

onMounted(() => {
  // si entra dalla mappa, sulla prima tappa ancora da fare
  tappaIdx.value = Math.min(TAPPE.length - 1, progresso.value.tappa)
  window.__poz = { fase, ricetta, hud, livello, inizia, passo, ing, dose, pesati, dentro,
                   strumento, scegliStrumento, riponi, vaBene, aiuto, SCALINI,
                   metti, togli, conferma, svuota, giu, su, goccia,
                   versa: v => { dose.value = v; grezzo = v },
                   esito, battuta, restaPazienza, scomponi, taratura, finiti, troppo,
                   brodo, colore, pronta, mescola,
                   TAPPE, tappa, tappaIdx, campagna, nCliente, progresso, sbloccata,
                   premio, cartello, allaMappa, prossima }
})
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="schermo lab">
    <!-- In partita le monete se ne vanno dalla barra: qui non si spende, e su
         un telefono stretto lo slot in mezzo si accorcia finché i cuori non
         restano fuori — che è l'unica cosa che non può mancare. Le pozioni
         perfette si contano nella schermata finale. -->
    <Barra titolo="Pozioni" scura :monete="fase !== 'gioco'"
           @indietro="fase === 'gioco' ? allaMappa() : $emit('vai','home')">
      <template v-if="fase === 'gioco'">
        <div class="gettone">{{ '❤️'.repeat(Math.max(0, hud.cuori)) || '💔' }}</div>
        <div class="gettone" v-if="campagna">🧍 <b>{{ nCliente + 1 }}/{{ tappa.clienti }}</b></div>
        <div class="gettone" v-else>🧪 <b>{{ hud.pozioni }}</b></div>
      </template>
      <button class="tondo" title="scala delle misure" @click="aiuto = !aiuto">🪜</button>
    </Barra>

    <!-- ═════ LA SCALA DELLE MISURE ═════ -->
    <div v-if="aiuto" class="muro" @click="aiuto = false">
      <div class="cartellone" @click.stop>
        <b>La scala delle misure</b>
        <p>Ogni scalino vale <em>×10</em>. Da un'unità all'altra conta gli scalini.</p>
        <div v-for="r in SCALINI" :key="r.nome" class="riga-scala">
          <span class="fam">{{ r.nome }}</span>
          <div class="gradini">
            <template v-for="(u, n) in r.unita" :key="u">
              <i v-if="n" class="per">×10</i>
              <span class="u" :class="{ ora: ing && (ing.scala.da === u || ing.scala.a === u) }">{{ u }}</span>
            </template>
          </div>
        </div>
        <button class="bottone chiaro piccolo" @click="aiuto = false">chiudi</button>
      </div>
    </div>

    <!-- ═════ LA MAPPA DELLE TAPPE ═════
         Si entra da qui: la fila delle otto tappe, quelle fatte, quella da
         fare e quelle ancora chiuse. Il laboratorio libero compare in fondo
         solo quando la fila è finita. -->
    <div v-if="fase === 'mappa'" class="mappa">
      <h1>Il laboratorio<br><span>delle pozioni</span></h1>
      <p class="testo">La ricetta parla di chili, metri e litri. Gli attrezzi del banco
        contano in grammi, centimetri e millilitri: sta a te tradurre.</p>
      <div class="tappe">
        <button v-for="(t, i) in TAPPE" :key="t.id" class="tappa" :data-tappa="t.id"
                :class="{ chiusa: !sbloccata(i), fatta: i < progresso.tappa, ora: i === progresso.tappa }"
                @click="inizia(i)">
          <span class="ico">{{ t.emoji }}</span>
          <span class="che">
            <b>{{ i + 1 }}. {{ t.nome }}</b>
            <i>{{ t.dritta }}</i>
          </span>
          <span class="stato">{{ !sbloccata(i) ? '🔒' : i < progresso.tappa ? '✅' : '▶' }}</span>
        </button>
        <button v-if="progresso.libera" class="tappa libera" data-tappa="libero" @click="inizia(-1)">
          <span class="ico">♾️</span>
          <span class="che">
            <b>Laboratorio libero</b>
            <i>Clienti a non finire, e tocca a te fin dove reggi.</i>
          </span>
          <span class="stato">▶</span>
        </button>
      </div>
      <p class="mini">versa tenendo premuto · pesa coi pesi · taglia sul righello</p>
    </div>

    <!-- ═════ TAPPA SUPERATA ═════ -->
    <div v-else-if="fase === 'vinta' || fase === 'trionfo'" class="centro">
      <h1 v-if="fase === 'trionfo'">Maestro<br><span>alchimista</span></h1>
      <h1 v-else>{{ tappa.emoji }}<br><span>{{ tappa.nome }}</span></h1>
      <div class="vetrina">{{ fase === 'trionfo' ? '🏆🔮🏆' : '✨🧪✨' }}</div>
      <p class="testo" v-if="fase === 'trionfo'">Tutte e nove le conversioni, senza sbagliare
        una dose. Il laboratorio libero è aperto.</p>
      <p class="testo" v-else>{{ hud.pozioni }} pozioni consegnate, {{ hud.perfette }} senza un errore.</p>
      <p class="premio" v-if="premio">+{{ premio }} 🪙</p>
      <div class="riga">
        <button v-if="fase === 'vinta'" class="bottone" @click="prossima">Tappa dopo ▶</button>
        <button v-else-if="progresso.libera" class="bottone" @click="inizia(-1)">Laboratorio libero ♾️</button>
        <button class="bottone chiaro" @click="allaMappa">Le tappe</button>
      </div>
    </div>

    <!-- ═════ GIOCO ═════ -->
    <template v-else-if="fase === 'gioco' && ricetta">
      <!-- l'ordine sta appeso in alto, il calderone sotto: così il paiolo è
           vicino al banco da cui gli si tuffa dentro la roba -->
      <div class="pergamena" :class="{ pregiata: ricetta.esigente }">
        <b>{{ ricetta.emoji }} {{ ricetta.nome }}<em v-if="ricetta.esigente"> 👑</em></b>
        <div class="voci">
          <span v-for="(i, n) in ricetta.ingredienti" :key="i.nome" class="voce"
                :class="{ fatto: i.fatto, qui: n === passo && !i.fatto }">
            {{ i.emoji }} {{ i.testo }} <i>{{ i.nome }}</i>
          </span>
        </div>
      </div>

      <!-- il cliente e il calderone -->
      <div class="scena">
        <div class="tizio" :class="{ pregiato: ricetta.esigente }">
          <div class="fumetto" :key="battuta">{{ battuta }}</div>
          <div class="chi">{{ ricetta.cliente }}</div>
          <div class="pazienza"><i :style="{ width: barra + '%',
               background: barra < 30 ? '#ef5f5f' : barra < 60 ? '#ffc93c' : '#38c172' }"></i></div>
        </div>

        <!-- ═════ IL CALDERONE ═════
             Quello che bolle dentro è la somma di quello che ci è stato
             messo: colore mescolato, bolle che salgono, e gli ingredienti
             che galleggiano lì a dire «ci sono anch'io». -->
        <div class="paiolo" :class="{ ribolle, pronta }" :style="{ '--p': colore }">
          <div class="pentola"></div>
          <div class="brodo">
            <span v-for="b in BOLLE" :key="b" class="bollicina"
                  :style="{ left: 9 + b * 12.5 + '%', '--r': (b % 3) * .37 + 's',
                            '--s': 6 + (b % 4) * 3 + 'px' }"></span>
          </div>
          <i class="labbro"></i>
          <div class="vapore"><span v-for="v in 3" :key="v" :style="{ '--r': v * .9 + 's',
               left: 22 + v * 22 + '%' }"></span></div>
          <span v-for="(g, n) in brodo" :key="n" class="galleggia"
                :style="{ left: 24 + n * 22 + '%', '--r': n * .5 + 's' }">{{ g.emoji }}</span>
          <div class="fuoco"><span v-for="f in 3" :key="f" :style="{ '--r': f * .23 + 's' }">🔥</span></div>
          <div v-if="pronta" class="nata">{{ ricetta.emoji }}</div>
        </div>
      </div>

      <!-- l'ingrediente che vola dal banco al calderone -->
      <div v-if="volo" class="volo" :style="{ '--x': volo.x + 'px', '--y': volo.y + 'px',
           '--dx': volo.dx + 'px', '--dy': volo.dy + 'px' }">{{ volo.emoji }}</div>

      <!-- ═════ IL BANCO ═════ -->
      <div class="banco" v-if="ing" :class="['t-' + ing.scala.tipo, esito]">
        <div class="cartello">
          <b>{{ attrezzo.verbo }} {{ ing.testo }}</b>
          <span class="di">di {{ ing.nome }}</span>
        </div>

        <!-- ---------- LO SCAFFALE: prima si sceglie l'attrezzo ---------- -->
        <div v-if="!strumento" class="attrezzo scaffale">
          <button v-for="a in ing.attrezzi" :key="a.nome" class="scelta"
                  :data-str="a.nome" @click="scegliStrumento(a)">
            <span class="fig">{{ a.emoji }}</span>
            <!-- capienza come la direbbe una persona (2 m), tacche nell'unità
                 con cui si dosa (5 cm): il ×100 fra le due è il gioco -->
            <span class="targa">
              <b>{{ a.nome }}</b>
              <i>fino a {{ a.quanto.v }} {{ a.quanto.u }}<br>
                {{ ing.scala.tipo === 'polvere' ? 'pesi' : 'tacche' }} da {{ a.grana }} {{ a.unita }}</i>
            </span>
          </button>
        </div>

        <!-- ---------- 🫗 VERSA ---------- -->
        <div v-else-if="ing.scala.tipo === 'liquido'" class="attrezzo versa">
          <div class="colonna">
            <div class="boccia">
              <div class="onda" :style="{ height: pct + '%', background: ing.colore }"></div>
              <i v-for="t in tacche" :key="t.v" class="tacca" :class="{ big: t.grande }"
                 :style="{ bottom: t.q + '%' }"><em v-if="t.grande">{{ t.v }}</em></i>
            </div>
            <div class="lettura">{{ Math.round(dentro) }} <i>{{ ing.scala.a }}</i></div>
          </div>
          <div class="comandi">
            <button class="versare" @pointerdown.prevent="giu" @pointerup="su"
                    @pointerleave="su" @pointercancel="su">🫗<b>tieni premuto</b></button>
            <button class="goccia" @click="goccia">💧<b>+{{ strumento.grana }} {{ ing.scala.a }}</b></button>
          </div>
        </div>

        <!-- ---------- ⚖️ PESA ---------- -->
        <div v-else-if="ing.scala.tipo === 'polvere'" class="attrezzo pesa">
          <div class="bilancia">
            <div class="sacco">{{ ing.emoji }}</div>
            <div class="piatto">
              <span v-for="(p, n) in pesati" :key="n" class="peso"
                    :style="{ '--h': 15 + Math.min(30, Math.log2(p) * 5) + 'px' }">{{ p }}</span>
              <span v-if="!pesati.length" class="vuoto">piatto vuoto</span>
            </div>
            <div class="asta"></div>
            <div class="stelo"></div>
            <div class="base"></div>
          </div>
          <div class="lettura">{{ dentro }} <i>{{ ing.scala.a }}</i></div>
          <div class="pesiera">
            <button v-for="p in strumento.pesi" :key="p" class="pesetto" @click="metti(p)">{{ p }}</button>
            <button v-if="pesati.length" class="pesetto annulla" @click="togli">↶</button>
          </div>
        </div>

        <!-- ---------- ✂️ TAGLIA ---------- -->
        <div v-else class="attrezzo taglia">
          <div class="righello"
               @pointerdown.prevent="e => trascina(e, e.currentTarget)"
               @pointermove="e => e.buttons && trascina(e, e.currentTarget)">
            <div class="intero"></div>
            <div class="pezzo" :style="{ width: pct + '%', background: ing.colore }">
              <span class="punta">{{ ing.emoji }}</span>
            </div>
            <i v-for="t in tacche" :key="t.v" class="segno" :class="{ big: t.grande }"
               :style="{ left: t.q + '%' }"><em v-if="t.grande">{{ t.v }}</em></i>
            <div class="lama" :style="{ left: pct + '%' }"></div>
          </div>
          <div class="lettura">{{ dentro }} <i>{{ ing.scala.a }}</i></div>
        </div>

        <div class="azioni" v-if="strumento">
          <button class="bottone chiaro piccolo" @click="riponi">↺ attrezzo</button>
          <button class="bottone chiaro piccolo" @click="svuota">svuota</button>
          <button class="bottone piccolo grosso" @click="conferma">nel calderone ⤵</button>
        </div>
        <div class="azioni" v-else>
          <span class="scegli">scegli l'attrezzo giusto per {{ ing.testo }}</span>
        </div>
      </div>

      <div v-if="esito === 'boom'" class="boom">💥</div>
      <div v-if="moneta" class="moneta">+{{ moneta }} 🪙</div>
      <div v-if="cartello" class="mancia">{{ cartello }}</div>
    </template>

    <!-- ═════ FINE: i cuori sono finiti ═════ -->
    <div v-else-if="fase === 'fine'" class="centro">
      <h1>Fuoco <span>spento</span></h1>
      <p class="testo">{{ hud.pozioni }} pozioni preparate, {{ hud.perfette }} senza un errore.</p>
      <p class="mini" v-if="campagna">La tappa ricomincia da capo, ma le ricette sono nuove.</p>
      <div class="riga">
        <button class="bottone" @click="inizia()">Ancora ▶</button>
        <button class="bottone chiaro" @click="allaMappa">Le tappe</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lab { background:radial-gradient(120% 90% at 50% 0%, #3b2a55, #1e1533 70%); color:#f0e9ff }
.lab h1 { color:#fff }
.lab .testo, .lab .mini { color:#c9bde6 }

/* ---------- la mappa delle tappe ---------- */
.mappa { flex:1; min-height:0; overflow:auto; display:flex; flex-direction:column;
         align-items:center; gap:9px; padding:12px 12px calc(14px + env(safe-area-inset-bottom)) }
.mappa h1 { font-size:clamp(19px,5.4vmin,28px); text-align:center; margin:0 }
.mappa .testo { max-width:520px; text-align:center; font-size:12.5px; margin:-4px 0 0 }
.tappe { width:100%; max-width:560px; display:flex; flex-direction:column; gap:8px }
.tappa { display:flex; align-items:center; gap:11px; text-align:left; padding:10px 12px;
         border-radius:15px; background:#ffffff16; box-shadow:0 4px 0 #00000055,
         inset 0 0 0 2px #ffffff26 }
.tappa:active { transform:translateY(2px); box-shadow:0 2px 0 #00000055 }
.tappa .ico { font-size:clamp(26px,7vw,36px); line-height:1; flex:none; width:1.4em; text-align:center }
.tappa .che { flex:1; min-width:0 }
.tappa b { display:block; font-size:15px; font-weight:900; color:#fff }
.tappa i { font-style:normal; font-size:11.5px; font-weight:700; color:#c9bde6; line-height:1.25 }
.tappa .stato { font-size:19px; flex:none }
.tappa.ora { box-shadow:0 4px 0 #00000055, inset 0 0 0 3px #ffd85e }
.tappa.fatta { opacity:.72 }
.tappa.chiusa { opacity:.42; filter:grayscale(.6) }
.tappa.libera { background:linear-gradient(180deg,#ffffff26,#ffffff12) }
.premio { font-size:26px; font-weight:900; color:#ffd85e; margin:-4px 0 2px }

/* il cartello della mancia: sta in alto, dove non copre né il calderone né
   il banco, e se ne va da solo */
.mancia { position:fixed; left:50%; top:96px; transform:translateX(-50%); z-index:62;
          padding:9px 16px; border-radius:14px; white-space:nowrap;
          background:linear-gradient(180deg,#ffe9a8,#ffcf5e); color:#5a3d0a;
          font-size:17px; font-weight:900; box-shadow:0 5px 0 #00000055;
          animation:sbuca 1.3s ease-out forwards; pointer-events:none }
@keyframes sbuca { 0% { transform:translateX(-50%) scale(.5); opacity:0 }
                   18% { transform:translateX(-50%) scale(1.08); opacity:1 }
                   80% { transform:translateX(-50%) scale(1); opacity:1 }
                   100% { transform:translate(-50%,-16px) scale(.95); opacity:0 } }

/* ---------- cliente e calderone ----------
   La scena si prende tutto lo spazio che il banco non usa: il calderone è la
   cosa più grande della schermata, perché è lì che si vede il risultato.
   Il padding in cima non è decorativo: il fumetto sta sopra la testa del
   cliente, e senza spazio finirebbe dietro la barra. */
/* Il cliente sta in primo piano a sinistra, davanti al banco, e il calderone
   dietro di lui: in fila uno accanto all'altro il paiolo restava piccolo la
   metà, e il paiolo è la cosa da guardare. */
.scena { position:relative; flex:1 1 auto; min-height:0; display:flex; align-items:center;
         justify-content:center; padding:26px 10px 0 }
.tizio { position:absolute; left:6px; bottom:0; z-index:3; display:flex; flex-direction:column;
         align-items:flex-start }
.chi { font-size:clamp(40px,10vmin,68px); line-height:1; filter:drop-shadow(0 3px 6px #0009) }
.fumetto { position:absolute; left:34px; bottom:100%; white-space:nowrap; background:#fffdf7;
           color:#4b3a1f; font-size:14px; font-weight:900; padding:6px 12px; border-radius:12px;
           box-shadow:0 3px 0 #0004; animation:dice .35s cubic-bezier(.2,1.4,.4,1); z-index:2 }
@keyframes dice { from { transform:scale(.5) translateY(6px); opacity:0 } to { transform:none; opacity:1 } }
.pazienza { width:82px; height:7px; border-radius:4px; background:#ffffff26; overflow:hidden }
.pazienza i { display:block; height:100%; transition:width .2s linear }

/* ---------- il calderone ----------
   Tre pezzi sovrapposti: la pancia, l'ellisse del brodo che si vede dentro
   l'apertura, e sopra a tutti l'anello del bordo — che è un anello vuoto e
   non un disco, se no coprirebbe proprio la cosa da guardare. */
.paiolo { position:relative; flex:0 1 auto; height:100%; max-height:min(32vh,250px);
          aspect-ratio:1.52; max-width:94%;
          filter:drop-shadow(0 0 22px color-mix(in srgb, var(--p) 45%, transparent)) }
/* la pancia si stringe verso il fondo: emisferica sembrava una vasca */
.pentola { position:absolute; left:9%; right:9%; top:11%; bottom:13%; z-index:1;
           border-radius:8% 8% 42% 42% / 10% 10% 52% 52%;
           background:linear-gradient(150deg,#75758c,#4a4a5c 34%,#2e2e3a 68%,#1c1c25);
           box-shadow:0 6px 0 #00000055, inset -16px -10px 26px #00000077,
                      inset 18px 10px 26px #ffffff26 }
/* il riflesso: senza, la pancia è una macchia nera e non un pentolone */
.pentola::after { content:''; position:absolute; left:12%; top:16%; width:26%; height:44%;
                  border-radius:50%; background:linear-gradient(160deg,#ffffff2e,transparent 70%);
                  filter:blur(3px) }
.labbro { position:absolute; left:4%; right:4%; top:5%; height:19%; border-radius:50%; z-index:3;
          border:5px solid #6a6a82; box-sizing:border-box; pointer-events:none;
          box-shadow:0 4px 6px #00000055, inset 0 -2px 3px #0006 }
/* la superficie del brodo: un'ellisse vista di sbieco, del colore mescolato */
.brodo { position:absolute; left:8%; right:8%; top:8%; height:13%; border-radius:50%; z-index:2;
         background:radial-gradient(58% 92% at 38% 20%,
                    color-mix(in srgb, var(--p) 35%, white), var(--p) 78%);
         box-shadow:0 0 26px var(--p), 0 0 8px #ffffff33, inset 0 -5px 12px #00000055;
         transition:background .8s ease }
.bollicina { position:absolute; bottom:20%; width:var(--s); height:var(--s); border-radius:50%;
             background:#ffffff70; box-shadow:inset 0 0 0 1px #ffffffcc, 0 0 5px #fff6;
             animation:sale 2.6s var(--r) infinite ease-in }
@keyframes sale { 0% { transform:translateY(3px) scale(.3); opacity:0 }
                  30% { opacity:1 }
                  100% { transform:translateY(-24px) scale(1.3); opacity:0 } }
.paiolo.ribolle .bollicina { animation-duration:.8s }
.paiolo.ribolle .brodo { animation:sussulta .45s 2 }
@keyframes sussulta { 0%,100% { transform:none } 40% { transform:scale(1.06,1.3) translateY(-2px) } }
/* gli ingredienti già dentro restano a galla: sono la memoria di cosa si è dosato */
.galleggia { position:absolute; top:5%; z-index:4; font-size:clamp(16px,4.2vmin,24px);
             animation:onda 2.8s var(--r) infinite ease-in-out, entra .5s cubic-bezier(.2,1.5,.4,1);
             filter:drop-shadow(0 2px 3px #0009) }
@keyframes onda { 0%,100% { transform:translateY(0) rotate(-6deg) }
                  50% { transform:translateY(-5px) rotate(6deg) } }
@keyframes entra { from { transform:translateY(-30px) scale(1.6); opacity:0 } }
/* le fiamme stanno dietro la pancia e spuntano di sotto: davanti sembravano
   tre emoji appoggiate sul fondo dello schermo */
.fuoco { position:absolute; left:22%; right:22%; bottom:7%; z-index:0; display:flex;
         justify-content:space-between; font-size:clamp(17px,4.6vmin,30px); pointer-events:none }
/* il vapore riempie l'aria sopra il paiolo, che se no era un buco nero */
.vapore { position:absolute; left:0; right:0; bottom:84%; height:74px; z-index:1;
          pointer-events:none; overflow:hidden }
.vapore span { position:absolute; bottom:0; width:38px; height:38px; border-radius:50%;
               background:radial-gradient(circle at 50% 50%, #ffffff5c, transparent 72%);
               animation:fuma 3.4s var(--r) infinite ease-out }
@keyframes fuma { 0% { transform:translateY(20px) scale(.4); opacity:0 }
                  30% { opacity:.9 }
                  100% { transform:translateY(-52px) scale(1.7) translateX(10px); opacity:0 } }
.fuoco span { animation:fiamma 1.1s var(--r) infinite ease-in-out; transform-origin:50% 100% }
@keyframes fiamma { 0%,100% { transform:scaleY(.86) translateY(2px); opacity:.85 }
                    50% { transform:scaleY(1.15); opacity:1 } }
/* la pozione riuscita: il brodo prende il suo colore e lei esce dal paiolo */
.paiolo.pronta .brodo { box-shadow:0 0 60px var(--p), inset 0 -6px 14px #00000055 }
.nata { position:absolute; left:50%; top:0; font-size:clamp(34px,10vmin,64px);
        animation:sboccia 1.4s ease-out forwards; pointer-events:none }
@keyframes sboccia { 0% { transform:translate(-50%,10%) scale(.2); opacity:0 }
                     35% { transform:translate(-50%,-40%) scale(1.15); opacity:1 }
                     100% { transform:translate(-50%,-105%) scale(1); opacity:0 } }
/* il tuffo: parte da dove si dosava, fa l'arco e sparisce nel brodo */
.volo { position:fixed; left:0; top:0; z-index:55; font-size:38px; pointer-events:none;
        filter:drop-shadow(0 3px 5px #0008); animation:tuffo .48s ease-in forwards }
@keyframes tuffo {
  0%   { transform:translate(calc(var(--x) - 50%), calc(var(--y) - 50%)) scale(1) rotate(0) }
  55%  { transform:translate(calc(var(--x) + var(--dx)*.5 - 50%),
                             calc(var(--y) + var(--dy)*.5 - 90px - 50%)) scale(1.45) rotate(200deg) }
  100% { transform:translate(calc(var(--x) + var(--dx) - 50%), calc(var(--y) + var(--dy) - 50%))
                   scale(.35) rotate(400deg); opacity:.3 } }

/* ---------- la pergamena ---------- */
.pergamena { flex:none; margin:8px 10px 0; background:linear-gradient(180deg,#f7ecd2,#e8d7b3);
             border-radius:12px; padding:6px 12px 8px; color:#4b3a1f;
             box-shadow:0 4px 0 #00000055, inset 0 0 0 2px #ffffff88 }
.pergamena > b { display:block; text-align:center; font-size:15px; font-weight:900;
                 letter-spacing:.3px; margin-bottom:5px }
.pergamena > b em { font-style:normal }
/* il cliente esigente si vede prima di cominciare: pergamena in cornice d'oro
   e un'aura addosso a lui. Se la mancia arrivasse a sorpresa non servirebbe
   a niente — è proprio il sapere che vale doppio a far andare piano */
.pergamena.pregiata { box-shadow:0 4px 0 #00000055, inset 0 0 0 3px #e0a52e,
                      0 0 22px #e0a52e66 }
.tizio.pregiato .chi { filter:drop-shadow(0 0 10px #ffd85e) drop-shadow(0 3px 6px #0009) }
.voci { display:flex; flex-wrap:wrap; gap:6px; justify-content:center }
.voce { font-size:15px; font-weight:900; background:#ffffff88; border-radius:9px;
        padding:4px 10px; box-shadow:inset 0 0 0 2px #00000012 }
.voce i { font-style:normal; font-weight:700; font-size:12px; color:#8a7048 }
.voce.qui { background:#fff; box-shadow:0 0 0 3px #ffd85e, 0 3px 0 #00000022 }
.voce.fatto { opacity:.45; text-decoration:line-through }

/* ---------- il banco ----------
   Prende solo l'altezza che gli serve, non tutta quella che avanza: lo spazio
   in più va al calderone, che è la cosa da guardare. */
.banco { flex:0 1 auto; min-height:0; display:flex; flex-direction:column; gap:7px;
         margin:7px 10px calc(9px + env(safe-area-inset-bottom));
         padding:9px 10px; border-radius:16px; background:#ffffff12;
         box-shadow:inset 0 0 0 2px #ffffff1a }
.banco.boom { animation:scossa .5s }
@keyframes scossa { 0%,100%{transform:none} 20%{transform:translateX(-7px) rotate(-1deg)}
                    60%{transform:translateX(7px) rotate(1deg)} }
.cartello { display:flex; align-items:baseline; justify-content:center; flex-wrap:wrap; gap:6px }
.cartello b { font-size:clamp(19px,5.4vmin,28px); font-weight:900; color:#fff }
.cartello .di { font-size:13px; font-weight:700; color:#c9bde6 }

.attrezzo { flex:0 1 auto; min-height:0; display:flex; align-items:center; justify-content:center; gap:14px }

/* ---------- lo scaffale degli attrezzi ----------
   Il cartellino sta accanto al disegno e non sotto: in colonna le due righe
   («fino a 2 m» e «tacche da 5 cm») allungavano il banco più del calderone. */
.scaffale { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
            align-content:center; gap:8px; padding:2px; width:100% }
.scelta { display:flex; align-items:center; gap:9px; text-align:left;
          padding:9px 10px; border-radius:14px; background:#ffffff16;
          box-shadow:0 4px 0 #00000055, inset 0 0 0 2px #ffffff26 }
.scelta:active { transform:translateY(2px); box-shadow:0 2px 0 #00000055 }
.scelta .fig { font-size:clamp(28px,7.5vw,40px); line-height:1; flex:none }
.scelta b { display:block; font-size:14px; font-weight:900; color:#fff }
.scelta i { font-style:normal; font-size:11px; font-weight:700; color:#c9bde6; line-height:1.25 }
.scegli { font-size:14px; font-weight:800; color:#c9bde6 }
.lettura { font-size:clamp(20px,5.5vmin,30px); font-weight:900; color:#fff;
           font-variant-numeric:tabular-nums }
.lettura i { font-style:normal; font-size:.55em; color:#c9bde6 }

/* --- versa --- */
.versa { flex-direction:row }
.colonna { display:flex; flex-direction:column; align-items:center; gap:6px }
.boccia { position:relative; width:clamp(104px,26vmin,160px); height:clamp(116px,19vh,180px);
          border-radius:10px 10px 22px 22px; background:#ffffff10;
          box-shadow:inset 0 0 0 3px #ffffff44, inset 0 -6px 14px #00000055; overflow:hidden }
.onda { position:absolute; left:0; right:0; bottom:0; border-radius:0 0 20px 20px;
           transition:height .05s linear; box-shadow:0 0 18px #ffffff33 }
.tacca { position:absolute; left:0; width:22%; height:2px; background:#ffffff55 }
.tacca.big { width:38%; height:3px; background:#ffffff99 }
.tacca em { position:absolute; left:calc(100% + 6px); top:-9px; font-style:normal;
            font-size:12px; font-weight:900; color:#fff; white-space:nowrap }
.colonna .lettura { flex:none; text-shadow:0 2px 6px #000a }
.versare { display:flex; flex-direction:column; align-items:center; gap:4px;
           padding:18px 20px; border-radius:20px; font-size:44px;
           background:linear-gradient(180deg,#6ec0ff,#3a7fd5); color:#fff;
           box-shadow:0 6px 0 #23538f; touch-action:none; user-select:none }
.versare:active { transform:translateY(4px); box-shadow:0 2px 0 #23538f }
.versare b { font-size:12px; font-weight:900; letter-spacing:.4px }
.comandi { display:flex; flex-direction:column; gap:10px; align-items:center }
.goccia { display:flex; flex-direction:column; align-items:center; gap:2px;
          padding:11px 16px; border-radius:16px; font-size:26px;
          background:linear-gradient(180deg,#ffffff2e,#ffffff14); color:#fff;
          box-shadow:0 5px 0 #00000055, inset 0 0 0 2px #ffffff33 }
.goccia:active { transform:translateY(3px); box-shadow:0 2px 0 #00000055 }
.goccia b { font-size:12px; font-weight:900; color:#dcd2f5 }

/* --- pesa --- */
.pesa { flex-direction:column; gap:6px; width:100% }
.bilancia { height:clamp(108px,17vh,166px); width:100%; display:flex; flex-direction:column;
            align-items:center; justify-content:center; gap:0 }
.sacco { font-size:clamp(28px,7vmin,48px); margin-bottom:2px }
.piatto { width:min(68%,330px); min-height:46px; display:flex; flex-wrap:wrap; gap:5px;
          align-items:flex-end; justify-content:center; padding:6px 10px 8px;
          border-radius:6px 6px 40px 40px / 6px 6px 22px 22px;
          background:linear-gradient(180deg,#c6ced8,#79848f);
          box-shadow:0 4px 0 #00000055, inset 0 2px 0 #ffffff77 }
.peso { min-width:34px; height:var(--h); display:flex; align-items:center; justify-content:center;
        padding:0 7px; border-radius:4px 4px 2px 2px; font-size:12px; font-weight:900;
        color:#2a2f36; background:linear-gradient(180deg,#e6ebf0,#aab4bf);
        box-shadow:inset 0 1px 0 #fff, 0 2px 0 #00000044; animation:posa .25s }
@keyframes posa { from { transform:translateY(-16px); opacity:0 } to { transform:none; opacity:1 } }
.vuoto { font-size:12px; font-weight:800; color:#4a545e }
.asta { width:min(84%,400px); height:9px; border-radius:5px;
        background:linear-gradient(180deg,#cfd6de,#8d97a2); box-shadow:0 3px 0 #00000055 }
.stelo { width:20px; height:clamp(26px,7vmin,64px); background:linear-gradient(90deg,#8d97a2,#cfd6de,#8d97a2) }
.base { width:min(60%,260px); height:16px; border-radius:6px 6px 9px 9px;
        background:linear-gradient(180deg,#cfd6de,#7d8994); box-shadow:0 5px 0 #00000055 }
.pesiera { display:flex; flex-wrap:wrap; gap:7px; justify-content:center }
.pesetto { min-width:48px; padding:11px 12px; border-radius:11px; font-size:16px; font-weight:900;
           color:#2a2f36; background:linear-gradient(180deg,#eef2f6,#b6c0ca);
           box-shadow:0 4px 0 #00000055, inset 0 1px 0 #fff }
.pesetto:active { transform:translateY(3px); box-shadow:0 1px 0 #00000055 }
.pesetto.annulla { background:#ffffff2e; color:#fff; box-shadow:0 4px 0 #00000044 }

/* --- taglia --- */
/* il padding in cima è per le forbici, che stanno sopra il righello e senza
   spazio finivano a cavallo del cartello con la dose */
.taglia { flex-direction:column; gap:9px; width:100%; padding:16px 26px 0; box-sizing:border-box }
.righello { position:relative; width:100%; max-width:760px; height:clamp(74px,13vh,110px);
            border-radius:10px; background:linear-gradient(180deg,#f3e2b8,#d9c496);
            box-shadow:0 4px 0 #00000055, inset 0 0 0 2px #ffffff66; touch-action:none }
.intero { position:absolute; left:0; right:0; top:14%; height:44%; border-radius:0 8px 8px 0;
           background:#00000018; box-shadow:inset 0 0 0 2px #00000018 }
.pezzo { position:absolute; left:0; top:14%; height:44%; border-radius:0 8px 8px 0;
          box-shadow:inset 0 -4px 0 #00000033; transition:width .06s }
.punta { position:absolute; right:-10px; top:50%; transform:translateY(-50%); font-size:24px }
.segno { position:absolute; bottom:0; width:1px; height:20%; background:#00000055 }
.segno.big { height:38%; width:2px; background:#000000aa }
.segno em { position:absolute; left:50%; transform:translateX(-50%); bottom:100%;
            font-style:normal; font-size:11px; font-weight:900; color:#4b3a1f }
/* i due numeri di testa e coda uscivano dal righello e restavano tagliati */
.segno:first-of-type em { transform:none; left:1px }
.segno:last-of-type em { transform:translateX(-100%); left:auto; right:1px }
.lama { position:absolute; top:-16px; bottom:-8px; width:3px; background:#ef5f5f;
        box-shadow:0 0 10px #ef5f5f }
.lama::before { content:'✂️'; position:absolute; top:-26px; left:50%; transform:translateX(-50%);
                font-size:22px }

.azioni { display:flex; gap:8px; justify-content:center; align-items:center; flex:none }
.bottone.piccolo { padding:10px 14px; font-size:14px; white-space:nowrap }
.bottone.grosso { padding:12px 20px; font-size:16px }

.boom { position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
        font-size:min(46vmin,300px); pointer-events:none; z-index:60; animation:esplode .7s forwards }
@keyframes esplode { 0%{ transform:scale(.3); opacity:0 } 25%{ transform:scale(1.1); opacity:1 }
                     100%{ transform:scale(1.5); opacity:0 } }
.moneta { position:fixed; left:50%; top:38%; transform:translateX(-50%); z-index:60;
          font-size:38px; font-weight:900; color:#ffd85e; pointer-events:none;
          animation:vola 1.1s ease-out forwards }
@keyframes vola { 0%{transform:translateX(-50%) scale(.4);opacity:0}
                  30%{transform:translateX(-50%) scale(1.3);opacity:1}
                  100%{transform:translate(-50%,-120px) scale(.85);opacity:0} }
/* ---------- il cartellone appeso al muro ---------- */
.muro { position:fixed; inset:0; z-index:70; display:flex; align-items:center; justify-content:center;
        background:#0b0718cc; padding:14px; animation:sfuma .18s }
@keyframes sfuma { from { opacity:0 } to { opacity:1 } }
.cartellone { width:100%; max-width:560px; display:flex; flex-direction:column; align-items:center;
              gap:9px; padding:16px 14px 14px; border-radius:18px; color:#4b3a1f;
              background:linear-gradient(180deg,#f7ecd2,#e6d4ae);
              box-shadow:0 10px 0 #00000055, inset 0 0 0 3px #ffffff88 }
.cartellone > b { font-size:19px; font-weight:900 }
.cartellone p { font-size:13px; font-weight:700; color:#8a7048; text-align:center; margin:-4px 0 2px }
.cartellone p em { font-style:normal; font-weight:900; color:#4b3a1f }
.riga-scala { width:100%; display:flex; flex-direction:column; gap:3px }
.fam { font-size:12px; font-weight:900; color:#8a7048 }
.gradini { display:flex; align-items:center; justify-content:space-between; gap:1px }
.u { flex:1; text-align:center; padding:7px 2px; border-radius:8px; font-size:14px; font-weight:900;
     background:#ffffff9c; box-shadow:inset 0 0 0 2px #00000012 }
.u.ora { background:#ffd85e; box-shadow:0 0 0 3px #e2a53a }
.per { font-style:normal; font-size:9px; font-weight:900; color:#b09468; flex:none }
.vetrina { font-size:38px; letter-spacing:2px }
</style>
