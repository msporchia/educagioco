<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SCHEDA DI UN ANIMALE

   Uno per volta, grande. Prima erano tre riquadri da un terzo di schermo:
   ci stava tutto — le quattro barrette, la frase, il disegno — ma piccolo
   al punto che il cappellino appena messo non si vedeva. Qui l'animale
   occupa mezza schermata, gli accessori si riconoscono e si passa da uno
   all'altro con le frecce, i pallini o una strisciata del dito.

   Sotto ci sono i quattro bisogni con il nome scritto e cosa dargli, più
   il quinto riquadro dei vestiti: vestire e accudire sono la risposta
   alla stessa domanda — *cosa faccio con lui adesso?* — e stanno nello
   stesso posto.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onUnmounted } from 'vue'
import { state, miei, usa, bisogno, chiede, inDispensa, dispensaDi,
         indossa, togli } from '../store/profile.js'
import { BISOGNI, grado, preferisce, petDi } from '../data/pets.js'
import { POSTI, pezzoDi } from '../data/capsule.js'
import PetSprite from './PetSprite.vue'
import { suono } from '../audio.js'

const props = defineProps({
  chi:    { type: String, required: true },   // l'id dell'animale aperto
  adesso: { type: Number, default: () => Date.now() },
})
const emit = defineEmits(['cambia', 'avviso', 'negozio', 'sorprese'])

const bestia = computed(() => petDi(props.chi))
const lista = computed(() => miei())
const indice = computed(() => lista.value.findIndex(p => p.id === props.chi))

/* ---------- lo scorrimento fra gli animali ---------- */
const verso = ref('avanti')

function vaiAl(i) {
  const n = lista.value.length
  if (n < 2) return
  const p = lista.value[(i + n) % n]
  if (!p || p.id === props.chi) return
  verso.value = (i + n) % n > indice.value ? 'avanti' : 'indietro'
  emit('cambia', p.id)
  felice(p)
}
const scorri = d => vaiAl(indice.value + d)

/* la strisciata: sotto i 40 px è un tocco, non un gesto */
let tocco = null
const giu = e => { tocco = { x: e.clientX, y: e.clientY } }
function suDito(e) {
  if (!tocco) return
  const dx = e.clientX - tocco.x, dy = e.clientY - tocco.y
  tocco = null
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) scorri(dx < 0 ? 1 : -1)
}

/* ---------- come sta, e cosa fargli ---------- */
const val = k => bisogno(props.chi, k, props.adesso)
const urgente = computed(() => chiede(props.chi, props.adesso))
const addosso = computed(() => state.profile.pets[props.chi]?.addosso || {})

const occupato = ref(false)     // sta mangiando / giocando / facendo il bagno
const modo = ref('mangia')
const dono = ref(null)
let timerDono = 0

const stato = computed(() => {
  if (occupato.value) return modo.value
  return { alto: 'contento', medio: 'normale', basso: 'chiede' }[urgente.value.grado]
})

const comeSta = b => ({ basso: b.chiede, medio: b.mezzo, alto: b.sazio })[grado(val(b.k))]

/* La riga sopra i riquadri: dice in una frase sola di cosa ha bisogno
   adesso, invece di lasciarlo dedurre da quattro barrette senza nome. */
const sommario = computed(() => {
  if (occupato.value) return { mangia: 'gnam gnam!', gioca: 'che bello!', lavato: 'splash!' }[modo.value]
  const bassi = BISOGNI.filter(b => grado(val(b.k)) === 'basso')
  if (bassi.length > 1) return 'ha bisogno di parecchie cose:'
  if (bassi.length === 1) return bassi[0].chiede
  const medi = BISOGNI.filter(b => grado(val(b.k)) === 'medio')
  if (medi.length) return medi[0].mezzo
  return 'sta benissimo!'
})

/* ognuno fa il suo verso: le fusa a un bobtail non si addicono */
const versoDi = p => suono[p.verso]()
const felice = p => (p.specie === 'cane' ? suono.ansima() : suono.fusa())

/* Dare qualcosa è sempre lo stesso gesto: cambia solo la barra che sale
   e l'aria che l'animale si dà mentre lo riceve. */
