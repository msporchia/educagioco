<script setup>
/* Una valle di Passo passo, quella dei piccoli o quella dello zaino: il fondale
   dipinto, più grande dello schermo nei due versi, con sopra le caselle, i
   cartelli, i blocchi dei ponti chiusi, le tane, il segnalino e il fumetto.
   La vista si trascina col dito (con lo slancio, e i bordi della mappa per
   limite) e segue il segnalino solo mentre viaggia, morbida, quando arriva
   vicino al bordo; col fumetto aperto sta sul fumetto. Toccando una casella
   il fumetto si apre subito e
   il segnalino ci va sulla strada più corta dei ponti aperti; toccando
   altrove ci va e basta. Una tana porta all'altra valle (`passa`): quella in
   cima alle buche allo zaino, quella sulla riva dello zaino alla valle.
   Riceve lo stato già deciso di ogni tappa. Vedi docs/passo-passo/mappa.md. */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { quadroValle, chiusure, viaggio, vicinoA, entraNellaTana, esceDallaTana, DATI } from '../scena/valle.js'
import { ANIMALE, SENTIERO_CANE } from '../scena/animale.js'
import { SBARRA, MASSO, rettangoli } from '../scena/pixel.js'
import { STRADE } from '../motore/strade.js'
import { usaSegnalino } from './segnalino.js'
import Casella from './Casella.vue'
import Fumetto from './Fumetto.vue'
import Stendardo from './Stendardo.vue'
import InsegnaTana from './InsegnaTana.vue'
import Coniglio from './Coniglio.vue'
import Cane from './Cane.vue'

const props = defineProps({
  mondo: { type: String, default: 'valle' },          // 'valle' o 'zaino'
  protagonista: { type: String, default: 'coniglio' }, // chi gioca: si vedono solo le sue caselle
  voci: { type: Array, required: true },
  sentieri: { type: Object, required: true },         // { coniglio, cane }, ognuno { aperto, record, serve }
  passaggio: { type: Object, required: true },        // la tana per l'altro mondo: { aperto, serve, sotto, chiama }
  dove: { type: [Number, String], required: true },   // la tappa di adesso, o un sentiero
  partenza: { type: [Number, String], required: true },  // il nodo dove sta il segnalino
  meta: { type: [Number, String], default: null },    // dove va appena aperta la mappa (la tappa di adesso è cambiata)
  entrata: { type: Boolean, default: false },         // arriva dall'altra valle: sbuca dalla tana
  verso: { type: Number, default: 1 },
})
const emit = defineEmits(['gioca', 'senza-fine', 'passa', 'posato'])

const quadro = quadroValle(STRADE, { mondo: props.mondo, protagonista: props.protagonista })
const MAPPA = DATI[props.mondo].MAPPA
// la tana che porta all'altro mondo: dalla valle si va allo zaino, dalla riva dello zaino si torna
const TANA = props.mondo === 'valle'
  ? { id: 'tana:zaino', verso: 'zaino', nome: 'I prossimi livelli', dove: 'alle isole delle carte' }
  : { id: 'tana:valle', verso: 'valle', nome: 'I primi livelli', dove: 'ai primi passi' }
const per = new Map(quadro.nodi.map(n => [n.id, n]))
const nodoDi = id => per.get(id) || null
const DISEGNO_SBARRA = rettangoli(SBARRA), DISEGNO_MASSO = rettangoli(MASSO)

/* ---------- le caselle e cosa è chiuso ---------- */
// i due sentieri: ognuno in fondo alla strada del suo animale
const RACCONTO = {
  coniglio: 'Prati, laghi, fiumi e posti con lo zaino: nuovi uno dopo l\'altro, fatti con quello che sai.',
  cane: 'Pascoli con tre, quattro, cinque pecore, e le stalle con lo zaino: nuovi uno dopo l\'altro.',
}
const sentieroDi = id => {
  const strada = id === SENTIERO_CANE ? 'cane' : 'coniglio'
  const f = props.sentieri[strada] || {}
  return {
    strada, nome: strada === 'cane' ? 'Il sentiero del cane' : 'Il sentiero del coniglio',
    stato: !f.aperto ? 'chiusa' : props.dove === id ? 'ora' : 'aperta',
    racconto: RACCONTO[strada], serve: f.serve || '', record: f.record || '',
  }
}
const caselle = computed(() => quadro.nodi.filter(n => n.tipo === 'casella' || n.tipo === 'sentiero')
  .map(n => ({ ...n, ...(n.tipo === 'sentiero' ? sentieroDi(n.id) : props.voci[n.id]) })))
