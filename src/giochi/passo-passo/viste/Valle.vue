<script setup>
/* Una valle di Passo passo, quella dei piccoli o quella dello zaino: il fondale
   dipinto, più grande dello schermo nei due versi, con sopra le caselle, i
   cartelli, i blocchi dei ponti chiusi, le tane, il segnalino e il fumetto.
   La vista non si trascina: segue il segnalino, morbida, quando arriva
   vicino al bordo (come la terra di sopra del sotterraneo); col fumetto
   aperto sta sul fumetto. Toccando una casella il fumetto si apre subito e
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
import Coniglio from './Coniglio.vue'
import Cane from './Cane.vue'

const props = defineProps({
  mondo: { type: String, default: 'valle' },          // 'valle' o 'zaino'
  voci: { type: Array, required: true },
  sentieri: { type: Object, required: true },         // { coniglio, cane }, ognuno { aperto, record, serve }
  passaggio: { type: Object, required: true },        // la tana per l'altro mondo: { aperto, serve }
  dove: { type: [Number, String], required: true },   // la tappa di adesso, o un sentiero
  partenza: { type: [Number, String], required: true },  // il nodo dove sta il segnalino
  meta: { type: [Number, String], default: null },    // dove va appena aperta la mappa (la tappa di adesso è cambiata)
  entrata: { type: Boolean, default: false },         // arriva dall'altra valle: sbuca dalla tana
  verso: { type: Number, default: 1 },
})
const emit = defineEmits(['gioca', 'senza-fine', 'passa', 'posato'])

const quadro = quadroValle(STRADE, { mondo: props.mondo })
const MAPPA = DATI[props.mondo].MAPPA
// la tana che porta all'altro mondo: dalla valle si va allo zaino, dalla riva dello zaino si torna
const TANA = props.mondo === 'valle'
  ? { id: 'tana:zaino', verso: 'zaino', nome: 'Lo zaino', icona: '🎒', dove: 'alle isole delle carte' }
  : { id: 'tana:valle', verso: 'valle', nome: 'La valle', icona: '🌱', dove: 'ai primi passi' }
const per = new Map(quadro.nodi.map(n => [n.id, n]))
const nodoDi = id => per.get(id) || null
const DISEGNO_SBARRA = rettangoli(SBARRA), DISEGNO_MASSO = rettangoli(MASSO)

/* ---------- le caselle e cosa è chiuso ---------- */
// i due sentieri: quello del coniglio in cima alle buche, quello del cane in fondo al pascolo
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
const seg = usaSegnalino({
  nodoDi,
  viaggio: (da, a) => viaggio(quadro, da, a, stato.value.bloccati),
  segui: (x, y) => { if (aperto.value === null) seguiPunto(x, y) },
  arrivato: id => {
    emit('posato', { al: id, verso: seg.verso })
    if (aperto.value !== null) mostraFumetto()
  },
})
const { el: segnalino, corpo, ombra, posato, animale, viaggiando, sbuffo } = seg

/* ---------- la vista ----------
   La vista scorre (`scrollLeft`/`scrollTop` di un riquadro che non si
   trascina): così una prova che cerca una casella la trova, e la vista la
   prende com'è. `mira` è dove la vista vuole andare, `cam` dove sta. */
const vista = ref(null), mondo = ref(null)
const largoVista = ref(390)
const BORDO = { x: 0.3, sopra: 0.36, sotto: 0.24 }, MORBIDA = 4.5
const cam = { x: 0, y: 0 }, mira = { x: 0, y: 0 }
let rafCam = 0, primaCam = null
const stringi = (v, a, b) => Math.max(a, Math.min(b, v))
const limiti = () => ({ x: Math.max(0, quadro.W - vista.value.clientWidth), y: Math.max(0, quadro.H - vista.value.clientHeight) })

