<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA CAMERETTA, DISEGNATA

   Una stanza sola al posto di tre elenchi: la parete con la finestra, la
   porta del negozio e gli scaffali dove finiscono gli oggetti comprati;
   il pavimento con il tappeto, gli animali e la macchina delle sorprese.

   Tutto quello che si tocca è una cosa che si vede: si esce dalla porta
   per comprare, si tocca l'animale per occuparsene, si tocca la macchina
   per una sorpresa. Niente banchi in cima, niente liste: la navigazione
   è il disegno.

   Sopra un animale compare **una sola icona** quando gli manca qualcosa
   — l'osso, la palla, la spazzola — e nient'altro. Le quattro barre e le
   parole stanno nella sua scheda: qui basta sapere chi ha bisogno di te.

   La stanza non scorre mai: si adatta allo schermo che trova. Per questo
   le misure sono in `cqw` (centesimi della larghezza della stanza) e la
   grandezza degli oggetti sugli scaffali la decide lo scaffale più pieno
   — trenta oggetti stanno sulle mensole come tre, solo più piccoli.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { state, moveItem, haAnimale, chiede, miei, alRifugio } from '../store/profile.js'
import { PETS, POSTI_CASA, quotaRientro } from '../data/pets.js'
import PetSprite from './PetSprite.vue'

const props = defineProps({
  adesso: { type: Number, default: () => Date.now() },
})
const emit = defineEmits(['animale', 'negozio', 'sorprese'])

/* ---------- gli animali sul tappeto ----------
   Quattro posti, e in ognuno o c'è un amico o c'è la sagoma di uno che
   potrebbe starci. I posti liberi non sono un `+` grigio: mostrano chi
   si potrebbe adottare, dal più economico in su, perché la cosa che fa
   venir voglia di adottare Watson è vedere Watson. Finiti quelli nuovi,
   nei posti liberi si affacciano gli amici che aspettano al rifugio. */
const inCasa = computed(() => miei())
const vetrina = computed(() => {
  const nuovi = PETS.filter(p => !haAnimale(p.id)).sort((a, b) => a.costo - b.costo)
    .map(p => ({ ...p, prezzo: p.costo }))
  const aspettano = alRifugio().map(p => ({ ...p, prezzo: quotaRientro(p.id) }))
  return [...nuovi, ...aspettano].slice(0, Math.max(0, POSTI_CASA - inCasa.value.length))
})

const urgenza = id => chiede(id, props.adesso)
const bisognoso = id => urgenza(id).grado === 'basso'
const posa = id => ({ alto: 'contento', medio: 'normale', basso: 'chiede' })[urgenza(id).grado]
const addosso = id => state.profile.pets[id]?.addosso || {}

/* ---------- gli oggetti sulle mensole ----------
   La misura la detta la mensola più affollata: `--n` entra nel CSS e da
   lì esce la larghezza di ogni oggetto, così niente sborda mai. */
const massimo = computed(() =>
  Math.max(1, ...state.profile.layout.map(r => r.length)))

/* riordino con il dito: identico a prima, ma le mensole ora sono tre
   bande dentro il disegno invece di tre riquadri in colonna */
const scaffali = ref(null)
let d = null
const fantasma = ref(null)
const mensolaCalda = ref(-1)

function giu(e, riga, col, emoji) {
  e.preventDefault()
  const r = e.target.getBoundingClientRect()
  d = { riga, col, emoji, dx: e.clientX - r.left, dy: e.clientY - r.top, mosso: false }
  scaffali.value.setPointerCapture(e.pointerId)
}

function muovi(e) {
  if (!d) return
  if (!d.mosso) { d.mosso = true; fantasma.value = { emoji: d.emoji, x: 0, y: 0 } }
  fantasma.value.x = e.clientX - d.dx
  fantasma.value.y = e.clientY - d.dy
  const t = bersaglio(e.clientX, e.clientY)
  mensolaCalda.value = t ? t.riga : -1
}

function su(e) {
  if (!d) return
  const dd = d; d = null; fantasma.value = null; mensolaCalda.value = -1
  if (!dd.mosso) return
  const t = bersaglio(e.clientX, e.clientY)
  if (t) moveItem(dd.riga, dd.col, t.riga, t.indice)
}

