<script setup>
// Il mondo di sopra del Sotterraneo 3D: il mondo generato (motore/mondo-aperto.js, seme 19) disegnato in WebGL
// (scena3d/mondo/), al posto della terra dipinta (viste/Terra.vue, che resta del Sotterraneo di sempre). L'eroe cammina dove si
// tocca, i mercanti e chi dà le missioni stanno nelle città, i sette dungeon hanno i loro ingressi modellati, le pietre del
// viaggio si accendono con una domanda, la nebbia si apre camminando e si salva. Le stesse porte di Terra.vue verso
// Campagna.vue (`scendi`, `bottega`, `riprendi`, `sentito`, `cura`) più `mondo` (ricordati questo), `risposta` (la domanda di una
// pietra: le monete) e `veduta` (chiudi la veduta d'insieme). Le regole: docs/sotterraneo/terra-di-sopra.md, «Il mondo in 3D».
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, nextTick, markRaw } from 'vue'
import { PERSONAGGI, personaDi } from '../dati/missioni.js'
import { MERCANTI, mercanteDi } from '../dati/mercanti.js'
import { DUNGEON, CITTA } from '../dati/mondo-aperto.js'
import { segnoDi, GLIFO, chiAspetta, presePer, discesaDaSeguire, discesaDellaStoria } from '../motore/missioni.js'
import { apertura, scelte as scelteDi, risposta as rispostaDi, dopoLaPresa, dopoLaConsegna, novita as novitaDi,
         curaDi, mancaA, richiamoDi, dopoLaCura } from '../motore/dialoghi.js'
import { laStoria, dettoDelLivello } from '../motore/storia.js'
import { DETTI_DEL_COLORE, C_E_UNA_NOTIZIA } from '../dati/zone.js'
import { iconaDi } from '../dati/terra.js'
import { ilMondo, aperturaDi, terraDelMondo, chiusoPerche, postiDi, cittaInCella, regioneInCella, portaleDella, minatoreDi,
         nomeDellaPietra, difDellaPietra, pietraAccanto, meteDelViaggio, nebbiaInBase64, nebbiaDaBase64, mondoNuovo,
         frecceDelCartello, dungeonDi, VISTA_MONDO, PASSO_MONDO } from '../motore/mondo-sopra.js'
import { rettangoloPersona, rettangoloPosto, personaVicina, SCARTO_DITO } from '../scena3d/mondo/dito.js'
import { domandaPerGioco } from '../../../quiz/scelta.js'
import Domanda from '../../../quiz/Domanda.vue'
import Dialogo from './Dialogo.vue'
import Foglio from './Foglio.vue'
import FumettoMondo from './FumettoMondo.vue'
import { RITMO } from '../dati/pensieri.js'

const props = defineProps({
  tappe: { type: Array, required: true },
  abisso: { type: Object, default: null },
  eroe: { type: Object, required: true },
  mondo: { type: Object, default: null },     // { nebbia, dove, giro, pietre, parlato, divieti, novita } dell'avventura, o null la prima volta
  giaScesa: { type: Number, default: null },
  portale: { type: Object, default: null },   // la sosta lasciata dal portale: { tappa, nome, piano, immagine }
  roba: { type: Object, default: null },
  missioni: { type: Object, default: () => ({}) },
  azioneMissione: { type: Function, default: null },
  segui: { type: String, default: null },
  annuncio: { type: Object, default: null },
  forze: { type: Object, default: null },
  veduta: { type: Boolean, default: false },  // la veduta d'insieme, dalla casella «mappa grande» della barra
  pensiero: { type: Object, default: null },  // il pensiero dell'eroe sopra la testa (docs/sotterraneo/pensieri.md), come in Terra.vue
})
// `pensa`, `pensiero`, `pensiero-fine`, `trovati`: lo stesso contratto dei pensieri di viste/Terra.vue
const emit = defineEmits(['scendi', 'mondo', 'bottega', 'riprendi', 'sentito', 'cura', 'risposta', 'veduta', 'pensa', 'pensiero', 'pensiero-fine', 'trovati'])
const minuscolo = s => s.charAt(0).toLowerCase() + s.slice(1)
const RAGGIO_SALUTO = 6, RAGGIO_RIARMO = 9, DURATA_SALUTO = 1.4

/* ═══════════ il mondo e chi ci sta (non reattivi: si leggono e basta) ═══════════ */
let m = null, terra = null, nebbia = null, scena = null
const pronto = ref(false), perso = ref(false)
const ap = computed(() => aperturaDi(props.tappe))
const io = { x: 0, z: 0 }
let via = [], meta = null
const cammina = ref(false)

// i bersagli del dito (e dei test): uno per persona, posto e cosa toccabile, col rettangolo a schermo scritto a ogni fotogramma
const bersagli = shallowRef([])
const elementi = new Map()
const persone = []        // per il disegno: { chiave, pezzo, fermo, saluto, x, z, specchio }
const trovati = ref(new Set())
const parlato = ref(false), divieti = ref(new Set()), ascoltate = ref({}), accese = ref(new Set())
let giro = 0

const tappaDi = chiave => props.tappe.find(t => t.chiave === chiave) || null
// un ingresso (il bersaglio, `k` la chiave della discesa): il dungeon coi nomi nuovi, la sua tappa, se è aperto
const datoDelPosto = b => {
  const d = dungeonDi(b.k), t = tappaDi(b.k), abisso = b.k === 'abisso'
  return { d, t, abisso, aperto: abisso ? !!props.abisso : !!(t && t.aperta) }
}

