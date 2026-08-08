<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO — tutto quello che è PIXEL, e niente altro

   Qui dentro sta il mestiere del disegno: la tela, il fondale, la
   camera, quanto è grande una cella, l'interpolazione fra un passo e
   quello dopo, il dito che trascina. Fuori di qui non se ne parla
   più — chi gioca dice COSA c'è in scena, questo file dice DOVE
   finisce sullo schermo.

   È la stessa divisione che il resto del progetto ha già fra
   `motore/` e `grafica/`, portata un gradino più in su: prima stava
   tutta dentro `GeneraleGame.vue`, e ogni tocco su un ordine
   rientrava nel giro del disegno perché erano lo stesso file.

   ── il patto con chi lo usa ─────────────────────────────────────
   ENTRA (props): il mondo com'è adesso, il livello, quanto dura un
   passo, i giri di ronda da far vedere (come liste di NOMI, non di
   pixel), i bersagli accesi, e chi sono i miei.
   ESCE: `tocca` con la casella toccata — cosa voglia dire toccarla
   lo sa il gioco, non il campo.
   SI COMANDA (defineExpose): `misura`, `disegna`, `inquadraSu`,
   `azzera`, `animaPasso`, `puntoDi`.

   `mondo` è un oggetto grosso e mutabile e non è reattivo: si guarda
   attraverso `tic`, che batte a ogni passo. È la stessa scelta del
   castello, e vale identica qui dentro.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, nextTick } from 'vue'
import { ilSegnale, laCosa } from '../../motore/generale.js'
import { cerchio } from './segni.js'
import { creaTela } from '../../grafica/tela.js'
import { PITTORI, OGGETTI } from '../../grafica/generale.js'
import { creaFondale } from '../../grafica/ambienti.js'

const props = defineProps({
  /* IL MONDO ARRIVA COME FUNZIONE, non come oggetto. Non è un vezzo: il
     gioco lo ricrea da capo a ogni scena, e una prop si aggiorna al
     prossimo disegno — cioè un attimo dopo. In quell'attimo qui si
     azzererebbe l'animazione del mondo di prima. Chiedendolo si ha
     sempre quello di adesso. */
  mondoOra: { type: Function, default: () => null },
  liv: { type: Object, required: true },
  vel: { type: Number, default: 420 },
  tic: { type: Number, default: 0 },          // batte a ogni passo: rinfresca le pastiglie
  /* i giri di ronda da mostrare, detti come li dice il piano:
     `{ punti: [nomi], ora }`. Da nome a pixel ci pensa questo file. */
  giri: { type: Array, default: () => [] },
  bersagli: { type: Array, default: () => [] },
  mirando: { type: Boolean, default: false },  // si sta scegliendo un bersaglio
  mie: { type: Array, default: () => [] },     // le unità del giocatore
})
const emit = defineEmits(['tocca'])

const telaEl = ref(null)
const altoCampo = ref('36vh')
const grande = ref(false)                      // la mappa è più larga della finestra?
const camK = ref(0)                            // batte quando la vista si sposta
const sottoIlDito = ref(null)                  // la casella accesa prima di staccare il dito

let tela = null, fondale = null, lato = 26
let prec = {}, andature = {}, animT0 = 0
const cam = { x: 0, y: 0 }
const mondo = () => props.mondoOra()

