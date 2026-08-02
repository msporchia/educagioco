<script setup>
/* ═══════════════════════════════════════════════════════════════════
   TOWER DEFENSE — schermo diviso.
   Sopra i nemici avanzano lungo il percorso; sotto si sceglie che torre
   costruire e si risolve l'operazione corrispondente. La torre nasce solo
   quando l'operazione è finita, e nasce potenziata se non ci sono errori.

   La campagna è una fila di tappe: ognuna ha il suo percorso, un numero
   preciso di ondate da superare e le torri che mette a disposizione. Le
   quattro operazioni entrano una per volta, con tappe di consolidamento in
   mezzo. Vinta l'ultima tappa si apre la partita libera, senza fine.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { state, item, answer, level, addCoins, strengthOf, tdProgresso, tdCompleta }
  from '../store/profile.js'
import { weight } from '../store/srs.js'
import { GENERATORI, TORRI } from '../data/ops.js'
import ColumnOp from '../components/ColumnOp.vue'
import { suono } from '../audio.js'

defineEmits(['vai'])

const CFG = {
  cuori: 5, perMoneta: 3,          // monete ogni N ondate superate
  nemiciBase: 5, nemiciPiu: 2,
  vitaBase: 42, vitaPiu: 0.38,
  velBase: 26, velPiu: 1.6,
  pausaOnda: 4,
}

/* Le tappe. `durezza` moltiplica la robustezza dei nemici — dentro la tappa
   l'ondata la fa già crescere, questa fa ripartire ogni tappa più in alto
   della precedente. `cap` tiene a bada la taglia dei numeri nelle prime
   tappe: la difficoltà delle operazioni deve venire dal bambino, non dal
   fatto che è arrivato lontano. `posti` è quante torri ci stanno. */
const TAPPE = [
  { nome: 'Il sentiero', emoji: '🌱', ondate: 6, posti: 8, durezza: 1, cap: 2,
    torri: ['add'],
    forma: [[0.03, 0.35], [0.35, 0.35], [0.50, 0.62], [0.78, 0.62], [0.94, 0.45]] },
  { nome: 'Il guado', emoji: '💧', ondate: 7, posti: 10, durezza: 1.3, cap: 3,
    torri: ['add', 'sub'],
    forma: [[0.03, 0.30], [0.28, 0.30], [0.40, 0.55], [0.20, 0.78], [0.55, 0.90],
            [0.80, 0.70], [0.94, 0.50]] },
  { nome: 'La radura', emoji: '🍀', ondate: 8, posti: 10, durezza: 1.6, cap: 3,
    torri: ['add', 'sub'],
    forma: [[0.03, 0.34], [0.24, 0.60], [0.42, 0.32], [0.60, 0.62], [0.78, 0.34],
            [0.93, 0.58]] },
  { nome: 'Il bosco', emoji: '🌲', ondate: 9, posti: 12, durezza: 1.9, cap: 4,
    torri: ['add', 'sub', 'mul'],
    forma: [[0.03, 0.32], [0.31, 0.32], [0.43, 0.53], [0.17, 0.73], [0.47, 0.90],
            [0.78, 0.73], [0.66, 0.47], [0.88, 0.36], [0.95, 0.55]] },
  { nome: 'La gola', emoji: '⛰️', ondate: 10, posti: 12, durezza: 2.3, cap: 4,
    torri: ['add', 'sub', 'mul'],
    forma: [[0.03, 0.28], [0.50, 0.28], [0.62, 0.50], [0.30, 0.55], [0.22, 0.78],
            [0.62, 0.86], [0.86, 0.66], [0.94, 0.42]] },
  { nome: 'Le mura', emoji: '🏰', ondate: 12, posti: 14, durezza: 2.7, cap: 5,
    torri: ['add', 'sub', 'mul', 'div'],
    forma: [[0.03, 0.32], [0.22, 0.32], [0.30, 0.55], [0.10, 0.72], [0.34, 0.88],
            [0.58, 0.74], [0.48, 0.50], [0.68, 0.34], [0.86, 0.48], [0.92, 0.72]] },
]

/* la partita libera: nessun traguardo, tutte le torri, il percorso più lungo */
const LIBERA = { nome: 'Partita libera', emoji: '♾️', ondate: Infinity, posti: 14,
                 durezza: 1, cap: 5, torri: ['add', 'sub', 'mul', 'div'],
                 forma: TAPPE[3].forma }