function preparaBersagli() {
  const l = [], piede = p => ({ x: p.piede.x, y: p.piede.y })
  const persona = (tipo, k, p, extra) => l.push({ chiave: `${tipo}:${p.citta || ''}:${k}`, tipo: 'persona', ruolo: tipo, k, citta: p.citta || null,
    piede: piede(p), accanto: { ...p.accanto }, alto: 2.2, ...extra })
  for (const p of postiDi(m, 'mercante')) { const me = mercanteDi(p.chiave); if (me) persona('mercante', p.chiave, p, { nome: me.nome, sprite: me.sprite }) }
  for (const p of [...m.persone, ...m.citta.flatMap(c => c.persone)]) if (PERSONAGGI[p.chiave]) persona('personaggio', p.chiave, p, { nome: PERSONAGGI[p.chiave].nome, sprite: PERSONAGGI[p.chiave].sprite })
  const mi = minatoreDi(m, ap.value.finite)
  if (mi) persona('minatore', 'minatore', mi, { nome: 'il vecchio minatore', sprite: 'minatore' })
  const posto = (tipo, p, extra) => l.push({ chiave: `${tipo}:${p.chiave}`, tipo: tipo === 'cartello' || tipo === 'bacheca' ? 'cosa' : 'posto', ruolo: tipo, k: p.chiave,
    citta: p.citta || null, lotto: { x: p.x, y: p.y, w: p.w, h: p.h }, accanto: { ...p.accanto }, piede: piede(p), alto: 2.4, ...extra })
  for (const p of postiDi(m, 'ingresso')) posto('ingresso', p, { alto: p.monumento === 'torre' ? 4.8 : p.monumento === 'botola' ? 1.6 : 3.2, monumento: p.monumento })
  for (const p of postiDi(m, 'pietra')) posto('pietra', p, { alto: 1.6 })
  for (const p of postiDi(m, 'cartello')) posto('cartello', p, { alto: 1.7 })
  for (const p of postiDi(m, 'bacheca')) posto('bacheca', p, { alto: 2.1 })
  if (props.portale) {
    const p = portaleDella(m, props.portale.tappa, terra)
    if (p) posto('portale', p, { alto: 1.9 })
  }
  for (const q of m.passaggi) if (q.conGrata && !ap.value.aperto(q)) {
    const c = q.centro || q.celle[Math.floor(q.celle.length / 2)], r = q.rive[0]
    l.push({ chiave: `grata:${q.id}`, tipo: 'posto', ruolo: 'grata', k: q.id, q, lotto: { x: c.x - 1, y: c.y - 1, w: 3, h: 3 },
      accanto: terra.arrivo(m.partenza, r) || r, piede: { x: c.x, y: c.y }, alto: 3 })
  }
  bersagli.value = markRaw(l)
  persone.length = 0
  for (const b of l) if (b.tipo === 'persona') persone.push({ chiave: b.chiave, fermo: `${b.sprite}-fermo-0`, saluto: `${b.sprite}-saluta-0`, pezzo: `${b.sprite}-fermo-0`, x: b.piede.x + 0.5, z: b.piede.y + 0.5, specchio: false })
}
const cellaDelBersaglio = b => (b.lotto ? { x: Math.floor(b.lotto.x + b.lotto.w / 2), y: Math.floor(b.lotto.y + b.lotto.h / 2) } : b.piede)
const visto = c => nebbia[c.y * m.W + c.x] === 1

/* ═══════════ la nebbia, la partenza, il salvataggio ═══════════ */
function prepara() {
  m = markRaw(ilMondo())
  terra = markRaw(terraDelMondo(m, ap.value.aperto))
  const s = props.mondo || {}
  nebbia = nebbiaDaBase64(s.nebbia, m.W, m.H)
  let primeAccese = []
  if (!nebbia) { const n = mondoNuovo(m, terra, props.tappe); nebbia = n.nebbia; primeAccese = n.pietre }
  accese.value = new Set([...(Array.isArray(s.pietre) ? s.pietre : []), ...primeAccese])
  parlato.value = !!s.parlato
  ascoltate.value = { ...(s.novita || {}) }
  giro = s.giro || 0
  preparaBersagli()
  divieti.value = new Set((Array.isArray(s.divieti) ? s.divieti : []).filter(k => { const b = bersagli.value.find(x => x.chiave === `ingresso:${k}`); return b && !datoDelPosto(b).aperto }))
  // dove si era; salendo dal portale accanto al gemello, nella città che serve quel dungeon
  const d = s.dove
  let qui = m.partenza
  const portale = bersagli.value.find(b => b.ruolo === 'portale')
  if (d && d.portale && portale) qui = portale.accanto
  else if (d && Number.isInteger(d.x) && terra.passa(d.x, d.y)) qui = d
  io.x = qui.x + 0.5; io.z = qui.y + 0.5
  trovati.value = new Set(bersagli.value.filter(b => visto(cellaDelBersaglio(b))).map(b => b.chiave))
}
let sporca = false, ultimoSalvato = 0
function salva() {
  if (!m) return
  sporca = false; ultimoSalvato = tempo
  emit('mondo', { nebbia: nebbiaInBase64(nebbia), dove: { x: Math.floor(io.x), y: Math.floor(io.z) }, giro, pietre: [...accese.value],
                  parlato: parlato.value, divieti: [...divieti.value], novita: ascoltate.value })
}

/* ═══════════ il passo: l'eroe cammina, guarda, chi sta fermo saluta ═══════════ */
const cellaDiMe = () => ({ x: Math.floor(io.x), y: Math.floor(io.z) })
const verso = { dx: 0, dy: 1 }
let tempo = 0, ultimaCella = -1, regioneOra = null, cittaOra = null
function vaiA(c, cosa = null) {
  let da = cellaDiMe()
  if (!terra.passa(da.x, da.y)) { const s = terra.arrivo(m.partenza, da); if (s) { io.x = s.x + 0.5; io.z = s.y + 0.5; da = s } }
  const arrivo = terra.arrivo(da, c)
  if (!arrivo) return false
  const strada = terra.strada(da, arrivo) || []
  via = terra.liscia(da, strada).map(p => ({ x: p.x + 0.5, z: p.y + 0.5 }))
  meta = cosa
  primaVolta.value = false
  if (!via.length) arriva()
  else cammina.value = true
  return true
}
function arriva() {
  cammina.value = false
  salva()
  const q = meta
  meta = null
  if (q) apri(q)
}
function passo(dt, t) {
  tempo = t
  if (via.length) {
    let resta = PASSO_MONDO * dt
    while (resta > 0 && via.length) {
      const q = via[0], dx = q.x - io.x, dz = q.z - io.z, d = Math.hypot(dx, dz)
      if (d > 0.01) { verso.dx = dx / d; verso.dy = dz / d }
      if (d <= resta) { io.x = q.x; io.z = q.z; via.shift(); resta -= d } else { io.x += dx / d * resta; io.z += dz / d * resta; resta = 0 }
    }
    if (!via.length) arriva()
  }
  const k = Math.floor(io.z) * m.W + Math.floor(io.x)
  if (k !== ultimaCella) { ultimaCella = k; guarda() }
  salutaChiPassa(t)
  pensaDaFermo(dt)
  if (sporca && t - ultimoSalvato > 3) salva()
  const S = scena.S
  S.io.x = io.x; S.io.z = io.z; S.io.verso = verso
  for (const q of persone) { q.pezzo = salutano.value.has(q.chiave) ? q.saluto : q.fermo; q.specchio = io.x < q.x - 0.2 }
}
// le celle nuove attorno all'eroe: si trova quello che ci sta, si annuncia la regione, si conta il giro delle città
function guarda() {
  const nuove = scena.scopri(io.x, io.z, VISTA_MONDO)
  if (nuove.length) {
    sporca = true
    const nuovi = bersagli.value.filter(b => !trovati.value.has(b.chiave) && visto(cellaDelBersaglio(b)))
    if (nuovi.length) {
      trovati.value = new Set([...trovati.value, ...nuovi.map(b => b.chiave)])
      const ing = nuovi.find(b => b.ruolo === 'ingresso')
      if (ing) { const d = datoDelPosto(ing); dillo(d.aperto ? `Hai trovato ${minuscolo(d.d.nome)}!` : `Hai trovato ${minuscolo(d.d.nome)}. Sbarrata, per ora.`) }
      else if (nuovi.some(b => b.ruolo === 'pietra')) dillo('Una pietra del viaggio: toccala per accenderla.')
    }
  }
  const c = cellaDiMe(), citta = cittaInCella(m, c.x, c.y), r = regioneInCella(m, c.x, c.y)
  if (citta !== cittaOra) { if (citta && cittaOra === null && ultimaCella >= 0 && tempo > 1) { giro++; sporca = true } cittaOra = citta }
  if (r && r !== regioneOra) { if (regioneOra && !avviso.value) dillo(citta ? citta.nome : r.nome); regioneOra = r }
}

