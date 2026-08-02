<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { state, item, answer, level, addCoins, countMastered } from '../store/profile.js'
import { createPicker, activeSet, overdue, weight, SRS } from '../store/srs.js'
import { suono } from '../audio.js'

const emit = defineEmits(['vai'])

const CFG = {
  vite: 3, viteMax: 5, cadutaSec: 10, minCaduta: 3.2, perLivello: 0.10,
  base: 3, maxAsteroidi: 6, ogniLivelli: 3, salitaOgni: 5,
  puntiOk: 10, puntiNo: -5, bossOgni: 8, bossLento: 1.45, difficileLento: 1.25,
  bossPunti: 40, serieVita: 10, perMoneta: 10,
}

/* ---------- elementi: chiave normalizzata, 6×8 e 8×6 sono lo stesso fatto ---------- */
const chiave = (a, b) => 'math:' + Math.min(a, b) + 'x' + Math.max(a, b)
const daChiave = k => k.slice(5).split('x').map(Number)

const fase = ref('menu')                 // menu | gioco | fine
const tabelle = ref([...state.profile.settings.tables])
const sel = reactive(new Set(tabelle.value))

const hud = reactive({ vite: 3, punti: 0, giuste: 0, sbagliate: 0, livello: 1, serie: 0 })
const cartello = reactive({ testo: '', colore: '', n: 0 })
const finale = reactive({ punti: 0, giuste: 0, livello: 1, record: false, ripasso: [] })

const tela = ref(null)
let ctx = null, W = 0, H = 0, S = 1, suolo = 0, altezzaDomanda = 0
let asteroidi = [], particelle = [], anelli = [], stelle = []
let scossa = 0, lampo = 0, pulsa = 0, raf = 0, ultimo = 0
let domanda = reactive({ a: 7, b: 8, ris: 56, difficile: false })
let chieste = 0, apertoIl = 0
const picker = createPicker({ getItem: k => item(k), useTime: true })

/* ---------- coppie disponibili con le tabelline scelte ---------- */
function coppie() {
  const out = []
  for (const a of tabelle.value) for (let b = 1; b <= 10; b++) out.push([a, b])
  return out
}
const chiaviPossibili = () => [...new Set(coppie().map(([a, b]) => chiave(a, b)))]

/* ordine di introduzione: le tabelline oggettivamente più facili per prime */
function ordine(k) {
  const [lo, hi] = daChiave(k)
  if (lo === 1 || hi === 10) return 0.25
  if (lo === 2 || lo === 5) return 0.5
  let d = 0.5 + 0.09 * (lo + hi)
  if (lo === 9 || hi === 9) d *= 0.8
  if (lo === hi) d *= 0.75
  return d
}

function poolAttivo() {
  const now = Date.now()
  const tutte = chiaviPossibili()
  const { learning, due } = activeSet(tutte, k => item(k), ordine, now, 12)
  const scaduti = due.sort((x, y) => overdue(item(y), now) - overdue(item(x), now)).slice(0, 5)
  const p = [...new Set([...learning, ...scaduti])]
  return p.length ? p : tutte
}

/* ---------- difficoltà ---------- */
function difficolta(lv) {
  const t = CFG.cadutaSec / Math.pow(1 + CFG.perLivello, lv - 1)
  return { caduta: Math.max(CFG.minCaduta, t),
           quanti: Math.min(CFG.maxAsteroidi, CFG.base + Math.floor((lv - 1) / CFG.ogniLivelli)) }
}

function distrattori(a, b, n) {
  const c = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a * b + a, a * b - a,
             a * b + b, a * b - b, a * b + 1, a * b - 1, a * b + 10, a * b - 10]
  const out = [], visti = new Set([a * b])
  for (const v of c.sort(() => Math.random() - 0.5)) {
    if (v > 0 && v <= 200 && !visti.has(v)) { visti.add(v); out.push(v) }
    if (out.length === n) break
  }
  let g = 0
  while (out.length < n && g++ < 300) {
    const v = a * b + Math.floor(Math.random() * 21) - 10
    if (v > 0 && !visti.has(v)) { visti.add(v); out.push(v) }
  }
  return out
}