const fase = ref('mappa')          // mappa | gioco | vinta | trionfo | fine
const hud = reactive({ cuori: CFG.cuori, onda: 0, uccisi: 0, torri: 0 })
const scelta = ref(null)           // tipo di torre in costruzione
const op = ref(null)
const messaggio = reactive({ testo: '', n: 0 })
const premio = ref(0)

const progresso = computed(() => tdProgresso())
const tappaIdx = ref(0)            // -1 = partita libera
const tappa = computed(() => (tappaIdx.value < 0 ? LIBERA : TAPPE[tappaIdx.value]))
const campagna = computed(() => tappaIdx.value >= 0)
const sbloccata = i => i <= progresso.value.tappa

/* la difficoltà delle operazioni segue il bambino: è la stessa forza
   del motore di apprendimento, riusata su una abilità invece che su un fatto */
const chiaveAbilita = t => 'op:' + t
const livelloOp = t => Math.min(tappa.value.cap,
  1 + Math.min(4, Math.floor(strengthOf(chiaveAbilita(t)) / 1.3)))

/* per la torre magica scegliamo il moltiplicatore fra le tabelline deboli */
function moltiplicatoreDebole() {
  const now = Date.now()
  const cand = []
  for (let m = 2; m <= 9; m++) {
    let peggio = 0
    for (let b = 1; b <= 10; b++) {
      const k = 'math:' + Math.min(m, b) + 'x' + Math.max(m, b)
      peggio = Math.max(peggio, weight(item(k), now, { useTime: true }))
    }
    cand.push([m, peggio])
  }
  const tot = cand.reduce((s, c) => s + c[1], 0)
  let r = Math.random() * tot
  for (const [m, w] of cand) { r -= w; if (r <= 0) return m }
  return cand[cand.length - 1][0]
}

function scegliTorre(t) {
  if (fase.value !== 'gioco' || scelta.value) return
  if (!tappa.value.torri.includes(t)) return
  scelta.value = t
  op.value = t === 'mul' ? GENERATORI.mul(livelloOp(t), moltiplicatoreDebole())
                         : GENERATORI[t](livelloOp(t))
}

function operazioneFinita({ errori, ms }) {
  const t = scelta.value
  answer(chiaveAbilita(t), { correct: errori === 0, ms })
  costruisci(t, errori === 0 ? 2 : 1)
  avvisa(errori === 0 ? `${TORRI[t].nome} potenziata!` : `${TORRI[t].nome} costruita`)
  scelta.value = null; op.value = null
}

function annulla() { scelta.value = null; op.value = null }

/* ═══════════ campo di battaglia ═══════════ */
const tela = ref(null)
let ctx = null, W = 0, H = 0, S = 1, raf = 0, ultimo = 0
let percorso = [], lunghezza = 0, postazioni = []
let nemici = [], torri = [], colpi = [], schizzi = []
let daGenerare = 0, prossimo = 0, pausa = 2, tempo = 0

/* Il percorso è quello della tappa, in coordinate normalizzate.
   La partenza sta sotto la fascia dell'HUD: più in alto i primi nemici
   nascerebbero dietro i cuori e non si vedrebbero arrivare. */