/* ═══════════ misurare ═══════════ */
async function misura () {
  if (!telaEl.value || !mondo()) return
  const largo = telaEl.value.parentElement.getBoundingClientRect().width
  if (!largo) return
  /* La cella non scende mai sotto i venti pixel: meglio una mappa da
     trascinare che dei personaggi grandi come una briciola. Deciso il
     lato, il campo si stringe sulla mappa invece di lasciare due bande
     nere — tranne quando la mappa è più alta di quanto ci sta. */
  const massimo = Math.max(150, Math.round(window.innerHeight * 0.4))
  /* LA CELLA NON SI RIMPICCIOLISCE PER FAR STARE LA MAPPA. Le mappe
     delle storie sono 30×18: farcele stare tutte in un telefono voleva
     dire celle da venti pixel, e a venti pixel un orco e una cassa sono
     la stessa macchia grigia. La grafica è tarata su 36; sotto i 32 non
     si scende mai. Se la mappa non ci sta, **si scorre** — il
     trascinamento e le frecce sul bordo esistono apposta. */
  const sta = Math.floor(Math.min(largo / mondo().w, massimo / mondo().h))
  lato = sta >= 36 ? Math.min(46, sta)   // ci sta comoda: si prende quello che c'è
       : sta >= 32 ? sta                 // ci sta di misura: meglio intera che da scorrere
       : 36                              // non ci sta: si legge e si scorre
  altoCampo.value = Math.min(massimo, mondo().h * lato) + 'px'
  await nextTick()
  if (!telaEl.value) return
  const r = telaEl.value.parentElement.getBoundingClientRect()
  grande.value = mondo().w * lato > r.width + 1 || mondo().h * lato > r.height + 1
  tela = creaTela(telaEl.value, PITTORI, { unita: 420, minimo: lato / 20, massimo: lato / 20 })
  tela.ridimensiona()
  fondale = creaFondale({ mappa: props.liv.griglia, ambiente: props.liv.ambiente, lato })
  limita(); rifaiFondale()
}
function limita () {
  if (!telaEl.value || !mondo() || !tela) return
  const { W, H } = tela.misure
  const largo = mondo().w * lato, alto = mondo().h * lato
  cam.x = largo <= W ? (largo - W) / 2 : Math.max(0, Math.min(largo - W, cam.x))
  cam.y = alto <= H ? (alto - H) / 2 : Math.max(0, Math.min(alto - H, cam.y))
  camK.value++
}
function rifaiFondale () {
  if (!tela || !fondale) return
  const { W, H } = tela.misure
  /* l'unica cosa che questo file «disegna» è ricopiare la finestra del
     fondale che ambienti.js ha già dipinto: nessun tracciato, nessun
     colore deciso qui */
  tela.dipingiFondale(p => fondale.mostra(p.ctx, cam.x, cam.y, W, H))
}
function inquadraSu (u) {
  if (!u || !tela || !mondo()) return
  const { W, H } = tela.misure
  if (mondo().w * lato <= W && mondo().h * lato <= H) return
  cam.x = (u.x + 0.5) * lato - W / 2
  cam.y = (u.y + 0.5) * lato - H / 2
  limita(); rifaiFondale()
}
/* dove sta una cella sullo schermo: serve ai test per toccare il
   bersaglio come lo tocca un dito */
function puntoDi (x, y) {
  const r = telaEl.value.getBoundingClientRect()
  return { x: r.left + (x + 0.5) * lato - cam.x, y: r.top + (y + 0.5) * lato - cam.y }
}

/* ═══════════ un passo, e l'animazione che ci sta in mezzo ═══════════
   Chi fa camminare il mondo è il gioco; qui si tiene solo la memoria
   di DOV'ERANO, che è quello che serve per farli scivolare invece di
   farli saltare. */
function azzera () {
  prec = {}; andature = {}; animT0 = 0
  if (!mondo()) return
  mondo().unita.forEach(u => { prec[u.id] = { x: u.x, y: u.y }; andature[u.id] = 0 })
}
function animaPasso (fai) {
  if (!mondo()) return
  mondo().unita.forEach(u => { prec[u.id] = { x: u.x, y: u.y } })
  fai()
  mondo().unita.forEach(u => {
    if (prec[u.id] && (prec[u.id].x !== u.x || prec[u.id].y !== u.y)) andature[u.id]++
  })
  animT0 = performance.now()
}
/* riavvolgere non è camminare: si riparte da fermi, senza scivolata */
function fermaAnimazione () {
  if (!mondo()) return
  mondo().unita.forEach(u => { prec[u.id] = { x: u.x, y: u.y } })
  animT0 = 0
}

