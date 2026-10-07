<script setup>
// La terra di sopra: la mappa intera, l'eroe che cammina da solo fino al punto toccato, la vista che lo segue
// quando arriva ai bordi, le discese sui posti col loro fumetto, chi indica la strada, i mercanti e la nebbia.
// Riceve le tappe già decise e dice solo «si scende qui» (`scendi`), «apro il banco di…» (`bottega`) e
// «ricordati questo» (`terra`).
// Le regole: docs/sotterraneo/terra-di-sopra.md.
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { MAPPA, LARGO, ALTO, CELLA, MASCHERA, POSTI, PARTENZA, MINATORE as DOVE_MINATORE, CARTELLO,
         MERCANTI as DOVE_MERCANTI } from '../dati/terra-mappa.js'
import { MERCANTI } from '../dati/mercanti.js'
import { POSTO_DI, LUOGHI, POZZO_VECCHIO, FRECCE, SCALA_TERRA as S, SCALA_EROE, PASSO_TERRA, VISTA, LUCE,
         SASSI_OGNI, BORDO, MORBIDA } from '../dati/terra.js'
import { creaTerra, scopri, nebbiaNuova, nebbiaInCodice, nebbiaDaCodice, sassiLungo } from '../motore/terra.js'
import { pezzoAndante } from '../dati/tessere.js'
import { figura, haFigura } from './figura.js'
import { MINATORE, ARMAIOLO, ERBORISTA, RIGATTIERE, DIVIETO, SASSO, LUCCICHIO } from './pixel.js'
import Pixel from './Pixel.vue'

const props = defineProps({
  tappe: { type: Array, required: true },     // [{ indice, chiave, nome, icona, dritta, piani, aperta, adesso, stelle, perEta, fatta }]
  abisso: { type: Object, default: null },    // { indice, nome, icona, dritta, fondo }, o null finché non si apre
  eroe: { type: Object, required: true },
  terra: { type: Object, default: null },     // { nebbia, dove, parlato } dell'avventura, o null la prima volta
  giaScesa: { type: Number, default: null },  // la discesa lasciata a metà: ci si è già stati
})
const emit = defineEmits(['scendi', 'terra', 'bottega'])

const SCARTO_DITO = 16   // sotto, il dito è fermo (docs/core/il-dito.md)
const minuscolo = s => s.charAt(0).toLowerCase() + s.slice(1)
const L = MASCHERA[0].length, A = MASCHERA.length
// chi sta fermo non si attraversa: il minatore e i mercanti
const mondo = creaTerra(MASCHERA, {
  ostacoli: [DOVE_MINATORE.piede, ...Object.values(DOVE_MERCANTI).map(m => m.piede)],
})
const cella = ([x, y]) => ({ x, y })

/* ═══════════ i posti: chi ci sta e com'è ═══════════ */
const prev = i => props.tappe.find(t => t.indice === i - 1)
const posti = computed(() => Object.entries(POSTI).map(([nome, p]) => {
  const t = props.tappe.find(t => POSTO_DI[t.chiave] === nome)
  const daAbisso = POSTO_DI.abisso === nome
  const cosa = t || (daAbisso && props.abisso) || null
  return {
    nome, riquadro: p.riquadro, ingresso: p.ingresso, piede: cella(p.piede),
    tappa: t || null, abisso: daAbisso,
    cosa: cosa || POZZO_VECCHIO,
    aperto: t ? t.aperta : !!props.abisso,
    adesso: t ? t.adesso : false,
  }
}))

// i mercanti di sopra (dati/mercanti.js): il foglietto dice dove stanno, la figura viene da pixel.js finché
// l'atlante non ha `<nome>-fermo-0` (come il minatore)
const FIGURE = { armaiolo: ARMAIOLO, erborista: ERBORISTA, rigattiere: RIGATTIERE }
const mercanti = MERCANTI.filter(m => DOVE_MERCANTI[m.chiave]).map(m => {
  const vero = haFigura(`${m.sprite}-fermo-0`)
  return {
    ...m, piede: cella(DOVE_MERCANTI[m.chiave].piede), accanto: cella(DOVE_MERCANTI[m.chiave].accanto),
    figura: FIGURE[m.chiave] || MINATORE,
    ritratto: vero ? figura(`${m.sprite}-fermo-0`, { scala: SCALA_EROE }) : null,
  }
})