const salutano = ref(new Set())
const fineSaluto = new Map(), vicini = new Set()
function saluta(chiave, adesso) {
  fineSaluto.set(chiave, adesso + DURATA_SALUTO)
  if (!salutano.value.has(chiave)) salutano.value = new Set([...salutano.value, chiave])
}
function salutaChiPassa(adesso) {
  for (const b of bersagli.value) {
    if (b.tipo !== 'persona' || !trovati.value.has(b.chiave)) continue
    const d = Math.hypot(io.x - (b.piede.x + 0.5), io.z - (b.piede.y + 0.5))
    if (d <= RAGGIO_SALUTO && !vicini.has(b.chiave)) { vicini.add(b.chiave); saluta(b.chiave, adesso) }
    else if (d > RAGGIO_RIARMO) vicini.delete(b.chiave)
  }
  for (const [k, fine] of fineSaluto) if (adesso >= fine) { fineSaluto.delete(k); salutano.value = new Set([...salutano.value].filter(x => x !== k)) }
}

/* ═══════════ i pensieri dell'eroe (docs/sotterraneo/pensieri.md): come sulla terra dipinta (viste/Terra.vue, pensaDaFermo) ═══════════ */
let fermoDa = 0, prossimaDomanda = 0, pensieroDa = null
const pensieroEl = ref(null)
function pensaDaFermo(dt) {
  const occupato = cammina.value || !!dialogo.value || !!aperto.value || !!avviso.value || !!domandaPietra.value || props.veduta
  if (props.pensiero) {
    if (pensieroDa == null) pensieroDa = tempo
    if (occupato || tempo - pensieroDa >= RITMO.dura) { pensieroDa = null; emit('pensiero-fine') }
    fermoDa = 0
    return
  }
  pensieroDa = null
  fermoDa = occupato ? 0 : fermoDa + dt
  if (fermoDa >= RITMO.primoSopra && tempo >= prossimaDomanda) { prossimaDomanda = tempo + RITMO.ogni; emit('pensa') }
}
// i mercanti già visti (in una città qualsiasi): un pensiero non porta da chi non si conosce
watch(() => [...new Set(bersagli.value.filter(b => b.ruolo === 'mercante' && trovati.value.has(b.chiave)).map(b => b.k))].sort().join(','),
      v => emit('trovati', v ? v.split(',') : []), { immediate: true })
function toccaPensiero() { if (props.pensiero && props.pensiero.segno) emit('pensiero', props.pensiero) }
// il tocco su un pensiero che porta a un mercante: l'eroe va accanto al più vicino già trovato, senza aprire niente
function vaDaMercante(k) {
  const b = bersagli.value.filter(x => x.ruolo === 'mercante' && x.k === k && trovati.value.has(x.chiave))
    .sort((a, c) => Math.hypot(a.piede.x - io.x, a.piede.y - io.z) - Math.hypot(c.piede.x - io.x, c.piede.y - io.z))[0]
  if (b) { chiudi(); chiudiDialogo(); vaiA(b.accanto) }
}
// sopra la testa dell'eroe, dentro la vista; sotto i piedi se sopra non c'è posto (come giù in Gioco.vue)
function piazzaPensiero() {
  const f = pensieroEl.value
  const y = scena.quota(io.x, io.z)
  scena.aSchermo(io.x, y + 2.3, io.z, pt); scena.aSchermo(io.x, y, io.z, pt2)
  const w = f.offsetWidth, h = f.offsetHeight
  const left = Math.round(Math.max(6, Math.min(vL - w - 6, pt.x - w / 2)))
  let top = Math.round(pt.y - h - 8), sottoIPiedi = false
  if (top < sopra + 6) { top = Math.round(pt2.y + 12); sottoIPiedi = true }
  f.style.transform = `translate(${left}px, ${top}px)`
  f.style.setProperty('--coda', Math.round(Math.max(14, Math.min(w - 14, pt.x - left))) + 'px')
  if ((f.dataset.sotto === '1') !== sottoIPiedi) f.dataset.sotto = sottoIPiedi ? '1' : '0'
}

const avviso = ref(''), primaVolta = ref(!props.mondo)
let tAvviso = 0
function dillo(s) { avviso.value = s; clearTimeout(tAvviso); tAvviso = setTimeout(() => { avviso.value = '' }, 2600) }

/* ═══════════ il disegno della scena: cosa c'è adesso ═══════════ */
const storia = computed(() => laStoria(props.tappe))
function aggiornaScena() {
  if (!scena) return
  const S = scena.S
  S.persone = persone
  S.accese = accese.value
  S.divieti = divieti.value
  S.portale = (() => { const b = bersagli.value.find(x => x.ruolo === 'portale'); return b ? { x: b.piede.x + 0.5, z: b.piede.y + 0.5 } : null })()
  S.pallini = new Map()
  for (const b of bersagli.value) if (b.ruolo === 'ingresso' && trovati.value.has(b.chiave)) {
    const d = datoDelPosto(b)
    if (d.aperto && !d.abisso) S.pallini.set(b.k, { colore: d.t && d.t.colore, adesso: !!(d.t && (d.t.adesso || d.t.nuova)) })
  }
  S.grate = new Map(m.passaggi.filter(q => q.conGrata).map(q => [q.id, ap.value.aperto(q)]))
  S.io.sprite = props.eroe.sprite || 'cavaliere'
  S.io.mano = props.roba ? props.roba.mano : null; S.io.mancina = props.roba ? props.roba.mancina : null
  S.veduta = props.veduta
  // davanti a una discesa rossa sta la sentinella (docs/sotterraneo/zone.md)
  const sentinelle = bersagli.value.filter(b => b.ruolo === 'ingresso' && trovati.value.has(b.chiave) && (datoDelPosto(b).t || {}).colore === 'rosso')
  S.persone = [...persone, ...sentinelle.map(b => ({ pezzo: 'guardia-fermo-0', x: b.lotto.x + 0.3, z: b.lotto.y + b.lotto.h + 0.6 }))]
}

/* ═══════════ il fumetto ═══════════ */
const aperto = ref(null)             // il bersaglio col fumetto aperto
const fumetto = ref(null)
const LARGO_FUM = 244
const ctx = () => ({ stati: props.missioni, tappe: props.tappe, abisso: !!props.abisso, eroe: props.eroe.chiave,
                     roba: props.roba, annuncio: props.annuncio, novita: ascoltate.value, forze: props.forze })
