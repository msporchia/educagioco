<script setup>
// Il coordinatore dell'inglese a mondi: l'unico file del gioco che sa di
// monete, contatori e profilo. Regole in `motore/`, tabelle in `dati/`, la
// mappa in `scena/`, le schermate in `viste/`. Il progetto e l'interfaccia
// col motore: docs/lingue/mondi.md.
import { ref, shallowRef, computed, reactive, watch, onMounted, onBeforeUnmount, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { state, item, answer, segna, persist, flushNow, engProgresso, tuttoAperto, etaDelBambino }
  from '../../store/profile.js'
import { strength, newItem } from '../../store/srs.js'
import { incassa, premioDetto } from '../../store/varieta.js'
import { pronuncia, haVoce, prepara, zittisci } from '../../voce.js'
import { troppoDiFretta, attesaDellEsito, PONDERA } from '../../quiz/nucleo/domanda.js'
import { pesoDellaFretta } from '../../quiz/fretta.js'
import { progresso, sosta, salvaSosta, buttaSosta } from '../campagne.js'
import Ripresa from '../Ripresa.vue'
import LinguaGame from '../../views/LinguaGame.vue'

import { CHIAVE, mondoDi, tappaDi } from './dati/mondi.js'
import { CAPITOLI } from './dati/capitoli.js'
import { pagaDi, pagaDelCapitolo } from './dati/monete.js'
import { statoMappa, segnaVinta, tappaAperta, cassettoAperto, vinta } from './motore/mappa.js'
import { travasa } from './motore/travaso.js'
import { Sessione } from './motore/sessione.js'
import { Tocchi, domandeCheLPagano, domandaDelTocco } from './motore/tocchi.js'
import { cassettoDi, mondoDellaTappa } from './motore/grafo.js'
import { gradoTappa } from './motore/grado.js'
import { capitoliDi, racconta, eGiusta } from './motore/libro.js'
import { storieAperte, prossimaStoria, unAltraStoria, segnaLetta, cosaServeAlLibro, tiraLaStoria, segnaPuntata,
         puntataDopo } from './motore/storie.js'
import { traduci } from './motore/lessico.js'
import { scrivi as scriviSosta, leggi as leggiSosta, dice as diceSosta } from './motore/sosta.js'
import * as F from './motore/fila.js'

import Mappa from './viste/Mappa.vue'
import Domanda from './viste/Domanda.vue'
import Pagina from './viste/Pagina.vue'
import Libro from './viste/Libro.vue'
import Fine from './viste/Fine.vue'
import Bolla from './viste/Bolla.vue'
import { usaOrologio } from './viste/orologio.js'
import './stile.css'

defineOptions({ name: 'IngleseAMondi' })
defineProps({ lingua: { type: String, default: 'en' } })   // App.vue la passa a tutte le lingue
const emit = defineEmits(['vai'])

const vista = ref('mappa')          // mappa | tappa | libro | prima
const c = progresso(CHIAVE)
// chi aveva vinto tappe dei mondi di prima le ritrova (motore/travaso.js)
if (travasa(c)) persist()
// i lucchetti tolti dai grandi: l'età non apre mondi, si fanno tutti in fila
const regole = () => ({ tutto: tuttoAperto() })
const orologio = usaOrologio()
const { attesa, giro } = orologio

// la forza di una voce senza crearla: la mappa legge centinaia di chiavi mai viste
const leggi = k => state.profile.items[k] || newItem()
const forzaDi = k => strength(leggi(k), Date.now())

/* ═══════════ la mappa ═══════════ */
const ridisegna = ref(0)
const stato = computed(() => { void ridisegna.value; return statoMappa(c, forzaDi, regole()) })
const extra = computed(() => {
  void ridisegna.value
  const out = {}
  for (const m of stato.value) {
    if (!m.pronto) continue
    // il libro si apre con la prima storia del mondo che si può leggere (motore/storie.js)
    out[m.id] = {
      libro: capitoliDi(CAPITOLI, m.id).length
        ? { aperto: storieAperte(CAPITOLI, c, regole(), m.id).length > 0, serve: cosaServeAlLibro(CAPITOLI, m.id) }
        : null,
      cassetto: m.cassetto && m.cassetto.chiavi ? { aperto: m.cassetto.aperto } : null,
    }
  }
  return out
})
// il gioco libero di prima resta a chi aveva finito la campagna vecchia (docs/lingue/mondi.md)
const diPrima = computed(() => !!engProgresso().libera)

/* ═══════════ la tappa lasciata a metà ═══════════ */
const ripresa = ref(diceSosta(sosta(CHIAVE)))
const chiede = ref(null)             // { nome, avvia }: la tappa che butterebbe quella a metà
const cartaRipresa = computed(() => {
  const r = ripresa.value
  return r && { emoji: '🇬🇧', nome: r.nome,
                dettaglio: `${r.mondo ? r.mondo + ' · ' : ''}✅ ${r.giuste} di ${r.bersaglio}` }
})

function salva({ subito = false } = {}) {
  if (vista.value !== 'tappa' || !sessione || !tappa.value) return
  if (sessione.finita) vinci()       // uscire dopo l'ultima giusta: la tappa è vinta
  const dato = finePronta || fine.value ? null : scriviSosta({
    tappa: tappa.value, sessione, conti, domanda: esito.value ? null : d.value,
    pagina: pagina.value || inArrivo, fila: fila.value, tocchi, pagaQui: pagaQui.value,
    visto: d.value && !esito.value ? orologio.guardata() : 0,
  })
  if (!dato && !sosta(CHIAVE)) return
  salvaSosta(CHIAVE, dato, { subito })
}

function scorda() {
  buttaSosta(CHIAVE)
  ripresa.value = null
}

// «Torno da dove ero»; se il salvataggio non torna, la carta sparisce e la mappa resta
function riprendiPartita() {
  const dato = sosta(CHIAVE)
  const r = dato && leggiSosta(dato,
    { itemDi: leggi, haVoce: haVoceOra, eta: etaDelBambino(), partenza: tuttoAperto() ? 2 : 0 },
    { siGioca: t => (t.cassetto ? cassettoAperto(c, t.mondo, regole()) : tappaAperta(c, t.id, regole())) })
  if (!r) return scorda()
  sessione = r.sessione
  tappa.value = r.tappa
  Object.assign(conti, r.conti)
  fine.value = null
  finePronta = null
  inArrivo = null
  ripresa.value = null
  vista.value = 'tappa'
  if (r.tappa.parole) prepara(r.tappa.parole, 'en')
  if (r.pagina) mostraPagina(r.pagina)
  else if (r.aperta) mostra(r.aperta, r)
  else prossima()
}

// una tappa nuova con una a metà in sospeso chiede prima, e non la butta in silenzio
const vuole = (nome, avvia) => { if (ripresa.value) chiede.value = { nome, avvia }; else avvia() }
function cominciaComunque() {
  const f = chiede.value && chiede.value.avvia
  chiede.value = null
  scorda()
  if (f) f()
}

function allaMappa() {
  orologio.ferma()
  zittisci()
  bolla.value = null
  fine.value = null
  sessione = null
  d.value = null
  pagina.value = null
  libro.value = null
  finePronta = null
  inArrivo = null
  ripresa.value = diceSosta(sosta(CHIAVE))
  ridisegna.value++
  vista.value = 'mappa'
}

// uscire a metà non butta via la tappa: si scrive dove si era (motore/sosta.js)
// e la mappa la offre in cima. Vedi docs/lingue/sosta.md
function indietro() {
  if (vista.value === 'mappa') return emit('vai', 'home')
  salva({ subito: true })
  allaMappa()
}

/* ═══════════ una tappa (o il cassetto) ═══════════ */
let sessione = null
let tocchi = null
const tappa = shallowRef(null)
const d = shallowRef(null)
const pagina = shallowRef(null)      // la pagina di un concetto, al posto della domanda (motore/concetti.js)
const fila = ref([])
const esito = ref(null)
const pagaQui = ref(true)
const conti = reactive({ giuste: 0, errori: 0, monete: 0, chieste: 0, gradoPrima: null, bersaglio: 1 })
const fine = ref(null)
let prossimaId = null
let finePronta = null                // il cartello di una tappa già vinta, che aspetta l'esito
let inArrivo = null                  // la pagina del concetto che segue uno sbaglio, finché non compare
let altraStoria = null               // la storia di «Un'altra storia», dal cartello di fine
let puntataOfferta = null            // «Puntata 2 →», dal cartello di fine di una puntata

const haVoceOra = p => suono.acceso.value && haVoce(p, 'en')

function avvia(t) {
  tappa.value = t
  // chi ha tutto aperto non riparte dal «cosa vuol dire»
  const partenza = tuttoAperto() ? 2 : 0
  // i concetti si presentano la prima volta; rigiocando, la pagina torna solo con gli sbagli
  const presenta = !t.cassetto && !!t.frasi && !vinta(c, t.id)
  sessione = new Sessione({ tappa: t, itemDi: leggi, haVoce: haVoceOra, eta: etaDelBambino(), partenza, presenta })
  Object.assign(conti, { giuste: 0, errori: 0, monete: 0, chieste: 0, bersaglio: sessione.bersaglio,
                         gradoPrima: t.cassetto ? null : sessione.gradoIniziale })
  fine.value = null
  finePronta = null
  inArrivo = null
  vista.value = 'tappa'
  if (t.parole) prepara(t.parole, 'en')
  prossima()
}
const giocaTappa = id => avvia(tappaDi(id))
const giocaCassetto = m => avvia(cassettoDi(m))

function prossima() {
  const q = sessione && sessione.prossima()
  if (!q) return chiudiTappa()
  mostra(q)
}

// `ripreso`: la domanda tornata da una sosta, con la fila, le parole già
// toccate e il tempo già guardato; riparte com'era, senza rileggersi ad alta voce
function mostra(q, ripreso = null) {
  if (q.genere === 'pagina') return mostraPagina(q)
  pagina.value = null
  inArrivo = null
  d.value = q
  fila.value = ripreso ? ripreso.fila : F.filaVuota(q)
  esito.value = null
  tocchi = new Tocchi({ itemDi: item })
  if (ripreso) tocchi.toccate = new Map(ripreso.toccate)
  pagaQui.value = ripreso ? ripreso.pagaQui : true
  bolla.value = null
  orologio.riparti(ripreso ? ripreso.visto : 0)
  if (!ripreso && q.genere === 'parola' && q.domanda.ascolta) setTimeout(() => pronuncia(q.domanda.ascolta, 'en'), 260)
  salva()
}

// la pagina non ha attesa: resta finché non tocca «Ho capito» (la finestra cieca sì)
function mostraPagina(p) {
  d.value = null
  esito.value = null
  tocchi = null
  bolla.value = null
  inArrivo = null
  pagina.value = p
  orologio.riparti()
  salva()
}
function capito() {
  if (!pagina.value || !orologio.pronta.value) return
  pagina.value = null
  if (sessione && sessione.finita) chiudiTappa()
  else prossima()
}

const caselle = computed(() => (d.value && d.value.tessere ? F.caselle(d.value, fila.value) : null))
const banco = computed(() => (d.value && d.value.tessere
  ? F.nelBanco(d.value, fila.value).map(t => ({ ...t, posto: F.postoDi(d.value, t.id) })) : null))
const pronto = computed(() => !!(d.value && d.value.tessere && F.pronta(d.value, fila.value)))
const parla = computed(() => {
  const q = d.value
  return !!(q && q.genere === 'parola' && q.domanda.testo && !q.domanda.italiano && haVoceOra(q.domanda.testo))
})

function metti(id) {
  if (esito.value || !orologio.pronta.value) return
  fila.value = F.metti(d.value, fila.value, id)
}
function togli(id) {
  if (esito.value) return
  fila.value = F.togli(d.value, fila.value, id)
}

const CONTATORE = { 'en:': 'en', 'verbo:': 'verbi', 'frase:': 'frasi' }
const contatoreDi = k => CONTATORE[Object.keys(CONTATORE).find(p => k.startsWith(p))] || null

function rispondi(risposta, scelta) {
  if (esito.value || !orologio.pronta.value || !sessione) return
  const q = d.value
  const tempo = orologio.guardata()
  const e = sessione.rispondi(q, risposta, { tocchi })
  for (const r of e.registra) answer(r.chiave, { correct: r.correct, ms: r.chiave === q.chiave ? tempo * 1000 : 0 })
  if (e.giusta) {
    conti.giuste++
    const k = contatoreDi(q.chiave)
    if (k) segna(k)
    suono.ok()
  } else {
    conti.errori++
    suono.no()
  }
  if (e.paga) {
    const pagato = incassa(pagaDi(q))
    conti.monete += pagato.dato
    conti.chieste += pagato.chiesto
  }
  // la fretta si misura su quello che c'era da leggere: la consegna e le risposte (o le tessere)
  const daLeggere = { testo: q.domanda.testo || '',
                      risposte: (q.opzioni || q.tessere || []).map(o => ({ testo: o.testo })) }
  const diFretta = troppoDiFretta(daLeggere, { giusto: e.giusta, tempo })
  const penale = pesoDellaFretta(diFretta, e.giusta)
  const giustaEra = !e.giusta && q.tessere ? e.giustaEra : null
  esito.value = {
    giusta: e.giusta, scelta, diFretta, giustaEra,
    perche: e.perche || '', siFa: e.giusta ? '' : (e.siFa || ''),
    sbagliate: !e.giusta && q.tessere ? F.sbagliate(q, fila.value) : [],
  }
  const quanto = e.giusta ? 900
    : attesaDellEsito({ righe: ['Non così.', e.perche, e.siFa, giustaEra ? 'Si dice: ' + giustaEra : ''],
                        pavimento: PONDERA, penale: penale.attesa })
  // la risposta è data e pagata: uscire adesso non la rifà (la domanda non è più aperta)
  inArrivo = e.pagina || null
  if (sessione.finita) vinci()
  salva()
  // dopo troppi sbagli sullo stesso concetto, al posto dell'attesa torna la sua pagina
  if (e.pagina) return orologio.aspetta(1200, () => mostraPagina(e.pagina))
  orologio.aspetta(quanto, () => (sessione && sessione.finita ? chiudiTappa() : prossima()))
}

// La tappa vinta si registra appena data l'ultima risposta; il cartello
// compare dopo l'esito (chiudiTappa). Così uscire in mezzo non perde la vittoria.
function vinci() {
  if (finePronta || fine.value || !tappa.value) return
  const t = tappa.value
  let primaVolta = false
  if (!t.cassetto) {
    primaVolta = segnaVinta(c, t.id)
    persist()
    flushNow()      // una tappa si vince di rado: non deve perdersi
    // niente premio d'arrivo: ogni risposta giusta si è già pagata (docs/lingue/mondi-vista.md)
  }
  const m = t.cassetto ? null : mondoDellaTappa(t.id)
  const dopo = m ? m.tappe[m.tappe.findIndex(x => x.id === t.id) + 1] : null
  const avanti = dopo && !vinta(c, dopo.id) && tappaAperta(c, dopo.id, regole()) ? dopo : null
  finePronta = {
    titolo: t.cassetto ? 'Il cassetto è in ordine'
      : primaVolta ? (t.bandiera ? 'Il mondo è tuo!' : 'Tappa vinta!') : 'Tappa ripassata',
    sotto: t.cassetto ? mondoDi(t.mondo).nome : t.nome,
    prima: conti.gradoPrima,
    dopo: t.cassetto ? null : gradoTappa(t, forzaDi),
    giuste: conti.giuste, errori: conti.errori, monete: conti.monete,
    notaMonete: premioDetto(CHIAVE, conti.chieste, conti.monete),
    avanti: avanti ? avanti.nome : '',
    ancora: 'Rigioca',
  }
  prossimaId = avanti ? avanti.id : null
}

function chiudiTappa() {
  vinci()
  if (!finePronta) return
  fine.value = finePronta
  finePronta = null
  suono.livello()
}

function ancoraDaFine() {
  const t = tappa.value
  fine.value = null
  if (t) avvia(t)
  else allaMappa()
}

function avantiDaFine() {
  const id = prossimaId
  fine.value = null
  if (vista.value === 'libro' && (puntataOfferta || altraStoria)) apriStoria(puntataOfferta || altraStoria)
  else if (id) giocaTappa(id)
  else allaMappa()
}
// «Un'altra storia» accanto a «Puntata 2»
function altroDaFine() {
  fine.value = null
  if (altraStoria) apriStoria(altraStoria)
  else allaMappa()
}

/* ═══════════ il libro ═══════════ */
const libro = shallowRef(null)
let storia = null                    // il capitolo di adesso, come sta nei dati
const libroFase = ref('leggi')
const libroK = ref(0)
const libroRisposta = ref(null)      // quello che si è risposto alla domanda di adesso, null se ancora niente
const libroGiusta = ref(false)
const libroPersi = ref(0)            // tocchi a pagamento nel capitolo: ognuno toglie una domanda
let libroGiuste = 0
let libroPagate = 0                  // le domande del capitolo già pagate, una per volta
let tocchiLibro = null

// il libro di un mondo apre la prossima storia: la prima non letta, o la letta da più tempo
function apriLibro(mondo) {
  const cap = prossimaStoria(CAPITOLI, c, regole(), mondo)
  if (cap) apriStoria(cap)
}

function apriStoria(cap) {
  storia = cap
  altraStoria = null
  puntataOfferta = null
  // una puntata tiene le variabili della serie, salvate nel profilo (motore/storie.js)
  libro.value = racconta(cap, tiraLaStoria(c, cap))
  if (cap.serie) persist()
  libroFase.value = 'leggi'
  libroK.value = 0
  libroRisposta.value = null
  libroPersi.value = 0
  libroGiuste = 0
  libroPagate = 0
  tocchiLibro = new Tocchi({ itemDi: item })
  Object.assign(conti, { giuste: 0, errori: 0, monete: 0, chieste: 0, gradoPrima: null })
  fine.value = null
  bolla.value = null
  vista.value = 'libro'
}

function hoLetto() {
  libroFase.value = 'domande'
  orologio.riparti()
}

// La risposta: un'opzione, la riga toccata («frase») o la fila dei fatti («ordine»)
function rispondiLibro(risposta) {
  if (libroRisposta.value !== null || !orologio.pronta.value) return
  const dom = libro.value.domande[libroK.value]
  const giusta = eGiusta(dom, risposta)
  libroRisposta.value = risposta
  libroGiusta.value = giusta
  if (giusta) { libroGiuste++; conti.giuste++; suono.ok() } else { conti.errori++; suono.no() }
  // la domanda giusta paga adesso, se un tocco a pagamento non se l'è già mangiata
  if (giusta && domandeCheLPagano(libroGiuste, tocchiLibro.aPagamento) > libroPagate) {
    libroPagate++
    const p = incassa(pagaDelCapitolo(libro.value.pagine.length))
    conti.monete += p.dato
    conti.chieste += p.chiesto
  }
  // dopo uno sbaglio su «frase» e «ordine» c'è anche la soluzione da leggere
  const righe = dom.tipo === 'frase' ? ['Non così: la frase che lo dice è quella in verde.', dom.soluzione]
    : dom.tipo === 'ordine' ? ['Non così. L’ordine giusto è questo:', ...dom.soluzione]
    : ['Non così: rileggi il testo qui sopra.']
  const quanto = giusta ? 900 : attesaDellEsito({ righe, pavimento: 2500 })
  orologio.aspetta(quanto, avantiLibro)
}

function avantiLibro() {
  if (libroK.value + 1 < libro.value.domande.length) {
    libroK.value++
    libroRisposta.value = null
    orologio.riparti()
    return
  }
  for (const k of tocchiLibro.nonSapute) answer(k, { correct: false })
  // arrivati al cartello la storia è letta; la prossima è un'altra (motore/storie.js)
  segnaLetta(c, storia.id)
  segnaPuntata(c, storia)
  persist()
  if (storia.serie) flushNow()     // le variabili della serie servono alla puntata dopo: non devono perdersi
  puntataOfferta = puntataDopo(CAPITOLI, c, regole(), storia)
  altraStoria = unAltraStoria(CAPITOLI, c, regole(), storia.mondo, storia.id)
  const tot = libro.value.domande.length
  fine.value = {
    titolo: '📖 ' + libro.value.titolo,
    sotto: (libroGiuste === tot ? 'Hai capito tutto!' : `${libroGiuste} risposte giuste su ${tot}`) +
      (libroPersi.value ? ` · ${libroPersi.value === 1 ? 'una parola chiesta' : libroPersi.value + ' parole chieste'}, ` +
                          `${libroPersi.value === 1 ? 'una domanda' : libroPersi.value + ' domande'} senza monete` : ''),
    giuste: conti.giuste, errori: conti.errori, monete: conti.monete,
    notaMonete: premioDetto(CHIAVE, conti.chieste, conti.monete),
    avanti: puntataOfferta ? `Puntata ${puntataOfferta.puntata}` : altraStoria ? 'Un’altra storia' : '',
    altro: puntataOfferta && altraStoria ? 'Un’altra storia' : '',
  }
  suono.livello()
}

/* ═══════════ la parola da toccare ═══════════ */
const bolla = ref(null)
let bollaTimer = 0

// i tocchi che contano adesso: a domanda chiusa guardare non costa niente
function tocchiQui() {
  if (vista.value === 'libro' && tocchiLibro) return tocchiLibro
  if (vista.value === 'tappa' && tocchi && !esito.value) return tocchi
  return null
}
// c'è ancora un guadagno che un tocco toglierebbe? (nel libro, una domanda che paga)
const siPerde = () => (vista.value === 'libro'
  ? !!libro.value && libro.value.domande.length > libroPersi.value : pagaQui.value)

// Un tocco che toglierebbe il guadagno si chiede prima, in una bolla accanto
// alla parola; le volte gratis passano dritte (docs/lingue/mondi-vista.md).
function tocca(el) {
  const parola = el && el.dataset && el.dataset.parola
  if (!parola) return
  const box = el.getBoundingClientRect()
  // una parola della storia è nuova: toccarla è sempre gratis e non segna niente (docs/lingue/libro-racconti.md)
  if (vista.value === 'libro' && libro.value && libro.value.storia.includes(parola.toLowerCase()))
    return svela(parola, box.left + box.width / 2, box.top, { storia: true })
  const t = tocchiQui()
  const p = t ? t.prova(parola) : null
  if (p && p.costa && siPerde()) {
    clearTimeout(bollaTimer)
    const x = Math.min(innerWidth - 136, Math.max(136, box.left + box.width / 2))
    const sotto = box.top < 180     // sopra non ci sta: sotto la parola
    bolla.value = { parola, x, y: sotto ? box.bottom : box.top, sotto, sopra: box.top, centro: box.left + box.width / 2,
                    chiede: domandaDelTocco(p, { libro: vista.value === 'libro' }) }
    return
  }
  svela(parola, box.left + box.width / 2, box.top)
}

function svela(parola, centro, sopra, { storia = false } = {}) {
  const t = storia ? null : tocchiQui()
  const r = t ? t.tocca(parola) : { ...traduci(parola), gratis: true }
  if (t && t === tocchiLibro) libroPersi.value = t.aPagamento
  else if (t) pagaQui.value = t.paga
  if (t) persist()   // il conto dei tocchi gratis sta sull'elemento SRS della parola
  if (t && t === tocchi) salva()   // una parola chiesta costa: uscire non la ridà
  const x = Math.min(innerWidth - 90, Math.max(90, centro))   // la nuvoletta resta dentro lo schermo
  bolla.value = { parola, it: r.it || '', costa: !r.gratis, x, y: sopra, storia }
  clearTimeout(bollaTimer)
  bollaTimer = setTimeout(() => { bolla.value = null }, 2200)
}

const conSi = () => { const b = bolla.value; if (b && b.chiede) svela(b.parola, b.centro, b.sopra) }
const conNo = () => { if (bolla.value && bolla.value.chiede) bolla.value = null }
// rispondere chiude la domanda rimasta aperta: a quel punto guardare è gratis
watch([esito, libroRisposta], () => conNo())

function ascolta() {
  const q = d.value
  if (!q || q.genere !== 'parola') return
  pronuncia(q.domanda.ascolta || q.domanda.testo, 'en')
}

/* ═══════════ l'indicatore delle monete ═══════════ */
const indicatore = computed(() => {
  if (vista.value === 'tappa' && d.value && !fine.value) {
    const quanto = pagaDi(d.value)
    return pagaQui.value ? { testo: `+${quanto}`, paga: true } : { testo: '+0', paga: false }
  }
  if (vista.value === 'libro' && libro.value && !fine.value) {
    const resto = Math.max(0, libro.value.domande.length - libroPersi.value) * pagaDelCapitolo(libro.value.pagine.length)
    return { testo: `fino a +${resto}`, paga: libroPersi.value === 0 }
  }
  return null
})

const titolo = computed(() => {
  if (vista.value === 'tappa' && tappa.value) return tappa.value.nome
  if (vista.value === 'libro' && libro.value) return 'Il libro'
  return 'English'
})

// il telefono che si mette in tasca: visibilitychange è l'ultimo momento in
// cui si può ancora scrivere; prima di smontare, perché dopo il campo non c'è più
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salva({ subito: true })
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
onUnmounted(() => { clearTimeout(bollaTimer); zittisci() })
</script>

<template>
  <LinguaGame v-if="vista === 'prima'" lingua="en" libero @vai="allaMappa" />
  <div v-else class="schermo ing" :data-vista="vista">
    <Barra :titolo="titolo" guida="inglese" monete @indietro="indietro">
      <div v-if="indicatore" class="ing-paga" :class="{ 'ing-non-paga': !indicatore.paga }"
           data-paga :data-paga-si="indicatore.paga ? '1' : '0'"
           :title="indicatore.paga ? 'quanto vale questa domanda' : 'hai chiesto una parola: questa non paga'">
        🪙 {{ indicatore.testo }}<span v-if="!indicatore.paga" class="ing-perso">🔍</span>
      </div>
    </Barra>

    <div v-if="vista === 'mappa' && cartaRipresa" class="ing-ripresa">
      <Ripresa :ripresa="cartaRipresa" :chiede="chiede ? chiede.nome : ''"
               @riprendi="chiede = null; riprendiPartita()" @scorda="scorda"
               @comincia="cominciaComunque" @annulla="chiede = null" />
    </div>
    <Mappa v-if="vista === 'mappa'" :stato="stato" :extra="extra" :prima="diPrima"
           @tappa="id => vuole(tappaDi(id).nome, () => giocaTappa(id))" @libro="apriLibro"
           @cassetto="m => vuole('Il cassetto', () => giocaCassetto(m))" @prima="vista = 'prima'" />

    <div v-else-if="vista === 'tappa' && (d || pagina)" class="ing-palco">
      <div class="ing-conto" data-conto>
        <span>✅ {{ Math.min(conti.giuste, conti.bersaglio) }} / {{ conti.bersaglio }}</span>
        <span class="ing-barretta"><i :style="{ width: Math.min(100, 100 * conti.giuste / conti.bersaglio) + '%' }"></i></span>
      </div>
      <Pagina v-if="pagina" :p="pagina" :pronta="orologio.pronta.value" @capito="capito" @tocca="tocca" />
      <Domanda v-else :d="d" :caselle="caselle" :banco="banco" :pronto="pronto" :esito="esito"
               :attesa="attesa" :giro="giro" :parla="parla"
               @opzione="i => rispondi(d.opzioni[i], i)" @metti="metti" @togli="togli"
               @consegna="rispondi(F.risposta(fila), null)" @tocca="tocca" @ascolta="ascolta" />
    </div>

    <Libro v-else-if="vista === 'libro' && libro" :cap="libro" :fase="libroFase" :k="libroK"
           :risposta="libroRisposta" :giusta="libroGiusta" :attesa="attesa" :giro="giro"
           @ho-letto="hoLetto" @rispondi="rispondiLibro" @tocca="tocca" />

    <Fine v-if="fine" v-bind="fine" @mappa="allaMappa" @avanti="avantiDaFine" @ancora="ancoraDaFine"
          @altro="altroDaFine" />
    <Bolla v-if="bolla" :parola="bolla.parola" :it="bolla.it" :costa="bolla.costa" :chiede="bolla.chiede"
           :storia="bolla.storia"
           :sotto="bolla.sotto" :x="bolla.x" :y="bolla.y" @si="conSi" @no="conNo" />
  </div>
</template>
