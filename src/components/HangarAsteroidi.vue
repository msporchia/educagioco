<script setup>
/* L'hangar: si dipinge la nave coi pezzi regalati dalle navi madri.
   Vedi docs/asteroidi/hangar.md. Niente nomi: ognuno si immagina la sua. */
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { state } from '../store/profile.js'
import { ritocca } from '../giochi/campagne.js'
import { TINTE, DISEGNI, STEMMI, pezzo, tipoDi } from '../data/hangar.js'
import { hangarDi, possiede, scegli, visto, livrea, prossimoDelVolo } from '../motore/asteroidi/hangar.js'
import { disegnaNave } from '../grafica/spazio.js'
import PezzoHangar from './PezzoHangar.vue'
import Chiudi from '../giochi/fattoria/viste/Chiudi.vue'

const emit = defineEmits(['chiudi'])

const leggi = () => hangarDi(JSON.parse(JSON.stringify(((state.profile.campagne || {}).mate || {}).hangar || {})))
const h = reactive(leggi())
const nuovi = new Set(h.nuovi)          // i pallini restano finché l'hangar è aperto

function cambia(campo, valore) {
  ritocca('mate', c => {
    c.hangar = hangarDi(c.hangar)
    if (!scegli(c.hangar, campo, valore)) return false
  })
  Object.assign(h, leggi())
}

const LINGUETTE = [
  { id: 'scafo', tinta: 'scafo' }, { id: 'ali', tinta: 'ali' }, { id: 'fiamma', tinta: 'fiamma' },
  { id: 'disegno', forma: 'disegno', tinta: 'colDisegno' }, { id: 'stemma', forma: 'stemma', tinta: 'colStemma' },
]
const su = ref('scafo')
// di che linguetta è un pezzo: la forma o il colore che ci si sceglie
const diLinguetta = (l, p) => [l.forma && l.forma[0], l.tinta].includes(tipoDi(p))
// una linguetta senza niente di suo non si mostra (disegni e stemmi si vincono tutti)
const linguette = computed(() => LINGUETTE.filter(l => !l.forma ||
  h.presi.some(p => tipoDi(p) === l.forma[0])))
// il pallino anche sulla linguetta: un pezzo nuovo sta spesso in un'altra
const nuovoIn = l => [...nuovi].some(p => diLinguetta(l, p))
const linguetta = computed(() => LINGUETTE.find(l => l.id === su.value))

// le forme della linguetta: prese o col lucchetto, «niente» per primo
const forme = computed(() => {
  const l = linguetta.value
  if (!l.forma) return []
  const tutte = l.forma === 'disegno' ? DISEGNI.map(d => pezzo('d', d)) : STEMMI.map(s => pezzo('s', s))
  return tutte.map(p => ({ p, id: p.slice(2), preso: possiede(h, p), nuovo: nuovi.has(p) }))
})
// i colori: per scafo, ali e fiamma c'è anche «di serie»
const colori = computed(() => TINTE.map(t => {
  const p = pezzo(linguetta.value.tinta, t.id)
  return { p, id: t.id, preso: possiede(h, p), nuovo: nuovi.has(p) }
}))
const diSerie = computed(() => ['scafo', 'ali', 'fiamma'].includes(linguetta.value.tinta))
const scelto = campo => h.nave[campo] ?? null

// nel volo non ogni nave madre lascia il pacco: va detto, se no sembra un guasto
const voloAncora = computed(() => !!prossimoDelVolo(h))

// la nave grande, che gira i motori piano
const tela = ref(null)
let raf = 0
function dipingi(ts) {
  const cv = tela.value
  if (cv) {
    const dpr = devicePixelRatio || 1, w = cv.clientWidth, alto = cv.clientHeight
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(alto * dpr) }
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, alto)
    const r = Math.min(w, alto) * 0.3
    disegnaNave(ctx, { x: w / 2, y: alto * 0.48, r, lv: 3, t: ts / 1000, spinta: 0.4,
                       mira: -Math.PI / 2, livrea: livrea(h.nave) })
  }
  raf = requestAnimationFrame(dipingi)
}
onMounted(() => { raf = requestAnimationFrame(dipingi) })
onUnmounted(() => cancelAnimationFrame(raf))

function chiudi() {
  if (h.nuovi.length) ritocca('mate', c => { c.hangar = hangarDi(c.hangar); visto(c.hangar) }, { subito: true })
  emit('chiudi')
}
</script>

