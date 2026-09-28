<script setup>
// Con che personaggio si vede in mappa: scelta del bambino (store/profile.js
// aspettoDi/scegliAspetto), non del gioco. PERSONE viene dall'atlante generato
// da strumenti/sprite/atlante.py: un personaggio nuovo compare qui da solo.
import { ref } from 'vue'
import { ATLANTE, PEZZI, PERSONE } from '../giochi/fattoria/dati/atlante.js'

defineProps({
  scelto: { type: String, default: '' },
})
defineEmits(['scegli'])

const immagine = new Image()
const pronta = ref(false)
immagine.onload = () => { pronta.value = true }
immagine.src = ATLANTE

// un solo fotogramma fermo (il primo passo del verso «giù») basta per riconoscersi
function disegna(canvas, nome) {
  if (!canvas) return
  const p = PEZZI[`${nome}_giu0`]
  if (!p) return
  const z = 4
  canvas.width = p[2] * z
  canvas.height = p[3] * z
  const g = canvas.getContext('2d')
  g.imageSmoothingEnabled = false   // niente sfocatura sulla pixel art
  g.drawImage(immagine, p[0], p[1], p[2], p[3], 0, 0, canvas.width, canvas.height)
}
</script>

<template>
  <div v-if="pronta" class="scelta-aspetto">
    <button v-for="nome in PERSONE" :key="nome" type="button" class="aspetto"
            :class="{ on: nome === scelto }" :data-aspetto="nome" :aria-label="nome"
            :aria-pressed="nome === scelto" @click="$emit('scegli', nome)">
      <canvas :ref="el => disegna(el, nome)"></canvas>
    </button>
  </div>
</template>

<style scoped>
.scelta-aspetto { display:flex; gap:10px; flex-wrap:wrap }
.aspetto { display:flex; align-items:center; justify-content:center; padding:9px;
           border-radius:14px; background:var(--carta); box-shadow:0 4px 14px #8593a822 }
.aspetto.on { box-shadow:inset 0 0 0 3px var(--viola) }
.aspetto:active { transform:translateY(1px) }
canvas { image-rendering:pixelated; display:block }
</style>
