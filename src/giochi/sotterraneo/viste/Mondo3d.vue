<script setup>
// Il mondo di sopra del Sotterraneo 3D: il mondo generato (motore/mondo-aperto.js, seme 19) disegnato in WebGL
// (scena3d/mondo/), al posto della terra dipinta (viste/Terra.vue, che resta del Sotterraneo di sempre). L'eroe cammina dove si
// tocca, i mercanti e chi dà le missioni stanno nelle città, i sette dungeon hanno i loro ingressi modellati, le pietre del
// viaggio si accendono con una domanda, la nebbia si apre camminando e si salva. Le stesse porte di Terra.vue verso
// Campagna.vue (`scendi`, `bottega`, `riprendi`, `sentito`, `cura`) più `mondo` (ricordati questo), `risposta` (la domanda di una
// pietra: le monete) e `veduta` (chiudi la veduta d'insieme). Le regole: docs/sotterraneo/terra-di-sopra.md, «Il mondo in 3D».
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, nextTick, markRaw } from 'vue'
import { PERSONAGGI_DI_SOPRA, personaDi, missioneDi } from '../dati/missioni.js'
import { FONTANA } from '../dati/dialoghi.js'
import { MERCANTI, mercanteDi } from '../dati/mercanti.js'
import { DUNGEON, CITTA } from '../dati/mondo-aperto.js'
import { segnoDi, GLIFO, chiAspetta, presePer, discesaDaSeguire, discesaDellaStoria } from '../motore/missioni.js'
import { prese as presePerTipo, esploratePronte } from '../motore/taglie.js'
import { vociDellaBacheca, segnoDellaBacheca, postoSulPrato } from '../motore/taglie-bacheca.js'
import { apertura, scelte as scelteDi, risposta as rispostaDi, dopoLaPresa, dopoLaConsegna, novita as novitaDi,
         curaDi, mancaA, richiamoDi, dopoLaCura, stradaDelCapitano } from '../motore/dialoghi.js'
import { laStoria, dettoDelLivello } from '../motore/storia.js'
import { DETTI_DEL_COLORE, C_E_UNA_NOTIZIA } from '../dati/zone.js'
import { iconaDi } from '../dati/terra.js'
import { ilMondo, aperturaDi, terraDelMondo, chiusoPerche, postiDi, cittaInCella, regioneInCella, portaleDella, minatoreDi,
         nomeDellaPietra, difDellaPietra, pietraAccanto, meteDelViaggio, nebbiaInBase64, nebbiaDaBase64, mondoNuovo, lontanoDalleCitta,
         frecceDelCartello, dungeonDi, cittaDi, fontaneDi, curaDellaFontana, VISTA_MONDO, PASSO_MONDO } from '../motore/mondo-sopra.js'
import { rettangoloPersona, rettangoloPosto, personaVicina, SCARTO_DITO } from '../scena3d/mondo/dito.js'
import { domandaPerGioco } from '../../../quiz/scelta.js'
import Domanda from '../../../quiz/Domanda.vue'
import Dialogo from './Dialogo.vue'
import Foglio from './Foglio.vue'
import FumettoMondo from './FumettoMondo.vue'
import { RITMO } from '../dati/pensieri.js'
import { creaMostriSopra } from './mondo-mostri.js'
import { annuncioDi, alSicuro } from '../motore/aperta.js'
import { fotoDelloScontro } from '../motore/aperta-scena.js'
import { allaCitta } from '../motore/forze-sopra.js'
import { SOPRA } from '../dati/mondo-aperto-mostri.js'
import { campoVersoLaMeta, celleDelVelo, luciDellaStrada, piuVicina, passiDetti, ARRIVATO_META } from '../motore/meta-sopra.js'

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
  forza: { type: Number, default: 1 },        // il livello di forza dell'eroe (motore/forza.js): il colore dell'annuncio di una regione
  fermo: { type: Boolean, default: false },   // un pannello di Gioco.vue è aperto sopra il mondo (bottega, zaino, eroe): i mostri aspettano
})
// `pensa`, `pensiero`, `pensiero-fine`, `trovati`: lo stesso contratto dei pensieri di viste/Terra.vue
// `scontro` ({ inc, stato, terra, verso }): un mostro di sopra apre uno scontro (Gioco.vue lo gioca, `apriPalco` lo disegna qui);
// `raccogli` (i): la cosa per terra `i` è sotto i piedi dell'eroe. Le forze di sopra vanno in `mondo.sopra` col resto (salva)
const emit = defineEmits(['scendi', 'mondo', 'bottega', 'riprendi', 'sentito', 'cura', 'risposta', 'veduta', 'pensa', 'pensiero', 'pensiero-fine', 'trovati',
                          'scontro', 'raccogli'])
const minuscolo = s => s.charAt(0).toLowerCase() + s.slice(1)
const RAGGIO_SALUTO = 6, RAGGIO_RIARMO = 9, DURATA_SALUTO = 1.4

/* ═══════════ il mondo e chi ci sta (non reattivi: si leggono e basta) ═══════════ */
let m = null, terra = null, nebbia = null, scena = null, fontane = []
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
const giro = ref(0)      // i ritorni in città (motore/mondo-sopra.js, lontanoDalleCitta): la bacheca cambia a ogni giro
let allontanato = false, raggiungibili = null
// i mostri di sopra (viste/mondo-mostri.js, motore/aperta.js): lo stato del motore, e lo scontro aperto (`inScontro`: lo gioca
// Gioco.vue, lo disegna il palco della scena). `fotoScontro`: chi è in campo, salvato in `mondo.sopra.scontro` finché lo scontro c'è
const inScontroV = ref(false)   // lo stesso, per il disegno (la carta della meta si nasconde)
let mostri = null, inScontro = false, attesaScontro = false, inCampo = null, fotoScontro = null, prossimiMostri = 0
const mostriVisti = ref([]), coseVisti = ref([])
const elMostri = new Map(), elCose = new Map()

const tappaDi = chiave => props.tappe.find(t => t.chiave === chiave) || null
// un ingresso (il bersaglio, `k` la chiave della discesa): il dungeon coi nomi nuovi, la sua tappa, se è aperto
const datoDelPosto = b => {
  const d = dungeonDi(b.k), t = tappaDi(b.k), abisso = b.k === 'abisso'
  return { d, t, abisso, aperto: abisso ? !!props.abisso : !!(t && t.aperta) }
}

