<script setup>
/* ═══════════════════════════════════════════════════════════════════
   TABELLINE ASTEROIDI — a campagna, come il castello.

   Il menu non chiede più "quali tabelline vuoi allenare?": è una domanda
   a cui un bambino non sa rispondere, e la risposta sbagliata rovina la
   partita (spuntando tutto ogni tabellina esce un decimo delle volte).
   Al suo posto c'è una fila di dieci pianeti: ognuno porta una tabellina
   nuova, si porta dietro le precedenti come ripasso, e si supera con un
   bersaglio di partita. La scelta a mano resta, ma dopo: nel volo libero,
   che si apre a campagna finita.

   Due cose diverse, tenute separate apposta:
     · superare il pianeta → il bersaglio di stasera, dà monete
     · la stella ⭐        → tutte e dieci le caselle della tabellina sono
                             imparate secondo il motore. Non si conquista
                             una volta per sempre: se non si ripassa, torna
                             indietro, ed è giusto che si veda.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { state, item, answer, level, addCoins, countMastered,
         segna, segnaBest, mateProgresso, mateCompleta, tabellineIntere,
         calcProgresso, calcCompleta, tappaAperta } from '../store/profile.js'
import { createPicker, activeSet, overdue, weight, SRS } from '../store/srs.js'
import { CAMPAGNA, VOLO_LIBERO, chiaveCalcolo, fattoriDi,
         calcoliTabellina } from '../data/tabelline.js'
import { STAZIONI, VOLO_A_MENTE, CONCETTI_PER_ID, concettoDiChiave, eFatto,
         distrattoriDi } from '../data/calcolo.js'
import { poolDi, esercizioDaChiave, eNuovo, stellaDi as stellaStazione,
         tabellineSalde, prereqDeboli } from '../store/calcolo.js'
import { suono } from '../audio.js'
import { dipingiFondale, disegnaPianeta, disegnaNave, disegnaAsteroide,
         disegnaRaggio, disegnaFrammento } from '../grafica/spazio.js'
import { POTENZIAMENTI, DOPPIO, EMERGENZA, premioDaSerie } from '../data/potenziamenti.js'
import MappaTabelline from '../components/MappaTabelline.vue'
import MappaConcetti from '../components/MappaConcetti.vue'
import Barra from '../components/Barra.vue'

const emit = defineEmits(['vai'])

const CFG = {
  vite: 3, viteMax: 5, cadutaSec: 10, minCaduta: 3.2, perLivello: 0.10,
  base: 3, maxAsteroidi: 6, ogniLivelli: 3, salitaOgni: 5,
  puntiOk: 10, puntiNo: -5, bossOgni: 8, bossLento: 1.45, difficileLento: 1.25,
  bossPunti: 40, serieVita: 10, perMoneta: 10,
}

/* ---------- elementi: chiave normalizzata, 6×8 e 8×6 sono lo stesso fatto ---------- */
const chiave = chiaveCalcolo
const daChiave = fattoriDi

const fase = ref('mappa')          // mappa | gioco | vinta | trionfo | fine | tavola | libero

/* ═══════════ due campagne, un cielo solo ═══════════
   I pianeti chiedono tabelline, le stazioni calcolo a mente. Sono due
   strade parallele e non una dopo l'altra: 3+4 viene prima delle
   tabelline, 4×23 viene dopo, e chi non sa ancora niente deve poter
   cominciare da tutte e due. Il resto del gioco — asteroidi, vite, boss,
   monete — non sa quale delle due sta servendo. */
const modo = ref('tabelline')      // tabelline | mente
const mente = computed(() => modo.value === 'mente')

const progresso = computed(() => mateProgresso())
const progressoMente = computed(() => calcProgresso())
const tappaIdx = ref(0)            // -1 = volo libero / volo a mente
const tappa = computed(() =>
  mente.value ? (tappaIdx.value < 0 ? VOLO_A_MENTE : STAZIONI[tappaIdx.value])
              : (tappaIdx.value < 0 ? VOLO_LIBERO : CAMPAGNA[tappaIdx.value]))
const campagna = computed(() => tappaIdx.value >= 0)
const sbloccata = i => tappaAperta(i, progresso.value.tappa)
const sbloccataStazione = i => tappaAperta(i, progressoMente.value.tappa)
/* le stelle non stanno nel profilo né qui né là: si rileggono dal motore,
   così una strategia lasciata lì per un mese perde la sua e torna a farsi
   vedere. `state.profile.items` è reattivo, quindi la mappa si aggiorna
   da sola appena una risposta cambia le carte in tavola. */
const stellaMente = S => stellaStazione(S, state.profile.items)
const stelleMente = computed(() => STAZIONI.filter(stellaMente).length)
/* la tappa dopo, in qualunque delle due campagne si stia giocando */
const prossima = computed(() =>
  (mente.value ? STAZIONI : CAMPAGNA)[tappaIdx.value + 1] || null)

/* le stelle non stanno nel profilo: si rileggono dal motore ogni volta,
   così una tabellina lasciata lì per un mese perde la sua e si rivede */
const intere = computed(() => new Set(tabellineIntere()))
const stellaDi = T => (T.nuova ? intere.value.has(T.nuova) : intere.value.size === 10)

/* nel volo libero — e solo lì — le tabelline si scelgono a mano */
const sel = reactive(new Set(state.profile.settings.tables))
const tabelle = computed(() =>
  campagna.value ? tappa.value.tabelle : [...sel].sort((a, b) => a - b))

const hud = reactive({ vite: 3, punti: 0, giuste: 0, mirate: 0, sbagliate: 0, livello: 1, serie: 0 })
const cartello = reactive({ testo: '', colore: '', n: 0 })
const finale = reactive({ punti: 0, giuste: 0, mirate: 0, livello: 1, record: false, ripasso: [] })
const premio = ref(0)

const tela = ref(null)
let ctx = null, W = 0, H = 0, S = 1, suolo = 0, altezzaDomanda = 0
let asteroidi = [], particelle = [], anelli = [], stelle = [], frammenti = [], raggi = []
let scossa = 0, lampo = 0, pulsa = 0, raf = 0, ultimo = 0
let fondale = null, pianetaBotta = 0, fumo = 0

/* ═══════════ L'ASTRONAVE ═══════════
   È l'unico personaggio del gioco, e fa due mestieri: spara quando si
   colpisce, e **dice a che punto è la partita senza numeri**. Le vite
   sono ancora nella fascia in alto, ma quello è il posto dove non si sta
   guardando: chi gioca guarda il cielo, e la nave sta appena sotto.
   Il campo `danno` è tutto quello che il disegno sa dello stato — la
   traduzione da vite a danno la fa `sincronizzaNave()`, qui sotto. */
const nave = reactive({
  x: 0, y: 0, r: 34, lv: 1, danno: 0, mira: -Math.PI / 2, spinta: 0,
  scudo: 0, doppio: false, botta: 0, riparata: 0, t: 0,
})
/* a una vita sola la nave è un rottame che lampeggia, a tre è nuova:
   `CFG.vite` è il riferimento, così le vite di scorta guadagnate col
   filotto si vedono come una nave sana e non come una nave super */
function sincronizzaNave() {
  nave.danno = Math.max(0, Math.min(1, 1 - (hud.vite - 1) / Math.max(1, CFG.vite - 1)))
  const lv = hud.livello >= 6 ? 3 : hud.livello >= 3 ? 2 : 1
  if (lv > nave.lv) {
    nave.lv = lv
    mostraCartello(lv === 3 ? '🛰️ INCROCIATORE!' : '🛸 NAVE POTENZIATA!', '#7fe3ff')
    suono.compra()
  } else nave.lv = lv
}
/* La domanda in corso, una sola per tutte e due le campagne: `testo` è
   quello che si legge in fondo allo schermo, `chiave` quello che il
   motore segna, `peso` quanto costa in testa — da lì il gioco decide
   quanti asteroidi mandare giù e quanto lentamente farli cadere. */
let domanda = reactive({ a: 7, b: 8, ris: 56, difficile: false, peso: 1,
                         testo: '7 × 8 = ?', chiave: chiaveCalcolo(7, 8) })
let esercizio = null               // l'istanza del calcolo a mente, per i falsi
let chieste = 0, apertoIl = 0
/* tre risposte giuste di fila sullo stesso calcolo bastano per oggi: va a
   riposo e al suo posto entra qualcosa che ancora non si sa */
const picker = createPicker({ getItem: k => item(k), useTime: true, pausaDopo: 3 })

