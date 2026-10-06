<script>
// dove il razzo si è posato l'ultima volta, per bambino: dura la sessione, non va nel profilo
let ultimo = null      // { chi, arrivo: dov'è il razzo, angolo, gioco: la tappa da fare in quel momento }
</script>

<script setup>
/* La rotta degli asteroidi: la tela dipinge (grafica/rotta.js), qui sopra
   stanno in HTML i nomi, i tasti, il fumetto e il razzo. Riceve lo stato
   già deciso di ogni tappa e dice solo quale si vuole giocare.
   Vedi docs/asteroidi/mappa.md. */
import { ref, shallowRef, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { disponiRotta, stradaDaPunto, agganciaARotta, lunghezza, lungo, durataVolo, giro, GIRA_PRIMA,
         versoDellaRotta, LARGO_MAX } from '../motore/asteroidi/rotta.js'
import { dipingiRotta, dipingiRazzo, ingombro, LATO_RAZZO } from '../grafica/rotta.js'

const props = defineProps({
  // { pos, n, tipo, cap, nome, che, stato: fatta|ora|aperta|chiusa, serve, disegno }
  voci: { type: Array, required: true },
  capitoli: { type: Array, required: true },
  volo: { type: Object, required: true },       // { aperto, nome, che, record }
  arrivo: { type: Number, required: true },     // il nodo del razzo: voci.length è il volo
  chi: { type: String, default: '' },
})
const emit = defineEmits(['parti'])

const scorre = ref(null)
const tavola = ref(null)
const tela = ref(null)
const telaRazzo = ref(null)
const razzo = ref(null)
const fumetto = ref(null)
const W = ref(0)
const aperto = ref(null)          // il nodo col fumetto
const posato = ref(null)          // il nodo dove sta il razzo adesso
const oro = ref(null)             // fin dove la rotta è d'oro: la tappa da fare, non dove si è andati a guardare
const viaggio = shallowRef(null)
let angolo = Math.PI / 2
let occhio = null

const quadro = computed(() => (W.value ? disponiRotta(W.value, props.voci, props.capitoli, ingombro) : null))
const ultimoNodo = computed(() => props.voci.length)
const arrivoVero = computed(() => Math.max(0, Math.min(ultimoNodo.value, props.arrivo)))

// una tappa o il volo, detti allo stesso modo
const info = k => (k < props.voci.length ? props.voci[k] : {
  pos: -1, tipo: 'volo', nome: props.volo.nome, che: props.volo.che,
  stato: !props.volo.aperto ? 'chiusa' : arrivoVero.value === ultimoNodo.value ? 'ora' : 'aperta',
  serve: 'Si apre quando hai finito tutte le tappe.', disegno: { tipo: 'volo' },
})
const nodi = computed(() => (quadro.value ? quadro.value.nodi.map((n, k) => ({ ...n, ...info(k), k })) : []))
const firma = computed(() => nodi.value.map(n => n.stato).join())

function misura() {
  if (scorre.value) W.value = Math.min(LARGO_MAX, Math.floor(scorre.value.clientWidth))
}

function dipingi() {
  if (!tela.value || !quadro.value) return
  dipingiRotta(tela.value, quadro.value, {
    stati: nodi.value.map(n => n.stato), disegni: nodi.value.map(n => n.disegno),
    fino: oro.value ?? arrivoVero.value,
  })
}

/* ---------- il razzo ---------- */
let qui = { x: 0, y: 0 }          // dov'è il razzo adesso, per ripartire da lì
function sposta(x, y) {
  qui = { x, y }
  if (razzo.value) razzo.value.style.transform =
    `translate(${Math.round(x - LATO_RAZZO / 2)}px, ${Math.round(y - LATO_RAZZO / 2)}px)`
}
function posa() {
  const n = quadro.value && quadro.value.nodi[posato.value]
  if (!n || !telaRazzo.value) return
  sposta(n.razzo.x, n.razzo.y)
  dipingiRazzo(telaRazzo.value, { angolo })
  razzo.value.dataset.verso = Math.round(angolo * 180 / Math.PI)     // per i test: com'è girato
}
const ricorda = () => { ultimo = { chi: props.chi, arrivo: posato.value, angolo, gioco: arrivoVero.value } }
const dalNodo = k => { const n = quadro.value.nodi[k]; return { x: n.razzo.x, y: n.razzo.y, i: n.punto, nodo: k } }

// la tavola non comincia in cima allo scorrimento: sopra c'è la riga che spiega
const inCima = () => (tavola.value ? tavola.value.offsetTop : 0)
function scorriA(y) {
  if (scorre.value) scorre.value.scrollTop = Math.max(0, inCima() + y - scorre.value.clientHeight * 0.45)
}

// il volo: fermo per `attesa`, gira sul posto, segue la rotta, resta girato com'è arrivato (docs/asteroidi/mappa.md).
// `vittoria`: il volo dopo una tappa vinta, che porta la mappa con sé e dà l'oro alla rotta;
// altrimenti il razzo va dove si è toccato, e la mappa sta ferma sotto il dito.
function vola(inizio, a, { attesa = 0, vittoria = false } = {}) {
  const punti = stradaDaPunto(quadro.value, inizio, a)
  if (!punti) { posato.value = a; if (vittoria) oro.value = arrivoVero.value; posa(); ricorda(); return }
  const finestra = [inizio.i, quadro.value.nodi[a].punto]
  const dur = durataVolo(lunghezza(punti))
  const a0 = angolo, verso = lungo(punti, 0.03).angolo
  const svolta = giro(a0, verso)
  const primaGira = Math.abs(svolta) > GIRA_PRIMA ? 0.4 : 0
  let t = -attesa, prima = null, id = 0, finito = false
  const molle = q => (q < 0.5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2)
  const segui = y => {
    const s = scorre.value
    if (!s) return
    const su = inCima() + y - s.scrollTop, h = s.clientHeight
    if (su < h * 0.25 || su > h * 0.7) s.scrollTop += (su - h * 0.45) * 0.12
  }
  const arriva = () => {
    if (finito) return
    finito = true
    cancelAnimationFrame(id)
    const fine = punti[punti.length - 1], penultimo = punti[punti.length - 2]
    angolo = Math.atan2(fine[1] - penultimo[1], fine[0] - penultimo[0])
    posato.value = a
    viaggio.value = null
    oro.value = arrivoVero.value
    posa(); ricorda(); dipingi()
  }
  const fotogramma = ora => {
    if (finito) return
    const nascosto = typeof document !== 'undefined' && document.hidden
    if (prima !== null && !nascosto) t += Math.min(0.05, Math.max(0, (ora - prima) / 1000))
    prima = ora
    if (t >= primaGira + dur) return arriva()
    if (t < 0) { id = requestAnimationFrame(fotogramma); return }
    if (t < primaGira) {
      angolo = a0 + svolta * molle(t / primaGira)
      sposta(punti[0][0], punti[0][1])
      dipingiRazzo(telaRazzo.value, { angolo, spinta: 0.2, t })
    } else {
      const q = (t - primaGira) / dur
      const p = lungo(punti, molle(q))
      angolo += giro(angolo, p.angolo) * 0.3
      sposta(p.x, p.y)
      if (vittoria) segui(p.y)
      dipingiRazzo(telaRazzo.value, { angolo, spinta: 0.4 + Math.sin(Math.PI * q) * 0.6, t })
    }
    id = requestAnimationFrame(fotogramma)
  }
  id = requestAnimationFrame(fotogramma)
  viaggio.value = {
    chiudi: arriva, ferma() { finito = true; cancelAnimationFrame(id) }, verso: a, vittoria,
    // dov'è adesso, per ripartire da lì verso un'altra meta
    posizione: () => ({ x: qui.x, y: qui.y, i: agganciaARotta(quadro.value, qui.x, qui.y, finestra[0], finestra[1]) }),
  }
}

// toccata una tappa aperta: il razzo ci va, da dov'è (o da dove si trova a metà volo)
function vai(k) {
  const v = viaggio.value
  if (v) {
    if (v.verso === k) return
    const da = v.posizione()
    v.ferma()
    vola(da, k)
  } else if (posato.value !== k) vola(dalNodo(posato.value), k)
}

let pronto = false
function prepara() {
  if (pronto || !quadro.value) return
  pronto = true
  const a = arrivoVero.value
  const prima = ultimo && ultimo.chi === props.chi && quadro.value.nodi[ultimo.arrivo] ? ultimo : null
  const gioco = prima ? (prima.gioco ?? prima.arrivo) : null
  if (prima && gioco < a) {
    // si è aperta una tappa nuova: il razzo parte da dov'era e ci vola
    posato.value = prima.arrivo
    oro.value = gioco
    angolo = prima.angolo
    dipingi(); posa()
    const n0 = quadro.value.nodi[prima.arrivo], n1 = quadro.value.nodi[a]
    scorriA(Math.abs(n1.y - n0.y) < (scorre.value.clientHeight * 0.5) ? (n0.y + n1.y) / 2 : n0.y)
    vola(dalNodo(prima.arrivo), a, { attesa: 0.45, vittoria: true })
  } else {
    // il razzo sta dove l'ultima volta l'abbiamo lasciato, se lo sappiamo
    const dove = prima ? prima.arrivo : a
    posato.value = dove
    oro.value = a
    angolo = prima && prima.arrivo === dove ? prima.angolo : versoDellaRotta(quadro.value, dove)
    dipingi(); posa(); ricorda()
    scorriA(quadro.value.nodi[dove].y)
  }
}

watch(quadro, async () => {
  await nextTick()
  if (!pronto) return prepara()
  if (viaggio.value) viaggio.value.chiudi()
  oro.value = arrivoVero.value
  dipingi(); posa()
})
watch(firma, () => nextTick(dipingi))
watch(arrivoVero, (a, prima) => {
  if (!pronto || a === prima) return
  if (viaggio.value) viaggio.value.chiudi()
  if (a > posato.value) vola(dalNodo(posato.value), a, { vittoria: true })
  else { posato.value = a; oro.value = a; posa(); ricorda(); dipingi() }
})

onMounted(() => {
  misura()
  if (typeof ResizeObserver !== 'undefined') {
    occhio = new ResizeObserver(misura)
    occhio.observe(scorre.value)
  }
})
onUnmounted(() => {
  if (occhio) occhio.disconnect()
  // uscendo a metà volo si conta come arrivato
  if (viaggio.value) { const a = viaggio.value.verso; viaggio.value.ferma(); posato.value = a; ricorda() }
})

/* ---------- il fumetto ---------- */
const FUMETTO = 236
async function tocca(k) {
  const v = viaggio.value
  // il volo dopo una vittoria si chiude col tocco; l'altro no: si cambia meta
  if (v && v.vittoria) { v.chiudi(); return }
  if (aperto.value === k) { if (!v) aperto.value = null; return }
  aperto.value = k
  if (info(k).stato !== 'chiusa') vai(k)
  await nextTick()
  // il fumetto si vede tutto: se sborda, si scorre quanto basta
  const f = fumetto.value, s = scorre.value
  if (!f || !s) return
  const rf = f.getBoundingClientRect(), rs = s.getBoundingClientRect()
  if (rf.top < rs.top + 8) s.scrollTop -= rs.top + 8 - rf.top
  // in basso c'è «Cosa so», che resta sopra la mappa
  else if (rf.bottom > rs.bottom - 76) s.scrollTop += rf.bottom - rs.bottom + 76
}
// il fumetto non si chiude mentre il razzo vola
const chiudi = () => {
  const v = viaggio.value
  if (v) { if (v.vittoria) v.chiudi() } else aperto.value = null
}
const nodoAperto = computed(() => (aperto.value === null ? null : nodi.value[aperto.value]))
const posto = computed(() => {
  const n = nodoAperto.value
  if (!n) return null
  const largo = Math.min(FUMETTO, quadro.value.W - 16)
  const x = Math.max(largo / 2 + 8, Math.min(quadro.value.W - largo / 2 - 8, n.x))
  // sopra la tappa; in cima alla mappa non c'è posto e va sotto
  const sotto = n.y - n.r - 12 < 170
  return { x, largo, sotto, y: sotto ? n.y + n.r + 12 : n.y - n.r - 12, coda: n.x - x }
})
const intestazione = n => (n.tipo === 'volo' ? 'Oltre la rotta'
  : `${n.tipo === 'mente' ? 'Stazione' : 'Pianeta'} · tappa ${n.n} di ${props.voci.length}`)
const STATI = { fatta: '⭐ Superata: si può rifare', ora: 'Tocca a te!', aperta: 'Si può già fare' }
function parti(n) {
  aperto.value = null
  emit('parti', n.pos)
}
// la stella di «superata»: piatta, d'oro, col bordo scuro per staccarsi dal disegno (come quella dei capitoli)
const STELLA_D = Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4.05 : 9
  return `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`
}).join('') + 'Z'
const racconto = n => `${n.nome}: ${n.stato === 'chiusa' ? 'chiusa' : n.stato === 'fatta' ? 'superata' : 'aperta'}`
</script>