// il posto sul prato di una taglia (il viandante, la X): lo stesso per lo stesso id, calcolato una volta per taglia
const postiTaglie = new Map()
function postoDi(t) {
  if (!postiTaglie.has(t.id)) postiTaglie.set(t.id, postoSulPrato(m, terra, t))
  return postiTaglie.get(t.id)
}
function preparaBersagli() {
  const l = [], piede = p => ({ x: p.piede.x, y: p.piede.y })
  const persona = (tipo, k, p, extra) => l.push({ chiave: `${tipo}:${p.citta || ''}:${k}`, tipo: 'persona', ruolo: tipo, k, citta: p.citta || null,
    piede: piede(p), accanto: { ...p.accanto }, alto: 2.2, ...extra })
  for (const p of postiDi(m, 'mercante')) { const me = mercanteDi(p.chiave); if (me) persona('mercante', p.chiave, p, { nome: me.nome, sprite: me.sprite }) }
  for (const p of [...m.persone, ...m.citta.flatMap(c => c.persone)]) {
    const d = PERSONAGGI_DI_SOPRA[p.chiave]
    if (d) persona('personaggio', p.chiave, p, { nome: d.nome, sprite: d.sprite, scala: d.scala || null, tinta: d.tinta || null })
  }
  const mi = minatoreDi(m, ap.value.finite)
  if (mi) persona('minatore', 'minatore', mi, { nome: 'il vecchio minatore', sprite: 'minatore' })
  // le taglie in mano che vogliono qualcosa sul prato: chi si è perso (si parla) e la X della mappa (si scava). Ci sono solo finché la
  // taglia è in mano (docs/sotterraneo/mondo-aperto-quest.md)
  for (const t of presePerTipo(props.missioni, 'trovachi')) { const q = postoDi(t); if (q) persona('viandante', t.id, { ...q, citta: null }, { nome: t.viandante.nome, sprite: t.viandante.sprite }) }
  const posto = (tipo, p, extra) => l.push({ chiave: `${tipo}:${p.chiave}`, tipo: tipo === 'cartello' || tipo === 'bacheca' ? 'cosa' : 'posto', ruolo: tipo, k: p.chiave,
    citta: p.citta || null, lotto: { x: p.x, y: p.y, w: p.w, h: p.h }, accanto: { ...p.accanto }, piede: piede(p), alto: 2.4, ...extra })
  for (const p of postiDi(m, 'ingresso')) posto('ingresso', p, { alto: p.monumento === 'torre' ? 4.8 : p.monumento === 'botola' ? 1.6 : 3.2, monumento: p.monumento })
  for (const p of postiDi(m, 'pietra')) posto('pietra', p, { alto: 1.6 })
  for (const p of postiDi(m, 'cartello')) posto('cartello', p, { alto: 1.7 })
  for (const p of postiDi(m, 'bacheca')) posto('bacheca', p, { alto: 2.1 })
  for (const f of fontane) posto('fontana', { ...f, chiave: f.citta }, { alto: 2.4 })
  for (const t of presePerTipo(props.missioni, 'mappa')) { const q = postoDi(t); if (q) posto('scavo', { chiave: t.id, x: q.piede.x, y: q.piede.y, w: 1, h: 1, piede: q.piede, accanto: q.accanto }, { alto: 1.4 }) }
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
  for (const b of l) if (b.tipo === 'persona') persone.push({ chiave: b.chiave, fermo: `${b.sprite}-fermo-0`, saluto: `${b.sprite}-saluta-0`, pezzo: `${b.sprite}-fermo-0`, x: b.piede.x + 0.5, z: b.piede.y + 0.5, specchio: false,
                                                          scala: b.scala, tinta: b.tinta })
}
// Le taglie in mano che cambiano il prato (un viandante da cercare, una X da scavare) rifanno i bersagli
const chiaveDelPrato = computed(() => [...presePerTipo(props.missioni, 'trovachi'), ...presePerTipo(props.missioni, 'mappa')].map(t => t.id).sort().join('|'))
watch(chiaveDelPrato, () => {
  if (!m || !scena) return
  preparaBersagli()
  trovati.value = new Set(bersagli.value.filter(b => visto(cellaDelBersaglio(b))).map(b => b.chiave))
  aggiornaScena()
})
const cellaDelBersaglio = b => (b.lotto ? { x: Math.floor(b.lotto.x + b.lotto.w / 2), y: Math.floor(b.lotto.y + b.lotto.h / 2) } : b.piede)
const visto = c => nebbia[c.y * m.W + c.x] === 1

/* ═══════════ la nebbia, la partenza, il salvataggio ═══════════ */
function prepara() {
  m = markRaw(ilMondo())
  terra = markRaw(terraDelMondo(m, ap.value.aperto))
  fontane = markRaw(fontaneDi(m, terra))
  const s = props.mondo || {}
  nebbia = nebbiaDaBase64(s.nebbia, m.W, m.H)
  let primeAccese = []
  if (!nebbia) { const n = mondoNuovo(m, terra, props.tappe); nebbia = n.nebbia; primeAccese = n.pietre }
  accese.value = new Set([...(Array.isArray(s.pietre) ? s.pietre : []), ...primeAccese])
  parlato.value = !!s.parlato
  ascoltate.value = { ...(s.novita || {}) }
  giro.value = s.giro || 0
  raggiungibili = markRaw(terra.raggiungibili(m.partenza))
  mostri = markRaw(creaMostriSopra({ m, eroe: props.eroe.chiave || 'eroe', giro: giro.value, salvato: s.sopra || null }))
  fotoScontro = mostri.scontroRimesso   // i rimasti di uno scontro lasciato con la ✕ restano scritti finché non si riapre
  preparaBersagli()
  divieti.value = new Set((Array.isArray(s.divieti) ? s.divieti : []).filter(k => { const b = bersagli.value.find(x => x.chiave === `ingresso:${k}`); return b && !datoDelPosto(b).aperto }))
  // dove si era; salendo dal portale accanto al gemello, nella città che serve quel dungeon
  const d = s.dove
  let qui = m.partenza
  const portale = bersagli.value.find(b => b.ruolo === 'portale')
  if (d && d.portale && portale) qui = portale.accanto
  else if (d && Number.isInteger(d.x) && terra.passa(d.x, d.y)) qui = d
  // salendo dal portale si torna in città (un giro); se no si riparte da dove si era, e si è «lontani» se non si è in città
  if (d && d.portale && portale) { giro.value++; allontanato = false; mostri.giro(giro.value); fotoScontro = null }
  else allontanato = lontanoDalleCitta(m, qui.x, qui.y)
  io.x = qui.x + 0.5; io.z = qui.y + 0.5
  trovati.value = new Set(bersagli.value.filter(b => visto(cellaDelBersaglio(b))).map(b => b.chiave))
}
let sporca = false, ultimoSalvato = 0
function salva() {
  if (!m) return
  sporca = false; ultimoSalvato = tempo
  emit('mondo', { nebbia: nebbiaInBase64(nebbia), dove: { x: Math.floor(io.x), y: Math.floor(io.z) }, giro: giro.value, pietre: [...accese.value],
                  parlato: parlato.value, divieti: [...divieti.value], novita: ascoltate.value, sopra: mostri.inSalvo(fotoScontro) })
}

/* ═══════════ il passo: l'eroe cammina, guarda, chi sta fermo saluta ═══════════ */
const cellaDiMe = () => ({ x: Math.floor(io.x), y: Math.floor(io.z) })
const verso = { dx: 0, dy: 1 }
let tempo = 0, ultimaCella = -1, regioneOra = null, cittaOra = null
function vaiA(c, cosa = null) {
  guidato.value = false
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
  cammina.value = false; guidato.value = false
  salva()
  const q = meta
  meta = null
  if (q && q.tipo === 'terra') { emit('raccogli', q.i); salva(); return }   // Gioco.vue la mette in tasca (raccogliDaTerra)
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
  if (k !== ultimaCella) {
    // una cella camminata è un passo per il motore (il mana, chi torna a casa); un salto (la pietra, il risveglio) no
    if (ultimaCella >= 0 && !inScontro && mostri.passi(1, io, props.roba ? props.roba.energiaMax : null)) sporca = true
    ultimaCella = k; guarda()
  }
  mostriDelPasso(dt, t)
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
    controllaTaglie()
  }
  const c = cellaDiMe(), citta = cittaInCella(m, c.x, c.y), r = regioneInCella(m, c.x, c.y)
  // un ritorno in città conta solo se prima ci si è allontanati davvero (raggio + 8 celle da ogni centro): passare il confine a ogni
  // passo non fa girare la bacheca
  if (!citta && lontanoDalleCitta(m, c.x, c.y)) allontanato = true
  if (citta !== cittaOra) { if (citta && cittaOra === null && allontanato) { giro.value++; allontanato = false; sporca = true } cittaOra = citta }
  // entrando in una regione: il nome, la fascia e il colore per questo eroe (motore/aperta.js, annuncioDi); in città il suo nome
  if (r && r !== regioneOra) {
    if (regioneOra && !avviso.value) { const a = annuncioDi(m, io.x, io.z, props.forza); if (a) dillo(a.testo, a.colore || null) }
    regioneOra = r
  }
}

/* ═══════════ le taglie della bacheca (motore/taglie.js): cosa si fa da sé, camminando ═══════════ */
// «Esplora» è fatta quando la nebbia scopre il posto: la regione (il suo cuore), l'ingresso, la pietra. Le altre si fanno parlando
// (il viandante), scavando (la X) o toccando la bacheca di laggiù (la consegna)
const vistoDelBersaglio = q => {
  if (q.tipo === 'regione') { const r = m.regioni.find(x => x.chiave === q.chiave); return !!r && visto(r.tana) }
  return trovati.value.has(`${q.tipo}:${q.chiave}`)
}
function controllaTaglie() {
  if (!props.azioneMissione || !m) return
  for (const id of esploratePronte(props.missioni, vistoDelBersaglio)) {
    if (props.azioneMissione(id, 'fatta')) { const t = missioneDi(id); dillo(`Fatto: ${t.titolo}. Passa dalla bacheca.`) }
  }
}
watch(() => props.missioni, controllaTaglie)

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

