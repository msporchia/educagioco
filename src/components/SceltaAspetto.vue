<script setup>
/* ═══════════════════════════════════════════════════════════════════
   CON CHE PERSONAGGIO SI VEDE IN MAPPA
   Una fila di ritagli presi dall'atlante degli sprite — oggi la fattoria
   è l'unico gioco che disegna un personaggio, ma questa scelta non è
   sua: è del bambino (vedi `aspettoDi`/`scegliAspetto` in
   `store/profile.js`), come il nome.

   Niente elenco scritto qui dentro: `PERSONE` viene dall'atlante
   generato da `strumenti/sprite/atlante.py`, dal `tipo` dichiarato nel
   foglietto di ogni sorgente. Un personaggio nuovo compare qui da solo,
   la prima volta che si rilancia l'atlante.

   Il ritaglio è lo stesso gesto di `strumenti/sprite/anteprima.html`:
   `imageSmoothingEnabled = false`, perché la pixel art che il browser
   sfoca ridimensionandola si vede, e si vede subito — specie a
   quest'ingrandimento, dove ogni pixel del foglio ne copre sedici.
   ═══════════════════════════════════════════════════════════════════ */
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

/* Un solo fotogramma fermo — il primo passo del verso «giù», quello con
   cui si cammina verso chi guarda — basta per riconoscersi: non è
   un'anteprima dell'animazione, è una scelta fra due facce.
   `v-if="pronta"` sul contenitore (sotto) fa sì che i canvas nascano
   già con l'immagine caricata, così questa funzione non deve
   preoccuparsi di essere richiamata una seconda volta quando arriva. */
function disegna(canvas, nome) {
  if (!canvas) return
  const p = PEZZI[`${nome}_giu0`]
  if (!p) return
  const z = 4
  canvas.width = p[2] * z
  canvas.height = p[3] * z
  const g = canvas.getContext('2d')
  g.imageSmoothingEnabled = false
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