<template>
  <div class="hangar-velo" data-hangar @click.self="chiudi">
    <div class="foglio">
      <div class="testa">
        <b>Hangar</b>
        <Chiudi @chiudi="chiudi" />
      </div>
      <canvas ref="tela" class="nave"></canvas>
      <div class="linguette">
        <button v-for="l in linguette" :key="l.id" type="button" :class="{ su: su === l.id }"
                :data-linguetta="l.id" @click="su = l.id">{{ l.id }}<i v-if="nuovoIn(l)" class="nuovo" data-nuovo></i></button>
      </div>
      <div class="scelte">
        <div v-if="forme.length" class="griglia forme">
          <button type="button" class="tassello" :class="{ scelto: !scelto(linguetta.forma) }"
                  :data-scelta="linguetta.forma + ':niente'" @click="cambia(linguetta.forma, null)">—</button>
          <button v-for="f in forme" :key="f.p" type="button" class="tassello"
                  :class="{ scelto: scelto(linguetta.forma) === f.id, chiuso: !f.preso }"
                  :disabled="!f.preso" :data-scelta="f.p" :data-preso="f.preso ? 1 : 0"
                  @click="cambia(linguetta.forma, f.id)">
            <PezzoHangar v-if="f.preso" :pezzo="f.p" :nave="h.nave" :misura="52" fermo />
            <span v-else class="lucchetto" aria-hidden="true">?</span>
            <i v-if="f.nuovo" class="nuovo" data-nuovo></i>
          </button>
        </div>
        <div class="griglia colori">
          <button v-if="diSerie" type="button" class="tondo di-serie" :class="{ scelto: !scelto(linguetta.tinta) }"
                  :data-scelta="linguetta.tinta + ':serie'" @click="cambia(linguetta.tinta, null)">
            <span></span></button>
          <button v-for="c in colori" :key="c.p" type="button" class="tondo"
                  :class="{ scelto: scelto(linguetta.tinta) === c.id, chiuso: !c.preso }"
                  :disabled="!c.preso" :data-scelta="c.p" :data-preso="c.preso ? 1 : 0"
                  @click="cambia(linguetta.tinta, c.id)">
            <PezzoHangar v-if="c.preso" :pezzo="c.p" :misura="40" fermo />
            <span v-else class="lucchetto" aria-hidden="true">?</span>
            <i v-if="c.nuovo" class="nuovo" data-nuovo></i>
          </button>
        </div>
        <p class="nota">I pezzi col «?» li regalano le navi madri, in fondo alle tappe e nel volo.</p>
        <p v-if="voloAncora" class="nota" data-volo-pacchi>Nel volo infinito le navi madri lasciano un pacco
          ogni tanto, e più sono in alto più spesso lo lasciano.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hangar-velo { position:fixed; inset:0; z-index:30; background:#05081acc; display:flex;
               align-items:flex-end; justify-content:center }
.foglio { width:100%; max-width:520px; max-height:100%; display:flex; flex-direction:column;
          background:#10153a; border-radius:20px 20px 0 0; border:1px solid #ffffff22;
          padding:10px 14px calc(14px + env(safe-area-inset-bottom)); box-sizing:border-box; color:#e6ebff }
.testa { display:flex; align-items:center; justify-content:space-between; position:sticky; top:0 }
.testa b { font-size:20px }
/* la ✕ comune (fattoria/viste/Chiudi.vue): il suo stile sta nel foglio della fattoria */
.testa :deep(.fa-chiudi) { position:static; margin:0; width:38px; height:38px; display:grid; place-items:center; padding:0;
  border:3px solid #fff; border-radius:50%; background:radial-gradient(circle at 35% 30%, #ff7a62, #d93a2a 70%);
  box-shadow:0 3px 0 #8a1f14, 0 4px 8px #0004; color:#fff; font-size:17px; font-weight:900; line-height:1 }
.nave { width:100%; height:200px; flex:0 0 auto;
        background:radial-gradient(ellipse at 50% 85%, #7fe3ff22, transparent 60%) }
.linguette { display:flex; gap:4px; flex:0 0 auto; margin:4px 0 8px }
.linguette button { position:relative; flex:1; padding:7px 0; border-radius:999px; border:1px solid #3a3f66;
                    background:#1a1d33; color:#e6ebff; font-size:13px; font-weight:700 }
.linguette button.su { background:#ffd94a; color:#1a1d33; border-color:#ffd94a }
.scelte { flex:0 1 auto; min-height:0; overflow-y:auto; -webkit-overflow-scrolling:touch }
.griglia { display:grid; gap:8px; margin-bottom:12px }
.forme { grid-template-columns:repeat(auto-fill, minmax(62px, 1fr)) }
.colori { grid-template-columns:repeat(auto-fill, minmax(48px, 1fr)) }
.tassello, .tondo { position:relative; display:flex; align-items:center; justify-content:center;
                    border:2px solid #ffffff1c; background:#ffffff0a; color:#bfc6e0; padding:0 }
.tassello { height:62px; border-radius:12px; font-size:22px }
.tondo { height:48px; border-radius:50% }
.scelto { border-color:#ffd94a; background:#ffd94a22 }
.chiuso { opacity:.55 }
.lucchetto { font-size:20px; font-weight:900; color:#6f789c }
.di-serie span { width:30px; height:30px; border-radius:50%;
                 background:linear-gradient(135deg, #e8eefc 50%, #2f7bff 50%) }
.nuovo { position:absolute; top:3px; right:3px; width:10px; height:10px; border-radius:50%;
         background:#ff6b6b; box-shadow:0 0 0 2px #10153a }
.nota { font-size:13px; color:#9aa1c2; margin:4px 0 0 }
</style>