function nuovaDomanda(boss) {
  const p = poolAttivo()
  let k
  if (boss) {
    const now = Date.now()
    k = p.reduce((x, y) => weight(item(y), now, { useTime: true }) > weight(item(x), now, { useTime: true }) ? y : x)
  } else {
    k = picker.pick(p)
  }
  let [lo, hi] = daChiave(k)
  // sceglie un verso compatibile con le tabelline selezionate
  const versi = []
  if (tabelle.value.includes(lo)) versi.push([lo, hi])
  if (tabelle.value.includes(hi) && hi !== lo) versi.push([hi, lo])
  const [a, b] = versi.length ? versi[Math.floor(Math.random() * versi.length)] : [lo, hi]
  domanda.a = a; domanda.b = b; domanda.ris = a * b
  domanda.difficile = (Math.min(a, b) >= 6 && Math.max(a, b) >= 6) || a * b >= 48
  apertoIl = performance.now()
  return k
}

function ondata() {
  asteroidi = []
  const boss = chieste > 0 && chieste % CFG.bossOgni === 0
  nuovaDomanda(boss)
  chieste++

  const { caduta, quanti } = difficolta(hud.livello)
  const valori = [domanda.ris, ...distrattori(domanda.a, domanda.b, quanti - 1)]
    .sort(() => Math.random() - 0.5)
  const colonna = W / quanti
  const lento = boss ? CFG.bossLento : (domanda.difficile ? CFG.difficileLento : 1)
  const vel = suolo / (caduta * lento)

  valori.forEach((v, i) => {
    const ok = v === domanda.ris
    const base = Math.min(W, H) * 0.095 * (boss ? 1.22 : 1) + (String(v).length - 1) * 6 * S
    const r = Math.max(24, Math.min(base, colonna * 0.46, boss ? 84 : 68))
    const off = Math.random() * H * (boss ? 0.18 : 0.30)
    const m = r * (boss ? 1.18 : 1.02)
    const x = colonna * i + colonna / 2 + (Math.random() - 0.5) * Math.max(0, colonna - 2 * r - 6)
    asteroidi.push({
      x: Math.max(m, Math.min(W - m, x)), y: -r - off, r, v, ok, boss,
      vy: vel, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * (boss ? 0.3 : 0.5),
      ph: Math.random() * 6.28, morto: false,
      forma: Array.from({ length: boss ? 11 : 9 }, () => 0.76 + Math.random() * 0.34),
    })
  })
  if (boss) mostraCartello('☄️ BOSS!', '#ff6b6b')
}

/* ---------- interazione ---------- */
function tocca(e) {
  if (fase.value !== 'gioco') return
  const x = e.clientX, y = e.clientY
  for (const a of asteroidi) {
    if (a.morto) continue
    if ((x - a.x) ** 2 + (y - a.y) ** 2 <= a.r * a.r) return colpisci(a)
  }
}

function colpisci(a) {
  const k = chiave(domanda.a, domanda.b)
  const ms = performance.now() - apertoIl
  if (a.ok) {
    answer(k, { correct: true, ms })
    picker.afterAnswer(k, true)
    hud.giuste++; hud.serie++
    if (a.boss) {
      esplodi(a.x, a.y, '#ffd94a', 46); esplodi(a.x, a.y, '#ff6b6b', 30)
      anello(a.x, a.y, '#ffd94a', a.r * 7); scossa = 14; lampo = 0.5
      hud.punti += CFG.bossPunti; suono.boss(); dammiVita('☄️ BOSS ABBATTUTO!')
    } else {
      esplodi(a.x, a.y, '#7fe3ff', 30); anello(a.x, a.y, '#7fe3ff', a.r * 3)
      hud.punti += CFG.puntiOk; suono.ok()
      if (hud.serie % CFG.serieVita === 0) dammiVita('🔥 ' + hud.serie + ' DI FILA!')
    }
    if (hud.giuste % CFG.perMoneta === 0) {
      addCoins(level.value); mostraCartello('+' + level.value + ' 🪙', '#ffd94a'); suono.moneta()
    }
    state.profile.totals.math++
    const nuovo = 1 + Math.floor(hud.giuste / CFG.salitaOgni)
    if (nuovo > hud.livello) { hud.livello = nuovo; salitaLivello() }
    ondata()
  } else {
    answer(k, { correct: false, ms })
    picker.afterAnswer(k, false)
    a.morto = true; hud.serie = 0; hud.sbagliate++
    esplodi(a.x, a.y, '#ff6b6b', 14); suono.no(); scossa = 10
    hud.punti = Math.max(0, hud.punti + CFG.puntiNo)
    perdiVita()
  }
}

