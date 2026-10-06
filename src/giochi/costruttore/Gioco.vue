<script setup>
/* Il coordinatore: l'unico file che sa di monete, profilo e archivio.
   Vedi docs/costruttore/campagna.md. */
import { ref, reactive, computed, shallowRef, watch, nextTick, onMounted, onUnmounted } from 'vue'
import Barra from '../../components/Barra.vue'
import { suono } from '../../audio.js'
import { state, addCoins, segna, spendi } from '../../store/profile.js'
import { load, save, flush } from '../../store/storage.js'
import { progresso, aperta, adesso, chiusaPerEta, stelleDi, completa, scelta, ricorda,
         aiutiPresi, segnaAiutiPresi } from '../campagne.js'
import { scrive as scriveNelProgramma, SVELA } from '../aiuti.js'
import { scalaDi, applica } from './motore/aiuti.js'

import { CAPITOLI, QUANTE_TAPPE, FILE, FILA_ATTUALE, riordina } from './dati/campagna.js'
import { LIVELLI } from './dati/livelli.js'
import { LIBERO, APRE_DOPO } from './dati/libero.js'
import { copia, programma as scriviProgramma } from './dati/scrivi.js'
import * as mod from './motore/modifica.js'
import { fraseDi } from './motore/esecutore.js'
import { conAttrezzi } from './motore/attrezzi.js'
import { righeDi, righeScritte } from './motore/zaino.js'
import { guida } from './motore/guida.js'
import { usaGuida } from '../guida.js'
import Guida from '../Guida.vue'
import { Regia, quadroFermo } from './regia.js'

import Mappa from './viste/Mappa.vue'
import Ordine from './viste/Ordine.vue'
import Campo from './viste/Campo.vue'
import Comandi from './viste/Comandi.vue'
import Editor from './viste/Editor.vue'
import Cassetta from './viste/Cassetta.vue'
import FoglioProgetto from './viste/FoglioProgetto.vue'
import FoglioLavagnetta from './viste/FoglioLavagnetta.vue'
import FoglioAiuto from './viste/FoglioAiuto.vue'
import Finale from './viste/Finale.vue'
import './stile.css'

defineOptions({ name: 'Costruttore' })
const emit = defineEmits(['vai'])

const CHIAVE = 'costruttore'

/* ═══════════ dove siamo ═══════════ */
const vista = ref('mappa')             // mappa | cantiere
const idx = ref(-1)
/* il cantiere libero non è una tappa: ha un indice suo, fuori dalla fila */
const LIBERO_IDX = -2
const liv = computed(() => (idx.value === LIBERO_IDX ? LIBERO : idx.value >= 0 ? LIVELLI[idx.value] : null))
const avanza = progresso(CHIAVE)
// vedi docs/costruttore/campagna.md — riordinare la fila
if (avanza.cfg.fila !== FILA_ATTUALE) {
  const vecchia = FILE[avanza.cfg.fila || 1]
  if (vecchia && ((avanza.tappa || 0) > 0 || Object.keys(avanza.stelle || {}).length))
    Object.assign(avanza, riordina(avanza, vecchia))
  ricorda(CHIAVE, 'fila', FILA_ATTUALE)
}

/* ═══════════ i programmi, fuori dal profilo ═══════════ */
const archivio = reactive({ programmi: {} })
const VERSIONE = 2
const chiaveArchivio = () => `costruttore:${state.player || 'nessuno'}`
const pronto = load(chiaveArchivio()).then(d => {
  // versione diversa: lingua incompatibile, si ricomincia (docs/costruttore/campagna.md)
  if (d && d.v === VERSIONE && d.programmi && typeof d.programmi === 'object') archivio.programmi = d.programmi
}).catch(() => {})
let salvaTimer = 0
function salvaOra() {
  clearTimeout(salvaTimer)
  if (!state.player) return
  save(chiaveArchivio(), { v: VERSIONE, programmi: JSON.parse(JSON.stringify(archivio.programmi)) })
  flush()      // `save` aspetta 350 ms: uscendo, la pagina può sparire prima
}
const salvaPresto = () => { clearTimeout(salvaTimer); salvaTimer = setTimeout(salvaOra, 500) }