const nebbia = (() => {
  const salvata = props.terra && nebbiaDaCodice(props.terra.nebbia, L, A)
  if (salvata) return salvata
  // la prima volta: si vede attorno a casa, e dove si è già scesi (chi giocava prima della mappa non rifà la strada)
  const n = nebbiaNuova(L, A)
  const [px, py] = PARTENZA.piede
  scopri(n, L, A, px + 0.5, py + 0.5, VISTA)
  for (const [nome, p] of Object.entries(POSTI)) {
    const t = props.tappe.find(t => POSTO_DI[t.chiave] === nome)
    const gia = t ? (t.fatta || t.stelle > 0 || t.indice === props.giaScesa) : (props.abisso && props.abisso.fondo > 0)
    if (gia) scopri(n, L, A, p.piede[0] + 0.5, p.piede[1] + 0.5, VISTA)
  }
  return n
})()
const primaVolta = ref(!props.terra)
// i cartelli di divieto piantati davanti alle discese chiuse in cui si è andati; una discesa che si apre lo perde
const divieti = ref(new Set((props.terra && Array.isArray(props.terra.divieti) ? props.terra.divieti : [])
  .filter(n => posti.value.some(p => p.nome === n && !p.aperto))))
const parlato = ref(!!(props.terra && props.terra.parlato))

// un posto si trova quando se ne vede il cuore
const centroDi = r => ({ x: Math.floor((r[0] + r[2] / 2) / CELLA), y: Math.floor((r[1] + r[3] / 2) / CELLA) })
const visto = c => nebbia[c.y * L + c.x] === 1
const daTrovare = [...Object.entries(POSTI), ['cartello', CARTELLO]]
// un mercante si trova quando si vede la cella dove sta: prima è prato come il resto
const trovati = ref(new Set([
  ...daTrovare.filter(([, p]) => visto(centroDi(p.riquadro))).map(([n]) => n),
  ...mercanti.filter(m => visto(m.piede)).map(m => m.chiave),
]))

/* ═══════════ l'eroe ═══════════ */
const partenza = (() => {
  const d = props.terra && props.terra.dove
  return Array.isArray(d) && mondo.passa(d[0], d[1]) ? cella(d) : cella(PARTENZA.piede)
})()
const io = { x: partenza.x + 0.5, y: partenza.y + 0.5 }   // in celle della maschera, il centro della cella
let via = []          // i punti dove girare, già lisciati
let meta = null       // cosa aprire all'arrivo
const cammina = ref(false)
const specchio = ref(false)
const fotogramma = ref(0)
const ritratto = computed(() => figura(
  pezzoAndante(props.eroe.sprite, cammina.value ? 'corsa' : 'fermo', fotogramma.value), { scala: SCALA_EROE }))
const cellaDiMe = () => ({ x: Math.floor(io.x), y: Math.floor(io.y) })

function vaiA(c, cosa = null) {
  const da = cellaDiMe()
  const arrivo = mondo.arrivo(da, c)
  if (!arrivo) return false
  const strada = mondo.strada(da, arrivo) || []
  via = mondo.liscia(da, strada).map(p => ({ x: p.x + 0.5, y: p.y + 0.5 }))
  meta = cosa
  if (!via.length) arriva()
  else cammina.value = true
  primaVolta.value = false
  return true
}

function arriva() {
  cammina.value = false
  salva()
  const m = meta
  meta = null
  if (m) apri(m)
}

/* ═══════════ la telecamera ═══════════ */
const vista = ref(null), mondoEl = ref(null), eroeEl = ref(null), nebbiaEl = ref(null)
const sopraEl = ref(null), sottoEl = ref(null)
let vL = 0, vA = 0, sopra = 0, sotto = 0
const cam = { x: 0, y: 0 }, mira = { x: 0, y: 0 }