const avviso = ref(''), primaVolta = ref(!props.mondo), coloreAvviso = ref(null)
let tAvviso = 0
function dillo(s, colore = null) { avviso.value = s; coloreAvviso.value = colore; clearTimeout(tAvviso); tAvviso = setTimeout(() => { avviso.value = '' }, colore ? 3400 : 2600) }

/* ═══════════ i mostri di sopra (docs/sotterraneo/mondo-aperto-mostri.md, «Cosa si aspetta dalla scena») ═══════════ */
// a ogni fotogramma, col tempo vero: chi si sveglia e insegue, chi apre lo scontro; cosa si disegna (il cerchio di luce, la nebbia)
let senzaMostri = false   // le prove che non sono uno scontro (la bacheca, il viaggio): `__mondo3d.senzaMostri()`
function mostriDelPasso(dt, t) {
  if (senzaMostri) { scena.S.mostri = []; if (mostriVisti.value.length) mostriVisti.value = []; return }
  if (!inScontro && !attesaScontro) {
    const inc = mostri.passo(dt, io, { fermo: !!(dialogo.value || domandaPietra.value || props.veduta || props.fermo) })
    if (inc) apriIncontro(inc)
  }
  const visto = (x, z) => scena.visto(x, z)
  scena.S.mostri = props.veduta ? [] : mostri.figure(io, t, visto, inCampo)
  scena.S.perTerra = props.veduta ? [] : mostri.perTerra(visto)
  // «portami lì» si ferma quando compare un mostro che prima non si vedeva: decide il bambino (docs/sotterraneo/mondo-3d-la-meta.md)
  if (guidato.value && scena.S.mostri.some(q => q.alfa > 0.3 && !guidaVisti.has(q.i))) {
    via = []; meta = null; cammina.value = false; guidato.value = false; fermato.value = 'mostro'
    salva()
    dillo('Un mostro sulla strada! Affrontalo, o tocca «portami lì» per andare avanti.')
  }
  if (t >= prossimiMostri) { prossimiMostri = t + 0.2; aggiornaMostriVisti() }   // i bersagli nel DOM: a tempo, non a fotogrammi
  // i rimasti di uno scontro lasciato: se l'eroe se ne va lontano, non lo aspettano più
  if (fotoScontro && !inScontro && Math.hypot(io.x - fotoScontro.x - 0.5, io.z - fotoScontro.y - 0.5) > SOPRA.insegue + 4) { fotoScontro = null; sporca = true }
}
function aggiornaMostriVisti() {
  const l = inScontro ? [] : scena.S.mostri.map(q => ({ i: q.i, sveglio: q.sveglio, caporale: q.caporale, signore: q.signore, nome: q.nome, tipo: mostri.stato.mostri[q.i].tipo }))
  const ch = l.map(q => `${q.i}:${q.sveglio ? 1 : 0}`).join('|')
  if (ch !== mostriVisti.value.map(q => `${q.i}:${q.sveglio ? 1 : 0}`).join('|')) mostriVisti.value = l
  const c = inScontro ? [] : scena.S.perTerra.map(x => ({ i: x.i, cosa: mostri.stato.perTerra[x.i].cosa }))
  if (c.map(x => `${x.i}:${x.cosa}`).join('|') !== coseVisti.value.map(x => `${x.i}:${x.cosa}`).join('|')) coseVisti.value = c
}
// un mostro sveglio è arrivato addosso, o l'eroe ne ha toccato uno: lo scontro lo apre Gioco.vue (`scontro`), che poi chiama apriPalco
function apriIncontro(inc) {
  via = []; meta = null; cammina.value = false; guidato.value = false
  chiudi(); chiudiDialogo()
  attesaScontro = true
  emit('scontro', { inc, stato: mostri.stato, terra, verso: { dx: verso.dx, dy: verso.dy } })
}
// il tocco su un mostro (il suo bersaglio, o il prato accanto ai suoi piedi): lo scontro se è a portata, se no l'eroe gli va incontro
function toccaMostro(i) {
  if (strisciato || inScontro || attesaScontro || props.veduta) return
  chiudi(); chiudiDialogo()
  const e = mostri.tocca(i, io, (x, y) => terra.passa(x, y))
  if (!e) return
  if (e.subito) { const inc = mostri.passo(1e-3, io); if (inc) apriIncontro(inc); return }
  vaiA(e.cella)
}
const mostroVicino = p => {
  let mig = null, dm = 1.3
  for (const q of scena.S.mostri) { const d = Math.hypot(q.x - p.x, q.z - p.z); if (q.alfa > 0.3 && d < dm) { dm = d; mig = q } }
  return mig
}
// Gioco.vue ha aperto lo scontro dell'incontro: il palco si posa sul prato (scena3d/mondo/palco.js) e torna il pittore che Gioco.vue
// fa girare come quello delle discese. Si salva subito chi è in campo: se il telefono si spegne, rientrando si ricomincia da qui
function apriPalco(corsa, opz = {}) {
  attesaScontro = false
  if (!scena || !scena.palcoSopra) return null
  inScontro = true; inScontroV.value = true
  inCampo = new Set(corsa.livello.robe.filter(r => r.che === 'mostro' && r.mondo != null).map(r => r.mondo))
  const st = mostri.stato
  scena.palcoSopra.apri({ io, passa: (x, y) => terra.passa(x, y), daDove: i => ({ x: st.mostri[i].fx, z: st.mostri[i].fy }), corsa, ...opz })
  fotoScontro = fotoDelloScontro(corsa)
  aggiornaMostriVisti()
  salva()
  return scena.palcoSopra.pittore
}
// finito lo scontro (l'esito l'ha già scritto Gioco.vue): il palco si chiude; svenuti ci si risveglia nella città più vicina.
// `scontro`: chi è rimasto quando lo si è lasciato con la ✕ (motore/aperta-scena.js, lasciaLoScontro), o null
function dopoLoScontro(e, scontro = null) {
  if (scena && scena.palcoSopra) scena.palcoSopra.chiudi()
  inScontro = false; inScontroV.value = false; attesaScontro = false; inCampo = null; fotoScontro = scontro
  if (e && e.risveglio && scena) {
    via = []; meta = null; cammina.value = false
    io.x = e.risveglio.x + 0.5; io.z = e.risveglio.y + 0.5
    scena.salta(); ultimaCella = -1
    dillo(`Ti hanno portato ${allaCitta(e.risveglio.nome)}. Riposati, e torna più forte.`)
  } else if (e && e.rimasti && e.rimasti.length) dillo('Qualcosa non ti stava in tasca: è rimasto per terra.')
  aggiornaMostriVisti()
  salva()
}
// la cosa per terra toccata: l'eroe ci va, e arrivato la raccoglie (arriva)
function toccaCosa(i) {
  if (strisciato || inScontro || props.veduta) return
  const c = mostri.stato.perTerra[i]
  if (!c) return
  chiudi(); chiudiDialogo()
  if (Math.hypot(io.x - (c.x + 0.5), io.z - (c.y + 0.5)) <= 1.2 && !via.length) { emit('raccogli', i); salva(); return }
  vaiA({ x: c.x, y: c.y }, { tipo: 'terra', i })
}

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
// i fogli di una bacheca dipendono da chi è l'eroe, dal giro e da cosa si è già visto (e cosa si raggiunge)
const ctxBacheca = () => ({ m, eroe: props.eroe.chiave, giro: giro.value, tappe: props.tappe, stati: props.missioni,
                            visto: (x, y) => nebbia[y * m.W + x] === 1, raggiunge: (x, y) => !!raggiungibili && raggiungibili.has(y * m.W + x) })