/* ---------- coppie disponibili con le tabelline in gioco ---------- */
function coppie() {
  const out = []
  for (const a of tabelle.value) for (let b = 1; b <= 10; b++) out.push([a, b])
  return out
}
const chiaviPossibili = () => [...new Set(coppie().map(([a, b]) => chiave(a, b)))]

/* ═══════════ QUANTO È DIFFICILE UN CALCOLO ═══════════
   Decide l'ordine con cui i calcoli entrano nell'insieme in lavorazione:
   prima i facili, dopo i difficili. Due strati, e il secondo vince.

   1. LA STIMA, che serve solo finché di questo bambino non si sa niente.
      La fatica non sta nella taglia del prodotto ma in quanti dei due
      fattori vanno saputi a memoria: 8×2 è facile e 8×7 no, benché 8 ci
      sia in tutti e due. Per questo 2×9 sta molto prima di 4×7.
   2. LA MISURA: il tempo medio di risposta di QUESTO bambino. Appena c'è
      abbastanza materiale prende il posto della stima, perché difficile
      è quello che risulta difficile a lui, non quello che ci aspettiamo.

   Non c'è nessun bonus per i quadrati né sconti per il 9: 9×9 e 7×8 sono
   fatti da sapere come gli altri, e se poi uno dei due è facile per il
   bambino lo dirà il cronometro. */

/* 1 e 10 non sono fatti da imparare: sono regole. 2, 3 e 5 si contano a
   mente in un attimo. Il resto va saputo, ed è lì che sta la fatica. */
const durezza = n => (n === 1 || n === 10) ? 0
                   : (n === 2 || n === 3 || n === 5) ? 1 : 2

const IN_FONDO = 9        // ×1 e ×10 si introducono per ultimi
const banale = k => { const [lo, hi] = daChiave(k); return lo === 1 || hi === 10 }

function stima(k) {
  if (banale(k)) return IN_FONDO
  const [lo, hi] = daChiave(k)
  // quanti dei due vanno saputi a memoria: è la classe. Dentro la classe
  // ordina la taglia, che sposta poco perché conta molto meno.
  return durezza(lo) + durezza(hi) + (lo * hi) / 200
}

/* Il tempo medio riportato sulla stessa scala della stima: un secondo
   vale come il calcolo più facile, quattro come il più difficile.
   Comprende anche il colpire l'asteroide, ma quel costo è uguale per
   tutti i calcoli e quindi non sposta l'ordine. */
const daTempo = ms => 1.2 + (ms / 1000) * 0.8

function ordine(k) {
  const it = state.profile.items[k]              // letto e non creato
  const s = stima(k)
  if (!it || !it.t || it.seen < 3) return s      // non si sa ancora niente

  // I banali non sono su questa scala: stanno in fondo per principio, e
  // il cronometro può solo tirarli fuori di lì. Uno che risponde 7×10 in
  // quattro secondi ha un buco vero; se invece va spedito resta in fondo,
  // e non deve risalire solo perché la media con la sentinella lo alza.
  if (banale(k)) return it.t > SRS.slowMs ? daTempo(it.t) : IN_FONDO

  const fiducia = Math.min(1, (it.seen - 2) / 6) // piena dopo otto incontri
  return s * (1 - fiducia) + daTempo(it.t) * fiducia
}

/* quanti calcoli tenere in lavorazione: chi ha dieci tabelline in gioco
   deve vederle tutte, non le due più facili */
const insieme = () => Math.max(10, Math.min(16, Math.round(tabelle.value.length * 1.5)))

/* a quali tabelline *in gioco* appartiene un calcolo: 6×7 vale sia per la 6
   sia per la 7, e l'insieme attivo gira a turno fra queste per non
   riempirsi solo di 1× e ×10, che sono le più facili di tutte */
function tabellineDi(k) {
  const [lo, hi] = daChiave(k)
  const g = []
  if (tabelle.value.includes(lo)) g.push(lo)
  if (hi !== lo && tabelle.value.includes(hi)) g.push(hi)
  return g.length ? g : [lo]
}

/* Il pool di una tappa è per più di metà la tabellina nuova, il resto è
   ripasso delle precedenti. Senza questa sproporzione la tabellina del
   pianeta uscirebbe una volta su sei e la tappa diventerebbe un'attesa;
   con tutto il pool sulla nuova, invece, le vecchie si dimenticherebbero
   una dopo l'altra. */
function poolAttivo() {
  const now = Date.now()
  const tutte = chiaviPossibili()
  // chi è andato a riposo lascia il posto libero: l'insieme si allarga di altrettanto
  const quanti = insieme() + picker.riposati
  const scaduti = lista => lista
    .sort((x, y) => overdue(item(y), now) - overdue(item(x), now)).slice(0, 4)

  if (campagna.value && tappa.value.nuova) {
    const n = tappa.value.nuova
    const sue = calcoliTabellina(n)
    const altre = tutte.filter(k => !sue.includes(k))
    const A = activeSet(sue, k => item(k), ordine, now, Math.max(6, Math.round(quanti * 0.6)))
    const B = activeSet(altre, k => item(k), ordine, now, Math.max(4, quanti - 6), tabellineDi)
    let p = [...new Set([...A.learning, ...B.learning, ...scaduti([...A.due, ...B.due])])]
    // tappa già padroneggiata e rigiocata: la tabellina del pianeta resta
    // comunque il cuore della tappa, altrimenti sparirebbe proprio la sua
    if (!A.learning.length) p = [...new Set([...sue, ...p])]
    return p.length ? p : tutte
  }

  const { learning, due } = activeSet(tutte, k => item(k), ordine, now, quanti, tabellineDi)
  const p = [...new Set([...learning, ...scaduti(due)])]
  return p.length ? p : tutte
}

/* ---------- il pool delle stazioni ----------
   Il lavoro vero lo fa `store/calcolo.js`: qui si dice solo quanto grande
   deve essere l'insieme in lavorazione. */
function poolMente() {
  return poolDi(tappa.value, state.profile.items, Date.now(), 12 + picker.riposati)
}

/* ---------- difficoltà ----------
   `peso` è quanto costa il calcolo: 3+4 può arrivare fra sei bersagli,
   497+298 ne vuole tre e il doppio del tempo. Senza questo la scelta
   multipla su un calcolo lungo diventa una lotteria: il tempo finisce
   prima che il conto sia fatto. */
function difficolta(lv, peso = 1) {
  const t = CFG.cadutaSec / Math.pow(1 + CFG.perLivello, lv - 1)
  const quanti = Math.min(CFG.maxAsteroidi,
                          CFG.base + Math.floor((lv - 1) / CFG.ogniLivelli))
  return { caduta: Math.max(CFG.minCaduta, t) * (1 + (peso - 1) * 0.45),
           quanti: Math.max(3, quanti - (peso - 1)) }
}

function distrattori(a, b, n) {
  const c = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a * b + a, a * b - a,
             a * b + b, a * b - b, a * b + 1, a * b - 1, a * b + 10, a * b - 10]
  const out = [], visti = new Set([a * b])
  for (const v of c.sort(() => Math.random() - 0.5)) {
    if (v > 0 && v <= 200 && !visti.has(v)) { visti.add(v); out.push(v) }
    if (out.length === n) break
  }
  let g = 0
  while (out.length < n && g++ < 300) {
    const v = a * b + Math.floor(Math.random() * 21) - 10
    if (v > 0 && !visti.has(v)) { visti.add(v); out.push(v) }
  }
  return out
}

/* il boss non chiede una domanda a caso: chiede quella che il motore vuole
   vedere di più, cioè la più in bilico fra quelle sveglie */
function piuInBilico(p) {
  const now = Date.now()
  const sveglie = p.filter(x => !picker.aRiposo(x))
  return (sveglie.length ? sveglie : p)
    .reduce((x, y) => weight(item(y), now, { useTime: true }) > weight(item(x), now, { useTime: true }) ? y : x)
}

function preparaTabellina(k) {
  let [lo, hi] = daChiave(k)
  // sceglie un verso compatibile con le tabelline in gioco
  const versi = []
  if (tabelle.value.includes(lo)) versi.push([lo, hi])
  if (tabelle.value.includes(hi) && hi !== lo) versi.push([hi, lo])
  const [a, b] = versi.length ? versi[Math.floor(Math.random() * versi.length)] : [lo, hi]
  esercizio = null
  domanda.chiave = k; domanda.a = a; domanda.b = b; domanda.ris = a * b
  domanda.testo = `${a} × ${b} = ?`
  domanda.peso = 1
  domanda.difficile = (Math.min(a, b) >= 6 && Math.max(a, b) >= 6) || a * b >= 48
}

