<script setup>
/* Asteroidi: tabelline e calcolo a mente in un'unica fila di tappe, vedi
   docs/asteroidi/scaletta.md. Quale calcolo esce lo decide
   `store/tabelline.js`, non questo file: qui restano gli asteroidi. */
import { ref, reactive, computed, onMounted, onBeforeUnmount, onUnmounted } from 'vue'
import { state, item, answer,
         segna, segnaBest, mateProgresso, tabellineIntere,
         asteroidiCompleta } from '../store/profile.js'
import { apertaQui, tappaChiusaPerEtaQui } from '../data/portata-giochi.js'
import { PAGA } from '../data/paghe.js'
import { borsa } from '../store/varieta.js'
import { createPicker } from '../store/srs.js'
import { mareaTabelline, mareaCalcolo } from '../store/marea.js'
import { CAMPAGNA, chiaveCalcolo, fattoriDi, eGrande } from '../data/tabelline.js'
import { STAZIONI, CONCETTI_PER_ID, concettoDiChiave, eFatto,
         distrattoriDi, appartiene } from '../data/calcolo.js'
import { poolDi, esercizioDaChiave, eNuovo, stellaDi as stellaStazione,
         creaMiscela } from '../store/calcolo.js'
import { poolTappa, dellaTabellina,
         insiemeDi, chiaviDelle, distrattoriTabellina } from '../store/tabelline.js'
import { poolVoloTabelline, poolVoloMente, chiaviDelVolo, creaAlternanza,
         tagliaDelVolo, giraLaGrande, partenzaDalRecord }
  from '../store/volo.js'
import { CAPITOLI, SCALETTA, VOLO, superata, dopoDi,
         posizioneOra, filaDi, cieloDi, cieloDelVolo, voceDelVolo } from '../data/asteroidi.js'
import { GIOCHI } from '../data/giochi.js'
import { segnaPrimato, primatoDi, sosta, salvaSosta, buttaSosta, ritocca } from '../giochi/campagne.js'
import { hangarDi, vintaTappa, vintoVolo, bossNelVolo, livrea, pacchiDi } from '../motore/asteroidi/hangar.js'
import { scrivi, leggi, dice, recordDi, chiaveDi } from '../motore/asteroidi/sosta.js'
import Ripresa from '../giochi/Ripresa.vue'
import { fraseDiFine, recordInParole, sfidaDi } from '../giochi/primati.js'
import Festa from '../giochi/Festa.vue'
import { suono } from '../audio.js'
import { dipingiFondale, disegnaNave, disegnaAsteroide, statoScafo, puntoRotto,
         disegnaRaggio, disegnaFrammento } from '../grafica/spazio.js'
import { specieDi, disegnaSfondoVivo, coloreFrammenti } from '../grafica/cieli.js'
import { disegnaNaveMadre, disegnaPezzoMadre, cannoneDi, cupolaDi } from '../grafica/nave-madre.js'
import RegaloHangar from '../components/RegaloHangar.vue'
import HangarAsteroidi from '../components/HangarAsteroidi.vue'
import { POTENZIAMENTI, TASCA_MAX, EMERGENZA, premioDaSerie,
         gettoneDopo } from '../data/potenziamenti.js'
import { usaPausa } from '../giochi/pausa.js'
import VeloPausa from '../giochi/VeloPausa.vue'
import { TEMPO_MAX } from '../quiz/nucleo/domanda.js'
import MappaTabelline from '../components/MappaTabelline.vue'
import MappaConcetti from '../components/MappaConcetti.vue'
import RottaAsteroidi from '../components/RottaAsteroidi.vue'
import Barra from '../components/Barra.vue'
import TastoSalta from '../components/TastoSalta.vue'

const emit = defineEmits(['vai'])

const CFG = {
  vite: 3, viteMax: 5, cadutaSec: 10,
  rispostaEntro: 3,                // in scena entro 3s (vedi `ondata`): oltre, è attesa non lentezza
  base: 3, maxAsteroidi: 6, ogniLivelli: 2, salitaOgni: 5,
  ritmoPasso: 0.05, ritmoTappa: 0.7, ritmoVolo: 0.5,   // vedi `difficolta`, e docs/asteroidi/volo.md
  puntiOk: 10, puntiNo: -5, bossLento: 1.45, difficileLento: 1.25, colpiMadre: 3,
  msNonRisposto: 9000,             // il sasso è caduto: non è lentezza, è un buco
  bossPunti: 40, serieVita: 10, cartelloMonete: 10,
}

/* ---------- elementi: chiave normalizzata, 6×8 e 8×6 sono lo stesso fatto ---------- */
const daChiave = fattoriDi

const fase = ref('mappa')          // mappa | gioco | vinta | trionfo | fine | tavola

/* La pausa: vedi docs/core/interfaccia.md. Qui `anche` è una condizione
   sola — fuori dalla partita (mappa, veli, tavola di «Cosa so») — che
   copre tutti i veli in un colpo perché sono tutti letti da `fase`. */
const regaloVolo = ref(null)        // il pacco della nave madre del volo: ferma il cielo finché si guarda
let dado = Math.random              // se la nave madre del volo lascia il pacco; i test lo fissano
const { inPausa, fermo, metti, togli, aiuto } = usaPausa({
  anche: () => fase.value !== 'gioco' || !!regaloVolo.value,
})

/* La fila unica di pianeti e stazioni: vedi docs/asteroidi/scaletta.md.
   Una voce ha un `tipo` (da quale magazzino escono le domande) e un
   `pos`; il resto del gioco non sa nemmeno quello. Il contatore è uno
   solo (`mate.fila`); `mate.tappa`/`calc.tappa` restano nel profilo solo
   come specchio (`sincronizzaAsteroidi` in `store/profile.js`). */
const progresso = computed(() => mateProgresso())
const contatore = computed(() => filaDi(progresso.value))
const fila = SCALETTA
const dove = computed(() => posizioneOra(contatore.value))

// il posto nella fila, o -1 per il volo infinito: lì il mestiere non è
// un fatto della fila ma della domanda, e lo dice `magazzino` (store/volo.js)
const posizione = ref(0)
const magazzino = ref('tabelline')
const voce = computed(() => (posizione.value >= 0 ? fila[posizione.value] : null))
const campagna = computed(() => posizione.value >= 0)
// quale dei due mestieri: il tipo della voce, o nel volo il magazzino
const mente = computed(() => (voce.value ? voce.value.tipo === 'mente'
                                         : magazzino.value === 'mente'))
const tappa = computed(() => (voce.value ? voce.value.T : VOLO))
/* la sfida senza fine del manifesto: misura, racconto e record del volo */
const SFIDA_VOLO = sfidaDi(GIOCHI.find(g => g.chiave === 'mate').senzaFine)
// cosa dire sul velo della pausa: il posto nella fila
const dovEravamo = computed(() => voce.value
  ? `${voce.value.T.emoji} tappa ${voce.value.n} di ${fila.length}`
  : `${VOLO.emoji} ${VOLO.nome}`)
// il lucchetto legge `dove` (posizione in fila) e l'età (`data/portata-giochi.js`)
const apertaVoce = v => apertaQui(v.T, v.pos, dove.value)
const fattaVoce = v => superata(v, contatore.value)
// cosa viene dopo nella fila: dopo un pianeta può toccare a una stazione
const dopo = computed(() => voce.value
  ? dopoDi(voce.value, contatore.value, apertaVoce) : null)
// le stelle si rileggono dal motore ogni volta (vedi docs/asteroidi/scaletta.md)
const intere = computed(() => new Set(tabellineIntere()))
const stelleMente = computed(() =>
  STAZIONI.filter(S => stellaStazione(S, state.profile.items)).length)

/* la riga sotto il nome: cosa porta questa tappa */
const cheChiede = v => (v.tipo === 'mente'
  ? v.T.esempio
  : v.T.nuova ? 'la tabellina del ' + v.T.nuova : 'tutte le tabelline')

/* La rotta (docs/asteroidi/mappa.md): ogni tappa col suo stato già deciso.
   Chiusa vince su superata: una tappa superata e poi chiusa dall'età resta chiusa. */
const statoVoce = v => (!apertaVoce(v) ? 'chiusa' : fattaVoce(v) ? 'fatta'
  : v.pos === dove.value ? 'ora' : 'aperta')
function serveDi(v) {
  if (tappaChiusaPerEtaQui(CHIAVE, v.pos)) return 'Questa tappa per ora è chiusa.'
  const prima = fila[dove.value]
  if (!prima) return 'Non ancora.'
  const altre = v.pos - dove.value - 1
  return `Prima tocca a «${prima.T.nome}»` +
    (altre === 1 ? ", poi a un'altra tappa." : altre > 1 ? `, poi ad altre ${altre} tappe.` : '.')
}
const vociRotta = computed(() => fila.map(v => ({
  pos: v.pos, n: v.n, tipo: v.tipo, cap: v.cap, nome: v.T.nome,
  che: `${cheChiede(v)} · ${v.T.bersaglio} centri`,
  stato: statoVoce(v), serve: serveDi(v), pacchi: pacchiDi(hangarMappa.value, v.pos),
  disegno: v.tipo === 'mente' ? { tipo: 'mente', i: v.i, ultima: v.i === STAZIONI.length - 1 }
                              : { tipo: 'pianeta', nuova: v.T.nuova || 0 },
})))
// l'hangar com'è adesso, per la mappa: si rilegge quando si torna (`giroHangar`)
const giroHangar = ref(0)
const hangarMappa = computed(() => (giroHangar.value, hangarLetto()))
const livreaMappa = computed(() => livrea(hangarMappa.value.nave))
const voloRotta = computed(() => ({
  aperto: !!progresso.value.libera, nome: VOLO.nome, record: recordVolo.value,
  che: 'tabelline e conti a mente insieme, sempre più tosti',
}))
const partiDa = pos => (pos < 0 ? iniziaVolo() : vuoleIniziare(pos))

