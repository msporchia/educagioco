<script setup>
// Il castello a sprite: il tower defense vero (TowerDefense.vue, chiave
// `torri`) con un'altra pelle (`scena/pelle.js`) — tappe, conti e
// salvataggio restano quelli di `torri`. Cosa manca ancora: vedi
// docs/castello/da-fare.md.
import { markRaw } from 'vue'
import TowerDefense from '../../views/TowerDefense.vue'
import { PELLE } from './scena/pelle.js'

defineOptions({ name: 'CastelloSprite' })
const emit = defineEmits(['vai'])

const pelle = markRaw(PELLE)   // una tabella di funzioni e pittori: niente da osservare
</script>

<template>
  <TowerDefense :pelle="pelle" titolo="Castello a sprite" guida="castello"
                @vai="(...a) => emit('vai', ...a)" />
</template>