function preparaMente(k) {
  const e = esercizioDaChiave(k, state.profile.items)
  esercizio = e
  domanda.chiave = k; domanda.a = e.a; domanda.b = e.b; domanda.ris = e.ris
  domanda.testo = e.testo
  domanda.peso = e.peso
  domanda.difficile = e.peso >= 2
}

function nuovaDomanda(boss) {
  const p = mente.value ? poolMente() : poolAttivo()
  const k = boss ? piuInBilico(p) : picker.pick(p)
  if (mente.value) preparaMente(k); else preparaTabellina(k)
  apertoIl = performance.now()
  return k
}

function ondata() {
  asteroidi = []
  const boss = chieste > 0 && chieste % CFG.bossOgni === 0
  nuovaDomanda(boss)
  chieste++

  const { caduta, quanti } = difficolta(hud.livello, domanda.peso)
  const falsi = mente.value ? distrattoriDi(esercizio, quanti - 1)
                            : distrattori(domanda.a, domanda.b, quanti - 1)
  const valori = [domanda.ris, ...falsi].sort(() => Math.random() - 0.5)
  const colonna = W / quanti
  let lento = boss ? CFG.bossLento : (domanda.difficile ? CFG.difficileLento : 1)
  // l'ultima vita allunga il tempo: chi è arrivato qui di solito sa il
  // conto e non fa in tempo a farlo — vedi `data/potenziamenti.js`
  if (hud.vite <= EMERGENZA.sotto) lento *= EMERGENZA.tempo
  const vel = suolo / (caduta * lento)

  valori.forEach((v, i) => {
    const ok = v === domanda.ris
    const base = Math.min(W, H) * 0.095 * (boss ? 1.22 : 1) + (String(v).length - 1) * 6 * S
    const r = Math.max(24, Math.min(base, colonna * 0.46, boss ? 84 : 68))
    const off = Math.random() * H * (boss ? 0.18 : 0.30)
    const m = r * (boss ? 1.18 : 1.02)
    const x = colonna * i + colonna / 2 + (Math.random() - 0.5) * Math.max(0, colonna - 2 * r - 6)
    asteroidi.push({
      x: Math.max(m, Math.min(W - m, x)), y: -r - off, r, v, ok, boss,
      vy: vel, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * (boss ? 0.3 : 0.5),
      ph: Math.random() * 6.28, morto: false,
      forma: Array.from({ length: boss ? 11 : 9 }, () => 0.76 + Math.random() * 0.34),
      // i crateri si sorteggiano qui una volta sola: sorteggiarli a ogni
      // fotogramma farebbe ribollire il sasso invece di farlo ruotare
      crateri: Array.from({ length: boss ? 5 : 3 }, () => {
        const ang = Math.random() * 6.28, d = Math.random() * 0.5
        return [Math.cos(ang) * d, Math.sin(ang) * d, 0.10 + Math.random() * 0.13]
      }),
    })
  })
  if (boss) mostraCartello('☄️ BOSS!', '#ff6b6b')
}

/* ---------- interazione ---------- */
function tocca(e) {
  if (fase.value !== 'gioco') return
  const x = e.clientX, y = e.clientY
  for (const a of asteroidi) {
    if (a.morto) continue
    if ((x - a.x) ** 2 + (y - a.y) ** 2 <= a.r * a.r) return colpisci(a)
  }
}

/* il bersaglio della tappa: le giuste in tutto, e quante di quelle devono
   essere sulla tabellina nuova */
const centrato = () => campagna.value &&
  hud.giuste >= tappa.value.bersaglio && hud.mirate >= tappa.value.mirate

/* una risposta è «mirata» quando è su quello che la tappa è venuta a
   insegnare: la tabellina del pianeta, o i concetti nuovi della stazione */
function eMirata(k) {
  if (!campagna.value) return false
  if (mente.value) return eNuovo(tappa.value, k)
  return !!tappa.value.nuova &&
         (domanda.a === tappa.value.nuova || domanda.b === tappa.value.nuova)
}

/* ---------- il colpo ----------
   Il cannone punta il sasso toccato e spara sul posto: nessuna attesa
   fra il dito e l'esplosione, perché quella mezza mezzeria di secondo la
   si paga a ogni singola risposta. */
function spara(a, colore = '#7fe3ff') {
  nave.mira = Math.atan2(a.y - nave.y, a.x - nave.x)
  const bocca = nave.r * 1.25
  raggi.push({ x0: nave.x + Math.cos(nave.mira) * bocca, y0: nave.y + Math.sin(nave.mira) * bocca,
               x1: a.x, y1: a.y, vita: 1, c: colore })
  nave.spinta = 1
  suono.sparo()
}

/* il sasso si rompe in spicchi della sua stessa forma: sono i pezzi che
   restano quando esplode un sasso, e costano un poligono a testa */
function rompi(a, colore) {
  const n = a.boss ? 9 : 6
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * 6.2832, ap = 6.2832 / n
    const punti = [[0, 0],
      [Math.cos(ang) * a.r * 0.9, Math.sin(ang) * a.r * 0.9],
      [Math.cos(ang + ap) * a.r * 0.9, Math.sin(ang + ap) * a.r * 0.9]]
    const sp = (60 + Math.random() * 150) * S
    frammenti.push({ x: a.x, y: a.y, punti, rot: 0,
                     vr: (Math.random() - 0.5) * 7,
                     vx: Math.cos(ang + ap / 2) * sp, vy: Math.sin(ang + ap / 2) * sp - 40 * S,
                     vita: 1, c: a.boss ? '#8f2a22' : '#6d6153' })
  }
  esplodi(a.x, a.y, colore, a.boss ? 46 : 30)
  anello(a.x, a.y, colore, a.r * (a.boss ? 7 : 3))
}

/* i due sassi sbagliati più vicini se ne vanno con l'onda del cannone
   doppio. Non tutti: la domanda dopo deve trovare un cielo, non un vuoto */
function spazza(centro) {
  const vicini = asteroidi
    .filter(x => !x.morto && x !== centro)
    .sort((p, q) => (p.x - centro.x) ** 2 - (q.x - centro.x) ** 2)
    .slice(0, DOPPIO.spazza)
  for (const v of vicini) {
    v.morto = true
    spara(v, '#ffd94a'); rompi(v, '#ffd94a')
  }
}

/* ---------- i premi del filotto ----------
   Le soglie stanno in `data/potenziamenti.js`, non qui: sono un dato di
   equilibrio e vanno lette accanto alla ragione per cui sono quelle. */
function premia(serie) {
  const p = premioDaSerie(serie, CFG.serieVita)
  if (p === 'vita') dammiVita('🔥 ' + serie + ' DI FILA!')
  else if (p === 'doppio') accendi('doppio', '🔥 ' + serie + ' DI FILA!  ')
}

function accendi(quale, prefisso = '') {
  const P = POTENZIAMENTI[quale]
  if (quale === 'doppio') nave.doppio = true
  if (quale === 'scudo') nave.scudo = 1
  mostraCartello(prefisso + P.grido, P.colore)
  suono.compra()
  anello(nave.x, nave.y, P.colore, nave.r * 9)
}

function colpisci(a) {
  const k = domanda.chiave
  const ms = performance.now() - apertoIl
  const mirata = eMirata(k)
  if (a.ok) {
    answer(k, { correct: true, ms })
    picker.afterAnswer(k, true)
    hud.giuste++; hud.serie++
    if (mirata) hud.mirate++
    // il filotto si registra mentre cresce: chiudere la partita a metà non
    // deve buttare via il record
    segnaBest('serieMath', hud.serie)
    const moltiplica = nave.doppio ? DOPPIO.punti : 1
    if (a.boss) {
      spara(a, '#ffd94a'); rompi(a, '#ffd94a')
      esplodi(a.x, a.y, '#ff6b6b', 30); scossa = 14; lampo = 0.5
      hud.punti += CFG.bossPunti * moltiplica; suono.boss()
      dammiVita('☄️ BOSS ABBATTUTO!')
      // il boss lascia lo scudo: è la ricompensa che permette di
      // rischiare una risposta invece di guardare cadere il sasso
      if (!nave.scudo) accendi('scudo')
    } else {
      spara(a); rompi(a, '#7fe3ff')
      hud.punti += CFG.puntiOk * moltiplica; suono.ok()
      premia(hud.serie)
    }
    if (nave.doppio) spazza(a)
    if (hud.giuste % CFG.perMoneta === 0) {
      addCoins(level.value); mostraCartello('+' + level.value + ' 🪙', '#ffd94a'); suono.moneta()
    }
    segna(mente.value ? 'mente' : 'math')
    const nuovo = 1 + Math.floor(hud.giuste / CFG.salitaOgni)
    if (nuovo > hud.livello) { hud.livello = nuovo; salitaLivello() }
    sincronizzaNave()
    if (centrato()) return tappaSuperata()
    ondata()
  } else {
    answer(k, { correct: false, ms })
    picker.afterAnswer(k, false)
    a.morto = true; hud.serie = 0; hud.sbagliate++
    spara(a, '#ff6b6b')
    esplodi(a.x, a.y, '#ff6b6b', 14); suono.no(); scossa = 10
    hud.punti = Math.max(0, hud.punti + CFG.puntiNo)
    // il cannone doppio si perde sbagliando: è la regola che lo rende
    // qualcosa da difendere invece di un regalo che scade da solo
    if (nave.doppio) { nave.doppio = false; mostraCartello('🔫 cannone perso', '#ff9d1c') }
    if (mente.value) suggerisci(k)
    perdiVita()
  }
}

