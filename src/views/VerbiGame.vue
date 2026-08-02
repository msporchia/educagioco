<script setup>
/* ═══════════════════════════════════════════════════════════════════
   VERBI — inglese → italiano, multimodale.

   Due differenze rispetto al gioco delle parole:
   1. La risposta è ITALIANO SCRITTO, non un'emoji. Così si insegnano verbi
      e concetti astratti che nessuna emoji illustrerebbe.
   2. Il turno cambia MODO: a volte la parola inglese si LEGGE, a volte si
      ASCOLTA soltanto (voce del dispositivo). Un unico 🔊 la ripete sempre.

   Riusa lo stesso motore SRS, le monete e il livello degli altri giochi:
   gli elementi hanno chiave `verbo:run`, il motore non sa che sono verbi.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { state, item, answer, level, addCoins, countMastered } from '../store/profile.js'
import { createPicker, activeSet, overdue, SRS } from '../store/srs.js'
import { VERBI } from '../data/verbi.js'
import { suono } from '../audio.js'

defineEmits(['vai'])

const OPZIONI = 5, PER_MONETA = 10
const id = en => 'verbo:' + en
const byEn = Object.fromEntries(VERBI.map(v => [v[0], v]))

/* ---------- voce inglese: c'è o no? ---------- */
const sintesi = typeof window !== 'undefined' ? window.speechSynthesis : null
const vociEn = ref([])
function aggiornaVoci() {
  if (!sintesi) return
  vociEn.value = sintesi.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang))
}
const ascoltoDisponibile = computed(() => !!sintesi && vociEn.value.length > 0)

function pronuncia(en) {
  if (!sintesi || !suono.acceso.value) return
  sintesi.cancel()
  const u = new SpeechSynthesisUtterance(en)
  u.lang = 'en-GB'
  const v = vociEn.value.find(x => /GB|UK/i.test(x.name)) || vociEn.value[0]
  if (v) u.voice = v
  u.rate = 0.85
  sintesi.speak(u)
}

/* ordine di introduzione: prima i verbi più corti (di solito più comuni) */
const ordine = k => byEn[k.slice(6)][0].length

/* ---------- stato di gioco ---------- */
const bersaglio = ref(VERBI[0])
const opzioni = ref([])
const modo = ref('leggi')        // 'leggi' | 'ascolta'
const svelato = ref(false)       // in ascolto rivela l'inglese dopo la risposta
const giuste = ref(0)
const esito = ref({})            // it -> 'bene' | 'male' | 'mostra'
const moneta = ref(0)
let occupato = false, timerId = null

const picker = createPicker({ getItem: k => item(k), useTime: false })

function pool() {
  const now = Date.now()
  const tutti = VERBI.map(v => id(v[0]))
  const { learning, due } = activeSet(tutti, k => item(k), ordine, now, SRS.setSize)
  const scaduti = due.sort((a, b) => overdue(item(b), now) - overdue(item(a), now)).slice(0, 4)
  const p = [...new Set([...learning, ...scaduti])]
  return p.length ? p : tutti.slice(0, SRS.setSize)
}

function nuovoTurno() {
  const scelto = picker.pick(pool())
  const t = byEn[scelto.slice(6)]
  bersaglio.value = t

  // distrattori: altri verbi, risposte italiane tutte diverse
  const altri = [], usate = new Set([t[1]])
  let guardia = 0
  while (altri.length < OPZIONI - 1 && guardia++ < 500) {
    const c = VERBI[Math.floor(Math.random() * VERBI.length)]
    if (usate.has(c[1])) continue
    usate.add(c[1]); altri.push(c)
  }
  opzioni.value = [t, ...altri].sort(() => Math.random() - 0.5)

  // il modo cambia da solo: se la voce non c'è, si legge sempre
  modo.value = ascoltoDisponibile.value && Math.random() < 0.45 ? 'ascolta' : 'leggi'
  svelato.value = false
  esito.value = {}
  occupato = false
  if (modo.value === 'ascolta') setTimeout(() => pronuncia(t[0]), 250)
}

function rispondi(v) {
  if (occupato || !v) return
  occupato = true
  const giusto = v[0] === bersaglio.value[0]
  answer(id(bersaglio.value[0]), { correct: giusto })
  picker.afterAnswer(id(bersaglio.value[0]), giusto)
  svelato.value = true

  if (giusto) {
    esito.value = { [v[1]]: 'bene' }
    suono.ok()
    pronuncia(bersaglio.value[0])          // sente la parola giusta pronunciata
    giuste.value++
    state.profile.totals.verbi = (state.profile.totals.verbi || 0) + 1
    if (giuste.value % PER_MONETA === 0) {
      const g = level.value
      addCoins(g); moneta.value = g
      setTimeout(() => (moneta.value = 0), 1100)
      suono.moneta()
    }
    timerId = setTimeout(nuovoTurno, 620)
  } else {
    esito.value = { [v[1]]: 'male', [bersaglio.value[1]]: 'mostra' }
    suono.no()
    pronuncia(bersaglio.value[0])
    timerId = setTimeout(nuovoTurno, 2000)
  }
}

const avanzamento = computed(() => (giuste.value % PER_MONETA) * (100 / PER_MONETA))
const imparati = computed(() => countMastered('verbo:'))