// gli attrezzi non si salvano: li rimette conAttrezzi ad ogni apertura (docs/costruttore/progetti.md)
// `inizio` di un livello: il programma già scritto a metà (il primo muretto)
const inizio = l => ({ ...conAttrezzi(scriviProgramma(l.inizio ? copia(l.inizio) : { principale: [], progetti: [], lavagnette: [] }), l),
                       svelato: false })
const prog = computed(() => (liv.value ? archivio.programmi[liv.value.chiave] : null))
const lavagnetteOrdine = computed(() => (liv.value ? liv.value.ordini[0].lavagnette || {} : {}))
const nomiOrdine = computed(() => Object.keys(lavagnetteOrdine.value))

/* ═══════════ la mappa ═══════════ */
const capitoli = computed(() => CAPITOLI.map(c => ({
  ...c,
  livelli: LIVELLI.map((l, i) => ({ ...l, indice: i })).filter(l => l.capitolo === c.chiave).map(l => ({
    ...l,
    aperta: aperta(CHIAVE, l.indice),
    adesso: adesso(CHIAVE, l.indice),
    stelle: stelleDi(CHIAVE, l.indice),
    /* chiuso per età: andare avanti non lo apre, quindi sotto non si
       promette niente */
    perEta: chiusaPerEta(CHIAVE, l.indice),
  })),
})))

const liberoAperto = computed(() => (avanza.tappa || 0) >= APRE_DOPO)

async function apriLivello(i) {
  await pronto
  const l = i === LIBERO_IDX ? LIBERO : LIVELLI[i]
  soloProgramma.value = false
  raccontoAperto.value = true
  provato.value = null
  mancano.value = false
  const salvato = archivio.programmi[l.chiave]
  archivio.programmi[l.chiave] = salvato ? conAttrezzi(salvato, l) : inizio(l)
  idx.value = i
  passiIndietro.value = storia(l.chiave).length
  vista.value = 'cantiere'
  tab.value = null
  sel.value = null
  aperta_.value = null
  mano.value = null
  foglio.value = null
  finale.value = null
  aiutiVisti.value = aiutiPresi(CHIAVE, l.chiave)
  ordineVisto.value = 0
  resetRisultato()
}

/* ═══════════ l'editor ═══════════ */
const tab = ref(null)
const sel = ref(null)
const aperta_ = ref(null)
const foglio = ref(null)               // cassetta | progetto | lavagnetta | aiuto
// il programma a tutto schermo, finché non si preme ▶ (docs/core/interfaccia.md)
const soloProgramma = ref(false)
// il racconto si legge entrando, si chiude al primo ▶ e si riapre dal fondo
const raccontoAperto = ref(true)
// per la guida: il programma dell'ultimo ▶, e se a quel giro mancavano mattoni
const provato = ref(null)
const mancano = ref(false)
const dove = ref(null)                 // dove andrà la riga scelta in cassetta
const progettoInModifica = ref(null)
const attesaLavagnetta = ref(null)     // { riga } o { inserisci: dove }
const aiutiVisti = ref(0)              // gradini scesi in questo livello (docs/costruttore/campagna.md)
/* la riga presa con ✂ o ⧉, finché non la si posa: `{ id, copia }` */
const mano = ref(null)
const ricominciaArmato = ref(false)
let ricominciaTimer = 0

// i progetti degli altri livelli da riprendere (docs/costruttore/progetti.md)
const altriProgetti = computed(() => {
  if (!liv.value || !prog.value) return []
  const qui = new Set((prog.value.progetti || []).map(p => p.nome))
  const visti = new Map()
  const mondo = liv.value.mondo || 'cantiere'
  const fonti = [...LIVELLI.filter(l => (l.mondo || 'cantiere') === mondo).map(l => [l.chiave, l.nome, LIVELLI.indexOf(l)]),
                 ...(mondo === 'cantiere' ? [[LIBERO.chiave, LIBERO.nome, 999]] : [])]
  for (const [chiave, nomeLiv, ordine] of fonti) {
    if (chiave === liv.value.chiave) continue
    const p = archivio.programmi[chiave]
    for (const q of (p && p.progetti) || []) {
      if (q.attrezzo || qui.has(q.nome) || !q.corpo.length) continue
      const prima = visti.get(q.nome)
      if (!prima || prima.ordine < ordine)
        visti.set(q.nome, { chiave, nomeLivello: nomeLiv, ordine, progetto: q })
    }
  }
  return [...visti.values()]
})
function importa({ chiave, progetto }) {
  const sorgente = archivio.programmi[chiave]
  if (!sorgente) return
  foglio.value = null
  const prova = copia(prog.value)
  mod.importaProgetto(prova, sorgente, progetto)
  if (troppoPerLoZaino(righeScritte(prova))) return
  const id = modifica(p => mod.importaProgetto(p, sorgente, progetto))
  if (id) tab.value = id
}