/* ---------- il trucco, quando serve ----------
   Alla seconda volta che lo stesso concetto va storto si dice la strategia.
   Alla prima no: sbagliare una volta capita a tutti, e un cartello a ogni
   errore diventa rumore che si impara a saltare. */
const sbagli = new Map()
const dritta = ref('')
let spegniDritta = 0
function suggerisci(k) {
  const id = concettoDiChiave(k)
  const n = (sbagli.get(id) || 0) + 1
  sbagli.set(id, n)
  const c = CONCETTI_PER_ID[id]
  if (n !== 2 || !c) return
  dritta.value = c.dritta
  clearTimeout(spegniDritta)
  spegniDritta = setTimeout(() => { dritta.value = '' }, 9000)
}

function dammiVita(perche) {
  if (hud.vite < CFG.viteMax) {
    hud.vite++; mostraCartello(perche + '  +1 ♥', '#ff8fa3'); suono.vita()
    nave.riparata = 1; sincronizzaNave()
  } else mostraCartello(perche, '#ffd94a')
}

/* Lo scudo si mette davanti alla botta, e lo si vede: l'esagono va in
   frantumi e la vita resta. Senza il lampo e il cartello sarebbe un
   errore che «non è successo niente», cioè la cosa più confusa di tutte. */
function perdiVita() {
  hud.serie = 0
  if (nave.scudo > 0) {
    nave.scudo = 0
    esplodi(nave.x, nave.y, '#7fe3ff', 26); anello(nave.x, nave.y, '#7fe3ff', nave.r * 7)
    mostraCartello('🛡️ SCUDO PARATO!', '#7fe3ff'); suono.vita(); scossa = 8
    return
  }
  nave.botta = 1
  if (--hud.vite <= 0) { sincronizzaNave(); return finePartita() }
  sincronizzaNave()
}

function salitaLivello() {
  mostraCartello('LIVELLO ' + hud.livello, '#7fe3ff')
  anello(W / 2, suolo * 0.55, '#7fe3ff', Math.max(W, H))
  anello(W / 2, suolo * 0.55, '#ffd94a', Math.max(W, H) * 0.7)
  lampo = 0.45; scossa = 8; suono.livello()
  for (let i = 0; i < 40; i++) particelle.push({
    x: Math.random() * W, y: suolo, vx: (Math.random() - 0.5) * 90 * S,
    vy: -(120 + Math.random() * 260) * S, vita: 1.4, r: (2 + Math.random() * 3) * S,
    c: Math.random() < 0.5 ? '#7fe3ff' : '#ffd94a',
  })
}

function mostraCartello(testo, colore) { cartello.testo = testo; cartello.colore = colore; cartello.n++ }
function esplodi(x, y, c, n = 22) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, sp = (40 + Math.random() * 180) * S
    particelle.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vita: 1,
                      r: (2 + Math.random() * 4) * S, c })
  }
}
const anello = (x, y, c, max) => anelli.push({ x, y, r: 0, max, vita: 1, c })

/* ---------- ciclo ---------- */
function ridimensiona() {
  W = window.innerWidth; H = window.innerHeight
  const cv = tela.value; if (!cv) return
  cv.width = Math.floor(W * devicePixelRatio); cv.height = Math.floor(H * devicePixelRatio)
  cv.style.width = W + 'px'; cv.style.height = H + 'px'
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  S = Math.max(0.6, Math.min(1.6, Math.min(W, H) / 700))
  altezzaDomanda = Math.max(96, H * 0.17)
  suolo = H - altezzaDomanda
  // le stelle vive: tre strati che scendono a velocità diverse. La
  // parallasse è l'unica cosa che dà profondità a un cielo nero, e costa
  // un campo in più. Il grosso del cielo — nebulose e polvere — sta
  // fermo nel fondale in cache, che si ridipinge solo qui.
  stelle = Array.from({ length: 90 }, () => {
    const z = Math.random() < 0.5 ? 0.35 : Math.random() < 0.7 ? 0.7 : 1.2
    return { x: Math.random() * W, y: Math.random() * H, z,
             r: (0.4 + Math.random() * 1.2) * z, s: (6 + Math.random() * 10) * z,
             a: 0.25 + Math.random() * 0.55 * z }
  })
  fondale = dipingiFondale(W, H)
  nave.r = Math.max(30, Math.min(54, Math.min(W, H) * 0.1))
  nave.x = W / 2; nave.y = suolo - nave.r * 0.8
}

/* ---------- dove guarda il cannone ----------
   Prima seguiva il sasso più basso. Era vivo da vedere e sbagliato: un
   puntatore agganciato a *un* asteroide tira l'occhio là, e a un bambino
   quello si legge come un consiglio. Peggio, arriva il momento in cui i
   sassi sbagliati sono già morti e l'unico vivo è quello giusto: lì il
   cannone lo indica per davvero.

   Quindi la regola è che **il cannone non sa dove sono gli asteroidi**.
   Spazza il cielo da una parte all'altra, avanti e indietro, con un moto
   che dipende solo dal tempo: passando dappertutto non indica niente, e
   nel frattempo la torretta sembra viva invece che spenta. Punta un
   bersaglio solo dopo che il dito ha già scelto — vedi `spara()` — e ci
   resta finché il raggio è in aria.

   L'ampiezza è larga apposta. Un dondolio stretto attorno alla verticale
   si legge ancora come «guarda in mezzo»: per non dire niente il cannone
   deve arrivare *sopra ogni colonna*, comprese quelle di bordo. */
const SPAZZATA = { arco: 0.95, giroSec: 3.4 }   // ±54°, un'andata e ritorno ogni 3,4 s

function miraARiposo(dt) {
  if (raggi.length) return          // sta sparando: il colpo tiene la mira
  const meta = -Math.PI / 2 + Math.sin(pulsa * (6.2832 / SPAZZATA.giroSec)) * SPAZZATA.arco
  let d = meta - nave.mira
  while (d > Math.PI) d -= 6.2832
  while (d < -Math.PI) d += 6.2832
  // il ritorno dopo un colpo è un raggiungimento, non un salto: la
  // torretta riprende la spazzata da dov'è, senza scattare
  nave.mira += d * Math.min(1, dt * 6)
}

function aggiorna(dt) {
  let caduto = null
  for (const a of asteroidi) {
    if (a.morto) continue
    a.y += a.vy * dt; a.rot += a.vr * dt
    if (a.y - a.r > suolo) { a.morto = true; if (a.ok) caduto = a }
  }
  if (caduto) {
    const k = domanda.chiave
    answer(k, { correct: false, ms: 9000 })
    picker.afterAnswer(k, false)
    hud.sbagliate++
    // il sasso arriva sul pianeta: l'atmosfera si accende di rosso lì
    // dove ha colpito, ed è per questo che quella riga in fondo conta
    esplodi(caduto.x, suolo, '#ff9d1c', 34)
    anello(caduto.x, suolo, '#ff9d1c', W * 0.5)
    pianetaBotta = 1
    suono.boom(); scossa = 16
    perdiVita()
    if (fase.value === 'gioco') ondata()
  }
}

/* Scintille, fumo e raggi vivono di vita loro: si consumano anche
   quando il gioco è fermo. Se stessero dentro `aggiorna` — che il
   cartello di un traguardo mette in pausa — un raggio sparato un attimo
   prima resterebbe appeso in cielo per tutta la durata della festa. */