/* le tabelline in gioco: quelle della tappa, e nel volo infinito tutte e
   dieci — non si spuntano più a mano da nessuna parte */
const tabelle = computed(() =>
  !mente.value && campagna.value ? tappa.value.tabelle : VOLO.tabelle)

// `serieMax`: il filotto più lungo, per il record del volo
// `partenza`: il livello di inizio, sotto il record nel volo (vedi docs/asteroidi/volo.md)
const hud = reactive({ vite: 3, punti: 0, giuste: 0, mirate: 0, sbagliate: 0, livello: 1,
                       partenza: 1, serie: 0, serieMax: 0 })
const cartello = reactive({ testo: '', colore: '', n: 0 })
const finale = reactive({ punti: 0, giuste: 0, mirate: 0, livello: 1, record: false, ripasso: [],
                          primato: null,         // `primato`: null in una tappa, il record non c'è
                          regalo: null, scappata: false })   // la nave madre in fondo alla tappa
const recordVolo = computed(() => recordInParole(primatoDi('mate'), SFIDA_VOLO))
// le monete di questa partita: un asteroide le paga quando cade (docs/apprendimento/calibrazione.md)
let borsellino = borsa('mate'), mostrate = 0
const monete = reactive({ prese: 0, nota: '' })

const tela = ref(null)
let ctx = null, W = 0, H = 0, S = 1, suolo = 0, altezzaDomanda = 0
let asteroidi = [], particelle = [], anelli = [], stelle = [], frammenti = [], raggi = []
let scossa = 0, lampo = 0, pulsa = 0, raf = 0, ultimo = 0
let fondale = null, fumo = 0
let cielo = 'cintura', salto = 0   // il posto (data/asteroidi.js `cieloDi`) e il balzo fra due posti del volo

/* L'astronave dice a che punto è la partita senza numeri (vedi
   docs/asteroidi/volo.md). `danno` è tutto quello che il disegno sa
   dello stato; lo traduce `sincronizzaNave()` qui sotto, i tre gradini
   stanno in `grafica/spazio.js`. */
const nave = reactive({
  x: 0, y: 0, r: 34, lv: 1, danno: 0, mira: -Math.PI / 2, spinta: 0,
  gelo: 0, botta: 0, riparata: 0, t: 0, livrea: null,
})

/* La nave madre (docs/asteroidi/boss.md): in fondo a ogni tappa e ogni
   `BOSS_VOLO_OGNI` livelli del volo. Tira le bombe col numero; ogni bomba
   giusta le stacca un pezzo, alla terza salta. `chiamata`: in questa
   tappa è già arrivata (la tappa è superata, resta il pacco). */
const madre = { attiva: false, chiamata: false, attesa: false, colpi: 0,
                x: 0, y: 0, r: 60, sx: true, dx: true, cupola: true, paura: false,
                entra: 0, guarda: [0, 1], inclina: 0 }
let pezzi = []

// l'hangar sta in `campagne.mate` (docs/asteroidi/hangar.md); leggere non scrive
const hangarLetto = () => hangarDi(JSON.parse(JSON.stringify(((state.profile.campagne || {}).mate || {}).hangar || {})))
function conHangar(fn) {
  let esito = null
  ritocca(CHIAVE, c => { c.hangar = hangarDi(c.hangar); esito = fn(c.hangar) }, { subito: true })
  return esito
}
// `CFG.vite` è il riferimento: le vite di scorta guadagnate col filotto
// si vedono come una nave sana, non come una nave super
const stazzaDi = livello => (livello >= 6 ? 3 : livello >= 3 ? 2 : 1)
function sincronizzaNave() {
  nave.danno = Math.max(0, Math.min(1, 1 - (hud.vite - 1) / Math.max(1, CFG.vite - 1)))
  const lv = stazzaDi(hud.livello)
  if (lv > nave.lv) {
    nave.lv = lv
    mostraCartello(lv === 3 ? '🛰️ INCROCIATORE!' : '🛸 NAVE POTENZIATA!', '#7fe3ff')
    suono.compra()
  } else nave.lv = lv
}
// la domanda in corso: `peso` è quanto costa in testa, e decide quanti
// asteroidi mandare giù e quanto lentamente farli cadere
let domanda = reactive({ a: 7, b: 8, ris: 56, difficile: false, peso: 1,
                         testo: '7 × 8 = ?', chiave: chiaveCalcolo(7, 8) })
let esercizio = null               // l'istanza del calcolo a mente, per i falsi
let chieste = 0, apertoIl = 0
let prontaIl = 0   // quando il cronometro parte davvero: vedi docs/asteroidi/volo.md
// la marea (`store/marea.js`): il picker deve pesare con la stessa
// lentezza del pool, se no pesca comunque quello che il pool ha scartato
let marea = () => 1
/* tre risposte giuste di fila sullo stesso calcolo bastano per oggi: va a
   riposo e al suo posto entra qualcosa che ancora non si sa */
const picker = createPicker({ getItem: k => item(k), useTime: true, pausaDopo: 3,
                              lentezza: k => marea(k) })

// cosa può uscire: la scelta vera è in `store/tabelline.js`/`store/calcolo.js`
const chiaviPossibili = () => chiaviDelle(tabelle.value)

function poolAttivo() {
  const quanti = insiemeDi(tabelle.value) + picker.riposati
  const ora = Date.now()
  marea = mareaTabelline(state.profile.items, ora)
  return poolTappa(tappa.value, state.profile.items, ora, quanti)
}

function poolMente() {
  const ora = Date.now()
  marea = mareaCalcolo(state.profile.items, ora)
  return poolDi(tappa.value, state.profile.items, ora, 12 + picker.riposati)
}

// il volo infinito: il pool lo dà la mira del livello (`store/volo.js`),
// vedi docs/asteroidi/volo.md
function poolVolo() {
  const ora = Date.now()
  const quanti = 8 + picker.riposati
  if (mente.value) {
    marea = mareaCalcolo(state.profile.items, ora)
    return poolVoloMente(hud.livello, quanti)
  }
  marea = mareaTabelline(state.profile.items, ora)
  return poolVoloTabelline(hud.livello, quanti)
}

/* Difficoltà: vedi docs/asteroidi/volo.md ("Il livello, e quanto corre
   il cielo"). `peso` è quanto costa il calcolo (meno sassi, più tempo);
   il livello infittisce il cielo e accelera fino a un pavimento diverso
   in tappa e in volo (`ritmoTappa`/`ritmoVolo`). */
function ritmo(lv, volo) {
  const pavimento = volo ? CFG.ritmoVolo : CFG.ritmoTappa
  return Math.max(pavimento, 1 - (lv - 1) * CFG.ritmoPasso)
}

function difficolta(lv, peso = 1, volo = false) {
  const quanti = Math.min(CFG.maxAsteroidi,
                          CFG.base + Math.floor((lv - 1) / CFG.ogniLivelli))
  return { caduta: CFG.cadutaSec * (1 + (peso - 1) * 0.45) * ritmo(lv, volo),
           quanti: Math.max(3, quanti - (peso - 1)) }
}

/* la tappa vista da `store/tabelline.js`: le tabelline in gioco e la
   nuova, che nel volo libero non c'è */
const tabellineInGioco = () => ({ tabelle: tabelle.value,
                                  nuova: campagna.value ? tappa.value.nuova : null })

function preparaTabellina(k) {
  let [lo, hi] = daChiave(k)
  // sceglie un verso compatibile con le tabelline in gioco
  const versi = []
  if (tabelle.value.includes(lo)) versi.push([lo, hi])
  if (tabelle.value.includes(hi) && hi !== lo) versi.push([hi, lo])
  // una grande si legge in tutti e due i versi: 8×11 e 11×8 sono la
  // stessa casella, e «la tabellina dell'11» non è fra quelle in gioco
  if (eGrande(k) && hi !== lo) versi.push([hi, lo])
  const [a, b] = versi.length ? versi[Math.floor(Math.random() * versi.length)] : [lo, hi]
  esercizio = null
  domanda.chiave = k; domanda.a = a; domanda.b = b; domanda.ris = a * b
  domanda.testo = `${a} × ${b} = ?`
  domanda.peso = 1
  domanda.difficile = (Math.min(a, b) >= 6 && Math.max(a, b) >= 6) || a * b >= 48
  // la grande girata (96 : 12 = ?): vedi docs/asteroidi/volo.md
  if (!campagna.value && giraLaGrande(k)) {
    domanda.a = a * b; domanda.b = a; domanda.ris = b
    domanda.testo = `${a * b} : ${a} = ?`
    domanda.peso = 2; domanda.difficile = true
    esercizio = { a: a * b, b: a, segno: ':', ris: b }
  }
}

function preparaMente(k) {
  // nel volo la taglia la dice il livello, nelle tappe la forza del
  // concetto (vedi docs/asteroidi/volo.md)
  const taglia = campagna.value ? null : tagliaDelVolo(hud.livello)
  const e = esercizioDaChiave(k, state.profile.items, Date.now(), { taglia })
  esercizio = e
  domanda.chiave = k; domanda.a = e.a; domanda.b = e.b; domanda.ris = e.ris
  domanda.testo = e.testo
  domanda.peso = e.peso
  // un conto da due, o un concetto da uno alla taglia in cui i numeri
  // sono grossi davvero (90+90, 87×10): il tempo di caduta si allunga.
  // Un fatto (3+4) non ha taglia e resta quello che è
  domanda.difficile = e.peso >= 2 || (!eFatto(k) && (taglia ?? 0) >= 0.8)
}

// la miscela: il pool dice cosa c'è, questa ogni quanto (docs/asteroidi/scaletta.md)
const miscela = creaMiscela()
function scegli(p) {
  return picker.pick(campagna.value
    ? miscela.parte(p, eDellaTappa, domanda.chiave) : p)
}