/* ═══════════ chi è fuori campo ═══════════
   Su una mappa che non ci sta tutta, la domanda è sempre la stessa:
   «e quello dov'è finito?». La minimappa la rispondeva coprendo un
   angolo del campo — cioè nascondendo proprio le caselle che stavi
   guardando. Queste stanno sul bordo, non coprono niente, e dicono da
   che parte è ognuno: si toccano e la vista ci salta sopra. */
const FRECCE = { sx: '◀', dx: '▶', su: '▲', giu: '▼' }
const fuoriCampo = computed(() => {
  props.tic; camK.value
  if (!mondo() || !tela || !grande.value) return []
  const { W, H } = tela.misure
  const out = []
  for (const u of mondo().unita) {
    if (!u.viva) continue
    const x = (u.x + 0.5) * lato - cam.x, y = (u.y + 0.5) * lato - cam.y
    if (x >= 6 && x <= W - 6 && y >= 6 && y <= H - 6) continue
    const dir = x < 6 ? 'sx' : x > W - 6 ? 'dx' : y < 6 ? 'su' : 'giu'
    out.push({ id: u.id, em: u.emoji, mio: props.mie.includes(u.id), freccia: FRECCE[dir],
               x: Math.max(16, Math.min(W - 16, x)), y: Math.max(14, Math.min(H - 14, y)) })
  }
  return out
})
const vaiSu = id => { const u = mondo() && mondo().perId[id]; if (u) inquadraSu(u) }

