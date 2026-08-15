<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA CORSA — la schermata che si gioca

   Due cose e basta: consegna il suo canvas a chi lo deve dipingere
   (`emit('tela')`) e trasforma il dito in **una corsia**. Non conosce il
   motore, non sa cos'è un cancello, non tiene un punteggio: i numeri in
   cima glieli passa chi coordina, già fatti.

   ── IL DITO ──────────────────────────────────────────────────────
   Una strisciata cambia corsia; un tocco secco vale come una strisciata
   verso quel lato dello schermo. Su un telefono in corsa il gesto
   preciso non viene, e restare fermi perché lo swipe era corto di dieci
   pixel è la cosa che fa posare il telefono.

   Ogni tocco **spinge anche in avanti**, che ci si sposti o no: serve a
   non stare ad aspettare i venti metri vuoti fra un cancello e l'altro.
   Quanto valga quella spinta lo decide il motore, non questa schermata —
   e davanti a una scelta vale zero.

   ── IL CRUSCOTTO È PICCOLO APPOSTA ───────────────────────────────
   Quello che conta si guarda **in strada**: il numero della truppa sta
   attaccato ai soldati, i cancelli hanno il conto scritto sopra. Qui in
   cima resta il minimo — quanto manca, e se sta arrivando un mostro —
   perché ogni riga in più è un pezzo di strada in meno.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ORDINI } from '../dati/ordini.js'

const props = defineProps({
  cruscotto: { type: Object, required: true },
  buio: { type: Boolean, default: false },
  dritta: { type: Boolean, default: true },
})
const emit = defineEmits(['tela', 'vai', 'premi'])

const tela = ref(null)

const gruppi = computed(() => (props.cruscotto.gruppi || []).map(g => ({
  ...g, colore: ORDINI[g.grado].colore, nome: ORDINI[g.grado].nome,
})))

/* ═══════════ il dito ═══════════ */
let giu = null
function premuto(e) {
  giu = { x: e.clientX, t: e.timeStamp }
  try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* pazienza */ }
  emit('premi', true)
}
function mollato(e) {
  emit('premi', false)
  if (!giu) return
  const dx = e.clientX - giu.x
  giu = null
  const largo = tela.value?.getBoundingClientRect()
  if (Math.abs(dx) > 26) return emit('vai', dx > 0 ? 1 : -1)
  emit('vai', e.clientX > (largo ? largo.left + largo.width / 2 : 0) ? 1 : -1)
}
const annulla = () => { giu = null; emit('premi', false) }

/* Le frecce, per chi gioca al computer. Non è un vezzo: i test e gli
   scatti girano senza dito — e col mouse «tenere premuto» è il gesto
   naturale per andare più forte, che a battere il tasto non ci pensa
   nessuno. Freccia su e barra spaziatrice spingono e basta. */
const SPINGE = new Set(['ArrowUp', 'w', ' ', 'Spacebar'])
const tasto = e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') emit('vai', -1)
  else if (e.key === 'ArrowRight' || e.key === 'd') emit('vai', 1)
  else if (SPINGE.has(e.key)) { e.preventDefault(); emit('premi', true) }
}
const mollaTasto = e => { if (SPINGE.has(e.key)) emit('premi', false) }

onMounted(() => {
  emit('tela', tela.value)
  addEventListener('keydown', tasto)
  addEventListener('keyup', mollaTasto)
})
onUnmounted(() => {
  removeEventListener('keydown', tasto)
  removeEventListener('keyup', mollaTasto)
  emit('premi', false)
})
</script>

<template>
  <div class="co-pista" :class="{ 'co-buio': buio }"
       @pointerdown="premuto" @pointerup="mollato"
       @pointercancel="annulla" @pointerleave="annulla">
    <canvas ref="tela" class="co-tela"></canvas>

    <div class="co-cruscotto">
      <div class="co-riga">
        <div class="co-gettone em">
          <span v-if="cruscotto.infinita">🏁 <b>{{ cruscotto.metri }}</b> m</span>
          <span v-else>🏁 <b>{{ cruscotto.restano }}</b> m</span>
        </div>
        <div class="co-spazio"></div>
        <div class="co-gettone em">💥 <b>{{ cruscotto.vinti }}</b></div>
      </div>
      <div v-if="!cruscotto.infinita" class="co-barra">
        <i :style="{ width: (cruscotto.quota * 100) + '%' }"></i>
      </div>

      <!-- La truppa detta a parole, accanto a quella che corre in terra:
           è la stessa cosa detta in due modi, ed è lì che si impara a
           leggere un numero raggruppato invece di subirlo. -->
      <div class="co-gruppi em">
        <span v-for="g in gruppi" :key="g.grado" class="co-gruppo">
          <i :style="{ background: g.colore }"></i>{{ g.quanti }}
        </span>
        <span v-if="cruscotto.piena" class="co-piena">truppa piena!</span>
      </div>
    </div>

    <!-- L'avviso arriva presto apposta: sapere che fra poco c'è un mostro
         da quaranta è quello che rende la scelta del cancello una
         decisione invece di un riflesso. -->
    <div v-if="cruscotto.mostro" class="co-avviso em"
         :class="{ 'co-boss': cruscotto.mostro.boss }">
      {{ cruscotto.mostro.boss ? '👹 BOSS' : '👾' }} da
      <b>{{ cruscotto.mostro.quanti }}</b> fra {{ cruscotto.mostro.fra }} m
    </div>

    <div v-if="dritta" class="co-dritta em">tocca a destra o a sinistra<br>più tocchi, più corri 👆</div>
  </div>
</template>
