<script setup>
// Il mondo di sopra del Sotterraneo 3D: il mondo a percorso (motore/mondo-percorso.js, seme 8: sette zone in serpentina, il
// villaggio in fondo a sud-ovest) disegnato in WebGL (scena3d/mondo/), al posto della terra dipinta (viste/Terra.vue, che resta del
// Sotterraneo di sempre). L'eroe cammina dove si tocca, i mercanti e chi dà le missioni stanno nel villaggio, i quattordici dungeon
// hanno i loro ingressi modellati, le pietre del viaggio (una per zona) si accendono con una domanda, la nebbia si apre camminando e
// si salva. La scena carica le zone attorno all'eroe e lo dice qui (`zone`): la terra dove si cammina si rifà. Le stesse porte di
// Terra.vue verso Campagna.vue (`scendi`, `bottega`, `riprendi`, `sentito`, `cura`) più `mondo` (ricordati questo), `risposta` (la
// domanda di una pietra: le monete) e `veduta` (chiudi la veduta d'insieme). Le regole: docs/sotterraneo/mondo-3d.md.
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, nextTick, markRaw } from 'vue'
import { PERSONAGGI_DI_SOPRA, personaDi, missioneDi } from '../dati/missioni.js'
import { FONTANA } from '../dati/dialoghi.js'
import { MERCANTI, mercanteDi } from '../dati/mercanti.js'
import { segnoDi, GLIFO, chiAspetta, presePer, discesaDellaStoria } from '../motore/missioni.js'
import { prese as presePerTipo, esploratePronte } from '../motore/taglie.js'
import { vociDellaBacheca, segnoDellaBacheca, postoSulPrato } from '../motore/taglie-bacheca.js'
import { apertura, scelte as scelteDi, risposta as rispostaDi, dopoLaPresa, dopoLaConsegna, novita as novitaDi,
         curaDi, mancaA, richiamoDi, dopoLaCura, stradaDelCapitano } from '../motore/dialoghi.js'
import { laStoria, dettoDelLivello } from '../motore/storia.js'
import { DETTI_DEL_COLORE, C_E_UNA_NOTIZIA } from '../dati/zone.js'
import { iconaDi } from '../dati/terra.js'
import { ilMondo, seguiLEroe, terraDelMondo, zonaDi, baseDi, postiDi, cittaInCella, regioneInCella, zonaInCella, portaleDella, minatoreDi, ingressoDi,
         nomeDellaPietra, difDellaPietra, pietraAccanto, meteDelViaggio, mondoDaSalvato, mondoDaSalvare, lontanoDalleCitta,
         frecceDelCartello, dungeonDi, dungeonDellIndice, fontaneDi, curaDellaFontana, VISTA_MONDO, PASSO_MONDO } from '../motore/mondo-sopra.js'
import { rettangoloPersona, rettangoloPosto, personaVicina, spartisciPersone, eTrascinare, zoomDaPizzico } from '../scena3d/mondo/dito.js'
import { domandaPerGioco } from '../../../quiz/scelta.js'
import Domanda from '../../../quiz/Domanda.vue'
import Dialogo from './Dialogo.vue'
import Foglio from './Foglio.vue'
import FumettoMondo from './FumettoMondo.vue'
import { RITMO } from '../dati/pensieri.js'
import { creaMostriSopra } from './mondo-mostri.js'
import { annuncioDi, alSicuro, signoreVivo } from '../motore/aperta.js'
import { fotoDelloScontro } from '../motore/aperta-scena.js'
import { allaCitta } from '../motore/forze-sopra.js'
import { SOPRA } from '../dati/mondo-aperto-mostri.js'
import { stradaDelMondo, stradaPesata } from '../motore/strada-sopra.js'
import { metaScelta, campoVersoLaMeta, metaVicina, celleDelVelo, luciDellaStrada, piuVicina, doveEsceLaStrada, pietraPerAndare, passiDetti, ARRIVATO_META } from '../motore/meta-sopra.js'

const props = defineProps({
  tappe: { type: Array, required: true },
  dungeon: { type: Array, default: null },   // i tredici dungeon del mondo per chiave (Gioco.vue), coi sei nuovi senza indice
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
  terre: { type: Object, default: null },     // la porta delle terre (motore/terre.js, laPorta): { ora, aperta, ultima, qui, dopo, altre }
})
// `pensa`, `pensiero`, `pensiero-fine`, `trovati`: lo stesso contratto dei pensieri di viste/Terra.vue
// `scontro` ({ inc, stato, terra, verso }): un mostro di sopra apre uno scontro (Gioco.vue lo gioca, `apriPalco` lo disegna qui);
// `raccogli` (i): la cosa per terra `i` è sotto i piedi dell'eroe. Le forze di sopra vanno in `mondo.sopra` col resto (salva)
const emit = defineEmits(['scendi', 'mondo', 'bottega', 'riprendi', 'sentito', 'cura', 'risposta', 'veduta', 'pensa', 'pensiero', 'pensiero-fine', 'trovati',
                          'scontro', 'raccogli', 'terre'])
const minuscolo = s => { const t = String(s ?? ''); return t.charAt(0).toLowerCase() + t.slice(1) }   // un nome che manca non rompe la pagina
// la terra dove si cammina (docs/sotterraneo/terre-successive.md): la stessa mappa, i mostri più su; la prima se Gioco.vue non lo dice
const terraQui = () => (props.terre ? props.terre.ora : 1)
const RAGGIO_SALUTO = 6, RAGGIO_RIARMO = 9, DURATA_SALUTO = 1.4
// quanto è alto il bersaglio di un ingresso, per monumento (scena3d/mondo/monumenti.js)
const ALTO_DEL_MONUMENTO = { torre: 4.8, botola: 1.6, menhir: 2.6, palafitta: 3.4, fumarola: 2.6, tomba: 3.2 }

/* ═══════════ il mondo e chi ci sta (non reattivi: si leggono e basta) ═══════════ */
let m = null, terra = null, nebbia = null, scena = null, fontane = []
let terraVecchia = false   // la scena ha caricato una zona: la terra dove si cammina si rifà al passo dopo (terraDelMondo)
const pronto = ref(false), perso = ref(false)
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
let allontanato = false
// i mostri di sopra (viste/mondo-mostri.js, motore/aperta.js): lo stato del motore, e lo scontro aperto (`inScontro`: lo gioca
// Gioco.vue, lo disegna il palco della scena). `fotoScontro`: chi è in campo, salvato in `mondo.sopra.scontro` finché lo scontro c'è
const inScontroV = ref(false)   // lo stesso, per il disegno (la carta della meta si nasconde)
let mostri = null, inScontro = false, attesaScontro = false, inCampo = null, fotoScontro = null, prossimiMostri = 0
const mostriVisti = ref([]), coseVisti = ref([])
const elMostri = new Map(), elCose = new Map()

