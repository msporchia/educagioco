<script setup>
// Il campo e le carte: consegna il suo canvas a chi lo deve dipingere
// (emit('tela')), passa i tocchi sulla tela (emit('tocca')) e trasforma il
// tocco su una carta in una scelta (emit('scegli')). Non conosce le regole:
// riceve già decisi soli, ricariche e cosa si può comprare.
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  cruscotto: { type: Object, required: true },   // { soli, restano, totale, carte: [{ id, nome, emoji, costo, op, resta, ricarica, puoi }] }
  avviso: { type: String, default: '' },
  inMano: { type: Object, default: null },        // la pianta pagata che aspetta la sua cella
})
const emit = defineEmits(['tela', 'tocca', 'scegli', 'annulla'])
const tela = ref(null)
onMounted(() => emit('tela', tela.value))

const avanzata = computed(() => {
  const c = props.cruscotto
  return c.totale ? Math.round(100 * (c.totale - c.restano) / c.totale) : 0
})
</script>

<template>
  <div class="gi-campo">
    <div class="gi-hud em">
      <span class="gi-soli" data-soli>☀️ <b>{{ cruscotto.soli }}</b></span>
      <span class="gi-resto">🧟 <b>{{ cruscotto.restano }}</b></span>
    </div>
    <div class="gi-barra"><i :style="{ width: avanzata + '%' }"></i></div>

    <div class="gi-quadro">
      <canvas ref="tela" class="gi-tela" @click="e => emit('tocca', e)"></canvas>
      <div v-if="inMano" class="gi-avviso em" data-avviso>
        {{ inMano.emoji }} Tocca dove metterla
        <button class="gi-annulla" data-azione="annulla" aria-label="annulla" @click.stop="emit('annulla')">✕</button>
      </div>
      <div v-else-if="avviso" class="gi-avviso em" data-avviso>{{ avviso }}</div>
    </div>

    <div class="gi-carte">
      <button v-for="c in cruscotto.carte" :key="c.id" class="gi-carta em"
              :class="{ 'gi-spenta': !c.puoi }" :data-pianta="c.id" @click="emit('scegli', c.id)">
        <span class="gi-op">{{ c.op }}</span>
        <span class="gi-e">{{ c.emoji }}</span>
        <span class="gi-prezzo">☀️ {{ c.costo }}</span>
        <i class="gi-vela" :style="{ height: (c.ricarica ? 100 * c.resta / c.ricarica : 0) + '%' }"></i>
      </button>
    </div>
  </div>
</template>