const problemi = computed(() => new Set(prog.value ? mod.problemi(prog.value, lavagnetteOrdine.value).map(p => p.id) : []))

// ogni modifica passa da qui, per ricordare com'era prima (docs/costruttore/progetti.md)
function modifica(fn, casella = null) {
  if (stato.inCorso || !prog.value) return null
  const prima = JSON.stringify(prog.value)
  const r = fn(prog.value)
  if (JSON.stringify(prog.value) !== prima) ricordaPrima(prima, casella)
  resetRisultato()
  salvaPresto()
  return r
}

// annulla: dieci passi in memoria, per livello (docs/costruttore/progetti.md)
const PASSI_INDIETRO = 10
const storie = new Map()
const storia = chiave => { if (!storie.has(chiave)) storie.set(chiave, []); return storie.get(chiave) }
const passiIndietro = ref(0)
let ultimaCasella = null
function ricordaPrima(json, casella = null) {
  if (casella && casella === ultimaCasella) return
  ultimaCasella = casella
  const s = storia(liv.value.chiave)
  s.push(json)
  if (s.length > PASSI_INDIETRO) s.shift()
  passiIndietro.value = s.length
}
function annulla() {
  if (stato.inCorso || !liv.value) return
  const s = storia(liv.value.chiave)
  if (!s.length) return
  const prima = JSON.parse(s.pop())
  passiIndietro.value = s.length
  ultimaCasella = null
  /* la soluzione vista resta vista: annullarla non riaccende la
     seconda stella, lo fa solo «ricomincia da capo» */
  prima.svelato = !!(prima.svelato || (prog.value && prog.value.svelato))
  archivio.programmi[liv.value.chiave] = conAttrezzi(prima, liv.value)
  sel.value = null
  aperta_.value = null
  mano.value = null
  if (tab.value && !(prima.progetti || []).some(p => p.id === tab.value)) tab.value = null
  resetRisultato()
  salvaPresto()
}

// lo zaino: quante righe tiene il programma, attrezzi esclusi (docs/costruttore/progetti.md)
const zaino = computed(() => (liv.value && liv.value.zaino) || null)
const righe = computed(() => (prog.value ? righeScritte(prog.value) : 0))
// la guida accompagna un livello che la chiede finché non è vinto (motore/guida.js)
const radice = ref(null)
const passoGuida = computed(() => {
  const l = liv.value
  if (!l || !l.guida || !prog.value || finale.value || stelleDi(CHIAVE, idx.value) > 0) return null
  return guida({ righe: prog.value.principale, cassetta: foglio.value === 'cassetta', scegliendo: !!aperta_.value,
                 problemi: problemi.value.size > 0, inCorso: !!stato.inCorso, provato: provato.value !== null,
                 cambiato: provato.value !== JSON.stringify(prog.value.principale), mancano: mancano.value })
})
usaGuida(radice, passoGuida)
function troppoPerLoZaino(quante) {
  if (!zaino.value || quante <= zaino.value) return false
  messaggio.value = { tipo: 'errore', testo: fraseZainoPieno() }
  return true
}
const fraseZainoPieno = () => `Qui il programma sta in ${zaino.value} righe, e sono tutte prese. ` +
  (liv.value.cassetta.includes('progetti')
    ? 'Cosa si ripete? Scrivilo una volta in un progetto, e chiamalo tutte le volte che serve.'
    : 'Cosa si ripete? Un «ripeti» fa la stessa cosa tante volte in una riga sola.')