const livelloDi = t => (t && !t.fatta && props.roba ? dettoDelLivello(props.eroe.chiave, props.roba, t, t.indice) : null)
function rigaStoria(t) {
  const s = storia.value, porta = t && s.porte.find(x => x.chiave === t.chiave)
  if (!porta || s.finita || !t.aperta) return null
  if (porta.fatta) return { stato: 'chiusa', testo: `la porta è chiusa: ${porta.grosso} è caduto.` }
  if (s.corrente && s.corrente.chiave === porta.chiave && !s.corrente.ferma) return { stato: 'adesso', testo: `continua qui, in fondo aspetta ${porta.grosso}.` }
  return null
}
function chiusaPerche(d) {
  if (d.abisso) return 'Si apre quando hai finito tutte le discese.'
  const prima = DUNGEON.find(x => x.indice === d.t.indice - 1)
  if (d.t.perEta || !prima) return 'Per ora non si scende.'
  const g = storia.value.porte[d.t.indice - 1]
  return g && g.grosso ? `Si apre quando batti ${g.grosso} in fondo ${minuscolo(prima.nome).replace(/^(la|le|il|i) /, (a, x) => ({ la: 'alla ', le: 'alle ', il: 'al ', i: 'ai ' })[x])}.`
    : `Si apre quando finisci ${minuscolo(prima.nome)}.`
}
const fumettoDati = computed(() => {
  const b = aperto.value
  if (!b) return null
  if (b.ruolo === 'ingresso') {
    const d = datoDelPosto(b), t = d.t, colore = t && t.colore
    const lv = livelloDi(t), dettoCol = colore === 'arancio' && lv ? null : DETTI_DEL_COLORE[colore] || null
    return { tipo: 'posto', nome: d.d.nome, dritta: d.abisso ? 'dicono che non abbia fondo' : (t && t.dritta) || '', aperto: d.aperto, tappa: d.abisso ? null : t,
             fondo: d.abisso && props.abisso ? props.abisso.fondo : 0, storia: rigaStoria(t), prese: t ? presePer(props.missioni, t.chiave) : [],
             livello: lv, detto: dettoCol, colore, perche: d.aperto ? null : chiusaPerche(d) }
  }
  if (b.ruolo === 'pietra') return { tipo: 'pietra', nome: nomeDellaPietra(b.k), mete: meteDelViaggio(m, b.k, [...accese.value]) }
  if (b.ruolo === 'portale') return { tipo: 'portale', ...props.portale }
  if (b.ruolo === 'bacheca') return { tipo: 'bacheca' }
  if (b.ruolo === 'grata') return { tipo: 'grata', nome: b.q.nome || 'Il passaggio', perche: chiusoPerche(b.q, ap.value) }
  if (b.ruolo === 'cartello') {
    const frecce = frecceDelCartello(m, b.citta).map(x => ({ ...x,
      detto: x.citta.length ? `verso ${x.citta.map(c => minuscolo(CITTA.find(y => y.chiave === c).nome)).join(' e ')}` : x.posti.length ? 'verso le terre oltre il fiume' : 'verso i campi e le valli',
      nomi: x.posti.filter(k => trovati.value.has(`ingresso:${k}`)).map(k => dungeonDi(k).nome) }))
    return { tipo: 'cartello', frecce }
  }
  return null
})
function apri(b) {
  if (b.tipo === 'persona') return parla(b)
  chiudiDialogo()
  aperto.value = b
  if (b.ruolo === 'ingresso') {
    const d = datoDelPosto(b)
    if (!d.aperto && !divieti.value.has(b.k)) { divieti.value = new Set([...divieti.value, b.k]); salva() }
    if (d.aperto) scena.S.aperti = new Set([b.k])
  }
  if (b.ruolo === 'pietra' && !accese.value.has(b.k)) { aperto.value = null; return chiediLaPietra(b) }
  aggiornaScena()
}
function chiudi() { aperto.value = null; if (scena) scena.S.aperti = new Set() }

/* ═══════════ la pietra: si accende con una domanda (una volta), poi si viaggia gratis ═══════════ */
const domandaPietra = ref(null)
let ultimoModulo = null
function chiediLaPietra(b) {
  try {
    const q = domandaPerGioco({ difficolta: difDellaPietra(m, b.k), evita: ultimoModulo })
    if (!q || !q.domanda) throw new Error('nessun modulo')
    ultimoModulo = q.modulo
    domandaPietra.value = { b, q }
  } catch (e) { accendi(b) }   // senza moduli di quiz non si blocca nessuno davanti a una pietra
}
function accendi(b) {
  accese.value = new Set([...accese.value, b.k])
  salva(); aggiornaScena()
  dillo('La runa si accende: da qui puoi viaggiare alle altre pietre accese.')
  aperto.value = b
}
function rispostoPietra({ giusto, saltata }) {
  const d = domandaPietra.value
  domandaPietra.value = null
  emit('risposta', { giusto, saltata })
  if (giusto && d) accendi(d.b)
  else dillo('La pietra resta spenta. Si riprova quando vuoi: non si perde niente.')
}
const lampo = ref(0)
function viaggia(chiave) {
  const p = postiDi(m, 'pietra').find(x => x.chiave === chiave)
  if (!p || !accese.value.has(chiave)) return
  chiudi()
  via = []; meta = null; cammina.value = false
  io.x = p.accanto.x + 0.5; io.z = p.accanto.y + 0.5
  scena.salta()
  lampo.value++
  ultimaCella = -1
  salva()
  dillo(nomeDellaPietra(chiave).replace(/^La pietra /, 'Sei alla pietra '))
}

/* ═══════════ il dialogo (motore/dialoghi.js), come sulla terra dipinta ═══════════ */
const dialogo = ref(null)
let giri = 0
const chiParla = k => (personaDi(k) || mercanteDi(k) || { nome: '' }).nome
function parla(b) {
  chiudi()
  const chi = b.k
  saluta(b.chiave, tempo); vicini.add(b.chiave)
  const prima = chi === 'minatore' && !parlato.value
  if (prima) { parlato.value = true; salva() }
  if (chi === 'minatore' && props.annuncio && !props.annuncio.sentita) { avviso.value = ''; emit('sentito') }
  dialogo.value = { chi, nome: chiParla(chi), pagine: apertura(chi, ctx(), { primaVolta: prima }), giro: ++giri, chieste: new Set(chi === 'minatore' ? ['strada'] : []) }
}
function chiudiDialogo() { dialogo.value = null }
const fiocco = ref(null)
const richiamo = chi => (dialogo.value && dialogo.value.chi === chi ? null : richiamoDi(chi, props.forze))
const scelteDelDialogo = computed(() => (dialogo.value ? scelteDi(dialogo.value.chi, ctx(), dialogo.value.chieste) : []))
function rispondi(pagine, chieste) { const d = dialogo.value; if (d && pagine.length) dialogo.value = { ...d, pagine, giro: ++giri, chieste } }
async function scegli(s) {
  const d = dialogo.value
  if (!d) return
  const chieste = new Set(d.chieste)
  if (s.che !== 'strada') chieste.delete('strada')
  if (s.che === 'ciao') return chiudiDialogo()
  if (s.che === 'bottega' || s.che === 'vendi') { chiudiDialogo(); emit('bottega', d.chi, s.che === 'vendi' ? 'vendi' : null); return }
  if (s.che === 'cura') {
    const manca = mancaA(d.chi, props.forze)
    chieste.add('cura')
    if (manca > 0) { emit('cura', curaDi(d.chi).risorsa); fiocco.value = { n: ++giri, testo: `+${manca}`, risorsa: curaDi(d.chi).risorsa } }
    return rispondi(dopoLaCura(d.chi, manca), chieste)
  }
  if (s.che === 'novita') {
    const n = novitaDi(d.chi, ctx(), ascoltate.value[d.chi])
    ascoltate.value = { ...ascoltate.value, [d.chi]: n.visto }
    salva(); chieste.add('novita')
    return rispondi(n.pagine, chieste)
  }
  if (s.che === 'strada' || s.che === 'racconta') { chieste.add(s.che); return rispondi(rispostaDi(d.chi, s.che, ctx()), chieste) }
  const e = props.azioneMissione ? props.azioneMissione(s.missione, s.che === 'prendi' ? 'prendi' : 'consegna') : null
  if (s.che === 'prendi' && e === 'presa') return rispondi(dopoLaPresa(d.chi, s.missione), chieste)
  if (s.che === 'consegna' && e) { await nextTick(); rispondi(dopoLaConsegna(d.chi, s.missione, e, ctx()), chieste) }
}
const segnoSopra = b => (b.ruolo === 'minatore' || b.ruolo === 'personaggio' ? segnoDi(b.k, props.missioni, props.tappe) : null)