// i limiti della vista, in pixel della mappa: la mappa può scorrere fin sotto le carte in cima e in fondo
function limiti() {
  const lw = vL / S, aw = vA / S
  const x = LARGO <= lw ? [(LARGO - lw) / 2, (LARGO - lw) / 2] : [0, LARGO - lw]
  const y = [-sopra / S, ALTO - aw + sotto / S]
  return { lw, aw, x, y: y[0] > y[1] ? [(y[0] + y[1]) / 2, (y[0] + y[1]) / 2] : y }
}
const stringi = (v, [a, b]) => Math.max(a, Math.min(b, v))

// la vista sta ferma finché l'eroe non arriva a `BORDO` dal bordo; allora si sposta quel tanto che basta
function seguiEroe(subito = false) {
  const { lw, aw, x, y } = limiti()
  const hx = io.x * CELLA, hy = io.y * CELLA
  const usa = aw - (sopra + sotto) / S
  if (subito) {
    mira.x = hx - lw / 2
    mira.y = hy - sopra / S - usa * 0.55
  } else {
    const mx = lw * BORDO.x
    mira.x = stringi(mira.x, [hx - (lw - mx), hx - mx])
    mira.y = stringi(mira.y, [hy - sopra / S - usa * (1 - BORDO.sotto), hy - sopra / S - usa * BORDO.sopra])
  }
  mira.x = stringi(mira.x, x)
  mira.y = stringi(mira.y, y)
  if (subito) { cam.x = mira.x; cam.y = mira.y }
}

function misura() {
  const r = vista.value && vista.value.getBoundingClientRect()
  if (!r || !r.width) return false
  vL = r.width; vA = r.height
  sopra = sopraEl.value ? sopraEl.value.offsetHeight : 0
  sotto = sottoEl.value ? sottoEl.value.offsetHeight : 0
  return true
}

/* ═══════════ la nebbia ═══════════ */
// a un quarto: la tela si stira con lo sfumato del browser, e i bordi vengono morbidi da soli
const Q = 4, PF = CELLA / Q
let carta = null, sbuffi = null, sporca = true
const dado = (x, y, k) => { const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n) }

// una nuvoletta per cella vista, spostata un poco a caso: il bordo del buio viene a nuvole, non a quadretti
function sbuffo(c) {
  const g = sbuffi.getContext('2d')
  const x = (c.x + 0.5) * PF + (dado(c.x, c.y, 1) - 0.5) * 4, y = (c.y + 0.5) * PF + (dado(c.x, c.y, 2) - 0.5) * 4
  const r = PF * (1.25 + dado(c.x, c.y, 3) * 0.35)
  const gr = g.createRadialGradient(x, y, 0, x, y, r)
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(x - r, y - r, 2 * r, 2 * r)
}

function preparaNebbia() {
  const c = nebbiaEl.value
  c.width = LARGO / Q; c.height = ALTO / Q
  carta = c.getContext('2d')
  sbuffi = document.createElement('canvas')
  sbuffi.width = c.width; sbuffi.height = c.height
  for (let y = 0; y < A; y++) for (let x = 0; x < L; x++) if (nebbia[y * L + x]) sbuffo({ x, y })
}

// nero dove non si è mai stati, scuro dove si è stati, pieno attorno a te
function dipingiNebbia() {
  const g = carta
  g.globalCompositeOperation = 'source-over'
  g.globalAlpha = 1
  g.clearRect(0, 0, LARGO / Q, ALTO / Q)
  g.fillStyle = '#07060b'
  g.fillRect(0, 0, LARGO / Q, ALTO / Q)
  g.globalCompositeOperation = 'destination-out'
  g.globalAlpha = 0.5
  g.drawImage(sbuffi, 0, 0)
  g.globalAlpha = 1
  const x = io.x * PF, y = io.y * PF
  const gr = g.createRadialGradient(x, y, LUCE[0] * PF, x, y, LUCE[1] * PF)
  gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = gr
  g.fillRect(x - LUCE[1] * PF, y - LUCE[1] * PF, 2 * LUCE[1] * PF, 2 * LUCE[1] * PF)
  sporca = false
}

const avviso = ref('')
let tAvviso = 0
function dillo(s) {
  avviso.value = s
  clearTimeout(tAvviso)
  tAvviso = setTimeout(() => { avviso.value = '' }, 2600)
}

