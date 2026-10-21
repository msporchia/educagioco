<script setup>
// Il foglio di una macchina (mulino, pastificio, panificio, caseificio, cucina, gelateria: gli id dei salvataggi sono pasticceria e conserviera),
// come in Hay Day e come nella fattoria di sempre: l'insegna col suo colore, i POSTI della fila (libero, cuoce con la barra e il tempo, aspetta),
// i pronti in una pila da ritirare, e le ricette come CARTE con la faccia del prodotto e il numero di quante se ne possono fare. Una carta si
// TRASCINA su un posto o sulla fila (il fantasma segue il dito, i posti liberi si accendono), o si TOCCA e va in fila da sé. Quelle non ancora
// arrivate stanno velate col lucchetto e il livello. Il conto sta in macchina-pura.js; il motore non cambia: si emette `prepara` con la
// chiave. Riceve una fotografia già pronta. Colori in stile.css (`[data-macchina]`), il resto in stile-macchina.css. Vedi docs/fattoria3d/file.md.
import { computed, ref, watch } from 'vue'
import Faccia from './Faccia.vue'
import { quanteNePuoiFare, ordinaRicette, statoDelPosto, bersaglioSotto, gestoDelDito } from './macchina-pura.js'
import '../stile-macchina.css'

const props = defineProps({
  tipo: { type: String, required: true },
  titolo: { type: String, default: '' },           // «🍝 Pastificio»: l'emoji e il nome
  forno: { type: Array, required: true },          // [{ k, emoji, testo, barra } | null] per ognuno dei posti
  pronti: { type: String, default: '' },
  prontiK: { type: Array, default: () => [] },     // [{ k, n }]: gli stessi pronti, con la faccia
  puoRitirare: { type: Boolean, default: false },
  ricette: { type: Array, required: true },        // [{ k, nome, emoji, ms, liv, sbloccata, puoi, manca, ing: [{ k, emoji, ha, serve }] }]
  dispensa: { type: String, default: '' },
  dispensaK: { type: Array, default: () => [] },   // [{ k, n }]: la dispensa, con la faccia
  anteprima: { type: Function, default: null },    // tipo → Promise<dataURL|null>: l'edificio 3D al posto dell'emoji dell'insegna
  anteprimaPronta: { type: Function, default: null },
  messaggio: { type: String, default: '' },        // perché una ricetta non parte (si vede qui: il fumetto del contadino sta sotto il foglio)
})
const emit = defineEmits(['prepara', 'ritira', 'chiudi'])

const parti = computed(() => { const i = props.titolo.indexOf(' '); return i < 0 ? ['🍳', props.titolo] : [props.titolo.slice(0, i), props.titolo.slice(i + 1)] })
const foto = ref(props.anteprimaPronta ? props.anteprimaPronta(props.tipo) : null)
watch(() => props.tipo, t => {
  foto.value = props.anteprimaPronta ? props.anteprimaPronta(t) : null
  if (!foto.value && props.anteprima) props.anteprima(t).then(u => { if (props.tipo === t) foto.value = u }, () => {})
}, { immediate: true })
const occupati = computed(() => props.forno.filter(Boolean).length)
const carte = computed(() => ordinaRicette(props.ricette).map(r => ({ ...r, n: r.sbloccata ? quanteNePuoiFare(r.ing) : 0 })))
const tempoDi = ms => (ms >= 60000 ? Math.round(ms / 6000) / 10 + ' min' : ms / 1000 + ' s')
const testoPosto = p => (!p ? 'libero' : p.testo === 'in coda' ? 'aspetta' : p.testo)

// ── il dito: tocco = in fila; trascinata = su un posto o sulla fila; su e giù veloce = scorre il foglio (docs/core/il-dito.md) ──
const radice = ref(null), corpo = ref(null), insegna = ref(null), sopra = ref(null)
const presa = ref(null)        // il fantasma in mano: { k, emoji, x, y (px del foglio), bers }
let dito = null
const rett = el => el.getBoundingClientRect()
function bersaglioDi(x, y) {
  const posti = [...radice.value.querySelectorAll('[data-f3="posto"]')].map(rett)
  return bersaglioSotto(x, y, posti, [rett(insegna.value), rett(sopra.value)])
}
function premi(e, r) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  dito = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), r, mouse: e.pointerType === 'mouse', stato: 'attesa', scroll0: corpo.value.scrollTop }
  try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) { /* niente */ }
}
function muovi(e) {
  if (!dito || e.pointerId !== dito.id) return
  const dx = e.clientX - dito.x, dy = e.clientY - dito.y
  if (dito.stato === 'attesa') {
    const c = corpo.value, puoScorrere = c.scrollHeight > c.clientHeight + 2
    let g = gestoDelDito({ dx, dy, ms: performance.now() - dito.t, mouse: dito.mouse, puoScorrere })
    if (g === 'trascina' && !dito.r.sbloccata) g = puoScorrere ? 'scorri' : 'fermo'    // una carta chiusa non si porta in giro
    if (g === 'fermo') return
    dito.stato = g
    if (g === 'trascina') presa.value = { k: dito.r.k, emoji: dito.r.emoji, x: 0, y: 0, bers: null }
  }
  if (dito.stato === 'scorri') { corpo.value.scrollTop = dito.scroll0 - dy; return }
  if (dito.stato === 'trascina') {
    const o = rett(radice.value)
    presa.value = { ...presa.value, x: e.clientX - o.left, y: e.clientY - o.top - 40, bers: bersaglioDi(e.clientX, e.clientY) }
  }
}
function lascia(e) {
  if (!dito || e.pointerId !== dito.id) return
  const { stato, r } = dito
  dito = null
  if (stato === 'attesa') emit('prepara', r.k)                             // un tocco: in fila
  else if (stato === 'trascina') {
    const b = bersaglioDi(e.clientX, e.clientY)
    presa.value = null
    if (b) emit('prepara', r.k)                                            // su un posto o sulla fila; altrove non è successo niente
  }
}
function annulla() { dito = null; presa.value = null }
</script>

