<script setup>
/* LA BANCARELLA — il negoziante sei tu, il mercato si gira a tappe.
   Vedi docs/bancarella/presentazione.md e regole.md. */
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, onUnmounted } from 'vue'
import { state, answer, segna, segnaBest,
         mercatoProgresso, mercatoCompleta, tappaAperta } from '../store/profile.js'
import { generaCliente, esposizione, tappaDi, campagnaDi, scomponi, euro,
         centesimiScritti, scriviCifra, premioCliente, stelleDiGiornata, perLaProssima,
         BANCHI, CAMPAGNE, CLIENTI_PER_TAPPA } from '../data/bancarella.js'
import { CITTA, statoCitta, statoGiornata, cittaCorrente, fatteIn, indiceDi, giornataDi,
         cittaDelleGiornata, stelleGiornata, stelleCitta, stelleMassime } from '../data/bancarella-mondo.js'
import { suono } from '../audio.js'
import { borsa } from '../store/varieta.js'
import Barra from '../components/Barra.vue'
import Mondo from '../components/bancarella/Mondo.vue'
import Piazza from '../components/bancarella/Piazza.vue'
import { usaPausa } from '../giochi/pausa.js'
import VeloPausa from '../giochi/VeloPausa.vue'
import Ripresa from '../giochi/Ripresa.vue'
import { sosta, salvaSosta, buttaSosta } from '../giochi/campagne.js'
import { scrivi, leggi, dice } from '../motore/bancarella/sosta.js'

const emit = defineEmits(['vai'])

const CUORI = 3
// le monete di questa giornata: un cliente servito paga subito (docs/bancarella/regole.md)
let borsellino = borsa('bancarella')
const guadagno = reactive({ monete: 0, nota: '' })
/* i dodici tasti della cassa, nell'ordine di un registratore vero: le
   cifre, la virgola e il cancelletto. Il ✓ sta a parte perché è l'unico
   che manda qualcosa — gli altri scrivono e basta. */
const TASTI = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫']
const fase = ref('mondo')           // mondo | piazza | gioco | fine
const citta = ref(0)                // la piazza aperta: l'indice in CITTA
const idx = ref(0)                  // quale giornata (-1 = giornata libera)
const nTappa = ref(0)               // a che tappa del giro siamo
const esposti = ref([])             // la merce sul banco di questa tappa
const coda = ref([])                // la fila davanti al banco
const piatto = ref([])              // le monete già posate
const hud = reactive({ cuori: CUORI, serviti: 0, perfetti: 0, incasso: 0, intoppi: 0 })
const momento = ref('raccolta')     // raccolta | cassa
const presi = ref([])               // merce già passata al cliente
const sbagliato = ref('')
const rifiutata = ref(0)
const bonus = ref(false)
const moneta = ref(0)
const battuta = ref('')
const digitato = ref('')            // la cifra che sta battendo sulla cassa
const contoFatto = ref(false)       // il totale l'ha già indovinato
const cambio = ref(null)            // il cartello del cambio banco
const esito = ref('')               // vinta | persa
const voto = ref(null)              // a giornata vinta: { stelle, migliore } (le stelle di questa volta e le migliori)
const volo = ref(null)              // la roba che vola dalla cesta al cliente
let raf = 0, ultimo = 0, apertoIl = 0, occupato = false, rifiuti = 0
let dettoFretta = false, nVolo = 0

const prog = computed(() => mercatoProgresso())
const sbloccata = i => tappaAperta(i, prog.value.tappa)
/* si può giocare: una giornata della fila se è aperta; la libera quando la fila è finita */
const puoGiocare = i => (i >= 0 ? sbloccata(i) : tappaAperta(CAMPAGNE.length, prog.value.tappa))

/* Il giro del mondo e la piazza (docs/bancarella/mappa.md): quello che si
   vede si ricava da quante giornate sono finite e da cosa è aperto. */