function effetti(dt) {
  // la spazzata sta qui e non in `aggiorna` per la stessa ragione: il
  // cartello di un traguardo ferma il gioco, e una torretta che si
  // inchioda mentre il resto è in festa sembra la nave che si è spenta
  miraARiposo(dt)
  for (const p of particelle) {
    p.x += p.vx * dt; p.y += p.vy * dt
    p.vy += (p.leggera ? -40 : 260) * dt * S
    p.vita -= dt * (p.leggera ? 0.7 : 1.6)
  }
  particelle = particelle.filter(p => p.vita > 0)
  for (const f of frammenti) {
    f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt * S
    f.rot += f.vr * dt; f.vita -= dt * 1.1
  }
  frammenti = frammenti.filter(f => f.vita > 0)
  for (const r of raggi) r.vita -= dt * 5
  raggi = raggi.filter(r => r.vita > 0)
  for (const g of anelli) { g.r += g.max * dt * 1.8; g.vita -= dt * 1.8 }
  anelli = anelli.filter(g => g.vita > 0)
  if (scossa > 0) scossa -= dt * 40
  if (lampo > 0) lampo -= dt * 1.6
  if (pianetaBotta > 0) pianetaBotta -= dt * 1.1
  if (nave.botta > 0) nave.botta -= dt * 2.2
  if (nave.riparata > 0) nave.riparata -= dt * 1.6
  if (nave.spinta > 0) nave.spinta -= dt * 2.5
  // la nave malconcia fuma, e quando è messa peggio butta anche
  // scintille: sono le due cose che si vedono di sfuggita mentre si
  // guarda in alto, e dicono «questa sta per saltare» meglio di un cuore
  if (nave.danno > 0.6 && (fumo -= dt) <= 0) {
    fumo = 0.12
    const x = nave.x + (Math.random() - 0.5) * nave.r
    particelle.push({ x, y: nave.y - nave.r * 0.2, vx: (Math.random() - 0.5) * 24 * S,
                      vy: -34 * S, vita: 0.85, leggera: true,
                      r: (2.5 + Math.random() * 3.5) * S,
                      c: nave.danno > 0.8 ? '#6a6a78' : '#9898a6' })
    if (nave.danno > 0.8 && Math.random() < 0.5)
      particelle.push({ x, y: nave.y, vx: (Math.random() - 0.5) * 70 * S,
                        vy: -(40 + Math.random() * 60) * S, vita: 0.7,
                        r: (1.5 + Math.random() * 2) * S,
                        c: Math.random() < 0.5 ? '#ffd94a' : '#ff9d1c' })
  }
}

/* L'ordine dei piani, che è la sola cosa da non sbagliare qui dentro:
   il cielo, la nave, **poi** gli asteroidi. La nave sta dietro perché i
   numeri devono restare leggibili anche quando un sasso le passa
   davanti — è il momento in cui si ha più fretta di leggerli. */
function disegna(dt) {
  ctx.save()
  if (scossa > 0) ctx.translate((Math.random() - 0.5) * scossa, (Math.random() - 0.5) * scossa)

  if (fondale) ctx.drawImage(fondale, 0, 0, W, H)
  for (const s of stelle) {
    s.y += s.s * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W }
    ctx.globalAlpha = s.a; ctx.fillStyle = s.z > 1 ? '#dff1ff' : '#fff'
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.29); ctx.fill()
  }
  ctx.globalAlpha = 1

  disegnaPianeta(ctx, { W, suolo, t: pulsa, botta: pianetaBotta })

  nave.t = pulsa
  disegnaNave(ctx, nave)

  if (fase.value === 'gioco') for (const a of asteroidi) if (!a.morto) disegnaAsteroide(ctx, a, S, pulsa)
  for (const f of frammenti) disegnaFrammento(ctx, f)

  for (const gg of anelli) {
    ctx.globalAlpha = Math.max(0, gg.vita) * 0.55
    ctx.strokeStyle = gg.c; ctx.lineWidth = 6 * S * Math.max(0.2, gg.vita)
    ctx.beginPath(); ctx.arc(gg.x, gg.y, gg.r, 0, 6.29); ctx.stroke()
  }
  for (const p of particelle) {
    ctx.globalAlpha = Math.max(0, p.vita)
    ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill()
  }
  ctx.globalAlpha = 1
  for (const r of raggi) disegnaRaggio(ctx, r, S)
  ctx.restore()
  if (lampo > 0) { ctx.globalAlpha = Math.max(0, lampo) * 0.45; ctx.fillStyle = '#fff'
                   ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1 }
}

/* Il volo si ferma anche col cartello di un traguardo davanti
   (`state.festa`): App.vue lo mostra a schermo intero per tre secondi, e
   sotto continuavano a scendere gli asteroidi. Un premio non si paga con
   una vita. */
function ciclo(ts) {
  const dt = Math.min(0.05, (ts - ultimo) / 1000 || 0); ultimo = ts
  pulsa += dt
  if (fase.value === 'gioco' && !state.festa.length) aggiorna(dt)
  effetti(dt)
  disegna(dt)
  raf = requestAnimationFrame(ciclo)
}

/* ---------- partite ---------- */
function inizia(i = tappaIdx.value) {
  // volo libero senza tabelline: niente da giocare (il volo a mente invece
  // ha sempre di che chiedere, i concetti aperti li sceglie il gestore)
  if (!mente.value && i < 0 && !sel.size) return
  tappaIdx.value = i
  if (!mente.value && i < 0) state.profile.settings.tables = [...sel].sort((a, b) => a - b)
  hud.vite = CFG.vite; hud.punti = 0; hud.giuste = 0; hud.mirate = 0; hud.sbagliate = 0
  hud.livello = 1; hud.serie = 0
  particelle = []; anelli = []; frammenti = []; raggi = []
  scossa = 0; lampo = 0; pianetaBotta = 0; chieste = 0
  // la nave torna nuova a ogni partita: i potenziamenti sono il premio di
  // questa partita e non un salvataggio (`data/potenziamenti.js`)
  nave.lv = 1; nave.scudo = 0; nave.doppio = false
  nave.botta = 0; nave.riparata = 0; nave.mira = -Math.PI / 2
  sincronizzaNave()
  picker.reset()
  sbagli.clear(); dritta.value = ''
  segna('partiteMath')
  fase.value = 'gioco'
  ondata()
}

const iniziaPianeta = i => { modo.value = 'tabelline'; inizia(i) }
const iniziaStazione = i => { modo.value = 'mente'; inizia(i) }

/* com'è andata: serve sia a chi finisce le vite sia a chi supera il pianeta.
   Il «da ripassare» dice il calcolo quando è un fatto (7 × 8, 13 − 7) e il
   nome della strategia quando dietro c'è un concetto: «somme col riporto»
   è un consiglio, «68+75» sarebbe un numero preso a caso. */
function etichettaDi(k) {
  if (!eFatto(k) && k.startsWith('calc:'))
    return (CONCETTI_PER_ID[concettoDiChiave(k)] || {}).nome || k
  if (k.startsWith('calc:')) return esercizioDaChiave(k, state.profile.items).testo.replace(' = ?', '')
  const [a, b] = daChiave(k)
  return `${a} × ${b}`
}

function riassunto() {
  finale.punti = hud.punti; finale.giuste = hud.giuste; finale.mirate = hud.mirate
  finale.livello = hud.livello
  finale.record = segnaBest('math', hud.punti)
  const dove = mente.value ? poolMente() : chiaviPossibili()
  finale.ripasso = dove
    .map(k => ({ k, it: item(k) }))
    .filter(x => x.it.err > 0)
    .sort((x, y) => (y.it.err - y.it.ok) - (x.it.err - x.it.ok))
    .slice(0, 3)
    .map(x => ({ che: etichettaDi(x.k), err: x.it.err }))
}

function tappaSuperata() {
  asteroidi = []
  const quante = mente.value ? STAZIONI.length : CAMPAGNA.length
  const ultima = tappaIdx.value === quante - 1
  // il premio è della prima volta: rigiocare una tappa già superata lascia
  // una moneta di cortesia, non uno stipendio
  const giaFatto = (mente.value ? progressoMente.value : progresso.value).tappa > tappaIdx.value
  if (mente.value) calcCompleta(tappaIdx.value, quante)
  else mateCompleta(tappaIdx.value, quante)
  // da 1 a 3 per il livello del giocatore, come le tappe del castello: due
  // campagne che pagano in modo diverso per lo stesso lavoro sgonfiano l'economia
  premio.value = giaFatto ? 1 : level.value * (1 + Math.floor(tappaIdx.value / 4))
  addCoins(premio.value)
  riassunto()
  fase.value = ultima ? 'trionfo' : 'vinta'
  anello(W / 2, suolo * 0.55, '#ffd94a', Math.max(W, H))
  suono.livello(); suono.moneta()
}

function prossimoPianeta() {
  const quante = mente.value ? STAZIONI.length : CAMPAGNA.length
  inizia(Math.min(quante - 1, tappaIdx.value + 1))
}