const ctx = () => ({ stati: props.missioni, tappe: props.tappe, abisso: !!props.abisso, eroe: props.eroe.chiave,
                     roba: props.roba, annuncio: props.annuncio, novita: ascoltate.value, forze: props.forze, mondo: true })
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
  if (!prima) return 'Per ora non si scende.'
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
  if (b.ruolo === 'bacheca') {
    return { tipo: 'bacheca', citta: b.citta, nome: personaDi(`bacheca:${b.citta}`).nome, voci: vociDellaBacheca(b.citta, ctxBacheca()) }
  }
  if (b.ruolo === 'scavo') return { tipo: 'scavo', titolo: (missioneDi(b.k) || {}).titolo || 'La X' }
  if (b.ruolo === 'fontana') return { tipo: 'fontana', ...FONTANA, ...curaDellaFontana(props.forze) }
  if (b.ruolo === 'grata') return { tipo: 'grata', nome: b.q.nome || 'Il passaggio', perche: chiusoPerche(b.q, ap.value) }
  if (b.ruolo === 'cartello') {
    const q = metaOra.value, qui = !!(q && q.regione && cittaDi(m, b.citta).regione === q.regione)
    const frecce = frecceDelCartello(m, b.citta).map(x => ({ ...x,
      detto: x.citta.length ? `verso ${x.citta.map(c => minuscolo(CITTA.find(y => y.chiave === c).nome)).join(' e ')}` : x.posti.length ? 'verso le terre oltre il fiume' : 'verso i campi e le valli',
      nomi: x.posti.filter(k => trovati.value.has(`ingresso:${k}`)).map(k => dungeonDi(k).nome),
      meta: !!(q && q.regione && x.regioni.includes(q.regione)) }))
    return { tipo: 'cartello', frecce, meta: q ? { nome: q.nome, minuscolo: minuscolo(q.nome), qui } : null }
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

/* ═══════════ la bacheca: si prende un foglio, si consegna (motore/taglie-bacheca.js) ═══════════ */
function allaBacheca({ id, azione }) {
  if (!props.azioneMissione) return
  const t = missioneDi(id)
  if (!t) return
  if (azione === 'prendi') {
    if (props.azioneMissione(id, 'prendi') === 'presa') dillo(`Preso: ${t.titolo}.`)
    else dillo('Tre taglie in mano sono il massimo: consegnane una.')
  } else if (azione === 'consegna') {
    const e = props.azioneMissione(id, 'consegna')
    if (e && e.esito === 'consegnata') dillo(`${t.grazie.split('.')[0]}. 💎 ${t.premio.gemme}`)
  }
}

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
// La X della mappa del tesoro si scava con una domanda, come una pietra si accende: giusto e si trova, sbagliato e si riprova (non
// si perde niente, docs/apprendimento/calibrazione.md). Le domande sono quelle della regione
function scava() {
  const b = aperto.value
  if (!b || b.ruolo !== 'scavo') return
  const r = m.regioni.find(x => x.chiave === (missioneDi(b.k) || {}).regione)
  try {
    const q = domandaPerGioco({ difficolta: (r && r.dif) || difDellaPietra(m, 'villaggio'), evita: ultimoModulo })
    if (!q || !q.domanda) throw new Error('nessun modulo')
    ultimoModulo = q.modulo
    domandaPietra.value = { b, q, scavo: true }
  } catch (e) { trovaIlTesoro(b) }
}
function trovaIlTesoro(b) {
  const t = missioneDi(b.k)
  chiudi()
  if (props.azioneMissione && props.azioneMissione(b.k, 'fatta')) dillo(`Hai trovato il tesoro${t ? ` ${t.titolo.toLowerCase().replace(/^la mappa /, 'della mappa ')}` : ''}! Passa dalla bacheca.`)
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
  if (giusto && d && d.scavo) trovaIlTesoro(d.b)
  else if (giusto && d) accendi(d.b)
  else if (d && d.scavo) dillo('Niente, sotto c\'è solo terra. Si riprova quando vuoi: non si perde niente.')
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
  if (b.ruolo === 'viandante') return parlaAlViandante(b)
  const chi = b.k
  saluta(b.chiave, tempo); vicini.add(b.chiave)
  const prima = chi === 'minatore' && !parlato.value
  if (prima) { parlato.value = true; salva() }
  if (chi === 'capitano' && capitanoHaDaDire()) { ascoltate.value = { ...ascoltate.value, capitano: { n: 1, v: (props.tappe.find(t => t.adesso) || {}).chiave } }; salva() }
  if (chi === 'minatore' && props.annuncio && !props.annuncio.sentita) { avviso.value = ''; emit('sentito') }
  dialogo.value = { chi, nome: chiParla(chi), pagine: apertura(chi, ctx(), { primaVolta: prima }), giro: ++giri, chieste: new Set(chi === 'minatore' || chi === 'capitano' ? ['strada'] : []) }
}
function chiudiDialogo() { dialogo.value = null }
// chi si era perso: parlargli fa la taglia (poi sparisce dal prato); la paga è alla bacheca
function parlaAlViandante(b) {
  const t = missioneDi(b.k)
  if (!t) return
  saluta(b.chiave, tempo); vicini.add(b.chiave)
  if (props.azioneMissione) props.azioneMissione(t.id, 'fatta')
  dialogo.value = { chi: t.viandante.sprite, nome: t.viandante.nome, giro: ++giri, chieste: new Set(), speciale: true,
                    pagine: [{ testo: `Oh, mi hai trovato! Mi ero perso, e ormai mi pareva di girare in tondo. Dì pure a casa che sto bene.` },
                             { testo: `Passa dalla bacheca: la tua paga ti aspetta.` }] }
}
const fiocco = ref(null)
const richiamo = chi => (dialogo.value && dialogo.value.chi === chi ? null : richiamoDi(chi, props.forze))
// la fontana beve tutto: vita ed energia insieme (un solo `cura`, 'tutto'); il numero sopra l'eroe dice quanto si è ripreso
function bevi() {
  const c = curaDellaFontana(props.forze)
  if (!c.serve) return
  emit('cura', 'tutto')
  fiocco.value = { n: ++giri, risorsa: 'tutto', testo: [c.vita ? `+${c.vita} ❤️` : '', c.energia ? `+${c.energia} ⚡` : ''].filter(Boolean).join(' ') }
}
const scelteDelDialogo = computed(() => (!dialogo.value ? [] : dialogo.value.speciale ? [{ che: 'ciao', testo: 'Ci vediamo!' }] : scelteDi(dialogo.value.chi, ctx(), dialogo.value.chieste)))
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
// il capitano ha un «!» finché non ha detto la porta di adesso (ne parla quando è una delle sue: stradaDelCapitano); la fa «ascoltare»
// nel campo `novita` dell'avventura, con la discesa che ha detto
const capitanoHaDaDire = () => !!stradaDelCapitano(ctx()).length && (ascoltate.value.capitano || {}).v !== (props.tappe.find(t => t.adesso) || {}).chiave
// il segno sopra le bacheche: le tre, ricalcolate quando cambia lo stato, il giro o cosa si è trovato (non a ogni render)
const segniBacheca = computed(() => {
  if (!m) return {}
  trovati.value; giro.value
  const ctx = ctxBacheca(), o = {}
  for (const c of m.citta) o[c.chiave] = segnoDellaBacheca(c.chiave, ctx)
  return o
})
const segnoSopra = b => (b.ruolo === 'bacheca' ? segniBacheca.value[b.citta] || null
  : b.ruolo === 'personaggio' && b.k === 'capitano' ? (capitanoHaDaDire() ? 'nuova' : null)
  : ['minatore', 'personaggio', 'mercante'].includes(b.ruolo) ? segnoDi(b.k, props.missioni, props.tappe) : null)

/* ═══════════ il dito ═══════════ */
const vista = ref(null), tela = ref(null), sopraEl = ref(null), sottoEl = ref(null), stratoEl = ref(null)
let giu = null, strisciato = false, ultimoTrascina = 0
function premi(e) { if (e.pointerType === 'mouse' && e.button !== 0) return; giu = { x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' }; strisciato = false }
function muovi(e) {
  if (!giu || (giu.mouse && !(e.buttons & 1))) return
  if (!strisciato && Math.hypot(e.clientX - giu.x, e.clientY - giu.y) > SCARTO_DITO) strisciato = true
  if (!strisciato || props.veduta || dialogo.value || domandaPietra.value || inScontro) return
  // trascinando l'eroe insegue il dito (il mouse solo a tasto premuto)
  const t = performance.now()
  if (t - ultimoTrascina < 110) return
  ultimoTrascina = t
  const p = puntoDi(e.clientX, e.clientY)
  if (p.x >= 0) { chiudi(); mostri.lascia(); vaiA({ x: Math.floor(p.x), y: Math.floor(p.z) }) }
}
function lascia() { giu = null }
const puntoDi = (cx, cy) => { const r = tela.value.getBoundingClientRect(); return scena.aTerra(cx - r.left, cy - r.top) }
const segno = ref(null)
let nSegno = 0
// un tocco sul prato: chiude quello che è aperto e cammina; vicino ai piedi di qualcuno è un tocco su di lui
function toccaPrato(e) {
  if (strisciato || !scena || !pronto.value) return
  // nello scontro il prato è il palco: un mostro toccato è il bersaglio, altrove si accorcia il racconto (scena3d/scontro.js)
  if (inScontro) { const r = tela.value.getBoundingClientRect(); scena.palcoSopra.pittore.premi({ x: e.clientX - r.left, y: e.clientY - r.top }); return }
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
    const mq = mostroVicino(p)
    if (mq) return toccaMostro(mq.i)
  }
  mostri.lascia()
  if (vaiA({ x: Math.floor(p.x), y: Math.floor(p.z) })) {
    const fin = via.at(-1) || { x: io.x, z: io.z }
    segno.value = { n: ++nSegno, x: fin.x, z: fin.z }
  }
}
// un tocco su un bersaglio: l'eroe ci va, e arrivato si apre la sua cosa (un tocco nuovo annulla la meta di prima)
function tocca(b) {
  if (strisciato || inScontro) return
  mostri.lascia()
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
function toccaNome(n) { if (n.meta) return portami({ sempre: true }); const b = bersagli.value.find(x => x.chiave === n.bersaglio); if (b) tocca(b); else if (n.x != null) { emit('veduta', false); vaiA({ x: Math.floor(n.x), y: Math.floor(n.z) }) } }
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
  const b = bersagli.value.find(x => (x.ruolo === 'minatore' && chiave === 'minatore') || (x.ruolo === 'personaggio' && x.k === chiave) || (x.ruolo === 'ingresso' && x.k === chiave) || (x.ruolo === 'bacheca' && x.k === chiave))
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
// lo stato dei mostri di sopra, per chi cura in città e chi raccoglie da terra (Gioco.vue): lo cambia lui, poi `salvaSopra`
const statoSopra = () => (mostri ? mostri.stato : null)
defineExpose({ vaDa, toccoDaFuori, vaDaMercante, apriPalco, dopoLoScontro, statoSopra, salvaSopra: () => salva() })

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
    const r = !inScontro && trovati.value.has(b.chiave) && (!veduta || b.ruolo === 'pietra') ? rettangoloDi(b) : null
    const dentro = r && r.x + r.w > 0 && r.x < vL && r.y + r.h > sopra && r.y < vA - sotto
    mostraEl(el, dentro && !veduta)
    if (dentro) {
      posa(el, r)
      if (r.testa != null) { const t = Math.round(r.testa); if (el._t !== t) { el._t = t; el.style.setProperty('--testa', t + 'px') } }
    }
  }
  posaMostri(veduta)
  if (eroeEl.value) {
    const c = cellaDiMe(), k = `${c.x},${c.y}`
    if (eroeEl.value.dataset.cella !== k) eroeEl.value.dataset.cella = k
    scena.aSchermo(io.x, scena.quota(io.x, io.z), io.z, pt)
    const s = `${Math.round(pt.x)},${Math.round(pt.y)}`
    if (eroeEl.value.dataset.schermo !== s) eroeEl.value.dataset.schermo = s
  }
  // il segno d'arrivo si posa con `translate` (proprietà a parte): la sua animazione fa `transform: scale`, che con un `transform` inline lo porterebbe via
  if (segno.value && segnoEl.value) { scena.aSchermo(segno.value.x, scena.quota(segno.value.x, segno.value.z), segno.value.z, pt); segnoEl.value.style.translate = `${Math.round(pt.x)}px ${Math.round(pt.y)}px` }
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
// i mostri e le cose per terra: il rettangolo della figura, come per le persone (scena3d/mondo/dito.js)
function posaMostri(veduta) {
  if (elMostri.size) {
    const dove = new Map(scena.S.mostri.map(q => [q.i, q]))
    for (const [i, el] of elMostri) {
      const q = dove.get(i)
      let rr = null
      if (q && !veduta && !inScontro) {
        const y = scena.quota(q.x, q.z)
        scena.aSchermo(q.x, y, q.z, pt); scena.aSchermo(q.x, y + 1.3 * q.scala, q.z, pt2)
        if (pt.davanti) { rr = rettangoloPersona(pt.x, pt.y, pt2.x, pt2.y); rr.testa = pt2.y - rr.y }
      }
      const dentro = rr && rr.x + rr.w > 0 && rr.x < vL && rr.y + rr.h > sopra && rr.y < vA - sotto
      mostraEl(el, !!dentro)
      if (dentro) { posa(el, rr); const t = Math.round(rr.testa); if (el._t !== t) { el._t = t; el.style.setProperty('--testa', t + 'px') } }
    }
  }
  for (const [i, el] of elCose) {
    const c = mostri.stato.perTerra[i]
    let rr = null
    if (c && !veduta && !inScontro) {
      const x = c.x + 0.5, z = c.y + 0.5, y = scena.quota(x, z)
      scena.aSchermo(x, y, z, pt); scena.aSchermo(x, y + 0.9, z, pt2)
      if (pt.davanti) rr = rettangoloPersona(pt.x, pt.y, pt2.x, pt2.y)
    }
    mostraEl(el, !!rr)
    if (rr) posa(el, rr)
  }
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

// Dove porta una taglia di sopra (non di un dungeon): consegnata o da consegnare alla sua bacheca, se no il posto che chiede: il cuore della
// regione (si va lì, la X o la persona si cercano), l'ingresso, la pietra. Il cerchio dice dove andare, non cosa si troverà
function metaDellaTaglia(t, stato) {
  const alla = () => { const c = m.citta.find(x => x.chiave === t.consegnaA); return c && c.bacheca.accanto }
  if (stato === 'fatta' || t.tipo === 'consegna') return alla()
  if (t.tipo === 'esplora' && t.bersaglio.tipo !== 'regione') { const p = postiDi(m, t.bersaglio.tipo).find(x => x.chiave === t.bersaglio.chiave); return p && p.accanto }
  const r = m.regioni.find(x => x.chiave === t.regione)
  return r && r.tana
}
const taglieSeguita = () => { const t = props.segui ? missioneDi(props.segui) : null; return t && t.taglia && !t.discesa && ['presa', 'fatta'].includes(props.missioni[t.id]) ? t : null }

/* ═══════════ la meta: dove andare adesso, e la strada vera fin lì (docs/sotterraneo/mondo-3d-la-meta.md) ═══════════ */
// `metaOra`: { chiave, nome, immagine | em | consegna, cella (dove ci si ferma), b (il bersaglio che si apre arrivati), regione }
const metaOra = shallowRef(null), guidato = ref(false), fermato = ref(null)
// i passi si scrivono nel DOM (come i rettangoli dei bersagli): un ref rifarebbe tutta la vista a ogni cella camminata
const passiEl = ref(null)
let passiMeta = Infinity
let campo = null, luci = [], guidaVisti = new Set()
const VELO_META = 2.5   // le celle aperte attorno alla strada, in celle
const daQui = (a, b) => Math.hypot(a.piede.x - io.x, a.piede.y - io.z) - Math.hypot(b.piede.x - io.x, b.piede.y - io.z)
const nomeDi = b => (b.ruolo === 'bacheca' ? personaDi(`bacheca:${b.citta}`).nome : b.nome || '')
// nell'ordine delle bussole: chi aspetta una consegna, la taglia seguita, la discesa (della missione presa o della storia)
function trovaLaMeta() {
  const chi = chiAspetta(props.missioni)
  if (chi.length) {
    const b = bersagli.value.filter(x => ['personaggio', 'minatore', 'mercante', 'bacheca'].includes(x.ruolo) && chi.includes(x.k)).sort(daQui)[0]
    if (b) return { chiave: 'chi:' + b.chiave, nome: nomeDi(b).replace(/^./, c => c.toUpperCase()), consegna: true, cella: b.accanto, b, regione: (regioneInCella(m, b.piede.x, b.piede.y) || {}).chiave }
  }
  const sg = taglieSeguita(), pm = sg && metaDellaTaglia(sg, props.missioni[sg.id])
  if (pm) {
    const alla = props.missioni[sg.id] === 'fatta' || sg.tipo === 'consegna'
    const b = alla ? bersagli.value.find(x => x.ruolo === 'bacheca' && x.citta === sg.consegnaA)
      : sg.tipo === 'esplora' && sg.bersaglio.tipo !== 'regione' ? bersagli.value.find(x => x.ruolo === sg.bersaglio.tipo && x.k === sg.bersaglio.chiave) : null
    return { chiave: 'taglia:' + sg.id, nome: sg.titolo, em: sg.em, cella: pm, b: b || null, regione: (regioneInCella(m, pm.x, pm.y) || {}).chiave }
  }
  const k = discesaDaSeguire(props.missioni, { x: io.x, y: io.z }, PIEDI(), props.segui, portaDellaStoria.value)
  const b = k && bersagli.value.find(x => x.ruolo === 'ingresso' && x.k === k)
  return b ? { chiave: k, nome: dungeonDi(k).nome, immagine: iconaDi(k, true), cella: b.accanto, b, regione: dungeonDi(k).regione } : null
}
// a tempo (con le bussole): la meta, i passi che mancano, da quale luce si accende la scia. Da fermi e lontani dalla scia se ne fa
// una nuova da qui; camminando no (la strada si rifà solo quando serve, non a ogni cella)
function aggiornaMeta() {
  const q = trovaLaMeta()
  if (!q) { if (metaOra.value) { metaOra.value = null; campo = null; luci = []; posaLaStrada(null) } return }
  if (!metaOra.value || metaOra.value.chiave !== q.chiave) {
    metaOra.value = markRaw(q)
    const fine = terra.passa(q.cella.x, q.cella.y) ? q.cella : terra.arrivo(m.partenza, q.cella)
    campo = fine ? campoVersoLaMeta(terra, fine) : null
    rifaiLaStrada()
  }
  const c = cellaDiMe(), n = campo ? campo.passi(c.x, c.y) : Infinity
  const tondo = Number.isFinite(n) ? Math.round(n) : Infinity
  if (tondo !== passiMeta || (passiEl.value && passiEl.value.dataset.passi == null && Number.isFinite(tondo))) {
    passiMeta = tondo
    if (passiEl.value) { passiEl.value.textContent = passiDetti(tondo); if (Number.isFinite(tondo)) passiEl.value.dataset.passi = tondo; else delete passiEl.value.dataset.passi }
  }
  const v = piuVicina(luci, io.x, io.z)
  if (v.i >= 0) scena.S.sciaDa = v.i
  if (!cammina.value && Number.isFinite(n) && n >= ARRIVATO_META && (v.i < 0 || v.d > 4)) rifaiLaStrada()
}
// la strada dalla cella dell'eroe alla meta (la discesa del campo, lisciata come i passi dell'A*): la scia, il velo, i punti da camminare
function rifaiLaStrada() {
  const da = cellaDiMe()
  const via = campo && terra.passa(da.x, da.y) ? campo.strada(da) : null
  if (!via) { luci = []; posaLaStrada(null); return null }
  const punti = [da, ...terra.liscia(da, via)].map(p => ({ x: p.x + 0.5, z: p.y + 0.5 }))
  luci = luciDellaStrada(punti)
  posaLaStrada({ luci, meta: punti[punti.length - 1], velo: celleDelVelo([da, ...via], m.W, m.H, VELO_META) })
  return punti
}
function posaLaStrada(st) {
  if (!scena) return
  scena.S.scia = st ? { luci: st.luci, meta: st.meta } : null
  scena.S.sciaDa = 0
  scena.apriLaStrada(st ? st.velo : [])
}
// «portami lì»: l'eroe cammina lungo la scia fino alla meta, e arrivato si apre quello che c'è (il fumetto della discesa, la
// bacheca, chi aspetta). Si ferma da sé se compare un mostro (mostriDelPasso); toccato di nuovo mentre si cammina, si ferma.
// `sempre`: dalla veduta o dalla bussola, che non fermano
function portami({ sempre = false } = {}) {
  if (guidato.value && !sempre) { via = []; meta = null; cammina.value = false; guidato.value = false; salva(); return }
  const q = metaOra.value
  if (!q || inScontro || attesaScontro) return
  if (props.veduta) emit('veduta', false)
  chiudi(); chiudiDialogo(); mostri.lascia()
  avviso.value = ''; fermato.value = null
  if (q.b && Math.hypot(io.x - (q.b.accanto.x + 0.5), io.z - (q.b.accanto.y + 0.5)) <= 1.5) { via = []; cammina.value = false; return apri(q.b) }
  const punti = rifaiLaStrada()
  if (!punti) return q.b ? tocca(q.b) : vaiA(q.cella)
  via = punti.slice(1); meta = q.b || null; primaVolta.value = false
  guidaVisti = new Set(scena.S.mostri.filter(x => x.alfa > 0.3).map(x => x.i))
  if (!via.length) return arriva()
  cammina.value = true; guidato.value = true
}

// la veduta: i nomi delle città, dei dungeon trovati, delle regioni viste e le pietre accese
const nomiVeduta = computed(() => {
  if (!props.veduta || !m) return []
  const l = []
  for (const c of m.citta) if (visto({ x: c.centro.x, y: c.centro.y })) l.push({ chiave: 'citta:' + c.chiave, testo: c.nome, classe: 'citta', x: c.centro.x + 0.5, y: 3, z: c.centro.y - 2 })
  const q = metaOra.value
  for (const b of bersagli.value) {
    if (!trovati.value.has(b.chiave)) continue
    const l0 = b.lotto
    if (b.ruolo === 'ingresso' && !(q && q.b === b)) l.push({ chiave: b.chiave, bersaglio: b.chiave, testo: dungeonDi(b.k).nome, classe: datoDelPosto(b).aperto ? 'dungeon' : 'dungeon chiuso', x: l0.x + l0.w / 2, y: 3, z: l0.y })
    if (b.ruolo === 'pietra') l.push({ chiave: b.chiave, bersaglio: b.chiave, testo: accese.value.has(b.k) ? '✦' : '·', classe: accese.value.has(b.k) ? 'pietra accesa' : 'pietra', x: l0.x + 1, y: 1.5, z: l0.y + 1 })
  }
  for (const r of m.regioni) if (r.anello > 0 && visto({ x: r.cx, y: r.cy })) l.push({ chiave: 'regione:' + r.chiave, testo: r.nome, classe: 'regione', x: r.cx + 0.5, y: 1, z: r.cy + 0.5 })
  // le bacheche già trovate (col segno: c'è un foglio da prendere, o da consegnare) e la meta della taglia che si segue: un cerchio sul posto
  for (const b of bersagli.value) if (b.ruolo === 'bacheca' && trovati.value.has(b.chiave)) {
    const sg = segniBacheca.value[b.citta]
    l.push({ chiave: b.chiave, bersaglio: b.chiave, testo: `📜${sg ? ' ' + GLIFO[sg] : ''}`, classe: 'bacheca', x: b.lotto.x + 1, y: 4, z: b.lotto.y - 1 })
  }
  // la meta di adesso, anche sotto le nuvole: un tocco è «portami lì»
  if (q) {
    const p = q.b && q.b.lotto ? { x: q.b.lotto.x + q.b.lotto.w / 2, z: q.b.lotto.y } : { x: q.cella.x + 0.5, z: q.cella.y + 0.5 }
    l.push({ chiave: q.chiave.startsWith('taglia:') ? q.chiave : 'meta:' + q.chiave, testo: `◎ ${q.nome}`, classe: 'meta', meta: true, x: p.x, y: 3.5, z: p.z })
  }
  const sg = taglieSeguita()
  const meta = sg && !(q && q.chiave === 'taglia:' + sg.id) && metaDellaTaglia(sg, props.missioni[sg.id])
  if (meta) l.push({ chiave: 'taglia:' + sg.id, testo: `${sg.em} ◎`, classe: 'meta', x: meta.x + 0.5, y: 1.5, z: meta.y + 0.5 })
  l.push({ chiave: 'eroe', testo: 'tu', classe: 'tu', x: io.x, y: 2.5, z: io.z })
  return l
})

// chi aspetta una consegna, o la discesa della missione: fuori dalla vista un tondo sul bordo che indica la strada
const fuori = ref([])
let fuoriChiave = ''
const portaDellaStoria = computed(() => discesaDellaStoria(props.tappe))
const PIEDI = () => Object.fromEntries(bersagli.value.filter(b => b.ruolo === 'ingresso').map(b => [b.k, { x: b.accanto.x + 0.5, y: b.accanto.y + 0.5 }]))
function aggiornaBussole() {
  if (!inScontro) aggiornaMeta()
  if (props.veduta || inScontro) { if (fuori.value.length) { fuori.value = []; fuoriChiave = '' } return }
  const lista = [], cx = vL / 2, cy = (sopra + vA - sotto) / 2, M = 30
  const alBordo = (sx, sy, resto) => {
    const dx = sx - cx, dy = sy - cy, k = Math.min((dx > 0 ? vL - M - cx : cx - M) / Math.abs(dx || 1e-6), (dy > 0 ? vA - sotto - M - cy : cy - sopra - M) / Math.abs(dy || 1e-6))
    if (k >= 1) return
    lista.push({ ...resto, x: Math.round(cx + dx * k), y: Math.round(cy + dy * k), gradi: Math.round(Math.atan2(dy, dx) * 180 / Math.PI) })
  }
  const chi = chiAspetta(props.missioni)
  for (const b of bersagli.value) if (['personaggio', 'minatore', 'mercante', 'bacheca'].includes(b.ruolo) && chi.includes(b.k)) {
    scena.aSchermo(b.piede.x + 0.5, scena.quota(b.piede.x + 0.5, b.piede.y + 0.5) + 1, b.piede.y + 0.5, pt)
    alBordo(pt.x, pt.y, { chiave: b.k, nome: b.nome })
  }
  const metaD = discesaDaSeguire(props.missioni, { x: io.x, y: io.z }, PIEDI(), props.segui, portaDellaStoria.value)
  if (metaD) {
    const b = bersagli.value.find(x => x.ruolo === 'ingresso' && x.k === metaD)
    if (b) { scena.aSchermo(b.lotto.x + b.lotto.w / 2, scena.quota(b.lotto.x, b.lotto.y) + 1, b.lotto.y + b.lotto.h / 2, pt); alBordo(pt.x, pt.y, { chiave: metaD, meta: true, nome: dungeonDi(metaD).nome, immagine: iconaDi(metaD, true) }) }
  }
  // la taglia di sopra che si segue (il cuore della regione, l'ingresso, la bacheca): un tondo azzurro con la sua faccia
  const sg = taglieSeguita(), pm = sg && metaDellaTaglia(sg, props.missioni[sg.id])
  if (pm) { scena.aSchermo(pm.x + 0.5, scena.quota(pm.x + 0.5, pm.y + 0.5) + 1, pm.y + 0.5, pt); alBordo(pt.x, pt.y, { chiave: 'taglia:' + sg.id, meta: true, nome: sg.titolo, em: sg.em }) }
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
  scena = mod.creaMondo3d(tela.value, { m, nebbia, passo, dopo, fontane, strato: stratoEl.value, dpr: Number(h.get('dpr')) || undefined, perso: () => { perso.value = true },
    frecce: Object.fromEntries(m.citta.map(c => [c.chiave, frecceDelCartello(m, c.chiave).map(f => versoInRadianti(f.verso))])) })
  if (!scena) { perso.value = true; return }
  markRaw(scena)
  if (h.get('nebbia') === 'no') import('../scena3d/mondo/vesti.js').then(v => { v.U.uNebbia.value = 0 })
  if (h.has('senzaeroe')) scena.S.io.nascosto = true
  scena.S.io.x = io.x; scena.S.io.z = io.z
  aggiornaScena()
  misura()
  scena.avvia()
  pronto.value = true
  if (props.annuncio && !props.annuncio.sentita) dillo(C_E_UNA_NOTIZIA)
  if (typeof window !== 'undefined') {
    window.__sotterraneo3d = scena
    window.__mondo3d = { scena, m, io, bersagli: () => bersagli.value, trovati: () => [...trovati.value], giro: () => giro.value,
      vai(chiave) { const b = bersagli.value.find(x => x.chiave === chiave || x.k === chiave); if (!b) return null; via = []; io.x = b.accanto.x + 0.5; io.z = b.accanto.y + 0.5 + 0.01; scena.salta(); ultimaCella = -1; return b.chiave },
      porta(x, z) { via = []; io.x = x; io.z = z; scena.salta(); ultimaCella = -1 },
      // i mostri di sopra (per le prove): lo stato del motore, chi si vede adesso (e dove sta a schermo), e l'eroe portato a `d` celle
      // dal mostro `i`, nella sua regione e fuori dalla cintura, su una cella dove si cammina
      stato: () => mostri.stato, inScontro: () => inScontro, senzaMostri() { senzaMostri = true }, palco: () => scena.palcoSopra && scena.palcoSopra.pittore,
      mostri: () => scena.S.mostri.map(q => { scena.aSchermo(q.x, scena.quota(q.x, q.z) + 0.6, q.z, pt); return { i: q.i, x: q.x, z: q.z, sveglio: q.sveglio, alfa: q.alfa, schermo: [Math.round(pt.x), Math.round(pt.y)] } }),
      vicinoAl(i, d = 6) {
        const q = mostri.stato.mostri[i]
        if (!q) return null
        let mig = null
        const R = Math.ceil(d) + 2
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
          const x = Math.floor(q.fx) + dx, y = Math.floor(q.fy) + dy, dd = Math.hypot(x + 0.5 - q.fx, y + 0.5 - q.fy)
          if (Math.abs(dd - d) > 0.8 || !terra.passa(x, y) || m.reg[y * m.W + x] !== q.regione || alSicuro(m, x + 0.5, y + 0.5)) continue
          if (!mig || Math.abs(dd - d) < mig.s) mig = { x, y, s: Math.abs(dd - d) }
        }
        if (!mig) return null
        via = []; io.x = mig.x + 0.5; io.z = mig.y + 0.5; scena.salta(); ultimaCella = -1
        return { x: mig.x, y: mig.y }
      } }
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
// un ritorno in città fa un giro nuovo: chi vive sopra rinasce (motore/aperta.js, nuovoGiro)
watch(giro, g => { if (mostri && g !== mostri.stato.giro) { mostri.giro(g); fotoScontro = null } })
</script>

<template>
  <div ref="vista" class="sot-terra sot3d-mondo" data-mondo3d :data-pronto="pronto ? 1 : 0" :data-in-veduta="veduta ? 1 : 0"
       @pointerdown="premi" @pointermove="muovi" @pointerup="lascia" @pointercancel="lascia" @click="toccaPrato" @wheel="rotella">
    <canvas ref="tela" class="sot3d-tela-mondo" data-tela="mondo"></canvas>
    <!-- le scritte della scena (scena3d/etichette.js) e quelle dello scontro di sopra (viste/Scontro3d.vue, dal posto di Gioco.vue) -->
    <div ref="stratoEl" class="sot3d-strato" data-strato3d></div>
    <slot name="scontro" />
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
              :data-pietra="b.ruolo === 'pietra' ? b.k : null" :data-viandante="b.ruolo === 'viandante' ? b.k : null" :data-scavo="b.ruolo === 'scavo' ? b.k : null"
              :data-accesa="b.ruolo === 'pietra' ? (accese.has(b.k) ? 1 : 0) : null"
              :data-cartello="b.ruolo === 'cartello' ? b.citta : null" :data-bacheca="b.ruolo === 'bacheca' ? b.citta : null" :data-fontana="b.ruolo === 'fontana' ? b.citta : null"
              :data-portale="b.ruolo === 'portale' ? '' : null" :data-grata="b.ruolo === 'grata' ? b.k : null"
              :data-divieto="b.ruolo === 'ingresso' && divieti.has(b.k) ? b.k : null"
              :data-trovato="trovati.has(b.chiave) ? 1 : 0" :data-saluta="b.tipo === 'persona' ? (salutano.has(b.chiave) ? 1 : 0) : null"
              :data-segno="segnoSopra(b)" :aria-label="trovati.has(b.chiave) ? (b.nome || (b.ruolo === 'ingresso' ? dungeonDi(b.k).nome : b.ruolo)) : null"
              :tabindex="trovati.has(b.chiave) ? 0 : -1" @click.stop="tocca(b)">
        <b v-if="b.ruolo === 'scavo'" class="sot-tre-punti sot-segno-x" aria-hidden="true">✕</b>
        <b v-else-if="b.ruolo === 'minatore' && !parlato" class="sot-tre-punti">…</b>
        <b v-else-if="b.ruolo === 'minatore' && annuncio && !annuncio.sentita" class="sot-tre-punti sot-segno-missione sot-segno-nuova" data-segno-di="annuncio">!</b>
        <b v-else-if="segnoSopra(b)" class="sot-tre-punti sot-segno-missione" :class="'sot-segno-' + segnoSopra(b)">{{ GLIFO[segnoSopra(b)] }}</b>
        <span v-if="b.ruolo === 'mercante' && trovati.has(b.chiave) && richiamo(b.k)" class="sot-richiamo" data-richiamo :data-richiamo-di="curaDi(b.k).risorsa">{{ richiamo(b.k) }}</span>
        <span v-else-if="b.ruolo === 'fontana' && trovati.has(b.chiave) && !(aperto && aperto.chiave === b.chiave) && curaDellaFontana(forze).serve" class="sot-richiamo" data-richiamo data-richiamo-di="fontana">{{ FONTANA.richiamo }}</span>
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

    <!-- i mostri di sopra nel cerchio di luce: si toccano (lo scontro, o l'eroe gli va incontro); il signore e i caporali col nome,
         chi dorme col sonno. E il bottino rimasto per terra. Posati a ogni fotogramma come le persone -->
    <div class="sot3d-bersagli">
      <button v-for="q in mostriVisti" :key="'m' + q.i" :ref="el => (el ? elMostri.set(q.i, el) : elMostri.delete(q.i))" type="button"
              class="sot3d-bersaglio sot3d-mostro" data-mostro-sopra :data-i="q.i" :data-tipo="q.tipo" :data-vis="0"
              :data-sveglio="q.sveglio ? 1 : 0" :data-caporale="q.caporale ? 1 : null" :data-signore="q.signore ? 1 : null"
              :aria-label="q.nome || q.tipo" @click.stop="toccaMostro(q.i)">
        <b v-if="q.signore" class="sot3d-nome-mostro sot3d-signore" data-nome-signore>👑 {{ q.nome }}</b>
        <b v-else-if="q.caporale" class="sot3d-gradi-mostro" aria-hidden="true"><i class="sot3d-galloni"></i></b>
        <b v-if="!q.sveglio && !q.signore" class="sot3d-sonno-mostro em" aria-hidden="true">💤</b>
      </button>
      <button v-for="c in coseVisti" :key="'t' + c.i + c.cosa" :ref="el => (el ? elCose.set(c.i, el) : elCose.delete(c.i))" type="button"
              class="sot3d-bersaglio sot3d-per-terra" data-per-terra :data-i="c.i" :data-cosa="c.cosa" :data-vis="0"
              aria-label="raccogli" @click.stop="toccaCosa(c.i)"></button>
    </div>

    <div v-if="veduta" class="sot3d-veduta" data-veduta>
      <button v-for="n in nomiVeduta" :key="n.chiave" :ref="el => (el ? nomiEl.set(n.chiave, el) : nomiEl.delete(n.chiave))" type="button"
              class="sot3d-nome-posto" :class="n.classe.split(' ').map(c => 'sot3d-nome-' + c)" :data-nome-posto="n.chiave"
              @click.stop="toccaNome(n)">{{ n.testo }}</button>
    </div>

    <div v-if="aperto && fumettoDati" ref="fumEl" class="sot-fumetto sot3d-fumetto" data-fumetto
         :data-fumetto-di="aperto.ruolo === 'ingresso' ? aperto.k : aperto.ruolo" :class="{ 'sot-tenue': fumettoDati.tipo === 'posto' && !fumettoDati.aperto }"
         style="visibility: hidden" @click.stop>
      <FumettoMondo :f="fumettoDati" @scendi="scendi" @giu="giuDalPortale" @viaggio="viaggia" @bevi="bevi" @taglia="allaBacheca" @scava="scava" />
    </div>

    <button v-for="f in fuori" :key="'fuori-' + f.chiave" class="sot-bussola" :class="{ 'sot-bussola-meta': f.meta }"
            :data-consegna-fuori="f.meta ? null : f.chiave" :data-meta-fuori="f.meta ? f.chiave : null"
            :aria-label="f.meta ? 'La meta della tua missione: ' + f.nome : 'Hai una consegna per ' + f.nome"
            :style="{ left: f.x + 'px', top: f.y + 'px' }" @click.stop="f.meta && metaOra && (metaOra.chiave === f.chiave) ? portami({ sempre: true }) : vaDa(f.chiave)">
      <i class="sot-bussola-freccia" :style="{ transform: `rotate(${f.gradi}deg) translateX(28px)` }"></i>
      <b v-if="!f.meta">?</b>
      <b v-else><img v-if="f.immagine" class="sot-ritaglio" :src="f.immagine" alt="" data-ritaglio><span v-else-if="f.em" class="em">{{ f.em }}</span></b>
    </button>

    <div ref="sopraEl" class="sot-terra-sopra">
      <slot name="sopra" />
      <!-- la meta di adesso: cosa, quanto lontano, e «portami lì» (docs/sotterraneo/mondo-3d-la-meta.md) -->
      <div v-if="metaOra && pronto && !inScontroV" class="sot3d-meta" data-meta-carta :data-meta="metaOra.chiave"
           :data-guidato="guidato ? 1 : 0" :data-fermato="fermato" @click.stop>
        <span class="sot3d-meta-icona" :class="{ 'sot3d-meta-consegna': metaOra.consegna }" aria-hidden="true">
          <img v-if="metaOra.immagine" :src="metaOra.immagine" alt="" data-ritaglio>
          <b v-else-if="metaOra.consegna">?</b>
          <span v-else class="em">{{ metaOra.em }}</span>
        </span>
        <span class="sot3d-meta-testo">
          <b data-meta-nome>{{ metaOra.nome }}</b>
          <i ref="passiEl" data-meta-passi></i>
        </span>
        <button type="button" class="sot-grosso sot3d-meta-vai" data-azione="portami" @click.stop="portami()">
          <template v-if="guidato">✋ fermati</template><template v-else><span class="em">👣</span> portami lì</template>
        </button>
      </div>
    </div>
    <div ref="sottoEl" class="sot-terra-sotto">
      <span v-if="fiocco" :key="fiocco.n" class="sot-cura-fiocco sot3d-fiocco" :class="fiocco.risorsa === 'energia' ? 'sot-cura-energia' : 'sot-cura-vita'" data-cura-fiocco
            :data-risorsa="fiocco.risorsa" @animationend="fiocco = null">{{ fiocco.testo }}<template v-if="fiocco.risorsa !== 'tutto'"> {{ fiocco.risorsa === 'vita' ? '❤️' : '⚡' }}</template></span>
      <p v-if="avviso" class="sot-trovato" :class="coloreAvviso && 'sot3d-annuncio sot3d-annuncio-' + coloreAvviso" data-avviso-terra :data-annuncio="coloreAvviso">{{ avviso }}</p>
      <p v-else-if="veduta" class="sot-trovato sot-piano" data-veduta-dice>Tocca dove vuoi andare: ci vai a piedi.</p>
      <p v-else-if="primaVolta && pronto" class="sot-trovato sot-piano">Tocca dove vuoi andare.</p>
      <Dialogo v-if="dialogo" :chi="dialogo.chi" :nome="dialogo.nome" :pagine="dialogo.pagine" :giro="dialogo.giro"
               :scelte="scelteDelDialogo" @scegli="scegli" />
    </div>

    <Foglio v-if="domandaPietra" :titolo="domandaPietra.scavo ? 'La X della mappa' : 'Una pietra del viaggio'"
            :data-pietra-domanda="domandaPietra.scavo ? null : ''" :data-scavo-domanda="domandaPietra.scavo ? '' : null"
            :dice="domandaPietra.scavo ? 'Il terreno è duro. Rispondi giusto e scavi fino in fondo.' : 'Una runa spenta. Rispondi giusto e si accende: da lì potrai viaggiare alle altre pietre accese, gratis.'">
      <div class="sot-domanda">
        <Domanda :domanda="domandaPietra.q.domanda" :pittori="domandaPietra.q.pittori" :origine="domandaPietra.q"
                 gioco="sotterraneo" :respiro="900" @risposto="rispostoPietra" />
      </div>
      <button class="sot-grosso sot-chiaro" data-azione="dopo" @click.stop="domandaPietra = null">più tardi</button>
    </Foglio>
  </div>
</template>