// nel volo i due magazzini si alternano (docs/asteroidi/volo.md)
const alternanza = creaAlternanza()

function nuovaDomanda() {
  if (!campagna.value) {
    magazzino.value = alternanza.prossimo()
    alternanza.segna(magazzino.value)
  }
  const p = !campagna.value ? poolVolo() : mente.value ? poolMente() : poolAttivo()
  const k = scegli(p)
  miscela.segna(eDellaTappa(k))
  if (mente.value) preparaMente(k)
  else preparaTabellina(k)
  apertoIl = performance.now()
  // il gelo vale solo per la domanda per cui si è comprato (vedi docs/asteroidi/volo.md)
  gelo = false; gelato.value = false; nave.gelo = 0
  return k
}

/* `salvata`: la domanda aperta di una sosta (docs/asteroidi/sosta.md). Si
   rimette la stessa, e il sasso giusto riparte da dov'era: i sassi non si
   salvano, ma chi esce e rientra non deve ritrovare tempo che non aveva. */
function ondata(salvata = null) {
  asteroidi = []
  const boss = madre.attiva            // le bombe della nave madre al posto dei sassi
  if (salvata) rimettiDomanda(salvata)
  else { nuovaDomanda(); chieste++ }

  const { caduta, quanti } = difficolta(hud.livello, domanda.peso, !campagna.value)
  // `esercizio` c'è per un conto a mente e per una grande girata: i
  // falsi di una divisione non sono quelli di un prodotto
  const falsi = esercizio ? distrattoriDi(esercizio, quanti - 1)
                          : distrattoriTabellina(domanda.a, domanda.b, quanti - 1)
  const valori = [domanda.ris, ...falsi].sort(() => Math.random() - 0.5)
  const colonna = W / quanti
  let lento = boss ? CFG.bossLento : (domanda.difficile ? CFG.difficileLento : 1)
  // l'ultima vita allunga il tempo: chi è arrivato qui di solito sa il
  // conto e non fa in tempo a farlo — vedi `data/potenziamenti.js`
  if (hud.vite <= EMERGENZA.sotto) lento *= EMERGENZA.tempo
  const vel = suolo / (caduta * lento)

  valori.forEach((v, i) => {
    const ok = v === domanda.ris
    const base = Math.min(W, H) * 0.095 + (String(v).length - 1) * 6 * S
    const r = Math.max(24, Math.min(base, colonna * 0.46, 68))
    // lo sfalsamento è per i sassi sbagliati (altrimenti nascono in fila);
    // il sasso giusto è vincolato a essere in scena entro `rispostaEntro`
    // secondi, e da lì parte il cronometro `prontaIl` (docs/asteroidi/volo.md)
    const inScena = 2 * r                   // da y = -r-off a centro in y = r
    const sfalsa = Math.random() * H * 0.30
    const off = ok ? Math.min(sfalsa, Math.max(-r, vel * CFG.rispostaEntro - inScena))
                   : sfalsa
    if (ok) prontaIl = apertoIl + ((inScena + off) / vel) * 1000
    const m = r * 1.02
    const x = colonna * i + colonna / 2 + (Math.random() - 0.5) * Math.max(0, colonna - 2 * r - 6)
    asteroidi.push({
      x: Math.max(m, Math.min(W - m, x)), y: -r - off, r, v, ok,
      specie: boss ? 'bomba' : specieDi(cielo), rossa: cielo === 'marte',
      seme: Math.floor(Math.random() * 1e9),
      vy: vel, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.5,
      ph: Math.random() * 6.28, morto: false,
      forma: Array.from({ length: 9 }, () => 0.76 + Math.random() * 0.34),
      // i crateri si sorteggiano qui una volta sola: sorteggiarli a ogni
      // fotogramma farebbe ribollire il sasso invece di farlo ruotare
      crateri: Array.from({ length: 3 }, () => {
        const ang = Math.random() * 6.28, d = Math.random() * 0.5
        return [Math.cos(ang) * d, Math.sin(ang) * d, 0.10 + Math.random() * 0.13]
      }),
    })
  })
  if (salvata) rimettiCielo(salvata)
  salva()
}

// la domanda di prima, com'era: stesso verso, stessi numeri, gelo già speso
function rimettiDomanda(d) {
  esercizio = d.esercizio
  Object.assign(domanda, { chiave: d.chiave, a: d.a, b: d.b, ris: d.ris, testo: d.testo,
                           peso: d.peso, difficile: d.difficile })
  apertoIl = performance.now()
  gelo = d.gelo; gelato.value = d.gelo; nave.gelo = d.gelo ? 1 : 0
}

/* i falsi sono nuovi (si rifanno dal codice), ma quelli tolti dal mirino o
   toccati restano tolti; e tutto il cielo scende quanto serve perché il
   sasso giusto sia alla stessa quota di prima, col cronometro di prima */
function rimettiCielo(d) {
  const giusto = asteroidi.find(a => a.ok)
  const falsi = asteroidi.filter(a => !a.ok)
  for (let n = 0; n < d.tolti && falsi.length; n++)
    falsi.splice(Math.floor(Math.random() * falsi.length), 1)[0].morto = true
  const dy = d.quota * suolo - giusto.y
  for (const a of asteroidi) a.y = Math.min(a.y + dy, suolo - a.r * 1.2)
  prontaIl = performance.now() - d.ms
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

/* quello che la tappa è venuta a insegnare: la tabellina del pianeta, o i
   concetti nuovi della stazione. Serve due volte — per dosare la miscela
   della partita e per contare le risposte «mirate» del bersaglio — ed è
   la stessa domanda, quindi è una funzione sola */
function eDellaTappa(k) {
  if (!campagna.value) return false
  if (mente.value) return eNuovo(tappa.value, k)
  return dellaTabellina(tappa.value.nuova, k)
}
const eMirata = k => eDellaTappa(k)

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
  const n = 6
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * 6.2832, ap = 6.2832 / n
    const punti = [[0, 0],
      [Math.cos(ang) * a.r * 0.9, Math.sin(ang) * a.r * 0.9],
      [Math.cos(ang + ap) * a.r * 0.9, Math.sin(ang + ap) * a.r * 0.9]]
    const sp = (60 + Math.random() * 150) * S
    frammenti.push({ x: a.x, y: a.y, punti, rot: 0,
                     vr: (Math.random() - 0.5) * 7,
                     vx: Math.cos(ang + ap / 2) * sp, vy: Math.sin(ang + ap / 2) * sp - 40 * S,
                     vita: 1, c: coloreFrammenti(a.specie) })
  }
  esplodi(a.x, a.y, colore, 30)
  anello(a.x, a.y, colore, a.r * 3)
}

// i gettoni: si guadagnano col filotto e restano in tasca finché non si
// premono; vedi docs/asteroidi/volo.md e `data/potenziamenti.js`
const tasca = reactive({ gelo: 0, mirino: 0 })
const gelato = ref(false)
let gelo = false

// i premi del filotto: le soglie stanno in `data/potenziamenti.js`
function premia(serie) {
  const p = premioDaSerie(serie, CFG.serieVita)
  if (p === 'vita') dammiVita('🔥 ' + serie + ' DI FILA!')
  else if (p === 'gettone') prendiGettone(prossimoGettone(), '🔥 ' + serie + ' DI FILA!  ')
}

// quale gettone tocca (`data/potenziamenti.js`), scavalcando l'alternanza
// se la tasca di quello che toccherebbe è piena
let ultimoGettone = null
function prossimoGettone() {
  const tocca = gettoneDopo(ultimoGettone)
  const altro = gettoneDopo(tocca)
  return tasca[tocca] < TASCA_MAX ? tocca : altro
}

// tasca piena (`TASCA_MAX`): il gettone non si prende, ma si dice
function prendiGettone(quale, prefisso = '') {
  const P = POTENZIAMENTI[quale]
  const pieno = tasca[quale] >= TASCA_MAX
  if (!pieno) { tasca[quale]++; ultimoGettone = quale }
  mostraCartello(prefisso + (pieno ? P.emoji + ' TASCA PIENA!' : P.grido), P.colore)
  suono.compra()
  anello(nave.x, nave.y, P.colore, nave.r * 9)
}

// ❄️ il gelo: rallenta finché questa domanda non è finita, non si ripreme
function usaGelo() {
  if (fase.value !== 'gioco' || !tasca.gelo || gelo) return
  tasca.gelo--
  gelo = true; gelato.value = true
  nave.gelo = 1
  mostraCartello(POTENZIAMENTI.gelo.grido, POTENZIAMENTI.gelo.colore)
  anello(nave.x, nave.y, '#9fd8ff', Math.max(W, H))
  suono.compra()
  salva()                          // un gettone speso non si ridà uscendo
}

// 🎯 il mirino: toglie una risposta sbagliata a caso (mai la più vicina o
// quella più in basso: sarebbe un consiglio); nessun `answer()`, nessuno ha risposto
function usaMirino() {
  if (fase.value !== 'gioco' || !tasca.mirino) return
  const vittime = asteroidi.filter(a => !a.morto && !a.ok)
  // in cielo è rimasta solo la risposta giusta: non c'è niente da
  // togliere, e il gettone resta in tasca invece di bruciarsi
  if (!vittime.length) return mostraCartello('🎯 niente da togliere', '#8cff9d')
  // ne restano tre in cielo (la giusta e due), o una in meno se erano già tre
  const via = Math.max(1, vittime.length + 1 - POTENZIAMENTI.mirino.restano)
  tasca.mirino--
  for (const v of vittime.sort(() => Math.random() - 0.5).slice(0, via)) {
    v.morto = true
    spara(v, '#8cff9d'); rompi(v, '#8cff9d')
  }
  suono.ok()
  salva()
}