// la tappa di un ingresso: dai tredici dungeon del mondo (Gioco.vue, `dungeonDelMondo`: i sette come le tappe, i sei nuovi per
// chiave, docs/sotterraneo/dungeon-che-si-rigenerano.md), o dalle tappe se quella lista non c'è
const tappaDi = chiave => (props.dungeon && props.dungeon.find(t => t.chiave === chiave)) || props.tappe.find(t => t.chiave === chiave) || null
// un ingresso (il bersaglio, `k` la chiave della discesa): il dungeon coi nomi nuovi, la sua tappa, se è aperto. I sei dungeon nuovi
// (nessun indice) si aprono quando Gioco.vue ne dà la tappa (dati/dungeon-del-mondo.js, il compito C)
const datoDelPosto = b => {
  const d = dungeonDi(b.k), t = tappaDi(b.k), abisso = b.k === 'abisso'
  return { d, t, abisso, nuovo: !!d && d.indice == null, aperto: abisso ? !!props.abisso : !!(t && t.aperta) }
}

// il posto sul prato di una taglia (il viandante, la X): lo stesso per lo stesso id, calcolato una volta per taglia
const postiTaglie = new Map()
function postoDi(t) {
  if (!postiTaglie.has(t.id)) postiTaglie.set(t.id, postoSulPrato(m, terra, t))
  return postiTaglie.get(t.id)
}
// il modello 3D di una persona (scena3d/persona3d.js, docs/sotterraneo/persone-3d.md): quello dello sprite, ma il capitano ha il suo
const modelloDellaPersona = b => (b.ruolo === 'personaggio' && b.k === 'capitano' ? 'capitano' : b.sprite)
function preparaBersagli() {
  const l = [], piede = p => ({ x: p.piede.x, y: p.piede.y })
  const persona = (tipo, k, p, extra) => l.push({ chiave: `${tipo}:${p.citta || ''}:${k}`, tipo: 'persona', ruolo: tipo, k, citta: p.citta || null,
    piede: piede(p), accanto: { ...p.accanto }, alto: 2.2, ...extra })
  for (const p of postiDi(m, 'mercante')) { const me = mercanteDi(p.chiave); if (me) persona('mercante', p.chiave, p, { nome: me.nome, sprite: me.sprite }) }
  for (const p of [...m.persone, ...m.villaggio.persone]) {
    const d = PERSONAGGI_DI_SOPRA[p.chiave]
    if (d) persona('personaggio', p.chiave, p, { nome: d.nome, sprite: d.sprite, scala: d.scala || null, tinta: d.tinta || null })
  }
  const mi = minatoreDi(m)
  if (mi) persona('minatore', 'minatore', mi, { nome: 'il vecchio minatore', sprite: 'minatore' })
  // le taglie in mano che vogliono qualcosa sul prato: chi si è perso (si parla) e la X della mappa (si scava). Ci sono solo finché la
  // taglia è in mano (docs/sotterraneo/mondo-aperto-quest.md)
  for (const t of presePerTipo(props.missioni, 'trovachi')) { const q = postoDi(t); if (q) persona('viandante', t.id, { ...q, citta: null }, { nome: t.viandante.nome, sprite: t.viandante.sprite }) }
  const posto = (tipo, p, extra) => l.push({ chiave: `${tipo}:${p.chiave}`, tipo: tipo === 'cartello' || tipo === 'bacheca' ? 'cosa' : 'posto', ruolo: tipo, k: p.chiave,
    citta: p.citta || null, lotto: { x: p.x, y: p.y, w: p.w, h: p.h }, accanto: { ...p.accanto }, piede: piede(p), alto: 2.4, ...extra })
  for (const p of postiDi(m, 'ingresso')) posto('ingresso', p, { alto: ALTO_DEL_MONUMENTO[p.monumento] || 3.2, monumento: p.monumento, zona: p.zona })
  for (const p of postiDi(m, 'pietra')) posto('pietra', p, { alto: p.chiave === 'villaggio' ? 1.6 : 2.6, zona: p.zona || null })
  for (const p of postiDi(m, 'terre')) posto('terre', p, { alto: 3.8, nome: 'La porta delle terre' })
  for (const p of postiDi(m, 'cartello')) posto('cartello', p, { alto: 1.7 })
  for (const p of postiDi(m, 'bacheca')) posto('bacheca', p, { alto: 2.1 })
  for (const f of fontane) posto('fontana', { ...f, chiave: f.citta }, { alto: 2.4 })
  for (const t of presePerTipo(props.missioni, 'mappa')) { const q = postoDi(t); if (q) posto('scavo', { chiave: t.id, x: q.piede.x, y: q.piede.y, w: 1, h: 1, piede: q.piede, accanto: q.accanto }, { alto: 1.4 }) }
  if (props.portale) {
    const p = portaleDella(m)
    if (p) posto('portale', p, { alto: 1.9 })
  }
  bersagli.value = markRaw(l)
  persone.length = 0
  for (const b of l) if (b.tipo === 'persona') persone.push({ chiave: b.chiave, fermo: `${b.sprite}-fermo-0`, saluto: `${b.sprite}-saluta-0`, pezzo: `${b.sprite}-fermo-0`, x: b.piede.x + 0.5, z: b.piede.y + 0.5, specchio: false,
                                                          scala: b.scala, tinta: b.tinta, modello: modelloDellaPersona(b), saluta: false })
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
  m = markRaw(ilMondo({ terra: terraQui() }))
  // il salvato rimesso in forma per questa mappa (motore/mondo-sopra.js): la firma, e chi aveva il mondo di prima ritrova la strada
  // fino alle discese finite (il travaso). Una terra dopo la prima comincia da capo: nessuna strada scoperta dalla storia
  const s = mondoDaSalvato(m, props.mondo, terraQui() > 1 ? [] : props.tappe)
  // dove si era; salendo dal portale accanto al gemello del villaggio. La zona di là si carica prima della terra
  const d = s.dove
  const gemello = props.portale ? portaleDella(m) : null
  let qui = m.partenza
  if (d && d.portale && gemello) qui = gemello.accanto
  else if (d && Number.isInteger(d.x) && d.x >= 0 && d.y >= 0 && d.x < m.W && d.y < m.H) { seguiLaZona(d.x, d.y); qui = d }
  terra = markRaw(terraDelMondo(m))
  if (qui === d && !terra.passa(d.x, d.y)) qui = m.partenza
  fontane = markRaw(fontaneDi(m, terra))
  nebbia = s.nebbia
  // il villaggio si vede tutto da subito: dalla partenza si devono vedere tutti quelli che ci stanno, senza girare
  // (docs/sotterraneo/mondo-a-percorso.md, «Il villaggio»)
  { const v = m.villaggio; for (let y = v.y; y < v.y + v.h; y++) for (let x = v.x; x < v.x + v.w; x++) nebbia[y * m.W + x] = 1 }
  accese.value = new Set(s.pietre)
  parlato.value = !!s.parlato
  ascoltate.value = { ...(s.novita || {}) }
  giro.value = s.giro || 0
  mostri = markRaw(mostriDelMondo(s.sopra || null))
  fotoScontro = mostri.scontroRimesso   // i rimasti di uno scontro lasciato con la ✕ restano scritti finché non si riapre
  preparaBersagli()
  divieti.value = new Set((Array.isArray(s.divieti) ? s.divieti : []).filter(k => { const b = bersagli.value.find(x => x.chiave === `ingresso:${k}`); return b && !datoDelPosto(b).aperto }))
  // salendo dal portale si torna in città (un giro); se no si riparte da dove si era, e si è «lontani» se non si è in città
  if (d && d.portale && gemello) { giro.value++; allontanato = false; mostri.giro(giro.value); fotoScontro = null }
  else allontanato = lontanoDalleCitta(m, qui.x, qui.y)
  io.x = qui.x + 0.5; io.z = qui.y + 0.5
  trovati.value = new Set(bersagli.value.filter(b => visto(cellaDelBersaglio(b))).map(b => b.chiave))
}
// prima che ci sia la scena, le zone attorno a dove si riparte si caricano qui (motore/mondo-sopra.js); poi le carica la scena, una
// per fotogramma, e lo dice con `zone`
const seguiLaZona = (x, y) => seguiLEroe(m, x, y)
// i mostri di sopra (viste/mondo-mostri.js) sul mondo a percorso. Se il motore non li sa ancora mettere su questa mappa (motore/aperta.js
// è del compito B) il mondo resta senza mostri, e lo dice nella console: tutto il resto si gioca
function mostriDelMondo(salvato) {
  try { return creaMostriSopra({ m, eroe: props.eroe.chiave || 'eroe', giro: giro.value, salvato }) } catch (e) {
    console.warn('mondo 3D: i mostri di sopra non partono su questa mappa', e)
    const vuoto = { mostri: [], perTerra: [], giro: giro.value, forze: null, lista: [] }
    return { stato: vuoto, mira: null, scontroRimesso: null, lascia() {}, giro() {}, passo: () => null, passi: () => false, tocca: () => null,
             figure: () => [], perTerra: () => [], inSalvo: () => null }
  }
}
let sporca = false, ultimoSalvato = 0
// `partito`: passata la porta delle terre, questo mondo non scrive più (smontandosi scriverebbe nella terra nuova)
let partito = false
function salva() {
  if (!m || partito) return
  sporca = false; ultimoSalvato = tempo
  const sopra = mostri.inSalvo(fotoScontro)
  emit('mondo', mondoDaSalvare(m, { nebbia, dove: { x: Math.floor(io.x), y: Math.floor(io.z) }, giro: giro.value, pietre: [...accese.value],
                                    parlato: parlato.value, divieti: [...divieti.value], novita: ascoltate.value, ...(sopra ? { sopra } : {}) }))
}