// ferma, la vista è dove è: chi l'ha fatta scorrere (una prova) ha ragione
function sincronizza() {
  const v = vista.value
  if (!v || rafCam) return
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

/* ---------- il dito: un tocco apre o porta, una strisciata non fa niente ---------- */
const SCARTO_DITO = 16            // docs/core/il-dito.md
let premuto = null
function giu(e) { premuto = { x: e.clientX, y: e.clientY, via: 0 } }
function muove(e) {
  if (premuto) premuto.via = Math.max(premuto.via, Math.hypot(e.clientX - premuto.x, e.clientY - premuto.y))
}
const strisciato = () => !!premuto && premuto.via > SCARTO_DITO

/* ---------- il fumetto ---------- */
const FUMETTO = 276
const aperto = ref(null)          // l'id della cosa col fumetto: una casella, 'blocco:<ponte>', 'zaino'
const fumetto = ref(null)
const cosaAperta = computed(() => {
  const a = aperto.value
  if (a === null) return null
  if (a === 'zaino') return { id: 'zaino', tipo: 'zaino', x: tanaPassaggio.x, y: tanaPassaggio.y, alto: 40, nome: 'Lo zaino',
                              racconto: 'Le isole delle carte: ripeti, fino a, se.', stato: 'chiusa', serve: props.passaggio.serve }
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
  if (viaggiando.value || id !== posato.value) seg.vai(id)
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
  if (id !== null && (viaggiando.value || id !== posato.value)) seg.vai(id)
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
  centraSu(nodoDi(da).piede, true)
  if (props.entrata) {
    // sbuca dalla tana: prima non si vede
    seg.metti(nodoDi(da).piede, nodoDi(da).piede, { alfa: 0 })
    seg.vai(da, { passi: [esceDallaTana(nodoDi(da))] })
  } else if (props.meta !== null && nodoDi(props.meta) && props.meta !== da) {
    seg.vai(props.meta, { attesa: 0.45 })
  } else emit('posato', { al: da, verso: seg.verso })
  if (typeof ResizeObserver !== 'undefined') {
    occhio = new ResizeObserver(misura)
    occhio.observe(vista.value)
  }
  vista.value.addEventListener('scroll', sincronizza, { passive: true })
})
onBeforeUnmount(() => {
  if (occhio) occhio.disconnect()
  cancelAnimationFrame(rafCam)
  // uscendo a metà viaggio si conta come arrivato
  if (viaggiando.value) {
    const a = seg.mira.value
    viaggiando.value.ferma()
    emit('posato', { al: a, verso: seg.verso })
  }
})

const dove = (x, y) => ({ left: x + 'px', top: y + 'px' })
</script>

<template>
  <div ref="vista" class="pp-valle" data-isole :data-mondo="mondo" @pointerdown="giu" @pointermove="muove" @click="fuori">
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
              :aria-label="passaggio.aperto ? `La tana per ${TANA.nome.toLowerCase()}: porta ${TANA.dove}` : `La tana dello zaino (chiusa): ${passaggio.serve}`"
              @click.stop="toccaPassaggio">
        <svg v-if="!passaggio.aperto" class="pp-passaggio-masso" :width="DISEGNO_MASSO.w * 3" :height="DISEGNO_MASSO.h * 3"
             :viewBox="`0 0 ${DISEGNO_MASSO.w} ${DISEGNO_MASSO.h}`" shape-rendering="crispEdges" aria-hidden="true">
          <rect v-for="(r, i) in DISEGNO_MASSO.rect" :key="i" :x="r.x" :y="r.y" :width="r.w" height="1" :fill="r.c" />
        </svg>
        <span class="pp-passaggio-nome" :style="{ left: `calc(50% + ${tanaPassaggio.cartello[0] - tanaPassaggio.x}px)`,
                                                  top: `calc(50% + ${tanaPassaggio.cartello[1] - tanaPassaggio.y}px)` }">
          <span class="pp-em">{{ TANA.icona }}</span> {{ TANA.nome }}</span>
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

      <!-- il segnalino: il coniglio sulle isole del coniglio, il cane su quelle del cane -->
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