function costruisciPercorso() {
  const T = tappa.value
  percorso = T.forma.map(([x, y]) => ({ x: x * W, y: y * H }))
  lunghezza = 0
  for (let i = 1; i < percorso.length; i++) lunghezza += dist(percorso[i - 1], percorso[i])
  // postazioni ai lati del percorso, alternate
  postazioni = []
  const quante = T.posti
  const passo = lunghezza / (quante + 1)
  for (let i = 1; i <= quante; i++) {
    const p = puntoA(passo * i)
    const q = puntoA(passo * i + 8)
    const nx = -(q.y - p.y), ny = q.x - p.x
    const L = Math.hypot(nx, ny) || 1
    const lato = i % 2 ? 1 : -1
    const off = 34 * S * lato
    postazioni.push({ x: p.x + nx / L * off, y: p.y + ny / L * off })
  }
  // si occupano partendo dal castello: l'ultima difesa si costruisce per prima,
  // così ogni torre nuova allunga la difesa verso l'ingresso
  postazioni.reverse()
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

function puntoA(d) {
  let r = Math.max(0, Math.min(d, lunghezza))
  for (let i = 1; i < percorso.length; i++) {
    const seg = dist(percorso[i - 1], percorso[i])
    if (r <= seg) {
      const t = seg ? r / seg : 0
      return { x: percorso[i - 1].x + (percorso[i].x - percorso[i - 1].x) * t,
               y: percorso[i - 1].y + (percorso[i].y - percorso[i - 1].y) * t }
    }
    r -= seg
  }
  return percorso[percorso.length - 1]
}

const FACCE = ['👾', '👻', '🦠', '🐲', '🦂', '🕷️']

function nuovaOnda() {
  hud.onda++
  daGenerare = CFG.nemiciBase + hud.onda * CFG.nemiciPiu
  prossimo = 0
  avvisa(campagna.value && hud.onda === tappa.value.ondate
    ? 'Ultima ondata!' : 'Ondata ' + hud.onda)
  suono.livello()
}

function generaNemico() {
  const D = tappa.value.durezza
  const vita = CFG.vitaBase * D * (1 + hud.onda * CFG.vitaPiu)
  nemici.push({
    d: -Math.random() * 30, vita, vitaMax: vita,
    vel: (CFG.velBase + hud.onda * CFG.velPiu) * (0.85 + 0.15 * D) * S,
    faccia: FACCE[Math.min(FACCE.length - 1,
      Math.floor((campagna.value ? tappaIdx.value : hud.onda / 3)))],
    gelo: 0,
  })
}

function costruisci(tipo, lv) {
  const libera = postazioni[torri.length % postazioni.length]
  torri.push({ ...libera, tipo, lv, ricarica: 0 })
  hud.torri++
  suono.compra()
  // la battaglia comincia solo quando c'è qualcosa che difende
  if (!hud.onda) pausa = 1.2
}

function aggiorna(dt) {
  tempo += dt
  // generazione
  if (daGenerare > 0) {
    prossimo -= dt
    if (prossimo <= 0) { generaNemico(); daGenerare--; prossimo = Math.max(0.45, 1.4 - hud.onda * 0.05) }
  } else if (!nemici.length && torri.length) {
    pausa -= dt
    if (pausa <= 0) {
      pausa = CFG.pausaOnda
      if (hud.onda >= tappa.value.ondate) return tappaSuperata()
      if (hud.onda > 0 && hud.onda % CFG.perMoneta === 0) {
        addCoins(level.value); avvisa('+' + level.value + ' 🪙'); suono.moneta()
      }
      nuovaOnda()
    }
  }

  // nemici
  for (const n of nemici) {
    const rall = n.gelo > 0 ? 0.55 : 1
    n.gelo = Math.max(0, n.gelo - dt)
    n.d += n.vel * rall * dt
    if (n.d >= lunghezza) { n.vita = 0; n.arrivato = true }
  }
  for (const n of nemici) {
    if (n.arrivato) {
      hud.cuori--; suono.no()
      if (hud.cuori <= 0) return finePartita()
    }
  }
  nemici = nemici.filter(n => n.vita > 0)

  // torri
  for (const t of torri) {
    t.ricarica -= dt
    const T = TORRI[t.tipo]
    if (t.ricarica > 0) continue
    const raggio = T.raggio * S * (1 + (t.lv - 1) * 0.15)
    const dentro = nemici.filter(n => dist(puntoA(n.d), t) <= raggio)
    if (!dentro.length) continue
    t.ricarica = T.ricarica
    if (t.tipo === 'sub') {
      dentro.forEach(n => { n.gelo = 1.2 })
      schizzi.push({ x: t.x, y: t.y, r: 0, max: raggio, vita: 1, c: T.colore })
    } else {
      const bersaglio = dentro.reduce((a, b) => (b.d > a.d ? b : a))
      const p = puntoA(bersaglio.d)
      colpi.push({ x: t.x, y: t.y, tx: p.x, ty: p.y, t: 0,
                   danno: T.danno * t.lv, area: T.area * S, c: T.colore })
      suono.sparo()
    }
  }

  // proiettili
  for (const c of colpi) {
    c.t += dt * 4.5
    if (c.t >= 1) {
      c.fatto = true
      const centro = { x: c.tx, y: c.ty }
      let colpiti = 0
      for (const n of nemici) {
        const p = puntoA(n.d)
        if (c.area ? dist(p, centro) <= c.area : dist(p, centro) <= 22 * S) {
          n.vita -= c.danno; colpiti++
          if (n.vita <= 0) { hud.uccisi++ }
        }
      }
      if (c.area) schizzi.push({ x: c.tx, y: c.ty, r: 0, max: c.area, vita: 1, c: c.c })
      if (colpiti) suono.nota(320, 140, 0.08, 'square', 0.07)
    }
  }
  colpi = colpi.filter(c => !c.fatto)
  nemici = nemici.filter(n => n.vita > 0)
  for (const s of schizzi) { s.r += s.max * dt * 5; s.vita -= dt * 2.4 }
  schizzi = schizzi.filter(s => s.vita > 0)
}

function disegna() {
  ctx.clearRect(0, 0, W, H)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#dff3d8'); g.addColorStop(1, '#bfe6c9')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

  // percorso
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = '#c8a97a'; ctx.lineWidth = 26 * S
  ctx.beginPath(); percorso.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke()
  ctx.strokeStyle = '#e0c9a3'; ctx.lineWidth = 18 * S; ctx.stroke()

  // base
  const fine = percorso[percorso.length - 1]
  ctx.font = `${30 * S}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('🏰', fine.x - 6 * S, fine.y)

  // postazioni libere
  postazioni.slice(torri.length).forEach(p => {
    ctx.fillStyle = '#ffffff55'
    ctx.beginPath(); ctx.arc(p.x, p.y, 9 * S, 0, 6.29); ctx.fill()
  })

  // torri
  for (const t of torri) {
    const T = TORRI[t.tipo]
    ctx.fillStyle = T.colore + '12'
    ctx.beginPath(); ctx.arc(t.x, t.y, T.raggio * S * (1 + (t.lv - 1) * 0.15), 0, 6.29); ctx.fill()
    ctx.fillStyle = '#fffffff0'
    ctx.beginPath(); ctx.arc(t.x, t.y, 17 * S, 0, 6.29); ctx.fill()
    ctx.strokeStyle = T.colore; ctx.lineWidth = 3 * S; ctx.stroke()
    ctx.font = `${19 * S}px system-ui`
    ctx.fillText(T.emoji, t.x, t.y + 1 * S)
    if (t.lv > 1) {
      ctx.font = `${11 * S}px system-ui`; ctx.fillStyle = '#c98a00'
      ctx.fillText('★', t.x + 13 * S, t.y - 12 * S)
    }
  }

  // schizzi
  for (const s of schizzi) {
    ctx.globalAlpha = Math.max(0, s.vita) * 0.5
    ctx.strokeStyle = s.c; ctx.lineWidth = 4 * S
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.29); ctx.stroke()
  }
  ctx.globalAlpha = 1

  // proiettili
  for (const c of colpi) {
    const x = c.x + (c.tx - c.x) * c.t, y = c.y + (c.ty - c.y) * c.t
    ctx.fillStyle = c.c
    ctx.beginPath(); ctx.arc(x, y, 5 * S, 0, 6.29); ctx.fill()
  }

  // nemici
  for (const n of nemici) {
    const p = puntoA(n.d)
    ctx.font = `${23 * S}px system-ui`
    ctx.globalAlpha = n.gelo > 0 ? 0.75 : 1
    ctx.fillText(n.faccia, p.x, p.y)
    ctx.globalAlpha = 1
    const w = 26 * S, q = Math.max(0, n.vita / n.vitaMax)
    ctx.fillStyle = '#00000033'; ctx.fillRect(p.x - w / 2, p.y - 19 * S, w, 4 * S)
    ctx.fillStyle = q > 0.5 ? '#38c172' : q > 0.25 ? '#ffc93c' : '#ff5c7a'
    ctx.fillRect(p.x - w / 2, p.y - 19 * S, w * q, 4 * S)
    if (n.gelo > 0) { ctx.font = `${11 * S}px system-ui`; ctx.fillText('❄️', p.x + 12 * S, p.y - 12 * S) }
  }
}

function ciclo(ts) {
  const dt = Math.min(0.05, (ts - ultimo) / 1000 || 0); ultimo = ts
  if (fase.value === 'gioco') aggiorna(dt)
  if (ctx) disegna()
  raf = requestAnimationFrame(ciclo)
}

function ridimensiona() {
  const cv = tela.value; if (!cv) return
  const r = cv.parentElement.getBoundingClientRect()
  W = r.width; H = r.height
  cv.width = Math.floor(W * devicePixelRatio); cv.height = Math.floor(H * devicePixelRatio)
  cv.style.width = W + 'px'; cv.style.height = H + 'px'
  ctx = cv.getContext('2d')
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  S = Math.max(0.62, Math.min(1.5, Math.min(W, H) / 420))
  costruisciPercorso()
}

function avvisa(t) { messaggio.testo = t; messaggio.n++ }

function inizia(i = tappaIdx.value) {
  tappaIdx.value = i
  costruisciPercorso()
  hud.cuori = CFG.cuori; hud.onda = 0; hud.uccisi = 0; hud.torri = 0
  nemici = []; torri = []; colpi = []; schizzi = []
  daGenerare = 0; pausa = 1.5; tempo = 0
  scelta.value = null; op.value = null
  fase.value = 'gioco'
  avvisa('Costruisci la prima torre')
}

/* la tappa è superata quando l'ultima ondata è finita e il campo è pulito */
function tappaSuperata() {
  if (!campagna.value) return           // la partita libera non finisce mai
  const ultima = tappaIdx.value === TAPPE.length - 1
  const p = tdCompleta(tappaIdx.value, TAPPE.length)
  premio.value = level.value * (2 + tappaIdx.value)
  addCoins(premio.value)
  nemici = []; colpi = []; schizzi = []
  fase.value = ultima ? 'trionfo' : 'vinta'
  suono.livello(); suono.moneta()
  return p
}

function prossimaTappa() {
  inizia(Math.min(TAPPE.length - 1, tappaIdx.value + 1))
}

function finePartita() {
  fase.value = 'fine'
  nemici = []; colpi = []
  suono.fine()
}

function allaMappa() {
  fase.value = 'mappa'
  tappaIdx.value = Math.min(TAPPE.length - 1, progresso.value.tappa)
  nemici = []; torri = []; colpi = []; schizzi = []
  costruisciPercorso()
}

const cuori = computed(() => '❤️'.repeat(Math.max(0, hud.cuori)))

onMounted(() => {
  tappaIdx.value = Math.min(TAPPE.length - 1, progresso.value.tappa)
  ridimensiona()
  window.addEventListener('resize', ridimensiona)
  window.__td = { hud, fase, scelta, op, inizia, scegliTorre, operazioneFinita,
                  nemici: () => nemici, torri: () => torri, livelloOp,
                  TAPPE, tappaIdx, postazioni: () => postazioni,
                  // -1 è la partita libera: tutte le torri, nessun traguardo
                  iniziaLibera: () => inizia(-1),
                  // aggancio per i test: apre un'operazione a un livello preciso
                  forzaOp: (t, lv) => { scelta.value = t
                    op.value = t === 'mul' ? GENERATORI.mul(lv, moltiplicatoreDebole())
                                           : GENERATORI[t](lv) } }
  raf = requestAnimationFrame(ciclo)
})
onUnmounted(() => { cancelAnimationFrame(raf); window.removeEventListener('resize', ridimensiona) })
</script>

<template>
  <div class="schermo td">
    <!-- ════════ SOPRA: il campo ════════ -->
    <div class="campo">
      <canvas ref="tela"></canvas>
      <div class="hud">
        <div class="gettone">{{ cuori || '💀' }}</div>
        <div class="gettone">🌊 <b>{{ hud.onda }}</b><span v-if="campagna">/{{ tappa.ondate }}</span></div>
        <div class="gettone tappa">{{ tappa.emoji }} {{ tappa.nome }}</div>
        <div class="sp"></div>
        <div class="gettone">🪙 <b>{{ state.profile.coins }}</b></div>
        <button class="tondo" @click="suono.muta()">{{ suono.acceso.value ? '🔊' : '🔇' }}</button>
        <button class="tondo" @click="$emit('vai','home')">✕</button>
      </div>
      <div v-if="messaggio.testo" :key="messaggio.n" class="annuncio">{{ messaggio.testo }}</div>
    </div>

    <!-- ════════ SOTTO: le operazioni ════════ -->
    <div class="banco">
      <!-- scelta della torre -->
      <template v-if="fase === 'gioco' && !scelta">
        <div class="dritta">{{ hud.onda ? 'Che torre vuoi costruire?'
                                        : 'I nemici arrivano quando la prima torre è pronta' }}</div>
        <div class="torri">
          <button v-for="(T, k) in TORRI" :key="k" class="tsc" :style="{ '--c': T.colore }"
                  :class="{ bloccata: !tappa.torri.includes(k) }"
                  :disabled="!tappa.torri.includes(k)" @click="scegliTorre(k)">
            <span class="em">{{ tappa.torri.includes(k) ? T.emoji : '🔒' }}</span>
            <b>{{ T.nome }}</b>
            <i>{{ T.segno }}<template v-if="tappa.torri.includes(k)"> · liv. {{ livelloOp(k) }}</template></i>
          </button>
        </div>
      </template>

      <!-- operazione in corso -->
      <template v-else-if="fase === 'gioco' && op">
        <div class="intestazione">
          <span class="em">{{ TORRI[scelta].emoji }}</span>
          <b>{{ TORRI[scelta].nome }}</b>
          <span class="mini">{{ TORRI[scelta].descr }}</span>
          <button class="link" @click="annulla">cambia</button>
        </div>
        <ColumnOp :op="op" @fatto="operazioneFinita" />
      </template>

      <!-- mappa della campagna -->
      <template v-else-if="fase === 'mappa'">
        <h2>Difendi il castello</h2>
        <p class="testo">Risolvi un'operazione in colonna e costruisci la torre: la prima
          ondata parte quando la torre è pronta. Senza errori nasce potenziata ★.</p>
        <div class="tappe">
          <button v-for="(T, i) in TAPPE" :key="i" class="tap"
                  :class="{ fatta: i < progresso.tappa, chiusa: !sbloccata(i) }"
                  :disabled="!sbloccata(i)" @click="inizia(i)">
            <span class="em">{{ sbloccata(i) ? T.emoji : '🔒' }}</span>
            <b>{{ i + 1 }}. {{ T.nome }}</b>
            <i>{{ T.ondate }} ondate ·
              <template v-for="k in T.torri" :key="k">{{ TORRI[k].emoji }}</template>
            </i>
            <span v-if="i < progresso.tappa" class="spunta">✔</span>
          </button>
        </div>
        <div class="riga">
          <button v-if="progresso.libera" class="bottone" @click="inizia(-1)">Partita libera ♾️</button>
          <button class="bottone chiaro" @click="$emit('vai','home')">Indietro</button>
        </div>
      </template>

      <!-- tappa superata -->
      <template v-else-if="fase === 'vinta'">
        <h2>{{ tappa.emoji }} Tappa superata!</h2>
        <p class="testo"><b>{{ tappa.nome }}</b> è al sicuro: {{ tappa.ondate }} ondate,
          <b>{{ hud.uccisi }}</b> nemici fermati, <b>{{ hud.torri }}</b> torri costruite.
          Premio: <b>+{{ premio }} 🪙</b></p>
        <p v-if="TAPPE[tappaIdx + 1]" class="dritta">Ora tocca a
          {{ TAPPE[tappaIdx + 1].emoji }} {{ TAPPE[tappaIdx + 1].nome }}<template
            v-for="k in TAPPE[tappaIdx + 1].torri.filter(k => !tappa.torri.includes(k))" :key="k">
            — nuova torre {{ TORRI[k].emoji }} {{ TORRI[k].nome }} ({{ TORRI[k].segno }})</template>
        </p>
        <div class="riga">
          <button class="bottone" @click="prossimaTappa">Tappa successiva ▶</button>
          <button class="bottone chiaro" @click="allaMappa">Mappa</button>
        </div>
      </template>

      <!-- campagna vinta -->
      <template v-else-if="fase === 'trionfo'">
        <h2>🎉 Campagna vinta!</h2>
        <p class="testo">Tutte e {{ TAPPE.length }} le tappe sono superate: il regno è salvo.
          Premio: <b>+{{ premio }} 🪙</b>. Si apre la <b>partita libera</b>, senza fine.</p>
        <div class="riga">
          <button class="bottone" @click="inizia(-1)">Partita libera ♾️</button>
          <button class="bottone chiaro" @click="allaMappa">Mappa</button>
        </div>
      </template>

      <!-- sconfitta -->
      <template v-else>
        <h2>Il castello è caduto</h2>
        <p class="testo">
          <template v-if="campagna">{{ tappa.emoji }} {{ tappa.nome }}: ondate superate
            <b>{{ hud.onda - 1 }}</b> su {{ tappa.ondate }}</template>
          <template v-else>Ondate superate: <b>{{ hud.onda - 1 }}</b></template>
          · nemici fermati: <b>{{ hud.uccisi }}</b> · torri costruite: <b>{{ hud.torri }}</b></p>
        <div class="riga">
          <button class="bottone" @click="inizia()">Riprova ▶</button>
          <button class="bottone chiaro" @click="allaMappa">Mappa</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.td { background:linear-gradient(180deg,#eaf7e6,#e9e4ff) }
.campo { position:relative; height:min(52vh, 420px); min-height:240px; flex:none; overflow:hidden }
canvas { display:block; width:100%; height:100% }
.hud { position:absolute; top:0; left:0; right:0; padding:8px; display:flex; gap:6px;
       align-items:center; font-weight:800; font-size:14px; pointer-events:none }
.hud .sp { flex:1 }
.hud .tondo { pointer-events:auto }
.annuncio { position:absolute; left:0; right:0; top:38%; text-align:center; pointer-events:none;
            font-size:clamp(20px,6vw,34px); font-weight:900; color:#2a2140;
            text-shadow:0 2px 0 #fff, 0 0 18px #fff;
            animation:apparire 1.6s ease-out forwards }
@keyframes apparire { 0%{opacity:0;transform:scale(.5)} 20%{opacity:1;transform:scale(1.1)}
                      35%{transform:scale(1)} 70%{opacity:1} 100%{opacity:0;transform:translateY(-20px)} }

.banco { flex:1; min-height:0; display:flex; flex-direction:column; align-items:center;
         justify-content:safe center; gap:8px; padding:10px 12px calc(12px + env(safe-area-inset-bottom));
         overflow-y:auto }
.dritta { font-size:13px; color:var(--tenue); font-weight:700; text-align:center }
.torri { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; width:100%; max-width:420px }
.tsc { background:var(--carta); border-radius:14px; padding:9px 4px; display:flex;
       flex-direction:column; align-items:center; gap:1px;
       box-shadow:0 4px 0 #e3d6f0, inset 0 0 0 2px var(--c) }
.tsc:active { transform:translateY(2px); box-shadow:0 2px 0 #e3d6f0, inset 0 0 0 2px var(--c) }
.tsc .em { font-size:24px }
.tsc b { font-size:11.5px; color:var(--viola-scuro) }
.tsc i { font-style:normal; font-size:10px; color:var(--tenue) }
.tsc.bloccata { opacity:.42; box-shadow:0 4px 0 #e3d6f0, inset 0 0 0 2px #d8cee6 }
.tsc.bloccata:active { transform:none }

/* la mappa della campagna */
.tappe { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; width:100%; max-width:420px }
.tap { position:relative; background:var(--carta); border-radius:14px; padding:9px 8px;
       display:flex; flex-direction:column; align-items:center; gap:1px;
       box-shadow:0 4px 0 #e3d6f0, inset 0 0 0 2px #c9b6e8 }
.tap:active { transform:translateY(2px); box-shadow:0 2px 0 #e3d6f0, inset 0 0 0 2px #c9b6e8 }
.tap .em { font-size:24px }
.tap b { font-size:12px; color:var(--viola-scuro) }
.tap i { font-style:normal; font-size:10.5px; color:var(--tenue) }
.tap.fatta { box-shadow:0 4px 0 #d4ecd8, inset 0 0 0 2px #38c172 }
.tap.chiusa { opacity:.45; box-shadow:0 4px 0 #e3d6f0, inset 0 0 0 2px #d8cee6 }
.tap.chiusa:active { transform:none }
.spunta { position:absolute; top:5px; right:8px; color:#38c172; font-weight:900; font-size:13px }
.hud .tappa { font-size:12px; max-width:34%; overflow:hidden; white-space:nowrap;
              text-overflow:ellipsis }

.intestazione { display:flex; align-items:center; gap:7px; flex-wrap:wrap; justify-content:center }
.intestazione .em { font-size:20px }
.intestazione b { color:var(--viola-scuro) }
</style>