function dammiVita(perche) {
  if (hud.vite < CFG.viteMax) { hud.vite++; mostraCartello(perche + '  +1 ♥', '#ff8fa3'); suono.vita() }
  else mostraCartello(perche, '#ffd94a')
}
function perdiVita() { hud.serie = 0; if (--hud.vite <= 0) finePartita() }

function salitaLivello() {
  mostraCartello('LIVELLO ' + hud.livello, '#7fe3ff')
  anello(W / 2, suolo * 0.55, '#7fe3ff', Math.max(W, H))
  anello(W / 2, suolo * 0.55, '#ffd94a', Math.max(W, H) * 0.7)
  lampo = 0.45; scossa = 8; suono.livello()
  for (let i = 0; i < 40; i++) particelle.push({
    x: Math.random() * W, y: suolo, vx: (Math.random() - 0.5) * 90 * S,
    vy: -(120 + Math.random() * 260) * S, vita: 1.4, r: (2 + Math.random() * 3) * S,
    c: Math.random() < 0.5 ? '#7fe3ff' : '#ffd94a',
  })
}

function mostraCartello(testo, colore) { cartello.testo = testo; cartello.colore = colore; cartello.n++ }
function esplodi(x, y, c, n = 22) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, sp = (40 + Math.random() * 180) * S
    particelle.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vita: 1,
                      r: (2 + Math.random() * 4) * S, c })
  }
}
const anello = (x, y, c, max) => anelli.push({ x, y, r: 0, max, vita: 1, c })

/* ---------- ciclo ---------- */
function ridimensiona() {
  W = window.innerWidth; H = window.innerHeight
  const cv = tela.value; if (!cv) return
  cv.width = Math.floor(W * devicePixelRatio); cv.height = Math.floor(H * devicePixelRatio)
  cv.style.width = W + 'px'; cv.style.height = H + 'px'
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  S = Math.max(0.6, Math.min(1.6, Math.min(W, H) / 700))
  altezzaDomanda = Math.max(96, H * 0.17)
  suolo = H - altezzaDomanda
  stelle = Array.from({ length: 110 }, () => ({
    x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.4,
    s: Math.random() * 14 + 4, a: Math.random() * 0.6 + 0.3,
  }))
}

function aggiorna(dt) {
  let caduto = false
  for (const a of asteroidi) {
    if (a.morto) continue
    a.y += a.vy * dt; a.rot += a.vr * dt
    if (a.y - a.r > suolo) { a.morto = true; if (a.ok) caduto = true }
  }
  if (caduto) {
    const k = chiave(domanda.a, domanda.b)
    answer(k, { correct: false, ms: 9000 })
    picker.afterAnswer(k, false)
    hud.sbagliate++
    esplodi(W / 2, suolo, '#ff9d1c', 34); suono.boom(); scossa = 16
    perdiVita()
    if (fase.value === 'gioco') ondata()
  }
  for (const p of particelle) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt * S; p.vita -= dt * 1.6 }
  particelle = particelle.filter(p => p.vita > 0)
  for (const g of anelli) { g.r += g.max * dt * 1.8; g.vita -= dt * 1.8 }
  anelli = anelli.filter(g => g.vita > 0)
  if (scossa > 0) scossa -= dt * 40
  if (lampo > 0) lampo -= dt * 1.6
}