function porgi(c) {
  const esito = usa(props.chi, c.e)
  if (!esito) return
  if (esito === 'pieno') {
    versoDi(bestia.value)
    return emit('avviso', bestia.value.nome + ' sta già bene, grazie!')
  }
  modo.value = { fame: 'mangia', gioco: 'gioca', pulizia: 'lavato', forma: 'mangia' }[c.bisogno]
  occupato.value = true
  dono.value = { e: c.e, cuori: esito === 'preferito' }
  suono[c.bisogno === 'gioco' ? 'ok' : 'sgranocchia']()
  if (esito === 'preferito') {
    felice(bestia.value)
    emit('avviso', 'è il preferito di ' + bestia.value.nome + '!')
  }
  clearTimeout(timerDono)
  timerDono = setTimeout(() => {
    occupato.value = false; dono.value = null; versoDi(bestia.value)
  }, 1300)
}

/* ---------- il guardaroba ---------- */
const mieiAccessori = computed(() =>
  state.profile.accessori.map(pezzoDi).filter(Boolean))
const perPosto = posto => mieiAccessori.value.filter(a => a.posto === posto)
const postiUtili = computed(() => POSTI.filter(po => perPosto(po.k).length))
const indossatiOra = computed(() =>
  Object.values(addosso.value).filter(Boolean).length)

function vesti(a) {
  // ritoccare lo stesso capo lo toglie: è il gesto che viene naturale
  if (addosso.value[a.posto] === a.e) { togli(props.chi, a.posto); suono.ok() }
  else if (indossa(props.chi, a.e)) { suono.compra(); emit('avviso', 'sta benissimo!') }
}

onUnmounted(() => clearTimeout(timerDono))
</script>

<template>
  <!-- ---------- l'animale, grande ---------- -->
  <div class="palco">
    <button v-if="lista.length > 1" class="freccia" aria-label="animale precedente"
            @click="scorri(-1)">‹</button>

    <div class="vetrina" @pointerdown="giu" @pointerup="suDito" @pointercancel="tocco = null">
      <div class="tappetino"></div>
      <Transition :name="'scivola-' + verso">
        <div class="figura" :key="chi">
          <PetSprite :pet="bestia" :stato="stato" :addosso="addosso" :size="240" />
          <span v-if="dono" class="dono">{{ dono.e }}</span>
          <span v-if="dono && dono.cuori" class="cuori">💖</span>
        </div>
      </Transition>
    </div>

    <button v-if="lista.length > 1" class="freccia" aria-label="animale successivo"
            @click="scorri(1)">›</button>
  </div>

  <div class="cartellino">
    <b>{{ bestia.nome }}</b>
    <i>{{ bestia.razza }}</i>
    <div class="barre">
      <div v-for="b in BISOGNI" :key="b.k" class="sbarra" :title="b.nome">
        <i :class="grado(val(b.k))" :style="{ width: val(b.k) + '%' }"></i>
      </div>
    </div>
  </div>

  <div v-if="lista.length > 1" class="punti">
    <button v-for="(p, i) in lista" :key="p.id" class="punto"
            :class="{ on: p.id === chi }" :aria-label="p.nome" @click="vaiAl(i)"></button>
  </div>

  <div class="dritta"><b>{{ bestia.nome }}</b> {{ sommario }}</div>

  <!-- ---------- i quattro bisogni, e i vestiti in coda ---------- -->
  <div class="bisogni">
    <div v-for="b in BISOGNI" :key="b.k" class="bisogno" :class="grado(val(b.k))">
      <div class="testa-bisogno">
        <span class="ico">{{ b.emoji }}</span>
        <b>{{ b.nome }}</b>
        <i>{{ comeSta(b) }}</i>
      </div>
      <div class="asta-bisogno">
        <i :class="grado(val(b.k))" :style="{ width: val(b.k) + '%' }"></i>
      </div>
      <div class="dai">
        <button v-for="c in dispensaDi(b.k)" :key="c.e" class="piatto"
                :class="{ voluto: preferisce(chi, c.e) }" @click="porgi(c)">
          <span class="e">{{ c.e }}</span>
          <span class="q">×{{ inDispensa(c.e) }}</span>
        </button>
        <!-- niente in casa: si dice dove si compra, ma solo se serve
             davvero. Una barra piena non ha bisogno di consigli. -->
        <button v-if="!dispensaDi(b.k).length && grado(val(b.k)) !== 'alto'"
                class="manca" @click="emit('negozio', 'animali')">
          niente in dispensa — <u>vai al negozio</u>
        </button>
        <span v-else-if="!dispensaDi(b.k).length" class="apposto">tutto a posto</span>
      </div>
    </div>

    <div class="bisogno vestiti">
      <div class="testa-bisogno">
        <span class="ico">👕</span>
        <b>vestiti</b>
        <i>{{ mieiAccessori.length ? indossatiOra + ' addosso' : 'ancora niente' }}</i>
      </div>
      <template v-if="mieiAccessori.length">
        <div v-for="po in postiUtili" :key="po.k" class="riga-posto">
          <span class="dove">{{ po.nome }}</span>
          <div class="armadio">
            <button v-for="a in perPosto(po.k)" :key="a.e" class="capo"
                    :class="{ addosso: addosso[po.k] === a.e }"
                    :title="a.nome" @click="vesti(a)">{{ a.e }}</button>
          </div>
        </div>
        <p class="mini spiega">Tocca di nuovo un capo per toglierlo.</p>
      </template>
      <button v-else class="manca" @click="emit('sorprese')">
        nessun accessorio — <u>prova la macchina delle sorprese</u>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ---------- il palco ---------- */
