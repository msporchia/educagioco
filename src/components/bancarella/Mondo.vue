<script>
// dove l'aereo si è posato l'ultima volta, per bambino: dura la sessione, non va nel profilo
let ultimo = null      // { chi, citta: dov'è, angolo, gioco: la città da fare in quel momento }
</script>

<script setup>
/* Il giro del mondo della bancarella: un planisfero più grande dello schermo,
   le città come tondi col numero, e l'aereo che vola dove si tocca. Riceve lo
   stato già deciso di ogni città e dice solo in quale si vuole entrare.
   Vedi docs/bancarella/mappa.md. */
import { ref, shallowRef, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Fumetto from '../Fumetto.vue'
import { MONDO, CITTA, posteggio } from '../../data/bancarella-mondo.js'
import { fondaleMondo } from '../../data/bancarella-fondali.js'
import { arco, tratto, lunghezza, lungo, giro, GIRA_PRIMA, durataVolo, versoFinale, versoIniziale,
         versoDiPartenza, quota } from '../../motore/bancarella/mondo.js'
import { disegnaMondo, nuvole, monumento, pista, AEREO, OMBRA_AEREO } from '../../grafica/bancarella-mondo.js'

const props = defineProps({
  // [{ ...città, k, stato: fatta|ora|aperta|chiusa, fatte, tot, serve }]
  voci: { type: Array, required: true },
  corrente: { type: Number, required: true },    // la città da fare adesso
  chi: { type: String, default: '' },
})
const emit = defineEmits(['entra'])

const POSTI = CITTA.map(posteggio)
const fondale = fondaleMondo()
const sotto = disegnaMondo(MONDO.W, MONDO.H) + nuvole()
const piste = CITTA.map((c, k) => pista(POSTI[k].x, POSTI[k].y)).join('')
const monumenti = CITTA.map(c => monumento(c.monumento, c.x - 94, c.y - 36, 0.9))
const rotte = CITTA.slice(0, -1).map((c, i) => ({ i, d: tratto(arco(POSTI[i], POSTI[i + 1])) }))
const AEREO_SVG = AEREO(), OMBRA_SVG = OMBRA_AEREO()

const scorre = ref(null)
const aereo = ref(null)
const ombra = ref(null)
const aperto = ref(null)             // la città col fumetto
const posato = ref(0)                // la città dove sta l'aereo
const viaggio = shallowRef(null)
let angolo = 0
let qui = { x: 0, y: 0 }

const stato = k => props.voci[k].stato
const rotaFatta = i => stato(i) === 'fatta'

/* ---------- l'aereo ---------- */
function metti(x, y, ang, q = 0) {
  qui = { x, y }
  if (!aereo.value) return
  const deg = ang * 180 / Math.PI
  aereo.value.setAttribute('transform',
    `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)}) scale(${(1 + 0.32 * q).toFixed(3)})`)
  ombra.value.setAttribute('transform',
    `translate(${(x + 3 + 22 * q).toFixed(1)} ${(y + 5 + 38 * q).toFixed(1)}) rotate(${deg.toFixed(1)}) scale(${(1 + 0.1 * q).toFixed(3)})`)
  ombra.value.setAttribute('opacity', (0.3 - 0.13 * q).toFixed(2))
  aereo.value.dataset.verso = Math.round(giro(0, ang) * 180 / Math.PI)   // per i test: com'è girato
}
const posa = () => { const p = POSTI[posato.value]; metti(p.x, p.y, angolo) }
const ricorda = () => { ultimo = { chi: props.chi, citta: posato.value, angolo, gioco: props.corrente } }

// la vista sta sull'aereo: a metà schermo, dentro il mondo
function centra(p, liscio = false) {
  const s = scorre.value
  if (!s) return
  s.scrollTo({ left: Math.max(0, p.x - s.clientWidth / 2), top: Math.max(0, p.y - s.clientHeight / 2),
               behavior: liscio ? 'smooth' : 'auto' })
}

/* Il volo: fermo per `attesa`, gira sul posto se deve cambiare verso, segue
   l'arco, e resta girato com'è arrivato (docs/bancarella/mappa.md).
   `vittoria`: il volo dopo una giornata finita, che porta la vista con sé;
   altrimenti si va dove si è toccato e la vista sta ferma sotto il dito. */
function vola(inizio, a, { attesa = 0, vittoria = false } = {}) {
  const punti = arco(inizio, POSTI[a])
  const tot = lunghezza(punti)
  if (tot < 2) { posato.value = a; posa(); ricorda(); return }
  const dur = durataVolo(tot)
  const a0 = angolo, verso = versoIniziale(punti), fin = versoFinale(punti)
  const svolta = giro(a0, verso)
  const primaGira = Math.abs(svolta) > GIRA_PRIMA ? 0.2 + Math.min(0.4, Math.abs(svolta) / 8) : 0
  let t = -attesa, prima = null, id = 0, finito = false
  const molle = q => (q < 0.5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2)
  const segui = (x, y) => {
    const s = scorre.value
    if (!s) return
    const w = s.clientWidth, h = s.clientHeight
    const sx = x - s.scrollLeft, sy = y - s.scrollTop
    if (sx < w * 0.3 || sx > w * 0.7) s.scrollLeft += (sx - w / 2) * 0.12
    if (sy < h * 0.3 || sy > h * 0.7) s.scrollTop += (sy - h / 2) * 0.12
  }
  const arriva = () => {
    if (finito) return
    finito = true
    cancelAnimationFrame(id)
    angolo = fin
    posato.value = a
    viaggio.value = null
    posa(); ricorda()
  }
  const fotogramma = ora => {
    if (finito) return
    const nascosto = typeof document !== 'undefined' && document.hidden
    if (prima !== null && !nascosto) t += Math.min(0.05, Math.max(0, (ora - prima) / 1000))
    prima = ora
    if (t >= primaGira + dur) return arriva()
    if (t < 0) { id = requestAnimationFrame(fotogramma); return }
    if (t < primaGira) {
      // gira sul posto, dalla parte più corta
      angolo = a0 + svolta * molle(t / primaGira)
      metti(punti[0][0], punti[0][1], angolo)
    } else {
      const q = (t - primaGira) / dur
      const p = lungo(punti, molle(q))
      angolo = p.angolo
      metti(p.x, p.y, angolo, quota(q))
      if (vittoria) segui(p.x, p.y)
    }
    id = requestAnimationFrame(fotogramma)
  }
  id = requestAnimationFrame(fotogramma)
  viaggio.value = {
    chiudi: arriva, ferma() { finito = true; cancelAnimationFrame(id) }, verso: a, vittoria, fin,
    posizione: () => ({ x: qui.x, y: qui.y }),    // dov'è adesso, per ripartire da lì
  }
}

// toccata una città aperta: l'aereo ci va, da dov'è (o da dove si trova a metà volo)
function vai(k) {
  const v = viaggio.value
  if (v) {
    if (v.verso === k) return
    const da = v.posizione()
    v.ferma()
    vola(da, k)
  } else if (posato.value !== k) vola(POSTI[posato.value], k)
}

onMounted(() => {
  const c = props.corrente
  const prima = ultimo && ultimo.chi === props.chi && CITTA[ultimo.citta] ? ultimo : null
  if (prima && prima.gioco < c) {
    // si è aperta una città nuova: l'aereo parte da dov'era e ci vola, la vista con lui
    posato.value = prima.citta
    angolo = prima.angolo
    posa()
    centra(POSTI[prima.citta])
    vola(POSTI[prima.citta], c, { attesa: 0.5, vittoria: true })
  } else {
    const dove = prima ? prima.citta : c
    posato.value = dove
    angolo = prima ? prima.angolo : versoDiPartenza(POSTI, dove)
    posa(); ricorda()
    centra(POSTI[dove])
  }
})
onUnmounted(() => {
  // uscendo a metà volo si conta come arrivato, girato come sarebbe arrivato
  const v = viaggio.value
  if (v) { v.ferma(); posato.value = v.verso; angolo = v.fin; viaggio.value = null; ricorda() }
})

/* ---------- il fumetto ---------- */
// il fumetto si vede tutto: se esce di lato la vista scorre quanto basta (di sopra e di sotto ci pensa il fumetto)
function mostraTutto(c) {
  const s = scorre.value
  if (!s) return
  const largo = Math.min(236, MONDO.W - 16)
  const sx = Math.max(8, Math.min(MONDO.W - largo - 8, c.x - largo / 2))
  const w = s.clientWidth
  let left = s.scrollLeft
  if (sx < left + 8) left = sx - 8
  else if (sx + largo > left + w - 8) left = sx + largo + 8 - w
  if (Math.abs(left - s.scrollLeft) > 1) s.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
}

async function tocca(k) {
  const v = viaggio.value
  // il volo dopo una giornata finita si chiude col tocco; l'altro no: si cambia meta
  if (v && v.vittoria) { v.chiudi(); return }
  if (aperto.value === k) { if (!v) aperto.value = null; return }
  aperto.value = k
  mostraTutto(CITTA[k])
  if (stato(k) !== 'chiusa') vai(k)
}
// il fumetto non si chiude mentre l'aereo vola
const chiudi = () => {
  const v = viaggio.value
  if (v) { if (v.vittoria) v.chiudi() } else aperto.value = null
}
const nodoAperto = computed(() => (aperto.value === null ? null : props.voci[aperto.value]))
const STATI = { fatta: '★ Tutte fatte: si possono rifare', ora: 'Tocca a te!', aperta: 'Si può già visitare' }
const sulle = n => (n.libera ? 'senza fine' : n.fatte + ' di ' + n.tot + ' giornate')
function entra(n) {
  aperto.value = null
  emit('entra', n.k)
}
const racconto = n => `${n.nome}: ${n.stato === 'chiusa' ? 'chiusa' : n.stato === 'fatta' ? 'finita' : 'aperta'}`
</script>

<template>
  <div ref="scorre" class="mondo" data-mondo @click="chiudi">
    <div class="tavola" :style="{ width: MONDO.W + 'px', height: MONDO.H + 'px' }">
      <img v-if="fondale" class="fondale" :src="fondale" alt="" draggable="false">
      <svg v-else class="strato" :viewBox="`0 0 ${MONDO.W} ${MONDO.H}`" aria-hidden="true" v-html="sotto"></svg>

      <svg class="strato" :viewBox="`0 0 ${MONDO.W} ${MONDO.H}`" aria-hidden="true">
        <path v-for="r in rotte" :key="r.i" :d="r.d" fill="none" stroke-linecap="round"
              :stroke="rotaFatta(r.i) ? '#2b4c8c' : '#ffffffd9'" :stroke-width="rotaFatta(r.i) ? 3.5 : 3"
              :stroke-dasharray="rotaFatta(r.i) ? '9 7' : '3 8'"/>
        <g v-html="piste"></g>
        <g v-for="(m, k) in monumenti" :key="k" :opacity="stato(k) === 'chiusa' ? 0.4 : 1" v-html="m"></g>
      </svg>

      <template v-for="n in voci" :key="n.id">
        <span v-if="n.stato === 'ora'" class="anello" :style="{ left: n.x + 'px', top: n.y + 'px' }"></span>
        <button type="button" class="nodo" :class="'s-' + n.stato"
                :style="{ left: n.x + 'px', top: n.y + 'px' }"
                :data-citta="n.id" :data-stato="n.stato" :data-fatte="n.fatte" :aria-label="racconto(n)"
                @click.stop="tocca(n.k)">
          <span class="tondo">{{ n.libera ? '∞' : n.k + 1 }}</span>
          <svg v-if="n.stato === 'chiusa'" class="lucchetto" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="9" fill="#fff" stroke="#a9b0b8" stroke-width="1.6"/>
            <path d="M6.5 9V7a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="#7b838c" stroke-width="1.6"/>
            <rect x="5.5" y="9" width="9" height="6.5" rx="1.6" fill="#7b838c"/>
          </svg>
          <span v-else-if="n.fatte" class="stelle" data-stelle-citta aria-hidden="true">★<i>{{ n.fatte }}</i></span>
        </button>
        <span class="nome" :class="'n-' + n.stato" :style="{ left: n.x + 'px', top: n.y + 'px' }">{{ n.nome }}</span>
      </template>

      <!-- l'aereo: sopra tutto, con la sua ombra che si stacca da terra quando vola -->
      <svg class="strato cielo" :viewBox="`0 0 ${MONDO.W} ${MONDO.H}`" aria-hidden="true">
        <g ref="ombra" opacity=".3"><g v-html="OMBRA_SVG"></g></g>
        <g ref="aereo" data-aereo :data-al="CITTA[posato].id" :data-in-viaggio="viaggio ? '1' : '0'"><g v-html="AEREO_SVG"></g></g>
      </svg>

      <Fumetto v-if="nodoAperto" :key="nodoAperto.id" :x="nodoAperto.x" :y="nodoAperto.y" :raggio="28"
               :limite="MONDO.W" :scorre="scorre" :tenue="nodoAperto.stato === 'chiusa'"
               :data-fumetto-per="nodoAperto.id" class="fumetto-citta">
        <small>{{ nodoAperto.continente }} · {{ sulle(nodoAperto) }}</small>
        <b>{{ nodoAperto.nome }}</b>
        <span class="che">{{ nodoAperto.racconto }}</span>
        <span v-if="nodoAperto.stato === 'chiusa'" class="serve" data-serve>🔒 {{ nodoAperto.serve }}</span>
        <template v-else>
          <span class="stato" :class="'stato-' + nodoAperto.stato">{{ STATI[nodoAperto.stato] }}</span>
          <button type="button" class="vai" data-azione="entra" @click="entra(nodoAperto)">▶ entra</button>
        </template>
      </Fumetto>
    </div>
  </div>
</template>

<style scoped>
.mondo { --fumetto-fondo:#fffaf0; --fumetto-tenue:#e9ecee; --fumetto-testo:#3a2a1a;
         flex:1; min-height:0; overflow:auto; background:#bfe3f2; overscroll-behavior:contain;
         scrollbar-width:none }
.mondo::-webkit-scrollbar { display:none }
.tavola { position:relative; margin:0 auto; flex:none }
.strato, .fondale { position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none;
                    display:block }
.fondale { image-rendering:pixelated }
/* l'aereo vola sopra tutto, anche sopra il fumetto della città a cui va: passa e non copre i tasti */
.cielo { z-index:6 }

/* una città: un tondo col numero; lo stato sta nel colore, nel lucchetto e nella stella */
.nodo { position:absolute; width:62px; height:62px; margin:-31px 0 0 -31px; padding:0; border:0;
        border-radius:50%; background:transparent; display:grid; place-items:center }
.tondo { width:44px; height:44px; border-radius:50%; display:grid; place-items:center; border:3px solid;
         font-size:20px; font-weight:900; line-height:1; box-shadow:0 3px 0 #00000030; transition:transform .12s }
.nodo:active .tondo { transform:scale(.93) }
.s-fatta .tondo { background:#6cc070; border-color:#3a9d4a; color:#fff }
.s-ora .tondo { background:#ffd34d; border-color:#ff9f1c; color:#5a3200 }
.s-aperta .tondo { background:#fffdf7; border-color:#e8553f; color:#b03a28 }
.s-chiusa .tondo { background:#d9dde2; border-color:#a9b0b8; color:#8b93a1 }
.lucchetto { position:absolute; right:0; top:0; width:20px; height:20px }
.stelle { position:absolute; right:-2px; top:-2px; display:flex; align-items:center; gap:1px;
          padding:0 5px 0 4px; border-radius:10px; background:#fff; color:#f0a800; font-size:14px; line-height:19px;
          box-shadow:0 1px 3px #0003, inset 0 0 0 1.5px #f0c040 }
.stelle i { font-style:normal; font-size:11px; font-weight:900; color:#7a5a00 }
.anello { position:absolute; width:70px; height:70px; margin:-35px 0 0 -35px; border-radius:50%;
          border:3px dashed #ff9f1c; pointer-events:none; animation:gira 14s linear infinite }
@keyframes gira { to { transform:rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .anello { animation:none } }

.nome { position:absolute; transform:translate(-50%, 36px); pointer-events:none; white-space:nowrap;
        padding:2px 10px 3px; border-radius:12px; background:#fffdf7; border:1.5px solid #c8b99a;
        font-size:12.5px; font-weight:900; color:#4a3a28; box-shadow:0 2px 0 #0000001f }
.n-ora { background:#ffe9a8; border-color:#ff9f1c }
.n-fatta { border-color:#3a9d4a }
.n-chiusa { color:#7b838c; background:#ffffffcc; border-color:#b7bec6 }

.fumetto-citta small { display:block; font-size:11px; letter-spacing:.5px; text-transform:uppercase; color:#8b7a63 }
.fumetto-citta b { display:block; font-size:18px; font-weight:900; color:#a8301f }
.fumetto-citta .che { display:block; margin-top:2px; font-size:13px; color:#5a4632 }
.fumetto-citta .stato { display:block; margin-top:5px; font-size:13px; font-weight:800; color:#5a4632 }
.fumetto-citta .stato-ora { color:#b7791f }
.fumetto-citta .stato-fatta { color:#2f8a3e }
.fumetto-citta .serve { display:block; margin-top:6px; font-size:13px; font-weight:800; color:#5a4632 }
.fumetto-citta .vai { display:block; width:100%; margin-top:8px; padding:9px 0; border-radius:999px; font-size:16px;
                      font-weight:900; color:#5a3200; background:linear-gradient(180deg,#ffd257,#ffa62b);
                      box-shadow:0 3px 0 #c97b12 }
.fumetto-citta .vai:active { transform:translateY(2px); box-shadow:0 1px 0 #c97b12 }
</style>
