<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA BANCARELLA — il negoziante sei tu, e il mercato si gira a tappe.

   Una GIORNATA di mercato è una campagna: un giro di banchi, tre
   clienti per banco. A ogni tappa hai davanti UN banco solo, con la
   sua merce tutta in vista nelle ceste — niente reparti da aprire,
   niente da cercare. Ogni cliente è due momenti:

   1. RACCOLTA — chiede la sua roba (la lista sta nel suo fumetto) e
      tu la prendi dalle ceste del banco.
   2. CASSA — quando ha tutto ti allunga la banconota. Il banco
      diventa il registratore: il display calcola il resto, tu lo
      componi con le monete del cassetto.

   La difficoltà cresce di giornata in giornata: più banchi, prezzi
   più precisi, monete più piccole e soprattutto meno tempo — che
   dentro la giornata si stringe tappa dopo tappa.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { answer, level, addCoins, segna, segnaBest,
         mercatoProgresso, mercatoCompleta, tappaAperta } from '../store/profile.js'
import { generaCliente, esposizione, tappaDi, campagnaDi, scomponi, euro,
         BANCHI, CAMPAGNE, CLIENTI_PER_TAPPA } from '../data/bancarella.js'
import { suono } from '../audio.js'
import Barra from '../components/Barra.vue'

defineEmits(['vai'])

const CUORI = 3, PER_MONETA = 3
const fase = ref('mappa')           // mappa | gioco | fine
const idx = ref(0)                  // quale giornata (-1 = giornata libera)
const nTappa = ref(0)               // a che tappa del giro siamo
const esposti = ref([])             // la merce sul banco di questa tappa
const coda = ref([])                // la fila davanti al banco
const piatto = ref([])              // le monete già posate
const hud = reactive({ cuori: CUORI, serviti: 0, perfetti: 0, incasso: 0 })
const momento = ref('raccolta')     // raccolta | cassa
const presi = ref([])               // merce già passata al cliente
const sbagliato = ref('')
const rifiutata = ref(0)
const bonus = ref(false)
const moneta = ref(0)
const battuta = ref('')
const cambio = ref(null)            // il cartello del cambio banco
const esito = ref('')               // vinta | persa
const volo = ref(null)              // la roba che vola dalla cesta al cliente
let raf = 0, ultimo = 0, apertoIl = 0, occupato = false, rifiuti = 0
let dettoFretta = false, timer = 0, nVolo = 0

const prog = computed(() => mercatoProgresso())
const sbloccata = i => tappaAperta(i, prog.value.tappa)
const camp = computed(() => campagnaDi(idx.value))
const T = computed(() => tappaDi(camp.value, nTappa.value))
const B = computed(() => BANCHI[T.value.banco])
const cliente = computed(() => coda.value[0] || null)
const dato = computed(() => piatto.value.reduce((s, c) => s + c, 0))
const manca = computed(() => (cliente.value ? cliente.value.resto - dato.value : 0))
const monetine = computed(() => (cliente.value ? cliente.value.monete.filter(v => v < 500) : []))
const carte = computed(() => (cliente.value ? cliente.value.monete.filter(v => v >= 500) : []))

/* ---------- battute ---------- */
const pick = a => a[Math.floor(Math.random() * a.length)]
const SALUTI   = ['Ciao! 👋', 'Buongiorno!', 'Salve!', 'Buondì!']
const CHIEDE   = ['Vorrei…', 'Mi dà…', 'Per favore…', 'Prendo…']
const OFFERTE  = ['Ecco a lei!', 'Tenga pure', 'Le do questa']
const SBAGLIO  = ['No, non quello!', 'Non è questo…', 'Ehm, no']
const GRAZIE   = ['Grazie! 😊', 'Grazie mille!', 'A presto!', 'Arrivederci!']
const PERFETTI = ['Preciso! ✨', 'Che bravo!', 'Giusti giusti!']
const FRETTA   = ['Ho un po\' di fretta…', 'Sbrighiamoci?', 'Uhm…']
const UFFA     = ['Me ne vado!', 'Troppo lento!', 'Uffa…']

/* ═══════════ la giornata ═══════════ */
function inizia(i = idx.value) {
  if (i >= 0 && !sbloccata(i)) return
  idx.value = i
  nTappa.value = 0
  hud.cuori = CUORI; hud.serviti = 0; hud.perfetti = 0; hud.incasso = 0
  piatto.value = []; occupato = false; rifiuti = 0; bonus.value = false
  esito.value = ''
  fase.value = 'gioco'
  apriTappa()
  ultimo = 0
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(ciclo)
}

/* Una tappa: si arriva al banco, si guarda cosa c'è sopra, e si mette in
   fila la gente. Finché il cartello è su il tempo non scorre: nessuno deve
   perdere secondi mentre legge dov'è arrivato. */
function apriTappa() {
  const t = T.value
  esposti.value = esposizione(t)
  coda.value = []
  for (let i = 0; i < CLIENTI_PER_TAPPA; i++) {
    const c = generaCliente(t, esposti.value)
    coda.value.push({ ...c, restaPazienza: c.pazienza })
  }
  momento.value = 'raccolta'
  presi.value = []
  cambio.value = { banco: t.banco, n: nTappa.value }
  clearTimeout(timer)
  timer = setTimeout(() => { cambio.value = null; alBanco() }, 1500)
}

function alBanco() {
  dettoFretta = false
  momento.value = 'raccolta'
  presi.value = []
  piatto.value = []
  battuta.value = pick(SALUTI)
  apertoIl = performance.now()
  setTimeout(() => { if (cliente.value && !occupato && momento.value === 'raccolta')
                       battuta.value = pick(CHIEDE) }, 1100)
}

/* servito o scappato, il cliente lascia il posto: se il banco resta vuoto la
   tappa è finita e ci si sposta */
function prossimo() {
  coda.value.shift()
  piatto.value = []; rifiuti = 0; occupato = false; bonus.value = false
  if (!coda.value.length) return tappaFinita()
  alBanco()
}

