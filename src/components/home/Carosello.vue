<script>
// il gioco in vista sopravvive all'andata e ritorno da un gioco, non al ricaricamento
let ricordato = null
</script>

<script setup>
// Il carosello delle copertine e l'indice di tutti i giochi. Vedi docs/core/home.md.
import { ref, computed, watch } from 'vue'
import Copertina from './Copertina.vue'
import Salvadanaio from '../varieta/Salvadanaio.vue'
import { MODI, area } from '../../data/aree.js'

const props = defineProps({
  giochi: { type: Array, required: true },   // righe di data/giochi.js, con `punto` e `classe`
  ultimo: { type: String, default: null },
})
const emit = defineEmits(['apri'])

const L = 188, A = 288, ARTE = 128            // la copertina in mezzo: larga, alta, il disegno
const X = [0, 146, 252], S = [1, 0.8, 0.66]   // dove stanno e quanto sono grandi le vicine
const SOGLIA = 16                             // docs/core/il-dito.md

const limita = i => Math.max(0, Math.min(props.giochi.length - 1, i))
const pos = ref(limita(Math.max(0, props.giochi.findIndex(g => g.chiave === ricordato))))
const qui = computed(() => limita(Math.round(pos.value)))
const scatta = ref(false), tira = ref(false)

function vai (i) {
  pos.value = limita(i)
  scatta.value = true
  ricordato = props.giochi[pos.value]?.chiave || null
}

// un gioco spento o un bambino diverso: si resta sul gioco che si guardava, o sul primo dopo
watch(() => props.giochi.map(g => g.chiave), (nuove, vecchie) => {
  const era = vecchie?.[qui.value]
  let i = nuove.indexOf(era)
  if (i < 0 && vecchie) i = nuove.findIndex(k => vecchie.indexOf(k) > vecchie.indexOf(era))
  scatta.value = false
  pos.value = limita(i < 0 ? nuove.length - 1 : i)
})

const lungo = (T, d) => d >= 2 ? T[2] + (d - 2) * (T[2] - T[1])
  : T[Math.floor(d)] + (T[Math.floor(d) + 1] - T[Math.floor(d)]) * (d % 1)

function stile (i) {
  const d = i - pos.value, ad = Math.abs(d)
  return {
    transform: `translateX(${Math.sign(d) * lungo(X, ad)}px) scale(${lungo(S, Math.min(ad, 2))})`,
    zIndex: 100 - Math.round(ad * 10),
    opacity: ad > 2.4 ? 0 : 1,
    pointerEvents: ad > 2.4 ? 'none' : null,
  }
}
const pannello = i => ({ opacity: Math.max(0, 1 - Math.abs(i - pos.value) * 2) })