const aperta = i => tappaAperta(i, prog.value.tappa)
const cittaCorr = computed(() => cittaCorrente(prog.value.tappa, aperta))
const vociMondo = computed(() => CITTA.map((c, k) => ({
  ...c, k, stato: statoCitta(c, prog.value.tappa, aperta), fatte: fatteIn(c, prog.value.tappa),
  tot: c.libera ? 0 : c.giornate.length,
  stelle: stelleCitta(c, prog.value.tappa, prog.value.stelle), stelleMax: stelleMassime(c),
  serve: c.libera ? 'Si apre quando hai finito tutte le giornate.'
                  : `Prima finisci le giornate di «${CITTA[cittaCorr.value].nome}».`,
})))
const banchiPiazza = computed(() => CITTA[citta.value].giornate.map(id => ({
  id, giornata: giornataDi(id), numero: id === 'libera' ? '∞' : indiceDi(id) + 1,
  stato: statoGiornata(id, prog.value.tappa, aperta),
  stelle: stelleGiornata(id, prog.value.tappa, prog.value.stelle),
  serve: prog.value.tappa < CAMPAGNE.length ? `Prima tocca a «${CAMPAGNE[prog.value.tappa].nome}».`
                                            : 'Si apre quando hai finito tutte le giornate.',
})))
const stellePiazza = computed(() => {
  const c = CITTA[citta.value]
  if (c.libera) return 'senza fine'
  const fatte = fatteIn(c, prog.value.tappa)
  return `${fatte} di ${c.giornate.length} giornate` +
         (fatte ? ` · ★ ${stelleCitta(c, prog.value.tappa, prog.value.stelle)} di ${stelleMassime(c)}` : '')
})
let cittaPrima = 0                  // la città da fare quando è cominciata la giornata
function entraInCitta(k) { citta.value = k; fase.value = 'piazza' }
function indietro() {
  if (fase.value === 'piazza') fase.value = 'mondo'
  else esci()
}
/* finita la giornata si torna alla piazza; se ha aperto una città nuova si torna
   sul mondo, dove l'aereo ci vola */
function tornaAlleGiornate() {
  citta.value = Math.max(0, cittaDelleGiornata(camp.value.id))
  fase.value = cittaCorr.value !== cittaPrima ? 'mondo' : 'piazza'
}
const camp = computed(() => campagnaDi(idx.value))
const T = computed(() => tappaDi(camp.value, nTappa.value))
const B = computed(() => BANCHI[T.value.banco])
const cliente = computed(() => coda.value[0] || null)
const dato = computed(() => piatto.value.reduce((s, c) => s + c, 0))
const manca = computed(() => (cliente.value ? cliente.value.resto - dato.value : 0))
const monetine = computed(() => (cliente.value ? cliente.value.monete.filter(v => v < 500) : []))
const carte = computed(() => (cliente.value ? cliente.value.monete.filter(v => v >= 500) : []))

/* Il cartello del cambio banco resta fuori da `anche` di proposito: è
   un'attesa dentro la partita, e il suo orologio ne risentirebbe (vedi
   sotto). Rinominati perché `metti`/`togli` qui sono già le monete sul
   piatto della cassa. */
const { inPausa, fermo, aiutoAperto, metti: mettiInPausa, togli: togliLaPausa,
        aiuto: leggeLaGuida } = usaPausa({ anche: () => fase.value !== 'gioco' })

/* Cosa si stava facendo, sul velo: il banco, che è la sola cosa che fa
   riconoscere la giornata lasciata a metà. */
const dovEravamo = computed(() => (fase.value === 'gioco' && B.value
  ? `${B.value.icona} ${B.value.nome}` : ''))

/* `setTimeout`, a differenza del `ciclo` a fotogrammi, non si congela da sé
   a pagina nascosta: qui si congela quello che resta e riparte da lì. Uno
   solo perché i due usi — il cartello del banco e il cliente che lascia il
   posto — non capitano mai insieme. */
let timer = 0, scadeIl = 0, restaAl = 0, faPoi = null

function programma(fn, ms) {
  clearTimeout(timer)
  faPoi = fn
  // a velo su resta congelato, come farebbe il `watch` qui sotto
  if (inPausa.value || aiutoAperto.value) { timer = 0; restaAl = ms; return }
  scadeIl = performance.now() + ms
  timer = setTimeout(() => { timer = 0; const f = faPoi; faPoi = null; f() }, ms)
}

function spegniOrologio() {
  clearTimeout(timer); timer = 0; faPoi = null; restaAl = 0
}

/* Si congela solo per il velo della pausa e il foglio del `?`, non per
   tutto `fermo` (vedi docs/bancarella/regole.md, «Fermarsi»). */
watch(() => inPausa.value || aiutoAperto.value, giu => {
  if (giu) {
    if (!timer) return
    restaAl = Math.max(0, scadeIl - performance.now())
    clearTimeout(timer); timer = 0
  } else if (!timer && faPoi) {
    programma(faPoi, restaAl)
  }
})

