<script setup>
/* Il mondo dello zaino: le isole delle carte (ripeti, fino a, se, tutto il
   mondo) e le isolette del cane, una sotto l'altra e disegnate in codice
   finché non arriva il loro fondale. La strada maestra è del coniglio e
   parte in cima, dalla tana che torna alla valle (`passa`); i rami del cane
   partono da una tana. Il segnalino salta fino alla casella toccata (e
   nelle tane cambia animale), e il fumetto dice cos'è subito, senza
   aspettarlo. Riceve lo stato già deciso di ogni tappa.
   Vedi docs/passo-passo/mappa.md, «Il mondo dello zaino». */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { disponiIsole, tratto, viaggio, decori, LARGO_MAX, ANIMALE } from '../scena/isole.js'
import { nellaValle } from '../scena/valle.js'
import { STRADE } from '../motore/strade.js'
import { usaSegnalino } from './segnalino.js'
import Casella from './Casella.vue'
import Fumetto from './Fumetto.vue'
import Stendardo from './Stendardo.vue'
import Coniglio from './Coniglio.vue'
import Cane from './Cane.vue'

const props = defineProps({
  voci: { type: Array, required: true },
  partenza: { type: [Number, String], required: true },  // il nodo dove sta il segnalino
  meta: { type: [Number, String], default: null },    // dove va appena aperta la mappa
  entrata: { type: Boolean, default: false },         // arriva dalla valle: sbuca dalla tana in cima
  verso: { type: Number, default: 1 },
})
const emit = defineEmits(['gioca', 'passa', 'posato'])

// solo le isole dello zaino: le altre stanno sul fondale della valle
const STRADE_ZAINO = { ...STRADE, isole: STRADE.isole.filter(s => !nellaValle(s.chiave)) }

const scorre = ref(null)
const tavola = ref(null)
const fumetto = ref(null)
const W = ref(0)
const aperto = ref(null)          // l'id della casella col fumetto

/* ---------- la mappa ---------- */
const quadro = computed(() => (W.value ? disponiIsole(W.value, STRADE_ZAINO, { ingresso: true }) : null))
const cose = computed(() => (quadro.value ? decori(quadro.value) : []))
const nodoDi = id => (quadro.value ? quadro.value.nodi.find(n => n.id === id) : null) || null

// le caselle, con quello che si sa di ognuna
const caselle = computed(() => (quadro.value ? quadro.value.nodi.filter(n => n.tipo !== 'tana')
  .map(n => ({ ...n, ...props.voci[n.id] })) : []))
const vocePer = id => caselle.value.find(c => c.id === id)

// un'isola è velata finché nessuna sua casella è aperta: non ci si è ancora arrivati
const isole = computed(() => (quadro.value ? quadro.value.isole.map(s => ({
  ...s, velata: s.chiave !== 'valle' && !caselle.value.some(c => c.isola === s.k && c.stato !== 'chiusa'),
  scalinoDati: s.tappe.length ? props.voci[s.tappe[0]].scalino : null,
})) : []))
const velata = k => !!(isole.value[k] && isole.value[k].velata)
// le tane: aperte se l'isola del cane è raggiunta; quella che torna alla valle sempre
const tane = computed(() => (quadro.value ? quadro.value.nodi.filter(n => n.tipo === 'tana').map(n => {
  const ramo = isole.value.find(s => s.chiave === n.ramo)
  return { ...n, aperta: n.uscita || (!!ramo && !ramo.velata) }
}) : []))
const uscita = computed(() => nodoDi('tana:valle'))

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
// la mappa non comincia in cima allo scorrimento
const inCima = () => (tavola.value ? tavola.value.offsetTop : 0)
function scorriA(y) {
  if (scorre.value) scorre.value.scrollTop = Math.max(0, inCima() + y - scorre.value.clientHeight * 0.45)
}
const seg = usaSegnalino({
  nodoDi,
  viaggio: (da, a) => viaggio(quadro.value, da, a),
  // non rincorre chi è lontano fuori dallo schermo: il bambino guarda il fumetto
  segui: (x, y) => {
    const s = scorre.value
    if (!s) return
    const su = inCima() + y - s.scrollTop, h = s.clientHeight
    if (su < -40 || su > h + 40) return
    if (su < h * 0.22 || su > h * 0.72) s.scrollTop += (su - h * 0.45) * 0.12
  },
  arrivato: id => {
    emit('posato', { al: id, verso: seg.verso })
    if (aperto.value !== null) mostraFumetto()
  },
})
const { el: segnalino, corpo, ombra, posato, animale, viaggiando } = seg

let pronto = false
function prepara() {
  if (pronto || !quadro.value) return
  pronto = true
  const da = nodoDi(props.partenza) ? props.partenza : 'tana:valle'
  seg.verso = props.verso
  posato.value = da
  seg.posa()
  if (props.entrata) {
    scorriA(nodoDi(da).y)
    // sbuca dalla tana: prima non si vede
    seg.metti(nodoDi(da).piede, nodoDi(da).piede, { alfa: 0 })
    seg.vai(da, { passi: [{ che: 'esce', dove: nodoDi(da).piede, dur: 0.36, animale: 'coniglio', al: da }] })
  } else if (props.meta !== null && nodoDi(props.meta) && props.meta !== da) {
    const n0 = nodoDi(da), n1 = nodoDi(props.meta)
    scorriA(Math.abs(n1.y - n0.y) < scorre.value.clientHeight * 0.5 ? (n0.y + n1.y) / 2 : n0.y)
    seg.vai(props.meta, { attesa: 0.45 })
  } else {
    scorriA(nodoDi(da).y)
    emit('posato', { al: da, verso: seg.verso })
  }
}