function seleziona(id) { sel.value = id; aperta_.value = null }
function apri(a) { aperta_.value = a; ultimaCasella = null; if (a) sel.value = null }
function imposta({ id, campo, valore }) {
  modifica(p => mod.imposta(p, id, campo, valore), `${id}:${campo}`)
}
// se nella riga resta un'altra casella da scegliere, si apre quella
function sceltaFatta(id) {
  const t = prog.value && mod.trova(prog.value, id)
  const s = t && mod.primaDaScegliere(t.nodo, prog.value)
  const ora = aperta_.value
  if (s && !(ora && ora.id === id && ora.campo === s.campo)) apri({ id, campo: s.campo, tipo: s.tipo })
  else aperta_.value = null
}

function aggiungi(posto) {
  aperta_.value = null
  if (troppoPerLoZaino(righe.value + 1)) return
  dove.value = { progetto: tab.value, ...posto }
  foglio.value = 'cassetta'
}

// le scelte si fanno sulla riga (docs/costruttore/linguaggio.md); qui solo quello che non è una scelta
function sceltoBlocco({ blocco, progetto }) {
  const p = prog.value
  if (blocco === 'assegna' && !(p.lavagnette || []).length) {
    attesaLavagnetta.value = { inserisci: dove.value }
    foglio.value = 'lavagnetta'
    return
  }
  const pr = progetto ? (p.progetti || []).find(q => q.id === progetto) : null
  const colori = liv.value.colori
  const posti = liv.value.posti || ['sotto']
  const riga = mod.rigaNuova(blocco, { colore: colori.length === 1 ? colori[0] : null,
                                      dove: posti.length === 1 ? posti[0] : null,
                                      lavagnette: p.lavagnette, progetto: pr })
  const id = modifica(q => mod.inserisci(q, dove.value, riga))
  foglio.value = null
  apriLaPrimaScelta(id, riga)
}

// una riga nata con qualcosa da scegliere apre subito quella scelta
function apriLaPrimaScelta(id, riga) {
  const s = mod.primaDaScegliere(riga, prog.value)
  if (s) { aperta_.value = { id, campo: s.campo, tipo: s.tipo }; sel.value = null }
  else { sel.value = id; aperta_.value = null }
}

function azione({ tipo, id }) {
  modifica(p => {
    if (tipo === 'su') mod.sposta(p, id, -1)
    else if (tipo === 'giu') mod.sposta(p, id, +1)
    else if (tipo === 'togli') { mod.togli(p, id); sel.value = null }
    else if (tipo === 'altrimenti') {
      const t = mod.trova(p, id)
      if (t) t.nodo.altrimenti = t.nodo.altrimenti ? null : []
    }
  })
}

// la mano: ✂/⧉ e poi un «📥 qui» (docs/costruttore/progetti.md)
const manoViva = computed(() => (mano.value && prog.value && mod.trova(prog.value, mano.value.id) ? mano.value : null))
function prendiInMano(m) {
  mano.value = m
  sel.value = null
  aperta_.value = null
}
function posa(posto) {
  const m = manoViva.value
  if (!m) return
  if (m.copia && troppoPerLoZaino(righe.value + righeDi([mod.trova(prog.value, m.id).nodo]))) return
  let id = null
  modifica(p => { id = m.copia ? mod.incollaCopia(p, m.id, posto) : (mod.trasloca(p, m.id, posto) ? m.id : null) })
  mano.value = null
  if (!id) return
  sel.value = id
  nextTick(() => document.querySelector(`[data-riga="${id}"]`)?.scrollIntoView({ block: 'nearest' }))
}

function nuovaLavagnetta(idRiga = null) {
  attesaLavagnetta.value = idRiga ? { riga: idRiga } : null
  foglio.value = 'lavagnetta'
  aperta_.value = null
}
function creaLavagnetta(nome) {
  const attesa = attesaLavagnetta.value
  modifica(p => {
    mod.nuovaLavagnetta(p, nome)
    if (attesa && attesa.riga) mod.imposta(p, attesa.riga, 'nome', nome)
    if (attesa && attesa.inserisci) {
      const riga = mod.rigaNuova('assegna', { lavagnette: [nome] })
      apriLaPrimaScelta(mod.inserisci(p, attesa.inserisci, riga), riga)
    }
  })
  attesaLavagnetta.value = null
  foglio.value = null
}
const nomiPresi = computed(() => (prog.value
  ? [...(prog.value.lavagnette || []), ...nomiOrdine.value,
     ...(prog.value.progetti || []).flatMap(p => p.misure || [])]
  : []))