/* ═══════════ la scena ═══════════ */
const CARDINE = ['su', 'dx', 'giu', 'sx']
function scena () {
  const s = []
  const m = mondo()
  if (!m) return s
  const px = c => (c + 0.5) * lato - cam.x
  const py = c => (c + 0.5) * lato - cam.y
  /* ── LA SCENOGRAFIA ──
     Casse, botti, ragnatele, carrelli: roba che il livello dichiara in
     `scenografia` e che **non è in gioco**. Non passa da `creaMondo`,
     quindi il motore non la conosce: non si prende, non si nomina in un
     ordine, non compare fra i bersagli. Serve a una cosa sola — che una
     stanza non sia un rettangolo vuoto — e si disegna per prima, sotto
     tutto il resto. */
  for (const d of (props.liv.scenografia || []))
    s.push({ ...d, x: px(d.x), y: py(d.y) })
  /* le zone di ronda e i posti che hanno un nome: macchie sul pavimento */
  for (const k in m.posti) {
    if (k === 'tesoro') continue
    s.push({ che: 'ronda', strato: -1, colore: '#f0c04a',
             celle: [{ x: px(m.posti[k].x), y: py(m.posti[k].y) }] })
  }
  /* quello che i nemici vedono: è l'informazione che serve a scrivere il
     piano, e va vista prima di premere ▶ */
  m.unita.filter(u => u.viva && u.fazione !== m.mia && u.vista)
    .forEach(u => s.push({ che: 'vista', strato: -1, x: px(u.x), y: py(u.y),
                           raggio: u.vista, giro: true, colore: '#ff7a6a' }))
  if (m.posti.tesoro)
    s.push({ che: 'forziere', x: px(m.posti.tesoro.x), y: py(m.posti.tesoro.y),
             apertura: m.vinto ? 1 : 0 })
  /* sinonimi: il nome che sta bene in una frase non è sempre quello del
     file che lo disegna — «l'osso» si dice al singolare, il pittore si
     chiama `ossa` perché disegna un mucchietto */
  const ALTRI_NOMI = { osso: 'ossa', olio: 'botte', chiavetta: 'chiave',
                       lanternina: 'lanterna', bottino: 'gemma' }
  const facciaDi = o => {
    const n = o.pittore || ALTRI_NOMI[o.nome] || o.nome
    return OGGETTI.includes(n) ? n : 'chiave'
  }
  /* OGNI COSA HA LA SUA FACCIA. Qui c'era `che: 'chiave'` cablato, e in
     tutti i livelli la lanterna, l'osso, il pane e l'olio erano un
     mazzo di chiavi: il bambino leggeva «porta l'osso a Bombo» e vedeva
     una chiave. Adesso si usa il pittore che porta il nome della cosa —
     ce n'è uno per quasi tutto in `grafica/oggetti/` — e chi non ce l'ha
     può dirlo nei dati con `pittore:`. La chiave resta il ripiego. */
  m.oggetti.filter(o => !o.preso)
    .forEach(o => s.push({ che: facciaDi(o), x: px(o.x), y: py(o.y) }))
  for (const k in m.porte) {
    const p = m.porte[k]
    s.push({ che: 'portone', x: px(p.x), y: py(p.y), aperto: p.aperta })
  }
  /* i bersagli che si possono toccare adesso */
  props.bersagli.forEach(b => s.push({ che: 'ronda', strato: 1, colore: '#ffd24a',
    celle: [{ x: px(b.x), y: py(b.y) }] }))
  if (sottoIlDito.value)
    s.push({ che: 'ronda', strato: 1, colore: '#ffffff',
             celle: [{ x: px(sottoIlDito.value.x), y: py(sottoIlDito.value.y) }] })

  const t01 = animT0 ? Math.min(1, (performance.now() - animT0) / props.vel) : 1
  for (const u of m.unita) {
    const p0 = prec[u.id] || u
    const x = px(p0.x + (u.x - p0.x) * t01), y = py(p0.y + (u.y - p0.y) * t01)
    const r = ultimaRiga(u.id)
    /* UNO SCONTRO DURA E SI DEVE VEDERE. Il motore dice chi ha menato
       e chi ha incassato in questo battito (`mondo.colpi`): chi mena
       tira, chi incassa incassa, e quei battiti sono la finestra in
       cui l'altro corre al forziere. Senza, una battaglia da otto
       colpi era otto volte la stessa figura ferma. */
    const c = (m.colpi || []).find(z => z.a === u.id)
    const mena = (m.colpi || []).some(z => z.da === u.id)
    s.push({ che: u.chi || 'orco', x, y, dir: CARDINE[u.dir] || 'giu',
             passo: andature[u.id] || 0,
             stato: !u.viva ? 'ko'
                  : c ? 'colpito'
                  : mena ? 'lancia'
                  : r && r.esito === 'no' ? 'errore'
                  : r && r.esito === 'aspetto' ? 'attesa' : 'normale' })
  }
  return s
}
const ultimaRiga = id => {
  const m = mondo()
  if (!m.traccia.length) return null
  for (let k = m.traccia.length - 1; k >= 0; k--) {
    const r = m.traccia[k]
    if (r.unita === id && r.tFine >= m.passi - 1) return r
  }
  return null
}
function disegna () {
  if (!tela || !mondo()) return
  tela.disegna(scena(), performance.now() / 1000)
}

/* ── quello che il canvas non dice ──
   La vita che cala e il grido che parte sono numeri, non figure: qui
   diventano due pastiglie sopra la tela, come le frecce di chi è
   fuori campo. La barra compare solo a chi le ha prese: una fila di
   barre piene sopra la testa di tutti sarebbe rumore. */
const soprala = computed(() => {
  props.tic; camK.value
  const m = mondo()
  if (!m || !tela) return { vite: [], gridi: [] }
  const px = c => (c + 0.5) * lato - cam.x
  const py = c => (c + 0.5) * lato - cam.y
  const feriti = new Set((m.colpi || []).map(z => z.a))
  return {
    vite: m.unita.filter(u => u.viva && u.vita < u.vitaMax)
      .map(u => ({ id: u.id, x: px(u.x), y: py(u.y) - lato * 0.52,
                   q: Math.max(0, u.vita) / u.vitaMax,
                   mio: u.fazione === m.mia, ora: feriti.has(u.id) })),
    gridi: (m.allarmi || []).map(a => ({ id: a.da, x: px(a.x), y: py(a.y) - lato * 0.8,
                                         em: ilSegnale(a.seg).em })),
  }
})