/* ---------- battute ---------- */
const pick = a => a[Math.floor(Math.random() * a.length)]
const SALUTI   = ['Ciao! 👋', 'Buongiorno!', 'Salve!', 'Buondì!']
const CHIEDE   = ['Vorrei…', 'Mi dà…', 'Per favore…', 'Prendo…']
const OFFERTE  = ['Ecco a lei!', 'Tenga pure', 'Le do questa']
const SBAGLIO  = ['No, non quello!', 'Non è questo…', 'Ehm, no']
const ESATTO   = ['Esatto!', 'Proprio così', 'Giusto!']
const GRAZIE   = ['Grazie! 😊', 'Grazie mille!', 'A presto!', 'Arrivederci!']
const PERFETTI = ['Preciso! ✨', 'Che bravo!', 'Giusti giusti!']
const FRETTA   = ['Ho un po\' di fretta…', 'Sbrighiamoci?', 'Uhm…']
const UFFA     = ['Me ne vado!', 'Troppo lento!', 'Uffa…']

/* la giornata */
function inizia(i = idx.value) {
  if (!puoGiocare(i)) return
  scorda()
  cittaPrima = cittaCorr.value
  const k = cittaDelleGiornata(campagnaDi(i).id)
  if (k >= 0) citta.value = k
  // il freno della mappa non deve restare acceso sul mercato nuovo
  togliLaPausa()
  spegniOrologio()
  idx.value = i
  nTappa.value = 0
  hud.cuori = CUORI; hud.serviti = 0; hud.perfetti = 0; hud.incasso = 0; hud.intoppi = 0
  borsellino = borsa('bancarella'); Object.assign(guadagno, { monete: 0, nota: '' })
  piatto.value = []; occupato = false; rifiuti = 0; bonus.value = false
  esito.value = ''; voto.value = null
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
  programma(() => { cambio.value = null; alBanco() }, 1500)
}