/* Il tasto «salta» dei grandi (docs/core/comandi.md): il sasso giusto
   esplode come se l'avessero preso, e la partita va avanti. Non è una risposta:
   niente ripasso, niente monete, niente punti, filotto e gettoni fermi, e
   `segna()` non si tocca. Conta solo per andare avanti (centri, livello, tappa). */
function salta() {
  if (fase.value !== 'gioco') return
  const a = asteroidi.find(x => x.ok && !x.morto)
  if (!a) return
  spara(a, '#8cff9d'); rompi(a, '#8cff9d'); suono.ok()
  hud.giuste++
  if (eMirata(domanda.chiave)) hud.mirate++
  if (madre.attiva) return colpoAllaMadre(a)
  avanti()
}

// dopo un centro: il livello, la nave, poi la nave madre o la domanda dopo
function avanti() {
  const nuovo = hud.partenza + Math.floor(hud.giuste / CFG.salitaOgni)
  if (nuovo > hud.livello) { hud.livello = nuovo; salitaLivello() }
  sincronizzaNave()
  if (fase.value !== 'gioco') return
  if (campagna.value && !madre.chiamata && centrato()) return chiamaMadre()
  if (madre.attesa) return chiamaMadre()
  ondata()
}

/* ---------- la nave madre (docs/asteroidi/boss.md) ---------- */
function chiamaMadre() {
  Object.assign(madre, { attiva: true, attesa: false, colpi: 0, sx: true, dx: true,
                         cupola: true, paura: false, entra: 0 })
  // in una tappa arriva a bersaglio fatto: la stella si scrive adesso, il pacco dopo
  if (campagna.value) { madre.chiamata = true; asteroidiCompleta(voce.value) }
  mostraCartello('LA NAVE MADRE!', '#ff6b6b')
  suono.boss(); scossa = 10
  ondata()
}

// la bomba giusta torna indietro e le stacca un pezzo: il cannone sinistro, il destro, poi la cupola
function colpoAllaMadre(a) {
  madre.colpi++
  const lato = madre.colpi === 1 ? -1 : 1
  const dove = madre.colpi < CFG.colpiMadre ? cannoneDi(madre, lato) : cupolaDi(madre)
  raggi.push({ x0: a.x, y0: a.y, x1: dove.x, y1: dove.y, vita: 1.6, c: '#ffd94a' })
  esplodi(dove.x, dove.y, '#ffd94a', 24); scossa = 12; suono.boom()
  if (madre.colpi < CFG.colpiMadre) {
    if (lato < 0) madre.sx = false
    else { madre.dx = false; madre.cupola = false; madre.paura = true }
    pezzi.push({ x: dove.x, y: dove.y, rot: 0, vr: lato * (2 + Math.random() * 2),
                 vx: lato * (50 + Math.random() * 60) * S, vy: -90 * S, r: madre.r, vita: 1 })
    return avanti()
  }
  abbattiMadre()
}

function abbattiMadre() {
  madre.attiva = false
  asteroidi = []
  for (let i = 0; i < 4; i++) esplodi(madre.x + (Math.random() - 0.5) * madre.r * 2,
                                      madre.y + (Math.random() - 0.5) * madre.r, '#ffb347', 30)
  anello(madre.x, madre.y, '#ffd94a', Math.max(W, H)); lampo = 0.6; scossa = 18
  hud.punti += CFG.bossPunti; suono.boss()
  if (campagna.value) {
    const v = voce.value
    finale.regalo = conHangar(h => vintaTappa(h, v.pos))
    return tappaSuperata()
  }
  dammiVita('NAVE MADRE\nABBATTUTA!')
  prendiGettone(prossimoGettone())
  regaloVolo.value = conHangar(h => vintoVolo(h, hud.livello, dado()))
  avanti()
}

function colpisci(a) {
  const k = domanda.chiave
  // il tempo è da `prontaIl` (quando il sasso era raggiungibile), non dalla
  // domanda; `TEMPO_MAX` è lo stesso tetto dei quiz, stessa media pesata
  const ms = Math.min(TEMPO_MAX, Math.max(0, performance.now() - prontaIl))
  const mirata = eMirata(k)
  const nota = { correct: a.ok }   // col gelo acceso il tempo non si segna: misurerebbe il ghiaccio
  if (!gelo) nota.ms = ms
  if (a.ok) {
    answer(k, nota); picker.afterAnswer(k, true)
    hud.giuste++; hud.serie++
    hud.serieMax = Math.max(hud.serieMax, hud.serie)
    if (mirata) hud.mirate++
    // il filotto si registra mentre cresce: chiudere la partita a metà non
    // deve buttare via il record
    segnaBest('serieMath', hud.serie)
    spara(a); rompi(a, '#7fe3ff')
    hud.punti += CFG.puntiOk; suono.ok()
    premia(hud.serie)
    borsellino.paga(PAGA.asteroide)
    // la moneta è già arrivata: il cartello ogni dieci centri dice solo quante ne hai fatte
    if (hud.giuste % CFG.cartelloMonete === 0 && borsellino.dato > mostrate) {
      mostraCartello('+' + (borsellino.dato - mostrate) + ' 🪙', '#ffd94a'); suono.moneta()
      mostrate = borsellino.dato
    }
    segna(mente.value ? 'mente' : 'math')
    if (madre.attiva) return colpoAllaMadre(a)
    avanti()
  } else {
    answer(k, nota); picker.afterAnswer(k, false)
    a.morto = true; hud.serie = 0; hud.sbagliate++
    spara(a, '#ff6b6b')
    esplodi(a.x, a.y, '#ff6b6b', 14); suono.no(); scossa = 10
    hud.punti = Math.max(0, hud.punti + CFG.puntiNo)
    // i gettoni in tasca non si perdono sbagliando (docs/asteroidi/volo.md)
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
  // questo `setTimeout` non si ferma in pausa, e va bene così: spegne solo un cartello
  clearTimeout(spegniDritta)
  spegniDritta = setTimeout(() => { dritta.value = '' }, 9000)
}

function dammiVita(perche) {
  if (hud.vite < CFG.viteMax) {
    hud.vite++; mostraCartello(perche + '  +1 ♥', '#ff8fa3'); suono.vita()
    nave.riparata = 1; sincronizzaNave()
  } else mostraCartello(perche, '#ffd94a')
}

// una vita in meno non si dice con un numero: la nave resta più malconcia (docs/asteroidi/volo.md)
function perdiVita() {
  hud.serie = 0
  nave.botta = 1
  if (--hud.vite <= 0) {
    sincronizzaNave()
    // la tappa era già superata: perdere con la nave madre costa solo il pacco
    return campagna.value && madre.chiamata ? tappaSuperata({ scappata: true }) : finePartita()
  }
  sincronizzaNave()
  salva()                          // una vita persa non si ridà uscendo
}

function salitaLivello() {
  // nel volo ogni livello è un posto della storia (docs/asteroidi/cieli.md)
  const posto = campagna.value ? null : cieloDelVolo(hud.livello)
  const v = voceDelVolo(hud.livello)
  mostraCartello('LIVELLO ' + hud.livello + (posto ? '\n' + (v ? v.T.nome : 'Il buco nero').toUpperCase() : ''),
                 '#7fe3ff')
  if (posto && posto !== cielo) { mettiCielo(posto); salto = 1 }
  if (!campagna.value && bossNelVolo(hud.livello)) madre.attesa = true
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
  // le stelle vive: tre strati a velocità diverse (parallasse); il resto
  // del cielo sta fermo nel fondale in cache, ridipinto solo qui
  stelle = Array.from({ length: 90 }, () => {
    const z = Math.random() < 0.5 ? 0.35 : Math.random() < 0.7 ? 0.7 : 1.2
    return { x: Math.random() * W, y: Math.random() * H, z,
             r: (0.4 + Math.random() * 1.2) * z, s: (6 + Math.random() * 10) * z,
             a: 0.25 + Math.random() * 0.55 * z }
  })
  fondale = dipingiFondale(W, H, Math.random, cielo)
  madre.r = Math.max(40, Math.min(80, Math.min(W, H) * 0.13))
  nave.r = Math.max(30, Math.min(54, Math.min(W, H) * 0.1))
  nave.x = W / 2; nave.y = suolo - nave.r * 0.8
}

function mettiCielo(c) {
  cielo = c
  if (W) fondale = dipingiFondale(W, H, Math.random, cielo)
}

// il cannone non sa dove sono gli asteroidi (spazza a tempo, punta solo
// dopo che il dito ha scelto): vedi docs/asteroidi/volo.md
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
  /* il gelo rallenta il cielo qui e solo qui: la velocità con cui il
     sasso è nato (`a.vy`) resta quella, se no un gettone speso a metà
     caduta lascerebbe metà covata veloce e metà lenta */
  const rall = gelo ? POTENZIAMENTI.gelo.lento : 1
  for (const a of asteroidi) {
    if (a.morto) continue
    a.y += a.vy * rall * dt; a.rot += a.vr * dt
    if (a.y - a.r > suolo) { a.morto = true; if (a.ok) caduto = a }
  }
  if (caduto) {
    const k = domanda.chiave
    answer(k, { correct: false, ms: CFG.msNonRisposto }); picker.afterAnswer(k, false)
    hud.sbagliate++
    // il sasso arriva in fondo, all'altezza della nave: la botta la
    // prende lei (`perdiVita`), e qui resta solo lo scoppio là dove ha
    // colpito — il pianeta che si accendeva di rosso non c'è più
    esplodi(caduto.x, suolo, '#ff9d1c', 34)
    anello(caduto.x, suolo, '#ff9d1c', W * 0.5)
    suono.boom(); scossa = 16
    perdiVita()
    if (fase.value === 'gioco') ondata()
  }
}