/* mensola dalla Y, posizione di inserimento dalla X rispetto ai centri */
function bersaglio(x, y) {
  const righe = [...scaffali.value.children]
  let riga = righe.findIndex(s => {
    const r = s.getBoundingClientRect()
    return y >= r.top && y <= r.bottom
  })
  if (riga < 0) {
    let best = -1, dist = Infinity
    righe.forEach((s, i) => {
      const r = s.getBoundingClientRect(), c = (r.top + r.bottom) / 2
      if (Math.abs(y - c) < dist) { dist = Math.abs(y - c); best = i }
    })
    if (dist > 140) return null
    riga = best
  }
  const oggetti = [...righe[riga].querySelectorAll('.ogg')]
  let indice = oggetti.length
  for (let i = 0; i < oggetti.length; i++) {
    const r = oggetti[i].getBoundingClientRect()
    if (x < r.left + r.width / 2) { indice = i; break }
  }
  return { riga, indice }
}
</script>

<template>
  <div class="stanza">
    <!-- ═══════════ LA PARETE ═══════════ -->
    <div class="parete">
      <div class="alto">
        <!-- il quadro: una zampa, che di questa stanza è lo stemma -->
        <svg class="quadro" viewBox="0 0 60 60" aria-hidden="true">
          <rect x="3" y="3" width="54" height="54" rx="6" fill="#e0b070" />
          <rect x="7" y="7" width="46" height="46" rx="4" fill="#fff6e2" />
          <g fill="#8fae9b">
            <ellipse cx="30" cy="36" rx="11" ry="9" />
            <circle cx="19" cy="24" r="4.4" /><circle cx="27" cy="20" r="4.4" />
            <circle cx="36" cy="21" r="4.4" /><circle cx="43" cy="27" r="4.2" />
          </g>
        </svg>

        <!-- la finestra: fuori è sempre una bella giornata -->
        <svg class="finestra" viewBox="0 0 104 100" aria-hidden="true">
          <rect x="6" y="6" width="92" height="80" rx="5" fill="#c6e8ff" />
          <circle cx="78" cy="24" r="9" fill="#ffe9a3" />
          <g fill="#ffffff" opacity=".95">
            <ellipse cx="28" cy="28" rx="14" ry="7.5" />
            <ellipse cx="38" cy="24" rx="9" ry="6" />
            <ellipse cx="63" cy="47" rx="11" ry="5.5" />
          </g>
          <path d="M6,66 q16,-11 30,-3 q14,7 28,1 q14,-7 34,-1 V86 H6 Z" fill="#a9e0a0" />
          <path d="M6,77 q22,-7 46,-1 q24,6 46,-4 V86 H6 Z" fill="#86ce85" />
          <rect x="49" y="6" width="6" height="80" fill="#fffdf8" />
          <rect x="6" y="43" width="92" height="6" fill="#fffdf8" />
          <rect x="3" y="3" width="98" height="86" rx="7" fill="none"
                stroke="#fffdf8" stroke-width="6" />
          <rect x="0" y="86" width="104" height="8" rx="4" fill="#ffe7d0" />
          <!-- le tende, che è quello che rende una finestra una finestra -->
          <path d="M6,4 q11,24 3,46 q-5,12 -9,20 V4 Z" fill="#93b9d6" />
          <path d="M98,4 q-11,24 -3,46 q5,12 9,20 V4 Z" fill="#93b9d6" />
          <rect x="-1" y="0" width="106" height="7" rx="3.5" fill="#6d90ab" />
        </svg>
      </div>

      <!-- ---------- gli scaffali ---------- -->
      <div class="basso">
        <div id="scaffali" ref="scaffali" :style="{ '--n': massimo }"
             @pointermove="muovi" @pointerup="su" @pointercancel="su">
          <div v-for="(riga, ri) in state.profile.layout" :key="ri"
               class="mensola" :class="{ calda: mensolaCalda === ri }">
            <span v-for="(e, ci) in riga" :key="e" class="ogg"
                  :class="{ velato: d && d.mosso && d.riga === ri && d.col === ci }"
                  @pointerdown="giu($event, ri, ci, e)">{{ e }}</span>
          </div>
          <p v-if="!state.profile.owned.length" class="mensole-vuote">
            gli oggetti che compri finiscono qui
          </p>
        </div>
      </div>

      <!-- ---------- il letto: scenografia, non si tocca ---------- -->
      <div class="mobili">
        <svg class="letto" viewBox="0 0 168 92" aria-hidden="true">
          <rect x="2" y="6" width="20" height="78" rx="7" fill="#e0b070" />
          <rect x="148" y="30" width="18" height="54" rx="7" fill="#e0b070" />
          <rect x="10" y="76" width="148" height="8" rx="4" fill="#c9914e" />
          <rect x="12" y="44" width="144" height="26" rx="7" fill="#fffaf3" />
          <path d="M62,44 H150 a6,6 0 0 1 6,6 v14 a6,6 0 0 1 -6,6 H62 Z" fill="#9fd0ff" />
          <g fill="#ffffff" opacity=".8">
            <circle cx="78" cy="53" r="3" /><circle cx="98" cy="61" r="3" />
            <circle cx="118" cy="52" r="3" /><circle cx="138" cy="60" r="3" />
          </g>
          <ellipse cx="44" cy="42" rx="21" ry="9" fill="#ece5d6" />
          <ellipse cx="44" cy="40" rx="17" ry="6.5" fill="#fdf9f0" />
        </svg>
      </div>

      <!-- ---------- la porta del negozio ---------- -->
      <button class="porta" aria-label="negozio" @click="emit('negozio', 'casa')">
        <span class="insegna">🛒 Negozio</span>
        <svg viewBox="0 0 60 120" preserveAspectRatio="none" aria-hidden="true">
          <rect x="0" y="0" width="60" height="120" rx="3" fill="#d09257" />
          <rect x="5" y="5" width="50" height="115" rx="2" fill="#f0bd86" />
          <rect x="12" y="16" width="36" height="36" rx="3" fill="#00000012" />
          <rect x="12" y="62" width="36" height="46" rx="3" fill="#00000012" />
        </svg>
        <i class="maniglia"></i>
      </button>
    </div>

    <!-- ═══════════ IL PAVIMENTO ═══════════ -->
    <div class="pavimento">
      <div class="battiscopa"></div>
      <div class="tappeto"></div>

      <!-- la macchina delle sorprese, contro il muro, che si tocca -->
      <button class="macchina" aria-label="macchina delle sorprese"
              @click="emit('sorprese')">
        <svg viewBox="0 0 60 110" aria-hidden="true">
          <ellipse cx="30" cy="102" rx="26" ry="6" fill="#00000022" />
          <rect x="7" y="46" width="46" height="48" rx="7" fill="#6fb3b8" />
          <rect x="3" y="90" width="54" height="11" rx="5" fill="#4e8f95" />
          <rect x="16" y="66" width="28" height="18" rx="3" fill="#f6faf8" />
          <text x="30" y="80" font-size="13" text-anchor="middle">🎁</text>
          <circle cx="30" cy="56" r="5.5" fill="#ffd24a" />
          <circle cx="30" cy="27" r="24" fill="#eaf7ff" stroke="#ffffff" stroke-width="3" />
          <circle cx="22" cy="33" r="6" fill="#ffd24a" />
          <circle cx="35" cy="35" r="6" fill="#7ee0a0" />
          <circle cx="29" cy="22" r="6" fill="#9fd0ff" />
          <circle cx="40" cy="25" r="5" fill="#f0a17a" />
          <rect x="3" y="42" width="54" height="8" rx="4" fill="#4e8f95" />
        </svg>
      </button>

      <div class="fila">
        <!-- prima chi ci vive -->
        <button v-for="p in inCasa" :key="p.id" class="posto"
                :aria-label="p.nome" @click="emit('animale', p.id)">
          <span v-if="bisognoso(p.id)" class="bolla">{{ urgenza(p.id).def.emoji }}</span>
          <span class="ombra"></span>
          <PetSprite :pet="p" :stato="posa(p.id)" :addosso="addosso(p.id)" :size="120" />
        </button>
        <!-- poi i posti liberi: la sagoma di chi potrebbe starci, col nome
             e quanto costa. Un `?` da solo non dice chi ci dovrebbe
             stare, e la cosa che invoglia ad adottare Watson è vedere
             Watson. -->
        <button v-for="p in vetrina" :key="'v' + p.id" class="posto libero"
                :aria-label="'adotta ' + p.nome" @click="emit('negozio', 'animali')">
          <span class="fantasma">
            <PetSprite :pet="p" stato="normale" :size="120" />
          </span>
          <span class="chi-manca">{{ p.nome }} · 🪙 {{ p.prezzo }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- fuori dalla stanza apposta: dentro sarebbe agganciato al disegno
       invece che alla finestra, e seguirebbe il dito storto -->
  <div v-if="fantasma" class="volante"
       :style="{ left: fantasma.x + 'px', top: fantasma.y + 'px' }">{{ fantasma.emoji }}</div>
</template>

<style scoped>
/* `container-type` fa di questa scatola l'unità di misura di tutto quello
   che c'è dentro: la stanza si rimpicciolisce intera, non a pezzi.
   Il tetto di altezza serve ai tablet: senza, su uno schermo alto e largo
   la stanza diventava un corridoio con la porta a tre metri. */
.stanza { position:relative; container-type:inline-size;
          width:min(100%,560px); height:100%; max-height:940px;
          display:flex; flex-direction:column;
          border-radius:26px; overflow:hidden;
          box-shadow:0 10px 30px #8593a833, 0 2px 0 #ffffff88 }

/* ---------- la parete ---------- */
.parete { position:relative; flex:1; min-height:0; display:flex; flex-direction:column;
          background:
            repeating-linear-gradient(90deg, #ffffff00 0 5cqw, #ffffff5e 5cqw 10cqw),
            linear-gradient(180deg, #f9fbf7, #eef3ec 58%, #e3ebe3) }
.alto { flex:none; height:27%; display:flex; align-items:flex-start;
        justify-content:space-between; gap:3cqw; padding:4% 4cqw 0 30cqw }
.finestra { height:100%; width:auto; filter:drop-shadow(0 3px 5px #5a5f4f26) }
.quadro { height:66%; width:auto; margin-top:6%;
          filter:drop-shadow(0 3px 4px #5a5f4f26) }
.basso { flex:1; min-height:0; display:flex; padding:0 4cqw 1% 30cqw }
/* la fascia bassa della parete: il letto, che non si tocca e non serve a
   niente se non a far sembrare una cameretta una cameretta */
.mobili { flex:none; height:26%; position:relative }
.letto { position:absolute; right:3cqw; bottom:0; height:96%; width:auto;
         filter:drop-shadow(0 3px 5px #5a5f4f26) }

/* ---------- la porta ---------- */
.porta { position:absolute; left:1.5cqw; bottom:0; width:27cqw; height:54%;
         padding:0; background:none; display:block }
.porta svg { width:100%; height:100%; display:block;
             filter:drop-shadow(-2px 2px 5px #5a5f4f26) }
.porta:active { transform:translateY(2px) }
.porta .maniglia { position:absolute; right:16%; top:52%; width:1.8cqw; height:1.8cqw;
                   border-radius:50%; background:#ffd24a; box-shadow:0 1px 0 #c98a00 }
.insegna { position:absolute; left:50%; top:7%; transform:translateX(-50%); z-index:2;
           background:#fffdf8; color:#6f5228; white-space:nowrap;
           font-size:clamp(8px,2.7cqw,13px); font-weight:900;
           padding:.7cqw 1.8cqw; border-radius:999px;
           box-shadow:0 2px 0 #d3a05f, 0 3px 8px #5a5f4f26 }

/* ---------- gli scaffali ---------- */
#scaffali { position:relative; flex:1; display:flex; flex-direction:column }
/* la larghezza di un oggetto: quella comoda finché ci sta, poi quella che
   fa entrare la mensola più piena. Trenta oggetti non sfondano il muro. */
.mensola { position:relative; flex:1; display:flex; align-items:flex-end;
           gap:.4cqw; padding-bottom:2cqw; border-radius:2cqw 2cqw 0 0;
           transition:background .15s;
           --dim:min(10.5cqw, calc(50cqw / var(--n, 1))) }
.mensola.calda { background:#4f6bd022 }
.mensola::after { content:''; position:absolute; left:0; right:0; bottom:0; height:1.7cqw;
                  border-radius:.6cqw;
                  background:linear-gradient(180deg,#e6b87e,#c9914e);
                  box-shadow:0 .7cqw 1.4cqw #6b4a9a26 }
.ogg { width:calc(var(--dim) * 1.25); font-size:var(--dim); line-height:1.1;
       text-align:center; touch-action:none; cursor:grab }
.ogg.velato { opacity:.25 }
.mensole-vuote { position:absolute; left:0; right:0; top:38%; text-align:center;
                 font-size:clamp(9px,2.8cqw,13px); color:#8a8f82; opacity:.8 }
.volante { position:fixed; z-index:70; font-size:34px; pointer-events:none }

/* ---------- il pavimento ---------- */
.pavimento { position:relative; height:35%; min-height:126px;
             background:
               repeating-linear-gradient(90deg, #00000000 0 11cqw, #00000012 11cqw 11.5cqw),
               linear-gradient(180deg,#eabb8c,#d79f6d) }
.battiscopa { position:absolute; top:0; left:0; right:0; height:8%;
              background:linear-gradient(180deg,#fffaf2,#f0e2d2);
              box-shadow:0 .5cqw 1cqw #00000018 }
.tappeto { position:absolute; left:7cqw; right:5cqw; bottom:4%; height:64%;
           border-radius:50%; opacity:.9;
           background:
             radial-gradient(closest-side, #eef1e6 0 46%, #d7e2d2 46% 62%, #eae7d6 62% 78%,
                             #b8ccc0 78% 100%) }

.fila { position:absolute; left:2cqw; right:2cqw; bottom:7%;
        display:flex; align-items:flex-end; gap:.5cqw }
/* la macchina sta contro il muro, dietro gli animali: più lontana, più
   piccola, e il primo piano resta a chi ci vive */
.macchina { position:absolute; left:2.5cqw; top:11%; width:15cqw; padding:0; background:none;
            animation:tentenna 4.6s ease-in-out infinite }
.macchina svg { width:100%; height:auto; display:block;
                filter:drop-shadow(0 3px 4px #00000028) }
.macchina:active { transform:translateY(2px) }
@keyframes tentenna { 0%,90%,100%{transform:rotate(0)} 94%{transform:rotate(-2.5deg)}
                      97%{transform:rotate(2.5deg)} }

.posto { flex:1; min-width:0; position:relative; padding:0; background:none;
         display:flex; flex-direction:column; align-items:center; justify-content:flex-end }
.posto :deep(svg.bestia) { width:100%; height:auto; position:relative; z-index:2 }
.posto:active :deep(svg.bestia) { transform:translateY(2px) }
.ombra { position:absolute; bottom:1%; left:12%; right:12%; height:7%; border-radius:50%;
         background:#00000022; filter:blur(1.5px) }
/* l'unica cosa che un animale dice qui: cosa gli manca */
.bolla { position:absolute; top:-12%; right:4%; z-index:3;
         font-size:clamp(13px,5cqw,24px); line-height:1;
         background:#fffdf8; border-radius:999px; padding:1.1cqw 1.3cqw;
         box-shadow:0 2px 0 #dfe0d4, 0 4px 10px #5a5f4f33;
         animation:sobbalza 1.5s ease-in-out infinite }
@keyframes sobbalza { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

/* Chi non c'è ancora è la sua sagoma, scolorita: un `?` non dice chi
   dovrebbe stare lì, e la cosa che fa venir voglia di adottare Watson è
   vedere Watson. Il cartellino sotto dice nome e prezzo. */
.fantasma { width:100%; filter:grayscale(1) brightness(1.3); opacity:.4;
            pointer-events:none }
.fantasma :deep(svg.bestia) { width:100%; height:auto }
.chi-manca { font-size:clamp(9px,2.9cqw,13px); font-weight:800; color:#5c5a54;
             background:#fffdf8dd; border-radius:999px; padding:.4cqw 2cqw;
             white-space:nowrap; margin-top:2% }
</style>