function tappaFinita() {
  nTappa.value++
  // cambiare banco ridà fiato: un cuore a ogni tappa, mai più di tre
  hud.cuori = Math.min(CUORI, hud.cuori + 1)
  if (!camp.value.libera && nTappa.value >= camp.value.tappe.length) return chiudi('vinta')
  apriTappa()
}

/* ---------- fase 1: la raccolta ----------
   `presi` è la lista dei pezzi passati, uno per volta: chi vuole due angurie
   ne vuole due, e la cesta si tocca due volte. */
const prese = e => presi.value.filter(x => x === e).length
const restano = a => a.quanti - prese(a.emoji)
const daPrendere = computed(() =>
  cliente.value ? cliente.value.articoli.filter(a => restano(a) > 0) : [])

function prendi(a) {
  const c = cliente.value
  if (!c || occupato || cambio.value || momento.value !== 'raccolta') return
  const suo = c.articoli.find(x => x.emoji === a.emoji)
  if (suo && restano(suo) <= 0) return               // già data tutta: non è un errore
  if (!daPrendere.value.some(x => x.emoji === a.emoji)) {
    // roba che non ha chiesto: la rifiuta, e costa due secondi
    sbagliato.value = a.emoji
    setTimeout(() => { if (sbagliato.value === a.emoji) sbagliato.value = '' }, 420)
    battuta.value = pick(SBAGLIO)
    suono.no()
    c.restaPazienza = Math.max(2, c.restaPazienza - 2)
    return
  }
  presi.value.push(a.emoji)
  volo.value = { emoji: a.emoji, k: ++nVolo }
  setTimeout(() => { if (volo.value && volo.value.k === nVolo) volo.value = null }, 520)
  suono.nota(720, 980, 0.07, 'triangle', 0.1)
  if (!daPrendere.value.length) {
    momento.value = 'cassa'
    battuta.value = pick(OFFERTE)
    apertoIl = performance.now()
  }
}

/* ---------- fase 2: la cassa ----------
   Due modi, e cambia tutto. Nelle giornate normali la cassa dice il resto e
   il gioco è comporlo: allora una moneta che sfonda la cifra viene rifiutata
   e appena il piatto torna il cliente è servito. Nella giornata «a mente» la
   cassa non dice niente: le monete si posano tutte, e la risposta la dai tu
   col tasto ✓. */
const aMente = computed(() => !!(cliente.value && cliente.value.mente))

function metti(v) {
  const c = cliente.value
  if (occupato || !c || momento.value !== 'cassa') return
  if (!c.mente && dato.value + v > c.resto) {
    // non si può sbagliare per eccesso: la moneta viene rifiutata e basta,
    // costa due secondi di pazienza e non un cuore
    rifiuti++
    rifiutata.value = v
    setTimeout(() => { if (rifiutata.value === v) rifiutata.value = 0 }, 420)
    suono.no()
    c.restaPazienza = Math.max(2, c.restaPazienza - 2)
    return
  }
  piatto.value.push(v)
  suono.nota(680, 900, 0.06, 'triangle', 0.09)
  if (!c.mente && dato.value === c.resto) consegna()
}

const togli = () => { if (!occupato) piatto.value.pop() }

/* «Ecco il resto»: esiste solo quando la cassa è rotta. Se il conto non torna
   non si perde un cuore e non si scopre la cifra giusta — si perdono tre
   secondi e si riprova, che è come va quando si sbaglia a dare il resto. */
function proponi() {
  const c = cliente.value
  if (occupato || !c || momento.value !== 'cassa' || !piatto.value.length) return
  if (dato.value === c.resto) return consegna()
  rifiuti++
  sbagliato.value = 'conto'
  setTimeout(() => { if (sbagliato.value === 'conto') sbagliato.value = '' }, 600)
  battuta.value = dato.value > c.resto ? 'Sono troppi!' : 'Sono pochi…'
  suono.no()
  c.restaPazienza = Math.max(2, c.restaPazienza - 3)
}

function consegna() {
  occupato = true
  const c = cliente.value
  const perfetto = piatto.value.length === c.minimo
  answer(c.chiave, { correct: rifiuti === 0, ms: performance.now() - apertoIl })
  hud.serviti++; hud.incasso += c.totale
  segna('clienti'); segna('incasso', c.totale)
  if (perfetto) { hud.perfetti++; bonus.value = true; segna('restiPerfetti') }
  battuta.value = pick(perfetto ? PERFETTI : GRAZIE)
  suono.moneta()
  if (hud.serviti % PER_MONETA === 0) {
    addCoins(level.value); moneta.value = level.value
    setTimeout(() => (moneta.value = 0), 1100)
  }
  clearTimeout(timer)
  timer = setTimeout(prossimo, 900)
}

/* ---------- il tempo ---------- */
function ciclo(ts) {
  const dt = Math.min(0.05, (ts - ultimo) / 1000 || 0); ultimo = ts
  if (fase.value === 'gioco' && !cambio.value && !occupato) {
    // chi è in fila si spazientisce molto più piano di chi è al banco
    coda.value.forEach((c, i) => { c.restaPazienza -= dt * (i === 0 ? 1 : 0.35) })
    const c = coda.value[0]
    if (c && !dettoFretta && barra(c) < 30) { dettoFretta = true; battuta.value = pick(FRETTA) }
    if (c && c.restaPazienza <= 0) scaduto()
  }
  raf = requestAnimationFrame(ciclo)
}

function scaduto() {
  const c = cliente.value
  battuta.value = pick(UFFA)
  answer(c.chiave, { correct: false, ms: performance.now() - apertoIl })
  suono.no()
  if (--hud.cuori <= 0) { coda.value.shift(); return chiudi('persa') }
  prossimo()
}

function chiudi(come) {
  esito.value = come
  fase.value = 'fine'
  cancelAnimationFrame(raf)
  clearTimeout(timer)
  cambio.value = null
  segnaBest('clienti', hud.serviti)
  if (come === 'vinta' && idx.value >= 0) mercatoCompleta(idx.value, CAMPAGNE.length)
  suono.fine()
}

/* la prossima giornata, se c'è e se è aperta */
const dopo = computed(() => {
  if (idx.value < 0) return -1
  const p = idx.value + 1
  return p < CAMPAGNE.length ? p : (prog.value.libera ? -1 : null)
})

