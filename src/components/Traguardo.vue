<script setup>
/* Il cartello del traguardo appena preso.

   Sta in App.vue e non dentro un gioco: un traguardo può scattare da
   qualsiasi parte — una risposta giusta, una ciotola riempita, un
   acquisto — e la festa deve arrivare lì dove si stava giocando.

   Se ne prendono più d'uno insieme (succede), si mettono in fila e si
   mostrano uno alla volta: due cartelli sovrapposti non si leggono. */
import { ref, watch, onUnmounted } from 'vue'
import { state, festaVista } from '../store/profile.js'
import { suono } from '../audio.js'

const DURATA = 3200
const corrente = ref(null)
let timer = null

function prossimo() {
  clearTimeout(timer)
  if (!state.festa.length) { corrente.value = null; return }
  corrente.value = state.festa[0]
  suono.livello()
  timer = setTimeout(() => {
    state.festa = state.festa.slice(1)
    if (!state.festa.length) festaVista()
    prossimo()
  }, DURATA)
}

watch(() => state.festa.length, n => { if (n && !corrente.value) prossimo() }, { immediate: true })
onUnmounted(() => clearTimeout(timer))

function chiudi() {
  state.festa = []
  festaVista()
  clearTimeout(timer)
  corrente.value = null
}
</script>

<template>
  <div v-if="corrente" class="velo" @click="chiudi">
    <div class="cartello" :key="corrente.id + corrente.grado">
      <p class="occhiello">Traguardo!</p>
      <div class="faccia">
        {{ corrente.emoji }}
        <em v-if="corrente.medaglia">{{ corrente.medaglia }}</em>
      </div>
      <h2>{{ corrente.nome }}</h2>
      <p class="come">{{ corrente.come }}</p>
      <p v-if="corrente.premio" class="premio">+{{ corrente.premio }} 🪙</p>
      <p class="mini">tocca per continuare</p>
    </div>
  </div>
</template>

<style scoped>
.velo { position:fixed; inset:0; z-index:80; display:grid; place-items:center;
        background:#222a3899; backdrop-filter:blur(2px); animation:entra .25s ease-out }
.cartello { width:min(88vw,330px); padding:22px 20px 16px; border-radius:26px; text-align:center;
            background:linear-gradient(160deg,#fff8e6,#fff);
            box-shadow:0 12px 0 #e0cf9f, 0 22px 50px #0004;
            animation:salta .5s cubic-bezier(.2,1.5,.4,1) }
.occhiello { font-size:12px; font-weight:900; letter-spacing:.14em; text-transform:uppercase;
             color:var(--arancio) }
.faccia { position:relative; display:inline-block; font-size:66px; line-height:1.15;
          animation:pulsa 1.1s ease-in-out infinite }
.faccia em { position:absolute; right:-16px; bottom:2px; font-size:32px; font-style:normal }
.cartello h2 { font-size:22px; margin-top:2px }
.come { font-size:13.5px; color:var(--tenue); margin:5px 0 8px; line-height:1.35 }
.premio { font-size:20px; font-weight:900; color:#c98a00; margin-bottom:6px }
@keyframes entra { from { opacity:0 } to { opacity:1 } }
@keyframes salta { from { transform:scale(.5) translateY(30px); opacity:0 } }
@keyframes pulsa { 50% { transform:scale(1.09) rotate(-4deg) } }
</style>