// scintille, fumo, raggi e la spazzata vivono qui e non in `aggiorna`:
// si consumano anche a gioco fermo, se no restano appesi durante una festa
function effetti(dt) {
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
  // la nave madre scende al suo posto e ondeggia piano; guarda la nave
  if (madre.attiva) {
    madre.entra = Math.min(1, madre.entra + dt * 0.9)
    const su = 64 + madre.r * 0.75
    madre.x = W / 2 + Math.sin(pulsa * 0.5) * W * 0.12
    madre.y = -madre.r * 2 + (su + madre.r * 2) * (1 - (1 - madre.entra) ** 3)
    madre.guarda = [nave.x - madre.x, nave.y - madre.y]
    madre.inclina = Math.sin(pulsa * 0.8) * 0.04 + (madre.paura ? Math.sin(pulsa * 9) * 0.03 : 0)
  }
  for (const p of pezzi) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt * S
    p.rot += p.vr * dt; p.vita -= dt * 0.45
  }
  pezzi = pezzi.filter(p => p.vita > 0 && p.y < H + p.r)
  if (salto > 0) salto -= dt * 0.8
  if (scossa > 0) scossa -= dt * 40
  if (lampo > 0) lampo -= dt * 1.6
  if (nave.botta > 0) nave.botta -= dt * 2.2
  if (nave.riparata > 0) nave.riparata -= dt * 1.6
  if (nave.spinta > 0) nave.spinta -= dt * 2.5
  // il fumo esce dal punto dello strappo (`puntoRotto`), non dal centro;
  // la soglia è `statoScafo`, non un numero scritto qui — i gradini
  // stanno in `grafica/spazio.js` e vanno letti da lì, non duplicati
  const rovina = statoScafo(nave.danno)
  if (rovina >= 1 && (fumo -= dt) <= 0) {
    fumo = rovina >= 2 ? 0.1 : 0.16
    const rotto = puntoRotto(nave.lv)
    const x = nave.x + rotto.x * nave.r + (Math.random() - 0.5) * nave.r * 0.3
    const y = nave.y + rotto.y * nave.r
    particelle.push({ x, y, vx: (Math.random() - 0.5) * 24 * S,
                      vy: -34 * S, vita: 0.85, leggera: true,
                      r: (2.5 + Math.random() * 3.5) * S,
                      c: rovina >= 2 ? '#6a6a78' : '#9898a6' })
    if (rovina >= 2 && Math.random() < 0.5)
      particelle.push({ x, y: nave.y, vx: (Math.random() - 0.5) * 70 * S,
                        vy: -(40 + Math.random() * 60) * S, vita: 0.7,
                        r: (1.5 + Math.random() * 2) * S,
                        c: Math.random() < 0.5 ? '#ffd94a' : '#ff9d1c' })
  }
}

// l'ordine dei piani: il cielo, la nave, poi gli asteroidi — i numeri
// devono restare leggibili anche quando un sasso passa davanti alla nave
function disegna(dt) {
  ctx.save()
  if (scossa > 0) ctx.translate((Math.random() - 0.5) * scossa, (Math.random() - 0.5) * scossa)

  if (fondale) ctx.drawImage(fondale, 0, 0, W, H)
  disegnaSfondoVivo(ctx, cielo, W, H, pulsa)
  // il balzo fra due posti del volo: le stelle diventano scie
  const scia = Math.max(0, salto) * 40
  for (const s of stelle) {
    s.y += s.s * dt * (1 + scia); if (s.y > H) { s.y = 0; s.x = Math.random() * W }
    ctx.globalAlpha = s.a; ctx.fillStyle = s.z > 1 ? '#dff1ff' : '#fff'
    if (scia > 1) ctx.fillRect(s.x - s.r / 2, s.y - s.s * scia * 0.05, s.r, s.s * scia * 0.05)
    else { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.29); ctx.fill() }
  }
  ctx.globalAlpha = 1

  nave.t = pulsa
  disegnaNave(ctx, nave)

  // `gelo` sull'asteroide è un fatto già deciso da 0 a 1, come `boss`:
  // `grafica/spazio.js` gli tinge l'attrito di azzurro e non sa che
  // esista un gettone da premere
  if (fase.value === 'gioco') {
    const brina = gelo ? 1 : 0
    // la nave madre sotto le bombe: sopra, la bomba giusta restava nascosta dietro di lei
    if (madre.attiva) disegnaNaveMadre(ctx, madre, S, pulsa)
    for (const a of asteroidi) if (!a.morto) { a.gelo = brina; disegnaAsteroide(ctx, a, S, pulsa) }
  }
  for (const p of pezzi) disegnaPezzoMadre(ctx, p, S)
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

/* Il battito: `fermo` (`giochi/pausa.js`, docs/core/interfaccia.md) ferma
   solo `aggiorna` (il cielo resta vivo sotto il velo). Il cronometro
   della risposta (`prontaIl`) sta fermo con lui, se no un telefono
   posato mezz'ora finirebbe nell'SRS come mezz'ora di esitazione. */
function ciclo(ts) {
  const vero = ultimo ? ts - ultimo : 0     // quanto è passato davvero, buchi compresi
  const dt = Math.min(0.05, vero / 1000); ultimo = ts
  pulsa += dt
  if (fermo.value) prontaIl += vero
  else aggiorna(dt)
  effetti(dt)
  disegna(dt)
  raf = requestAnimationFrame(ciclo)
}

/* ---------- partite ----------
   `i` è il posto nella fila, oppure -1 per un volo infinito. */
function inizia(i = posizione.value, dato = null) {
  // una partita nuova butta quella lasciata a metà (la mappa ha già chiesto)
  if (!dato) scorda()
  // una partita non comincia in pausa: senza, il freno lasciato acceso
  // sulla mappa la farebbe nascere dietro un velo che nessuno ha chiesto
  togli()
  posizione.value = i
  hud.vite = CFG.vite; hud.punti = 0; hud.giuste = 0; hud.mirate = 0; hud.sbagliate = 0
  // il volo riparte da sotto il record (`partenzaDalRecord`, docs/asteroidi/volo.md);
  // va letto PRIMA di `ondata()`, che costruisce già il primo pool su questo livello
  const record = campagna.value ? null : primatoDi('mate')
  hud.partenza = record && record.dettagli ? partenzaDalRecord(record.dettagli.livello) : 1
  hud.livello = hud.partenza; hud.serie = 0; hud.serieMax = 0
  finale.primato = null
  particelle = []; anelli = []; frammenti = []; raggi = []; pezzi = []
  scossa = 0; lampo = 0; chieste = 0; salto = 0
  Object.assign(madre, { attiva: false, chiamata: false, attesa: false, colpi: 0 })
  finale.regalo = null; finale.scappata = false; regaloVolo.value = null
  nave.livrea = livrea(hangarLetto().nave)
  borsellino = borsa('mate'); mostrate = 0
  // la nave torna nuova a ogni partita, e la tasca si svuota: i gettoni
  // sono il premio di *questa* partita e non un salvataggio — il perché
  // sta in `data/potenziamenti.js`
  // chi riparte da livello 8 riparte con l'incrociatore, senza il
  // cartello che lo annuncia: non l'ha appena guadagnato, ce l'aveva
  nave.lv = stazzaDi(hud.partenza); nave.gelo = 0
  nave.botta = 0; nave.riparata = 0; nave.mira = -Math.PI / 2
  tasca.gelo = 0; tasca.mirino = 0
  gelo = false; gelato.value = false; ultimoGettone = null
  sincronizzaNave()
  picker.reset(); miscela.azzera(); alternanza.azzera()
  sbagli.clear(); dritta.value = ''
  if (dato) rimettiPartita(dato)
  else segna('partiteMath')
  mettiCielo(campagna.value ? cieloDi(voce.value) : cieloDelVolo(hud.livello))
  fase.value = 'gioco'
  ondata(dato && dato.aperta)
}

// dalla mappa si tocca una voce e basta: pianeta o stazione lo dice il dato
const iniziaVoce = v => vuoleIniziare(v.pos)
const iniziaVolo = () => vuoleIniziare(-1)   // il volo infinito: si apre a fila finita

/* ---------- la partita lasciata a metà ----------
   Uscire non butta via niente: si scrive dove si era (motore/asteroidi/sosta.js)
   e la mappa la offre in cima. Vedi docs/asteroidi/sosta.md. */
const CHIAVE = 'mate'
const contestoSosta = () => ({ aperta: apertaVoce, libera: !!progresso.value.libera })
function laRipresa() {
  const d = dice(sosta(CHIAVE), contestoSosta())
  if (!d) return null
  const vite = `❤️ ${d.vite}`
  return d.volo
    ? { emoji: d.emoji, nome: d.nome, dettaglio: `⭐ ${d.punti} punti · livello ${d.livello} · ${vite}` }
    : { emoji: d.emoji, nome: d.nome,
        dettaglio: `🎯 ${d.giuste}/${d.bersaglio} centri · livello ${d.livello} · ${vite}` }
}
const ripresa = ref(laRipresa())
const chiede = ref(null)           // { nome, voce }: la partita nuova che butterebbe quella a metà

// la domanda in corso, per la sosta: dov'è il sasso giusto e da quanto è raggiungibile
function domandaAperta() {
  const giusto = asteroidi.find(a => a.ok && !a.morto)
  if (!giusto || !suolo) return null
  return { chiave: domanda.chiave, a: domanda.a, b: domanda.b, ris: domanda.ris, testo: domanda.testo,
           peso: domanda.peso, difficile: domanda.difficile, esercizio, boss: madre.attiva,
           gelo, tolti: asteroidi.filter(a => a.morto && !a.ok).length,
           quota: giusto.y / suolo, ms: performance.now() - prontaIl }
}