watch(quadro, async () => {
  await nextTick()
  if (!pronto) return prepara()
  if (viaggiando.value) viaggiando.value.chiudi()
  seg.posa()
})

let occhio = null
onMounted(() => {
  misura()
  if (typeof ResizeObserver !== 'undefined') {
    occhio = new ResizeObserver(misura)
    occhio.observe(scorre.value)
  }
})
onBeforeUnmount(() => {
  if (occhio) occhio.disconnect()
  // uscendo a metà viaggio si conta come arrivato
  if (viaggiando.value) {
    const a = seg.mira.value
    viaggiando.value.ferma()
    emit('posato', { al: a, verso: seg.verso })
  }
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
  if (viaggiando.value || id !== posato.value) seg.vai(id)
}
// la tana in cima: il coniglio ci entra e torna alla valle
function torna() {
  if (strisciato()) return
  aperto.value = null
  const n = uscita.value
  seg.vai(n.id, { coda: [{ che: 'entra', dove: n.piede, dur: 0.34, animale: 'coniglio', al: n.id }], dopo: () => emit('passa') })
}
async function mostraFumetto() {
  await nextTick()
  // il fumetto si vede tutto: se sborda, si scorre quanto basta
  const f = fumetto.value && fumetto.value.$el, s = scorre.value
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
  const seduto = aperto.value === (viaggiando.value ? seg.mira.value : posato.value)
  const sopra = n.y - n.lato / 2 - (seduto ? ANIMALE.alto - ANIMALE.piede + 4 : 0) - 10
  const sotto = sopra < 230
  return { x, largo, sotto, y: sotto ? n.y + n.lato / 2 + 12 : sopra, coda: n.x - x }
})
function gioca(n) {
  aperto.value = null
  emit('gioca', n.id)
}
</script>

<template>
  <div ref="scorre" class="pp-scorre" data-isole data-mondo="zaino" @pointerdown="giu" @pointermove="muove" @click="fuori">
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
        <g v-for="t in tane" :key="t.id" class="pp-tana" :data-tana="t.uscita ? 'valle' : t.id" :data-aperta="t.aperta ? '1' : '0'">
          <ellipse class="pp-tana-monte" :cx="t.x" :cy="t.y + 3" rx="21" ry="12" />
          <path class="pp-tana-buco" :d="`M${t.x - 11} ${t.y + 7}a11 11 0 0 1 22 0z`" />
          <circle v-if="!t.aperta" class="pp-tana-sasso" :cx="t.x" :cy="t.y + 2" r="9.5" />
        </g>

        <!-- il velo sulle isole non ancora raggiunte -->
        <path v-for="s in isole.filter(s => s.velata)" :key="'v' + s.k" class="pp-nebbia" :d="forma(s)" />
      </svg>

      <!-- i cartelli delle isole: la carta dello scalino; gli isolotti del cane, la sua carta -->
      <template v-for="s in isole" :key="'n' + s.k">
        <div v-if="s.cartello && s.scalinoDati" class="pp-insegna"
             :data-scalino="s.scalino" :data-insegna="s.chiave"
             :style="{ [s.cartello.lato > 0 ? 'right' : 'left']: (s.cartello.lato > 0 ? quadro.W - s.x - s.w + 14 : s.x + 14) + 'px',
                       top: s.cartello.y + 'px' }">
          <Stendardo :nome="s.scalinoDati.nome" :icona="s.scalinoDati.icona" :animale="s.animale" :velato="s.velata" :max="s.cartello.max" />
        </div>
        <div v-else-if="s.isolotto && s.scalinoDati" class="pp-insegna"
             :data-scalino="s.scalino" :data-insegna="s.chiave"
             :style="{ left: (s.x + (quadro.nodi.find(n => n.isola === s.k && n.tipo === 'tana').x < s.x + s.w / 2 ? s.w - 36 : 10)) + 'px', top: (s.y + 8) + 'px' }">
          <Stendardo solo-stemma :icona="s.scalinoDati.icona" :animale="s.animale" :velato="s.velata" />
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

      <!-- la tana in cima: si torna alla valle -->
      <template v-if="uscita">
        <button type="button" class="pp-passaggio pp-passaggio-zaino" data-passaggio="valle"
                :style="{ left: uscita.x + 'px', top: uscita.y + 'px' }"
                aria-label="La tana che torna alla valle dei primi passi" @click.stop="torna"></button>
        <span class="pp-sentiero-nome pp-a-destra" :style="{ left: uscita.etichetta.x + 'px', top: uscita.y + 'px', maxWidth: uscita.etichetta.largo + 'px' }">
          <b>La valle</b>
          <i>torna ai primi passi</i>
        </span>
      </template>

      <Casella v-for="c in caselle" :key="c.id" :c="c" :velata="velata(c.isola)" @tocca="tocca" />

      <!-- il segnalino: il coniglio sulle isole del coniglio, il cane su quelle del cane -->
      <div ref="ombra" class="pp-ombra" aria-hidden="true"></div>
      <div ref="segnalino" class="pp-segnalino" aria-hidden="true" data-segnalino
           :data-animale="animale" :data-al="posato" :data-in-viaggio="viaggiando ? '1' : '0'">
        <div ref="corpo" class="pp-segnalino-corpo">
          <Coniglio v-if="animale === 'coniglio'" />
          <Cane v-else />
        </div>
      </div>

      <Fumetto v-if="casellaAperta && posto" ref="fumetto" :n="casellaAperta" :posto="posto" @gioca="gioca" />
    </div>
  </div>
</template>
