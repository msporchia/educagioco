<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { state, item, answer, level, addCoins, mastered, countMastered } from '../store/profile.js'
import { createPicker, activeSet, overdue, SRS } from '../store/srs.js'
import { WORDS } from '../data/words.js'
import { suono } from '../audio.js'

const emit = defineEmits(['vai'])

const OPZIONI = 6, PER_MONETA = 10
const id = en => 'en:' + en
const byEn = Object.fromEntries(WORDS.map(w => [w[0], w]))

/* ---------- ordine di introduzione: prima le parole vicine all'italiano ---------- */
const cache = new Map()
function difficolta(en) {
  if (cache.has(en)) return cache.get(en)
  const w = byEn[en]
  const gr = s => { const o = new Set(); s = s.toLowerCase().replace(/[^a-z]/g, '')
                    for (let i = 0; i < s.length - 1; i++) o.add(s.slice(i, i + 2)); return o }
  const A = gr(en), B = gr(w[1])
  let hit = 0; for (const g of A) if (B.has(g)) hit++
  const sim = (A.size && B.size) ? 2 * hit / (A.size + B.size) : 0
  const len = en.replace(/[^a-z]/gi, '').length
  const d = (0.55 + 0.11 * Math.max(0, len - 3)) * (1 - 0.62 * sim)
  cache.set(en, d); return d
}

/* ---------- stato di gioco ---------- */
const bersaglio = ref(WORDS[0])
const opzioni = ref([])
const giuste = ref(0)
const suggerimento = ref('')
const nascondi = ref(false)
const esito = ref({})           // en -> 'bene' | 'male' | 'mostra'
let occupato = false, timerId = null

const picker = createPicker({ getItem: k => item(k), useTime: false })

function pool() {
  const now = Date.now()
  const tutti = WORDS.map(w => id(w[0]))
  const { learning, due } = activeSet(tutti, k => item(k), k => difficolta(k.slice(3)), now, SRS.setSize)
  // i ripassi scaduti rientrano: è il decadimento che riporta indietro
  // ciò che era stato imparato e non si vede da troppo tempo
  const scaduti = due.sort((a, b) => overdue(item(b), now) - overdue(item(a), now)).slice(0, 4)
  const p = [...new Set([...learning, ...scaduti])]
  return p.length ? p : tutti.slice(0, SRS.setSize)
}

function nuovoTurno() {
  const scelto = picker.pick(pool())
  bersaglio.value = byEn[scelto.slice(3)]
  const t = bersaglio.value
  const stessa = WORDS.filter(x => x[3] === t[3] && x[0] !== t[0])
  const fonte = stessa.length >= OPZIONI - 1 ? stessa : WORDS.filter(x => x[0] !== t[0])
  const altri = [], usate = new Set([t[2]])
  let guardia = 0
  while (altri.length < OPZIONI - 1 && guardia++ < 500) {
    const c = fonte[Math.floor(Math.random() * fonte.length)]
    if (usate.has(c[2])) continue
    usate.add(c[2]); altri.push(c)
  }
  opzioni.value = [t, ...altri].sort(() => Math.random() - 0.5)
  suggerimento.value = ''
  nascondi.value = false
  esito.value = {}
  occupato = false
}

function rispondi(w) {
  if (occupato || !w) return
  occupato = true
  const giusto = w[0] === bersaglio.value[0]
  answer(id(bersaglio.value[0]), { correct: giusto })
  picker.afterAnswer(id(bersaglio.value[0]), giusto)

  if (giusto) {
    esito.value = { [w[0]]: 'bene' }
    suono.ok()
    giuste.value++
    state.profile.totals.en++
    if (giuste.value % PER_MONETA === 0) {
      const g = level.value
      addCoins(g)
      moneta.value = g
      setTimeout(() => (moneta.value = 0), 1100)
      suono.moneta()
    }
    timerId = setTimeout(nuovoTurno, 560)
  } else {
    esito.value = { [w[0]]: 'male', [bersaglio.value[0]]: 'mostra' }
    suono.no()
    suggerimento.value = `${bersaglio.value[0]} = ${bersaglio.value[1]}`
    nascondi.value = true
    timerId = setTimeout(nuovoTurno, 1900)
  }
}

const moneta = ref(0)
const avanzamento = computed(() => (giuste.value % PER_MONETA) * (100 / PER_MONETA))
const imparate = computed(() => countMastered('en:'))

/* ---------- trascinamento della parola ---------- */
const parolaEl = ref(null)
const griglia = ref(null)
const trascina = ref(null)
let dr = null

function sotto(x, y) {
  return [...griglia.value.children].find(c => {
    const r = c.getBoundingClientRect()
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  }) || null
}

function giu(e) {
  if (occupato) return
  const r = parolaEl.value.getBoundingClientRect()
  dr = { dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, mosso: false }
  parolaEl.value.setPointerCapture(e.pointerId)
}
function muovi(e) {
  if (!dr) return
  if (!dr.mosso) { dr.mosso = true; trascina.value = { x: 0, y: 0, w: dr.w } }
  trascina.value.x = e.clientX - dr.dx
  trascina.value.y = e.clientY - dr.dy
  const s = sotto(e.clientX, e.clientY)
  ;[...griglia.value.children].forEach(c => c.classList.toggle('calda', c === s))
}
function su(e) {
  if (!dr) return
  const era = dr.mosso; dr = null; trascina.value = null
  ;[...griglia.value.children].forEach(c => c.classList.remove('calda'))
  if (!era) return
  const s = sotto(e.clientX, e.clientY)
  if (s) rispondi(byEn[s.dataset.en])
}

