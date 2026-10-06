<script>
// dove si è fermato il robot l'ultima volta, per bambino: dura la sessione, non va nel profilo
let ultimo = null      // { chi, arrivo }
</script>

<script setup>
/* La scheda del robot: la mappa dei livelli del costruttore. Riceve lo stato
   già deciso di ogni livello e dice solo quale si vuole giocare.
   Disposizione in motore/scheda.js, disegno in scena/scheda.js;
   vedi docs/costruttore/scheda.md. */
import { ref, shallowRef, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import Fumetto from '../../../components/Fumetto.vue'
import Robot from './Robot.vue'
import { disponiScheda, stradaDelRobot, durataViaggio, lungo, larghezzaScheda, ALONE, R_LED, CONNETTORE }
  from '../motore/scheda.js'
import { disegnaDecoro, disegnaCoperchi, piediniChip, tracciato, STRATI, COLORI } from '../scena/scheda.js'

const props = defineProps({
  // [{ indice, nome, impara, capitolo, stato: vinto|adesso|aperto|spento, stelle, aMeta, perEta }]
  livelli: { type: Array, required: true },
  capitoli: { type: Array, required: true },     // [{ chiave, nome, icona }]
  tappa: { type: Number, required: true },       // il livello da fare; livelli.length a fila finita
  libero: { type: Object, required: true },      // { nome, icona, aperto, dice }
  chi: { type: String, default: '' },
  aperto: { type: [Number, String], default: null },   // il fumetto aperto: un indice o 'libero'
})
const emit = defineEmits(['gioca', 'libero', 'update:aperto'])

const scorre = ref(null)
const tavola = ref(null)
const largo = ref(0)
function misura() { if (scorre.value) largo.value = larghezzaScheda(scorre.value.clientWidth) }

const capitoliConQuanti = computed(() => props.capitoli
  .map(c => ({ ...c, quanti: props.livelli.filter(l => l.capitolo === c.chiave).length }))
  .filter(c => c.quanti > 0))
const scheda = computed(() => (largo.value ? disponiScheda(largo.value, capitoliConQuanti.value) : null))
const decoro = computed(() => (scheda.value ? disegnaDecoro(scheda.value) : null))
const coperchi = computed(() => (scheda.value ? disegnaCoperchi(scheda.value) : null))
const stile = s => ({ fill: s.fill || 'none', stroke: s.stroke || 'none', 'stroke-width': s.sw || 0 })

const N = computed(() => props.livelli.length)
const arrivo = computed(() => Math.max(0, Math.min(N.value - 1, props.tappa)))

/* ---------- la corrente e il robot ---------- */
const posato = ref(null)                // il livello accanto a cui sta il robot
const fino = ref(-1)                    // fin dove è arrivata la corrente: il nodo k
const viaggio = shallowRef(null)
const robot = ref({ x: 0, y: 0, visibile: true })
const scintilla = ref(null)             // { x, y } mentre corre
const scia = ref(null)                  // { d, da, a }: il rame che si accende
const appena = ref(new Set())           // i nodi accesi in questo viaggio, per il guizzo

const acceso = k => k <= fino.value
const nodoDi = i => scheda.value && scheda.value.ledDi[i]
function mettiRobot() {
  const n = nodoDi(posato.value)
  if (n) robot.value = { x: n.robot.x, y: n.robot.y, visibile: true }
}
const ricorda = () => { ultimo = { chi: props.chi, arrivo: posato.value } }

const inCima = () => (tavola.value ? tavola.value.offsetTop : 0)
function scorriA(y) {
  if (scorre.value) scorre.value.scrollTop = Math.max(0, inCima() + y - scorre.value.clientHeight * 0.55)
}

// la corrente corre davanti, il robot la segue: vedi docs/costruttore/scheda.md
const RITARDO = 0.35
function viaggia(da, a, attesa = 0) {
  const strada = stradaDelRobot(scheda.value, da, a)
  if (!strada) { posato.value = a; fino.value = nodoDi(a).k; mettiRobot(); ricorda(); return }
  const dur = durataViaggio(strada.L)
  const s0 = strada.tappe[0].s, s1 = strada.tappe[strada.tappe.length - 1].s
  const molle = q => { q = Math.max(0, Math.min(1, q)); return q < 0.5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2 }
  let t = -attesa, prima = null, id = 0, finito = false
  appena.value = new Set([nodoDi(da).k])
  scia.value = { d: tracciato(strada.punti), da: s0, a: s0 }
  const segui = y => {
    const s = scorre.value
    if (!s) return
    const su = inCima() + y - s.scrollTop, h = s.clientHeight
    if (su < h * 0.3 || su > h * 0.7) s.scrollTop += (su - h * 0.5) * 0.12
  }
  const arriva = () => {
    if (finito) return
    finito = true
    cancelAnimationFrame(id)
    posato.value = a
    fino.value = nodoDi(a).k
    scia.value = null
    scintilla.value = null
    viaggio.value = null
    mettiRobot(); ricorda()
  }
  const fotogramma = ora => {
    if (finito) return
    const nascosto = typeof document !== 'undefined' && document.hidden
    if (prima !== null && !nascosto) t += Math.min(0.05, Math.max(0, (ora - prima) / 1000))
    prima = ora
    if (t >= dur + RITARDO) return arriva()
    if (t >= 0) {
      // la scintilla, da un led all'altro
      const sc = s0 + (s1 - s0) * molle(t / dur)
      const [sx, sy] = lungo(strada.punti, sc)
      const sotto = strada.nascosti.some(([p, q]) => sc > p && sc < q)
      scintilla.value = t < dur && !sotto ? { x: sx, y: sy } : null
      scia.value = { ...scia.value, a: sc }
      let k = fino.value
      for (const tp of strada.tappe) if (tp.s <= sc + 0.5 && tp.k > k) { k = tp.k; appena.value = new Set([...appena.value, k]) }
      fino.value = k
      // il robot, dal suo posto al posto accanto all'altro
      const sr = strada.L * molle((t - RITARDO) / dur)
      const [rx, ry] = lungo(strada.punti, sr)
      robot.value = { x: rx, y: ry, visibile: !strada.nascosti.some(([p, q]) => sr > p && sr < q) }
      segui(Math.min(sy, ry))
    }
    id = requestAnimationFrame(fotogramma)
  }
  id = requestAnimationFrame(fotogramma)
  viaggio.value = { chiudi: arriva, ferma() { finito = true; cancelAnimationFrame(id) }, verso: a }
}

let pronto = false
function prepara() {
  if (pronto || !scheda.value) return
  pronto = true
  const a = arrivo.value
  const prima = ultimo && ultimo.chi === props.chi ? ultimo.arrivo : null
  if (prima !== null && prima < a && nodoDi(prima)) {
    // si è aperto un livello nuovo: la corrente ci corre, e il robot la segue
    posato.value = prima
    fino.value = nodoDi(prima).k
    mettiRobot()
    const n0 = nodoDi(prima), n1 = nodoDi(a)
    scorriA(Math.abs(n1.y - n0.y) < scorre.value.clientHeight * 0.5 ? (n0.y + n1.y) / 2 : n0.y)
    viaggia(prima, a, 0.45)
  } else {
    posato.value = a
    fino.value = nodoDi(a).k
    mettiRobot(); ricorda()
    scorriA(nodoDi(a).y)
  }
}

let occhio = null
watch(scheda, async () => {
  await nextTick()
  if (!pronto) return prepara()
  if (viaggio.value) viaggio.value.chiudi()
  fino.value = nodoDi(posato.value).k
  mettiRobot()
})
watch(arrivo, (a, prima) => {
  if (!pronto || a === prima) return
  if (viaggio.value) viaggio.value.chiudi()
  if (a > posato.value) viaggia(posato.value, a)
  else { posato.value = a; fino.value = nodoDi(a).k; mettiRobot(); ricorda() }
})
onMounted(() => {
  misura()
  if (typeof ResizeObserver !== 'undefined') { occhio = new ResizeObserver(misura); occhio.observe(scorre.value) }
})
onUnmounted(() => {
  if (occhio) occhio.disconnect()
  // uscendo a metà viaggio si conta come arrivato
  if (viaggio.value) { const a = viaggio.value.verso; viaggio.value.ferma(); posato.value = a; ricorda() }
})

/* ---------- cosa si vede ---------- */
const piste = computed(() => {
  const s = scheda.value
  if (!s) return null
  const tutte = [s.attacco, ...s.tratti].map(t => tracciato(t.punti)).join('')
  const accese = s.tratti.filter(t => acceso(t.k + 1)).map(t => tracciato(t.punti)).join('')
  return { tutte, accese, attacco: tracciato(s.attacco.punti) }
})
const vieCoperchi = computed(() => (scheda.value ? scheda.value.tratti.filter(t => t.coperchio)
  .flatMap(t => t.coperchio.vie.map(([x, y], j) => ({ x, y, chiave: `${t.k}-${j}`, accesa: acceso(t.k + 1) }))) : []))

const perIndice = computed(() => Object.fromEntries(props.livelli.map(l => [l.indice, l])))
// durante il viaggio i led dove la corrente non è ancora arrivata restano spenti
const statoDi = n => {
  const l = perIndice.value[n.indice]
  if (!l) return 'spento'
  return viaggio.value && !acceso(n.k) ? 'spento' : l.stato
}
const leds = computed(() => (scheda.value ? scheda.value.nodi.filter(n => n.tipo === 'led').map(n => {
  const l = perIndice.value[n.indice] || {}
  return { ...n, nome: l.nome, stato: statoDi(n), aMeta: !!l.aMeta && l.stato !== 'spento', guizzo: appena.value.has(n.k) }
}) : []))
const chips = computed(() => (scheda.value ? scheda.value.nodi.filter(n => n.tipo === 'chip').map(n => {
  const cap = props.capitoli.find(c => c.chiave === n.cap) || {}
  const suoi = props.livelli.filter(l => l.capitolo === n.cap)
  return { ...n, nome: cap.nome, icona: cap.icona, acceso: acceso(n.k), piedini: piediniChip(n.mezzo),
           vinti: suoi.filter(l => l.stelle > 0).length, quanti: suoi.length }
}) : []))

/* ---------- il fumetto ---------- */
function tocca(chiave) {
  if (viaggio.value) { viaggio.value.chiudi(); return }
  emit('update:aperto', props.aperto === chiave ? null : chiave)
}
const chiudi = () => { if (viaggio.value) viaggio.value.chiudi(); else if (props.aperto !== null) emit('update:aperto', null) }
const fumetto = computed(() => {
  const s = scheda.value, k = props.aperto
  if (!s || k === null || k === undefined) return null
  if (k === 'libero') return { x: s.connettore.x, y: s.connettore.y, raggio: CONNETTORE.alto / 2, libero: true }
  const n = s.ledDi[k], l = perIndice.value[k]
  return n && l ? { x: n.x, y: n.y, raggio: ALONE, l } : null
})
const stelline = s => '⭐'.repeat(s) + '☆'.repeat(Math.max(0, 2 - s))
const prossimo = computed(() => Math.min(props.tappa, N.value - 1) + 1)
function costruisci(i) { emit('update:aperto', null); emit('gioca', i) }
function entra() { emit('update:aperto', null); emit('libero') }
</script>

<template>
  <div ref="scorre" class="cst-mappa" data-scheda-robot @click="chiudi">
    <div v-if="scheda" ref="tavola" class="cst-tavola" :style="{ width: scheda.W + 'px', height: scheda.H + 'px' }">
      <svg class="cst-svg" :viewBox="`0 0 ${scheda.W} ${scheda.H}`" :width="scheda.W" :height="scheda.H" aria-hidden="true">
        <!-- il decoro, a strati -->
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path v-for="[nome, st] in STRATI" :key="nome" :d="decoro.strati[nome]" v-bind="stile(st)" />
          <text v-for="(t, i) in decoro.scritte" :key="'s' + i" :x="t.x" :y="t.y" class="cst-serigrafia">{{ t.testo }}</text>
          <text :x="scheda.scritta.x" :y="scheda.scritta.y" class="cst-serigrafia">{{ scheda.scritta.testo }}</text>
        </g>
        <!-- le piste: spente, poi il rame acceso fin dove arriva la corrente -->
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path :d="piste.tutte" :stroke="COLORI.spento" stroke-width="5" />
          <path v-if="libero.aperto" :d="piste.attacco" :stroke="COLORI.rame" stroke-width="5" />
          <path v-if="libero.aperto" :d="piste.attacco" :stroke="COLORI.lucido" stroke-width="1.5" />
          <path :d="piste.accese" :stroke="COLORI.rame" stroke-width="5" />
          <path :d="piste.accese" :stroke="COLORI.lucido" stroke-width="1.5" />
          <template v-if="scia">
            <path :d="scia.d" :stroke="COLORI.rame" stroke-width="5" :stroke-dasharray="`${Math.max(0.01, scia.a - scia.da)} 99999`" :stroke-dashoffset="-scia.da" />
            <path :d="scia.d" :stroke="COLORI.lucido" stroke-width="1.5" :stroke-dasharray="`${Math.max(0.01, scia.a - scia.da)} 99999`" :stroke-dashoffset="-scia.da" />
          </template>
        </g>
        <!-- dove la pista passa sotto: il componente sopra, e una via per parte -->
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path v-for="[nome, st] in STRATI" :key="nome" :d="coperchi.strati[nome]" v-bind="stile(st)" />
          <text v-for="(t, i) in coperchi.scritte" :key="'c' + i" :x="t.x" :y="t.y" class="cst-serigrafia">{{ t.testo }}</text>
        </g>
        <circle v-for="v in vieCoperchi" :key="v.chiave" :cx="v.x" :cy="v.y" r="5.5" :fill="COLORI.scheda"
                stroke-width="2.5" :stroke="v.accesa ? COLORI.rame : COLORI.spento" />

        <!-- i capitoli: un chip ciascuno -->
        <g v-for="c in chips" :key="c.cap" :transform="`translate(${c.x},${c.y})`" :data-capitolo="c.cap"
           :data-acceso="c.acceso ? '' : null" class="cst-chip">
          <path :d="c.piedini" :fill="c.acceso ? '#c9d1cc' : '#3a443f'" />
          <rect :x="-c.mezzo" y="-32" :width="2 * c.mezzo" height="64" rx="5" :fill="COLORI.chip"
                :stroke="c.acceso ? '#4a5e53' : '#27322d'" stroke-width="1.5" />
          <circle :cx="-c.mezzo + 10" cy="-23" r="3" fill="none" stroke="#3c4d44" stroke-width="1.5" />
          <text :x="-c.mezzo + 30" y="9" class="cst-chip-icona" :opacity="c.acceso ? 1 : 0.35">{{ c.icona }}</text>
          <text :x="-c.mezzo + 52" y="-2" class="cst-chip-nome" :fill="c.acceso ? '#eef3ef' : '#6a7a72'">{{ c.nome }}</text>
          <text :x="-c.mezzo + 52" y="15" class="cst-chip-conto" :fill="c.acceso ? '#a6c4b3' : '#566860'">{{ c.vinti }} di {{ c.quanti }} livelli</text>
          <circle cx="0" cy="40" r="4.5" :fill="COLORI.scheda" stroke-width="2.5" :stroke="c.acceso ? COLORI.rame : COLORI.spento" />
          <circle cx="0" cy="-40" r="4.5" :fill="COLORI.scheda" stroke-width="2.5" :stroke="c.acceso ? COLORI.rame : COLORI.spento" />
        </g>

        <!-- il cantiere libero: un connettore a pettine in fondo -->
        <g :transform="`translate(${scheda.connettore.x},${scheda.connettore.y})`" class="cst-connettore">
          <rect x="-80" y="-23" width="160" height="46" rx="5" fill="#0a0d0b" stroke="#2b3832" stroke-width="1.5" />
          <rect v-for="q in 11" :key="q" :x="-60 + (q - 1) * 12 - 2.5" y="-17" width="5" height="12" rx="1"
                :fill="libero.aperto ? '#d9a24a' : '#6b5a33'" />
          <text x="0" y="14" class="cst-connettore-nome" :fill="libero.aperto ? '#e8efe9' : '#7fa08f'">
            {{ libero.aperto ? libero.icona : '🔒' }} {{ libero.nome }}
          </text>
        </g>

        <!-- i livelli: un led ciascuno -->
        <g v-for="n in leds" :key="n.indice" :transform="`translate(${n.x},${n.y})`"
           class="cst-led" :class="['cst-led-' + n.stato, { 'cst-guizzo': n.guizzo }]">
          <circle class="cst-alone" :r="ALONE" :fill="COLORI.led" />
          <circle :r="R_LED" :fill="COLORI.scheda" stroke-width="3" :stroke="n.stato === 'spento' ? COLORI.spento : COLORI.rame" />
          <circle class="cst-led-corpo" r="10" stroke-width="2" />
          <text y="4" class="cst-led-numero">{{ n.indice + 1 }}</text>
          <!-- lasciato a metà: una matita sul bordo, dalla parte opposta al robot -->
          <g v-if="n.aMeta" :transform="`translate(${-n.lato * 16},-16) scale(1.2)`">
            <circle r="7.5" fill="#f6f2e4" stroke="#1c2420" stroke-width="1.2" />
            <path d="M-3.5 3.5l1-3 4.2-4.2 2 2-4.2 4.2z" fill="#e8a24f" stroke="#1c2420" stroke-width="1" stroke-linejoin="round" />
          </g>
        </g>

        <circle v-if="scintilla" :cx="scintilla.x" :cy="scintilla.y" r="9" :fill="COLORI.ledChiaro" opacity=".35" />
        <circle v-if="scintilla" :cx="scintilla.x" :cy="scintilla.y" r="4.5" :fill="COLORI.ledChiaro" />

        <g data-robot :data-al="posato" :data-in-viaggio="viaggio ? '1' : '0'" :data-visibile="robot.visibile ? '1' : '0'"
           :transform="`translate(${robot.x},${robot.y})`" :opacity="robot.visibile ? 1 : 0">
          <Robot :fermo="!!viaggio" />
        </g>
      </svg>

      <!-- i tasti, sopra il disegno -->
      <button v-for="n in leds" :key="'b' + n.indice" type="button" class="cst-tasto-led"
              :style="{ left: (n.x - 24) + 'px', top: (n.y - 24) + 'px' }"
              :data-livello="n.indice" :data-stato="n.stato" :data-a-meta="n.aMeta ? '' : null"
              :aria-label="`livello ${n.indice + 1}, ${n.nome}${n.stato === 'spento' ? ', chiuso' : n.stato === 'vinto' ? ', fatto' : ''}`"
              @click.stop="tocca(n.indice)"></button>
      <button type="button" class="cst-tasto-libero" data-libero :data-stato="libero.aperto ? 'aperto' : 'chiuso'"
              :style="{ left: (scheda.connettore.x - 86) + 'px', top: (scheda.connettore.y - 28) + 'px' }"
              :aria-label="libero.nome + (libero.aperto ? '' : ', chiuso')" @click.stop="tocca('libero')"></button>

      <Fumetto v-if="fumetto" :key="String(aperto)" :x="fumetto.x" :y="fumetto.y" :raggio="fumetto.raggio"
               :limite="scheda.W" :largo="230" :scorre="scorre"
               :tenue="fumetto.libero ? !libero.aperto : fumetto.l.stato === 'spento'"
               :data-fumetto-per="aperto">
        <template v-if="fumetto.libero">
          <b class="cst-fu-titolo">{{ libero.aperto ? libero.icona : '🔒' }} {{ libero.nome }}</b>
          <span class="cst-fu-riga">{{ libero.dice }}</span>
          <button v-if="libero.aperto" type="button" class="cst-fu-via" data-azione="costruisci" @click="entra">▶ costruisci</button>
        </template>
        <template v-else-if="fumetto.l.stato === 'spento'">
          <b class="cst-fu-titolo" data-serve>🔒 {{ fumetto.l.perEta ? 'per ora è chiuso' : `prima il livello ${prossimo}` }}</b>
          <span class="cst-fu-riga">Il {{ fumetto.l.indice + 1 }} è «{{ fumetto.l.nome }}»</span>
        </template>
        <template v-else>
          <b class="cst-fu-titolo">{{ fumetto.l.indice + 1 }} · {{ fumetto.l.nome }}</b>
          <span class="cst-fu-riga">Impari: {{ fumetto.l.impara }}</span>
          <span class="cst-fu-stelle" data-stelle>{{ stelline(fumetto.l.stelle) }}</span>
          <span v-if="fumetto.l.aMeta" class="cst-fu-riga cst-fu-meta">✎ lasciato a metà: il programma ti aspetta</span>
          <button type="button" class="cst-fu-via" data-azione="costruisci" @click="costruisci(fumetto.l.indice)">▶ costruisci</button>
        </template>
      </Fumetto>

      <!-- durante il viaggio un tocco qualunque lo chiude: il robot arriva subito -->
      <div v-if="viaggio" class="cst-in-viaggio" data-viaggio @click.stop="viaggio.chiudi()"></div>
    </div>
  </div>
</template>

<style scoped>
.cst-mappa { flex:1; min-height:0; overflow-y:auto; overflow-x:hidden; overscroll-behavior:contain; background:#0d3b2c }
.cst-tavola { position:relative; margin:0 auto }
.cst-svg { position:absolute; left:0; top:0; display:block }
.cst-serigrafia { font-size:11px; fill:#3a7d63; text-anchor:middle }
.cst-chip-icona { font-size:26px; text-anchor:middle; font-family:system-ui, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif }
.cst-chip-nome { font-size:13px; font-weight:600 }
.cst-chip-conto { font-size:11px }
.cst-connettore-nome { font-size:12px; font-weight:600; text-anchor:middle }

.cst-led-numero { font-size:11px; font-weight:600; text-anchor:middle }
.cst-alone { opacity:0 }
.cst-led-vinto .cst-alone { opacity:.3 }
.cst-led-adesso .cst-alone { opacity:.5; transform-box:fill-box; transform-origin:center; animation:cst-pulsa 1.5s ease-in-out infinite }
@keyframes cst-pulsa { 0%, 100% { transform:scale(.75); opacity:.65 } 50% { transform:scale(1.3); opacity:.2 } }
.cst-led-corpo { fill:#17332a; stroke:#3d6a58 }
.cst-led-numero { fill:#7aa391 }
.cst-led-vinto .cst-led-corpo { fill:#ffc857; stroke:none }
.cst-led-adesso .cst-led-corpo { fill:#fff0b3; stroke:none }
.cst-led-vinto .cst-led-numero, .cst-led-adesso .cst-led-numero { fill:#4a3200 }
.cst-led-aperto .cst-led-corpo { fill:#2a2412; stroke:#e8a24f }
.cst-led-aperto .cst-led-numero { fill:#ffd9a3 }
.cst-guizzo:not(.cst-led-spento) .cst-led-corpo { transform-box:fill-box; transform-origin:center; animation:cst-guizzo .5s ease-out }
@keyframes cst-guizzo { from { transform:scale(1.7) } }

.cst-tasto-led { position:absolute; width:48px; height:48px; padding:0; border:0; border-radius:50%;
                 background:transparent; box-shadow:none }
.cst-tasto-libero { position:absolute; width:172px; height:56px; padding:0; border:0; border-radius:8px;
                    background:transparent; box-shadow:none }
.cst-in-viaggio { position:absolute; inset:0; z-index:4 }

.cst-fu-titolo { display:block; margin:0 0 3px; font-size:14px; font-weight:600 }
.cst-fu-riga { display:block; font-size:12.5px; color:#4d5a53 }
.cst-fu-meta { margin-top:4px; color:#8a5a12; font-weight:600 }
.cst-fu-stelle { display:block; margin:4px 0 2px; font-size:15px; letter-spacing:2px }
.cst-fu-via { display:block; width:100%; margin-top:8px; border:0; border-radius:10px; background:#2f6fed;
              color:#fff !important; font-size:13.5px; font-weight:600; padding:9px 10px; box-shadow:none }
.cst-fu-via:active { transform:translateY(1px) }
@media (prefers-reduced-motion: reduce) {
  .cst-led-adesso .cst-alone, .cst-guizzo .cst-led-corpo { animation:none }
}
</style>