function salva({ subito = false } = {}) {
  if (fase.value !== 'gioco') return
  salvaSosta(CHIAVE, scrivi({
    chiave: chiaveDi(voce.value), hud, tasca, ultimoGettone, chieste, magazzino: magazzino.value,
    monete: { chiesto: borsellino.chiesto, dato: borsellino.dato, mostrate },
    madre: { attiva: madre.attiva, chiamata: madre.chiamata, attesa: madre.attesa, colpi: madre.colpi },
    aperta: domandaAperta(),
  }), { subito })
}

/* Si butta la sosta. Un volo lasciato a metà ha già fatto i suoi punti: se si
   lascia perdere, il record si scrive adesso (`registra: false` è per chi ha
   appena finito la partita e ha già scritto il suo). */
function scorda({ registra = true } = {}) {
  const dato = sosta(CHIAVE)
  if (dato) {
    const r = registra && recordDi(dato)
    if (r) {
      segnaPrimato('mate', r.punti, Date.now(), r.dettagli)
      segnaBest('math', r.punti)          // dopo il quaderno: vedi `finePartita`
    }
    buttaSosta(CHIAVE)
  }
  ripresa.value = null
  chiede.value = null
}

function vuoleIniziare(i) {
  if (!ripresa.value) return inizia(i)
  chiede.value = { nome: i < 0 ? VOLO.nome : fila[i].T.nome, i }
}
function comincia() {
  const { i } = chiede.value
  inizia(i)
}

// quello che la sosta aveva e `inizia` non azzera: i numeri di prima
function rimettiPartita(d) {
  Object.assign(hud, d.hud)
  chieste = d.chieste
  magazzino.value = d.magazzino
  borsellino = borsa(CHIAVE, d.monete); mostrate = d.monete.mostrate
  Object.assign(tasca, d.tasca)
  ultimoGettone = d.ultimoGettone
  // la nave madre torna coi pezzi che le mancavano
  const m = d.madre
  Object.assign(madre, { attiva: m.attiva, chiamata: m.chiamata, attesa: m.attesa, colpi: m.colpi,
                         sx: m.colpi < 1, dx: m.colpi < 2, cupola: m.colpi < 2, paura: m.colpi >= 2,
                         entra: 1 })
  nave.lv = stazzaDi(hud.livello)          // la nave di adesso, senza il cartello del livello
  sincronizzaNave()
}

// se il salvataggio non si legge più la carta sparisce e resta la mappa
function riprendiPartita() {
  const dato = leggi(sosta(CHIAVE), contestoSosta())
  if (!dato) return scorda()
  inizia(dato.posizione, dato)
  ripresa.value = null
  chiede.value = null
  metti({ auto: true })              // il cielo ripreso nasce fermo: riparte al tocco
}

function esci() { salva({ subito: true }) }

// su un telefono l'app non si chiude, sparisce: è l'ultimo momento per scrivere
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true })
}

// il «da ripassare»: il calcolo se è un fatto, il nome della strategia se
// è un concetto — «68+75» non direbbe niente, «somme col riporto» sì
function etichettaDi(k) {
  if (!eFatto(k) && k.startsWith('calc:'))
    return (CONCETTI_PER_ID[concettoDiChiave(k)] || {}).nome || k
  if (k.startsWith('calc:')) return esercizioDaChiave(k, state.profile.items).testo.replace(' = ?', '')
  const [a, b] = daChiave(k)
  return `${a} × ${b}`
}

function riassunto() {
  finale.punti = hud.punti; finale.giuste = hud.giuste; finale.mirate = hud.mirate
  monete.prese = borsellino.dato; monete.nota = borsellino.nota()
  finale.livello = hud.livello
  finale.record = segnaBest('math', hud.punti)
  const dove = !campagna.value ? chiaviDelVolo() : mente.value ? poolMente() : chiaviPossibili()
  // letto e non creato: `item()` scriverebbe in archivio un elemento
  // vuoto per ogni casella mai chiesta, grandi comprese
  finale.ripasso = dove
    .map(k => ({ k, it: state.profile.items[k] }))
    .filter(x => x.it && x.it.err > 0)
    .sort((x, y) => (y.it.err - y.it.ok) - (x.it.err - x.it.ok))
    .slice(0, 3)
    .map(x => ({ che: etichettaDi(x.k), err: x.it.err }))
}

function tappaSuperata({ scappata = false } = {}) {
  asteroidi = []
  madre.attiva = false
  finale.scappata = scappata
  scorda({ registra: false })
  const v = voce.value
  const ultima = !!v && v.pos === fila.length - 1
  // niente premio di tappa: ogni asteroide si è già pagato cadendo
  if (v) asteroidiCompleta(v)
  riassunto()
  fase.value = ultima ? 'trionfo' : 'vinta'
  anello(W / 2, suolo * 0.55, '#ffd94a', Math.max(W, H))
  suono.livello()
}

/* «avanti» segue la fila: dopo il pianeta del 10 tocca a una stazione,
   ed è tutto il motivo per cui le due liste sono state fuse. Dove la
   fila finisce si resta dove si è. */
function prossimaTappa() {
  if (dopo.value) return iniziaVoce(dopo.value)
  inizia(Math.min(fila.length - 1, posizione.value + 1))
}

function finePartita() {
  fase.value = 'fine'
  asteroidi = []
  scorda({ registra: false })      // il record è questo qui sotto, non quello della sosta
  suono.fine()
  // il record del volo: va scritto PRIMA di `riassunto()`, che riscrive
  // `best.math` — letto dopo, ogni prima partita sarebbe un pareggio con sé
  // stessa (vedi docs/asteroidi/volo.md e docs/core/primati.md)
  if (!campagna.value)
    finale.primato = segnaPrimato('mate', hud.punti, Date.now(),
                                  { livello: hud.livello, centri: hud.giuste, serie: hud.serieMax })
  riassunto()
}

/* tornando alla mappa ci si rimette su **dove è arrivata la fila**: il
   posto è uno solo, e il mestiere lo dice la voce che ci sta sopra */
function allaMappa() {
  esci()
  /* si esce anche da sotto il velo (il tocco riprende, il tasto indietro
     no): un freno lasciato acceso qui si ritroverebbe alla partita dopo */
  togli()
  fase.value = 'mappa'
  asteroidi = []
  dritta.value = ''
  ripresa.value = laRipresa()
  giroHangar.value++
  suFrontiera()
}

const suFrontiera = () => { posizione.value = Math.min(fila.length - 1, dove.value) }

// "Cosa so" si apre da due posti: il tasto della barra torna a quello da
// cui si è arrivati (mappa o fine partita), non sempre alla mappa
const tornaDa = ref('mappa')

const hangarAperto = ref(false)
function chiudiHangar() { hangarAperto.value = false; giroHangar.value++ }
// la tavola ha due facce (tabellina/strategie) e si apre su quella del
// mestiere da cui si arriva
const tavolaSu = ref('tabelline')
function apriTavola() {
  tornaDa.value = fase.value
  tavolaSu.value = mente.value ? 'mente' : 'tabelline'
  fase.value = 'tavola'
}

const quota = (n, tot) => Math.min(100, Math.round((n / tot) * 100)) + '%'
const finoA = (n, max) => Math.min(n, max)

onMounted(() => {
  suFrontiera()
  // aggancio per i test automatici: permette di colpire l'asteroide giusto
  // senza dover indovinare dove il numero e' disegnato sul canvas
  window.__mate = { hud, domanda, colpisci, inizia, CAMPAGNA, STAZIONI, tappa, ripresa, salva,
                    asteroidi: () => asteroidi, fase, finale, progresso, nave,
                    // dove si è nella fila, e che mestiere è quel posto lì
                    // (nel volo, il magazzino della domanda in corso)
                    posizione, voce, mente, magazzino,
                    // -1 è il volo infinito, uno solo
                    iniziaVolo, recordVolo,
                    // le monete: quelle di questa partita, e il salvadanaio
                    monete, salvadanaio: () => state.profile.coins,
                    // quanto ha già incassato la partita in corso (la sosta lo rimette)
                    incassato: () => borsellino.dato,
                    // la fila mescolata, il contatore unico (quante voci
                    // sono superate) e cosa viene dopo dentro la fila
                    fila, dopo, contatore, dove,
                    // la nave madre, il pacco del volo e l'hangar (docs/asteroidi/boss.md)
                    madre: () => ({ ...madre }), regaloVolo, hangar: hangarLetto,
                    dado: f => { dado = f },
                    // i gettoni: quanti ce n'è e cosa fanno se li premi.
                    // `gelo` è una funzione perché i secondi che restano
                    // vivono fuori da Vue (cambiano a ogni fotogramma)
                    tasca, usaGelo, usaMirino, gelo: () => gelo }
  ctx = tela.value.getContext('2d')
  ridimensiona()
  window.addEventListener('resize', ridimensiona)
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
  raf = requestAnimationFrame(ciclo)
})
// prima che la tela se ne vada: dopo, la partita non c'è più
onBeforeUnmount(() => {
  salva({ subito: true })
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', ridimensiona)
})
</script>