/* ── i giri di ronda, da nomi a pixel ──
   Sono chip e trattini messi SOPRA la tela, non disegni: il giro si
   legge prima di premere ▶, e correggerlo vuol dire spostare un punto. */
const giriInPixel = computed(() => {
  props.tic; camK.value
  if (!mondo() || !tela) return []
  return props.giri.map(g => ({
    ora: g.ora,
    p: g.punti.map(id => laCosa(mondo(), id)).filter(Boolean)
      .map(c => ({ x: (c.x + 0.5) * lato - cam.x, y: (c.y + 0.5) * lato - cam.y })),
  })).filter(g => g.p.length)
})
/* un trattino da un punto all'altro: lunghezza e angolo, e basta */
const tratto = (a, b) => ({
  left: a.x + 'px', top: a.y + 'px',
  width: Math.hypot(b.x - a.x, b.y - a.y) + 'px',
  transform: `rotate(${Math.atan2(b.y - a.y, b.x - a.x)}rad)`,
})

/* ── la mappa si trascina; il tocco resta il tocco (soglia 9px) ── */
let giu = null
const cellaDi = e => {
  const r = telaEl.value.getBoundingClientRect()
  return { x: Math.floor((cam.x + e.clientX - r.left) / lato),
           y: Math.floor((cam.y + e.clientY - r.top) / lato) }
}
function ditoGiu (e) {
  giu = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, mosso: 0 }
  if (props.mirando) sottoIlDito.value = cellaDi(e)
  telaEl.value.setPointerCapture(e.pointerId)
}
function ditoMuovi (e) {
  if (!giu) return
  const dx = e.clientX - giu.x, dy = e.clientY - giu.y
  giu.mosso = Math.max(giu.mosso, Math.abs(dx) + Math.abs(dy))
  if (props.mirando) { sottoIlDito.value = cellaDi(e); return }
  if (giu.mosso < 9) return
  cam.x = giu.cx - dx; cam.y = giu.cy - dy
  limita(); rifaiFondale()
}
function ditoSu (e) {
  if (!giu) return
  if (giu.mosso < 9 || props.mirando) emit('tocca', cellaDi(e))
  sottoIlDito.value = null
  giu = null
}

defineExpose({ misura, disegna, inquadraSu, azzera, animaPasso, fermaAnimazione, puntoDi })
</script>

<template>
  <section class="campo" :style="{ height: altoCampo }">
    <canvas ref="telaEl" @pointerdown="ditoGiu" @pointermove="ditoMuovi"
            @pointerup="ditoSu" @pointercancel="ditoSu"></canvas>
    <slot></slot>
    <!-- chi è fuori campo: una freccia sul bordo, che non copre
         niente. Si tocca e la vista ci salta sopra. -->
    <b v-for="f in fuoriCampo" :key="'f' + f.id" class="fuori" :class="{ mio: f.mio }"
       :style="{ left: f.x + 'px', top: f.y + 'px' }" @click="vaiSu(f.id)">
      {{ f.freccia }}{{ f.em }}</b>
    <!-- i giri di ronda: i punti numerati e il tratto che li unisce -->
    <div class="giri" aria-hidden="true">
      <template v-for="(g, k) in giriInPixel" :key="k">
        <i v-for="(q, j) in g.p.slice(0, -1)" :key="'t' + j" class="tratto"
           :class="{ ora: g.ora }" :style="tratto(q, g.p[j + 1])"></i>
        <i v-if="g.p.length > 2" class="tratto" :class="{ ora: g.ora }"
           :style="tratto(g.p[g.p.length - 1], g.p[0])"></i>
        <b v-for="(q, j) in g.p" :key="'p' + j" class="punto" :class="{ ora: g.ora }"
           :style="{ left: q.x + 'px', top: q.y + 'px' }">{{ cerchio(j) }}</b>
      </template>
    </div>
    <!-- lo scontro mentre dura: la vita che cala e il grido che
         parte. Sono i due fatti che rendono il tempo una risorsa —
         finché quei due si menano, l'altra corre al forziere. -->
    <div class="scontro" aria-hidden="true">
      <i v-for="v in soprala.vite" :key="'v' + v.id" class="vita"
         :class="{ mio: v.mio, ora: v.ora }" :style="{ left: v.x + 'px', top: v.y + 'px' }">
        <u :style="{ width: Math.round(v.q * 100) + '%' }"></u></i>
      <b v-for="(g, k) in soprala.gridi" :key="'g' + k" class="grido"
         :style="{ left: g.x + 'px', top: g.y + 'px' }">{{ g.em }}</b>
    </div>
  </section>