function finePartita() {
  fase.value = 'fine'
  asteroidi = []
  suono.fine()
  riassunto()
}

function allaMappa() {
  fase.value = 'mappa'
  asteroidi = []
  dritta.value = ''
  // si torna sulla campagna da cui si veniva, non sempre sui pianeti
  mappaSu.value = mente.value ? 'stazioni' : 'pianeti'
  tappaIdx.value = mente.value
    ? Math.min(STAZIONI.length - 1, progressoMente.value.tappa)
    : Math.min(CAMPAGNA.length - 1, progresso.value.tappa)
}

/* "Cosa so" si apre da due posti — la mappa e la fine partita — e il tasto
   della barra riporta a quello da cui si è arrivati, non sempre alla mappa:
   chi la guarda a fine partita vuole tornare al suo "riprova" */
/* quale delle due campagne si sta guardando nella mappa */
const mappaSu = ref('pianeti')

const tornaDa = ref('mappa')
/* la tavola ha due facce, una per campagna, e si apre su quella da cui si
   arriva: chi ha appena fatto conti a mente vuole vedere i suoi trucchi */
const tavolaSu = ref('tabelline')
function apriTavola() {
  tornaDa.value = fase.value
  tavolaSu.value = modo.value
  fase.value = 'tavola'
}

function scegliTabella(n) { sel.has(n) ? sel.delete(n) : sel.add(n) }
function tutte() {
  const on = sel.size < 10
  sel.clear(); if (on) for (let i = 1; i <= 10; i++) sel.add(i)
}

const cuori = computed(() => '♥'.repeat(Math.max(0, hud.vite)) +
                            '♡'.repeat(Math.max(0, CFG.vite - hud.vite)))
/* c'è almeno un potenziamento acceso: la fascia in alto si stringe per
   fargli posto invece di andare a capo */
const potenziata = computed(() => !!nave.scudo || nave.doppio)
const quota = (n, tot) => Math.min(100, Math.round((n / tot) * 100)) + '%'

onMounted(() => {
  tappaIdx.value = Math.min(CAMPAGNA.length - 1, progresso.value.tappa)
  // aggancio per i test automatici: permette di colpire l'asteroide giusto
  // senza dover indovinare dove il numero e' disegnato sul canvas
  window.__mate = { hud, domanda, colpisci, inizia, sel, CAMPAGNA, tappaIdx, tappa,
                    asteroidi: () => asteroidi, fase, finale, progresso, nave,
                    // -1 è il volo libero: tabelline a scelta, nessun bersaglio
                    iniziaLibero: () => inizia(-1),
                    // la seconda campagna: stazioni del calcolo a mente
                    modo, STAZIONI, progressoMente, iniziaStazione,
                    iniziaVoloMente: () => iniziaStazione(-1) }
  ctx = tela.value.getContext('2d')
  ridimensiona()
  window.addEventListener('resize', ridimensiona)
  raf = requestAnimationFrame(ciclo)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', ridimensiona)
})
</script>