function guarda() {
  const nuove = scopri(nebbia, L, A, io.x, io.y, VISTA)
  if (!nuove.length) return
  nuove.forEach(sbuffo)
  for (const p of posti.value) {
    if (trovati.value.has(p.nome) || !visto(centroDi(p.riquadro))) continue
    trovati.value = new Set([...trovati.value, p.nome])
    const c = p.cosa
    dillo(p.aperto ? `Hai trovato ${minuscolo(c.nome)}!` : `Hai trovato ${minuscolo(c.nome)}: per ora non si scende.`)
  }
  if (!trovati.value.has('cartello') && visto(centroDi(CARTELLO.riquadro)))
    trovati.value = new Set([...trovati.value, 'cartello'])
  for (const m of mercanti) {
    if (trovati.value.has(m.chiave) || !visto(m.piede)) continue
    trovati.value = new Set([...trovati.value, m.chiave])
    dillo(`Hai trovato ${minuscolo(m.nome)}!`)
  }
}

/* ═══════════ il passo ═══════════ */
let raf = 0, prima = 0, tempo = 0, ultimaCella = ''
function battito(ora) {
  raf = requestAnimationFrame(battito)
  const dt = Math.min(0.05, (ora - prima) / 1000 || 0)
  prima = ora
  tempo += dt
  if (!vL && !misura()) return
  if (via.length) {
    let resta = PASSO_TERRA * dt
    while (resta > 0 && via.length) {
      const q = via[0], dx = q.x - io.x, dy = q.y - io.y, d = Math.hypot(dx, dy)
      if (Math.abs(dx) > 0.05) specchio.value = dx < 0
      if (d <= resta) { io.x = q.x; io.y = q.y; via.shift(); resta -= d }
      else { io.x += dx / d * resta; io.y += dy / d * resta; resta = 0 }
    }
    guarda()
    sporca = true
    seguiEroe()
    if (!via.length) arriva()
  }
  const fr = Math.floor(tempo * (cammina.value ? 10 : 4)) % 4
  if (fr !== fotogramma.value) fotogramma.value = fr
  const k = 1 - Math.exp(-dt * MORBIDA)
  cam.x += (mira.x - cam.x) * k
  cam.y += (mira.y - cam.y) * k
  if (sporca && carta) dipingiNebbia()
  posa()
}

// il DOM si sposta a mano, una volta per fotogramma: un ridisegno di Vue sessanta volte al secondo non serve a niente
function posa() {
  if (mondoEl.value)
    mondoEl.value.style.transform = `translate3d(${-Math.round(cam.x * S)}px, ${-Math.round(cam.y * S)}px, 0)`
  if (eroeEl.value) {
    eroeEl.value.style.transform = `translate3d(${Math.round(io.x * CELLA * S)}px, ${Math.round(io.y * CELLA * S)}px, 0)`
    const c = cellaDiMe(), k = `${c.x},${c.y}`
    if (k !== ultimaCella) { ultimaCella = k; eroeEl.value.dataset.cella = k }
  }
  if (vista.value) vista.value.dataset.camera = `${Math.round(cam.x)},${Math.round(cam.y)}`
}

/* ═══════════ il fumetto ═══════════ */
const aperto = ref(null)            // { tipo: 'posto' | 'minatore' | 'cartello', p? }
const fumetto = ref(null)
const fumPos = ref(null)            // { left, top, sotto, coda } in pixel del mondo
const LARGO_FUM = 244

function apri(m) {
  if (m.tipo === 'mercante') { chiudi(); emit('bottega', m.chi.chiave); return }
  aperto.value = m
  fumPos.value = null
  // una discesa chiusa non si apre, ma ci si è andati: davanti all'ingresso si pianta il divieto
  if (m.tipo === 'posto' && !m.p.aperto && !divieti.value.has(m.p.nome)) {
    divieti.value = new Set([...divieti.value, m.p.nome])
    salva()
  }
  if (m.tipo === 'minatore' && !parlato.value) { parlato.value = true; salva() }
  nextTick(piazzaFumetto)
}
function chiudi() { aperto.value = null; fumPos.value = null }