<template>
  <div class="schermo spazio">
    <canvas ref="tela" @pointerdown="tocca"></canvas>

    <!-- la fascia in cima dice solo le due cose che la nave non può dire
         (docs/asteroidi/volo.md): quanto manca alla tappa, e sulla nuova -->
    <Barra v-if="fase === 'gioco'" :titolo="campagna ? '' : VOLO.nome"
           guida="mate" scura pausa @pausa="metti()" @aiuto="aiuto" @indietro="allaMappa">
      <div v-if="campagna" class="avanza">
        <i :style="{ width: quota(hud.giuste, tappa.bersaglio) }"></i>
        <span>{{ tappa.emoji }} {{ hud.giuste }}/{{ tappa.bersaglio }}</span>
      </div>
      <!-- i centri «mirati»: sulla cosa che la tappa insegna; un gettone, non una seconda barra -->
      <div v-if="campagna && tappa.mirate" class="gettone mira"
           :class="{ fatto: hud.mirate >= tappa.mirate }">
        {{ mente ? '🧠' : '×' + tappa.nuova }}
        {{ finoA(hud.mirate, tappa.mirate) }}/{{ tappa.mirate }}
      </div>
      <!-- nel volo infinito non c'è nessun bersaglio: lì l'unico riscontro
           sono i punti, e senza non resterebbe niente -->
      <div v-if="!campagna" class="gettone">{{ hud.punti }} p</div>
      <!-- il filotto si vede da cinque in su, che è dove comincia a
           valere qualcosa: sotto è rumore che ruba larghezza alla barra -->
      <div v-if="hud.serie >= 5" class="gettone serie">🔥{{ hud.serie }}</div>
    </Barra>

    <!-- il cielo gelato: un alone azzurro tutto attorno. Serve a dire che
         il rallentamento è una cosa che hai *fatto tu*, non il gioco che
         si è impuntato -->
    <div v-if="fase === 'gioco' && gelato" class="brina"></div>

    <!-- la tasca: un gettone compare solo quando ce l'hai -->
    <div v-if="fase === 'gioco' && (tasca.gelo || tasca.mirino)" class="tasca">
      <button v-if="tasca.gelo" class="tocco gelo" :class="{ speso: gelato }"
              :aria-label="'gelo'" @click="usaGelo">
        <span>❄️</span><i v-if="tasca.gelo > 1">{{ tasca.gelo }}</i>
      </button>
      <button v-if="tasca.mirino" class="tocco mirino" :aria-label="'mirino'" @click="usaMirino">
        <span>🎯</span><i v-if="tasca.mirino > 1">{{ tasca.mirino }}</i>
      </button>
    </div>

    <!-- il trucco: esce alla seconda volta che lo stesso concetto va storto.
         Si stringe quando in tasca c'è qualcosa, se no ci finisce sotto -->
    <div v-if="fase === 'gioco' && dritta" class="trucco"
         :class="{ stretto: tasca.gelo || tasca.mirino }">💡 {{ dritta }}</div>

    <div v-if="fase === 'gioco'" class="domanda">
      <b :class="{ lunga: domanda.testo.length > 13 }">{{ domanda.testo }}</b>
    </div>

    <!-- per provare i giochi: la leva di #admin, docs/core/comandi.md -->
    <div v-if="fase === 'gioco'" class="salta-mate"><TastoSalta @salta="salta" /></div>

    <!-- il pacco di una nave madre del volo: il cielo è fermo finché non si va avanti -->
    <div v-if="fase === 'gioco' && regaloVolo" class="velo" data-regalo-volo>
      <div class="dato">La nave madre è abbattuta!</div>
      <RegaloHangar :pezzo="regaloVolo" />
      <p class="dritta">Lo trovi nell'hangar, sulla mappa.</p>
      <button class="bottone" data-azione="avanti" @click="regaloVolo = null">Avanti ▶</button>
    </div>

    <div v-if="cartello.testo && !regaloVolo" :key="cartello.n" class="cartello" :style="{ color: cartello.colore }">
      {{ cartello.testo }}
    </div>

    <!-- ════════ la rotta: la mappa dello spazio, una tappa dopo l'altra (docs/asteroidi/mappa.md) ════════ -->
    <div v-if="fase === 'mappa'" class="schermo campagna spaziale">
      <Barra titolo="Asteroidi" guida="mate" monete scura @indietro="$emit('vai','home')">
        <!-- i due conti di «Cosa so»: scendono se non si ripassa, la fila non lo dice più -->
        <div class="gettone">✖️ <b>{{ intere.size }}/10</b></div>
        <div class="gettone">🧠 <b>{{ stelleMente }}/{{ STAZIONI.length }}</b></div>
      </Barra>
      <!-- la partita lasciata a metà (docs/asteroidi/sosta.md): ferma sopra la mappa -->
      <div v-if="ripresa" class="sopra-rotta">
        <Ripresa :ripresa="ripresa" :chiede="chiede ? chiede.nome : ''"
                 @riprendi="riprendiPartita" @scorda="scorda"
                 @comincia="comincia" @annulla="chiede = null" />
      </div>
      <RottaAsteroidi :voci="vociRotta" :capitoli="CAPITOLI" :volo="voloRotta" :arrivo="dove"
                      :chi="state.player || ''" :livrea="livreaMappa" @parti="partiDa">
        <!-- l'astronave e i gettoni: si guadagnano giocando, quindi va
             detto una volta che esistono. Altrimenti il primo ❄️ che
             compare in basso è un'icona che nessuno ha capito. -->
        <div class="hangar">
          <div class="titoletto">La tua astronave</div>
          <p>Le vite sono la nave: intatta, poi con un'<b>ala strappata</b> che
            fuma e la spia che lampeggia, poi in fiamme. Se cresce di livello diventa più
            grossa. A fine partita torna com'era.</p>
          <p>Ogni <b>cinque risposte giuste di fila</b> guadagni un gettone.
            Resta lì in basso finché non lo premi tu — anche per tutta la partita, se
            vuoi — e sbagliando non si perde.</p>
          <div v-for="(P, id) in POTENZIAMENTI" :key="id" class="potere">
            <span class="em">{{ P.emoji }}</span>
            <b>{{ P.nome }}</b>
            <i>{{ P.spiega }}</i>
          </div>
        </div>
      </RottaAsteroidi>
      <button class="cosa-so" data-azione="cosa-so" @click="apriTavola">📊 Cosa so</button>
      <!-- l'hangar: si apre col volo infinito (docs/asteroidi/hangar.md) -->
      <button v-if="progresso.libera" class="cosa-so al-hangar" data-azione="hangar" @click="hangarAperto = true">
        Hangar<i v-if="hangarMappa.nuovi.length" class="nuovi" data-nuovi>{{ hangarMappa.nuovi.length }}</i></button>
      <HangarAsteroidi v-if="hangarAperto" @chiudi="chiudiHangar" />
    </div>

    <!-- cosa so: una pagina di progressi, non un velo sopra la partita —
         stessa veste della mappa, e si esce dal tasto della barra -->
    <div v-if="fase === 'tavola'" class="schermo campagna">
      <Barra titolo="Cosa so" monete @indietro="fase = tornaDa">
        <div class="gettone">⭐ <b>{{ intere.size }}/10</b></div>
      </Barra>
      <div class="centro elenco">
        <!-- due facce: qui non si sceglie una tappa, si guarda cosa si sa -->
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

    <!-- tappa superata: un cartello solo, uguale per pianeta e stazione -->
    <div v-if="fase === 'vinta'" class="velo">
      <h1 class="chiaro">{{ tappa.emoji }} Tappa<br><span>superata!</span></h1>
      <div class="dato"><b>{{ tappa.nome }}</b></div>
      <div class="dato">{{ voce ? voce.n : 0 }} di {{ fila.length }}</div>
      <!-- il pacco della nave madre (docs/asteroidi/boss.md) -->
      <RegaloHangar v-if="finale.regalo" :pezzo="finale.regalo" />
      <p v-else-if="finale.scappata" class="dritta" data-madre-scappata>La nave madre è scappata:
        il suo pacco ti aspetta qui, la prossima volta.</p>
      <p v-else class="dritta" data-pacchi-finiti>Qui i regali sono finiti: i prossimi stanno più avanti.</p>
      <div class="dato">Centri: <span>{{ finale.giuste }}</span></div>
      <div class="dato" data-monete-prese>Monete: <span>+{{ monete.prese }} 🪙</span></div>
      <div v-if="monete.nota" class="dato nota" data-nota-monete>{{ monete.nota }}</div>
      <!-- «adesso tocca a» segue la fila, non la campagna -->
      <p v-if="dopo" class="dritta">Ora tocca a
        {{ dopo.T.emoji }} {{ dopo.T.nome }}. {{ dopo.T.dritta }}</p>
      <div class="riga">
        <button v-if="dopo" class="bottone" @click="prossimaTappa">
          {{ dopo.T.emoji }} {{ dopo.T.nome }} ▶</button>
        <button class="bottone chiaro" @click="allaMappa">Mappa</button>
      </div>
    </div>

    <!-- la fila finita: è una sola, quindi il cartello è uno solo -->
    <div v-if="fase === 'trionfo'" class="velo">
      <h1 class="chiaro">🎉 Scaletta<br><span>finita!</span></h1>
      <p class="testo chiaro">Tutte e {{ fila.length }} le tappe sono superate: i
        {{ CAMPAGNA.length }} pianeti e le {{ STAZIONI.length }} stazioni.
        In quest'ultima: <b>+{{ monete.prese }} 🪙</b>. Si apre il <b>volo infinito</b>, dove i calcoli
        diventano sempre più tosti e non ce n'è un ultimo.</p>
      <div class="dato">✖️ Tabelline imparate: <span>{{ intere.size }}/10</span></div>
      <div class="dato">🧠 Trucchi in mano:
        <span>{{ stelleMente }}/{{ STAZIONI.length }}</span></div>
      <div class="riga">
        <button class="bottone" @click="iniziaVolo()">{{ VOLO.nome }} ♾️</button>
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
      <div v-if="monete.prese" class="dato" data-monete-prese>Monete: <span>+{{ monete.prese }} 🪙</span></div>
      <div v-if="monete.nota" class="dato nota" data-nota-monete>{{ monete.nota }}</div>
      <!-- nel volo il record dice il numero di adesso e la misura (docs/core/primati.md) -->
      <div v-if="finale.primato" class="dato" data-primato>
        {{ finale.primato.record ? '🏆 ' : '' }}{{ fraseDiFine(finale.primato, SFIDA_VOLO.misura) }}</div>
      <div v-else class="dato">{{ finale.record ? '🏆 Nuovo record: ' + finale.punti
                                                : 'Record: ' + (state.profile.best.math || 0) }}</div>
      <Festa v-if="finale.primato && finale.primato.record" />
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

    <!-- `fase === 'gioco'` non è ridondante: senza, due veli si sovrapporrebbero -->
    <VeloPausa v-if="inPausa && fase === 'gioco'" :dove="dovEravamo" @riprendi="togli" @esci="allaMappa" />
  </div>