function apriProgetto(id) {
  progettoInModifica.value = id
  foglio.value = 'progetto'
  aperta_.value = null
}
function salvaProgetto({ nome, icona, misure }) {
  const id = progettoInModifica.value
  modifica(p => {
    if (id) mod.aggiornaProgetto(p, id, { nome, icona, misure })
    else tab.value = mod.nuovoProgetto(p, { nome, icona, misure: misure.map(m => ({ nome: m.nome, tipo: m.tipo })) })
  })
  foglio.value = null
}
function eliminaProgetto() {
  const id = progettoInModifica.value
  modifica(p => mod.togliProgetto(p, id))
  tab.value = null
  foglio.value = null
}

function ricomincia() {
  if (!ricominciaArmato.value) {
    ricominciaArmato.value = true
    clearTimeout(ricominciaTimer)
    ricominciaTimer = setTimeout(() => { ricominciaArmato.value = false }, 3000)
    return
  }
  ricominciaArmato.value = false
  if (stato.inCorso) return
  ricordaPrima(JSON.stringify(prog.value))
  archivio.programmi[liv.value.chiave] = inizio(liv.value)
  tab.value = null
  sel.value = null
  mano.value = null
  resetRisultato()
  salvaPresto()
}

// gli aiuti: la scala e i prezzi in docs/costruttore/campagna.md
const scala = computed(() => (liv.value ? scalaDi(liv.value) : []))
const aiutiFatti = computed(() => scala.value.slice(0, aiutiVisti.value))
const prossimoAiuto = computed(() => scala.value[aiutiVisti.value] || null)
const monete = computed(() => state.profile.coins || 0)

function apriAiuti() {
  if (!aiutiVisti.value && prossimoAiuto.value && !prossimoAiuto.value.prezzo) scendi()
  foglio.value = 'aiuto'
}
function scendi() {
  const p = prossimoAiuto.value
  if (!p || !spendi(p.prezzo)) return
  aiutiVisti.value++
  segnaAiutiPresi(CHIAVE, liv.value.chiave, aiutiVisti.value)
  if (scriveNelProgramma(p)) scriviAiuto(p)
}
// un gradino già pagato si rimette gratis
function rimetti(k) {
  const p = scala.value[k]
  if (k < aiutiVisti.value && scriveNelProgramma(p)) scriviAiuto(p)
}
// svelato lo accende solo la soluzione intera (spegne la seconda stella)
function scriviAiuto(p) {
  if (stato.inCorso) stop()
  const prima = prog.value
  if (prima) ricordaPrima(JSON.stringify(prima))
  archivio.programmi[liv.value.chiave] = { ...conAttrezzi(applica(prima, p), liv.value),
                                           svelato: !!(prima && prima.svelato) || p.che === SVELA }
  tab.value = null
  sel.value = null
  foglio.value = null
  resetRisultato()
  salvaPresto()
}

/* ═══════════ la prova ═══════════ */
const stato = reactive({ inCorso: false, ordine: 0, montaggio: false, riga: null, progetto: null,
                         guasto: null, pila: [], valori: {}, ordineValori: {}, giro: null, esiti: [], tic: 0 })
const velocita = ref(scelta(CHIAVE, 'velocita', 'normale'))
const quadro = shallowRef(null)
const ordineVisto = ref(0)
const messaggio = ref(null)            // { tipo: 'errore' | 'sbagliato', testo }
const finale = ref(null)
let regia = null
let mattoni = 0

function resetRisultato() {
  if (!liv.value) return
  stato.guasto = null
  stato.pila = []
  stato.giro = null
  stato.esiti = []
  messaggio.value = null
  quadro.value = quadroFermo(liv.value, ordineVisto.value)
}

function vedi(i) {
  if (stato.inCorso) return
  ordineVisto.value = i
  resetRisultato()
}

function cambiaVelocita(v) {
  velocita.value = v
  ricorda(CHIAVE, 'velocita', v)
  regia?.cambiaVelocita(v)
}