const vocePer = id => caselle.value.find(c => c.id === id)
const stato = computed(() => chiusure(quadro, id => !!props.voci[id] && props.voci[id].stato !== 'chiusa'))
const velata = k => !stato.value.aperte.has(k)

// il cartello di ogni isola: lo scalino (il pascolo, il cane pastore); un'isoletta
// con `stemma` ha lo scudo solo
const insegne = computed(() => Object.entries(quadro.isole).map(([chiave, d]) => {
  const s = STRADE.isole.find(x => x.chiave === chiave)
  return { chiave, x: d.cartello[0], y: d.cartello[1], animale: s.animale, scalino: s.scalino, stemma: !!d.stemma,
           dati: props.voci[s.tappe[0]].scalino, velata: velata(chiave) }
}))
// le tane che portano a un'isola del cane (il pascolo, le isolette dello zaino): chiusa, la sua bocca
// dipinta ha il masso davanti
const tane = computed(() => quadro.nodi.filter(n => n.tipo === 'tana' && n.chiave.endsWith(':a')).map(n => {
  const nome = n.chiave.split(':')[1]
  return { ...n, nome, aperta: !velata(nodoDi(`tana:${nome}:da`).isola) && !velata(n.isola) }
}))
const tanaPassaggio = nodoDi(TANA.id)
// i ponti verso le isole chiuse, col nome dello scalino di là
const blocchi = computed(() => stato.value.blocchi.flatMap(b => {
  const s = STRADE.isole.find(x => x.chiave === b.isola)
  return s ? [{ ...b, verso: props.voci[s.tappe[0]].scalino.nome }] : []
}))

/* ---------- il segnalino ---------- */
let punto = { x: 0, y: 0 }       // dove sta (o stava, a metà viaggio): serve a sapere se la vista l'ha perso
let inseguendo = false           // il viaggio è partito con il segnalino fuori dallo schermo: la vista lo segue anche col fumetto aperto
const seg = usaSegnalino({
  nodoDi,
  viaggio: (da, a) => viaggio(quadro, da, a, stato.value.bloccati),
  segui: (x, y) => {
    punto.x = x; punto.y = y
    if (aperto.value === null || inseguendo) seguiPunto(x, y)
  },
  arrivato: id => {
    inseguendo = false
    punto = { ...nodoDi(id).piede }
    posa(id)
    if (aperto.value !== null) mostraFumetto()
  },
})
const { el: segnalino, corpo, ombra, posato, animale, viaggiando, sbuffo } = seg
// dove si è fermato, e di chi è questa valle (chi la apre può aver già cambiato protagonista)
const posa = al => emit('posato', { al, verso: seg.verso, protagonista: props.protagonista, mondo: props.mondo })

/* ---------- la vista ----------
   La vista scorre (`scrollLeft`/`scrollTop` di un riquadro che non si
   trascina): così una prova che cerca una casella la trova, e la vista la
   prende com'è. `mira` è dove la vista vuole andare, `cam` dove sta. Il dito
   la trascina (vedi «il dito»), e il segnalino che viaggia la riporta su di sé. */
const vista = ref(null), mondo = ref(null)
const largoVista = ref(390)
const BORDO = { x: 0.3, sopra: 0.36, sotto: 0.24 }, MORBIDA = 4.5
const cam = { x: 0, y: 0 }, mira = { x: 0, y: 0 }
let rafCam = 0, primaCam = null
let trascinando = false, inerzia = 0      // il dito che trascina la vista, e lo slancio dopo che l'ha lasciata
const stringi = (v, a, b) => Math.max(a, Math.min(b, v))
const limiti = () => ({ x: Math.max(0, quadro.W - vista.value.clientWidth), y: Math.max(0, quadro.H - vista.value.clientHeight) })