</template>

<style scoped>
.spazio { background:#05081a; color:#fff }
canvas { position:absolute; inset:0; touch-action:manipulation }
.tondo.scuro { pointer-events:auto; background:#ffffff18; color:#fff; box-shadow:none }

/* ---- l'avanzamento della tappa, dentro la fascia ----
   Prende tutto lo spazio che avanza fra il tasto indietro e i gettoni:
   è l'unica cosa lì dentro che sta meglio larga, perché il colpo
   d'occhio è «quanto ne manca», non il numero. */
.avanza { position:relative; flex:1; min-width:70px; height:20px; border-radius:999px;
          background:#ffffff1a; overflow:hidden; box-shadow:inset 0 0 0 1px #ffffff22 }
.avanza i { display:block; height:100%; border-radius:999px; transition:width .35s;
            background:linear-gradient(90deg,#2f7bff,#7fe3ff) }
.avanza span { position:absolute; inset:0; display:flex; align-items:center;
               justify-content:center; font-size:12px; font-weight:900; letter-spacing:.4px;
               color:#fff; text-shadow:0 1px 3px #000c }
/* i centri mirati: gialli come la tabellina nuova, verdi quando è fatta */
.gettone.mira { background:#ffd94a2b !important; color:#ffe9a3 !important;
                box-shadow:0 0 0 1.5px #ffd94a66; white-space:nowrap }
.gettone.mira.fatto { background:#8cff9d2b !important; color:#c9ffd4 !important;
                      box-shadow:0 0 0 1.5px #8cff9d66 }
.gettone.serie { background:#ff9d1c2b !important; color:#ffd8a3 !important }

/* ---- la tasca: i gettoni guadagnati, in basso a destra ----
   Tondi grossi (il pollice, non il puntatore) e con l'ombra sotto come
   tutti i bottoni veri del gioco. Il numerino compare solo dal secondo
   in poi: «❄️ 1» si legge come una cosa da capire, «❄️» come una cosa
   da premere. */
.tasca { position:absolute; right:10px; bottom:calc(17vh + 12px); z-index:6;
         display:flex; flex-direction:column; gap:9px }
.tocco { position:relative; width:60px; height:60px; border:0; border-radius:50%;
         display:flex; align-items:center; justify-content:center;
         font-size:29px; line-height:1; background:#141c2ae8; color:#fff;
         animation:arriva-gettone .4s cubic-bezier(.2,1.4,.4,1) }
.tocco:active { transform:translateY(3px); box-shadow:none !important }
.tocco i { position:absolute; right:-2px; bottom:-2px; width:23px; height:23px;
           border-radius:50%; display:flex; align-items:center; justify-content:center;
           font-style:normal; font-size:13px; font-weight:900; color:#0b1130;
           background:#fff; box-shadow:0 2px 5px #0009 }
.tocco.gelo { box-shadow:0 4px 0 #26506b, 0 0 0 2px #9fd8ff88, 0 0 22px #9fd8ff44 }
.tocco.mirino { box-shadow:0 4px 0 #2b5a33, 0 0 0 2px #8cff9d88, 0 0 22px #8cff9d44 }
/* il gelo già acceso non si può ripremere: si spegne invece di far finta */
.tocco.gelo.speso { opacity:.4; box-shadow:0 4px 0 #26506b }
@keyframes arriva-gettone { from { opacity:0; transform:scale(.3) translateY(30px) } }

/* la brina attorno allo schermo, mentre il gelo è acceso */
.brina { position:absolute; inset:0; pointer-events:none; z-index:3;
         box-shadow:inset 0 0 clamp(50px,17vw,130px) #9fd8ff5c,
                    inset 0 0 0 4px #bfe8ff99;
         animation:respira-brina 2.6s ease-in-out infinite }
@keyframes respira-brina { 50% { opacity:.55 } }

.domanda { position:absolute; left:0; right:0; bottom:0; height:17vh; min-height:96px;
           display:flex; align-items:center; justify-content:center; pointer-events:none;
           background:linear-gradient(0deg,#0b1130,#0b113000) }
.domanda b { font-size:clamp(34px,11vw,68px); font-weight:900; letter-spacing:2px;
             text-shadow:0 0 22px #4aa3ff88, 0 4px 0 #0008; padding:0 12px;
             text-align:center; line-height:1.05 }
/* «in 149 quante volte c'è 7?» non ci sta nel corpo delle tabelline */
.salta-mate { position:absolute; right:10px; bottom:calc(max(17vh, 96px) + 6px); z-index:5 }
.domanda b.lunga { font-size:clamp(20px,5.6vw,36px); letter-spacing:0 }
.domanda i { font-style:normal; color:#7fe3ff }

/* il trucco che compare quando lo stesso concetto va storto due volte:
   sta sopra la domanda, dove l'occhio è già, e se ne va da solo */
.trucco { position:absolute; left:12px; right:12px; bottom:calc(17vh + 10px);
          padding:9px 13px; border-radius:14px; background:#0b1130e8;
          border:1px solid #7fe3ff55; color:#dbe7ff; font-size:14px; font-weight:700;
          line-height:1.4; text-align:center; pointer-events:none; z-index:4;
          animation:apparire-trucco .35s ease }
.trucco.stretto { right:80px }
@keyframes apparire-trucco { from { opacity:0; transform:translateY(8px) } }

.cartello { position:absolute; left:0; right:0; top:38%; text-align:center; pointer-events:none;
            font-size:clamp(26px,7.5vw,54px); font-weight:900; white-space:pre-line;
            text-shadow:0 0 24px currentColor, 0 4px 10px #000c;
            animation:apparire 1.5s cubic-bezier(.2,1.2,.3,1) forwards }
@keyframes apparire { 0%{opacity:0;transform:scale(.4)} 18%{opacity:1;transform:scale(1.12)}
                      30%{transform:scale(1)} 75%{opacity:1}
                      100%{opacity:0;transform:scale(1.15) translateY(-24px)} }

.velo { position:absolute; inset:0; background:#05081aee; display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:16px; padding:22px; text-align:center }
.chiaro { color:#fff }
h1.chiaro span { color:#7fe3ff }
.dato { font-size:clamp(17px,4.6vw,24px); font-weight:800 }
.dato span { color:#ffd94a }
.dato.nota { font-size:14px; font-weight:600; opacity:.85; max-width:92%; text-align:center }
.dritta { font-size:14px; font-weight:700; color:#cbd5ff; max-width:34ch; line-height:1.45 }
.ripasso { font-size:16px; font-weight:800; opacity:.9 }
.ripasso .tit { font-size:12px; letter-spacing:2px; text-transform:uppercase; opacity:.6; margin-bottom:4px }
.ripasso i { font-style:normal; color:#ef5f5f }

/* le pagine sopra il canvas: «Cosa so» parla la lingua del resto del gioco */
.campagna { background:linear-gradient(180deg,#fff4e6,#ffe6ef 55%,#e9e4ff); color:var(--testo);
            z-index:5 }
.campagna .elenco { justify-content:flex-start; gap:12px; padding-bottom:26px }
/* la rotta invece è lo spazio: fondo scuro piatto, come la tela che dipinge */
.campagna.spaziale { background:#0b1029; color:#e6ebff }
.sopra-rotta { flex:none; display:flex; justify-content:center; padding:8px 16px 4px }

/* «Cosa so» resta a portata di dito, sopra la mappa che scorre */
.cosa-so { position:absolute; right:14px; bottom:calc(14px + env(safe-area-inset-bottom)); z-index:6;
           padding:10px 16px; border-radius:999px; border:1px solid #ffffff2e;
           background:#1d2550; color:#e6ebff; font-size:15px; font-weight:600 }
.cosa-so:active { transform:translateY(2px) }
.al-hangar { right:auto; left:14px; position:absolute }
.al-hangar .nuovi { font-style:normal; margin-left:6px; padding:0 6px; border-radius:999px;
                    background:#ff6b6b; color:#fff; font-size:12px; font-weight:800 }

/* l'hangar, in fondo alla rotta: non è un negozio, spiega cosa può capitare alla nave */
.hangar { width:calc(100% - 32px); max-width:420px; margin:6px auto 0; display:flex;
          flex-direction:column; gap:8px; text-align:left }
.hangar .titoletto { font-size:11.5px; font-weight:600; letter-spacing:2px; text-transform:uppercase;
                     color:#8fa0d8 }
.hangar p { margin:0; font-size:14px; line-height:1.45; color:#aab6dc }
.hangar p b { color:#e6ebff; font-weight:600 }
.potere { display:grid; grid-template-columns:auto 1fr; grid-template-rows:auto auto;
          gap:0 11px; align-items:center; text-align:left; padding:9px 13px;
          border-radius:14px; background:#ffffff0f; border:1px solid #ffffff1a }
.potere .em { grid-row:1/3; font-size:24px }
.potere b { font-size:14px; font-weight:600; color:#e6ebff }
.potere i { font-style:normal; font-size:12.5px; color:#aab6dc; line-height:1.35 }

/* le due facce di "Cosa so": i fatti in tavola, le strategie in elenco */
.schede { display:flex; gap:8px; width:100%; max-width:420px }
.schede button { flex:1; padding:9px 6px; border:0; border-radius:14px; background:#ffffffb0;
                 font-size:14px; font-weight:800; color:var(--tenue);
                 box-shadow:0 3px 0 #e9ddf5 }
.schede button.on { background:var(--carta); color:var(--viola-scuro);
                    box-shadow:0 3px 0 #c9d8f5, 0 0 0 2px var(--viola) }

</style>