/* ═══════════ il disegno del banco ═══════════
   Le ceste non stanno a scacchiera: righe da tre e da due che si alternano,
   ognuna spostata di un pelo, e ogni cesta storta a modo suo. Un banco vero
   non è una griglia. */
const FILE = { 1: [1], 2: [2], 3: [3], 4: [2, 2], 5: [3, 2], 6: [2, 2, 2],
               7: [3, 2, 2], 8: [3, 2, 3], 9: [3, 3, 3] }
const righe = computed(() => {
  const roba = esposti.value
  const tag = FILE[roba.length] || [3, 3, 3]
  const out = []
  let i = 0
  for (const k of tag) { out.push(roba.slice(i, i + k)); i += k }
  return out.filter(r => r.length)
})

/* un caso stabile: la stessa cesta è storta sempre allo stesso modo, e due
   ceste vicine non lo sono mai uguale */
function rnd(s, k) {
  let x = 2166136261
  for (const ch of s + '/' + k) x = Math.imul(x ^ ch.codePointAt(0), 16777619)
  return ((x >>> 0) % 1000) / 1000
}
const stortaCesta = p => ({
  transform: `translateY(${(rnd(p.emoji, 1) * 8 - 4).toFixed(1)}px) ` +
             `rotate(${(rnd(p.emoji, 2) * 5 - 2.5).toFixed(1)}deg) ` +
             `scale(${(0.94 + rnd(p.emoji, 3) * 0.12).toFixed(2)})`,
})
/* tre pezzi per cesta, ammucchiati: due dietro e uno davanti in mezzo, più
   grande. Una cesta con dentro una cosa sola non è una cesta.
   Stanno tutti DENTRO: il bordo della cesta li copre di sotto (ci pensa lo
   z-index) e nessuno esce di lato, quindi le x restano lontane dai bordi. */
const POSTI = [[35, 40, 0.76], [65, 36, 0.8], [50, 58, 0.96]]
const posa = (p, k) => {
  const [x, y, s] = POSTI[k]
  return {
    left: (x + rnd(p.emoji, k + 4) * 6 - 3).toFixed(1) + '%',
    top: (y + rnd(p.emoji, k + 7) * 10 - 5).toFixed(1) + '%',
    fontSize: s + 'em',
    transform: `translate(-50%,-50%) rotate(${(rnd(p.emoji, k + 10) * 26 - 13).toFixed(1)}deg)`,
    zIndex: k,
  }
}

/* quello che il cliente ha chiesto di questa cesta, e quanto ne manca */
const chiesto = e => (cliente.value ? cliente.value.articoli.find(a => a.emoji === e) : null)
const cestaFinita = p => { const a = chiesto(p.emoji); return !!a && restano(a) <= 0 }
const ancora = p => {
  const a = chiesto(p.emoji)
  return a && prese(p.emoji) > 0 ? Math.max(restano(a), 0) : 0
}

const barra = c => Math.max(0, Math.min(100, c.restaPazienza / c.pazienza * 100))
const tipo = v => v >= 500 ? 'carta b' + v / 100 : v === 200 ? 'due' : v === 100 ? 'uno'
                : v >= 10 ? 'oro' : 'rame'
const faccia = v => (v >= 100 ? v / 100 : v)
const unita = v => (v >= 100 ? '€' : 'c')

onMounted(() => {
  window.__shop = { fase, coda, piatto, hud, inizia, metti, togli, prendi, proponi,
                    cliente, dato, manca, battuta, scomponi, momento, presi, aMente,
                    daPrendere, esposti, tappa: nTappa, camp, T, cambio, esito,
                    CAMPAGNE, BANCHI, prog }
})
onUnmounted(() => { cancelAnimationFrame(raf); clearTimeout(timer) })
</script>

