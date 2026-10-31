<script setup>
// La faccia di una merce, uguale in ogni foglio: il disegno dell'atlante della fattoria di sempre (Provino.vue, non toccato) se la merce
// ce l'ha, l'emoji dei dati come ripiego dichiarato (`aspetta`). `k` è la chiave 3D (un raccolto, un prodotto, uova, latte); `emoji` serve
// solo se la chiave non si conosce; `n` > 0 mette il numerino «×n» in alto a destra. Vedi docs/fattoria3d/merci-e-ricette.md.
import { computed } from 'vue'
import Provino from './Provino.vue'
import { merceDi } from '../dati/ricette.js'

const props = defineProps({
  k: { type: String, required: true },
  emoji: { type: String, default: '' },
  n: { type: Number, default: 0 },
  lato: { type: Number, default: 34 },
})
const m = computed(() => merceDi(props.k))
const pezzo = computed(() => (m.value && m.value.pezzo) || null)
const em = computed(() => (m.value && m.value.emoji) || props.emoji || '❔')
</script>

<template>
  <span class="f3-faccia" :data-merce="k" :style="{ width: lato + 'px', height: lato + 'px' }">
    <Provino v-if="pezzo" :pezzo="pezzo" :lato="lato" :aria="1" />
    <span v-else class="e" aria-hidden="true" :style="{ fontSize: Math.round(lato * 0.7) + 'px' }">{{ em }}</span>
    <b v-if="n > 0" class="x">×{{ n }}</b>
  </span>
</template>

<style>
.f3-faccia { position: relative; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; flex: none; }
.f3-faccia canvas { display: block; image-rendering: pixelated; }
.f3-faccia .e { line-height: 1; }
.f3-faccia .x { position: absolute; right: -8px; top: -5px; min-width: 24px; height: 22px; padding: 0 5px; box-sizing: border-box; border-radius: 11px; background: #3a2a1a; color: #fff; font: 800 12px/22px "Emoji Gioco", system-ui, sans-serif; text-align: center; }
</style>
