<script setup>
// L'entrata del sotterraneo: il gioco (Gioco.vue) è disegnato in WebGL (scena3d/). Senza WebGL 2 non si apre niente: lo si dice, e
// si torna in home senza toccare il profilo. docs/sotterraneo/grafica-3d.md
import { ref } from 'vue'
import Barra from '../../components/Barra.vue'
import { caricaQuando } from '../carica.js'
// a richiesta come in schermate.js: un import fisso farebbe di Gioco.vue un pezzo condiviso, fuori dal file del sotterraneo
const Gioco = caricaQuando(() => import('./Gioco.vue'))
import { haWebGL2 } from './scena3d/webgl.js'
import './stile.css'
import './stile-3d.css'

// App.vue passa a tutte le schermate `disegno` e `lingua`: qui non devono cadere su Gioco
defineOptions({ name: 'IlSotterraneo', inheritAttrs: false })
const emit = defineEmits(['vai'])
// `#sotterraneo&tela=niente`: per provare il messaggio su un browser che il WebGL ce l'ha
const finto = typeof location !== 'undefined' && /(?:^#?|&)tela=niente(?:&|$)/.test(location.hash || '')
const puo = ref(!finto && haWebGL2())
</script>

<template>
  <Gioco v-if="puo" @vai="v => emit('vai', v)" />
  <div v-else class="schermo">
    <Barra titolo="Il sotterraneo" scura @indietro="emit('vai', 'home')" />
    <div class="sot3d-senza" data-senza-3d>
      <p class="em">🗺️</p>
      <h1>Qui il sotterraneo non si può disegnare</h1>
      <p>Questo telefono non sa disegnare il sotterraneo in tre dimensioni. La tua avventura resta salva.</p>
      <button type="button" class="sot-grosso" data-azione="esci-3d" @click="emit('vai', 'home')">torno ai giochi</button>
    </div>
  </div>
</template>
