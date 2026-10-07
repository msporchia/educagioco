<script>
// dove il carretto si è fermato l'ultima volta, per bambino: dura la sessione, non va nel profilo
let ultimo = null      // { chi, citta: l'id della città, banco: l'indice del banco, -1 = l'ingresso }
</script>

<script setup>
/* La piazza di una città: i banchi delle sue giornate come tappe col numero,
   il carretto che va dove si tocca, il fumetto sopra il banco e un cartello
   in scena per tornare al mondo. Riceve lo stato già deciso di ogni banco e
   dice solo quale giornata si vuole giocare. Vedi docs/bancarella/mappa.md. */
import { ref, shallowRef, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import Fumetto from '../Fumetto.vue'
import { fondalePiazza } from '../../data/bancarella-fondali.js'
import { BANCHI } from '../../data/bancarella.js'
import { disponiPiazza, stradaCarretto, lungo, lunghezza, durataCarretto } from '../../motore/bancarella/mondo.js'
import { disegnaPiazza, disegnaBanco, viale, CARRETTO, CARTELLO, COLORI_PIAZZA } from '../../grafica/bancarella-mondo.js'

const props = defineProps({
  citta: { type: Object, required: true },        // la città: id, nome, monumento, accento…
  // [{ id, numero, giornata, stato: fatta|ora|aperta|chiusa, serve }]
  banchi: { type: Array, required: true },
  stelle: { type: String, default: '' },          // «2 di 4 giornate»
  chi: { type: String, default: '' },
})
const emit = defineEmits(['gioca', 'mondo'])

const scorre = ref(null)
const carretto = ref(null)
const W = ref(0)
const Hc = ref(0)
const aperto = ref(null)             // l'indice del banco col fumetto
const posato = ref(-1)               // dov'è il carretto: un banco, o -1 per l'ingresso
const viaggio = shallowRef(null)
let qui = { x: 0, y: 0 }
let occhio = null

const P = computed(() => (W.value ? disponiPiazza(W.value, props.banchi.length, Hc.value) : null))
const fondale = computed(() => fondalePiazza(props.citta.id))
const sfondo = computed(() => {
  const p = P.value
  if (!p || fondale.value) return ''
  const su = p.banchi.length ? p.banchi[p.banchi.length - 1].y + 40 : p.cielo + 90   // dove il viale finisce, in una fontana
  return disegnaPiazza(props.citta.id, props.citta.monumento, p.W, p.H, p.cielo, props.citta.accento, { x: p.centro, y: su }) +
         viale(p.centro, p.H - 40, su + 16)
})
const disegni = computed(() => props.banchi.map(b =>
  disegnaBanco(props.citta.accento, b.stato, b.giornata.tappe.map(t => BANCHI[t].colore))))
const CARRETTO_SVG = CARRETTO(), CARTELLO_SVG = CARTELLO()
// sopra il cielo della scena, se la scena è più bassa dello schermo, continua lo stesso colore
const cielo = computed(() => (COLORI_PIAZZA[props.citta.id] || COLORI_PIAZZA.roma).cielo)

const dove = k => (k < 0 ? P.value.ingresso : P.value.banchi[k].posto)

function misura() {
  const s = scorre.value
  if (!s) return
  W.value = Math.floor(s.clientWidth)
  Hc.value = Math.floor(s.clientHeight)
}

/* ---------- il carretto ---------- */
function metti(x, y) {
  qui = { x, y }
  if (carretto.value) carretto.value.style.transform = `translate(${Math.round(x - 20)}px, ${Math.round(y - 38)}px)`
}
const parcheggia = () => { if (P.value) { const d = dove(posato.value); metti(d.x, d.y) } }
const ricorda = () => { ultimo = { chi: props.chi, citta: props.citta.id, banco: posato.value } }

// la vista sul carretto, dentro la scena
function scorriA(y, liscio = false) {
  const s = scorre.value
  if (!s || !P.value) return
  const alto = s.clientHeight
  const top = Math.max(0, Math.min(P.value.H - alto, y - alto * 0.55))
  s.scrollTo({ top, behavior: liscio ? 'smooth' : 'auto' })
}

/* Il viaggio del carretto: lungo il viale e dentro verso il banco. `segue`:
   all'arrivo in piazza la vista lo accompagna; quando si tocca un banco no,
   la vista sta ferma sotto il dito. */
function guida(k, { attesa = 0, segue = false } = {}) {
  const a = dove(k)
  const punti = stradaCarretto(P.value, qui, a)
  const tot = lunghezza(punti)
  if (tot < 2) { posato.value = k; parcheggia(); ricorda(); return }
  const dur = durataCarretto(tot)
  let t = -attesa, prima = null, id = 0, finito = false
  const molle = q => (q < 0.5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2)
  const arriva = () => {
    if (finito) return
    finito = true
    cancelAnimationFrame(id)
    posato.value = k
    viaggio.value = null
    parcheggia(); ricorda()
  }
  const fotogramma = ora => {
    if (finito) return
    const nascosto = typeof document !== 'undefined' && document.hidden
    if (prima !== null && !nascosto) t += Math.min(0.05, Math.max(0, (ora - prima) / 1000))
    prima = ora
    if (t >= dur) return arriva()
    if (t >= 0) {
      const p = lungo(punti, molle(t / dur))
      metti(p.x, p.y)
      if (segue) {
        const s = scorre.value
        if (s) {
          const su = p.y - s.scrollTop
          if (su < s.clientHeight * 0.3 || su > s.clientHeight * 0.7) s.scrollTop += (su - s.clientHeight * 0.55) * 0.12
        }
      }
    }
    id = requestAnimationFrame(fotogramma)
  }
  id = requestAnimationFrame(fotogramma)
  viaggio.value = {
    chiudi: arriva, ferma() { finito = true; cancelAnimationFrame(id) }, verso: k,
    posizione: () => ({ x: qui.x, y: qui.y }),
  }
}

function vai(k) {
  const v = viaggio.value
  if (v) {
    if (v.verso === k) return
    v.ferma()
    viaggio.value = null
    guida(k)
  } else if (posato.value !== k) guida(k)
}

// il banco da cui si riparte: quello da fare, o l'ultimo aperto
const daFare = computed(() => {
  const i = props.banchi.findIndex(b => b.stato === 'ora')
  if (i >= 0) return i
  let ultimoAperto = 0
  props.banchi.forEach((b, k) => { if (b.stato !== 'chiusa') ultimoAperto = k })
  return ultimoAperto
})

onMounted(() => {
  misura()
  if (typeof ResizeObserver !== 'undefined') {
    occhio = new ResizeObserver(misura)
    occhio.observe(scorre.value)
  }
})

let pronto = false
watch(P, async p => {
  if (!p) return
  await nextTick()
  if (!pronto) {
    pronto = true
    const prima = ultimo && ultimo.chi === props.chi && ultimo.citta === props.citta.id
                  && ultimo.banco < props.banchi.length ? ultimo : null
    if (prima) {
      // il carretto sta dov'era rimasto
      posato.value = prima.banco
      parcheggia()
      scorriA(dove(prima.banco).y)
    } else {
      // arriva dal cartello, e va al banco da fare
      posato.value = -1
      parcheggia()
      scorriA(p.H)
      guida(daFare.value, { attesa: 0.4, segue: true })
    }
  } else if (!viaggio.value) parcheggia()
}, { immediate: true, flush: 'post' })

onUnmounted(() => {
  if (occhio) occhio.disconnect()
  // uscendo a metà strada si conta come arrivato
  const v = viaggio.value
  if (v) { v.ferma(); posato.value = v.verso; viaggio.value = null; ricorda() }
})

/* ---------- il fumetto ---------- */
function tocca(k) {
  const v = viaggio.value
  if (aperto.value === k) { if (!v) aperto.value = null; return }
  aperto.value = k
  if (props.banchi[k].stato !== 'chiusa') vai(k)
}
// il fumetto non si chiude mentre il carretto viaggia
const chiudi = () => { if (!viaggio.value) aperto.value = null }
const banco = computed(() => (aperto.value === null ? null : props.banchi[aperto.value]))
const STATI = { fatta: '★ Superata: si può rifare', ora: 'Tocca a te!', aperta: 'Si può già fare' }
function gioca(b) {
  aperto.value = null
  emit('gioca', b.id)
}
const icone = g => g.tappe.map(t => BANCHI[t].icona).join(' ')
const racconto = b => `${b.nome}: ${b.stato === 'chiusa' ? 'chiusa' : b.stato === 'fatta' ? 'superata' : 'aperta'}`
</script>

<template>
  <div ref="scorre" class="piazza" data-piazza :data-citta-di="citta.id" :style="{ background: cielo }" @click="chiudi">
    <div v-if="P" class="scena" :style="{ width: P.W + 'px', height: P.H + 'px' }">
      <img v-if="fondale" class="fondale" :src="fondale" alt="" draggable="false">
      <svg v-else class="strato" :viewBox="`0 0 ${P.W} ${P.H}`" aria-hidden="true" v-html="sfondo"></svg>

      <div class="targa">
        <b>{{ citta.nome }}</b>
        <small>{{ citta.continente }}<template v-if="stelle"> · {{ stelle }}</template></small>
      </div>

      <div v-for="(b, k) in banchi" :key="b.id" class="posto"
           :style="{ left: (P.banchi[k].x - P.banchi[k].w / 2) + 'px', top: P.banchi[k].y + 'px' }">
        <svg class="disegno" viewBox="0 0 124 108" aria-hidden="true" v-html="disegni[k]"></svg>
        <span v-if="b.stato === 'ora'" class="alone"></span>
        <button type="button" class="banco" :class="'s-' + b.stato"
                :data-camp="b.id" :data-stato="b.stato" :aria-label="racconto(b)" @click.stop="tocca(k)">
          <span class="tondo">{{ b.numero }}</span>
          <svg v-if="b.stato === 'chiusa'" class="lucchetto" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="9" fill="#fff" stroke="#a9b0b8" stroke-width="1.6"/>
            <path d="M6.5 9V7a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="#7b838c" stroke-width="1.6"/>
            <rect x="5.5" y="9" width="9" height="6.5" rx="1.6" fill="#7b838c"/>
          </svg>
          <span v-else-if="b.stato === 'fatta'" class="stella" data-stella-banco aria-hidden="true">★</span>
        </button>
      </div>

      <!-- il cartello per tornare al mondo: una strada che esce dalla scena -->
      <button type="button" class="cartello" data-azione="al-mondo" aria-label="torna al mondo"
              :style="{ left: (P.centro + 36) + 'px', top: (P.H - 128) + 'px' }" @click.stop="emit('mondo')">
        <svg viewBox="0 0 78 94" aria-hidden="true" v-html="CARTELLO_SVG"></svg>
        <span>il mondo</span>
      </button>

      <!-- il carretto: parte dal cartello e va dove si tocca -->
      <div ref="carretto" class="carretto" data-carretto :data-al="posato" :class="{ cammina: viaggio }"
           :data-in-viaggio="viaggio ? '1' : '0'">
        <svg viewBox="0 0 40 40" aria-hidden="true" v-html="CARRETTO_SVG"></svg>
      </div>

      <Fumetto v-if="banco" :key="banco.id" :x="P.banchi[aperto].x" :y="P.banchi[aperto].y + 4" :limite="P.W"
               :scorre="scorre" :tenue="banco.stato === 'chiusa'" :data-fumetto-per="banco.id" class="fumetto-banco">
        <small>Giornata {{ banco.numero }} · {{ citta.nome }}</small>
        <b>{{ banco.giornata.emoji }} {{ banco.giornata.nome }}</b>
        <span class="che">{{ banco.giornata.nuovo || banco.giornata.dritta }}</span>
        <span class="banchini">{{ icone(banco.giornata) }}<template v-if="!banco.giornata.libera"> · {{ banco.giornata.tappe.length }} banchi</template></span>
        <span v-if="banco.stato === 'chiusa'" class="serve" data-serve>🔒 {{ banco.serve }}</span>
        <template v-else>
          <span class="stato" :class="'stato-' + banco.stato">{{ STATI[banco.stato] }}</span>
          <button type="button" class="vai" data-azione="gioca" @click="gioca(banco)">▶ gioca</button>
        </template>
      </Fumetto>
    </div>
  </div>
</template>

<style scoped>
/* la scena sta in fondo: se è più bassa dello schermo, il cielo si allarga sopra */
.piazza { --fumetto-fondo:#fffaf0; --fumetto-tenue:#e9ecee; --fumetto-testo:#3a2a1a;
          flex:1; min-height:0; overflow-y:auto; overflow-x:hidden; display:flex; flex-direction:column;
          overscroll-behavior:contain; scrollbar-width:none }
.piazza::-webkit-scrollbar { display:none }
.scena { position:relative; flex:none; margin:auto auto 0 }
.strato, .fondale { position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; display:block }
.fondale { image-rendering:pixelated }

.targa { position:absolute; left:10px; top:10px; z-index:1; display:flex; flex-direction:column; gap:1px;
         padding:6px 12px 7px; border-radius:14px; background:#fffdf7e6; box-shadow:0 3px 0 #0000001f; pointer-events:none }
.targa b { font-size:17px; font-weight:900; color:#a8301f }
.targa small { font-size:11.5px; font-weight:800; color:#8b7a63 }

.posto { position:absolute; width:124px; height:108px }
.disegno { position:absolute; left:0; top:0; width:124px; height:108px; display:block; pointer-events:none }
.banco { position:absolute; inset:0; padding:0; border:0; background:transparent; border-radius:10px }
.tondo { position:absolute; left:43px; top:3px; width:38px; height:38px; border-radius:50%; display:grid; place-items:center;
         border:3px solid; font-size:18px; font-weight:900; line-height:1; background:#fffdf7;
         box-shadow:0 3px 0 #00000030; transition:transform .12s }
.banco:active .tondo { transform:scale(.93) }
.s-fatta .tondo { background:#6cc070; border-color:#3a9d4a; color:#fff }
.s-ora .tondo { background:#ffd34d; border-color:#ff9f1c; color:#5a3200 }
.s-aperta .tondo { background:#fffdf7; border-color:#e8553f; color:#b03a28 }
.s-chiusa .tondo { background:#d9dde2; border-color:#a9b0b8; color:#8b93a1 }
.lucchetto { position:absolute; left:73px; top:0; width:20px; height:20px }
.stella { position:absolute; right:-6px; top:-8px; width:28px; height:28px; border-radius:50%; background:#fff;
          color:#f0a800; font-size:19px; line-height:28px; text-align:center;
          box-shadow:0 1px 3px #0003, inset 0 0 0 2px #f0c040 }
.alone { position:absolute; left:-5px; top:-5px; width:134px; height:118px; border-radius:16px; pointer-events:none;
         border:3px dashed #ff9f1c; animation:pulsa 1.8s ease-in-out infinite }
@keyframes pulsa { 0%, 100% { opacity:.95 } 50% { opacity:.35 } }
@media (prefers-reduced-motion: reduce) { .alone { animation:none } }

.cartello { position:absolute; width:78px; height:112px; padding:0; border:0; background:transparent; z-index:1 }
.cartello svg { display:block; width:78px; height:94px }
.cartello span { position:absolute; left:50%; bottom:-2px; transform:translateX(-50%); white-space:nowrap;
                 padding:1px 8px; border-radius:9px; background:#fffdf7; font-size:11.5px; font-weight:900;
                 color:#6a4a2a; box-shadow:0 2px 0 #0000001f }
.cartello:active { transform:translateY(2px) }

.carretto { position:absolute; left:0; top:0; width:40px; height:40px; pointer-events:none; z-index:2;
            will-change:transform }
.carretto svg { display:block; width:40px; height:40px; overflow:visible }
.carretto.cammina svg { animation:balla .3s ease-in-out infinite }
@keyframes balla { 0%, 100% { transform:translateY(0) rotate(0) } 50% { transform:translateY(-2.5px) rotate(1.2deg) } }

.fumetto-banco small { display:block; font-size:11px; letter-spacing:.5px; text-transform:uppercase; color:#8b7a63 }
.fumetto-banco b { display:block; font-size:17px; font-weight:900; color:#a8301f }
.fumetto-banco .che { display:block; margin-top:2px; font-size:13px; color:#5a4632 }
.fumetto-banco .banchini { display:block; margin-top:3px; font-size:13px; font-weight:800; color:#8b7a63 }
.fumetto-banco .stato { display:block; margin-top:5px; font-size:13px; font-weight:800; color:#5a4632 }
.fumetto-banco .stato-ora { color:#b7791f }
.fumetto-banco .stato-fatta { color:#2f8a3e }
.fumetto-banco .serve { display:block; margin-top:6px; font-size:13px; font-weight:800; color:#5a4632 }
.fumetto-banco .vai { display:block; width:100%; margin-top:8px; padding:9px 0; border-radius:999px; font-size:16px;
                      font-weight:900; color:#5a3200; background:linear-gradient(180deg,#ffd257,#ffa62b);
                      box-shadow:0 3px 0 #c97b12 }
.fumetto-banco .vai:active { transform:translateY(2px); box-shadow:0 1px 0 #c97b12 }
</style>