<template>
  <div ref="radice" class="f3-foglio f3-colonna f3-macchina fm" :class="{ trascina: !!presa }" data-f3="macchina" :data-macchina="tipo" @contextmenu.prevent>
    <header ref="insegna" class="f3-insegna">
      <span class="f3-insegna-em" :class="{ con3d: foto }" aria-hidden="true"><img v-if="foto" :src="foto" alt="" draggable="false" data-anteprima="pronta"><template v-else>{{ parti[0] }}</template></span>
      <h2>{{ parti[1] }}</h2>
      <small>{{ occupati }} su {{ forno.length }} posti al lavoro</small>
    </header>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <!-- `data-f3="pasticceria"` resta il bersaglio della pasticceria (un elemento ha un solo data-f3: il foglio porta «macchina») -->
    <div ref="corpo" class="f3-corpo fm-corpo" :data-f3="tipo === 'pasticceria' ? 'pasticceria' : null">
      <section ref="sopra" class="fm-sopra" :class="{ sopra: presa && presa.bers && presa.bers.tipo === 'fila' }">
        <h3>Nel forno</h3>
        <div class="fm-fila">
          <div v-for="(p, i) in forno" :key="i" class="fm-posto" :class="[statoDelPosto(p), { sopra: presa && presa.bers && presa.bers.i === i }]" :style="{ '--i': i }"
               data-f3="posto" :data-posto="i" :data-stato="statoDelPosto(p)">
            <div class="fm-vano">
              <Faccia v-if="p" :k="p.k" :emoji="p.emoji" :lato="46" />
              <span v-else class="fm-piu" aria-hidden="true">＋</span>
            </div>
            <i><u :style="{ width: (p ? p.barra : 0) + '%' }"></u></i>
            <small>{{ testoPosto(p) }}</small>
          </div>
        </div>
        <div class="fm-pronti" :class="{ c: puoRitirare }" data-f3="pronti">
          <div class="fm-pila">
            <button v-for="c in prontiK" :key="c.k" class="fm-pronto" :data-pronto="c.k" :aria-label="'ritira ' + c.k" @click="$emit('ritira')"><Faccia :k="c.k" :n="c.n" :lato="38" /></button>
            <span v-if="!prontiK.length" class="fm-nessuno">{{ pronti || 'Niente da ritirare' }}</span>
          </div>
          <button class="fm-ritira" :disabled="!puoRitirare" data-f3="ritira" @click="$emit('ritira')">🧺 Ritira tutto</button>
        </div>
      </section>
      <section class="fm-ricette">
        <p v-if="messaggio" class="f3-messaggio" data-f3="macchina-msg">{{ messaggio }}</p>
        <h3>Cosa vuoi preparare? <small>trascinala in fila, o toccala</small></h3>
        <div class="fm-carte">
          <article v-for="(r, n) in carte" :key="r.k" class="ricetta fm-carta" :class="{ chiusa: !r.sbloccata, pronta: r.puoi, inmano: presa && presa.k === r.k }" :style="{ '--i': n }"
                   role="button" tabindex="0" :aria-disabled="!r.puoi" :data-puoi="r.puoi" :data-ricetta="r.k" :data-n="r.n"
                   @pointerdown="premi($event, r)" @pointermove="muovi" @pointerup="lascia" @pointercancel="annulla" @keydown.enter.prevent="$emit('prepara', r.k)" @keydown.space.prevent="$emit('prepara', r.k)">
            <div class="fm-foto">
              <Faccia :k="r.k" :emoji="r.emoji" :lato="52" />
              <b v-if="r.sbloccata" class="fm-n" :class="{ zero: !r.n }">{{ r.n }}</b>
              <span v-else class="lucchetto" aria-hidden="true">🔒</span>
            </div>
            <b class="fm-nome">{{ r.nome }}</b>
            <div class="fm-ing">
              <span v-for="i in r.ing" :key="i.k" class="fm-i" :class="i.ha >= i.serve ? 'ok' : 'manca'" :data-ing="i.k">
                <Faccia :k="i.k" :emoji="i.emoji" :lato="26" /><em aria-hidden="true">{{ i.ha >= i.serve ? '✓' : '✗' }}</em><small>{{ i.ha }}/{{ i.serve }}</small>
              </span>
            </div>
            <small v-if="r.sbloccata" class="tempo">⏱️ {{ tempoDi(r.ms) }}</small>
            <small v-else class="blocco">🔒 Arriva al livello {{ r.liv }}</small>
          </article>
        </div>
        <p class="f3-nota"><template v-if="dispensaK.length">In dispensa: <span v-for="c in dispensaK" :key="c.k" class="f3-merce-n"><Faccia :k="c.k" :lato="22" /> ×{{ c.n }}</span></template><template v-else>{{ dispensa }}</template></p>
      </section>
    </div>
    <!-- il fantasma della carta in mano: segue il dito, un poco sopra -->
    <div v-if="presa" class="fm-fantasma" data-f3="trascina-fantasma" :class="{ su: presa.bers }" :style="{ transform: `translate(${presa.x}px, ${presa.y}px) translate(-50%, -50%)` }">
      <Faccia :k="presa.k" :emoji="presa.emoji" :lato="52" />
    </div>
  </div>
</template>

<style>
.f3-macchina .f3-merce-n { display: inline-flex; align-items: center; gap: 2px; margin: 0 6px; vertical-align: middle; }
</style>