const suoni = {
  passo: () => { if (velocita.value !== 'veloce' && !stato.montaggio) suono.nota(700, 700, 0.03, 'triangle', 0.04) },
  posa: () => { if (!stato.montaggio) suono.nota(330, 260, 0.07, 'square', 0.06) },
  errore: () => suono.nota(300, 200, 0.25, 'triangle', 0.1),
  splash: () => suono.blub(),
  ok: () => suono.nota(660, 880, 0.12, 'triangle', 0.08),
  /* il porto: prendere è un colpetto più alto del posare, la gru un
     tonfo basso e morbido, il cliente servito un «ding» */
  prendi: () => { if (!stato.montaggio) suono.nota(420, 520, 0.06, 'square', 0.05) },
  cala: () => { if (!stato.montaggio) suono.nota(180, 140, 0.12, 'triangle', 0.06) },
  servito: () => suono.nota(880, 1320, 0.1, 'triangle', 0.07),
}

const tabDellaRiga = id => {
  const t = prog.value && id ? mod.trova(prog.value, id) : null
  return t ? t.progetto : null
}

function via() {
  if (!prog.value || stato.inCorso) return
  soloProgramma.value = false
  raccontoAperto.value = false
  provato.value = JSON.stringify(prog.value.principale)
  mancano.value = false
  aperta_.value = null
  sel.value = null
  mano.value = null
  foglio.value = null
  if (zaino.value && righe.value > zaino.value) {
    messaggio.value = { tipo: 'errore', testo: `Il programma ha ${righe.value} righe, e qui ne stanno ${zaino.value}. ` +
      'Cosa si ripete? Scrivilo una volta sola, e chiamalo.' }
    return
  }
  const guai = mod.problemi(prog.value, lavagnetteOrdine.value)
  if (guai.length) {
    const g = guai[0]
    stato.guasto = g.id
    tab.value = tabDellaRiga(g.id)
    messaggio.value = { tipo: 'errore', testo: fraseDi(g) }
    /* se è una cosa da scegliere, la scelta si apre già: è lì che bisogna andare */
    if (g.campo) aperta_.value = { id: g.id, campo: g.campo, tipo: g.tipo }
    return
  }
  messaggio.value = null
  mattoni = 0
  regia = new Regia({
    livello: liv.value, programma: prog.value, stato, velocita: velocita.value,
    su: {
      quadro: (q, i) => { quadro.value = q; ordineVisto.value = i },
      suono: tipo => suoni[tipo]?.(),
      mattone: () => { mattoni++ },
      fine: esito => fine(esito),
    },
  })
  regia.avvia()
}

function stop() {
  regia?.ferma()
  regia = null
  if (mattoni) segna('coMattoni', mattoni)
  mattoni = 0
  resetRisultato()
}

const FRASI_OMINO = {
  muro: 'L\'omino non riesce a passare: c\'è un gradino troppo alto.',
  splash: 'Splash! L\'omino è finito in acqua.',
  caduta: 'Ahia! Un salto troppo alto per l\'omino.',
  fuori: 'L\'omino è uscito dal cantiere.',
  perso: 'L\'omino cammina e cammina, ma alla bandiera non arriva.',
}
const quanti = (n, uno, tanti) => `${n} ${n === 1 ? uno : tanti}`
function fraseConfronto(c) {
  const pezzi = []
  if (c.mancano.length) pezzi.push(`${c.mancano.length === 1 ? 'manca' : 'mancano'} ${quanti(c.mancano.length, 'mattone', 'mattoni')}`)
  if (c.troppi.length) pezzi.push(`${quanti(c.troppi.length, 'mattone è', 'mattoni sono')} di troppo`)
  if (c.sbagliati.length) pezzi.push(`${quanti(c.sbagliati.length, 'mattone è', 'mattoni sono')} del colore sbagliato`)
  return `Il disegno non torna: ${pezzi.join(', ')}.`
}