function alBanco() {
  dettoFretta = false
  momento.value = 'raccolta'
  presi.value = []
  piatto.value = []
  digitato.value = ''
  contoFatto.value = false
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
  if (!coda.value.length) tappaFinita()
  else alBanco()
  salva()
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
   `chiediTotale`/`aMente` sono `conto` (vedi data/bancarella.js) scomposto
   in due domande. Finché il totale non è indovinato il cassetto non si
   apre nemmeno: dare il resto prima di sapere quanto costa non vuol dire
   niente. */
const aMente = computed(() => !!(cliente.value && cliente.value.chiediResto))
const chiediTotale = computed(() =>
  !!(cliente.value && cliente.value.chiediTotale) && !contoFatto.value)

/* Il totale battuto sulla cassa: mai la cifra giusta, solo troppo/poco
   (vedi docs/bancarella/regole.md). */
function batti(t) {
  if (occupato || !cliente.value || momento.value !== 'cassa' || !chiediTotale.value) return
  digitato.value = scriviCifra(digitato.value, t)
  suono.nota(600, 700, 0.05, 'square', 0.05)
}

function confermaTotale() {
  const c = cliente.value
  if (occupato || !c || momento.value !== 'cassa' || !chiediTotale.value) return
  const detto = centesimiScritti(digitato.value)
  if (detto === null) return
  if (detto === c.totale) {
    contoFatto.value = true
    battuta.value = pick(ESATTO)
    suono.nota(720, 980, 0.09, 'triangle', 0.11)
    return
  }
  rifiuti++
  sbagliato.value = 'conto'
  setTimeout(() => { if (sbagliato.value === 'conto') sbagliato.value = '' }, 600)
  battuta.value = detto > c.totale ? 'È troppo!' : 'È poco…'
  suono.no()
  c.restaPazienza = Math.max(2, c.restaPazienza - 3)
  digitato.value = ''
}

function metti(v) {
  const c = cliente.value
  if (occupato || !c || momento.value !== 'cassa' || chiediTotale.value) return
  if (!c.chiediResto && dato.value + v > c.resto) {
    // non si sbaglia per eccesso: la moneta è rifiutata, costa tempo non un cuore
    rifiuti++
    rifiutata.value = v
    setTimeout(() => { if (rifiutata.value === v) rifiutata.value = 0 }, 420)
    suono.no()
    c.restaPazienza = Math.max(2, c.restaPazienza - 2)
    return
  }
  piatto.value.push(v)
  suono.nota(680, 900, 0.06, 'triangle', 0.09)
  if (!c.chiediResto && dato.value === c.resto) consegna()
}

const togli = () => { if (!occupato) piatto.value.pop() }

/* «Ecco il resto»: solo a cassa rotta. Se non torna si riprova, non si
   perde un cuore né si scopre la cifra. */
function proponi() {
  const c = cliente.value
  if (occupato || !c || momento.value !== 'cassa' || chiediTotale.value ||
      !piatto.value.length) return
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
  if (rifiuti > 0) hud.intoppi++      // un conto da rifare: costa una stella (stelleDiGiornata)
  segna('clienti'); segna('incasso', c.totale)
  if (perfetto) { hud.perfetti++; bonus.value = true; segna('restiPerfetti') }
  battuta.value = pick(perfetto ? PERFETTI : GRAZIE)
  suono.moneta()
  // quanto vale lo dice la giornata (MONETE_CLIENTE in data/bancarella.js), non il livello
  const preso = borsellino.paga(premioCliente(camp.value))
  guadagno.monete = borsellino.dato
  if (preso) { moneta.value = preso; setTimeout(() => (moneta.value = 0), 1100) }
  programma(prossimo, 900)
}

/* ---------- il tempo ----------
   `!cambio.value && !occupato` sono le due attese di casa: non una pausa,
   quindi non passano da `fermo`. */
function ciclo(ts) {
  const dt = Math.min(0.05, (ts - ultimo) / 1000 || 0); ultimo = ts
  if (!fermo.value && !cambio.value && !occupato) {
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
  hud.intoppi++                       // un cliente perso è un intoppo (le stelle)
  if (--hud.cuori <= 0) { coda.value.shift(); return chiudi('persa') }
  prossimo()
}

function chiudi(come) {
  scorda()
  esito.value = come
  guadagno.nota = borsellino.nota()
  fase.value = 'fine'
  cancelAnimationFrame(raf)
  spegniOrologio()
  cambio.value = null
  segnaBest('clienti', hud.serviti)
  voto.value = null
  if (come === 'vinta' && idx.value >= 0) {
    const stelle = stelleDiGiornata(hud.intoppi)
    const prima = (prog.value.stelle || {})[camp.value.id] || 0
    mercatoCompleta(idx.value, CAMPAGNE.length, stelle)
    voto.value = { stelle, migliore: Math.max(prima, stelle) }
  }
  suono.fine()
}

/* la prossima giornata, se c'è e se è aperta */
const dopo = computed(() => {
  if (idx.value < 0) return -1
  const p = idx.value + 1
  return p < CAMPAGNE.length ? p : (prog.value.libera ? -1 : null)
})

/* Il disegno del banco: righe da tre e da due che si alternano, ognuna
   spostata di un pelo — niente scacchiera. */
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
                    batti, confermaTotale, digitato, contoFatto, chiediTotale, TASTI,
                    CAMPAGNE, BANCHI, prog, guadagno, inPausa, citta, CITTA, cittaCorr, chiudi, voto }
})
onUnmounted(() => { cancelAnimationFrame(raf); spegniOrologio() })

/* ── la giornata lasciata a metà ──
   Uscire non butta via niente: si scrive dove si era (motore/bancarella/sosta.js)
   e la mappa la offre in cima. Vedi docs/bancarella/regole.md, «Lasciare a metà». */
const CHIAVE = 'bancarella'
const laRipresa = () => {
  const d = dice(sosta(CHIAVE))
  if (!d) return null
  const dove = d.libera ? `banco ${d.n}` : `banco ${d.n} di ${d.di}`
  return { emoji: d.emoji, nome: d.nome,
           dettaglio: `${d.banco.icona} ${dove} · ${'❤️'.repeat(d.cuori)} · 🧾 ${d.serviti}` }
}
const ripresa = ref(laRipresa())
const chiede = ref(null)           // { nome, i }: la giornata nuova che butterebbe quella a metà

const foto = () => ({
  idx: idx.value, nTappa: nTappa.value, hud, esposti: esposti.value, coda: coda.value,
  momento: momento.value, presi: presi.value, piatto: piatto.value, digitato: digitato.value,
  contoFatto: contoFatto.value, rifiuti, cartello: !!cambio.value,
  trascorso: performance.now() - apertoIl,
  monete: { chiesto: borsellino.chiesto, dato: borsellino.dato },
})