/* ═══════════ il passo: l'eroe cammina, guarda, chi sta fermo saluta ═══════════ */
const cellaDiMe = () => ({ x: Math.floor(io.x), y: Math.floor(io.z) })
const verso = { dx: 0, dy: 1 }
let tempo = 0, ultimaCella = -1, zonaOra = null, cittaOra = null
function vaiA(c, cosa = null) {
  let da = cellaDiMe()
  if (!terra.passa(da.x, da.y)) { const s = terra.arrivo(m.partenza, da); if (s) { io.x = s.x + 0.5; io.z = s.y + 0.5; da = s } }
  const arrivo = terra.arrivo(da, c)
  if (!arrivo) return false
  // a tocco come la scia: la strada vera, lontano dalle case, senza allungare oltre il limite (motore/strada-sopra.js)
  const sp = stradaPesata(terra, stradaDelMondo(m), da, arrivo)
  const strada = sp ? sp.via : (terra.strada(da, arrivo) || [])
  via = (sp ? sp.liscia(strada) : terra.liscia(da, strada)).map(p => ({ x: p.x + 0.5, z: p.y + 0.5 }))
  meta = cosa
  primaVolta.value = false
  if (scena) scena.cam.segui()   // mandato l'eroe da qualche parte, la vista torna a seguirlo (come nella fattoria)
  if (!via.length) arriva()
  else cammina.value = true
  return true
}
function arriva() {
  cammina.value = false
  salva()
  const q = meta
  meta = null
  if (q && q.tipo === 'terra') { emit('raccogli', q.i); salva(); return }   // Gioco.vue la mette in tasca (raccogliDaTerra)
  if (q) apri(q)
}
function passo(dt, t) {
  tempo = t
  // una zona caricata per la prima volta cambia dove si cammina (motore/mondo-sopra.js, terraDelMondo: la stessa se non è cambiato niente)
  if (terraVecchia) { terraVecchia = false; terra = markRaw(terraDelMondo(m)) }
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
  S.io.x = io.x; S.io.z = io.z; S.io.verso = verso; S.inCammino = via.length > 0
  for (const q of persone) { q.saluta = salutano.value.has(q.chiave); q.pezzo = q.saluta ? q.saluto : q.fermo; q.specchio = io.x < q.x - 0.2 }
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
  const c = cellaDiMe(), citta = cittaInCella(m, c.x, c.y), z = citta ? null : zonaInCella(m, c.x, c.y)
  // un ritorno in città conta solo se prima ci si è allontanati davvero (raggio + 8 celle da ogni centro): passare il confine a ogni
  // passo non fa girare la bacheca
  if (!citta && lontanoDalleCitta(m, c.x, c.y)) allontanato = true
  if (citta !== cittaOra) { if (citta && cittaOra === null && allontanato) { giro.value++; allontanato = false; sporca = true } cittaOra = citta }
  // entrando in una zona (o tornando al villaggio): il cartello grande col nome e la fascia, e la riga col colore per questo eroe
  // (motore/aperta.js, annuncioDi)
  const ora = citta ? 'villaggio' : z ? z.chiave : null
  if (ora && ora !== zonaOra) {
    if (zonaOra) annunciaLaZona(citta ? null : z)
    zonaOra = ora
  }
}
// il cartello della zona: il nome grande, il luogo e i livelli, col colore della zona, per qualche secondo (docs/sotterraneo/mondo-3d.md)
const zonaAnnunciata = ref(null)
let tZona = 0, nZona = 0
function annunciaLaZona(z) {
  let a = null
  try { a = annuncioDi(m, io.x, io.z, props.forza) } catch (e) { a = null }
  const r = regioneInCella(m, Math.floor(io.x), Math.floor(io.z))
  if (z) {
    const [cr, cg, cb] = z.colore || [120, 120, 120]
    zonaAnnunciata.value = { n: ++nZona, chiave: z.chiave, nome: z.nome, luogo: r && r.nome !== z.nome ? r.nome : null,
                             livelli: `livello ${z.fascia[0]}–${z.fascia[1]}`, colore: `rgb(${cr}, ${cg}, ${cb})` }
  } else zonaAnnunciata.value = { n: ++nZona, chiave: 'villaggio', nome: m.villaggio.nome, luogo: null, livelli: 'qui sei al sicuro', colore: 'rgb(150, 120, 70)' }
  clearTimeout(tZona); tZona = setTimeout(() => { zonaAnnunciata.value = null }, 3400)
  if (a && a.testo && !avviso.value) dillo(a.testo, a.colore || null)
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
  if (mostri) scena.S.taneSpente = mostri.stato.signoriMorti   // il fumo e le braci delle tane senza più signore si spengono (scena3d/mondo/indice.js)
  if (senzaMostri) { scena.S.mostri = []; if (mostriVisti.value.length) mostriVisti.value = []; return }
  if (!inScontro && !attesaScontro) {
    const inc = mostri.passo(dt, io, { fermo: !!(dialogo.value || domandaPietra.value || props.veduta || props.fermo) })
    if (inc) apriIncontro(inc)
  }
  const visto = (x, z) => scena.visto(x, z)
  scena.S.mostri = props.veduta ? [] : mostri.figure(io, t, visto, inCampo)
  scena.S.perTerra = props.veduta ? [] : mostri.perTerra(visto)
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
  via = []; meta = null; cammina.value = false
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
    saltaQui()
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
  S.scavi = bersagli.value.filter(x => x.ruolo === 'scavo').map(b => ({ chiave: b.k, x: b.piede.x + 0.5, z: b.piede.y + 0.5 }))
  S.pallini = new Map()
  for (const b of bersagli.value) if (b.ruolo === 'ingresso' && trovati.value.has(b.chiave)) {
    const d = datoDelPosto(b)
    if (d.aperto && !d.abisso) S.pallini.set(b.k, { colore: d.t && d.t.colore, adesso: !!(d.t && (d.t.adesso || d.t.nuova)) })
  }
  S.io.sprite = props.eroe.sprite || 'cavaliere'
  S.io.mano = props.roba ? props.roba.mano : null; S.io.mancina = props.roba ? props.roba.mancina : null; S.io.corpo = props.roba ? props.roba.corpo : null
  S.veduta = props.veduta
  S.terre = !!(props.terre && props.terre.aperta)
  // davanti a una discesa rossa sta la sentinella (docs/sotterraneo/zone.md)
  const sentinelle = bersagli.value.filter(b => b.ruolo === 'ingresso' && trovati.value.has(b.chiave) && (datoDelPosto(b).t || {}).colore === 'rosso')
  S.persone = [...persone, ...sentinelle.map(b => ({ chiave: `sentinella:${b.chiave}`, modello: 'guardia', pezzo: 'guardia-fermo-0', x: b.lotto.x + 0.3, z: b.lotto.y + b.lotto.h + 0.6 }))]
}