// sopra la cosa, sotto se sopra non c'è posto; dentro lo schermo dove la vista si fermerà, e la vista scorre
// quanto basta per vederlo tutto
function piazzaFumetto() {
  const f = fumetto.value, m = aperto.value
  if (!f || !m) return
  const r = m.tipo === 'posto' ? m.p.riquadro
    : m.tipo === 'cartello' ? CARTELLO.riquadro
    : [DOVE_MINATORE.piede[0] * CELLA, DOVE_MINATORE.piede[1] * CELLA - 40, CELLA, 72]
  const w = Math.min(LARGO_FUM, vL - 16), h = f.offsetHeight
  const ax = (r[0] + r[2] / 2) * S
  const su = r[1] * S, giu = (r[1] + r[3]) * S
  const cima = mira.y * S + sopra
  const left = stringi(ax - w / 2, [mira.x * S + 8, mira.x * S + vL - w - 8])
  // l'eroe che aspetta ai piedi di un posto non deve finire sotto il fumetto (la scala sommersa: ci si ferma
  // sulla riva, quattro celle sotto i gradini): se il lato scelto lo copre, si prova l'altro, sempre che ci sia mappa
  const hx = io.x * CELLA * S, hy = io.y * CELLA * S
  const copre = t => left < hx + 24 && left + w > hx - 24 && t < hy + 3 && t + h > hy - 45
  const sopraT = su - h - 14, sottoT = giu + 14
  let sottoAlla = sopraT < cima + 6
  if (copre(sottoAlla ? sottoT : sopraT)) {
    const altro = !sottoAlla
    const t = altro ? sottoT : sopraT
    if (!copre(t) && (altro || t >= limiti().y[0] * S + sopra + 6)) sottoAlla = altro
  }
  const top = sottoAlla ? sottoT : sopraT
  fumPos.value = { left, top, w, sotto: sottoAlla, coda: stringi(ax - left, [16, w - 16]) }
  // la vista scorre se il fumetto esce: in cima sotto la carta, in fondo sopra la fascia
  const { y } = limiti()
  if (top < cima + 6) mira.y = stringi((top - sopra - 6) / S, y)
  else if (top + h > mira.y * S + vA - sotto - 6) mira.y = stringi((top + h - vA + sotto + 6) / S, y)
}

/* ═══════════ il dito ═══════════ */
let giu = null, strisciato = false
function premi(e) { giu = { x: e.clientX, y: e.clientY }; strisciato = false }
function muovi(e) {
  if (giu && Math.hypot(e.clientX - giu.x, e.clientY - giu.y) > SCARTO_DITO) strisciato = true
}

const segno = ref(null)
let nSegno = 0

// si agisce sul click, non sul pointerup: il click che il dito si lascia dietro è il tocco stesso
function toccaPrato(e) {
  if (strisciato || !vista.value) return
  if (e.target.closest && e.target.closest('.sot-terra-sopra > *, .sot-terra-sotto > *, [data-fumetto]')) return
  if (aperto.value) { chiudi(); return }
  const r = vista.value.getBoundingClientRect()
  const wx = (e.clientX - r.left) / S + cam.x, wy = (e.clientY - r.top) / S + cam.y
  const c = { x: Math.floor(wx / CELLA), y: Math.floor(wy / CELLA) }
  if (c.x < 0 || c.y < 0 || c.x >= L || c.y >= A) return
  if (vaiA(c)) {
    const fin = via.at(-1)
    segno.value = { n: ++nSegno, x: (fin ? fin.x : io.x) * CELLA * S, y: (fin ? fin.y : io.y) * CELLA * S }
  }
}

const vicino = (c, r = 1.5) => Math.hypot(io.x - (c.x + 0.5), io.y - (c.y + 0.5)) <= r
function verso(c, m) {
  if (strisciato) return
  if (!via.length && vicino(c)) return apri(m)
  vaiA(c, m)
}
const toccaPosto = p => verso(p.piede, { tipo: 'posto', p })
// al minatore ci si ferma accanto, non addosso: due figure nella stessa cella si mangiano a vicenda
const toccaMinatore = () => verso(cella(DOVE_MINATORE.accanto), { tipo: 'minatore' })
const toccaCartello = () => verso(cella(CARTELLO.piede), { tipo: 'cartello' })
// ai mercanti come al minatore: ci si ferma accanto, e arrivati si apre il banco
const toccaMercante = m => verso(m.accanto, { tipo: 'mercante', chi: m })