function disegna(dt) {
  ctx.save()
  if (scossa > 0) ctx.translate((Math.random() - 0.5) * scossa, (Math.random() - 0.5) * scossa)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#05081a'); g.addColorStop(1, '#0e1338')
  ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40)

  for (const s of stelle) {
    s.y += s.s * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W }
    ctx.globalAlpha = s.a; ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.29); ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.strokeStyle = '#4aa3ff55'; ctx.lineWidth = 2 * S; ctx.setLineDash([10 * S, 10 * S])
  ctx.beginPath(); ctx.moveTo(0, suolo); ctx.lineTo(W, suolo); ctx.stroke(); ctx.setLineDash([])

  if (fase.value === 'gioco') for (const a of asteroidi) if (!a.morto) disegnaAsteroide(a)

  for (const gg of anelli) {
    ctx.globalAlpha = Math.max(0, gg.vita) * 0.55
    ctx.strokeStyle = gg.c; ctx.lineWidth = 6 * S * Math.max(0.2, gg.vita)
    ctx.beginPath(); ctx.arc(gg.x, gg.y, gg.r, 0, 6.29); ctx.stroke()
  }
  for (const p of particelle) {
    ctx.globalAlpha = Math.max(0, p.vita)
    ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill()
  }
  ctx.globalAlpha = 1; ctx.restore()
  if (lampo > 0) { ctx.globalAlpha = Math.max(0, lampo) * 0.45; ctx.fillStyle = '#fff'
                   ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1 }
}