// ferma, la vista è dove è: chi l'ha fatta scorrere (una prova) ha ragione
function sincronizza() {
  const v = vista.value
  if (!v || rafCam || trascinando || inerzia) return
  cam.x = mira.x = v.scrollLeft
  cam.y = mira.y = v.scrollTop
}
function puntaA(x, y, subito = false) {
  const v = vista.value
  if (!v) return
  const L = limiti()
  mira.x = stringi(x, 0, L.x)
  mira.y = stringi(y, 0, L.y)
  if (subito) {
    cam.x = mira.x; cam.y = mira.y
    v.scrollLeft = Math.round(cam.x); v.scrollTop = Math.round(cam.y)
    v.dataset.camera = `${Math.round(cam.x)},${Math.round(cam.y)}`
    return
  }
  if (!rafCam) { primaCam = null; rafCam = requestAnimationFrame(passoCam) }
}
function passoCam(ora) {
  rafCam = 0
  const v = vista.value
  if (!v) return
  // qualcun altro l'ha fatta scorrere mentre andava (una prova che porta una casella sullo schermo): si ferma lì
  if (Math.abs(v.scrollLeft - Math.round(cam.x)) > 1 || Math.abs(v.scrollTop - Math.round(cam.y)) > 1) {
    cam.x = mira.x = v.scrollLeft
    cam.y = mira.y = v.scrollTop
    v.dataset.camera = `${Math.round(cam.x)},${Math.round(cam.y)}`
    return
  }
  const dt = primaCam === null ? 1 / 60 : Math.min(0.05, Math.max(0, (ora - primaCam) / 1000))
  primaCam = ora
  const k = 1 - Math.exp(-dt * MORBIDA)
  cam.x += (mira.x - cam.x) * k
  cam.y += (mira.y - cam.y) * k
  if (Math.abs(mira.x - cam.x) < 0.5) cam.x = mira.x
  if (Math.abs(mira.y - cam.y) < 0.5) cam.y = mira.y
  v.scrollLeft = Math.round(cam.x)
  v.scrollTop = Math.round(cam.y)
  v.dataset.camera = `${Math.round(cam.x)},${Math.round(cam.y)}`
  if (cam.x !== mira.x || cam.y !== mira.y) rafCam = requestAnimationFrame(passoCam)
}
// la vista sta ferma finché il segnalino non arriva a BORDO dal bordo; allora si sposta quel tanto che basta
function seguiPunto(x, y) {
  const v = vista.value
  if (!v) return
  if (trascinando) return                // il dito comanda finché non lascia
  fermaInerzia()
  sincronizza()
  const w = v.clientWidth, h = v.clientHeight
  puntaA(stringi(mira.x, x - w * (1 - BORDO.x), x - w * BORDO.x),
         stringi(mira.y, y - h * (1 - BORDO.sotto), y - h * BORDO.sopra))
}
const centraSu = (p, subito) => {
  const v = vista.value
  if (v) puntaA(p.x - v.clientWidth / 2, p.y - v.clientHeight * 0.55, subito)
}
let occhio = null
function misura() {
  if (!vista.value) return
  largoVista.value = vista.value.clientWidth
  sincronizza()
  puntaA(mira.x, mira.y, true)
}

/* ---------- il dito: un tocco apre o porta, una strisciata trascina la vista ----------
   Sotto SCARTO_DITO è un tocco (apre la casella, manda il segnalino: al `click`); sopra è un
   trascinamento, che non apre niente ([../core/il-dito.md]). Lasciato il dito la vista scivola
   (DECADE) fino a fermarsi, e i bordi della mappa fanno da limite. */