function scendi(p) {
  salva()
  emit('scendi', p.tappa || props.abisso)
}

/* ═══════════ chi indica la strada ═══════════ */
const prossima = computed(() => props.tappe.find(t => t.adesso) ||
  (props.abisso && !props.abisso.fondo ? props.abisso : null))
const postoDi = t => POSTI[POSTO_DI[t.abisso ? 'abisso' : t.chiave]]

const detto = computed(() => {
  const t = props.tappe.find(t => t.adesso)
  if (t) return `«${t.nome}: ${LUOGHI[POSTO_DI[t.chiave]]}. Segui i sassi che luccicano.»`
  if (props.abisso)
    return `«Le discese le hai fatte tutte. Resta l'abisso: ${LUOGHI[POSTO_DI.abisso]}.»`
  return '«Per ora le discese aperte le hai fatte tutte. Tornaci quando vuoi: là sotto cambia sempre.»'
})

const frecce = computed(() => FRECCE.map(f => {
  const nomi = f.posti.filter(n => trovati.value.has(n))
    .map(n => posti.value.find(p => p.nome === n).cosa.nome)
  return { verso: f.verso, detto: f.detto, nomi }
}))

// i sassi partono da dove sei quando arrivi sulla mappa: portano alla prossima, non tornano a casa
const sassi = ref([])
function semina() {
  const t = prossima.value
  if (!t) { sassi.value = []; return }
  const p = postoDi(t)
  const v = mondo.strada(cellaDiMe(), cella(p.piede)) || []
  sassi.value = sassiLungo(v, SASSI_OGNI).map((c, i) => ({
    i, x: (c.x + 0.5 + (dado(c.x, c.y, 5) - 0.5) * 0.6) * CELLA * S,
    y: (c.y + 0.5 + (dado(c.x, c.y, 6) - 0.5) * 0.6) * CELLA * S,
    ritardo: (dado(c.x, c.y, 7) * 2.4).toFixed(2),
  }))
}
watch(prossima, semina)

const minatoreVero = haFigura('minatore-fermo-0')   // quando arriva lo sprite (prompt 4), si usa quello
const ritrattoMinatore = minatoreVero ? figura('minatore-fermo-0', { scala: SCALA_EROE }) : null

/* ═══════════ si ricorda ═══════════ */
function salva() {
  const c = cellaDiMe()
  emit('terra', { nebbia: nebbiaInCodice(nebbia), dove: [c.x, c.y], parlato: parlato.value, divieti: [...divieti.value] })
}

let osserva = null
onMounted(() => {
  misura()
  seguiEroe(true)
  preparaNebbia()
  guarda()
  dipingiNebbia()
  semina()
  posa()
  prima = performance.now()
  raf = requestAnimationFrame(battito)
  // le carte in cima e in fondo cambiano altezza (la ripresa che sparisce): la vista lo deve sapere
  osserva = new ResizeObserver(() => { misura(); seguiEroe(); if (aperto.value) piazzaFumetto() })
  for (const el of [vista.value, sopraEl.value, sottoEl.value]) if (el) osserva.observe(el)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearTimeout(tAvviso)
  if (osserva) osserva.disconnect()
  salva()
})

const quadro = r => ({ left: r[0] * S + 'px', top: r[1] * S + 'px', width: r[2] * S + 'px', height: r[3] * S + 'px' })
// il pallino per terra davanti all'ingresso: al centro del bordo basso di `ingresso` (pixel della mappa).
// Sta sotto l'eroe, non nel bottone del posto: arrivato lì, l'eroe ci sta sopra
const pallino = p => {
  const [x, y, w, h] = p.ingresso, r = p.riquadro
  return { left: (x + w / 2) * S + 'px', top: Math.min(y + h, r[1] + r[3]) * S - 14 + 'px' }
}
// il divieto sta ai piedi dell'ingresso, spostato verso l'angolo sinistro: l'eroe aspetta al centro e non lo copre
const divieto = p => {
  const [x, y, w, h] = p.ingresso, r = p.riquadro
  return { left: (x + w * 0.05) * S + 'px', top: Math.min(y + h, r[1] + r[3]) * S + 'px' }
}
const nomeDi = p => p.cosa.nome
// una chiusa dice cosa la apre; quella chiusa per l'età non promette niente («finisci quella di prima» sarebbe falso)
const chiusaPerche = p => {
  if (p.abisso) return POZZO_VECCHIO.chiuso
  const d = prev(p.tappa.indice)
  if (p.tappa.perEta || !d) return 'Per ora non si scende.'
  return `Si apre quando finisci ${minuscolo(d.nome)}.`
}
</script>