function fine(esito) {
  regia = null
  if (mattoni) segna('coMattoni', mattoni)
  mattoni = 0
  const l = liv.value
  if (l.libero) {
    messaggio.value = { tipo: 'fatto', testo: 'Fatto! Il cantiere libero non si vince: si costruisce. Cambia il programma e riprova.' }
    return
  }
  if (esito.vinto) return vittoria()
  const prefisso = l.ordini.length > 1 ? `Con «${l.ordini[esito.ordine].nome}»: ` : ''
  if (esito.errore) {
    tab.value = tabDellaRiga(esito.errore.id)
    messaggio.value = { tipo: 'errore', testo: prefisso + esito.errore.frase }
  } else if (esito.confronto) {
    messaggio.value = { tipo: 'sbagliato', testo: prefisso + fraseConfronto(esito.confronto) }
    const c = esito.confronto
    mancano.value = c.mancano.length > 0 && !c.troppi.length && !c.sbagliati.length
  }
  /* il porto: a sera, cosa non torna — con i numeri, non «riprova» */
  else if (esito.giornata) messaggio.value = { tipo: 'sbagliato', testo: prefisso + esito.giornata.frasi.join(' ') }
  else if (esito.omino) messaggio.value = { tipo: 'sbagliato', testo: prefisso + (FRASI_OMINO[esito.omino.esito] || 'L\'omino non arriva.') }
}

function vittoria() {
  const i = idx.value
  const l = liv.value
  const primaVolta = stelleDi(CHIAVE, i) === 0
  const stelle = prog.value.svelato ? 1 : 2
  /* le monete prima della tappa: `completa` scrive subito su disco, e
     così porta con sé anche loro — al contrario, chiudere l'app appena
     vinto poteva perderle */
  const monete = primaVolta ? l.premio : 0
  if (monete) addCoins(monete)
  completa(CHIAVE, i, QUANTE_TAPPE, { stelle })
  suono.livello()
  finale.value = { titolo: l.nome, stelle, monete, ordini: l.ordini.map(o => o.nome),
                   svelato: !!prog.value.svelato, ultimo: i === LIVELLI.length - 1 }
}

function avanti() {
  const i = idx.value + 1
  finale.value = null
  if (i < LIVELLI.length && aperta(CHIAVE, i)) apriLivello(i)
  else allaMappa()
}

function allaMappa() {
  stop()
  salvaOra()
  finale.value = null
  foglio.value = null
  idx.value = -1
  vista.value = 'mappa'
}

function indietro() {
  if (vista.value === 'cantiere') allaMappa()
  else { salvaOra(); emit('vai', 'home') }
}

/* la riga che sta girando resta a vista, anche in un programma lungo */
watch(() => stato.riga, id => {
  if (!id || velocita.value === 'veloce') return
  nextTick(() => document.querySelector(`[data-riga="${id}"]`)?.scrollIntoView({ block: 'nearest' }))
})
watch(() => stato.guasto, id => {
  if (id) nextTick(() => document.querySelector(`[data-riga="${id}"]`)?.scrollIntoView({ block: 'center' }))
})

/* mentre gira la scheda segue il robot dentro i progetti — tranne a
   tutta velocità e nel montaggio, dove cambierebbe troppo in fretta
   per dire qualcosa */
const tabMostrato = computed(() =>
  stato.inCorso && !stato.montaggio && velocita.value !== 'veloce' ? stato.progetto : tab.value)

// Scheda nascosta o chiusa: l'ultimo momento utile per scrivere il programma (docs/costruttore/campagna.md).
// Il listener di storage.js gira prima e ha già svuotato la coda: qui si riscrive e si svuota di nuovo.
function seSparisce(e) {
  if (e?.type === 'pagehide' || document.visibilityState === 'hidden') salvaOra()
}
onMounted(() => {
  document.addEventListener('visibilitychange', seSparisce)
  addEventListener('pagehide', seSparisce)
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', seSparisce)
  removeEventListener('pagehide', seSparisce)
  regia?.ferma(); salvaOra(); clearTimeout(ricominciaTimer)
})

const titolo = computed(() => (liv.value ? liv.value.nome : 'Il costruttore'))
const progettoAperto = computed(() =>
  progettoInModifica.value ? (prog.value.progetti || []).find(p => p.id === progettoInModifica.value) : null)
</script>