.palco { display:flex; align-items:center; gap:2px; width:100%; max-width:440px }
.freccia { flex:none; width:44px; height:64px; border-radius:16px; background:#ffffffcc;
           font-size:30px; font-weight:900; color:var(--viola-scuro); line-height:1;
           box-shadow:0 3px 0 #dde3ea }
.freccia:active { transform:translateY(2px); box-shadow:0 1px 0 #dde3ea }

.vetrina { position:relative; flex:1; min-width:0; height:min(46vh,270px);
           display:grid; place-items:end center; overflow:hidden; touch-action:pan-y }
/* il tappetino sotto: dà un pavimento a un animale che altrimenti
   galleggia in mezzo alla pagina */
.tappetino { position:absolute; left:8%; right:8%; bottom:2%; height:16%; border-radius:50%;
             background:radial-gradient(closest-side,#eef1e6 0 52%,#d7e2d2 52% 74%,#b8ccc0 74% 100%) }
.figura { position:relative; width:min(74%,230px); display:grid; place-items:center;
          padding-bottom:4% }
.figura :deep(svg.bestia) { width:100%; height:auto }

.scivola-avanti-enter-active, .scivola-avanti-leave-active,
.scivola-indietro-enter-active, .scivola-indietro-leave-active {
  transition:transform .26s ease, opacity .26s ease }
.scivola-avanti-leave-active, .scivola-indietro-leave-active { position:absolute; bottom:0 }
.scivola-avanti-enter-from   { transform:translateX(70%); opacity:0 }
.scivola-avanti-leave-to     { transform:translateX(-70%); opacity:0 }
.scivola-indietro-enter-from { transform:translateX(-70%); opacity:0 }
.scivola-indietro-leave-to   { transform:translateX(70%); opacity:0 }

.dono { position:absolute; left:50%; top:30%; font-size:40px; pointer-events:none;
        animation:ricevuto 1.3s ease-in forwards }
@keyframes ricevuto { 0%{transform:translate(-50%,-40px) scale(1);opacity:0}
                      25%{transform:translate(-50%,-10px) scale(1);opacity:1}
                      100%{transform:translate(-50%,10px) scale(.25);opacity:0} }
.cuori { position:absolute; left:62%; top:14%; font-size:30px; pointer-events:none;
         animation:cuoricini 1.3s ease-out forwards }
@keyframes cuoricini { 0%{transform:scale(.3);opacity:0} 30%{transform:scale(1.1);opacity:1}
                       100%{transform:translateY(-44px) scale(.8);opacity:0} }

/* ---------- il cartellino ---------- */
.cartellino { display:flex; flex-direction:column; align-items:center; gap:3px;
              width:100%; max-width:240px; margin-top:-4px }
.cartellino b { font-size:22px; font-weight:900; color:var(--viola-scuro); line-height:1.1 }
.cartellino i { font-style:normal; font-size:12.5px; color:var(--tenue) }
.barre { width:100%; display:flex; flex-direction:column; gap:3px; margin-top:3px }
.sbarra { height:6px; border-radius:4px; background:#e4e9f0; overflow:hidden }
.sbarra i { display:block; height:100%; border-radius:4px; transition:width .5s ease }
.sbarra i.alto  { background:linear-gradient(90deg,var(--verde),#8fe0a8) }
.sbarra i.medio { background:linear-gradient(90deg,var(--giallo),var(--arancio)) }
.sbarra i.basso { background:linear-gradient(90deg,var(--rosso),#ff9d9d) }

.punti { display:flex; gap:7px; align-items:center }
.punto { width:11px; height:11px; border-radius:50%; background:#d4dce6; padding:0 }
.punto.on { background:var(--viola); transform:scale(1.25) }

.dritta { font-size:15px; color:var(--tenue); font-weight:700;
          display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center }
.dritta b { color:var(--viola-scuro); font-size:16px }

/* ---------- i bisogni ----------
   Un riquadro per bisogno, col suo nome scritto: le quattro barrette del
   cartellino servono a vedere in un colpo d'occhio quale sta peggio, ma
   da sole non dicono COSA manca. Qui c'è il nome, la frase e cosa dargli,
   che è poi l'unica domanda che il bambino si sta facendo. */
.bisogni { width:100%; max-width:440px; display:flex; flex-direction:column; gap:8px }
.bisogno { background:var(--carta); border-radius:16px; padding:9px 12px 10px;
           box-shadow:0 4px 0 #dde3ea; border-left:5px solid transparent }
.bisogno.basso { border-left-color:var(--rosso); background:#fff3f3 }
.bisogno.medio { border-left-color:var(--arancio) }
.bisogno.alto  { border-left-color:var(--verde); opacity:.72 }
.testa-bisogno { display:flex; align-items:baseline; gap:7px }
.testa-bisogno .ico { font-size:19px }
.testa-bisogno b { font-size:14px; font-weight:900; color:var(--viola-scuro);
                   text-transform:capitalize }
.testa-bisogno i { font-style:normal; font-size:12.5px; font-weight:800;
                   color:var(--tenue); margin-left:auto; text-align:right }
.bisogno.basso .testa-bisogno i { color:var(--rosso) }
.bisogno.alto  .testa-bisogno i { color:var(--verde) }
.asta-bisogno { height:7px; border-radius:5px; background:#e4e9f0; overflow:hidden; margin:6px 0 }
.asta-bisogno i { display:block; height:100%; border-radius:5px; transition:width .5s ease }
.asta-bisogno i.alto  { background:linear-gradient(90deg,var(--verde),#8fe0a8) }
.asta-bisogno i.medio { background:linear-gradient(90deg,var(--giallo),var(--arancio)) }
.asta-bisogno i.basso { background:linear-gradient(90deg,var(--rosso),#ff9d9d) }
.dai { display:flex; flex-wrap:wrap; gap:6px; align-items:center; min-height:26px }
.manca { font-size:11.5px; font-weight:800; color:var(--tenue); text-align:left; padding:2px 0 }
.manca u { color:var(--viola) }
.apposto { font-size:11.5px; font-weight:800; color:var(--verde) }

.piatto { position:relative; background:#fff; border-radius:14px; padding:5px 10px 3px;
          box-shadow:0 3px 0 #dde3ea; display:flex; flex-direction:column; align-items:center }
.piatto:active { transform:translateY(2px); box-shadow:0 1px 0 #dde3ea }
/* il preferito si vede: è quello che rende un terzo in più */
.piatto.voluto { box-shadow:0 3px 0 #f3c9a0, 0 0 0 2px #ffb35e88 }
.piatto .e { font-size:25px }
.piatto .q { font-size:10.5px; font-weight:900; color:var(--tenue) }

/* ---------- guardaroba: il quinto riquadro ---------- */
.bisogno.vestiti { border-left-color:var(--viola) }
.riga-posto { display:flex; align-items:flex-start; gap:8px; margin-top:6px }
.riga-posto .dove { font-size:11px; font-weight:800; color:var(--tenue);
                    flex:none; width:76px; text-align:left; padding-top:7px }
.armadio { display:flex; flex-wrap:wrap; gap:5px; flex:1 }
.capo { background:#fff; border-radius:12px; width:38px; height:34px; font-size:21px;
        display:grid; place-items:center; box-shadow:0 2px 0 #dde3ea;
        border:2px solid transparent }
.capo:active { transform:translateY(1px); box-shadow:none }
.capo.addosso { border-color:var(--viola); background:#e7ecf9; box-shadow:0 0 0 3px #4f6bd022 }
.spiega { margin-top:7px; text-align:left; font-size:11px }
</style>
