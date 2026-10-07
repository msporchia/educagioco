<script>
// dove il segnalino si è posato l'ultima volta, per bambino: dura la sessione, non va nel profilo
let ultimo = null      // { chi, al, dove, verso }: `al` e `dove` sono id (l'indice della tappa, 'senza-fine', 'senza-fine-cane' o una tana)
</script>

<script setup>
/* La mappa della campagna: isole una sotto l'altra. La strada maestra è
   del coniglio, i rami del cane partono da una tana; il segnalino salta
   fino alla casella toccata (e nelle tane cambia animale), e il fumetto
   dice cos'è subito, senza aspettarlo. Il racconto di ogni posto sta nell'`aria-label`, per il
   grande che legge. Riceve lo stato già deciso di ogni tappa.
   Vedi docs/passo-passo/mappa.md. */
import { ref, shallowRef, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { disponiIsole, tratto, viaggio, arco, decori, LARGO_MAX, ANIMALE, SENTIERO_CANE } from '../scena/isole.js'
import { STRADE } from '../motore/strade.js'
import Coniglio from './Coniglio.vue'
import Cane from './Cane.vue'

const props = defineProps({
  // per indice: { indice, nome, icona, racconto, stelle, stato: fatta|ora|aperta|chiusa, aMeta, serve, scalino: { icona, nome } }
  voci: { type: Array, required: true },
  // i due sentieri senza fine: { coniglio, cane }, ognuno { aperto, record, serve }
  sentieri: { type: Object, required: true },
  dove: { type: [Number, String], required: true },   // la casella del segnalino: la tappa di adesso, o un sentiero
  chi: { type: String, default: '' },
})
const emit = defineEmits(['gioca', 'senza-fine'])

const scorre = ref(null)
const tavola = ref(null)
const segnalino = ref(null)
const corpo = ref(null)
const ombra = ref(null)
const fumetto = ref(null)
const W = ref(0)
const aperto = ref(null)          // l'id della casella col fumetto
const posato = ref(null)          // l'id del nodo dove sta il segnalino
const animale = ref('coniglio')
const viaggiando = shallowRef(null)
const mira = ref(null)            // la casella dove sta andando il segnalino
let verso = 1                     // guarda a destra (1) o a sinistra (-1)
let occhio = null

/* ---------- la mappa ---------- */
const quadro = computed(() => (W.value ? disponiIsole(W.value, STRADE) : null))
const cose = computed(() => (quadro.value ? decori(quadro.value) : []))
const nodoDi = id => (quadro.value ? quadro.value.nodi.find(n => n.id === id) : null)

// i due sentieri: quello del coniglio in fondo alla strada maestra, quello del cane in fondo al pascolo
const RACCONTO = {
  coniglio: 'Prati, laghi, fiumi e posti con lo zaino: nuovi uno dopo l\'altro, fatti con quello che sai.',
  cane: 'Pascoli con tre, quattro, cinque pecore, e le stalle con lo zaino: nuovi uno dopo l\'altro.',
}
const sentieroDi = id => {
  const strada = id === SENTIERO_CANE ? 'cane' : 'coniglio'
  const f = props.sentieri[strada] || {}
  return {
    strada, nome: strada === 'cane' ? 'Il sentiero del cane' : 'Il sentiero del coniglio',
    stato: !f.aperto ? 'chiusa' : props.dove === id ? 'ora' : 'aperta',
    racconto: RACCONTO[strada], serve: f.serve || '', record: f.record || '',
  }
}
// le caselle, con quello che si sa di ognuna
const caselle = computed(() => (quadro.value ? quadro.value.nodi.filter(n => n.tipo !== 'tana').map(n => ({
  ...n, ...(n.tipo === 'sentiero' ? sentieroDi(n.id) : props.voci[n.id]),
})) : []))
const vocePer = id => caselle.value.find(c => c.id === id)

// un'isola è velata finché nessuna sua casella è aperta: non ci si è ancora arrivati
const isole = computed(() => (quadro.value ? quadro.value.isole.map(s => ({
  ...s, velata: !caselle.value.some(c => c.isola === s.k && c.stato !== 'chiusa'),
  scalinoDati: s.tappe.length ? props.voci[s.tappe[0]].scalino : null,
})) : []))
const velata = k => !!(isole.value[k] && isole.value[k].velata)
// le tane: aperte se l'isola del cane è raggiunta
const tane = computed(() => (quadro.value ? quadro.value.nodi.filter(n => n.tipo === 'tana').map(n => {
  const ramo = isole.value.find(s => s.chiave === n.ramo)
  return { ...n, aperta: !!ramo && !ramo.velata }
}) : []))

// la strada maestra: sulle isole è terra, fra un'isola e l'altra un ponte
const maestra = computed(() => (quadro.value ? tratto(quadro.value.strade[0].punti) : ''))
const altre = computed(() => (quadro.value ? quadro.value.strade.slice(1).map(s => ({ ...s, d: tratto(s.punti) })) : []))
const forma = s => (s.tondo ? `M${s.x + s.w / 2} ${s.y}a${s.w / 2} ${s.h / 2} 0 1 0 0.01 0z`
  : `M${s.x + 30} ${s.y}h${s.w - 60}a30 30 0 0 1 30 30v${s.h - 60}a30 30 0 0 1 -30 30h${-(s.w - 60)}a30 30 0 0 1 -30 -30v${-(s.h - 60)}a30 30 0 0 1 30 -30z`)

// il mare: due onde ogni tanto, dove non c'è un'isola
const onde = computed(() => {
  const q = quadro.value
  if (!q) return []
  const out = []
  for (let y = 40, k = 0; y < q.H - 20; y += 46, k++) {
    const x = 20 + ((k * 137) % Math.max(1, q.W - 60))
    const dentro = q.isole.some(s => x > s.x - 26 && x < s.x + s.w + 26 && y > s.y - 14 && y < s.y + s.h + 14)
    if (!dentro) out.push({ x, y })
  }
  return out
})

function misura() {
  if (scorre.value) W.value = Math.min(LARGO_MAX, Math.floor(scorre.value.clientWidth))
}

/* ---------- il segnalino ---------- */
function metti(p, terra, { sx = 1, sy = 1, alfa = 1 } = {}) {
  if (segnalino.value) {
    segnalino.value.style.transform =
      `translate(${Math.round(p.x - ANIMALE.largo / 2)}px, ${Math.round(p.y - ANIMALE.alto)}px)`
    segnalino.value.style.opacity = alfa.toFixed(2)
  }
  if (corpo.value) corpo.value.style.transform = `scale(${(verso * sx).toFixed(3)}, ${sy.toFixed(3)})`
  // l'ombra resta per terra, e si stringe quando lui è in alto
  if (ombra.value) {
    const su = Math.max(0, terra.y - p.y)
    ombra.value.style.transform = `translate(${Math.round(terra.x - 14)}px, ${Math.round(terra.y - 3)}px) scale(${Math.max(0.45, 1 - su / 120).toFixed(2)})`
    ombra.value.style.opacity = (alfa * Math.max(0.35, 1 - su / 160)).toFixed(2)
  }
}
function posa() {
  const n = nodoDi(posato.value)
  if (!n) return
  animale.value = n.animale
  metti(n.piede, n.piede)
}
const ricorda = () => { ultimo = { chi: props.chi, al: posato.value, dove: props.dove, verso } }

// la mappa non comincia in cima allo scorrimento
const inCima = () => (tavola.value ? tavola.value.offsetTop : 0)
function scorriA(y) {
  if (scorre.value) scorre.value.scrollTop = Math.max(0, inCima() + y - scorre.value.clientHeight * 0.45)
}

/* il viaggio: salti da casella a casella (un balzo solo da lontano), e
   nelle tane l'animale entra e dall'altra parte esce l'altro. Il fumetto
   è già aperto sulla meta: un altro tocco cambia meta, ma solo a salto
   finito (`viaggiando.vai`), da dove il segnalino è atterrato. */
function vai(da, a, { attesa = 0 } = {}) {
  let passi = viaggio(quadro.value, da, a)
  if (!passi.length) { posato.value = a; posa(); ricorda(); return }
  let i = 0, t = -attesa, prima = null, id = 0, finito = false, cambia = null
  mira.value = a
  const segui = y => {
    const s = scorre.value
    if (!s) return
    const su = inCima() + y - s.scrollTop, h = s.clientHeight
    // non rincorre chi è lontano fuori dallo schermo: il bambino guarda il fumetto
    if (su < -40 || su > h + 40) return
    if (su < h * 0.22 || su > h * 0.72) s.scrollTop += (su - h * 0.45) * 0.12
  }
  const arriva = () => {
    if (finito) return
    finito = true
    cancelAnimationFrame(id)
    posato.value = mira.value
    mira.value = null
    viaggiando.value = null
    posa(); ricorda()
    if (aperto.value !== null) mostraFumetto()
  }
  // da fermo (prima di partire) si cambia subito, se no appena atterrato
  const strada = nuova => { passi = viaggio(quadro.value, posato.value, nuova); i = 0; t = Math.max(0, t); mira.value = nuova }
  const fotogramma = ora => {
    if (finito) return
    const nascosto = typeof document !== 'undefined' && document.hidden
    if (prima !== null && !nascosto) t += Math.min(0.05, Math.max(0, (ora - prima) / 1000))
    prima = ora
    while (i < passi.length && t >= passi[i].dur) {
      t -= passi[i].dur; posato.value = passi[i].al; i++
      if (cambia) { strada(cambia); cambia = null }
    }
    if (cambia && i === 0 && t < 0) { strada(cambia); cambia = null }
    if (i >= passi.length) return arriva()
    if (t >= 0) {
      const p = passi[i]
      const q = t / p.dur
      animale.value = p.animale
      if (p.che === 'salto') {
        if (p.verso) verso = p.verso
        const s = arco(p.da, p.a, q, p.alto)
        metti(s, { x: s.x, y: p.da.y + (p.a.y - p.da.y) * q }, { sx: s.sx, sy: s.sy })
        segui(s.y)
      } else if (p.che === 'entra') {
        // si rimpicciolisce nel buco
        metti({ x: p.dove.x, y: p.dove.y + q * 10 }, p.dove, { sx: 1 - q * 0.7, sy: 1 - q * 0.8, alfa: 1 - q })
      } else {
        // sbuca: cresce dal buco, con un saltello
        const su = Math.sin(Math.PI * q) * 10
        metti({ x: p.dove.x, y: p.dove.y + (1 - q) * 10 - su }, p.dove,
              { sx: 0.3 + 0.7 * q, sy: 0.2 + 0.8 * q, alfa: Math.min(1, q * 1.6) })
        segui(p.dove.y)
      }
    }
    id = requestAnimationFrame(fotogramma)
  }
  id = requestAnimationFrame(fotogramma)
  viaggiando.value = {
    chiudi: arriva,
    ferma() { finito = true; cancelAnimationFrame(id) },
    vai(nuova) { cambia = nuova },
  }
}

let pronto = false
function prepara() {
  if (pronto || !quadro.value) return
  pronto = true
  const a = nodoDi(props.dove) ? props.dove : quadro.value.nodi[0].id
  const prima = ultimo && ultimo.chi === props.chi ? ultimo : null
  const da = prima && nodoDi(prima.al) ? prima.al : null
  if (prima && prima.verso) verso = prima.verso
  else verso = (nodoDi(a) || {}).verso || 1
  if (da !== null && prima.dove !== props.dove && da !== a) {
    // la tappa di adesso è cambiata: il segnalino parte da dov'era e ci va
    posato.value = da
    posa()
    const n0 = nodoDi(da), n1 = nodoDi(a)
    scorriA(Math.abs(n1.y - n0.y) < scorre.value.clientHeight * 0.5 ? (n0.y + n1.y) / 2 : n0.y)
    vai(da, a, { attesa: 0.45 })
  } else {
    // si ritrova dove lo si era lasciato, se lì si può ancora giocare
    const qui = da !== null && (vocePer(da) || {}).stato !== 'chiusa' && nodoDi(da).tipo !== 'tana' ? da : a
    posato.value = qui
    posa(); ricorda()
    scorriA(nodoDi(qui).y)
  }
}

watch(quadro, async () => {
  await nextTick()
  if (!pronto) return prepara()
  if (viaggiando.value) viaggiando.value.chiudi()
  posa()
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
  // uscendo a metà viaggio si conta come arrivato
  if (viaggiando.value) { const a = mira.value; viaggiando.value.ferma(); posato.value = a; ricorda() }
})

/* ---------- il dito: un tocco apre, una strisciata scorre e basta ---------- */
const SCARTO_DITO = 16            // docs/core/il-dito.md
let premuto = null
function giu(e) { premuto = { x: e.clientX, y: e.clientY, su: scorre.value.scrollTop, via: 0 } }
function muove(e) {
  if (premuto) premuto.via = Math.max(premuto.via, Math.hypot(e.clientX - premuto.x, e.clientY - premuto.y))
}
const strisciato = () => !!premuto &&
  (premuto.via > SCARTO_DITO || Math.abs(scorre.value.scrollTop - premuto.su) > SCARTO_DITO)

/* ---------- il fumetto ---------- */
const FUMETTO = 276
/* Il fumetto compare subito sopra la casella toccata, e intanto il
   segnalino ci va; su una chiusa non va e dice cosa manca. Un tocco durante
   il viaggio cambia fumetto e meta. */
function tocca(id) {
  if (strisciato()) return
  if (aperto.value === id) { aperto.value = null; return }
  const c = vocePer(id)
  aperto.value = id
  mostraFumetto()
  if (!c || c.stato === 'chiusa') return
  if (viaggiando.value) { if (mira.value !== id) viaggiando.value.vai(id) }
  else if (id !== posato.value) vai(posato.value, id)
}
async function mostraFumetto() {
  await nextTick()
  // il fumetto si vede tutto: se sborda, si scorre quanto basta
  const f = fumetto.value, s = scorre.value
  if (!f || !s) return
  const rf = f.getBoundingClientRect(), rs = s.getBoundingClientRect()
  if (rf.top < rs.top + 8) s.scrollTop -= rs.top + 8 - rf.top
  else if (rf.bottom > rs.bottom - 12) s.scrollTop += rf.bottom - rs.bottom + 12
}
function fuori() {
  if (strisciato()) return
  aperto.value = null
}
const casellaAperta = computed(() => (aperto.value === null ? null : vocePer(aperto.value)))
const posto = computed(() => {
  const n = casellaAperta.value
  if (!n) return null
  const W0 = quadro.value.W
  const largo = Math.min(FUMETTO, W0 - 16)
  const x = Math.max(largo / 2 + 8, Math.min(W0 - largo / 2 - 8, n.x))
  // sopra la casella, e sopra l'animale se ci è seduto; in cima non c'è posto e va sotto
  const seduto = aperto.value === (viaggiando.value ? mira.value : posato.value)
  const sopra = n.y - n.lato / 2 - (seduto ? ANIMALE.alto - ANIMALE.piede + 4 : 0) - 10
  const sotto = sopra < 230
  return { x, largo, sotto, y: sotto ? n.y + n.lato / 2 + 12 : sopra, coda: n.x - x }
})
const intestazione = n => (n.tipo === 'sentiero' ? `In fondo alla strada ${n.strada === 'cane' ? 'del cane' : 'del coniglio'}`
  : `${n.scalino.icona} ${n.scalino.nome}${n.animale === 'cane' ? ' · col cane' : ''}`)
function gioca(n) {
  aperto.value = null
  if (n.tipo === 'sentiero') emit('senza-fine', n.strada)
  else emit('gioca', n.id)
}
const STELLA = 'M12 2.6l2.85 5.95 6.55.85-4.8 4.55 1.2 6.5L12 17.3l-5.8 3.15 1.2-6.5-4.8-4.55 6.55-.85z'
const etichetta = c => (c.tipo === 'sentiero'
  ? `${c.nome}: ${c.stato === 'chiusa' ? c.serve : c.racconto}`
  : `${c.id + 1}. ${c.nome}${c.stato === 'chiusa' ? ' (chiusa)' : ''}: ${c.racconto}`)
</script>

<template>
  <div class="pp-mappa" data-mappa>
    <!-- in cima e ferma, la partita lasciata a metà (docs/passo-passo/sosta.md) -->
    <div class="pp-mappa-cima"><slot /></div>

    <div ref="scorre" class="pp-scorre" data-isole @pointerdown="giu" @pointermove="muove" @click="fuori">
      <div v-if="quadro" ref="tavola" class="pp-tavola" :style="{ width: quadro.W + 'px', height: quadro.H + 'px' }">
        <svg class="pp-fondo" :width="quadro.W" :height="quadro.H" :viewBox="`0 0 ${quadro.W} ${quadro.H}`" aria-hidden="true">
          <defs>
            <clipPath v-for="s in isole" :id="`pp-dentro-${s.k}`" :key="'c' + s.k"><path :d="forma(s)" /></clipPath>
          </defs>
          <path v-for="(o, k) in onde" :key="'o' + k" class="pp-onda"
                :d="`M${o.x} ${o.y}q7 -6 14 0t14 0`" />

          <!-- i ponti: la strada maestra fuori dalle isole -->
          <path class="pp-ponte" :d="maestra" />
          <path class="pp-ponte-assi" :d="maestra" />
          <path v-for="(s, k) in altre.filter(s => s.tipo === 'tunnel')" :key="'t' + k" class="pp-tunnel" :d="s.d" />

          <g v-for="s in isole" :key="s.chiave" :data-isola="s.chiave" :data-animale="s.animale"
             :data-velata="s.velata ? '1' : '0'" :class="['pp-isola', 'pp-' + s.vestito, { 'pp-isola-velata': s.velata }]">
            <path class="pp-riva" :d="forma(s)" />
            <path class="pp-terra" :d="forma(s)" />
            <g :clip-path="`url(#pp-dentro-${s.k})`">
              <!-- l'orto ha i solchi, il ghiaccio le crepe, il pascolo lo steccato -->
              <template v-if="s.vestito === 'orto'">
                <rect v-for="r in Math.floor(s.h / 22)" :key="r" class="pp-solco" :x="s.x" :y="s.y + r * 22 - 6"
                      :width="s.w" height="7" />
              </template>
              <template v-else-if="s.vestito === 'ghiaccio'">
                <path v-for="r in Math.floor(s.h / 70)" :key="r" class="pp-crepa"
                      :d="`M${s.x + 20 + (r * 53) % (s.w - 60)} ${s.y + r * 70 - 30}l12 9l-5 11l14 7`" />
              </template>
              <template v-else-if="s.vestito === 'pascolo'">
                <path class="pp-steccato" :d="`M${s.x} ${s.y + s.h - 14}h${s.w}`" />
                <rect v-for="p in Math.floor(s.w / 26)" :key="p" class="pp-paletto"
                      :x="s.x + p * 26 - 2" :y="s.y + s.h - 22" width="4" height="16" rx="1.5" />
              </template>
              <template v-for="(c, k) in cose.filter(c => c.isola === s.k)" :key="k">
                <g v-if="c.che === 'fiore'" :transform="`translate(${c.x} ${c.y})`">
                  <circle v-for="a in 5" :key="a" class="pp-petalo" :cx="Math.cos(a * 1.2566) * 3.4" :cy="Math.sin(a * 1.2566) * 3.4" r="2.6" />
                  <circle class="pp-bottone" r="2" />
                </g>
                <path v-else-if="c.che === 'ciuffo'" class="pp-ciuffo" :d="`M${c.x - 5} ${c.y + 3}q2 -8 4 -9q-1 6 1 9q1 -9 5 -11q-2 7 0 11z`" />
                <path v-else-if="c.che === 'germoglio'" class="pp-germoglio" :d="`M${c.x} ${c.y + 4}v-6q-6 -1 -7 -6q6 0 7 6q1 -7 7 -7q-1 6 -7 7`" />
                <path v-else-if="c.che === 'canna'" class="pp-canna" :d="`M${c.x} ${c.y + 5}v-14M${c.x + 4} ${c.y + 5}v-10`" />
                <path v-else-if="c.che === 'cristallo'" class="pp-cristallo" :d="`M${c.x - 5} ${c.y}h10M${c.x} ${c.y - 5}v10M${c.x - 3.5} ${c.y - 3.5}l7 7M${c.x + 3.5} ${c.y - 3.5}l-7 7`" />
                <ellipse v-else-if="c.che === 'neve'" class="pp-neve" :cx="c.x" :cy="c.y" rx="9" ry="4" />
                <g v-else-if="c.che === 'pozza'">
                  <ellipse class="pp-pozza-riva" :cx="c.x" :cy="c.y" rx="34" ry="15" />
                  <ellipse class="pp-pozza" :cx="c.x" :cy="c.y" rx="29" ry="11" />
                  <path class="pp-pozza-luce" :d="`M${c.x - 14} ${c.y - 3}h9M${c.x + 6} ${c.y + 3}h7`" />
                </g>
              </template>
            </g>
          </g>

          <!-- le strade sulle isole: la maestra, i rami alle tane, le strade del cane -->
          <g class="pp-strade">
            <g v-for="s in isole" :key="'s' + s.k" :clip-path="`url(#pp-dentro-${s.k})`">
              <path class="pp-strada" :d="maestra" />
            </g>
            <path v-for="(s, k) in altre.filter(s => s.tipo !== 'tunnel')" :key="'a' + k" class="pp-strada" :d="s.d" />
          </g>

          <!-- le tane: un monticello col buco; chiusa, col sasso davanti -->
          <g v-for="t in tane" :key="t.id" class="pp-tana" :data-tana="t.id" :data-aperta="t.aperta ? '1' : '0'">
            <ellipse class="pp-tana-monte" :cx="t.x" :cy="t.y + 3" rx="21" ry="12" />
            <path class="pp-tana-buco" :d="`M${t.x - 11} ${t.y + 7}a11 11 0 0 1 22 0z`" />
            <circle v-if="!t.aperta" class="pp-tana-sasso" :cx="t.x" :cy="t.y + 2" r="9.5" />
          </g>

          <!-- il velo sulle isole non ancora raggiunte -->
          <path v-for="s in isole.filter(s => s.velata)" :key="'v' + s.k" class="pp-nebbia" :d="forma(s)" />
        </svg>

        <!-- i cartelli delle isole: la carta dello scalino (il pascolo, il cane pastore); gli isolotti del cane, la sua carta -->
        <template v-for="s in isole" :key="'n' + s.k">
          <div v-if="s.cartello && s.scalinoDati" class="pp-insegna" :class="{ 'pp-insegna-velata': s.velata }"
               :data-scalino="s.scalino" :data-insegna="s.chiave"
               :style="{ [s.cartello.lato > 0 ? 'right' : 'left']: (s.cartello.lato > 0 ? quadro.W - s.x - s.w + 14 : s.x + 14) + 'px',
                         top: s.cartello.y + 'px', maxWidth: (s.w - 28) + 'px' }">
            <span class="pp-insegna-icona pp-em">{{ s.scalinoDati.icona }}</span>
            <b>{{ s.scalinoDati.nome }}</b>
          </div>
          <div v-else-if="s.isolotto && s.scalinoDati" class="pp-distintivo pp-em" :class="{ 'pp-insegna-velata': s.velata }"
               :data-scalino="s.scalino" :data-insegna="s.chiave"
               :style="{ left: (s.x + (quadro.nodi.find(n => n.isola === s.k && n.tipo === 'tana').x < s.x + s.w / 2 ? s.w - 34 : 8)) + 'px', top: (s.y + 8) + 'px' }">
            {{ s.scalinoDati.icona }}
          </div>
        </template>

        <!-- i bivi: il cartello a due frecce, il coniglio da una parte e il cane dall'altra -->
        <div v-for="b in quadro.bivi" :key="'b' + b.ramo" class="pp-bivio" data-bivio :data-ramo="b.ramo"
             :style="{ left: b.x + 'px', top: b.y + 'px' }">
          <span class="pp-bivio-asse" data-verso="coniglio">
            <span class="pp-em">🐇</span>
            <svg viewBox="0 0 12 12" :style="{ transform: `rotate(${b.coniglio}deg)` }"><path d="M2 6h7M6 2.5L9.5 6L6 9.5" /></svg>
          </span>
          <span class="pp-bivio-asse" data-verso="cane">
            <span class="pp-em">🐕</span>
            <svg viewBox="0 0 12 12" :style="{ transform: `rotate(${b.cane}deg)` }"><path d="M2 6h7M6 2.5L9.5 6L6 9.5" /></svg>
          </span>
        </div>

        <template v-for="c in caselle" :key="c.id">
          <button type="button" class="pp-casella" :class="['pp-' + c.stato, { 'pp-velata': velata(c.isola), 'pp-casella-sentiero': c.tipo === 'sentiero' }]"
                  :style="{ left: (c.x - c.lato / 2) + 'px', top: (c.y - c.lato / 2) + 'px',
                            width: c.lato + 'px', height: c.lato + 'px' }"
                  :data-tappa="c.id" :data-stato="c.stato"
                  :data-strada="c.animale"
                  :aria-label="etichetta(c)"
                  @click.stop="tocca(c.id)">
            <span v-if="c.aMeta && c.stato !== 'chiusa'" class="pp-a-meta pp-em" data-a-meta>✏️</span>
            <svg v-if="c.stato === 'chiusa'" class="pp-lucchetto" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" fill="none" stroke="currentColor" stroke-width="2.6" />
              <rect x="4.5" y="10" width="15" height="11" rx="3" fill="currentColor" />
            </svg>
            <svg v-else-if="c.tipo === 'sentiero'" class="pp-infinito" viewBox="0 0 48 24" aria-hidden="true">
              <path d="M24 12c-4-5-7.5-7.5-11-7.5a7.5 7.5 0 0 0 0 15c3.5 0 7-2.5 11-7.5s7.5-7.5 11-7.5a7.5 7.5 0 0 1 0 15c-3.5 0-7-2.5-11-7.5z" />
            </svg>
            <template v-else>
              <span class="pp-casella-faccia pp-em">{{ c.icona }}</span>
              <span class="pp-casella-stelle">
                <svg v-for="s in 4" :key="s" viewBox="0 0 24 24" :class="{ 'pp-presa': s <= c.stelle }"><path :d="STELLA" /></svg>
              </span>
            </template>
            <!-- di chi è il sentiero, anche da chiuso -->
            <span v-if="c.tipo === 'sentiero'" class="pp-sentiero-di pp-em" :data-sentiero-di="c.strada">{{ c.strada === 'cane' ? '🐕' : '🐇' }}</span>
          </button>
          <span v-if="c.tipo === 'sentiero' && c.etichetta" class="pp-sentiero-nome" :class="[c.etichetta.lato > 0 ? 'pp-a-destra' : 'pp-a-sinistra', 'pp-' + c.stato]"
                :style="{ [c.etichetta.lato > 0 ? 'left' : 'right']: (c.etichetta.lato > 0 ? c.etichetta.x : quadro.W - c.etichetta.x) + 'px',
                          top: c.y + 'px', maxWidth: c.etichetta.largo + 'px' }">
            <b>{{ c.nome }}</b>
            <i v-if="c.stato === 'chiusa'">{{ c.serve }}</i>
            <i v-else-if="c.record" data-record>record: {{ c.record }}</i>
            <i v-else>sentieri nuovi, uno dopo l'altro</i>
          </span>
        </template>

        <!-- il segnalino: il coniglio sulle isole del coniglio, il cane su quelle del cane -->
        <div ref="ombra" class="pp-ombra" aria-hidden="true"></div>
        <div ref="segnalino" class="pp-segnalino" aria-hidden="true" data-segnalino
             :data-animale="animale" :data-al="posato" :data-in-viaggio="viaggiando ? '1' : '0'">
          <div ref="corpo" class="pp-segnalino-corpo">
            <Coniglio v-if="animale === 'coniglio'" />
            <Cane v-else />
          </div>
        </div>

        <div v-if="casellaAperta" ref="fumetto" class="pp-fumetto" :class="{ 'pp-sotto': posto.sotto }" data-fumetto
             :data-fumetto-per="casellaAperta.id"
             :style="{ left: posto.x + 'px', top: posto.y + 'px', width: posto.largo + 'px', '--coda': posto.coda + 'px' }"
             @click.stop>
          <small>{{ intestazione(casellaAperta) }}</small>
          <b>{{ casellaAperta.nome }}</b>
          <span class="pp-fumetto-racconto">{{ casellaAperta.racconto }}</span>
          <template v-if="casellaAperta.stato === 'chiusa'">
            <span class="pp-fumetto-serve" data-serve><span class="pp-em">🔒</span> {{ casellaAperta.serve }}</span>
          </template>
          <template v-else>
            <span v-if="casellaAperta.tipo !== 'sentiero'" class="pp-fumetto-stelle"
                  :aria-label="`${casellaAperta.stelle} stelle su 4`">
              <svg v-for="s in 4" :key="s" viewBox="0 0 24 24" :class="{ 'pp-presa': s <= casellaAperta.stelle }"><path :d="STELLA" /></svg>
            </span>
            <span v-else class="pp-fumetto-record" data-record>{{ casellaAperta.record ? 'record: ' + casellaAperta.record : 'Ancora nessun record' }}</span>
            <button type="button" class="pp-fumetto-gioca" data-azione="parti" @click="gioca(casellaAperta)">
              <svg class="pp-triangolo" viewBox="0 0 10 12" aria-hidden="true"><path d="M1.5 1.2l7.5 4.8-7.5 4.8z" /></svg>
              {{ casellaAperta.aMeta ? 'continua' : 'gioca' }}
            </button>
          </template>
        </div>

      </div>
    </div>
  </div>
</template>