/* ═══════════ il dito ═══════════ */
const vista = ref(null), tela = ref(null), sopraEl = ref(null), sottoEl = ref(null)
let giu = null, strisciato = false, ultimoTrascina = 0
function premi(e) { if (e.pointerType === 'mouse' && e.button !== 0) return; giu = { x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' }; strisciato = false }
function muovi(e) {
  if (!giu || (giu.mouse && !(e.buttons & 1))) return
  if (!strisciato && Math.hypot(e.clientX - giu.x, e.clientY - giu.y) > SCARTO_DITO) strisciato = true
  if (!strisciato || props.veduta || dialogo.value || domandaPietra.value) return
  // trascinando l'eroe insegue il dito (il mouse solo a tasto premuto)
  const t = performance.now()
  if (t - ultimoTrascina < 110) return
  ultimoTrascina = t
  const p = puntoDi(e.clientX, e.clientY)
  if (p.x >= 0) { chiudi(); vaiA({ x: Math.floor(p.x), y: Math.floor(p.z) }) }
}
function lascia() { giu = null }
const puntoDi = (cx, cy) => { const r = tela.value.getBoundingClientRect(); return scena.aTerra(cx - r.left, cy - r.top) }
const segno = ref(null)
let nSegno = 0
// un tocco sul prato: chiude quello che è aperto e cammina; vicino ai piedi di qualcuno è un tocco su di lui
function toccaPrato(e) {
  if (strisciato || !scena || !pronto.value) return
  if (e.target.closest && e.target.closest('.sot-terra-sopra > *, .sot-terra-sotto > *, [data-fumetto], .sot-foglio')) return
  if (aperto.value) chiudi()
  chiudiDialogo()
  avviso.value = ''
  const p = puntoDi(e.clientX, e.clientY)
  if (p.x < 0) return
  if (props.veduta) emit('veduta', false)
  else {
    const vicino = personaVicina(p, bersagli.value.filter(b => b.tipo === 'persona' && trovati.value.has(b.chiave)))
    if (vicino) return tocca(vicino)
  }
  if (vaiA({ x: Math.floor(p.x), y: Math.floor(p.z) })) {
    const fin = via.at(-1) || { x: io.x, z: io.z }
    segno.value = { n: ++nSegno, x: fin.x, z: fin.z }
  }
}
// un tocco su un bersaglio: l'eroe ci va, e arrivato si apre la sua cosa (un tocco nuovo annulla la meta di prima)
function tocca(b) {
  if (strisciato) return
  chiudiDialogo()
  if (props.veduta) {
    emit('veduta', false)
    // dalla veduta, una pietra accesa è il viaggio se si sta accanto a una pietra accesa
    const qui = pietraAccanto(m, io.x, io.z)
    if (b.ruolo === 'pietra' && accese.value.has(b.k) && qui && accese.value.has(qui.chiave) && qui.chiave !== b.k) return viaggia(b.k)
    if (b.ruolo === 'pietra' && accese.value.has(b.k)) dillo('Per viaggiare vai a una pietra accesa, e da lì tocca questa.')
  }
  const vicino = Math.hypot(io.x - (b.accanto.x + 0.5), io.z - (b.accanto.y + 0.5)) <= 1.5
  if (!via.length && vicino) return apri(b)
  if (aperto.value && aperto.value !== b) chiudi()
  vaiA(b.accanto, b)
}
function toccaNome(n) { const b = bersagli.value.find(x => x.chiave === n.bersaglio); if (b) tocca(b); else if (n.x != null) { emit('veduta', false); vaiA({ x: Math.floor(n.x), y: Math.floor(n.z) }) } }
function scendi() {
  const b = aperto.value
  const d = b && datoDelPosto(b)
  salva()
  if (d) emit('scendi', d.abisso ? props.abisso : d.t)
}
function giuDalPortale() { salva(); emit('riprendi') }
function rotella(e) { if (!scena) return; e.preventDefault(); scena.zoom = scena.zoom * (e.deltaY > 0 ? 1.08 : 0.92) }

// il diario manda l'eroe da chi aspetta, o ai piedi di un ingresso; il tocco che ha chiuso un pannello passa qui
function vaDa(chiave) {
  const b = bersagli.value.find(x => (x.ruolo === 'minatore' && chiave === 'minatore') || (x.ruolo === 'personaggio' && x.k === chiave) || (x.ruolo === 'ingresso' && x.k === chiave))
  if (b) tocca(b)
}
async function toccoDaFuori(x, y) {
  await nextTick()
  const el = document.elementFromPoint(x, y)
  if (!el || !vista.value || !vista.value.contains(el)) return
  if (el.closest('.sot-terra-sopra > *, .sot-terra-sotto > *, [data-fumetto]')) return
  strisciato = false
  const b = el.closest('[data-bersaglio]')
  if (b) b.click(); else toccaPrato({ target: el, clientX: x, clientY: y })
}
defineExpose({ vaDa, toccoDaFuori, vaDaMercante })

/* ═══════════ dopo ogni fotogramma: i bersagli, il fumetto, i nomi della veduta e le bussole, scritti nel DOM ═══════════ */
let vL = 0, vA = 0, sopra = 0, sotto = 0
const pt = { x: 0, y: 0, davanti: true }, pt2 = { x: 0, y: 0, davanti: true }
const eroeEl = ref(null), segnoEl = ref(null), fumEl = ref(null)
const nomiEl = new Map()
function posa(el, r) {
  const x = Math.round(r.x), y = Math.round(r.y), w = Math.round(r.w), h = Math.round(r.h)
  if (el._x !== x || el._y !== y) { el._x = x; el._y = y; el.style.transform = `translate(${x}px, ${y}px)` }
  if (el._w !== w || el._h !== h) { el._w = w; el._h = h; el.style.width = w + 'px'; el.style.height = h + 'px' }
}
const mostraEl = (el, si) => { const v = si ? '1' : '0'; if (el.dataset.vis !== v) el.dataset.vis = v }
function rettangoloDi(b) {
  if (b.tipo === 'persona') {
    const x = b.piede.x + 0.5, z = b.piede.y + 0.5, y = scena.quota(x, z)
    scena.aSchermo(x, y, z, pt); scena.aSchermo(x, y + b.alto, z, pt2)
    if (!pt.davanti) return null
    const r = rettangoloPersona(pt.x, pt.y, pt2.x, pt2.y)
    r.testa = pt2.y - r.y   // dove sta la testa nel rettangolo: lì sopra il segno («!», «…»)
    return r
  }
  const l = b.lotto, y = scena.quota(l.x + l.w / 2, l.y + l.h / 2), punti = []
  for (const [x, z, h] of [[l.x, l.y + l.h, 0], [l.x + l.w, l.y + l.h, 0], [l.x, l.y, b.alto], [l.x + l.w, l.y, b.alto]]) { scena.aSchermo(x, y + h, z, pt); if (!pt.davanti) return null; punti.push([pt.x, pt.y]) }
  return rettangoloPosto(punti)
}
let prossimeBussole = 0
function dopo() {
  const veduta = props.veduta
  for (const b of bersagli.value) {
    const el = elementi.get(b.chiave)
    if (!el) continue
    const r = trovati.value.has(b.chiave) && (!veduta || b.ruolo === 'pietra') ? rettangoloDi(b) : null
    const dentro = r && r.x + r.w > 0 && r.x < vL && r.y + r.h > sopra && r.y < vA - sotto
    mostraEl(el, dentro && !veduta)
    if (dentro) {
      posa(el, r)
      if (r.testa != null) { const t = Math.round(r.testa); if (el._t !== t) { el._t = t; el.style.setProperty('--testa', t + 'px') } }
    }
  }
  if (eroeEl.value) {
    const c = cellaDiMe(), k = `${c.x},${c.y}`
    if (eroeEl.value.dataset.cella !== k) eroeEl.value.dataset.cella = k
    scena.aSchermo(io.x, scena.quota(io.x, io.z), io.z, pt)
    const s = `${Math.round(pt.x)},${Math.round(pt.y)}`
    if (eroeEl.value.dataset.schermo !== s) eroeEl.value.dataset.schermo = s
  }
  if (segno.value && segnoEl.value) { scena.aSchermo(segno.value.x, scena.quota(segno.value.x, segno.value.z), segno.value.z, pt); segnoEl.value.style.transform = `translate(${Math.round(pt.x)}px, ${Math.round(pt.y)}px)` }
  if (aperto.value && fumEl.value) piazzaFumetto()
  if (props.pensiero && pensieroEl.value) piazzaPensiero()
  if (veduta) for (const n of nomiVeduta.value) {
    const el = nomiEl.get(n.chiave)
    if (!el) continue
    if (n.chiave === 'eroe') scena.aSchermo(io.x, scena.quota(io.x, io.z) + n.y, io.z, pt)
    else scena.aSchermo(n.x, n.y, n.z, pt)
    el.style.transform = `translate(${Math.round(pt.x)}px, ${Math.round(pt.y)}px)`
  }
  if (tempo >= prossimeBussole) { prossimeBussole = tempo + 0.1; aggiornaBussole() }   // a tempo, non a fotogrammi
}
function piazzaFumetto() {
  const b = aperto.value, f = fumEl.value, l = b.lotto
  const x = l.x + l.w / 2, z = l.y + l.h / 2, y = scena.quota(x, z)
  scena.aSchermo(x, y + b.alto + 0.3, z, pt); scena.aSchermo(x, y, z + l.h / 2, pt2)
  const w = Math.min(LARGO_FUM, vL - 16), h = f.offsetHeight
  const left = Math.max(8, Math.min(vL - w - 8, pt.x - w / 2))
  let top = pt.y - h - 12, giuSotto = false
  if (top < sopra + 6) { top = Math.min(vA - sotto - h - 6, pt2.y + 14); giuSotto = true }
  f.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`
  f.style.width = w + 'px'
  f.style.setProperty('--coda', Math.max(16, Math.min(w - 16, pt.x - left)) + 'px')
  f.classList.toggle('sot-sotto', giuSotto)
  if (f.style.visibility) f.style.visibility = ''
}

// la veduta: i nomi delle città, dei dungeon trovati, delle regioni viste e le pietre accese
const nomiVeduta = computed(() => {
  if (!props.veduta || !m) return []
  const l = []
  for (const c of m.citta) if (visto({ x: c.centro.x, y: c.centro.y })) l.push({ chiave: 'citta:' + c.chiave, testo: c.nome, classe: 'citta', x: c.centro.x + 0.5, y: 3, z: c.centro.y - 2 })
  for (const b of bersagli.value) {
    if (!trovati.value.has(b.chiave)) continue
    const l0 = b.lotto
    if (b.ruolo === 'ingresso') l.push({ chiave: b.chiave, bersaglio: b.chiave, testo: dungeonDi(b.k).nome, classe: datoDelPosto(b).aperto ? 'dungeon' : 'dungeon chiuso', x: l0.x + l0.w / 2, y: 3, z: l0.y })
    if (b.ruolo === 'pietra') l.push({ chiave: b.chiave, bersaglio: b.chiave, testo: accese.value.has(b.k) ? '✦' : '·', classe: accese.value.has(b.k) ? 'pietra accesa' : 'pietra', x: l0.x + 1, y: 1.5, z: l0.y + 1 })
  }
  for (const r of m.regioni) if (r.anello > 0 && visto({ x: r.cx, y: r.cy })) l.push({ chiave: 'regione:' + r.chiave, testo: r.nome, classe: 'regione', x: r.cx + 0.5, y: 1, z: r.cy + 0.5 })
  l.push({ chiave: 'eroe', testo: 'tu', classe: 'tu', x: io.x, y: 2.5, z: io.z })
  return l
})

// chi aspetta una consegna, o la discesa della missione: fuori dalla vista un tondo sul bordo che indica la strada
const fuori = ref([])
let fuoriChiave = ''
const portaDellaStoria = computed(() => discesaDellaStoria(props.tappe))
const PIEDI = () => Object.fromEntries(bersagli.value.filter(b => b.ruolo === 'ingresso').map(b => [b.k, { x: b.accanto.x + 0.5, y: b.accanto.y + 0.5 }]))
function aggiornaBussole() {
  if (props.veduta) { if (fuori.value.length) { fuori.value = []; fuoriChiave = '' } return }
  const lista = [], cx = vL / 2, cy = (sopra + vA - sotto) / 2, M = 30
  const alBordo = (sx, sy, resto) => {
    const dx = sx - cx, dy = sy - cy, k = Math.min((dx > 0 ? vL - M - cx : cx - M) / Math.abs(dx || 1e-6), (dy > 0 ? vA - sotto - M - cy : cy - sopra - M) / Math.abs(dy || 1e-6))
    if (k >= 1) return
    lista.push({ ...resto, x: Math.round(cx + dx * k), y: Math.round(cy + dy * k), gradi: Math.round(Math.atan2(dy, dx) * 180 / Math.PI) })
  }
  const chi = chiAspetta(props.missioni)
  for (const b of bersagli.value) if ((b.ruolo === 'personaggio' || b.ruolo === 'minatore') && chi.includes(b.k)) {
    scena.aSchermo(b.piede.x + 0.5, scena.quota(b.piede.x + 0.5, b.piede.y + 0.5) + 1, b.piede.y + 0.5, pt)
    alBordo(pt.x, pt.y, { chiave: b.k, nome: b.nome })
  }
  const metaD = discesaDaSeguire(props.missioni, { x: io.x, y: io.z }, PIEDI(), props.segui, portaDellaStoria.value)
  if (metaD) {
    const b = bersagli.value.find(x => x.ruolo === 'ingresso' && x.k === metaD)
    if (b) { scena.aSchermo(b.lotto.x + b.lotto.w / 2, scena.quota(b.lotto.x, b.lotto.y) + 1, b.lotto.y + b.lotto.h / 2, pt); alBordo(pt.x, pt.y, { chiave: metaD, meta: true, nome: dungeonDi(metaD).nome, immagine: iconaDi(metaD) }) }
  }
  const ch = lista.map(l => `${l.chiave}:${l.x},${l.y},${l.gradi}`).join('|')
  if (ch !== fuoriChiave) { fuoriChiave = ch; fuori.value = lista }
}

/* ═══════════ la nascita: il mondo (mezzo secondo), poi la scena ═══════════ */
function misura() {
  const r = vista.value && vista.value.getBoundingClientRect()
  if (!r || !r.width) return
  vL = r.width; vA = r.height
  sopra = sopraEl.value ? sopraEl.value.offsetHeight : 0
  sotto = sottoEl.value ? sottoEl.value.offsetHeight : 0
  if (scena) { scena.copri(sopra, sotto); scena.misura() }
}
let osserva = null, attesa = 0
async function nasci() {
  prepara()
  let mod = null
  try { mod = await import('../scena3d/mondo/indice.js') } catch (e) { perso.value = true; return }
  if (!vista.value) return
  const h = new URLSearchParams(location.hash.slice(1))
  scena = mod.creaMondo3d(tela.value, { m, nebbia, passo, dopo, dpr: Number(h.get('dpr')) || undefined, perso: () => { perso.value = true },
    frecce: Object.fromEntries(m.citta.map(c => [c.chiave, frecceDelCartello(m, c.chiave).map(f => versoInRadianti(f.verso))])) })
  if (!scena) { perso.value = true; return }
  markRaw(scena)
  if (h.get('nebbia') === 'no') import('../scena3d/mondo/vesti.js').then(v => { v.U.uNebbia.value = 0 })
  scena.S.io.x = io.x; scena.S.io.z = io.z
  aggiornaScena()
  misura()
  scena.avvia()
  pronto.value = true
  if (props.annuncio && !props.annuncio.sentita) dillo(C_E_UNA_NOTIZIA)
  if (typeof window !== 'undefined') {
    window.__sotterraneo3d = scena
    window.__mondo3d = { scena, m, io, bersagli: () => bersagli.value, trovati: () => [...trovati.value],
      vai(chiave) { const b = bersagli.value.find(x => x.chiave === chiave || x.k === chiave); if (!b) return null; via = []; io.x = b.accanto.x + 0.5; io.z = b.accanto.y + 0.5 + 0.01; scena.salta(); ultimaCella = -1; return b.chiave },
      porta(x, z) { via = []; io.x = x; io.z = z; scena.salta(); ultimaCella = -1 } }
  }
}
// la freccia del cartello in radianti (0 = est, verso nord positivo: la z del mondo va a sud)
const versoInRadianti = v => ({ '→': 0, '↗': Math.PI / 4, '↑': Math.PI / 2, '↖': 3 * Math.PI / 4, '←': Math.PI, '↙': -3 * Math.PI / 4, '↓': -Math.PI / 2, '↘': -Math.PI / 4 })[v] || 0

onMounted(() => {
  // il mondo si genera dopo il primo disegno: intanto si vede «la terra si prepara»
  attesa = requestAnimationFrame(() => { attesa = setTimeout(nasci, 30) })
  osserva = new ResizeObserver(misura)
  for (const el of [vista.value, sopraEl.value, sottoEl.value]) if (el) osserva.observe(el)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(attesa); clearTimeout(attesa); clearTimeout(tAvviso)
  if (osserva) osserva.disconnect()
  if (m) salva()
  if (scena) {
    scena.distruggi()
    if (window.__sotterraneo3d === scena) delete window.__sotterraneo3d
    delete window.__mondo3d
    scena = null
  }
})
// quello che cambia fuori (la storia, le missioni, la veduta, la roba): la scena lo legge al fotogramma dopo
const firmaScena = computed(() => [props.veduta, props.roba && props.roba.mano, props.roba && props.roba.mancina, accese.value.size, divieti.value.size, trovati.value.size, JSON.stringify(props.tappe.map(t => t.colore))].join('|'))
watch(firmaScena, () => aggiornaScena())
watch(() => props.veduta, v => { if (v) { chiudi(); chiudiDialogo() } })
</script>

<template>
  <div ref="vista" class="sot-terra sot3d-mondo" data-mondo3d :data-pronto="pronto ? 1 : 0" :data-in-veduta="veduta ? 1 : 0"
       @pointerdown="premi" @pointermove="muovi" @pointerup="lascia" @pointercancel="lascia" @click="toccaPrato" @wheel="rotella">
    <canvas ref="tela" class="sot3d-tela-mondo" data-tela="mondo"></canvas>
    <p v-if="!pronto && !perso" class="sot3d-attesa" data-mondo-attesa>La terra si prepara…</p>
    <div v-if="perso" class="sot3d-senza sot3d-perso" data-perso-3d>
      <h1>Il disegno 3D si è fermato</h1>
      <p>Il telefono ha lasciato andare il disegno del mondo. La tua avventura è salva.</p>
    </div>

    <i ref="eroeEl" class="sot3d-eroe-mondo" data-eroe-mondo :data-cammina="cammina ? 1 : 0" aria-hidden="true"></i>
    <span v-if="segno" ref="segnoEl" :key="'segno-' + segno.n" class="sot3d-segno-arrivo"></span>
    <span v-if="lampo" :key="'lampo-' + lampo" class="sot3d-lampo" aria-hidden="true"></span>

    <!-- i bersagli: chi sta fermo, gli ingressi, le pietre, il portale, il cartello, la bacheca, le grate chiuse. Stanno nel DOM
         anche nel buio (`sot-buio` lascia passare il tocco): le prove ci camminano incontro come sulla terra dipinta -->
    <div class="sot3d-bersagli">
      <button v-for="b in bersagli" :key="b.chiave" :ref="el => (el ? elementi.set(b.chiave, el) : elementi.delete(b.chiave))"
              type="button" class="sot3d-bersaglio" data-bersaglio :data-vis="0"
              :class="['sot3d-' + b.tipo, { 'sot-buio': !trovati.has(b.chiave) }]"
              :data-minatore="b.ruolo === 'minatore' ? '' : null" :data-mercante="b.ruolo === 'mercante' ? b.k : null"
              :data-personaggio="b.ruolo === 'personaggio' ? b.k : null" :data-citta="b.citta"
              :data-posto="b.ruolo === 'ingresso' ? b.k : null" :data-discesa="b.ruolo === 'ingresso' && b.k !== 'abisso' ? dungeonDi(b.k).indice : null"
              :data-abisso="b.ruolo === 'ingresso' && b.k === 'abisso' ? 1 : null"
              :data-aperta="b.ruolo === 'ingresso' ? (datoDelPosto(b).aperto ? 1 : 0) : null"
              :data-pietra="b.ruolo === 'pietra' ? b.k : null" :data-accesa="b.ruolo === 'pietra' ? (accese.has(b.k) ? 1 : 0) : null"
              :data-cartello="b.ruolo === 'cartello' ? b.citta : null" :data-bacheca="b.ruolo === 'bacheca' ? b.citta : null"
              :data-portale="b.ruolo === 'portale' ? '' : null" :data-grata="b.ruolo === 'grata' ? b.k : null"
              :data-divieto="b.ruolo === 'ingresso' && divieti.has(b.k) ? b.k : null"
              :data-trovato="trovati.has(b.chiave) ? 1 : 0" :data-saluta="b.tipo === 'persona' ? (salutano.has(b.chiave) ? 1 : 0) : null"
              :data-segno="segnoSopra(b)" :aria-label="trovati.has(b.chiave) ? (b.nome || (b.ruolo === 'ingresso' ? dungeonDi(b.k).nome : b.ruolo)) : null"
              :tabindex="trovati.has(b.chiave) ? 0 : -1" @click.stop="tocca(b)">
        <b v-if="b.ruolo === 'minatore' && !parlato" class="sot-tre-punti">…</b>
        <b v-else-if="b.ruolo === 'minatore' && annuncio && !annuncio.sentita" class="sot-tre-punti sot-segno-missione sot-segno-nuova" data-segno-di="annuncio">!</b>
        <b v-else-if="segnoSopra(b)" class="sot-tre-punti sot-segno-missione" :class="'sot-segno-' + segnoSopra(b)">{{ GLIFO[segnoSopra(b)] }}</b>
        <span v-if="b.ruolo === 'mercante' && trovati.has(b.chiave) && richiamo(b.k)" class="sot-richiamo" data-richiamo :data-richiamo-di="curaDi(b.k).risorsa">{{ richiamo(b.k) }}</span>
      </button>
    </div>

    <!-- il pensiero dell'eroe: il fumetto a bolle dei pensieri (stile.css, tema legno); si tocca solo se ha un segno -->
    <div v-if="pensiero && pronto" ref="pensieroEl" :key="pensiero.id + pensiero.testo" class="sot-pensiero sot-pensiero-mondo"
         :class="['sot-pensiero-' + pensiero.tono, { 'sot-pensiero-tocca': pensiero.segno }]" data-pensiero
         :data-pensiero-id="pensiero.id" :data-tono="pensiero.tono" :data-segno="pensiero.segno || null"
         @pointerdown.stop @click.stop="toccaPensiero">
      <span class="em sot-pensiero-icona">{{ pensiero.icona }}</span><span class="sot-pensiero-testo">{{ pensiero.testo }}</span>
      <i class="sot-pensiero-bolla"></i><i class="sot-pensiero-bolla sot-pensiero-bollina"></i>
    </div>

    <div v-if="veduta" class="sot3d-veduta" data-veduta>
      <button v-for="n in nomiVeduta" :key="n.chiave" :ref="el => (el ? nomiEl.set(n.chiave, el) : nomiEl.delete(n.chiave))" type="button"
              class="sot3d-nome-posto" :class="n.classe.split(' ').map(c => 'sot3d-nome-' + c)" :data-nome-posto="n.chiave"
              @click.stop="toccaNome(n)">{{ n.testo }}</button>
    </div>

    <div v-if="aperto && fumettoDati" ref="fumEl" class="sot-fumetto sot3d-fumetto" data-fumetto
         :data-fumetto-di="aperto.ruolo === 'ingresso' ? aperto.k : aperto.ruolo" :class="{ 'sot-tenue': fumettoDati.tipo === 'posto' && !fumettoDati.aperto }"
         style="visibility: hidden" @click.stop>
      <FumettoMondo :f="fumettoDati" @scendi="scendi" @giu="giuDalPortale" @viaggio="viaggia" />
    </div>

    <button v-for="f in fuori" :key="'fuori-' + f.chiave" class="sot-bussola" :class="{ 'sot-bussola-meta': f.meta }"
            :data-consegna-fuori="f.meta ? null : f.chiave" :data-meta-fuori="f.meta ? f.chiave : null"
            :aria-label="f.meta ? 'La discesa della tua missione: ' + f.nome : 'Hai una consegna per ' + f.nome"
            :style="{ left: f.x + 'px', top: f.y + 'px' }" @click.stop="vaDa(f.chiave)">
      <i class="sot-bussola-freccia" :style="{ transform: `rotate(${f.gradi}deg) translateX(28px)` }"></i>
      <b v-if="!f.meta">?</b>
      <b v-else><img v-if="f.immagine" class="sot-ritaglio" :src="f.immagine" alt="" data-ritaglio></b>
    </button>

    <div ref="sopraEl" class="sot-terra-sopra"><slot name="sopra" /></div>
    <div ref="sottoEl" class="sot-terra-sotto">
      <span v-if="fiocco" :key="fiocco.n" class="sot-cura-fiocco sot3d-fiocco" :class="'sot-cura-' + fiocco.risorsa" data-cura-fiocco
            :data-risorsa="fiocco.risorsa" @animationend="fiocco = null">{{ fiocco.testo }} {{ fiocco.risorsa === 'vita' ? '❤️' : '⚡' }}</span>
      <p v-if="avviso" class="sot-trovato" data-avviso-terra>{{ avviso }}</p>
      <p v-else-if="veduta" class="sot-trovato sot-piano" data-veduta-dice>Tocca dove vuoi andare: ci vai a piedi.</p>
      <p v-else-if="primaVolta && pronto" class="sot-trovato sot-piano">Tocca dove vuoi andare.</p>
      <Dialogo v-if="dialogo" :chi="dialogo.chi" :nome="dialogo.nome" :pagine="dialogo.pagine" :giro="dialogo.giro"
               :scelte="scelteDelDialogo" @scegli="scegli" />
    </div>

    <Foglio v-if="domandaPietra" titolo="Una pietra del viaggio" data-pietra-domanda
            dice="Una runa spenta. Rispondi giusto e si accende: da lì potrai viaggiare alle altre pietre accese, gratis.">
      <div class="sot-domanda">
        <Domanda :domanda="domandaPietra.q.domanda" :pittori="domandaPietra.q.pittori" :origine="domandaPietra.q"
                 gioco="sotterraneo" :respiro="900" @risposto="rispostoPietra" />
      </div>
      <button class="sot-grosso sot-chiaro" data-azione="dopo" @click.stop="domandaPietra = null">più tardi</button>
    </Foglio>
  </div>
</template>