<template>
  <div ref="scorre" class="rotta" data-rotta @click="chiudi">
    <p class="spiega">Tocca un pianeta o una stazione. Superata, la tappa prende la sua ⭐.</p>
    <div v-if="quadro" ref="tavola" class="tavola" :style="{ width: quadro.W + 'px', height: quadro.H + 'px' }">
      <canvas ref="tela" class="tela"></canvas>

      <div v-for="t in quadro.titoli" :key="'c' + t.cap" class="capitolo" data-capitolo
           :class="t.lato > 0 ? 'a-destra' : 'a-sinistra'"
           :style="{ left: (t.lato > 0 ? t.x : t.x - t.largo) + 'px', top: t.y + 'px', width: t.largo + 'px' }">
        {{ t.titolo }}
      </div>

      <template v-for="n in nodi" :key="n.k">
        <span v-if="n.stato === 'ora'" class="anello-ora"
              :style="{ left: n.x + 'px', top: n.y + 'px', width: 2 * n.r + 16 + 'px', height: 2 * n.r + 16 + 'px' }"></span>
        <button type="button" class="nodo" :class="n.tipo === 'mente' ? 'stazione' : n.tipo"
                :style="{ left: (n.x - n.r - 6) + 'px', top: (n.y - n.r - 6) + 'px',
                          width: (2 * n.r + 12) + 'px', height: (2 * n.r + 12) + 'px' }"
                :data-tappa="n.tipo === 'volo' ? null : n.pos"
                :data-tipo="n.tipo === 'volo' ? null : n.tipo === 'mente' ? 'stazione' : 'pianeta'"
                :data-volo="n.tipo === 'volo' ? '' : null"
                :data-stato="n.stato" :aria-label="racconto(n)"
                @click.stop="tocca(n.k)"></button>
        <span class="nome" :class="[n.lato > 0 ? 'a-destra' : 'a-sinistra', 'nome-' + n.stato]"
              :style="{ left: (n.lato > 0 ? n.etichetta.x : n.etichetta.x - n.etichetta.largo) + 'px', top: n.y + 'px',
                        width: n.etichetta.largo + 'px' }">
          <b>{{ n.nome }}</b>
          <i v-if="n.tipo === 'volo' && volo.aperto && volo.record" data-record>record {{ volo.record }}</i>
        </span>
      </template>

      <!-- le stelle prese da una tappa (una sola: superata), sul suo bordo in alto a destra -->
      <svg v-for="n in nodi.filter(m => m.stato === 'fatta' && m.tipo !== 'volo')" :key="'s' + n.k" class="stelle-tappa"
           viewBox="-12 -12 24 24" aria-hidden="true" data-stelle-tappa :data-tappa-di="n.pos" data-piene="1" data-di="1"
           :style="{ left: (n.x + n.r * 0.78 - 12) + 'px', top: (n.y - n.r * 0.78 - 12) + 'px' }">
        <path :d="STELLA_D" />
      </svg>

      <!-- il razzo: la nave della partita, posata accanto alla tappa a cui si è arrivati -->
      <div ref="razzo" class="razzo" aria-hidden="true" data-razzo :data-al="posato"
           :data-in-viaggio="viaggio ? '1' : '0'">
        <canvas ref="telaRazzo"></canvas>
      </div>

      <div v-if="nodoAperto" ref="fumetto" class="fumetto" :class="{ sotto: posto.sotto }" data-fumetto
           :data-fumetto-per="nodoAperto.tipo === 'volo' ? 'volo' : nodoAperto.pos"
           :style="{ left: posto.x + 'px', top: posto.y + 'px', width: posto.largo + 'px', '--coda': posto.coda + 'px' }"
           @click.stop>
        <small>{{ intestazione(nodoAperto) }}</small>
        <b>{{ nodoAperto.nome }}</b>
        <span class="che">{{ nodoAperto.che }}</span>
        <template v-if="nodoAperto.stato === 'chiusa'">
          <span class="serve" data-serve>🔒 {{ nodoAperto.serve }}</span>
        </template>
        <template v-else>
          <span class="stato" :class="'stato-' + nodoAperto.stato">
            {{ nodoAperto.tipo === 'volo' ? (volo.record ? 'record ' + volo.record : 'Ancora nessun record')
                                          : STATI[nodoAperto.stato] }}
          </span>
          <button type="button" class="parti" data-azione="parti" @click="parti(nodoAperto)">▶ parti</button>
        </template>
      </div>

      <!-- dopo una vittoria un tocco qualunque chiude il volo: il razzo arriva subito -->
      <div v-if="viaggio && viaggio.vittoria" class="in-viaggio" data-viaggio @click.stop="viaggio.chiudi()"></div>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.rotta { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; background:#0b1029;
         padding-bottom:calc(84px + env(safe-area-inset-bottom)) }