<template>
  <div class="schermo negozio">
    <!-- in partita le monete se ne vanno dalla barra: qui si maneggiano euro,
         due salvadanai in cima sarebbero solo confusione, e lo spazio serve
         ai cuori — vedi la stessa scelta nel laboratorio -->
    <Barra titolo="Bancarella" :monete="fase !== 'gioco'" @indietro="$emit('vai','home')">
      <template v-if="fase === 'gioco'">
        <div class="gettone">{{ '❤️'.repeat(Math.max(0, hud.cuori)) || '💔' }}</div>
        <div class="gettone">🧾 <b>{{ hud.serviti }}</b></div>
        <div class="gettone">✨ <b>{{ hud.perfetti }}</b></div>
      </template>
    </Barra>

    <!-- ═════ LE GIORNATE DI MERCATO ═════ -->
    <div v-if="fase === 'mappa'" class="centro mappa">
      <h1>Al <span>mercato</span></h1>
      <p class="testo">Una giornata è un giro di banchi, tre clienti per banco:
        prendi la roba dalle ceste, poi dai il resto giusto.</p>
      <div class="giornate">
        <button v-for="(g, i) in CAMPAGNE" :key="g.id" class="giornata"
                :data-camp="g.id" :class="{ chiusa: !sbloccata(i), fatta: i < prog.tappa }"
                @click="inizia(i)">
          <span class="bollo">{{ g.emoji }}</span>
          <span class="che">
            <b>{{ g.nome }}</b>
            <span class="banchini"><i v-for="(b, j) in g.tappe" :key="j">{{ BANCHI[b].icona }}</i></span>
          </span>
          <span class="stato">{{ !sbloccata(i) ? '🔒' : i < prog.tappa ? '✅' : '▶' }}</span>
          <span class="mini">{{ g.mente ? '🧠 la cassa non calcola: il resto lo conti tu'
                                        : g.tappe.length + ' banchi · ' + g.tempo[1] + 's a cliente' }}</span>
        </button>
        <button v-if="prog.libera" class="giornata libera" data-camp="libera" @click="inizia(-1)">
          <span class="bollo">♾️</span>
          <span class="che"><b>Giornata libera</b>
            <span class="banchini"><i>🍎</i><i>🥬</i><i>🥖</i><i>🧀</i><i>🍬</i></span></span>
          <span class="stato">▶</span>
          <span class="mini">non chiude mai · il tempo si stringe</span>
        </button>
      </div>
    </div>

    <!-- ═════ GIOCO ═════ -->
    <template v-else-if="fase === 'gioco'">
      <!-- il percorso della giornata: dove sei e quanti banchi mancano -->
      <div class="percorso">
        <div v-for="(b, i) in camp.tappe" :key="i" class="fermata" :data-banco="b"
             :class="{ qui: i === T.i, fatta: i < T.i }"
             :style="{ '--c': BANCHI[b].colore }">{{ BANCHI[b].icona }}</div>
        <span class="quale">{{ camp.libera ? 'giro ' + (Math.floor(nTappa / camp.tappe.length) + 1)
                                           : (T.i + 1) + '/' + camp.tappe.length }}</span>
      </div>

      <!-- la gente davanti al banco -->
      <div class="strada" v-if="cliente">
        <div class="cliente">
          <div class="fumetto" :key="battuta + presi.length + momento">
            <span class="dice">{{ battuta }}</span>
            <div v-if="momento === 'raccolta'" class="lista">
              <span v-for="a in cliente.articoli" :key="a.emoji" class="cosa"
                    :class="{ fatto: restano(a) <= 0 }">{{ a.emoji }}<i
                    v-if="a.quanti > 1">×{{ Math.max(restano(a), 0) || '✓' }}</i></span>
            </div>
            <!-- il cliente porge quello che ha in mano: una banconota, o una
                 banconota e una moneta se paga una cifra tonda -->
            <div v-else class="porge">
              <span v-for="(m, i) in cliente.pagaCon" :key="i" class="soldo mini" :class="tipo(m)">
                <template v-if="m >= 500">
                  <i class="finestra"></i><span class="cifra">{{ m / 100 }}</span><i class="banda"></i>
                </template>
                <template v-else>{{ faccia(m) }}<i class="u">{{ unita(m) }}</i></template>
              </span>
              <b>{{ euro(cliente.paga) }}</b>
            </div>
          </div>
          <div class="persona grande" :style="{ '--v': cliente.vestito }">
            <span class="testa">{{ cliente.faccia }}</span><span class="corpo"></span>
          </div>
          <div class="pazienza"><i :style="{ width: barra(cliente) + '%',
               background: barra(cliente) < 30 ? '#ff5c7a' : barra(cliente) < 60 ? '#ffc93c' : '#38c172' }"></i></div>
        </div>

        <!-- la fila: gente vera, non due emoji sbiadite in un angolo -->
        <div class="fila">
          <div v-for="(c, i) in coda.slice(1)" :key="i" class="attesa">
            <div class="persona" :style="{ '--v': c.vestito }">
              <span class="testa">{{ c.faccia }}</span><span class="corpo"></span>
            </div>
            <div class="pazienza corta"><i :style="{ width: barra(c) + '%',
                 background: barra(c) < 30 ? '#ff5c7a' : '#ffffffcc' }"></i></div>
          </div>
          <span v-if="coda.length > 1" class="quanti">{{ coda.length - 1 }} in fila</span>
        </div>
      </div>

      <!-- ═════ IL BANCO ═════ -->
      <div class="banco" :style="{ '--c': B.colore, '--t': B.tenda, '--l': B.legno }">
        <div class="tenda"></div>
        <div class="insegna">{{ B.icona }} {{ B.nome }}</div>

        <!-- la merce, tutta in vista, nelle ceste -->
        <!-- niente `:key` sui due rami: in produzione, con una key esplicita su
             uno solo dei due, il patch del DOM va in confusione al cambio tappa -->
        <div v-if="momento === 'raccolta'" class="ceste" :style="{ '--r': righe.length }">
          <div v-for="(riga, r) in righe" :key="r" class="rigacesta"
               :style="{ transform: 'translateX(' + (r % 2 ? 2.5 : -2) + '%)', '--n': riga.length }">
            <button v-for="p in riga" :key="p.emoji" class="cesta" :data-em="p.emoji"
                    :style="stortaCesta(p)"
                    :class="{ storta: sbagliato === p.emoji, presa: cestaFinita(p) }"
                    @click="prendi(p)">
              <span class="roba">
                <i v-for="k in 3" :key="k" :style="posa(p, k - 1)">{{ p.emoji }}</i>
              </span>
              <span class="vimini"></span>
              <span class="cartello">{{ euro(p.prezzo) }}</span>
              <!-- ne ha già preso uno ma ne servono altri: il promemoria sta
                   sulla cesta, non solo nel fumetto -->
              <span v-if="ancora(p)" class="ancora">×{{ ancora(p) }}</span>
            </button>
          </div>
        </div>

        <!-- ═════ LA CASSA ═════ -->
        <div v-else class="cassa">
          <div class="macchina">
            <div class="scontrino">
              <div class="voci">
                <span v-for="a in cliente.articoli" :key="a.emoji">
                  <i>{{ a.emoji }}</i><em v-if="a.quanti > 1">×{{ a.quanti }}</em>
                  <b>{{ euro(a.prezzo * a.quanti) }}</b>
                </span>
              </div>
              <div class="somma"><span>TOTALE</span><b>{{ euro(cliente.totale) }}</b></div>
            </div>
            <!-- il registratore: quando la cassa è rotta il display non
                 calcola più, e al posto della cifra c'è un punto interrogativo -->
            <div class="corpo" :class="{ rotta: aMente }">
              <div class="display">
                <span>PAGA {{ euro(cliente.paga) }}</span>
                <b>{{ aMente ? '? ? ?' : euro(cliente.resto) }}</b>
                <span>DI RESTO</span>
              </div>
              <div class="tastiera"><i v-for="n in 12" :key="n"></i></div>
            </div>
          </div>

          <!-- quello che hai già posato sul banco -->
          <div class="piatto" :class="{ nonTorna: sbagliato === 'conto' }">
            <div class="quanto">
              <b>{{ euro(dato) }}</b>
              <!-- a mente non si dice quanto manca: sarebbe dire il resto -->
              <span v-if="aMente">sul banco</span>
              <span v-else-if="manca > 0">mancano {{ euro(manca) }}</span>
              <span v-else-if="bonus" class="ok">✨ col minimo di monete!</span>
            </div>
            <div class="dati">
              <span v-for="(m, i) in piatto" :key="i" class="soldo mini" :class="tipo(m)">
                <template v-if="m >= 500">
                  <i class="finestra"></i><span class="cifra">{{ m / 100 }}</span><i class="banda"></i>
                </template>
                <template v-else>{{ faccia(m) }}<i class="u">{{ unita(m) }}</i></template>
              </span>
              <button v-if="piatto.length" class="annulla" @click="togli">↶</button>
              <button v-if="aMente && piatto.length" class="eccolo" @click="proponi">
                ✓ ecco il resto</button>
            </div>
          </div>

          <!-- il cassetto estratto, con gli scomparti -->
          <div class="cassetto">
            <div class="vaschette">
              <button v-for="v in monetine" :key="v" class="scomparto" :data-v="v" @click="metti(v)">
                <span class="soldo" :class="[tipo(v), { rifiutata: rifiutata === v }]">
                  {{ faccia(v) }}<i class="u">{{ unita(v) }}</i>
                </span>
              </button>
            </div>
            <div class="vaschette larghe" v-if="carte.length"
                 :style="{ gridTemplateColumns: 'repeat(' + carte.length + ',1fr)' }">
              <button v-for="v in carte" :key="v" class="scomparto" :data-v="v" @click="metti(v)">
                <span class="soldo" :class="[tipo(v), { rifiutata: rifiutata === v }]">
                  <i class="finestra"></i><span class="cifra">{{ v / 100 }}</span><i class="banda"></i>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- il cartello del cambio banco: finché è su, il tempo è fermo -->
      <div v-if="cambio" class="cartello-tappa" :style="{ '--c': BANCHI[cambio.banco].colore }">
        <span class="ico">{{ BANCHI[cambio.banco].icona }}</span>
        <b>{{ BANCHI[cambio.banco].nome }}</b>
        <span class="mini">tappa {{ cambio.n + 1 }}{{ camp.libera ? '' : ' di ' + camp.tappe.length }}
          · {{ T.tempo }}s a cliente</span>
      </div>

      <!-- la roba che vola dalla cesta al cliente -->
      <div v-if="volo" class="vola" :key="volo.k">{{ volo.emoji }}</div>
    </template>

    <!-- ═════ FINE ═════ -->
    <div v-else class="centro">
      <h1 style="font-size:30px">{{ esito === 'vinta' ? 'Giornata finita!' : 'Il banco ha chiuso' }}</h1>
      <div class="vetrina">{{ esito === 'vinta' ? '🎉' : hud.serviti >= 5 ? '😊' : '😅' }}</div>
      <p class="testo">Clienti serviti: <b>{{ hud.serviti }}</b> ·
        resti perfetti: <b>{{ hud.perfetti }}</b><br>Incasso: <b>{{ euro(hud.incasso) }}</b></p>
      <p v-if="esito === 'vinta' && idx >= 0" class="mini">{{ camp.nome }} · giornata superata</p>
      <div class="riga">
        <button v-if="esito === 'vinta' && dopo !== null" class="bottone" @click="inizia(dopo)">
          {{ dopo < 0 ? 'Giornata libera ▶' : 'Prossima giornata ▶' }}
        </button>
        <button v-else class="bottone" @click="inizia(idx)">Riprova ▶</button>
        <button class="bottone chiaro" @click="fase = 'mappa'">Le giornate</button>
      </div>
    </div>

    <div v-if="moneta" class="moneta">+{{ moneta }} 🪙</div>
  </div>