onMounted(nuovoTurno)
onUnmounted(() => clearTimeout(timerId))
</script>

<template>
  <div class="schermo">
    <div class="barra">
      <div class="gettone">🪙 <b>{{ state.profile.coins }}</b></div>
      <div class="gettone">⭐ <b>{{ level }}</b></div>
      <div class="avanz"><i :style="{ width: avanzamento + '%' }"></i></div>
      <div class="gettone">✅ <b>{{ giuste }}</b></div>
      <button class="tondo" @click="suono.muta()">{{ suono.acceso.value ? '🔊' : '🔇' }}</button>
      <button class="tondo" @click="$emit('vai','home')">✕</button>
    </div>

    <div id="figure" ref="griglia">
      <div v-for="o in opzioni" :key="o[0]" class="figura" :data-en="o[0]"
           :class="esito[o[0]]" @click="rispondi(o)">{{ o[2] }}</div>
    </div>

    <div id="vassoio">
      <div class="aiuto"><b v-if="suggerimento">{{ suggerimento }}</b></div>
      <div id="parola" ref="parolaEl" :class="{ invisibile: nascondi }"
           @pointerdown="giu" @pointermove="muovi" @pointerup="su" @pointercancel="su">
        {{ bersaglio[0] }}
      </div>
      <div class="mini">trascinala sulla figura — oppure toccala</div>
    </div>

    <div v-if="trascina" id="parola" class="volante"
         :style="{ left: trascina.x + 'px', top: trascina.y + 'px', width: trascina.w + 'px' }">
      {{ bersaglio[0] }}
    </div>
    <div v-if="moneta" class="moneta">+{{ moneta }} 🪙</div>
  </div>
</template>

<style scoped>
.avanz { height:8px; background:#ffffff99; border-radius:5px; overflow:hidden; flex:1 1 30px; min-width:24px }
.avanz i { display:block; height:100%; border-radius:5px; transition:width .35s;
           background:linear-gradient(90deg,var(--giallo),var(--rosa)) }

/* Le figure stanno in basso, vicino alla parola: il gesto resta corto.
   Il limite in vh oltre a quello in px è indispensabile: senza, su un
   monitor largo le carte crescono e spingono la parola fuori schermo. */
#figure { flex:1; min-height:0; display:grid; gap:10px; padding:10px 12px 4px;
          align-content:end; justify-content:center; width:100%; max-width:560px; margin:0 auto;
          grid-template-columns:repeat(3,1fr) }
.figura { background:var(--carta); border-radius:20px; aspect-ratio:1; display:flex;
          align-items:center; justify-content:center; width:100%; justify-self:center;
          max-width:min(168px,24vh); font-size:clamp(30px,9.5vh,60px);
          box-shadow:0 5px 0 #e3d6f0, 0 10px 22px #a08fc033; border:3px solid transparent;
          transition:transform .14s, border-color .14s, box-shadow .14s }
.figura.calda { border-color:var(--viola); transform:scale(1.07) }
.figura.bene { animation:salta .5s; border-color:var(--verde) }
.figura.mostra { border-color:var(--verde); box-shadow:0 0 0 5px #38c17244 }
.figura.male { animation:scuoti .4s; border-color:var(--rosso) }
@keyframes salta { 0%{transform:scale(1)} 40%{transform:scale(1.22)} 100%{transform:scale(1)} }
@keyframes scuoti { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-9px)}
                    50%{transform:translateX(9px)} 75%{transform:translateX(-6px)} }

#vassoio { padding:8px 16px calc(16px + env(safe-area-inset-bottom)); display:flex;
           flex-direction:column; align-items:center; gap:7px }
.aiuto { font-size:15px; font-weight:700; color:var(--rosso); height:20px }
#parola { background:linear-gradient(180deg,var(--viola),var(--viola-scuro)); color:#fff;
          font-size:clamp(24px,7vw,36px); font-weight:900; padding:13px 28px; border-radius:18px;
          box-shadow:0 6px 0 #3f2ba8, 0 12px 26px #7c5cff55; letter-spacing:.5px; touch-action:none }
#parola.invisibile { visibility:hidden }
#parola.volante { position:fixed; z-index:50; pointer-events:none; text-align:center;
                  transform:scale(1.06) rotate(-2deg); box-shadow:0 14px 34px #3f2ba877 }
.moneta { position:fixed; left:50%; top:52%; transform:translateX(-50%); z-index:60;
          font-size:40px; font-weight:900; color:#c98a00; pointer-events:none;
          animation:vola 1.1s ease-out forwards }
@keyframes vola { 0%{transform:translateX(-50%) scale(.4);opacity:0}
                  30%{transform:translateX(-50%) scale(1.3);opacity:1}
                  100%{transform:translate(-50%,-130px) scale(.85);opacity:0} }
</style>
