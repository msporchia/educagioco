<script setup>
import { ref, computed } from 'vue'
import { state, buy, moveItem, fixLayout } from '../store/profile.js'
import { ITEMS } from '../data/shop.js'

defineEmits(['vai'])

const tab = ref('cameretta')
const scaffali = ref(null)
const posseduti = computed(() => new Set(state.profile.owned))

/* ---------- riordino degli oggetti sulle mensole ---------- */
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
    return y >= r.top - 8 && y <= r.bottom + 8
  })
  if (riga < 0) {
    let best = -1, dist = Infinity
    righe.forEach((s, i) => {
      const r = s.getBoundingClientRect(), c = (r.top + r.bottom) / 2
      if (Math.abs(y - c) < dist) { dist = Math.abs(y - c); best = i }
    })
    if (dist > 170) return null
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

function compra(it) { if (buy(it[0], it[2])) fixLayout() }
</script>

<template>
  <div class="schermo">
    <div class="barra">
      <button class="tondo" @click="$emit('vai','home')">‹</button>
      <div class="sp"></div>
      <div class="gettone">🪙 <b>{{ state.profile.coins }}</b></div>
    </div>

    <div class="centro">
      <div class="tabs">
        <button :class="{on:tab==='cameretta'}" @click="tab='cameretta'">🛏️ Cameretta</button>
        <button :class="{on:tab==='negozio'}"  @click="tab='negozio'">🛒 Negozio</button>
      </div>

      <!-- ---------- CAMERETTA ---------- -->
      <template v-if="tab === 'cameretta'">
        <h2>La cameretta di {{ state.player }}</h2>
        <div id="scaffali" ref="scaffali" @pointermove="muovi" @pointerup="su" @pointercancel="su">
          <div v-for="(riga, ri) in state.profile.layout" :key="ri"
               class="mensola" :class="{ calda: mensolaCalda === ri }">
            <span v-for="(e, ci) in riga" :key="e" class="ogg"
                  :class="{ velato: d && d.mosso && d.riga===ri && d.col===ci }"
                  @pointerdown="giu($event, ri, ci, e)">{{ e }}</span>
          </div>
        </div>
        <p v-if="!state.profile.owned.length" class="mini">
          Ancora vuota — gioca per guadagnare monete!
        </p>
        <p v-else-if="state.profile.owned.length > 1" class="mini">
          Trascina gli oggetti per sistemarli come vuoi.
        </p>
      </template>

      <!-- ---------- NEGOZIO ---------- -->
      <template v-else>
        <h2>Negozio</h2>
        <p class="testo">{{ posseduti.size }} di {{ ITEMS.length }} oggetti raccolti</p>
        <div id="scorte">
          <button v-for="it in ITEMS" :key="it[0]" class="scheda"
                  :class="{ mio: posseduti.has(it[0]) }"
                  :disabled="posseduti.has(it[0]) || state.profile.coins < it[2]"
                  @click="compra(it)">
            <span class="e">{{ it[0] }}</span>{{ it[1] }}<br>
            <span class="c">{{ posseduti.has(it[0]) ? '✔ tuo' : '🪙 ' + it[2] }}</span>
          </button>
        </div>
      </template>
    </div>

    <div v-if="fantasma" class="volante"
         :style="{ left: fantasma.x + 'px', top: fantasma.y + 'px' }">{{ fantasma.emoji }}</div>
  </div>
</template>

<style scoped>
.tabs { display:flex; gap:8px }
.tabs button { padding:9px 20px; border-radius:999px; background:#ffffffaa; font-weight:800;
               font-size:15px; color:var(--tenue) }
.tabs button.on { background:linear-gradient(180deg,var(--viola),var(--viola-scuro)); color:#fff }

#scaffali { width:100%; max-width:470px; display:flex; flex-direction:column; gap:12px }
.mensola { background:linear-gradient(180deg,#ffffff66,#ffffff22); border-radius:14px; min-height:70px;
           display:flex; align-items:flex-end; gap:4px; padding:8px 8px 0; flex-wrap:wrap;
           border-bottom:9px solid #c9a227; box-shadow:0 6px 14px #a08fc026; transition:background .15s }
.mensola.calda { background:#7c5cff26 }
.ogg { font-size:34px; line-height:1.15; touch-action:none; cursor:grab; padding:0 2px }
.ogg.velato { opacity:.25 }
.volante { position:fixed; z-index:70; font-size:40px; pointer-events:none }

#scorte { width:100%; max-width:470px; display:grid; gap:9px;
          grid-template-columns:repeat(auto-fill,minmax(92px,1fr)) }
.scheda { background:var(--carta); border-radius:16px; padding:11px 5px 8px; text-align:center;
          box-shadow:0 4px 0 #e3d6f0; font-weight:800; font-size:11.5px; color:#6b5c8a }
.scheda .e { font-size:32px; display:block; margin-bottom:3px }
.scheda .c { color:#c98a00 }
.scheda.mio { opacity:.45 }
.scheda:disabled { opacity:.4 }
</style>