<template>
  <div ref="vista" class="sot-terra" data-terra
       @pointerdown="premi" @pointermove="muovi" @click="toccaPrato">
    <div ref="mondoEl" class="sot-mondo" :style="{ width: LARGO * S + 'px', height: ALTO * S + 'px' }">
      <img class="sot-mappa" :src="MAPPA" alt="" draggable="false">

      <!-- le discese chiuse hanno il disegno pulito: un cartello di divieto, piantato davanti all'ingresso
           da quando ci si è andati e finché non si aprono -->
      <template v-for="p in posti" :key="'divieto-' + p.nome">
        <span v-if="!p.aperto && divieti.has(p.nome)" class="sot-divieto" :data-divieto="p.nome" :style="divieto(p)">
          <Pixel :figura="DIVIETO" :scala="2" />
        </span>
      </template>

      <span v-for="s in sassi" :key="'sasso-' + s.i" class="sot-sasso" data-sasso
            :style="{ left: s.x + 'px', top: s.y + 'px', '--ritardo': s.ritardo + 's' }">
        <Pixel :figura="SASSO" :scala="3" />
        <Pixel class="sot-luccica" :figura="LUCCICHIO" :scala="3" />
      </span>

      <button class="sot-minatore" data-minatore aria-label="il vecchio minatore"
              :style="{ left: (DOVE_MINATORE.piede[0] + 0.5) * CELLA * S + 'px',
                        top: (DOVE_MINATORE.piede[1] + 0.5) * CELLA * S + 'px' }"
              @click.stop="toccaMinatore">
        <span v-if="ritrattoMinatore" class="sot-ritratto" :style="ritrattoMinatore.gabbia">
          <i :style="ritrattoMinatore.pezzo"></i></span>
        <Pixel v-else :figura="MINATORE" :scala="SCALA_EROE" />
        <b v-if="!parlato" class="sot-tre-punti">…</b>
      </button>

      <button v-for="m in mercanti" :key="'mercante-' + m.chiave" class="sot-minatore sot-mercante"
              :class="{ 'sot-buio': !trovati.has(m.chiave) }" :data-mercante="m.chiave" :aria-label="m.nome"
              :tabindex="trovati.has(m.chiave) ? 0 : -1"
              :style="{ left: (m.piede.x + 0.5) * CELLA * S + 'px', top: (m.piede.y + 0.5) * CELLA * S + 'px' }"
              @click.stop="toccaMercante(m)">
        <span v-if="m.ritratto" class="sot-ritratto" :style="m.ritratto.gabbia"><i :style="m.ritratto.pezzo"></i></span>
        <Pixel v-else :figura="m.figura" :scala="SCALA_EROE" />
      </button>

      <template v-for="p in posti" :key="'pallino-' + p.nome">
        <span v-if="p.aperto && trovati.has(p.nome)" class="sot-segno-posto" :class="{ 'sot-adesso': p.adesso }"
              :data-pallino="p.nome" :style="pallino(p)"></span>
      </template>

      <div ref="eroeEl" class="sot-io-sopra" :class="{ 'sot-specchio': specchio }" data-eroe-terra
           :data-cammina="cammina ? 1 : 0">
        <span v-if="ritratto" class="sot-ritratto" :style="ritratto.gabbia"><i :style="ritratto.pezzo"></i></span>
      </div>

      <span v-if="segno" :key="'segno-' + segno.n" class="sot-segno"
            :style="{ left: segno.x + 'px', top: segno.y + 'px' }"></span>

      <canvas ref="nebbiaEl" class="sot-nebbia" :style="{ width: LARGO * S + 'px', height: ALTO * S + 'px' }"></canvas>

      <!-- i posti trovati si toccano; quelli ancora nel buio sono prato come il resto (`sot-buio` lascia passare
           il tocco), ma stanno nel DOM: le prove ci camminano incontro (test/aiuto/browser.mjs, scendiNelSotterraneo) -->
      <button v-for="p in posti" :key="'posto-' + p.nome" class="sot-posto"
              :class="{ 'sot-adesso': p.adesso, 'sot-chiusa': !p.aperto, 'sot-buio': !trovati.has(p.nome) }"
              :style="quadro(p.riquadro)" :data-posto="p.nome"
              :data-discesa="p.tappa ? p.tappa.indice : null" :data-abisso="p.abisso ? 1 : null"
              :data-aperta="p.aperto ? 1 : 0" :data-trovato="trovati.has(p.nome) ? 1 : 0"
              :aria-label="trovati.has(p.nome) ? nomeDi(p) : null" :aria-hidden="trovati.has(p.nome) ? null : 'true'"
              :tabindex="trovati.has(p.nome) ? 0 : -1"
              @click.stop="toccaPosto(p)">
      </button>
      <button class="sot-posto sot-cartello" :class="{ 'sot-buio': !trovati.has('cartello') }" data-cartello
              aria-label="il cartello" :style="quadro(CARTELLO.riquadro)" @click.stop="toccaCartello"></button>

      <div v-if="aperto" ref="fumetto" class="sot-fumetto" data-fumetto
           :class="{ 'sot-sotto': fumPos && fumPos.sotto, 'sot-tenue': aperto.tipo === 'posto' && !aperto.p.aperto }"
           :data-fumetto-di="aperto.tipo === 'posto' ? aperto.p.nome : aperto.tipo"
           :style="fumPos ? { left: fumPos.left + 'px', top: fumPos.top + 'px', width: fumPos.w + 'px', '--coda': fumPos.coda + 'px' }
                          : { visibility: 'hidden', left: '0px', top: '0px', width: LARGO_FUM + 'px' }"
           @click.stop>
        <template v-if="aperto.tipo === 'posto'">
          <b class="sot-fum-nome"><span v-if="!aperto.p.aperto" class="em">🔒</span>
            {{ aperto.p.cosa.nome }}</b>
          <i class="sot-fum-dritta">{{ aperto.p.cosa.dritta }}</i>
          <template v-if="aperto.p.aperto">
            <p v-if="aperto.p.tappa" class="sot-fum-conto em">
              🪜 {{ aperto.p.tappa.piani }} piani<template v-if="aperto.p.tappa.stelle"> · {{ '⭐'.repeat(aperto.p.tappa.stelle) }}</template>
            </p>
            <p v-else class="sot-fum-conto em" data-fondo>
              {{ aperto.p.cosa.fondo ? `il più giù: piano ${aperto.p.cosa.fondo}` : 'mai sceso' }}
            </p>
            <button class="sot-grosso" data-azione="scendi" @click="scendi(aperto.p)">
              <span class="em">🪜</span> {{ aperto.p.tappa && aperto.p.tappa.stelle ? 'ci torno giù' : 'scendo' }}
            </button>
          </template>
          <p v-else class="sot-fum-chiusa" data-chiusa-perche>{{ chiusaPerche(aperto.p) }}</p>
        </template>
        <template v-else-if="aperto.tipo === 'minatore'">
          <b class="sot-fum-nome">Il vecchio minatore</b>
          <p class="sot-fum-detto" data-detto>{{ detto }}</p>
        </template>
        <template v-else>
          <b class="sot-fum-nome">Il cartello</b>
          <p v-for="f in frecce" :key="f.verso" class="sot-fum-freccia">
            <b class="em">{{ f.verso }}</b> {{ f.detto }}<template v-if="f.nomi.length"><br><i>{{ f.nomi.join(' · ') }}</i></template>
          </p>
        </template>
      </div>
    </div>

    <div ref="sopraEl" class="sot-terra-sopra"><slot name="sopra" /></div>
    <div ref="sottoEl" class="sot-terra-sotto">
      <p v-if="avviso" class="sot-trovato" data-avviso-terra>{{ avviso }}</p>
      <p v-else-if="primaVolta" class="sot-trovato sot-piano">Tocca dove vuoi andare.</p>
      <slot name="sotto" />
    </div>
  </div>
</template>