const SCARTO_DITO = 16            // docs/core/il-dito.md
const DECADE = 3.2                // 1/s: quanto in fretta lo slancio si spegne
const SLANCIO_MIN = 40            // px/s: sotto, la vista si ferma dove il dito l'ha lasciata
let premuto = null                // { id, x, y, via, fermava, giu, preso, campioni }: resta fino alla prossima pressione, serve al `click`
function giu(e) {
  if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
  // un tocco che ferma la vista che scivola serve a fermarla, non ad aprire quello che c'è sotto
  const fermava = !!inerzia
  fermaInerzia()
  premuto = { id: e.pointerId, x: e.clientX, y: e.clientY, via: 0, fermava, giu: true, preso: null, campioni: [] }
}
function muove(e) {
  const p = premuto
  if (!p || !p.giu || e.pointerId !== p.id) return
  p.via = Math.max(p.via, Math.hypot(e.clientX - p.x, e.clientY - p.y))
  if (p.via <= SCARTO_DITO) return
  const v = vista.value
  if (!v) return
  if (!trascinando) {
    // da qui in poi la vista è del dito: ferma quella che la segue e prende le misure da dov'è
    trascinando = true
    cancelAnimationFrame(rafCam); rafCam = 0; primaCam = null
    cam.x = mira.x = v.scrollLeft; cam.y = mira.y = v.scrollTop
    p.preso = { px: p.x, py: p.y, sx: cam.x, sy: cam.y }      // dal punto dove il dito si è posato: segue il dito alla lettera
    if (e.pointerType === 'mouse') { try { v.setPointerCapture(e.pointerId) } catch (_) { /* il mouse esce dal riquadro: pazienza */ } }
  }
  puntaA(p.preso.sx - (e.clientX - p.preso.px), p.preso.sy - (e.clientY - p.preso.py), true)
  p.campioni.push({ t: e.timeStamp, x: cam.x, y: cam.y })
  while (p.campioni.length > 2 && e.timeStamp - p.campioni[0].t > 120) p.campioni.shift()
}
function su(e) {
  const p = premuto
  if (!p || !p.giu || e.pointerId !== p.id) return
  p.giu = false                          // il mouse che si muove dopo non trascina; il `click` che segue sa ancora com'è andata
  if (!trascinando) return
  trascinando = false
  // la velocità degli ultimi istanti; se il dito si è fermato prima di staccarsi, niente slancio
  const c = p.campioni, ultimo = c[c.length - 1]
  if (c.length < 2 || e.timeStamp - ultimo.t > 80) return
  const dt = Math.max(0.016, (ultimo.t - c[0].t) / 1000)
  scivola((ultimo.x - c[0].x) / dt, (ultimo.y - c[0].y) / dt)
}
function fermaInerzia() { cancelAnimationFrame(inerzia); inerzia = 0 }
function scivola(vx, vy) {
  if (Math.hypot(vx, vy) < SLANCIO_MIN) return
  let prima = null
  const passo = ora => {
    const v = vista.value
    if (!v) return
    const dt = prima === null ? 1 / 60 : Math.min(0.05, Math.max(0, (ora - prima) / 1000))
    prima = ora
    const k = Math.exp(-dt * DECADE)
    vx *= k; vy *= k
    const L = limiti()
    const x = cam.x + vx * dt, y = cam.y + vy * dt
    if (x < 0 || x > L.x) vx = 0           // contro il bordo della mappa lo slancio si ferma su quell'asse
    if (y < 0 || y > L.y) vy = 0
    puntaA(x, y, true)
    inerzia = Math.hypot(vx, vy) >= SLANCIO_MIN ? requestAnimationFrame(passo) : 0
  }
  inerzia = requestAnimationFrame(passo)
}
// strisciato è vero anche per il `click` che il dito lascia dietro dopo il pointerup
const strisciato = () => !!premuto && (premuto.via > SCARTO_DITO || premuto.fermava)
// il segnalino è fuori dallo schermo (la vista l'ha lasciato per il dito)?
function fuoriVista() {
  const v = vista.value
  if (!v) return false
  sincronizza()
  const x = punto.x - mira.x, y = punto.y - mira.y
  return x < 20 || x > v.clientWidth - 20 || y - ANIMALE.alto < 8 || y > v.clientHeight - 12
}
// il segnalino parte: se la vista l'ha lasciato indietro, torna a seguirlo, morbida
function parte() {
  if (viaggiando.value) return
  inseguendo = fuoriVista()
  if (inseguendo) { fermaInerzia(); centraSu(punto) }
}