<template>
  <div class="schermo spazio">
    <canvas ref="tela" @pointerdown="tocca"></canvas>

    <Barra v-if="fase === 'gioco'" :titolo="mente ? 'A mente' : 'Asteroidi'" scura
           @indietro="allaMappa">
      <!-- Su un telefono stretto i gettoni stanno in cinque, non in
           sette: quando c'è un potenziamento acceso quello vince, e il
           filotto e il livello si leggono lo stesso dalla nave — il
           cannone doppio *è* il filotto, lo scafo grosso *è* il livello. -->
      <div class="gettone">{{ cuori }}</div>
      <div v-if="hud.serie >= 3 && !potenziata" class="gettone">🔥{{ hud.serie }}</div>
      <div v-if="nave.scudo" class="gettone potenz scudo">🛡️</div>
      <div v-if="nave.doppio" class="gettone potenz doppio">🔫×2</div>
      <div class="gettone">{{ hud.punti }} p</div>
      <div v-if="!potenziata" class="gettone">Liv. {{ hud.livello }}</div>
    </Barra>

    <!-- quanto manca a superare il pianeta: si vede sempre, come le ondate del castello -->
    <div v-if="fase === 'gioco' && campagna" class="bersaglio">
      <div class="barra">
        <i :style="{ width: quota(hud.giuste, tappa.bersaglio) }"></i>
        <span>{{ tappa.emoji }} {{ hud.giuste }}/{{ tappa.bersaglio }}</span>
      </div>
      <div v-if="tappa.mirate" class="barra mirata">
        <i :style="{ width: quota(hud.mirate, tappa.mirate) }"></i>
        <span v-if="mente">{{ tappa.nome }} · {{ hud.mirate }}/{{ tappa.mirate }}</span>
        <span v-else>×{{ tappa.nuova }} · {{ hud.mirate }}/{{ tappa.mirate }}</span>
      </div>
    </div>

    <!-- il trucco: esce alla seconda volta che lo stesso concetto va storto -->
    <div v-if="fase === 'gioco' && dritta" class="trucco">💡 {{ dritta }}</div>

    <div v-if="fase === 'gioco'" class="domanda">
      <b :class="{ lunga: domanda.testo.length > 13 }">{{ domanda.testo }}</b>
    </div>

    <div v-if="cartello.testo" :key="cartello.n" class="cartello" :style="{ color: cartello.colore }">
      {{ cartello.testo }}
    </div>

    <!-- ════════ la mappa della campagna: qui il gioco parla la lingua degli altri ════════ -->
    <div v-if="fase === 'mappa'" class="schermo campagna">
      <Barra titolo="Asteroidi" monete @indietro="$emit('vai','home')">
        <div class="gettone">⭐ <b>{{ intere.size }}/10</b></div>
        <div class="gettone">🧠 <b>{{ stelleMente }}/{{ STAZIONI.length }}</b></div>
      </Barra>
      <div class="centro elenco">
        <h1>Asteroidi</h1>
        <!-- due campagne, due schede: dieci pianeti da scorrere prima di
             arrivare alle stazioni sarebbero un muro su un telefono -->
        <div class="schede">
          <button :class="{ on: mappaSu === 'pianeti' }"
                  @click="mappaSu = 'pianeti'">🪐 Pianeti</button>
          <button :class="{ on: mappaSu === 'stazioni' }"
                  @click="mappaSu = 'stazioni'">🛰️ A mente</button>
        </div>

        <!-- ─── i pianeti: le tabelline ─── -->
        <template v-if="mappaSu === 'pianeti'">
        <div class="capitolo">🪐 I pianeti · le tabelline</div>
        <p class="testo">Ogni pianeta è una tabellina nuova: colpisci gli asteroidi con il
          risultato giusto. La ⭐ arriva quando sai tutte e dieci le caselle, anche
          domani.</p>
        <div class="pianeti">
          <button v-for="(T, i) in CAMPAGNA" :key="i" class="pianeta"
                  :class="{ fatto: i < progresso.tappa, chiuso: !sbloccata(i),
                            ora: i === progresso.tappa }"
                  :disabled="!sbloccata(i)" @click="iniziaPianeta(i)">
            <span class="em">{{ sbloccata(i) ? T.emoji : '🔒' }}</span>
            <b>{{ i + 1 }}. {{ T.nome }}</b>
            <i>{{ T.nuova ? 'la tabellina del ' + T.nuova : 'tutte le tabelline' }} ·
               {{ T.bersaglio }} centri</i>
            <span class="stato">
              <em v-if="stellaDi(T)" title="tabellina imparata">⭐</em>
              <em v-else-if="i < progresso.tappa" class="spunta">✔</em>
            </span>
          </button>
        </div>
        <div class="riga">
          <button v-if="progresso.libera" class="bottone" @click="fase = 'libero'">Volo libero ♾️</button>
        </div>
        <p v-if="!progresso.libera" class="mini">Il volo libero — tutte le tabelline, senza
          bersaglio — si apre quando la campagna è finita.</p>
        </template>

        <!-- ─── le stazioni: il calcolo a mente ───
             Sono una campagna a parte e non il seguito dei pianeti: 3+4 viene
             prima delle tabelline, 4×23 viene dopo. Si può cominciare da qui. -->
        <template v-else>
        <div class="capitolo">🛰️ Le stazioni · i conti a mente</div>
        <p class="testo">Qui non c'è niente da scrivere: si fa a mente e si colpisce il
          risultato. Ogni stazione porta un trucco nuovo, e i numeri crescono da soli
          man mano che il trucco diventa tuo.</p>
        <div class="stazioni">
          <button v-for="(S, i) in STAZIONI" :key="'s' + i" class="stazione"
                  :class="{ fatto: i < progressoMente.tappa, chiuso: !sbloccataStazione(i),
                            ora: i === progressoMente.tappa }"
                  :disabled="!sbloccataStazione(i)" @click="iniziaStazione(i)">
            <span class="em">{{ sbloccataStazione(i) ? S.emoji : '🔒' }}</span>
            <b>{{ i + 1 }}. {{ S.nome }}</b>
            <i>{{ S.esempio }} · {{ S.bersaglio }} centri</i>
            <span class="stato">
              <em v-if="stellaMente(S)" title="stazione imparata">⭐</em>
              <em v-else-if="i < progressoMente.tappa" class="spunta">✔</em>
            </span>
          </button>
        </div>
        <div class="riga">
          <button v-if="progressoMente.libera" class="bottone"
                  @click="iniziaStazione(-1)">Volo a mente ♾️</button>
        </div>
        <p v-if="!progressoMente.libera" class="mini">Il volo a mente — tutti i trucchi
          insieme, con i numeri che continuano a crescere — si apre alla fine.</p>
        </template>

        <!-- l'astronave: si guadagna giocando, quindi va detto una volta
             che esiste. Altrimenti il primo cannone doppio arriva come un
             lampo giallo che nessuno ha capito. -->
        <div class="hangar">
          <div class="capitolo">🚀 La tua astronave</div>
          <p class="testo">Si potenzia da sola mentre giochi, e a fine partita torna
            com'era. Più risposte giuste di fila, più diventa forte — e se prendi
            botte si vede: ammaccata, poi con l'ala rotta e la luce rossa.</p>
          <div v-for="(P, id) in POTENZIAMENTI" :key="id" class="potere">
            <span class="em">{{ P.emoji }}</span>
            <b>{{ P.nome }}</b>
            <i>{{ P.spiega }}</i>
          </div>
        </div>

        <div class="riga">
          <button class="bottone chiaro" @click="apriTavola">📊 Cosa so</button>
        </div>
      </div>
    </div>

    <!-- volo libero: qui, e solo qui, le tabelline si scelgono a mano -->
    <div v-if="fase === 'libero'" class="velo">
      <h1 class="chiaro">Volo <span>libero</span></h1>
      <p class="testo chiaro">Nessun bersaglio: si vola finché ci sono vite.
        Quali tabelline vuoi allenare?</p>
      <div class="tabelle">
        <button v-for="n in 10" :key="n" class="tb" :class="{ on: sel.has(n) }"
                @click="scegliTabella(n)">{{ n }}</button>
      </div>
      <div class="riga">
        <button class="bottone chiaro" @click="tutte">Tutte</button>
        <button class="bottone" :disabled="!sel.size" @click="iniziaPianeta(-1)">Vola ▶</button>
      </div>
      <button class="link chiaro" @click="fase = 'mappa'">‹ torna alla mappa</button>
    </div>

    <!-- cosa so: una pagina di progressi, non un velo sopra la partita —
         stessa veste della mappa, e si esce dal tasto della barra -->
    <div v-if="fase === 'tavola'" class="schermo campagna">
      <Barra titolo="Cosa so" monete @indietro="fase = tornaDa">
        <div class="gettone">⭐ <b>{{ intere.size }}/10</b></div>
      </Barra>
      <div class="centro elenco">
        <div class="schede">
          <button :class="{ on: tavolaSu === 'tabelline' }"
                  @click="tavolaSu = 'tabelline'">✖️ Tabelline</button>
          <button :class="{ on: tavolaSu === 'mente' }"
                  @click="tavolaSu = 'mente'">🧠 A mente</button>
        </div>
        <MappaTabelline v-if="tavolaSu === 'tabelline'" :tabelle="tabelle" />
        <MappaConcetti v-else />
      </div>
    </div>

    <!-- tappa superata: vale per un pianeta e per una stazione -->
    <div v-if="fase === 'vinta'" class="velo">
      <h1 class="chiaro">{{ tappa.emoji }} {{ mente ? 'Stazione' : 'Pianeta' }}<br>
        <span>superata!</span></h1>
      <div class="dato"><b>{{ tappa.nome }}</b></div>
      <div class="dato">Centri: <span>{{ finale.giuste }}</span></div>
      <div class="dato">Premio: <span>+{{ premio }} 🪙</span></div>
      <template v-if="mente">
        <p v-if="!stellaMente(tappa)" class="testo chiaro">
          La ⭐ di questa stazione arriva quando i suoi trucchi ti restano in mano
          anche fra una settimana: manca poco.</p>
        <p v-else class="testo chiaro">⭐ I trucchi di questa stazione sono tuoi!</p>
      </template>
      <template v-else>
        <p v-if="tappa.nuova && !intere.has(tappa.nuova)" class="testo chiaro">
          La ⭐ della tabellina del {{ tappa.nuova }} arriva quando saprai tutte e dieci
          le caselle senza pensarci: manca poco.</p>
        <p v-else-if="tappa.nuova" class="testo chiaro">⭐ La tabellina del {{ tappa.nuova }}
          la sai per intero!</p>
      </template>
      <p v-if="prossima" class="dritta">Ora tocca a
        {{ prossima.emoji }} {{ prossima.nome }}. {{ prossima.dritta }}</p>
      <div class="riga">
        <button class="bottone" @click="prossimoPianeta">
          {{ mente ? 'Stazione successiva ▶' : 'Pianeta successivo ▶' }}</button>
        <button class="bottone chiaro" @click="allaMappa">Mappa</button>
      </div>
    </div>

    <!-- campagna finita -->
    <div v-if="fase === 'trionfo'" class="velo">
      <h1 class="chiaro">🎉 Campagna<br><span>finita!</span></h1>
      <p v-if="mente" class="testo chiaro">Tutte e {{ STAZIONI.length }} le stazioni sono
        superate. Premio: <b>+{{ premio }} 🪙</b>. Si apre il <b>volo a mente</b>, dove i
        numeri continuano a crescere e non c'è un ultimo calcolo.</p>
      <p v-else class="testo chiaro">Tutti e {{ CAMPAGNA.length }} i pianeti sono superati.
        Premio: <b>+{{ premio }} 🪙</b>. Si apre il <b>volo libero</b>, senza fine.</p>
      <div v-if="mente" class="dato">⭐ Stazioni sicure:
        <span>{{ stelleMente }}/{{ STAZIONI.length }}</span></div>
      <div v-else class="dato">⭐ Tabelline imparate: <span>{{ intere.size }}/10</span></div>
      <div class="riga">
        <button v-if="mente" class="bottone" @click="iniziaStazione(-1)">Volo a mente ♾️</button>
        <button v-else class="bottone" @click="fase = 'libero'">Volo libero ♾️</button>
        <button class="bottone chiaro" @click="allaMappa">Mappa</button>
      </div>
    </div>

    <!-- fine partita -->
    <div v-if="fase === 'fine'" class="velo">
      <h1 class="chiaro">Fine partita</h1>
      <div v-if="campagna" class="dato">{{ tappa.emoji }} {{ tappa.nome }}:
        <span>{{ finale.giuste }}/{{ tappa.bersaglio }}</span> centri</div>
      <div class="dato">Punti: <span>{{ finale.punti }}</span></div>
      <div class="dato">Livello: <span>{{ finale.livello }}</span></div>
      <div class="dato">{{ finale.record ? '🏆 Nuovo record!' : 'Record: ' + (state.profile.best.math || 0) }}</div>
      <div v-if="finale.ripasso.length" class="ripasso">
        <div class="tit">Da ripassare</div>
        <div v-for="r in finale.ripasso" :key="r.che">
          {{ r.che }} <i>✕{{ r.err }}</i>
        </div>
      </div>
      <div class="riga">
        <button class="bottone" @click="inizia()">Riprova ▶</button>
        <button class="bottone chiaro" @click="allaMappa">Mappa</button>
      </div>
      <button class="link chiaro" @click="apriTavola">📊 cosa so già</button>
    </div>
  </div>
</template>

