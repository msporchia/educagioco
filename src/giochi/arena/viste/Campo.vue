<script setup>
// Il campo e il pannello delle scelte: consegna il suo canvas a chi lo deve
// dipingere (emit('tela')) e trasforma il tocco su una carta in una scelta
// (emit('scegli')). Non conosce le regole: riceve già decisi prezzi, livelli e
// cosa si può fare. Il dito non è un mouse: niente di piccolo da toccare.
import { ref, computed, onMounted } from 'vue'
import Ritratto from './Ritratto.vue'

const props = defineProps({
  cruscotto: { type: Object, required: true },
  pannello: { type: Object, required: true },     // { caserme: [], azioni: [] }
  avviso: { type: String, default: '' },
  dritta: { type: Boolean, default: true },        // «tocca una caserma»
  ammesse: { type: Array, default: () => ['+'] },  // le operazioni di questa tappa
})
const emit = defineEmits(['tela', 'scegli'])
const tela = ref(null)
onMounted(() => emit('tela', tela.value))

const orologio = computed(() => {
  const s = Math.max(0, Math.ceil(props.cruscotto.resto))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
const ICONA = { miniera: '⛏️', muro: '🧱', ripara: '🔧', torretta: '🗼' }
const NOME = { miniera: 'Più monete', muro: 'Muro', ripara: 'Ripara', torretta: 'Torretta' }
</script>

<template>
  <div class="ar-campo">
    <div class="ar-hud em">
      <span class="ar-gettone">⏱️ <b>{{ orologio }}</b></span>
      <span class="ar-gettone ar-monete" data-monete>🪙 <b>{{ cruscotto.monete }}</b>
        <i>+{{ cruscotto.alSecondo.toFixed(1) }} al secondo</i></span>
      <span class="ar-gettone">🔵 <b>{{ cruscotto.coroneIo }} – {{ cruscotto.coroneNem }}</b> 🔴</span>
    </div>

    <div class="ar-quadro">
      <canvas ref="tela" class="ar-tela"></canvas>
      <div v-if="avviso" class="ar-avviso em" data-avviso>{{ avviso }}</div>
      <div v-else-if="dritta" class="ar-dritta em">👇 tocca una caserma per costruirla</div>
    </div>

    <div class="ar-pannello">
      <button v-for="c in pannello.caserme" :key="c.id" class="ar-carta"
              :class="{ 'ar-no': !c.puoi, 'ar-nuova': !c.presente }"
              :data-caserma="c.id" @click="emit('scegli', { azione: c.presente ? 'potenzia' : 'costruisci', id: c.id })">
        <span class="ar-segno">{{ c.op }}</span>
        <Ritratto :id="c.id" :lato="40" />
        <span class="ar-nome">{{ c.nome }}</span>
        <span class="ar-liv">{{ c.presente ? 'Lv ' + c.liv : 'da costruire' }}</span>
        <span class="ar-prezzo em">
          <template v-if="c.riposo > 0">💤 {{ Math.ceil(c.riposo) }}s</template>
          <template v-else-if="c.prezzo === null">MAX</template>
          <template v-else>{{ c.presente ? '⬆️' : '🛖' }} {{ c.prezzo }} 🪙</template>
        </span>
        <i v-if="c.presente" class="ar-prog"><b :style="{ width: (c.avanza * 100) + '%' }"></b></i>
      </button>

      <button v-for="a in pannello.azioni" :key="a.azione" class="ar-carta ar-azione"
              :class="{ 'ar-no': !a.puoi }"
              :data-azione="a.azione" @click="emit('scegli', { azione: a.azione })">
        <span class="ar-segno">{{ ammesse.includes(a.op) ? a.op : '' }}</span>
        <span class="ar-icona em">{{ ICONA[a.azione] }}</span>
        <span class="ar-nome">{{ NOME[a.azione] }}</span>
        <span class="ar-liv">{{ a.stato }}</span>
        <span class="ar-prezzo em">
          <template v-if="a.prezzo === null">—</template>
          <template v-else>{{ a.prezzo }} 🪙</template>
        </span>
      </button>
    </div>
  </div>
</template>