// il dito: fermo è un tocco, di lato si trascina, su e giù scorre la pagina (touch-action: pan-y)
let giu = null, trascinato = false
function premi (e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  if (e.target.closest('.fr')) return
  trascinato = false
  giu = { x: e.clientX, y: e.clientY, p: pos.value, id: e.pointerId, scie: [[e.clientX, e.timeStamp]] }
}
function muovi (e) {
  if (!giu || e.pointerId !== giu.id) return
  const dx = e.clientX - giu.x, dy = e.clientY - giu.y
  if (!tira.value) {
    if (Math.abs(dy) > SOGLIA && Math.abs(dy) > Math.abs(dx)) { giu = null; return }
    if (Math.abs(dx) < SOGLIA) return
    tira.value = true
    scatta.value = false
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const n = props.giochi.length
  pos.value = Math.max(-0.35, Math.min(n - 0.65, giu.p - (dx - Math.sign(dx) * SOGLIA) / X[1]))
  giu.scie.push([e.clientX, e.timeStamp])
  if (giu.scie.length > 5) giu.scie.shift()
}
function lascia (e) {
  if (!giu || e.pointerId !== giu.id) return
  const g = giu
  giu = null
  if (!tira.value) return
  tira.value = false
  trascinato = true   // il click che segue il dito non è un tocco
  const [a, b] = [g.scie[0], g.scie[g.scie.length - 1]]
  const vel = (b[0] - a[0]) / Math.max(1, b[1] - a[1])
  let dove = Math.round(pos.value - vel * 120 / X[1])   // un lancio porta un po' più in là
  if (dove === g.p && Math.abs(e.clientX - g.x) > 50) dove = g.p - Math.sign(e.clientX - g.x)
  vai(Math.max(g.p - 3, Math.min(g.p + 3, dove)))
}

function tocca (i) {
  if (trascinato) { trascinato = false; return }
  if (i === qui.value) emit('apri', props.giochi[i].chiave)
  else vai(i)
}

const modo = g => MODI[g.come] ? `${MODI[g.come].emoji} ${MODI[g.come].nome}` : ''
const tinta = g => area(g.area)?.tinta || '#eceff4'
</script>

<template>
  <div class="scaffale">
    <div class="giro" :class="{ scatta, tira }" :style="{ height: A + 16 + 'px' }"
         @pointerdown="premi" @pointermove="muovi" @pointerup="lascia" @pointercancel="lascia"
         @dragstart.prevent>
      <button v-for="(g, i) in giochi" :key="g.chiave" type="button"
              class="carta gioco" :class="[g.classe, { davanti: i === qui }]" :data-gioco="g.chiave"
              :tabindex="i === qui ? 0 : -1" :aria-hidden="Math.abs(i - qui) > 2 ? 'true' : null"
              :style="[{ width: L + 'px', height: A + 'px', marginLeft: -L / 2 + 'px', background: g.copertina?.fondo || '#fff' }, stile(i)]"
              @click="tocca(i)">
        <Copertina class="arte" :style="{ height: ARTE + 'px' }" :copertina="g.copertina" :ico="g.ico" :grande="66" />
        <span class="pan" :style="pannello(i)">
          <b>{{ g.nome }}</b>
          <i>{{ g.che }}</i>
          <small class="modo">{{ modo(g) }}<template v-if="g.punto"> · {{ g.punto }}</template></small>
          <Salvadanaio :gioco="g.chiave" />
          <span class="gioca">▶ gioca</span>
        </span>
      </button>
      <button type="button" class="fr sx" aria-label="gioco prima" :disabled="qui === 0" @click="vai(qui - 1)">‹</button>
      <button type="button" class="fr dx" aria-label="gioco dopo" :disabled="qui === giochi.length - 1" @click="vai(qui + 1)">›</button>
    </div>

    <div class="indice">
      <button v-for="(g, i) in giochi" :key="g.chiave" type="button"
              :class="{ on: i === qui, ultimo: g.chiave === ultimo }" :style="{ background: tinta(g) }"
              :data-indice="g.chiave" :aria-label="g.nome" @click="vai(i)">{{ g.ico }}</button>
    </div>
  </div>
</template>

<style scoped>
.scaffale { width:100%; max-width:400px }
.giro { position:relative; isolation:isolate; overflow:hidden; touch-action:pan-y; cursor:grab; margin:0 -16px }
.giro.tira { cursor:grabbing }
.carta { position:absolute; left:50%; top:8px; display:flex; flex-direction:column; padding:6px;
         border-radius:22px; text-align:center; background:var(--fondo-carta, #ffffff);
         box-shadow:0 5px 0 #0000001a, 0 10px 22px #8593a833; will-change:transform }
.scatta .carta { transition:transform .28s cubic-bezier(.2,.8,.3,1), opacity .28s }
.arte { flex:none }
.pan { flex:1; min-height:0; display:flex; flex-direction:column; align-items:center; gap:2px;
       margin-top:6px; padding:6px 8px 8px; border-radius:16px; background:#fff }
.pan b { font-size:17px; font-weight:900; line-height:1.15; color:var(--viola-scuro) }
.pan i { font-style:normal; font-size:12.5px; line-height:1.25; color:var(--tenue) }
.modo { font-size:11.5px; line-height:1.3; color:var(--tenue); opacity:.9;
        display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
.gioca { margin-top:auto; width:100%; padding:8px 0; border-radius:999px; font-size:15px; font-weight:900;
         background:#ffcf3f; color:#2d2a32 }
.carta:not(.davanti) .gioca { visibility:hidden }
.carta.davanti:active { transform:scale(.98) !important }
.fr { position:absolute; top:72px; z-index:200; width:34px; height:34px; border-radius:50%;
      background:#fff; color:var(--viola-scuro); font-size:20px; font-weight:900; line-height:1;
      box-shadow:0 2px 0 #d4dce6 }
.fr.sx { left:20px } .fr.dx { right:20px }
.fr:disabled { opacity:0; pointer-events:none }

.indice { display:grid; grid-template-columns:repeat(auto-fill, minmax(34px, 1fr)); gap:6px; margin-top:12px }
.indice button { position:relative; height:40px; border-radius:11px; font-size:20px; line-height:1;
                 box-shadow:inset 0 0 0 2px transparent }
.indice button.on { background:#fff !important; box-shadow:inset 0 0 0 2px var(--viola-scuro) }
.indice button.ultimo::after { content:""; position:absolute; top:-4px; right:-4px; width:11px; height:11px;
                               border-radius:50%; background:#ffcf3f; box-shadow:0 0 0 2px #2d2a32 }
</style>
