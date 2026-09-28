<script setup>
// La pista: consegna il suo canvas a chi lo deve dipingere (emit('tela'))
// e trasforma il dito in una corsia. Non conosce il motore. Una
// strisciata cambia corsia, un tocco secco vale come una strisciata
// verso quel lato — su un telefono in corsa il gesto preciso non viene.
// Ogni tocco spinge anche in avanti (quanto, lo decide il motore). Il
// cruscotto è piccolo apposta: quello che conta si guarda in strada.
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

// le frecce, per chi gioca al computer (e per i test, che girano senza
// dito): freccia su e barra spaziatrice spingono e basta
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

      <!-- la truppa detta a parole, la stessa cosa in due modi -->
      <div class="co-gruppi em">
        <span v-for="g in gruppi" :key="g.grado" class="co-gruppo">
          <i :style="{ background: g.colore }"></i>{{ g.quanti }}
        </span>
        <span v-if="cruscotto.piena" class="co-piena">truppa piena!</span>
      </div>
    </div>

    <!-- l'avviso arriva presto apposta: rende la scelta del cancello una decisione, non un riflesso -->
    <div v-if="cruscotto.mostro" class="co-avviso em"
         :class="{ 'co-boss': cruscotto.mostro.boss }">
      {{ cruscotto.mostro.boss ? '👹 BOSS' : '👾' }} da
      <b>{{ cruscotto.mostro.quanti }}</b> fra {{ cruscotto.mostro.fra }} m
    </div>

    <div v-if="dritta" class="co-dritta em">tocca a destra o a sinistra<br>più tocchi, più corri 👆</div>
  </div>
</template>