/* ---------- il fumetto ---------- */
const FUMETTO = 276
const aperto = ref(null)          // l'id della cosa col fumetto: una casella, 'blocco:<ponte>', 'zaino'
const fumetto = ref(null)
const cosaAperta = computed(() => {
  const a = aperto.value
  if (a === null) return null
  if (a === 'zaino') return { id: 'zaino', tipo: 'zaino', x: tanaPassaggio.x, y: tanaPassaggio.y, alto: 40, nome: 'I prossimi livelli',
                              racconto: 'Di là la strada va avanti, coi livelli che vengono dopo.', stato: 'chiusa', serve: props.passaggio.serve }
  if (typeof a === 'string' && a.startsWith('blocco:')) {
    const b = blocchi.value.find(x => `blocco:${x.ponte}` === a)
    if (!b) return null
    const s = STRADE.isole.find(x => x.chiave === b.isola)
    const v = props.voci[s.tappe[0]]
    return { id: a, tipo: 'blocco', x: b.x, y: b.y, alto: 40, nome: `${v.scalino.icona} ${v.scalino.nome}`,
             racconto: '', stato: 'chiusa', serve: v.serve }
  }
  return vocePer(a) || null
})
const posto = computed(() => {
  const n = cosaAperta.value
  if (!n) return null
  const largo = Math.min(FUMETTO, largoVista.value - 16)
  const x = stringi(n.x, largo / 2 + 8, quadro.W - largo / 2 - 8)
  // sopra la casella, e sopra l'animale se ci è seduto; in cima non c'è posto e va sotto
  const seduto = n.lato && aperto.value === (viaggiando.value ? seg.mira.value : posato.value)
  const mezzo = n.lato ? n.lato / 2 : n.alto / 2
  const sopra = n.y - mezzo - (seduto ? ANIMALE.alto - ANIMALE.piede + 4 : 0) - 10
  const sotto = sopra < 230
  return { x, largo, sotto, y: sotto ? n.y + mezzo + 12 : sopra, coda: n.x - x }
})
// il fumetto si vede tutto: se sborda, la vista scorre quanto basta
async function mostraFumetto() {
  await nextTick()
  if (trascinando) return                // il dito comanda
  const f = fumetto.value && fumetto.value.$el, v = vista.value
  if (!f || !v) return
  sincronizza()
  const rf = f.getBoundingClientRect(), rv = v.getBoundingClientRect()
  let dx = 0, dy = 0
  if (rf.top < rv.top + 8) dy = rf.top - rv.top - 8
  else if (rf.bottom > rv.bottom - 12) dy = rf.bottom - rv.bottom + 12
  if (rf.left < rv.left + 8) dx = rf.left - rv.left - 8
  else if (rf.right > rv.right - 8) dx = rf.right - rv.right + 8
  if (dx || dy) puntaA(v.scrollLeft + dx, v.scrollTop + dy)
}

/* Toccando una casella il fumetto compare subito, e intanto il segnalino ci
   va; su una chiusa non va e dice cosa manca. Un tocco durante il viaggio
   cambia fumetto e meta. */
function tocca(id) {
  if (strisciato()) return
  if (aperto.value === id) { aperto.value = null; return }
  aperto.value = id
  mostraFumetto()
  const c = vocePer(id)
  if (!c || c.stato === 'chiusa') return
  if (viaggiando.value || id !== posato.value) { parte(); seg.vai(id) }
}
// un ponte chiuso: il fumetto dice cosa apre l'isola di là
function toccaBlocco(b) {
  if (strisciato()) return
  const id = `blocco:${b.ponte}`
  aperto.value = aperto.value === id ? null : id
  if (aperto.value) mostraFumetto()
}
// la tana per l'altra valle: aperta ci si entra e si passa, chiusa (la tana dello zaino) dice cosa manca
function toccaPassaggio() {
  if (strisciato()) return
  if (!props.passaggio.aperto) {
    aperto.value = aperto.value === 'zaino' ? null : 'zaino'
    if (aperto.value) mostraFumetto()
    return
  }
  aperto.value = null
  parte()
  seg.vai(tanaPassaggio.id, { coda: [entraNellaTana(tanaPassaggio)], dopo: () => emit('passa') })
}
// fuori da tutto: col fumetto aperto lo chiude, se no il segnalino va al posto più vicino
function fuori(e) {
  if (strisciato()) return
  if (aperto.value !== null) { aperto.value = null; return }
  // in pixel della mappa: dal mondo, che scorre (e su uno schermo più largo della mappa sta in mezzo)
  const r = mondo.value.getBoundingClientRect()
  const id = vicinoA(quadro, e.clientX - r.left, e.clientY - r.top,
                     seg.qui ?? posato.value, stato.value.bloccati)
  if (id !== null && (viaggiando.value || id !== posato.value)) { parte(); seg.vai(id) }
}
function gioca(n) {
  aperto.value = null
  if (n.tipo === 'sentiero') emit('senza-fine', n.strada)
  else emit('gioca', n.id)
}