function salva({ subito = false } = {}) {
  if (fase.value !== 'gioco') return
  // il cliente appena servito ha già pagato: il suo giro si chiude prima di scrivere
  if (occupato && faPoi === prossimo) {
    spegniOrologio(); prossimo()
    if (fase.value !== 'gioco') return       // era l'ultimo della giornata
  }
  salvaSosta(CHIAVE, scrivi(foto()), { subito })
}

function scorda() {
  if (sosta(CHIAVE)) buttaSosta(CHIAVE)
  ripresa.value = null
  chiede.value = null
}

function vuoleIniziare(i) {
  if (!puoGiocare(i)) return
  if (!ripresa.value) return inizia(i)
  chiede.value = { nome: campagnaDi(i).nome, i }
}
const comincia = () => inizia(chiede.value.i)

// se il salvataggio non si legge più la carta sparisce e resta la mappa
function riprendiPartita() {
  const g = leggi(sosta(CHIAVE))
  if (!g || (g.idx >= 0 && !sbloccata(g.idx))) return scorda()
  spegniOrologio()
  // la giornata ripresa nasce ferma, dietro il velo: riparte al tocco
  mettiInPausa({ auto: true })
  idx.value = g.idx
  cittaPrima = cittaCorr.value
  citta.value = Math.max(0, cittaDelleGiornata(campagnaDi(g.idx).id))
  nTappa.value = g.nTappa
  Object.assign(hud, g.hud)
  borsellino = borsa(CHIAVE, g.monete)
  Object.assign(guadagno, { monete: borsellino.dato, nota: '' })
  esposti.value = g.esposti
  coda.value = g.coda
  occupato = false; bonus.value = false; esito.value = ''
  ripresa.value = null
  chiede.value = null
  fase.value = 'gioco'
  if (g.cartello) {
    momento.value = 'raccolta'; presi.value = []; piatto.value = []
    cambio.value = { banco: T.value.banco, n: nTappa.value }
    programma(() => { cambio.value = null; alBanco() }, 1500)
  } else {
    const b = g.banco
    cambio.value = null
    momento.value = b.momento
    presi.value = b.presi
    piatto.value = b.piatto
    digitato.value = b.digitato
    contoFatto.value = b.contoFatto
    rifiuti = b.rifiuti
    apertoIl = performance.now() - b.trascorso
    dettoFretta = barra(cliente.value) < 30
    battuta.value = pick(b.momento === 'cassa' ? OFFERTE : CHIEDE)
  }
  ultimo = 0
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(ciclo)
}

function esci() {
  salva({ subito: true })
  emit('vai', 'home')
}