onMounted(() => {
  if (sintesi) { aggiornaVoci(); sintesi.onvoiceschanged = aggiornaVoci }
  // aggancio per i test automatici
  window.__verbi = { bersaglio, opzioni, modo, rispondi, giuste }
  nuovoTurno()
})
onUnmounted(() => {
  clearTimeout(timerId)
  if (sintesi) { sintesi.onvoiceschanged = null; sintesi.cancel() }
})
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

    <div class="palco">
      <div class="etichetta">{{ modo === 'ascolta' && !svelato ? 'Ascolta e scegli' : 'Che vuol dire?' }}</div>

      <!-- lato inglese: si legge, oppure è nascosto e si ascolta -->
      <div class="carta-en" :class="{ misteriosa: modo === 'ascolta' && !svelato }">
        <span v-if="bersaglio[2] && !(modo === 'ascolta' && !svelato)" class="ico">{{ bersaglio[2] }}</span>
        <b v-if="!(modo === 'ascolta' && !svelato)" class="parola">{{ bersaglio[0] }}</b>
        <b v-else class="parola nota">🎧</b>
      </div>

      <button v-if="ascoltoDisponibile" class="ascolta" @click="pronuncia(bersaglio[0])">🔊 Ascolta</button>
      <div v-else class="mini muto">🔇 la voce inglese non è disponibile su questo dispositivo</div>
    </div>

    <div class="scelte">
      <button v-for="o in opzioni" :key="o[1]" class="scelta" :class="esito[o[1]]"
              @click="rispondi(o)">{{ o[1] }}</button>
    </div>

    <div class="pie">
      <span>🎯 {{ imparati }} verbi sicuri</span>
    </div>

    <div v-if="moneta" class="moneta">+{{ moneta }} 🪙</div>
  </div>
</template>

<style scoped>
.avanz { height:8px; background:#ffffff99; border-radius:5px; overflow:hidden; flex:1 1 30px; min-width:24px }
.avanz i { display:block; height:100%; border-radius:5px; transition:width .35s;
           background:linear-gradient(90deg,var(--giallo),var(--rosa)) }

.palco { flex:1; min-height:0; display:flex; flex-direction:column; align-items:center;
         justify-content:center; gap:14px; padding:12px }
.etichetta { font-size:14px; font-weight:800; letter-spacing:1px; text-transform:uppercase;
             color:#ffffffcc; text-shadow:0 1px 2px #0002 }

.carta-en { background:linear-gradient(180deg,var(--viola),var(--viola-scuro)); color:#fff;
            border-radius:24px; padding:22px 34px; min-width:min(78vw,340px);
            display:flex; flex-direction:column; align-items:center; gap:6px;
            box-shadow:0 8px 0 #3f2ba8, 0 14px 30px #7c5cff55 }
.carta-en.misteriosa { background:linear-gradient(180deg,#5b46c9,#372a86) }
.carta-en .ico { font-size:clamp(34px,10vw,54px); line-height:1 }
.carta-en .parola { font-size:clamp(30px,9vw,48px); font-weight:900; letter-spacing:.5px }
.carta-en .parola.nota { font-size:clamp(40px,12vw,64px) }

.ascolta { background:#ffffffee; color:var(--viola-scuro); font-weight:800; font-size:17px;
           padding:10px 22px; border-radius:999px; box-shadow:0 4px 0 #ddd0ef }
.ascolta:active { transform:translateY(2px); box-shadow:0 2px 0 #ddd0ef }
.muto { color:#ffffffcc }

.scelte { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:8px 14px;
          width:100%; max-width:520px; margin:0 auto }
.scelta { background:var(--carta); color:var(--viola-scuro); font-size:clamp(17px,4.6vw,22px);
          font-weight:800; padding:18px 12px; border-radius:18px; border:3px solid transparent;
          box-shadow:0 5px 0 #e3d6f0, 0 10px 20px #a08fc022;
          transition:transform .14s, border-color .14s, box-shadow .14s }
.scelta:active { transform:translateY(2px); box-shadow:0 3px 0 #e3d6f0 }
.scelta.bene { animation:salta .5s; border-color:var(--verde); background:#e6f9ee }
.scelta.mostra { border-color:var(--verde); box-shadow:0 0 0 5px #38c17244 }
.scelta.male { animation:scuoti .4s; border-color:var(--rosso); background:#ffe9ee }
@keyframes salta { 0%{transform:scale(1)} 40%{transform:scale(1.1)} 100%{transform:scale(1)} }
@keyframes scuoti { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)}
                    50%{transform:translateX(8px)} 75%{transform:translateX(-5px)} }

.pie { text-align:center; font-size:13px; font-weight:800; color:#ffffffcc;
       padding:6px 0 calc(12px + env(safe-area-inset-bottom)) }
.moneta { position:fixed; left:50%; top:52%; transform:translateX(-50%); z-index:60;
          font-size:40px; font-weight:900; color:#c98a00; pointer-events:none;
          animation:vola 1.1s ease-out forwards }
@keyframes vola { 0%{transform:translateX(-50%) scale(.4);opacity:0}
                  30%{transform:translateX(-50%) scale(1.3);opacity:1}
                  100%{transform:translate(-50%,-130px) scale(.85);opacity:0} }
</style>