/* ---------- l'apertura ---------- */
onMounted(() => {
  largoVista.value = vista.value.clientWidth
  const da = nodoDi(props.partenza) ? props.partenza : quadro.nodi[0].id
  seg.verso = props.verso
  posato.value = da
  seg.posa()
  punto = { ...nodoDi(da).piede }
  centraSu(nodoDi(da).piede, true)
  if (props.entrata) {
    // sbuca dalla tana: prima non si vede
    seg.metti(nodoDi(da).piede, nodoDi(da).piede, { alfa: 0 })
    seg.vai(da, { passi: [esceDallaTana(nodoDi(da))] })
  } else if (props.meta !== null && nodoDi(props.meta) && props.meta !== da) {
    seg.vai(props.meta, { attesa: 0.45 })
  } else posa(da)
  if (typeof ResizeObserver !== 'undefined') {
    occhio = new ResizeObserver(misura)
    occhio.observe(vista.value)
  }
  vista.value.addEventListener('scroll', sincronizza, { passive: true })
})
onBeforeUnmount(() => {
  if (occhio) occhio.disconnect()
  cancelAnimationFrame(rafCam)
  fermaInerzia()
  // uscendo a metà viaggio si conta come arrivato
  if (viaggiando.value) {
    const a = seg.mira.value
    viaggiando.value.ferma()
    posa(a)
  }
})

const dove = (x, y) => ({ left: x + 'px', top: y + 'px' })
</script>