// su un telefono l'app non si chiude, sparisce: è l'ultimo momento per scrivere
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true })
}
onMounted(() => {
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
// prima di smontare: dopo, la fila non c'è più
onBeforeUnmount(() => {
  salva({ subito: true })
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
})
</script>

<template>
  <div class="schermo negozio">
    <!-- niente salvadanaio in barra: qui si maneggiano euro, e lo spazio serve ai cuori -->
    <!-- il ⏸ c'è solo dove la fila si spazientisce -->
    <Barra :titolo="fase === 'piazza' ? CITTA[citta].nome : 'Bancarella'" guida="bancarella"
           :monete="fase !== 'gioco'"
           :pausa="fase === 'gioco' && !state.festa.length" @pausa="mettiInPausa()"
           @aiuto="leggeLaGuida" @indietro="indietro">
      <template v-if="fase === 'gioco'">
        <div class="gettone">{{ '❤️'.repeat(Math.max(0, hud.cuori)) || '💔' }}</div>
        <div class="gettone">🧾 <b>{{ hud.serviti }}</b></div>
        <div class="gettone">✨ <b>{{ hud.perfetti }}</b></div>
      </template>
    </Barra>

    <!-- il giro del mondo e la piazza della città (docs/bancarella/mappa.md) -->
    <div v-if="fase === 'mondo' || fase === 'piazza'" class="giro">
      <div class="in-cima">
        <Ripresa :ripresa="ripresa" :chiede="chiede ? chiede.nome : ''"
                 @riprendi="riprendiPartita" @scorda="scorda"
                 @comincia="comincia" @annulla="chiede = null" />
      </div>
      <Mondo v-if="fase === 'mondo'" :voci="vociMondo" :corrente="cittaCorr"
             :chi="state.player || ''" @entra="entraInCitta" />
      <Piazza v-else :key="citta" :citta="CITTA[citta]" :banchi="banchiPiazza" :stelle="stellePiazza"
              :chi="state.player || ''" @gioca="id => vuoleIniziare(indiceDi(id))" @mondo="fase = 'mondo'" />
    </div>

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

      <div class="banco" :style="{ '--c': B.colore, '--t': B.tenda, '--l': B.legno }">
        <div class="tenda"></div>
        <div class="insegna">{{ B.icona }} {{ B.nome }}</div>

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

        <div v-else class="cassa">
          <div class="macchina">
            <div class="scontrino">
              <div class="voci">
                <span v-for="a in cliente.articoli" :key="a.emoji">
                  <i>{{ a.emoji }}</i><em v-if="a.quanti > 1">×{{ a.quanti }}</em>
                  <b>{{ euro(a.prezzo * a.quanti) }}</b>
                </span>
              </div>
              <div class="somma" :class="{ daFare: chiediTotale }">
                <span>TOTALE</span><b>{{ chiediTotale ? '? ? ?' : euro(cliente.totale) }}</b>
              </div>
            </div>
            <div class="corpo" :class="{ rotta: aMente || chiediTotale }">
              <!-- mentre batte il totale mostra quello che sta scrivendo, come su un registratore vero -->
              <div class="display" v-if="chiediTotale">
                <span>QUANTO FA?</span>
                <b>{{ digitato ? digitato + ' €' : '_ _ _' }}</b>
                <span>BATTI IL TOTALE</span>
              </div>
              <div class="display" v-else>
                <span>PAGA {{ euro(cliente.paga) }}</span>
                <b>{{ aMente ? '? ? ?' : euro(cliente.resto) }}</b>
                <span>DI RESTO</span>
              </div>
              <div class="tastiera"><i v-for="n in 12" :key="n"></i></div>
            </div>
          </div>

          <!-- la tastiera vera sta qui e non nel registratore: dodici tasti
               larghi due centimetri non ci stanno in 74 pixel -->
          <div v-if="chiediTotale" class="tastierone" :class="{ nonTorna: sbagliato === 'conto' }">
            <button v-for="t in TASTI" :key="t" class="tasto" :data-tasto="t"
                    @click="batti(t)">{{ t }}</button>
            <button class="tasto ok" data-tasto="fatto" @click="confermaTotale">✓ è questo</button>
          </div>

          <!-- quello che hai già posato sul banco -->
          <div v-else class="piatto" :class="{ nonTorna: sbagliato === 'conto' }">
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
          <div v-if="!chiediTotale" class="cassetto">
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

    <div v-else class="centro">
      <h1 style="font-size:30px">{{ esito === 'vinta' ? 'Giornata finita!' : 'Il banco ha chiuso' }}</h1>
      <div class="vetrina">{{ esito === 'vinta' ? '🎉' : hud.serviti >= 5 ? '😊' : '😅' }}</div>
      <p class="testo">Clienti serviti: <b>{{ hud.serviti }}</b> ·
        resti perfetti: <b>{{ hud.perfetti }}</b><br>Incasso: <b>{{ euro(hud.incasso) }}</b><template
          v-if="guadagno.monete"> · <b data-monete-prese>+{{ guadagno.monete }} 🪙</b></template></p>
      <p v-if="guadagno.nota" class="mini" data-nota-monete>{{ guadagno.nota }}</p>
      <p v-if="esito === 'vinta' && idx >= 0" class="mini">{{ camp.nome }} · giornata superata</p>
      <div v-if="voto" class="voto" data-voto :data-stelle="voto.stelle">
        <div class="stelline" aria-hidden="true">
          <span v-for="n in 3" :key="n" :class="{ piena: n <= voto.stelle }">{{ n <= voto.stelle ? '★' : '☆' }}</span>
        </div>
        <p class="testo" data-voto-testo>
          {{ voto.stelle }} {{ voto.stelle === 1 ? 'stella' : 'stelle' }}<template
            v-if="hud.intoppi"> · {{ hud.intoppi }} {{ hud.intoppi === 1 ? 'intoppo' : 'intoppi' }} fra conti e clienti</template>
        </p>
        <p v-if="voto.stelle < 3" class="mini" data-voto-serve>
          Per {{ voto.stelle === 1 ? 'la seconda' : 'la terza' }} stella: {{ perLaProssima(voto.stelle) }}.</p>
        <p v-else class="mini" data-voto-serve>Nessun conto sbagliato: il massimo!</p>
        <p v-if="voto.migliore > voto.stelle" class="mini" data-voto-meglio>
          Resta la tua migliore: {{ voto.migliore }} {{ voto.migliore === 1 ? 'stella' : 'stelle' }}.</p>
      </div>
      <div class="riga">
        <button v-if="esito === 'vinta' && dopo !== null" class="bottone" @click="inizia(dopo)">
          {{ dopo < 0 ? 'Giornata libera ▶' : 'Prossima giornata ▶' }}
        </button>
        <button v-else class="bottone" @click="inizia(idx)">Riprova ▶</button>
        <button class="bottone chiaro" data-azione="le-giornate" @click="tornaAlleGiornate">Le giornate</button>
      </div>
    </div>

    <div v-if="moneta" class="moneta">+{{ moneta }} 🪙</div>

    <!-- niente velo sopra un altro velo: dove il gioco è già fermo dietro
         il suo (fine giornata, traguardo) non se ne mette un secondo -->
    <VeloPausa v-if="inPausa && fase === 'gioco' && !state.festa.length"
               :dove="dovEravamo" @riprendi="togliLaPausa" @esci="esci" />
  </div>
</template>

<style scoped>
.negozio { background:linear-gradient(180deg,#cfe8f5,#ffe9c7 32%,#f3e6d0) }

/* ---------- il voto di fine giornata ---------- */
.voto { display:flex; flex-direction:column; align-items:center; gap:2px; margin:2px 0 4px }
.voto .testo, .voto .mini { margin:0 }
.stelline { display:flex; gap:6px; font-size:40px; line-height:1; color:#c9b88f }
.stelline .piena { color:#f0a800; text-shadow:0 2px 0 #c97b12 }

/* ---------- il giro del mondo ---------- */
.giro { flex:1; min-height:0; display:flex; flex-direction:column }
.in-cima { flex:none; display:flex; justify-content:center; padding:0 12px }
.in-cima:empty { display:none }

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

/* il banco: la tenda a righe dal bordo smerlato, l'insegna e il piano di legno */
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

/* la cassa: il registratore disegnato — scontrino, display verde, tastierina —
   e sotto il cassetto estratto con gli scomparti */
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
/* il totale ancora da battere: si vede che è un buco, non una cifra */
.somma.daFare b { color:#c8442f; letter-spacing:2px }

/* la tastiera vera: tre colonne larghe come su un telefono, il ✓ largo
   quanto tutta la fila per non confonderlo con un tasto che scrive.
   Le righe sono dichiarate (`repeat(5,1fr)`) e non lasciate al contenuto:
   un grid che si misura sui tasti cresce oltre `flex:1` e il ✓ esce dallo
   schermo. */
.tastierone { flex:1; min-height:0; display:grid; grid-template-columns:repeat(3,1fr);
              grid-template-rows:repeat(5,1fr); gap:5px; padding:7px; border-radius:12px;
              background:linear-gradient(180deg,#5d4a3a,#7a6350);
              box-shadow:inset 0 3px 8px #00000055 }
.tastierone .tasto { display:flex; align-items:center; justify-content:center;
                     min-height:0; font:900 clamp(18px,5.5vw,26px)/1 inherit; color:#3c3226;
                     border:0; border-radius:9px; padding:0; cursor:pointer;
                     background:linear-gradient(180deg,#f6efe0,#d8c8ad);
                     box-shadow:0 3px 0 #00000055, inset 0 1px 0 #fff9 }
.tastierone .tasto:active { transform:translateY(2px); box-shadow:0 1px 0 #00000055 }
.tastierone .ok { grid-column:1/-1; font-size:clamp(15px,4.6vw,19px); color:#123a1c;
                  background:linear-gradient(180deg,#bff0c4,#6fc47e) }
/* uno scarto laterale e basta: la rotazione di `scarto` sta bene su un
   piattino e fa ribaltare un pannello alto mezzo schermo */
.tastierone.nonTorna { animation:sussulto .4s }
@keyframes sussulto { 0%,100%{transform:none} 20%{transform:translateX(-9px)}
                      50%{transform:translateX(8px)} 80%{transform:translateX(-4px)} }

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