</template>

<style scoped>
.campo { flex:0 0 auto; height:36vh; min-height:180px; position:relative; overflow:hidden;
         background:#0d1424 }
.campo canvas { display:block; width:100%; height:100%; touch-action:none }
/* le frecce di chi è fuori campo: stanno sul bordo e non coprono la
   mappa, che è il motivo per cui hanno preso il posto della minimappa */
.fuori { position:absolute; transform:translate(-50%,-50%); display:flex; align-items:center;
         gap:1px; height:24px; padding:0 6px; border-radius:12px; font-size:12px;
         background:#0f1726d9; color:#ffd8d3; box-shadow:0 0 0 1.5px #e0554d99; cursor:pointer }
.fuori.mio { color:#dbe9ff; box-shadow:0 0 0 1.5px #6aa6ff99 }

/* ── i giri di ronda disegnati sopra la mappa ── */
.giri { position:absolute; inset:0; pointer-events:none }
.giri .tratto { position:absolute; height:3px; margin-top:-1.5px; transform-origin:0 50%;
                background:repeating-linear-gradient(90deg,#3fd0b0 0 6px,transparent 6px 11px);
                opacity:.85 }
.giri .tratto.ora { background:repeating-linear-gradient(90deg,#ffd24a 0 6px,transparent 6px 11px) }
.giri .punto { position:absolute; width:20px; height:20px; margin:-10px 0 0 -10px; border-radius:50%;
               background:#0f1726cc; color:#7ff0d0; font-size:13px; line-height:20px;
               text-align:center; font-weight:900; box-shadow:0 0 0 2px #3fd0b0 }
.giri .punto.ora { color:#2a2000; background:var(--giallo); box-shadow:0 0 0 2px #fff }

/* ── lo scontro che dura ──
   la barra della vita compare solo a chi le ha prese, e lampeggia nel
   battito in cui incassa: così otto colpi si contano guardando */
.scontro { position:absolute; inset:0; pointer-events:none }
.scontro .vita { position:absolute; width:26px; height:5px; margin:-2px 0 0 -13px;
                 border-radius:3px; background:#0b1220cc; box-shadow:0 0 0 1px #00000066;
                 overflow:hidden; display:block }
.scontro .vita u { display:block; height:100%; background:#e0554d; transition:width .18s }
.scontro .vita.mio u { background:#3fd0b0 }
.scontro .vita.ora { box-shadow:0 0 0 2px #fff8 }
.scontro .grido { position:absolute; transform:translate(-50%,-50%); font-size:15px;
                  animation:grido .5s ease-out }
@keyframes grido { from { transform:translate(-50%,-30%) scale(.4); opacity:0 }
                   40% { transform:translate(-50%,-60%) scale(1.25); opacity:1 }
                   to { transform:translate(-50%,-50%) scale(1); opacity:1 } }
</style>