<template>
  <div ref="vista" class="pp-valle" data-isole :data-mondo="mondo" @pointerdown="giu" @pointermove="muove" @pointerup="su" @pointercancel="su" @click="fuori">
    <div ref="mondo" class="pp-valle-mondo" :style="{ width: quadro.W + 'px', height: quadro.H + 'px' }">
      <img class="pp-fondale" :src="MAPPA" alt="" draggable="false" :width="quadro.W" :height="quadro.H">

      <!-- le tane che portano a un'isola del cane (il pascolo, un'isoletta): chiusa, col masso davanti -->
      <span v-for="t in tane" :key="t.id" class="pp-tana-valle" :data-tana="t.nome" :data-aperta="t.aperta ? '1' : '0'"
            :style="dove(t.x, t.y)">
        <svg v-if="!t.aperta" :width="DISEGNO_MASSO.w * 3" :height="DISEGNO_MASSO.h * 3"
             :viewBox="`0 0 ${DISEGNO_MASSO.w} ${DISEGNO_MASSO.h}`" shape-rendering="crispEdges" aria-hidden="true">
          <rect v-for="(r, i) in DISEGNO_MASSO.rect" :key="i" :x="r.x" :y="r.y" :width="r.w" height="1" :fill="r.c" />
        </svg>
      </span>

      <!-- la tana per l'altra valle: in cima alle buche porta allo zaino, sulla riva dello zaino torna indietro -->
      <button type="button" class="pp-passaggio" :data-passaggio="TANA.verso" :data-tana="TANA.verso"
              :data-aperta="passaggio.aperto ? '1' : '0'" :style="dove(tanaPassaggio.x, tanaPassaggio.y)"
              :aria-label="passaggio.aperto ? `La tana per ${TANA.nome.toLowerCase()}: porta ${TANA.dove}` : `La tana dei prossimi livelli (chiusa): ${passaggio.serve}`"
              @click.stop="toccaPassaggio">
        <svg v-if="!passaggio.aperto" class="pp-passaggio-masso" :width="DISEGNO_MASSO.w * 3" :height="DISEGNO_MASSO.h * 3"
             :viewBox="`0 0 ${DISEGNO_MASSO.w} ${DISEGNO_MASSO.h}`" shape-rendering="crispEdges" aria-hidden="true">
          <rect v-for="(r, i) in DISEGNO_MASSO.rect" :key="i" :x="r.x" :y="r.y" :width="r.w" height="1" :fill="r.c" />
        </svg>
        <span class="pp-passaggio-insegna" :class="{ 'pp-passaggio-chiama': passaggio.chiama }" :data-chiama="passaggio.chiama ? '1' : '0'"
              :style="{ left: `calc(50% + ${tanaPassaggio.freccia[0] - tanaPassaggio.x}px)`,
                        top: `calc(50% + ${tanaPassaggio.freccia[1] - tanaPassaggio.y}px)` }">
          <InsegnaTana :nome="TANA.nome" :scosta="tanaPassaggio.scosta || 0" :sotto="passaggio.sotto" :velato="!passaggio.aperto" />
        </span>
      </button>

      <!-- i cartelli delle isole -->
      <div v-for="s in insegne" :key="s.chiave" class="pp-insegna pp-insegna-valle"
           :data-insegna="s.chiave" :data-isola="s.chiave" :data-scalino="s.scalino" :data-animale="s.animale"
           :data-velata="s.velata ? '1' : '0'" :style="dove(s.x, s.y)">
        <Stendardo :nome="s.dati.nome" :icona="s.dati.icona" :animale="s.animale" :velato="s.velata" :solo-stemma="s.stemma" />
      </div>

      <!-- i blocchi: un ponte verso un'isola chiusa non si passa -->
      <button v-for="b in blocchi" :key="b.ponte" type="button" class="pp-blocco" :data-blocco="b.ponte"
              :data-chiude="b.isola" :style="dove(b.x, b.y)" :aria-label="`Il ponte per «${b.verso}» è chiuso`"
              @click.stop="toccaBlocco(b)">
        <svg :width="DISEGNO_SBARRA.w * 3" :height="DISEGNO_SBARRA.h * 3"
             :viewBox="`0 0 ${DISEGNO_SBARRA.w} ${DISEGNO_SBARRA.h}`" shape-rendering="crispEdges" aria-hidden="true">
          <rect v-for="(r, i) in DISEGNO_SBARRA.rect" :key="i" :x="r.x" :y="r.y" :width="r.w" height="1" :fill="r.c" />
        </svg>
      </button>

      <template v-for="c in caselle" :key="c.id">
        <Casella :c="c" :velata="velata(c.isola)" @tocca="tocca" />
        <span v-if="c.tipo === 'sentiero'" class="pp-sentiero-nome pp-sentiero-nome-valle pp-a-destra"
              :class="'pp-' + c.stato" :style="dove(c.etichetta[0], c.etichetta[1])">
          <b>{{ c.nome }}</b>
          <i v-if="c.stato === 'chiusa'">{{ c.serve }}</i>
          <i v-else-if="c.record" data-record>record: {{ c.record }}</i>
          <i v-else>sentieri nuovi, uno dopo l'altro</i>
        </span>
      </template>

      <!-- il segnalino: il protagonista -->
      <div ref="ombra" class="pp-ombra" aria-hidden="true"></div>
      <div ref="segnalino" class="pp-segnalino" aria-hidden="true" data-segnalino
           :data-animale="animale" :data-al="posato" :data-in-viaggio="viaggiando ? '1' : '0'">
        <div ref="corpo" class="pp-segnalino-corpo">
          <Coniglio v-if="animale === 'coniglio'" />
          <Cane v-else />
        </div>
      </div>
      <span v-if="sbuffo" :key="'sbuffo' + sbuffo.n" class="pp-sbuffo" aria-hidden="true" :style="dove(sbuffo.x, sbuffo.y)">
        <i v-for="k in 5" :key="k" :style="{ '--k': k }"></i>
      </span>

      <Fumetto v-if="cosaAperta && posto" ref="fumetto" :n="cosaAperta" :posto="posto" @gioca="gioca" />
    </div>
  </div>
</template>