.spiega { margin:14px auto 0; padding:0 16px; max-width:34ch; text-align:center;
          font-size:13.5px; line-height:1.4; color:#aab6dc }
.tavola { position:relative; margin:0 auto }
.tela { position:absolute; left:0; top:0; pointer-events:none }

.capitolo { position:absolute; transform:translateY(-4px); pointer-events:none;
            font-size:11.5px; font-weight:600; letter-spacing:2px; text-transform:uppercase;
            line-height:1.35; color:#8fa0d8 }
.capitolo.a-destra { text-align:left }
.capitolo.a-sinistra { text-align:right }

.nodo { position:absolute; border-radius:50%; background:transparent; border:0; padding:0;
        box-shadow:none; transition:transform .12s }
.nodo:active { transform:scale(.94) }
/* quella da fare adesso: un anello che respira, uno solo */
.anello-ora { position:absolute; transform:translate(-50%, -50%); border-radius:50%;
              border:2px solid #ffd94a; pointer-events:none; animation:respira 1.8s ease-in-out infinite }
@keyframes respira { 0%, 100% { opacity:.9; transform:translate(-50%, -50%) scale(1) }
                     50% { opacity:.35; transform:translate(-50%, -50%) scale(1.12) } }

.nome { position:absolute; transform:translateY(-50%); pointer-events:none;
        display:flex; flex-direction:column; gap:1px; line-height:1.2 }
.nome.a-destra { align-items:flex-start; text-align:left }
.nome.a-sinistra { align-items:flex-end; text-align:right }
.nome b { font-size:13.5px; font-weight:600; color:#e6ebff; max-width:150px }
.nome i { font-style:normal; font-size:12px; color:#ffd94a }
.nome-ora b { color:#ffd94a }
.nome-chiusa b { color:#6f789c }

.stelle-tappa { position:absolute; width:24px; height:24px; pointer-events:none; overflow:visible }
.stelle-tappa path { fill:#ffd94a; stroke:#0b1029; stroke-width:2.5; stroke-linejoin:round; paint-order:stroke }
.razzo { position:absolute; left:0; top:0; width:64px; height:64px; pointer-events:none;
         will-change:transform; z-index:1 }
.razzo canvas { width:64px; height:64px; display:block }

/* il fumetto: sopra la tappa, la coda punta a lei */
.fumetto { position:absolute; transform:translate(-50%, -100%); z-index:3;
           display:flex; flex-direction:column; align-items:center; gap:3px; text-align:center;
           padding:11px 14px 13px; border-radius:16px; background:#f7f8ff; color:#222a38;
           animation:compare .16s ease-out }
.fumetto.sotto { transform:translate(-50%, 0) }
.fumetto::after { content:''; position:absolute; left:calc(50% + var(--coda) - 9px); bottom:-8px;
                  border:9px solid transparent; border-bottom:0; border-top-color:#f7f8ff }
.fumetto.sotto::after { bottom:auto; top:-8px; border-top:0; border-bottom:9px solid #f7f8ff;
                        border-left-color:transparent; border-right-color:transparent }
.fumetto small { font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6e7788 }
.fumetto b { font-size:17px; font-weight:700; color:#2c3f86 }
.fumetto .che { font-size:13px; color:#4c5568 }
.fumetto .stato { margin-top:3px; font-size:13px; font-weight:600; color:#4c5568 }
.fumetto .stato-ora { color:#b7791f }
.fumetto .serve { margin-top:4px; font-size:13.5px; font-weight:600; color:#4c5568; line-height:1.35 }
.fumetto .parti { margin-top:7px; padding:9px 26px; border:0; border-radius:999px;
                  background:#ffc93c; color:#3b2a00; font-size:16px; font-weight:700;
                  box-shadow:0 3px 0 #d99a12 }
.fumetto .parti:active { transform:translateY(2px); box-shadow:0 1px 0 #d99a12 }
@keyframes compare { from { opacity:0; margin-top:6px } }

.in-viaggio { position:absolute; inset:0; z-index:4 }
</style>