/* ═══════════ il fumetto ═══════════ */
const aperto = ref(null)             // il bersaglio col fumetto aperto
const fumetto = ref(null)
const LARGO_FUM = 244
// i fogli di una bacheca dipendono da chi è l'eroe, dal giro e da cosa si è già visto. Niente `raggiunge`: niente si chiude, e la
// terra delle zone caricate direbbe «non si raggiunge» a tutto quello che è lontano (docs/sotterraneo/mondo-sopra-contratto.md)
const ctxBacheca = () => ({ m, eroe: props.eroe.chiave, giro: giro.value, tappe: props.tappe, stati: props.missioni,
                            visto: (x, y) => nebbia[y * m.W + x] === 1 })
const ctx = () => ({ stati: props.missioni, tappe: props.tappe, abisso: !!props.abisso, eroe: props.eroe.chiave,
                     roba: props.roba, annuncio: props.annuncio, novita: ascoltate.value, forze: props.forze, mondo: true,
                     forza: props.forza, terra: terraQui(), dungeon: props.dungeon })   // la forza: il minatore e il capitano dicono in che zona stanno i mostri giusti per te
// sotto il livello di una discesa della storia (i sei nuovi non hanno l'eroe atteso: lo dice il colore del pallino)
const livelloDi = t => (t && !t.fatta && t.indice != null && t.indice >= 0 && props.roba ? dettoDelLivello(props.eroe.chiave, props.roba, t, t.indice) : null)
function rigaStoria(t) {
  const s = storia.value, porta = t && s.porte.find(x => x.chiave === t.chiave)
  if (!porta || s.finita || !t.aperta) return null
  if (porta.fatta) return { stato: 'chiusa', testo: `la porta è chiusa: ${porta.grosso} è caduto.` }
  if (s.corrente && s.corrente.chiave === porta.chiave && !s.corrente.ferma) return { stato: 'adesso', testo: `continua qui, in fondo aspetta ${porta.grosso}.` }
  return null
}
function chiusaPerche(d) {
  if (d.abisso) return 'Si apre quando hai finito tutte le discese.'
  const prima = d.t && d.t.indice > 0 ? dungeonDellIndice(d.t.indice - 1) : null
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
  // la pietra del villaggio riporta anche ai villaggi delle terre già viste (docs/sotterraneo/terre-successive.md, «Il viaggio indietro»)
  if (b.ruolo === 'pietra') return { tipo: 'pietra', nome: nomeDellaPietra(b.k), mete: meteDelViaggio(m, b.k, [...accese.value]),
                                     terre: b.k === 'villaggio' && props.terre ? props.terre.altre || [] : [] }
  if (b.ruolo === 'portale') return { tipo: 'portale', ...props.portale }
  if (b.ruolo === 'bacheca') {
    return { tipo: 'bacheca', citta: b.citta, nome: personaDi(`bacheca:${b.citta}`).nome, voci: vociDellaBacheca(b.citta, ctxBacheca()) }
  }
  if (b.ruolo === 'scavo') return { tipo: 'scavo', titolo: (missioneDi(b.k) || {}).titolo || 'La X' }
  if (b.ruolo === 'fontana') return { tipo: 'fontana', ...FONTANA, ...curaDellaFontana(props.forze) }
  if (b.ruolo === 'terre') {
    const p = props.terre, aperta = !!(p && p.aperta)
    const dice = aperta ? `La porta è aperta: di là c'è ${minuscolo(p.dopo.nome)}. Le stesse strade, mostri più forti.`
      : p && p.ultima ? 'Le rune restano spente: oltre questa terra non ce n\'è un\'altra.'
      : 'Un arco di pietra con le rune spente. Si apre quando batti chi comanda le tombe del vento.'
    return { tipo: 'terre', nome: 'La porta delle terre', aperta, dice, passa: 'passo dall\'altra parte' }
  }
  if (b.ruolo === 'cartello') {
    const q = metaOra.value, qui = !!(q && q.regione === 'villaggio')
    const frecce = frecceDelCartello(m, b.citta).map(x => ({ ...x,
      detto: `${minuscolo(x.nome)}, verso ${minuscolo(m.zone[0].nome)} e oltre`,
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
// un salto (la pietra, il risveglio, le prove): la zona di arrivo si carica subito e la terra si rifà, poi la telecamera ci salta
function saltaQui() {
  if (scena) { scena.caricaQui(io.x, io.z); scena.salta() }
  if (terraVecchia) { terraVecchia = false; terra = markRaw(terraDelMondo(m)) }
  ultimaCella = -1
}
function viaggia(chiave) {
  const p = postiDi(m, 'pietra').find(x => x.chiave === chiave)
  if (!p || !accese.value.has(chiave)) return
  chiudi()
  via = []; meta = null; cammina.value = false
  io.x = p.accanto.x + 0.5; io.z = p.accanto.y + 0.5
  saltaQui()
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
  // nelle terre dopo la prima il minatore non si presenta di nuovo: lo conosci già
  const prima = chi === 'minatore' && !parlato.value && terraQui() === 1
  // e la prima volta in una terra dopo racconta i volti nuovi delle discese
  const nuovaTerra = chi === 'minatore' && !parlato.value && terraQui() > 1
  if (chi === 'minatore' && !parlato.value) { parlato.value = true; salva() }
  // la porta delle terre aperta la dicono il minatore e il capitano, una volta ciascuno (in `novita`, `porta`)
  const porta = annunciaLaPorta(chi)
  if (porta) { ascoltate.value = { ...ascoltate.value, porta: { ...(ascoltate.value.porta || {}), [chi]: true } }; salva() }
  if (chi === 'capitano' && capitanoHaDaDire()) { ascoltate.value = { ...ascoltate.value, capitano: { n: 1, v: (props.tappe.find(t => t.adesso) || {}).chiave } }; salva() }
  if (chi === 'minatore' && props.annuncio && !props.annuncio.sentita) { avviso.value = ''; emit('sentito') }
  dialogo.value = { chi, nome: chiParla(chi), pagine: apertura(chi, { ...ctx(), terre: porta }, { primaVolta: prima, nuovaTerra }), giro: ++giri, chieste: new Set(chi === 'minatore' || chi === 'capitano' ? ['strada'] : []) }
}
function chiudiDialogo() { dialogo.value = null }
const annunciaLaPorta = chi => !!(props.terre && props.terre.aperta) && (chi === 'minatore' || chi === 'capitano') && !(ascoltate.value.porta || {})[chi]
// la porta delle terre: si salva qui e Gioco.vue scrive la terra dopo; il mondo rinasce là (la chiave di Campagna)
function passaLaPorta() {
  if (!props.terre || !props.terre.aperta || inScontro) return
  chiudi(); salva(); partito = true
  emit('terre', props.terre.ora + 1)
}
// la pietra del villaggio verso un'altra terra già vista: come la porta, si salva qui e Gioco.vue scrive dove si va
function allaTerra(t) {
  if (!props.terre || inScontro || !(props.terre.altre || []).some(x => x.terra === t)) return
  chiudi(); salva(); partito = true
  emit('terre', t)
}
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
let giu = null, strisciato = false, pizzico = null
const punti = new Map()   // le dita sulla vista (il mouse no: non pizzica)
// un tocco cammina; un dito che oltre i 16 px scorre sposta la vista (e l'eroe resta dov'è, come nella fattoria); due dita zoomano
// (docs/sotterraneo/mondo-3d-telecamera.md). Nella veduta il dito scorre il mondo, come prima
function premi(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  const su = e.target.closest ? e.target.closest('.sot-terra-sopra > *, .sot-terra-sotto > *, [data-fumetto], .sot-foglio, [data-torna-eroe]') : null
  if (su && e.target.closest('.sot-foglio, [data-torna-eroe]')) { giu = null; strisciato = false; return }   // un foglio aperto o il tasto: non sono della vista
  if (e.pointerType !== 'mouse') {
    if (e.isPrimary) { punti.clear(); pizzico = null }   // il primo dito di un gesto nuovo: quello che era rimasto non si è mai alzato
    punti.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }
  if (punti.size >= 2) {
    giu = null; strisciato = true   // il pizzico non è un tocco: il click che segue non cammina
    if (punti.size === 2 && scena && !props.veduta && !inScontro) {
      const [a, b] = [...punti.values()]
      pizzico = { d0: Math.hypot(a.x - b.x, a.y - b.y), z0: scena.zoom }
    }
    return
  }
  if (su) { giu = null; strisciato = false; return }   // una carta o un fumetto: il dito che parte di lì non sposta la vista
  giu = { x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' }; strisciato = false
}
function muovi(e) {
  if (punti.has(e.pointerId)) punti.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pizzico) {
    if (punti.size === 2 && scena) { const [a, b] = [...punti.values()]; scena.zoom = zoomDaPizzico(pizzico.z0, pizzico.d0, Math.hypot(a.x - b.x, a.y - b.y)) }
    return
  }
  if (!giu || (giu.mouse && !(e.buttons & 1))) return
  if (!strisciato && eTrascinare(giu.x, giu.y, e.clientX, e.clientY)) { strisciato = true; giu.ultimo = giu.x; giu.px = giu.x; giu.py = giu.y }
  if (!strisciato || !scena) return
  // nella veduta il dito che trascina fa scorrere il mondo (su un telefono in piedi non ci sta tutto: scena3d/mondo/veduta.js)
  if (props.veduta) { scena.spostaVeduta(e.clientX - (giu.ultimo ?? e.clientX)); giu.ultimo = e.clientX; return }
  if (dialogo.value || domandaPietra.value || inScontro) return
  // altrimenti sposta la vista: il punto del terreno sotto il dito resta sotto il dito
  const a = puntoDi(giu.px, giu.py), b = puntoDi(e.clientX, e.clientY)
  giu.px = e.clientX; giu.py = e.clientY
  if (a.x >= 0 && b.x >= 0) scena.cam.trascina(b.x - a.x, b.z - a.z, io)
}
// «torna all'eroe»: compare quando la vista è lontana dall'eroe (più di tre celle) e non si è in veduta
const vistaLontana = ref(false), sottoPx = ref(0)
function tornaAllEroe() { if (scena) scena.cam.segui() }
function lascia(e) {
  if (e) punti.delete(e.pointerId)
  giu = null
  if (!punti.size) pizzico = null
}
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
  scena.cam.segui()
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
  if (scena) scena.cam.segui()
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
const bersaglioDi = chiave => bersagli.value.find(x => (x.ruolo === 'minatore' && chiave === 'minatore') || (x.ruolo === 'personaggio' && x.k === chiave) || (x.ruolo === 'ingresso' && x.k === chiave) || (x.ruolo === 'bacheca' && x.k === chiave))
function vaDa(chiave) {
  const b = bersaglioDi(chiave)
  if (b) tocca(b)
}
// «vai alla pietra» dal diario: chi aspetta è lontano e una pietra accesa gli sta vicino (motore/meta-sopra.js, pietraPerAndare).
// { da, a, nome } o null; l'eroe va alla pietra `da`, e lì il fumetto offre il viaggio
function pietraPer(chiave) {
  const b = m && bersaglioDi(chiave)
  if (!b) return null
  const pietre = postiDi(m, 'pietra').filter(p => accese.value.has(p.chiave)).map(p => ({ chiave: p.chiave, x: p.accanto.x, y: p.accanto.y }))
  const v = pietraPerAndare({ x: io.x, y: io.z }, b.accanto, pietre)
  return v ? { ...v, nome: nomeDellaPietra(v.da) } : null
}
function vaAllaPietra(chiave) {
  const v = pietraPer(chiave), b = v && bersagli.value.find(x => x.ruolo === 'pietra' && x.k === v.da)
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
defineExpose({ vaDa, pietraPer, vaAllaPietra, toccoDaFuori, vaDaMercante, apriPalco, dopoLoScontro, statoSopra, salvaSopra: () => salva() })

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
    r.px = pt.x            // il piede a schermo: fra due persone vicine il confine sta a metà (spartisciPersone)
    return r
  }
  const l = b.lotto, y = scena.quota(l.x + l.w / 2, l.y + l.h / 2), punti = []
  for (const [x, z, h] of [[l.x, l.y + l.h, 0], [l.x + l.w, l.y + l.h, 0], [l.x, l.y, b.alto], [l.x + l.w, l.y, b.alto]]) { scena.aSchermo(x, y + h, z, pt); if (!pt.davanti) return null; punti.push([pt.x, pt.y]) }
  return rettangoloPosto(punti)
}
let prossimeBussole = 0
const daPosare = []
function dopo() {
  const veduta = props.veduta
  const lib = scena.cam.libera, lontana = !veduta && lib.on && Math.hypot(lib.x - io.x, lib.z - io.z) > 3
  if (lontana !== vistaLontana.value) vistaLontana.value = lontana
  daPosare.length = 0
  for (const b of bersagli.value) {
    const el = elementi.get(b.chiave)
    if (!el) continue
    const r = !inScontro && trovati.value.has(b.chiave) && (!veduta || b.ruolo === 'pietra') ? rettangoloDi(b) : null
    daPosare.push({ el, r, px: !r ? null : b.tipo === 'persona' ? r.px : b.tipo === 'cosa' ? r.x + r.w / 2 : null, cosa: b.tipo === 'cosa' })
  }
  // le persone vicine si dividono lo spazio fra i loro piedi, e con la bacheca e il cartello (scena3d/mondo/dito.js)
  spartisciPersone(daPosare.filter(q => q.px != null))
  for (const { el, r, px } of daPosare) {
    const dentro = r && r.x + r.w > 0 && r.x < vL && r.y + r.h > sopra && r.y < vA - sotto
    mostraEl(el, dentro && !veduta)
    if (dentro) {
      posa(el, r)
      if (r.testa != null) { const t = Math.round(r.testa); if (el._t !== t) { el._t = t; el.style.setProperty('--testa', t + 'px') } }
      if (px != null) { const c = Math.round(px - r.x); if (el._c !== c) { el._c = c; el.style.setProperty('--cx', c + 'px') } }
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

/* ═══════════ la meta: dove andare adesso, e la strada vera fin lì (docs/sotterraneo/mondo-3d-la-meta.md) ═══════════ */
// `metaOra`: { chiave, nome, immagine | em | consegna, cella (dove ci si ferma), b (il bersaglio che si apre arrivati), regione }
const metaOra = shallowRef(null)
// i passi si scrivono nel DOM (come i rettangoli dei bersagli): un ref rifarebbe tutta la vista a ogni cella camminata
const passiEl = ref(null)
let passiMeta = Infinity
let campo = null, luci = [], terraDelCampo = null, restoDellaStrada = 0
const VELO_META = 2.5   // le celle aperte attorno alla strada, in celle
const daQui = (a, b) => Math.hypot(a.piede.x - io.x, a.piede.y - io.z) - Math.hypot(b.piede.x - io.x, b.piede.y - io.z)
const nomeDi = b => (b.ruolo === 'bacheca' ? personaDi(`bacheca:${b.citta}`).nome : b.nome || '')
// solo quella scelta nel diario, di difetto la storia (motore/meta-sopra.js, metaScelta): niente cambia camminando
function trovaLaMeta() {
  const sc = metaScelta(props.missioni, props.segui, portaDellaStoria.value)
  const t = sc && sc.id ? missioneDi(sc.id) : null
  if (sc && sc.tipo === 'taglia') {
    const pm = metaDellaTaglia(t, props.missioni[t.id])
    if (pm) {
      const alla = sc.fatta || t.tipo === 'consegna'
      const b = alla ? bersagli.value.find(x => x.ruolo === 'bacheca' && x.citta === t.consegnaA)
        : t.tipo === 'esplora' && t.bersaglio.tipo !== 'regione' ? bersagli.value.find(x => x.ruolo === t.bersaglio.tipo && x.k === t.bersaglio.chiave) : null
      return { chiave: 'taglia:' + t.id, nome: t.titolo, em: t.em, cella: pm, b: b || null, regione: (regioneInCella(m, pm.x, pm.y) || {}).chiave }
    }
  }
  // una missione fatta si consegna a chi l'ha data: lui, col «?» d'oro
  if (sc && sc.tipo === 'missione' && sc.fatta) {
    const b = bersagli.value.filter(x => ['personaggio', 'minatore', 'mercante'].includes(x.ruolo) && x.k === t.da).sort(daQui)[0]
    if (b) return { chiave: 'chi:' + b.chiave, nome: nomeDi(b).replace(/^./, c => c.toUpperCase()), consegna: true, cella: b.accanto, b, regione: (regioneInCella(m, b.piede.x, b.piede.y) || {}).chiave }
  }
  // la discesa della missione scelta, o quella della storia (anche quando la scelta non ha un posto da indicare)
  const ingresso = k => k && bersagli.value.find(x => x.ruolo === 'ingresso' && x.k === k)
  const s = portaDellaStoria.value
  const k = (sc && sc.tipo === 'missione' && !sc.fatta && ingresso(t.discesa) ? t.discesa : null) || (sc ? s : null)
  const b = ingresso(k)
  return b ? { chiave: k, nome: dungeonDi(k).nome, immagine: iconaDi(k, true), cella: b.accanto, b, regione: (ingressoDi(m, k) || {}).regione } : null
}
// a tempo (con le bussole): la meta, i passi che mancano, da quale luce si accende la scia. Da fermi e lontani dalla scia se ne fa
// una nuova da qui; camminando no (la strada si rifà solo quando serve, non a ogni cella)
function aggiornaMeta() {
  const q = trovaLaMeta()
  if (!q) { if (metaOra.value) { metaOra.value = null; campo = null; luci = []; posaLaStrada(null) } return }
  // una meta in una zona mai caricata: il campo va fin dove la strada maestra è caricata (metaVicina), e si rifà quando la terra cambia
  // (una zona caricata): la scia va avanti a pezzi; i passi detti contano anche il resto della strada, lungo l'arco
  if (!metaOra.value || metaOra.value.chiave !== q.chiave || terraDelCampo !== terra) {
    const nuova = !metaOra.value || metaOra.value.chiave !== q.chiave
    metaOra.value = markRaw(q)
    terraDelCampo = terra
    const v = metaVicina(m, terra, q.cella)
    const fine = v && (terra.passa(v.x, v.y) ? v : terra.arrivo(m.partenza, v))
    campo = fine ? campoVersoLaMeta(terra, fine, stradaDelMondo(m)) : null
    restoDellaStrada = v && v.lontana && fine ? Math.abs(baseDi(m, q.cella.x, q.cella.y).arco - baseDi(m, fine.x, fine.y).arco) : 0
    if (nuova || !cammina.value) rifaiLaStrada()
  }
  const c = cellaDiMe(), n = campo ? campo.passi(c.x, c.y) + restoDellaStrada : Infinity
  const tondo = Number.isFinite(n) ? Math.round(n) : Infinity
  if (tondo !== passiMeta || (passiEl.value && passiEl.value.dataset.passi == null && Number.isFinite(tondo))) {
    passiMeta = tondo
    if (passiEl.value) { passiEl.value.textContent = passiDetti(tondo); if (Number.isFinite(tondo)) passiEl.value.dataset.passi = tondo; else delete passiEl.value.dataset.passi }
  }
  const v = piuVicina(luci, io.x, io.z)
  if (v.i >= 0) scena.S.sciaDa = v.i
  if (!cammina.value && Number.isFinite(n) && n >= ARRIVATO_META && (v.i < 0 || v.d > 4)) rifaiLaStrada()
}
// la strada dalla cella dell'eroe alla meta (la discesa del campo, lisciata senza uscire dalla strada dove conviene): la scia, il velo, i punti da camminare
function rifaiLaStrada() {
  const da = cellaDiMe()
  const via = campo && terra.passa(da.x, da.y) ? campo.strada(da) : null
  if (!via) { luci = []; posaLaStrada(null); return null }
  const punti = [da, ...campo.liscia(da, via)].map(p => ({ x: p.x + 0.5, z: p.y + 0.5 }))
  luci = luciDellaStrada(punti)
  posaLaStrada({ luci, meta: punti[punti.length - 1], velo: celleDelVelo([da, ...via], m.W, m.H, VELO_META) })
  return punti
}
// la bussola della meta toccata: a piedi fin lì, come un tocco sul posto (arrivati si apre quello che c'è)
function vaiAllaMeta() {
  const q = metaOra.value
  if (!q || inScontro) return
  if (q.b) return tocca(q.b)
  chiudi(); chiudiDialogo(); mostri.lascia()
  vaiA(q.cella)
}
function posaLaStrada(st) {
  if (!scena) return
  scena.S.scia = st ? { luci: st.luci, meta: st.meta } : null
  scena.S.sciaDa = 0
  scena.apriLaStrada(st ? st.velo : [])
}
// fin dove si è arrivati: l'ultima zona di cui si è vista la strada maestra (il tracciato del generatore, un punto ogni due celle)
const zoneConosciute = computed(() => {
  if (!props.veduta || !m) return 0
  trovati.value
  let z = 0
  for (const p of m.tracciato) if (visto({ x: Math.round(p.x), y: Math.round(p.y) })) { const k = zonaDi(m, Math.round(p.x), Math.round(p.y)); if (k > z) z = k }
  return z
})
// la veduta: i nomi del villaggio, delle zone, dei dungeon trovati, dei luoghi visti e le pietre accese
const nomiVeduta = computed(() => {
  if (!props.veduta || !m) return []
  const l = []
  for (const c of m.citta) if (visto({ x: c.centro.x, y: c.centro.y })) l.push({ chiave: 'citta:' + c.chiave, testo: c.nome, classe: 'citta', x: c.centro.x + 0.5, y: 3, z: c.y - 1 })
  const q = metaOra.value
  for (const b of bersagli.value) {
    if (!trovati.value.has(b.chiave)) continue
    const l0 = b.lotto
    if (b.ruolo === 'ingresso' && !(q && q.b === b)) l.push({ chiave: b.chiave, bersaglio: b.chiave, testo: dungeonDi(b.k).nome, classe: datoDelPosto(b).aperto ? 'dungeon' : 'dungeon chiuso', x: l0.x + l0.w / 2, y: 3, z: l0.y })
    if (b.ruolo === 'pietra') l.push({ chiave: b.chiave, bersaglio: b.chiave, testo: accese.value.has(b.k) ? '✦' : '·', classe: accese.value.has(b.k) ? 'pietra accesa' : 'pietra', x: l0.x + 1, y: 1.5, z: l0.y + 1 })
  }
  // le zone: il nome grande, di lato alla strada, per quelle dove si è già stati e la prima dopo (la meta del viaggio, «di là»);
  // i luoghi visti, più piccoli
  const conosciute = zoneConosciute.value
  for (const z of m.zone) if (z.i <= conosciute + 1) l.push({ chiave: 'zona:' + z.chiave, testo: z.nome, classe: z.i <= conosciute ? 'zona' : 'zona dopo',
    colore: `rgb(${z.colore.join(', ')})`, x: z.etichetta.x + 0.5, y: 2, z: z.etichetta.y + 0.5, fascia: z.fascia })
  for (const r of m.regioni) if (r.chiave !== 'villaggio' && r.cx != null && visto({ x: r.cx, y: r.cy })) l.push({ chiave: 'regione:' + r.chiave, testo: r.nome, classe: 'regione', x: r.cx + 0.5, y: 1, z: r.cy + 0.5 })
  // le tane trovate (la cella del cuore vista): un teschio, grigio se il signore è morto (la tana resta, è un luogo che si riconosce)
  for (const r of m.regioni) if (r.tana && visto(r.tana)) l.push({ chiave: 'tana:' + r.chiave, testo: '💀', classe: mostri && signoreVivo(mostri.stato, r.chiave) === false ? 'tana morta' : 'tana', x: r.tana.x + 0.5, y: 0.5, z: r.tana.y + 0.5 })
  // le bacheche già trovate (col segno: c'è un foglio da prendere, o da consegnare) e la meta della taglia che si segue: un cerchio sul posto
  for (const b of bersagli.value) if (b.ruolo === 'bacheca' && trovati.value.has(b.chiave)) {
    const sg = segniBacheca.value[b.citta]
    l.push({ chiave: b.chiave, bersaglio: b.chiave, testo: `📜${sg ? ' ' + GLIFO[sg] : ''}`, classe: 'bacheca', x: b.lotto.x + 1, y: 4, z: b.lotto.y - 1 })
  }
  // la meta di adesso, anche sotto le nuvole: un tocco ci manda a piedi, come ogni tocco della veduta
  if (q) {
    const p = q.b && q.b.lotto ? { x: q.b.lotto.x + q.b.lotto.w / 2, z: q.b.lotto.y } : { x: q.cella.x + 0.5, z: q.cella.y + 0.5 }
    l.push({ chiave: q.chiave.startsWith('taglia:') ? q.chiave : 'meta:' + q.chiave, testo: `◎ ${q.nome}`, classe: 'meta', bersaglio: q.b ? q.b.chiave : null, x: p.x, y: 3.5, z: p.z })
  }
  l.push({ chiave: 'eroe', testo: 'tu', classe: 'tu', x: io.x, y: 2.5, z: io.z })
  return l
})

// chi aspetta una consegna, o la discesa della missione: fuori dalla vista un tondo sul bordo che indica la strada
const fuori = ref([])
let fuoriChiave = ''
const portaDellaStoria = computed(() => discesaDellaStoria(props.tappe))
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
  // la meta (quella della carta in cima): un tondo azzurro con la sua faccia. Chi aspetta una consegna ha già il suo
  const q = metaOra.value
  if (q && !q.consegna) {
    // verso dove la scia esce dalla vista (la strada vera); se la scia si vede tutta, verso la meta
    const siVede = (x, z) => { scena.aSchermo(x, scena.quota(x, z) + 1, z, pt); return pt.x >= M && pt.x <= vL - M && pt.y >= sopra + M && pt.y <= vA - sotto - M }
    const fuoriVista = luci.length ? doveEsceLaStrada(luci, piuVicina(luci, io.x, io.z).i, siVede) : null
    const l = q.b && q.b.lotto
    if (fuoriVista) scena.aSchermo(fuoriVista.x, scena.quota(fuoriVista.x, fuoriVista.z) + 1, fuoriVista.z, pt)
    else if (l) scena.aSchermo(l.x + l.w / 2, scena.quota(l.x, l.y) + 1, l.y + l.h / 2, pt)
    else scena.aSchermo(q.cella.x + 0.5, scena.quota(q.cella.x + 0.5, q.cella.y + 0.5) + 1, q.cella.y + 0.5, pt)
    alBordo(pt.x, pt.y, { chiave: q.chiave, meta: true, nome: q.nome, immagine: q.immagine || null, em: q.em || null })
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
  sottoPx.value = sotto
  if (scena) { scena.copri(sopra, sotto); scena.misura() }
}
let osserva = null, attesa = 0
async function nasci() {
  prepara()
  let mod = null
  try { mod = await import('../scena3d/mondo/indice.js') } catch (e) { perso.value = true; return }
  if (!vista.value) return
  const h = new URLSearchParams(location.hash.slice(1))
  // `zone`: la scena ha caricato o scaricato una zona (una per fotogramma): la terra dove si cammina si rifà al passo dopo; i mostri
  // seguono da soli (motore/aperta.js guarda m.zonaCaricata)
  scena = mod.creaMondo3d(tela.value, { m, nebbia, passo, dopo, fontane, strato: stratoEl.value, dpr: Number(h.get('dpr')) || undefined, spegni: (h.get('spegni') || '').split(',').filter(Boolean), riaccendi: (h.get('riaccendi') || '').split(',').filter(Boolean), perso: () => { perso.value = true },
    frecce: Object.fromEntries(m.citta.map(c => [c.chiave, frecceDelCartello(m, c.chiave).map(f => versoInRadianti(f.verso))])),
    da: { x: Math.floor(io.x), y: Math.floor(io.z) }, zone: (k, caricata) => { if (caricata) terraVecchia = true } })
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
  // arrivati in una terra nuova dalla porta: il suo nome e quello del villaggio
  // o tornati in una già vista (motore/terre.js, passaTerra: `dove.arrivo`)
  else if (props.terre && props.terre.qui && ((terraQui() > 1 && !props.mondo) || (props.mondo && props.mondo.dove && props.mondo.dove.arrivo)))
    dillo(`${props.terre.qui.nome}: ${props.terre.qui.villaggio}.`)
  if (typeof window !== 'undefined') {
    window.__sotterraneo3d = scena
    window.__mondo3d = { scena, m, io, bersagli: () => bersagli.value, trovati: () => [...trovati.value], giro: () => giro.value,
      vai(chiave) { const b = bersagli.value.find(x => x.chiave === chiave || x.k === chiave); if (!b) return null; via = []; io.x = b.accanto.x + 0.5; io.z = b.accanto.y + 0.5 + 0.01; saltaQui(); return b.chiave },
      porta(x, z) { via = []; io.x = x; io.z = z; saltaQui() },
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
const firmaScena = computed(() => [props.veduta, props.roba && props.roba.mano, props.roba && props.roba.mancina, accese.value.size, divieti.value.size, trovati.value.size, JSON.stringify((props.dungeon || props.tappe).map(t => t.colore))].join('|'))
watch(firmaScena, () => aggiornaScena())
watch(() => props.veduta, v => { if (v) { chiudi(); chiudiDialogo() } })
// un ritorno in città fa un giro nuovo: chi vive sopra rinasce (motore/aperta.js, nuovoGiro)
watch(giro, g => { if (mostri && g !== mostri.stato.giro) { mostri.giro(g); fotoScontro = null } })
</script>

<template>
  <div ref="vista" class="sot-terra sot3d-mondo" data-mondo3d :data-terra-ora="terre ? terre.ora : 1" :data-pronto="pronto ? 1 : 0" :data-in-veduta="veduta ? 1 : 0"
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
    <!-- la vista spostata dal dito: un tocco per tornare all'eroe -->
    <button v-if="vistaLontana && !inScontroV" type="button" class="sot3d-torna" data-torna-eroe :style="{ bottom: sottoPx + 12 + 'px' }"
            @pointerdown.stop @click.stop="tornaAllEroe"><span aria-hidden="true">⌖</span> torna all'eroe</button>

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
              :data-portale="b.ruolo === 'portale' ? '' : null" :data-terre="b.ruolo === 'terre' ? (terre && terre.aperta ? 1 : 0) : null"
              :data-zona="b.zona || null"
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
              :style="n.colore ? { '--zona': n.colore } : null"
              @click.stop="toccaNome(n)">{{ n.testo }}<small v-if="n.fascia" class="sot3d-nome-fascia">livello {{ n.fascia[0] }}–{{ n.fascia[1] }}</small></button>
    </div>

    <!-- entrando in una zona: il suo nome grande, il luogo e i livelli, col colore della zona -->
    <div v-if="zonaAnnunciata && !veduta" :key="'zona-' + zonaAnnunciata.n" class="sot3d-zona-annuncio" data-annuncio-zona :data-zona="zonaAnnunciata.chiave"
         :style="{ '--zona': zonaAnnunciata.colore }" aria-live="polite">
      <b>{{ zonaAnnunciata.nome }}</b>
      <span v-if="zonaAnnunciata.luogo">{{ zonaAnnunciata.luogo }}</span>
      <i>{{ zonaAnnunciata.livelli }}</i>
    </div>

    <div v-if="aperto && fumettoDati" ref="fumEl" class="sot-fumetto sot3d-fumetto" data-fumetto
         :data-fumetto-di="aperto.ruolo === 'ingresso' ? aperto.k : aperto.ruolo" :class="{ 'sot-tenue': fumettoDati.tipo === 'posto' && !fumettoDati.aperto }"
         style="visibility: hidden" @click.stop>
      <FumettoMondo :f="fumettoDati" @scendi="scendi" @giu="giuDalPortale" @viaggio="viaggia" @bevi="bevi" @taglia="allaBacheca" @scava="scava" @passa="passaLaPorta" @terra="allaTerra" />
    </div>

    <button v-for="f in fuori" :key="'fuori-' + f.chiave" class="sot-bussola" :class="{ 'sot-bussola-meta': f.meta }"
            :data-consegna-fuori="f.meta ? null : f.chiave" :data-meta-fuori="f.meta ? f.chiave : null"
            :aria-label="f.meta ? 'La meta della tua missione: ' + f.nome : 'Hai una consegna per ' + f.nome"
            :style="{ left: f.x + 'px', top: f.y + 'px' }" @click.stop="f.meta ? vaiAllaMeta() : vaDa(f.chiave)">
      <i class="sot-bussola-freccia" :style="{ transform: `rotate(${f.gradi}deg) translateX(28px)` }"></i>
      <b v-if="!f.meta">?</b>
      <b v-else><img v-if="f.immagine" class="sot-ritaglio" :src="f.immagine" alt="" data-ritaglio><span v-else-if="f.em" class="em">{{ f.em }}</span></b>
    </button>

    <div ref="sopraEl" class="sot-terra-sopra">
      <slot name="sopra" />
      <!-- la meta di adesso: cosa, e quanto lontano (docs/sotterraneo/mondo-3d-la-meta.md) -->
      <div v-if="metaOra && pronto && !inScontroV" class="sot3d-meta" data-meta-carta :data-meta="metaOra.chiave" @click.stop>
        <span class="sot3d-meta-icona" :class="{ 'sot3d-meta-consegna': metaOra.consegna }" aria-hidden="true">
          <img v-if="metaOra.immagine" :src="metaOra.immagine" alt="" data-ritaglio>
          <b v-else-if="metaOra.consegna">?</b>
          <span v-else class="em">{{ metaOra.em }}</span>
        </span>
        <span class="sot3d-meta-testo">
          <b data-meta-nome>{{ metaOra.nome }}</b>
          <i ref="passiEl" data-meta-passi></i>
        </span>
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