<template>
  <div class="schermo">
    <Barra :titolo="titolo" guida="costruttore" monete @indietro="indietro" />

    <div ref="radice" class="cst">
      <Mappa v-if="vista === 'mappa'" :capitoli="capitoli" :libero="{ ...LIBERO, aperto: liberoAperto }"
             @gioca="apriLivello" @libero="apriLivello(LIBERO_IDX)" />

      <div v-else-if="liv && prog" class="cst-cantiere">
        <div class="cst-sopra">
          <Ordine v-show="!soloProgramma" :racconto="raccontoAperto" :livello="liv" :visto="ordineVisto" :esiti="stato.esiti" :in-corso="stato.inCorso" @vedi="vedi" />
          <div v-if="stato.montaggio && stato.inCorso && !soloProgramma" class="cst-montaggio" data-montaggio>
            e adesso con «{{ liv.ordini[stato.ordine].nome }}»…
          </div>
          <Campo v-show="!soloProgramma" :quadro="quadro" />
          <Comandi :in-corso="stato.inCorso" :velocita="velocita"
                   :ordine="liv.ordini[ordineVisto].lavagnette || {}"
                   :lavagnette="prog.lavagnette || []" :valori="stato.inCorso || stato.guasto ? stato.valori : {}"
                   :con-lavagnette="liv.cassetta.includes('assegna')" :aiuti="aiutiVisti"
                   :turno="liv.mondo === 'porto' && stato.inCorso ? (stato.turno || 0) : null"
                   :solo-programma="soloProgramma" @solo-programma="soloProgramma = !soloProgramma"
                   @via="via" @stop="stop" @velocita="cambiaVelocita" @aiuto="apriAiuti"
                   @nuova-lavagnetta="nuovaLavagnetta(null)" />
          <p v-if="messaggio" class="cst-messaggio" :class="'cst-' + messaggio.tipo" data-messaggio>{{ messaggio.testo }}</p>
          <Guida :passo="passoGuida" />
        </div>
        <Editor :programma="prog" :livello="liv" :tab="tabMostrato" :sel="sel" :aperta="aperta_"
                :accesa="stato.inCorso ? stato.riga : null" :guasto="stato.guasto" :problemi="problemi"
                :giro="stato.inCorso ? stato.giro : null" :sola="stato.inCorso" :pila="stato.pila"
                :indietro="passiIndietro" :zaino="zaino" :scritte="righe" :livelli="LIVELLI" :mano="manoViva"
                @tab="t => { tab = t; sel = null; aperta_ = null }" @seleziona="seleziona" @apri="apri"
                @imposta="imposta" @avanti="sceltaFatta" @mano="prendiInMano" @posa="posa" @aggiungi="aggiungi" @azione="azione" @annulla="annulla"
                @nuova-lavagnetta="nuovaLavagnetta" @progetto="apriProgetto" @ricomincia="ricomincia"
                :racconto="raccontoAperto" @racconto="raccontoAperto = !raccontoAperto" />
        <p v-if="ricominciaArmato" class="cst-messaggio cst-errore cst-fisso">Tocca ancora «ricomincia» per cancellare tutto il programma di questo livello.</p>
      </div>

      <Cassetta v-if="foglio === 'cassetta'" :cassetta="liv.cassetta" :posti="liv.posti || ['sotto']"
                :porto="liv.mondo === 'porto'"
                :progetti="prog.progetti || []"
                :lavagnette="prog.lavagnette || []" :dentro-progetto="dove && dove.progetto"
                :altri="altriProgetti"
                @scegli="sceltoBlocco" @nuovo-progetto="apriProgetto(null)" @importa="importa" @chiudi="foglio = null" />
      <FoglioProgetto v-if="foglio === 'progetto'" :progetto="progettoAperto" :con-misure="!!liv.misure"
                      :con-colori="!!liv.misure && liv.colori.length > 1"
                      :nomi-presi="(prog.progetti || []).map(p => p.nome)"
                      @salva="salvaProgetto" @elimina="eliminaProgetto" @chiudi="foglio = null" />
      <FoglioLavagnetta v-if="foglio === 'lavagnetta'" :prese="nomiPresi"
                        @crea="creaLavagnetta" @chiudi="foglio = null; attesaLavagnetta = null" />
      <FoglioAiuto v-if="foglio === 'aiuto'" :fatti="aiutiFatti" :prossimo="prossimoAiuto" :monete="monete"
                   @altro="scendi" @rimetti="rimetti" @chiudi="foglio = null" />
      <Finale v-if="finale" v-bind="finale" @avanti="avanti" @mappa="allaMappa" @resta="finale = null" />
    </div>
  </div>
</template>