function disegnaAsteroide(a) {
  ctx.save(); ctx.translate(a.x, a.y)
  if (a.boss) {
    const k = 1 + Math.sin(pulsa * 4 + a.ph) * 0.06
    const h = ctx.createRadialGradient(0, 0, a.r * 0.8, 0, 0, a.r * 1.75 * k)
    h.addColorStop(0, '#ff6b6b66'); h.addColorStop(1, '#ff6b6b00')
    ctx.fillStyle = h; ctx.beginPath(); ctx.arc(0, 0, a.r * 1.75 * k, 0, 6.29); ctx.fill()
    ctx.scale(k, k)
  }
  ctx.rotate(a.rot)
  ctx.beginPath()
  a.forma.forEach((m, i) => {
    const ang = i / a.forma.length * 6.2832
    const x = Math.cos(ang) * a.r * m, y = Math.sin(ang) * a.r * m
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  })
  ctx.closePath()
  const rg = ctx.createRadialGradient(-a.r * 0.3, -a.r * 0.3, a.r * 0.15, 0, 0, a.r)
  if (a.boss) { rg.addColorStop(0, '#d1584f'); rg.addColorStop(1, '#4a1512') }
  else { rg.addColorStop(0, '#9c8f7d'); rg.addColorStop(1, '#4b4238') }
  ctx.fillStyle = rg; ctx.fill()
  ctx.lineWidth = (a.boss ? 5 : 3) * S; ctx.strokeStyle = a.boss ? '#ffd94a' : '#2a241d'; ctx.stroke()
  ctx.restore()

  ctx.fillStyle = '#fff'; ctx.font = `900 ${a.r * 0.85}px system-ui, sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.lineWidth = 5 * S; ctx.strokeStyle = '#00000099'
  ctx.strokeText(a.v, a.x, a.y); ctx.fillText(a.v, a.x, a.y)
}

function ciclo(ts) {
  const dt = Math.min(0.05, (ts - ultimo) / 1000 || 0); ultimo = ts
  pulsa += dt
  if (fase.value === 'gioco') aggiorna(dt)
  disegna(dt)
  raf = requestAnimationFrame(ciclo)
}

/* ---------- partite ---------- */
function inizia() {
  if (!sel.size) return
  tabelle.value = [...sel].sort((a, b) => a - b)
  state.profile.settings.tables = tabelle.value
  hud.vite = CFG.vite; hud.punti = 0; hud.giuste = 0; hud.sbagliate = 0
  hud.livello = 1; hud.serie = 0
  particelle = []; anelli = []; scossa = 0; lampo = 0; chieste = 0
  picker.reset()
  fase.value = 'gioco'
  ondata()
}

function finePartita() {
  fase.value = 'fine'
  asteroidi = []
  suono.fine()
  const prima = state.profile.best.math || 0
  finale.punti = hud.punti; finale.giuste = hud.giuste; finale.livello = hud.livello
  finale.record = hud.punti > prima
  if (finale.record) state.profile.best.math = hud.punti
  const now = Date.now()
  finale.ripasso = chiaviPossibili()
    .map(k => ({ k, it: item(k) }))
    .filter(x => x.it.err > 0)
    .sort((x, y) => (y.it.err - y.it.ok) - (x.it.err - x.it.ok))
    .slice(0, 3)
    .map(x => { const [a, b] = daChiave(x.k); return { a, b, err: x.it.err } })
}

function scegliTabella(n) { sel.has(n) ? sel.delete(n) : sel.add(n) }
function tutte() {
  const on = sel.size < 10
  sel.clear(); if (on) for (let i = 1; i <= 10; i++) sel.add(i)
}

const cuori = computed(() => '♥'.repeat(Math.max(0, hud.vite)) +
                            '♡'.repeat(Math.max(0, CFG.vite - hud.vite)))

onMounted(() => {
  // aggancio per i test automatici: permette di colpire l'asteroide giusto
  // senza dover indovinare dove il numero e' disegnato sul canvas
  window.__mate = { hud, domanda, colpisci, inizia, sel,
                    asteroidi: () => asteroidi, fase, finale }
  ctx = tela.value.getContext('2d')
  ridimensiona()
  window.addEventListener('resize', ridimensiona)
  raf = requestAnimationFrame(ciclo)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', ridimensiona)
})
</script>

<template>
  <div class="schermo spazio">
    <canvas ref="tela" @pointerdown="tocca"></canvas>

    <div v-if="fase === 'gioco'" class="hud">
      <div class="cuori">{{ cuori }}</div>
      <div v-if="hud.serie >= 3" class="serie">🔥{{ hud.serie }}</div>
      <div class="sp"></div>
      <div class="monete">🪙 {{ state.profile.coins }}</div>
      <div class="punti">{{ hud.punti }}</div>
      <div class="liv">Liv. {{ hud.livello }}</div>
      <button class="tondo scuro" @click="suono.muta()">{{ suono.acceso.value ? '🔊' : '🔇' }}</button>
      <button class="tondo scuro" @click="$emit('vai','home')">✕</button>
    </div>

    <div v-if="fase === 'gioco'" class="domanda">
      <b><i>{{ domanda.a }}</i> × <i>{{ domanda.b }}</i> = ?</b>
    </div>

    <div v-if="cartello.testo" :key="cartello.n" class="cartello" :style="{ color: cartello.colore }">
      {{ cartello.testo }}
    </div>

    <!-- menu -->
    <div v-if="fase === 'menu'" class="velo">
      <h1 class="chiaro">Tabelline<br><span>Asteroidi</span></h1>
      <p class="testo chiaro">Tocca l'asteroide con il risultato giusto prima che arrivi in fondo.</p>
      <p class="testo chiaro">Quali tabelline vuoi allenare?</p>
      <div class="tabelle">
        <button v-for="n in 10" :key="n" class="tb" :class="{ on: sel.has(n) }"
                @click="scegliTabella(n)">{{ n }}</button>
      </div>
      <div class="riga">
        <button class="bottone chiaro" @click="tutte">Tutte</button>
        <button class="bottone" :disabled="!sel.size" @click="inizia">Gioca ▶</button>
      </div>
      <button class="link chiaro" @click="$emit('vai','home')">‹ torna ai giochi</button>
    </div>

    <!-- fine -->
    <div v-if="fase === 'fine'" class="velo">
      <h1 class="chiaro">Fine partita</h1>
      <div class="dato">Punti: <span>{{ finale.punti }}</span></div>
      <div class="dato">Risposte giuste: <span>{{ finale.giuste }}</span></div>
      <div class="dato">Livello: <span>{{ finale.livello }}</span></div>
      <div class="dato">{{ finale.record ? '🏆 Nuovo record!' : 'Record: ' + (state.profile.best.math || 0) }}</div>
      <div v-if="finale.ripasso.length" class="ripasso">
        <div class="tit">Da ripassare</div>
        <div v-for="r in finale.ripasso" :key="r.a + 'x' + r.b">
          {{ r.a }} × {{ r.b }} <i>✕{{ r.err }}</i>
        </div>
      </div>
      <div class="riga">
        <button class="bottone" @click="fase = 'menu'">Riprova ▶</button>
        <button class="bottone chiaro" @click="$emit('vai','home')">Giochi</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spazio { background:#05081a; color:#fff }
canvas { position:absolute; inset:0; touch-action:manipulation }
.hud { position:absolute; top:0; left:0; right:0; padding:10px 12px 26px; display:flex;
       align-items:center; gap:10px; font-weight:800; font-size:clamp(14px,3.5vw,20px);
       pointer-events:none; background:linear-gradient(180deg,#05081af2 40%,#05081a00);
       text-shadow:0 2px 8px #000 }
.hud .sp { flex:1 }
.cuori { letter-spacing:2px; font-size:1.15em }
.serie { color:#ff9d1c }
.monete { color:#ffd94a }
.punti { color:#fff; opacity:.85 }
.liv { color:#7fe3ff }
.tondo.scuro { pointer-events:auto; background:#ffffff18; color:#fff; box-shadow:none }

.domanda { position:absolute; left:0; right:0; bottom:0; height:17vh; min-height:96px;
           display:flex; align-items:center; justify-content:center; pointer-events:none;
           background:linear-gradient(0deg,#0b1130,#0b113000) }
.domanda b { font-size:clamp(34px,11vw,68px); font-weight:900; letter-spacing:2px;
             text-shadow:0 0 22px #4aa3ff88, 0 4px 0 #0008 }
.domanda i { font-style:normal; color:#7fe3ff }

.cartello { position:absolute; left:0; right:0; top:38%; text-align:center; pointer-events:none;
            font-size:clamp(26px,7.5vw,54px); font-weight:900;
            text-shadow:0 0 24px currentColor, 0 4px 10px #000c;
            animation:apparire 1.5s cubic-bezier(.2,1.2,.3,1) forwards }
@keyframes apparire { 0%{opacity:0;transform:scale(.4)} 18%{opacity:1;transform:scale(1.12)}
                      30%{transform:scale(1)} 75%{opacity:1}
                      100%{opacity:0;transform:scale(1.15) translateY(-24px)} }

.velo { position:absolute; inset:0; background:#05081aee; display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:16px; padding:22px; text-align:center }
.chiaro { color:#fff }
h1.chiaro span { color:#7fe3ff }
.tabelle { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; max-width:340px; width:100% }
.tb { padding:12px 0; border-radius:12px; border:2px solid #ffffff2a; background:#ffffff10;
      color:#fff; font-size:18px; font-weight:800 }
.tb.on { background:#2f7bff; border-color:#7fe3ff; box-shadow:0 0 14px #2f7bff88 }
.dato { font-size:clamp(17px,4.6vw,24px); font-weight:800 }
.dato span { color:#ffd94a }
.ripasso { font-size:16px; font-weight:800; opacity:.9 }
.ripasso .tit { font-size:12px; letter-spacing:2px; text-transform:uppercase; opacity:.6; margin-bottom:4px }
.ripasso i { font-style:normal; color:#ff5c7a }
</style>