<style scoped>
.spazio { background:#05081a; color:#fff }
canvas { position:absolute; inset:0; touch-action:manipulation }
.hud { position:absolute; top:0; left:0; right:0; padding:10px 12px 26px; display:flex;
       align-items:center; gap:10px; font-weight:800; font-size:clamp(14px,3.5vw,20px);
       pointer-events:none; background:linear-gradient(180deg,#05081af2 40%,#05081a00);
       text-shadow:0 2px 8px #000 }
.hud .sp { flex:1 }
.cuori { letter-spacing:2px; font-size:1.15em }
.serie { color:#ff9d1c }
.monete { color:#ffd94a }
.punti { color:#fff; opacity:.85 }
.liv { color:#7fe3ff }
.tondo.scuro { pointer-events:auto; background:#ffffff18; color:#fff; box-shadow:none }

/* i potenziamenti accesi: pulsano appena, quel tanto che basta a farsi
   notare in mezzo agli altri gettoni senza rubare l'occhio al cielo */
.gettone.potenz { font-weight:900; animation:pulsa-potenz 1.6s ease-in-out infinite }
.gettone.potenz.scudo { background:#7fe3ff33 !important; color:#dff6ff !important;
                        box-shadow:0 0 0 1.5px #7fe3ff88 }
.gettone.potenz.doppio { background:#ffd94a33 !important; color:#fff3c4 !important;
                         box-shadow:0 0 0 1.5px #ffd94a88 }
@keyframes pulsa-potenz { 50% { transform:scale(1.08) } }

/* ---- il bersaglio del pianeta, sotto la fascia ---- */
.bersaglio { position:absolute; top:clamp(44px,11vw,54px); left:12px; right:12px;
             display:flex; flex-direction:column; gap:4px; pointer-events:none }
.barra { position:relative; height:17px; border-radius:999px; background:#ffffff1a;
         overflow:hidden; box-shadow:inset 0 0 0 1px #ffffff22 }
.barra i { display:block; height:100%; border-radius:999px; transition:width .35s;
           background:linear-gradient(90deg,#2f7bff,#7fe3ff) }
.barra span { position:absolute; inset:0; display:flex; align-items:center;
              justify-content:center; font-size:11px; font-weight:900; letter-spacing:.4px;
              text-shadow:0 1px 3px #000c }
.barra.mirata i { background:linear-gradient(90deg,#c98a00,#ffd94a) }

.domanda { position:absolute; left:0; right:0; bottom:0; height:17vh; min-height:96px;
           display:flex; align-items:center; justify-content:center; pointer-events:none;
           background:linear-gradient(0deg,#0b1130,#0b113000) }
.domanda b { font-size:clamp(34px,11vw,68px); font-weight:900; letter-spacing:2px;
             text-shadow:0 0 22px #4aa3ff88, 0 4px 0 #0008; padding:0 12px;
             text-align:center; line-height:1.05 }
/* «in 149 quante volte c'è 7?» non ci sta nel corpo delle tabelline */
.domanda b.lunga { font-size:clamp(20px,5.6vw,36px); letter-spacing:0 }
.domanda i { font-style:normal; color:#7fe3ff }

/* il trucco che compare quando lo stesso concetto va storto due volte:
   sta sopra la domanda, dove l'occhio è già, e se ne va da solo */
.trucco { position:absolute; left:12px; right:12px; bottom:calc(17vh + 10px);
          padding:9px 13px; border-radius:14px; background:#0b1130e8;
          border:1px solid #7fe3ff55; color:#dbe7ff; font-size:14px; font-weight:700;
          line-height:1.4; text-align:center; pointer-events:none; z-index:4;
          animation:apparire-trucco .35s ease }
@keyframes apparire-trucco { from { opacity:0; transform:translateY(8px) } }

.cartello { position:absolute; left:0; right:0; top:38%; text-align:center; pointer-events:none;
            font-size:clamp(26px,7.5vw,54px); font-weight:900;
            text-shadow:0 0 24px currentColor, 0 4px 10px #000c;
            animation:apparire 1.5s cubic-bezier(.2,1.2,.3,1) forwards }
@keyframes apparire { 0%{opacity:0;transform:scale(.4)} 18%{opacity:1;transform:scale(1.12)}
                      30%{transform:scale(1)} 75%{opacity:1}
                      100%{opacity:0;transform:scale(1.15) translateY(-24px)} }

.velo { position:absolute; inset:0; background:#05081aee; display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:16px; padding:22px; text-align:center }
.chiaro { color:#fff }
h1.chiaro span { color:#7fe3ff }
.tabelle { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; max-width:340px; width:100% }
.tb { padding:12px 0; border-radius:12px; border:2px solid #ffffff2a; background:#ffffff10;
      color:#fff; font-size:18px; font-weight:800 }
.tb.on { background:#2f7bff; border-color:#7fe3ff; box-shadow:0 0 14px #2f7bff88 }
.dato { font-size:clamp(17px,4.6vw,24px); font-weight:800 }
.dato span { color:#ffd94a }
.dritta { font-size:14px; font-weight:700; color:#cbd5ff; max-width:34ch; line-height:1.45 }
.ripasso { font-size:16px; font-weight:800; opacity:.9 }
.ripasso .tit { font-size:12px; letter-spacing:2px; text-transform:uppercase; opacity:.6; margin-bottom:4px }
.ripasso i { font-style:normal; color:#ef5f5f }

/* ════════ la mappa: sta sopra il canvas e parla la lingua del resto del gioco ════════ */
.campagna { background:linear-gradient(180deg,#fff4e6,#ffe6ef 55%,#e9e4ff); color:var(--testo);
            z-index:5 }
.campagna .elenco { justify-content:flex-start; gap:12px; padding-bottom:26px }
.campagna h1 { margin-bottom:2px }
.pianeti, .stazioni { display:flex; flex-direction:column; gap:9px; width:100%; max-width:400px }
/* Le stazioni si vestono come i pianeti: sono la stessa cosa — una tappa
   con un bersaglio — e due grafiche direbbero che sono due giochi. */
.pianeta, .stazione {
           display:grid; grid-template-columns:auto 1fr auto; grid-template-rows:auto auto;
           gap:1px 13px; align-items:center; text-align:left; padding:12px 15px;
           border-radius:18px; background:var(--carta);
           box-shadow:0 4px 0 #dde3ea, 0 8px 18px #8593a822 }
.pianeta:active, .stazione:active { transform:translateY(2px); box-shadow:0 2px 0 #dde3ea }
.pianeta .em, .stazione .em { grid-row:1/3; font-size:31px }
.pianeta b, .stazione b { font-size:16px; font-weight:900; color:var(--viola-scuro) }
.pianeta i, .stazione i { font-style:normal; font-size:12px; color:var(--tenue) }
.pianeta .stato, .stazione .stato { grid-row:1/3; font-size:22px }
.pianeta .stato .spunta, .stazione .stato .spunta {
           font-style:normal; color:var(--verde); font-size:19px }
/* superato: resta acceso ma smette di chiamare */
.pianeta.fatto, .stazione.fatto { background:linear-gradient(120deg,#e9f7ea,#fffffff0) }
/* è il prossimo da fare: è quello che deve saltare all'occhio */
.pianeta.ora, .stazione.ora { background:linear-gradient(120deg,#e8f0ff,#fffffff0);
               box-shadow:0 4px 0 #c9d8f5, 0 0 0 2px var(--viola) }
.pianeta.chiuso, .stazione.chiuso { opacity:.5; box-shadow:0 3px 0 #e9ddf5 }
.pianeta.chiuso b, .pianeta.chiuso i,
.stazione.chiuso b, .stazione.chiuso i { color:var(--tenue) }

/* l'hangar: non è un negozio — è la spiegazione di cosa può capitare
   alla nave mentre si gioca, e sta in fondo perché si legge una volta */
.hangar { width:100%; max-width:400px; display:flex; flex-direction:column; gap:7px;
          margin-top:6px }
.hangar .testo { margin:0; text-align:left }
.potere { display:grid; grid-template-columns:auto 1fr; grid-template-rows:auto auto;
          gap:0 11px; align-items:center; text-align:left; padding:9px 13px;
          border-radius:16px; background:#ffffffb8; box-shadow:0 3px 0 #e6dcf2 }
.potere .em { grid-row:1/3; font-size:25px }
.potere b { font-size:14px; font-weight:900; color:var(--viola-scuro) }
.potere i { font-style:normal; font-size:12px; color:var(--tenue); line-height:1.35 }

/* le due facce di "Cosa so": i fatti in tavola, le strategie in elenco */
.schede { display:flex; gap:8px; width:100%; max-width:420px }
.schede button { flex:1; padding:9px 6px; border:0; border-radius:14px; background:#ffffffb0;
                 font-size:14px; font-weight:800; color:var(--tenue);
                 box-shadow:0 3px 0 #e9ddf5 }
.schede button.on { background:var(--carta); color:var(--viola-scuro);
                    box-shadow:0 3px 0 #c9d8f5, 0 0 0 2px var(--viola) }

/* il titolino che separa le due campagne nella stessa pagina */
.capitolo { align-self:flex-start; margin:10px 0 -4px; font-size:13px; font-weight:900;
            letter-spacing:.6px; text-transform:uppercase; color:var(--viola-scuro);
            opacity:.75 }
</style>
