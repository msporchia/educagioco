<script setup>
import { ref, onMounted } from 'vue'
import { init, state } from './store/profile.js'
import HomeView from './views/HomeView.vue'
import RoomView from './views/RoomView.vue'
import EnglishGame from './views/EnglishGame.vue'
import MathGame from './views/MathGame.vue'
import TowerDefense from './views/TowerDefense.vue'
import PetsView from './views/PetsView.vue'

const vista = ref('home')
const pronto = ref(false)
const viste = { home: HomeView, cameretta: RoomView, inglese: EnglishGame, mate: MathGame,
                torri: TowerDefense, animali: PetsView }

onMounted(async () => { await init(); pronto.value = true })
function vai(v) { vista.value = v }
</script>

<template>
  <div v-if="!pronto" class="schermo">
    <div class="centro"><h1>Un attimo…</h1></div>
  </div>
  <component v-else :is="viste[vista]" @vai="vai" :key="vista + state.player" />
</template>