</template>

<style scoped>
.negozio { background:linear-gradient(180deg,#cfe8f5,#ffe9c7 32%,#f3e6d0) }

/* ---------- le giornate di mercato ---------- */
.mappa .testo { max-width:420px }
.giornate { display:flex; flex-direction:column; gap:9px; width:100%; max-width:430px; margin-top:2px }
.giornata { display:grid; grid-template-columns:auto 1fr auto; align-items:center;
            gap:2px 11px; padding:9px 12px; border-radius:16px; text-align:left;
            background:#fffdf7; box-shadow:0 4px 0 #0000002e }
.giornata .bollo { grid-row:span 2; font-size:31px }
.giornata .che { display:flex; flex-direction:column; gap:2px }
.giornata b { font-size:16px; font-weight:900; color:#6a4a2a }
.banchini { display:flex; gap:2px; font-size:15px }
.banchini i { font-style:normal }
.giornata .mini { grid-column:2; font-size:11.5px; font-weight:800; color:#a98860 }
.giornata .stato { grid-row:span 2; font-size:20px }
.giornata.chiusa { opacity:.5; filter:saturate(.4) }
.giornata.fatta { box-shadow:0 4px 0 #0000002e, inset 0 0 0 2.5px #38c17288 }
.giornata.libera { background:linear-gradient(120deg,#fff3d8,#ffe0f0) }

/* ---------- il percorso della giornata ---------- */
.percorso { display:flex; align-items:center; justify-content:center; gap:5px;
            padding:7px 10px 0; position:relative }
.fermata { width:28px; height:28px; border-radius:50%; display:flex; align-items:center;
           justify-content:center; font-size:15px; background:#ffffff8c; opacity:.55;
           box-shadow:inset 0 0 0 2px #00000018 }
.fermata.fatta { opacity:.9; background:#ffffffdd }
.fermata.qui { opacity:1; width:37px; height:37px; font-size:21px; background:#fff;
               box-shadow:0 0 0 3px var(--c), 0 3px 6px #0003 }
.quale { position:absolute; right:12px; font-size:11px; font-weight:900; color:#9a7a55 }

/* ---------- la gente ----------
   La fila si deve vedere: una faccia da 28px con sopra un corpo colorato è
   una persona, tre emoji al 40% di opacità erano una macchia. */
.strada { display:flex; align-items:flex-end; justify-content:space-between; gap:8px;
          padding:18px 12px 0; min-height:106px }
.cliente { display:flex; flex-direction:column; align-items:center; gap:3px; position:relative }
.persona { display:flex; flex-direction:column; align-items:center; line-height:1 }
.persona .testa { font-size:30px }
.persona .corpo { width:32px; height:22px; margin-top:-5px; border-radius:13px 13px 5px 5px;
                  background:var(--v); box-shadow:inset 0 -4px 8px #00000030, 0 2px 4px #0002 }
.persona.grande .testa { font-size:46px }
.persona.grande .corpo { width:48px; height:32px; margin-top:-7px; border-radius:18px 18px 6px 6px }
.pazienza { width:58px; height:7px; background:#00000022; border-radius:4px; overflow:hidden }
.pazienza i { display:block; height:100%; transition:width .2s linear }
.pazienza.corta { width:32px; height:5px }
.fumetto { position:absolute; left:40px; bottom:54px; white-space:nowrap; z-index:3;
           background:#fffdf7; border-radius:13px; padding:5px 11px 6px;
           box-shadow:0 3px 8px #0002; animation:dice .35s cubic-bezier(.2,1.4,.4,1) }
.fumetto::after { content:''; position:absolute; left:-4px; bottom:9px; width:11px; height:11px;
                  background:#fffdf7; transform:rotate(45deg); border-radius:2px }
.dice { font-size:13px; font-weight:800; color:#5a4632 }
/* la lista della spesa sta nel fumetto: è il cliente che chiede, non un
   cartello a parte, e così il bancone non si porta via mezzo schermo */
.lista { display:flex; gap:5px; margin-top:2px }
.lista .cosa { position:relative; font-size:27px; line-height:1; transition:all .2s }
.lista .cosa i { position:absolute; right:-6px; bottom:-3px; font-style:normal; font-size:11px;
                 font-weight:900; color:#fff; background:#e2725b; border-radius:7px;
                 padding:0 4px; box-shadow:0 1px 2px #0004 }
.lista .fatto { opacity:.32; filter:grayscale(1); transform:scale(.82) }
.lista .fatto i { background:#38c172 }
.porge { display:flex; align-items:center; gap:6px; margin-top:3px }
.porge b { font-size:14px; font-weight:900; color:#1c7a45 }
.fila { display:flex; align-items:flex-end; gap:7px; padding-bottom:2px }
.attesa { display:flex; flex-direction:column; align-items:center; gap:3px }
.quanti { align-self:center; font-size:10.5px; font-weight:900; color:#8a6a45;
          background:#ffffffaa; border-radius:8px; padding:2px 6px }
@keyframes dice { from { transform:scale(.5) translateY(6px); opacity:0 } to { transform:none; opacity:1 } }

/* ═══════════ IL BANCO ═══════════
   Un banco solo per tappa, con la tenda a righe dal bordo smerlato, l'insegna
   e il piano di legno. Tutto quello che si vende è lì sopra: niente da aprire. */
.banco { flex:1; min-height:0; display:flex; flex-direction:column; position:relative;
         margin-top:8px; border-radius:18px 18px 0 0; overflow:hidden;
         box-shadow:0 -3px 14px #00000026 }
.tenda { height:26px; flex:none;
         background:repeating-linear-gradient(90deg,var(--t) 0 16px,#fffdf7 16px 32px);
         -webkit-mask-image:radial-gradient(circle at 8px 26px, transparent 7.5px, #000 8px);
         mask-image:radial-gradient(circle at 8px 26px, transparent 7.5px, #000 8px);
         -webkit-mask-size:16px 100%; mask-size:16px 100%;
         -webkit-mask-repeat:repeat-x; mask-repeat:repeat-x }
.insegna { flex:none; align-self:center; margin-top:-1px; z-index:3; font-size:13.5px;
           font-weight:900; color:#fff; background:var(--c); border-radius:0 0 10px 10px;
           padding:3px 14px 4px; box-shadow:0 3px 6px #00000038 }

/* il piano: doghe di legno **orizzontali** — messe per il verso lungo
   sembravano fili tesi, non un banco */
.ceste, .cassa { flex:1; min-height:0; margin-top:-13px;
                 padding:18px 8px calc(10px + env(safe-area-inset-bottom));
                 background-color:var(--l);
                 background-image:repeating-linear-gradient(179deg,
                   #ffffff0f 0 2px, #00000000 2px 34px, #00000026 34px 36px);
                 box-shadow:inset 0 12px 20px #00000045 }
/* le ceste crescono fino a riempire il banco: `--r` è quante file ci sono,
   e senza quel conto restavano sei iconcine in mezzo a un piano vuoto */
.ceste { container-type:size; display:flex; flex-direction:column;
         justify-content:space-evenly; gap:4px; animation:apre .25s }
@keyframes apre { from { transform:translateY(10px); opacity:0 } to { transform:none; opacity:1 } }
.rigacesta { position:relative; display:flex; justify-content:center; align-items:flex-end;
             gap:3.5% }
/* il ripiano su cui le ceste si appoggiano: senza, galleggiavano */
.rigacesta::after { content:''; position:absolute; left:-6px; right:-6px; bottom:-6px; height:13px;
                    border-radius:3px; box-shadow:0 6px 10px #00000045;
                    background:linear-gradient(180deg,#e8c89e,#a9764a 45%,#8a5c36) }

/* ---------- una cesta ----------
   Non un prodotto per casella ma un mucchio dentro una cesta di vimini, col
   cartellino del prezzo: è così che è fatto un banco vero. */
/* larga quanto la sua fila permette, alta quanto il banco permette: una fila
   da due ha ceste grosse, una da tre ceste più strette, e in tutti i casi il
   piano si riempie invece di lasciare mezzo banco vuoto */
.cesta { position:relative; z-index:1; padding:0; border:0; background:none;
         width:min(calc(92% / var(--n, 3)), calc(88cqh / var(--r, 2)));
         aspect-ratio:1/.92; max-width:210px;
         font-size:min(calc(26vw / var(--n, 3)), calc(25cqh / var(--r, 2)));
         transition:filter .12s }
.cesta:active .vimini { transform:translateY(3px) }
.cesta.presa { opacity:.42; filter:saturate(.4) }
.cesta.storta { animation:scarto .42s }
/* La merce sta DENTRO: `.roba` è un piano suo (z-index 0) e il vimini gli
   passa davanti (z-index 2), così la frutta la si vede spuntare dal bordo
   invece di stare appoggiata sopra. Senza lo z-index sul piano, i pezzi con
   z-index proprio scavalcavano la cesta. */
.roba { position:absolute; z-index:0; left:8%; right:8%; top:8%; bottom:28% }
.roba i { position:absolute; font-style:normal; line-height:1;
          filter:drop-shadow(0 2px 2px #00000038) }
.vimini { position:absolute; z-index:2; left:5%; right:5%; bottom:0; height:52%;
          clip-path:polygon(0 0, 100% 0, 87% 100%, 13% 100%); border-radius:3px 3px 9px 9px;
          background:repeating-linear-gradient(90deg,#c68f52 0 8px,#a3703c 8px 16px);
          box-shadow:inset 0 -8px 12px #00000038; filter:drop-shadow(0 4px 3px #00000045) }
/* l'orlo intrecciato: è il dettaglio che fa la cesta */
.vimini::before { content:''; position:absolute; left:-4%; right:-4%; top:-7px; height:13px;
                  border-radius:7px; box-shadow:0 2px 3px #00000038, inset 0 2px 0 #ffffff33;
                  background:repeating-linear-gradient(90deg,#d8a163 0 7px,#b07c40 7px 14px) }
.cartello { position:absolute; right:0; bottom:-3px; z-index:4; font-size:11px; font-weight:900;
            color:#5a4632; background:#fffdf7; border-radius:5px; padding:1px 5px;
            box-shadow:0 2px 3px #0003; transform:rotate(-3deg) }
/* «ne vuole ancora due»: sta sulla cesta, e si vede solo dopo il primo pezzo */
.ancora { position:absolute; left:-2px; top:-2px; z-index:5; font-size:13px; font-weight:900;
          color:#fff; background:#e2725b; border-radius:9px; padding:1px 6px;
          box-shadow:0 2px 4px #0004; animation:dice .3s }

/* ═══════════ LA CASSA ═══════════
   Il registratore è disegnato — scontrino, display verde, tastierina — e sotto
   c'è il cassetto estratto con gli scomparti. Prima c'era scritto "CASSA". */
.cassa { display:flex; flex-direction:column; gap:7px }
.macchina { flex:none; display:flex; align-items:stretch; gap:8px; padding:0 2px }
.scontrino { flex:1; min-width:0; background:#fffdf7; border-radius:3px 3px 0 0;
             padding:5px 8px 10px; box-shadow:0 3px 6px #00000038; transform:rotate(-1deg);
             -webkit-mask-image:radial-gradient(circle at 5px 100%, transparent 4.5px, #000 5px);
             mask-image:radial-gradient(circle at 5px 100%, transparent 4.5px, #000 5px);
             -webkit-mask-size:10px 100%; mask-size:10px 100%;
             -webkit-mask-repeat:repeat-x; mask-repeat:repeat-x }
.voci { display:flex; flex-wrap:wrap; gap:0 10px }
.voci span { display:flex; align-items:center; gap:3px; font-size:11px; font-weight:800; color:#7a6045 }
.voci i { font-style:normal; font-size:15px }
.voci em { font-style:normal; font-size:10px; font-weight:900; color:#c8442f }
.somma { display:flex; justify-content:space-between; align-items:baseline;
         border-top:2px dashed #d8c3a5; margin-top:3px; padding-top:2px }
.somma span { font-size:10px; font-weight:900; color:#a98860; letter-spacing:1px }
.somma b { font-size:15px; font-weight:900; color:#5a4632 }
.corpo { flex:none; display:flex; flex-direction:column; gap:4px; align-items:center;
         padding:6px 8px 7px; border-radius:9px 9px 6px 6px;
         background:linear-gradient(180deg,#e4e9ee,#9fabb4);
         box-shadow:0 4px 0 #00000038, inset 0 2px 4px #ffffff99 }
.display { background:#1d2a1c; border-radius:5px; padding:3px 10px 4px; text-align:center;
           box-shadow:inset 0 2px 6px #000a; font-family:ui-monospace,monospace }
.display span { display:block; font-size:9px; font-weight:800; color:#6fbf80; letter-spacing:.5px }
.display b { display:block; font-size:clamp(17px,5vw,23px); font-weight:900; color:#9dfcb0;
             font-variant-numeric:tabular-nums }
.tastiera { display:grid; grid-template-columns:repeat(4,1fr); gap:2.5px; width:74px }
.tastiera i { height:6px; border-radius:2px; background:#78848c; box-shadow:inset 0 1px 0 #ffffff55 }

/* il piano dove finiscono le monete date */
.piatto { flex:none; background:#00000026; border-radius:11px; padding:5px 8px 6px;
          box-shadow:inset 0 2px 6px #00000038 }
.quanto { display:flex; align-items:baseline; gap:8px; justify-content:center }
.quanto b { font-size:21px; font-weight:900; color:#fff8ea; text-shadow:0 2px 3px #0006 }
.quanto span { font-size:12px; font-weight:800; color:#ffe3b8 }
.quanto .ok { color:#c9ffd8 }
.dati { display:flex; flex-wrap:wrap; gap:4px; justify-content:center; align-items:center;
        min-height:22px; margin-top:3px }

/* il cassetto estratto: ogni taglio nel suo scomparto */
.cassetto { flex:1; min-height:0; display:flex; flex-direction:column; gap:5px;
            border-radius:8px 8px 12px 12px; padding:6px;
            background:linear-gradient(180deg,#5d4a3a,#7a6350);
            box-shadow:inset 0 8px 14px #00000066, 0 -3px 0 #46372b }
.vaschette { flex:1; min-height:0; display:grid; grid-template-columns:repeat(3,1fr);
             grid-auto-rows:1fr; gap:5px }
.vaschette.larghe { flex:none; height:23%; grid-template-columns:repeat(2,1fr) }
.scomparto { display:flex; align-items:center; justify-content:center; padding:3px;
             border-radius:7px; background:#00000038; border:0;
             box-shadow:inset 0 3px 6px #00000059, inset 0 -1px 0 #ffffff1a }
.scomparto:active { transform:translateY(2px) }
@media (min-width:700px) { .vaschette { grid-template-columns:repeat(4,1fr) } }

/* ---------- il cartello del cambio banco ---------- */
.cartello-tappa { position:absolute; left:50%; top:46%; transform:translate(-50%,-50%);
                  z-index:40; display:flex; flex-direction:column; align-items:center; gap:2px;
                  background:#fffdf7; border-radius:20px; padding:14px 26px 15px;
                  box-shadow:0 8px 0 #00000026, 0 14px 30px #00000045, inset 0 0 0 4px var(--c);
                  animation:arriva .45s cubic-bezier(.2,1.4,.4,1) }
.cartello-tappa .ico { font-size:52px; line-height:1 }
.cartello-tappa b { font-size:19px; font-weight:900; color:var(--c) }
.cartello-tappa .mini { font-size:11.5px; font-weight:800; color:#a98860 }
@keyframes arriva { from { transform:translate(-50%,-50%) scale(.6); opacity:0 }
                    to { transform:translate(-50%,-50%) scale(1); opacity:1 } }

.vola { position:absolute; left:50%; bottom:36%; font-size:40px; z-index:30; pointer-events:none;
        animation:passa .5s ease-out forwards }
@keyframes passa { from { transform:translate(-50%,0) scale(1); opacity:1 }
                   to { transform:translate(-160%,-150px) scale(.5); opacity:0 } }

/* ---------- monete e banconote ---------- */
.soldo { position:relative; width:100%; height:auto; max-width:78px; max-height:100%;
         aspect-ratio:1; border-radius:50%; display:flex; align-items:center;
         justify-content:center; font-size:clamp(15px,5.2vw,27px); font-weight:900;
         line-height:1; border:0; box-shadow:0 4px 0 #00000038, inset 0 2px 5px #ffffff66 }
.soldo .u { font-style:normal; font-size:.5em; align-self:center; margin-top:.5em; margin-left:1px }
.soldo.mini { width:34px; height:34px; max-width:none; aspect-ratio:auto; font-size:13px;
              align-items:baseline; padding-top:11px; box-shadow:0 2px 0 #00000038 }
.soldo.mini .u { font-size:8px; margin-top:0; align-self:auto }

.soldo.rame { background:radial-gradient(circle at 35% 30%, #e8a882, #b8642f 70%); color:#4a220c }
.soldo.oro  { background:radial-gradient(circle at 35% 30%, #ffe9a3, #d3a021 70%); color:#5a4008 }
/* le bimetalliche vanno disegnate come anelli concentrici: 1 € e 2 € si
   riconoscono proprio da lì */
.soldo.uno { background:radial-gradient(circle at 50% 50%, #f7d377 0 57%, #dde1e4 57%); color:#5a4008 }
.soldo.due { background:radial-gradient(circle at 50% 50%, #dde1e4 0 57%, #f7d377 57%); color:#3d4448 }
.soldo.uno::after, .soldo.due::after { content:''; position:absolute; inset:3px; border-radius:50%;
      background:radial-gradient(circle at 34% 26%, #ffffff55, #ffffff00 60%); pointer-events:none }

.soldo.carta { width:100%; max-width:136px; aspect-ratio:1.7; height:auto; border-radius:6px;
               padding:0; overflow:hidden; align-items:center;
               box-shadow:0 4px 0 #00000038, inset 0 0 0 2px #ffffff55 }
.soldo.carta .finestra { position:absolute; left:8%; top:14%; width:20%; height:62%;
      border-radius:22% 22% 6% 6%; background:#ffffff5e; box-shadow:inset 0 0 0 1.5px #ffffff8c }
.soldo.carta .banda { position:absolute; right:6%; top:9%; bottom:9%; width:14%; border-radius:3px;
      background:linear-gradient(160deg,#fff8,#fff2,#fff8) }
.soldo.carta .cifra { font-size:clamp(19px,5.4vw,30px); font-weight:900; line-height:1 }
.soldo.carta .cifra::after { content:'€'; font-size:.55em; margin-left:1px }
.soldo.b5  { background:linear-gradient(150deg,#e6e1d2,#b3ac99); color:#4a4433 }
.soldo.b10 { background:linear-gradient(150deg,#f3b3ab,#d0655a); color:#5c1d16 }
.soldo.b20 { background:linear-gradient(150deg,#b6d2ee,#5f92c8); color:#153a5e }
.soldo.carta.mini { width:52px; height:31px; max-width:none; aspect-ratio:auto;
                    border-radius:3px; padding:0 }
.soldo.carta.mini .cifra { font-size:15px }
.soldo.carta.mini .cifra::after { font-size:8px }
.soldo.carta.mini .finestra { left:7%; top:14%; width:20%; height:64% }
.soldo.carta.mini .banda { right:5%; top:9%; bottom:9%; width:14% }

.soldo.rifiutata { animation:scarto .42s }
@keyframes scarto { 0%,100%{transform:none} 25%{transform:translateX(-8px) rotate(-9deg)}
                    60%{transform:translateX(8px) rotate(9deg)} }
.annulla { width:32px; height:32px; border-radius:50%; background:#ffffff44; color:#fff;
           font-size:16px; font-weight:900; margin-left:4px }
/* il tasto della cassa rotta: la risposta la dai tu */
.eccolo { margin-left:6px; padding:6px 13px; border-radius:12px; border:0; color:#1c3d24;
          font-size:13px; font-weight:900; background:linear-gradient(180deg,#a8f0b8,#5cc47a);
          box-shadow:0 3px 0 #2f7a4a }
.eccolo:active { transform:translateY(2px); box-shadow:0 1px 0 #2f7a4a }
.piatto.nonTorna { animation:scarto .5s }
.corpo.rotta .display b { color:#ffd76a; letter-spacing:2px }

.vetrina { font-size:38px; letter-spacing:2px }
.moneta { position:fixed; left:50%; top:40%; transform:translateX(-50%); z-index:60;
          font-size:38px; font-weight:900; color:#c98a00; pointer-events:none;
          animation:vola 1.1s ease-out forwards }
@keyframes vola { 0%{transform:translateX(-50%) scale(.4);opacity:0}
                  30%{transform:translateX(-50%) scale(1.3);opacity:1}
                  100%{transform:translate(-50%,-120px) scale(.85);opacity:0} }
</style>
