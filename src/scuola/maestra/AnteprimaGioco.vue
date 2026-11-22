<script setup>
// Qualche secondo del gioco vero, sotto il carosello della scelta del gioco (anteprime-giochi.js, generato da
// `npm run anteprime scuola`); senza video, il disegno del gioco. Chi ha chiesto meno movimento lo fa partire lui. docs/scuola/editor.md
import { ANTEPRIME } from './anteprime-giochi.js'
import { ICONE } from '../comune/icone-giochi.js'

const props = defineProps({ gioco: { type: String, required: true } })
const fermo = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
</script>

<template>
  <div class="anteprima" :data-anteprima="props.gioco">
    <video v-if="ANTEPRIME[props.gioco]" :key="props.gioco" :src="ANTEPRIME[props.gioco]" muted loop playsinline
           :autoplay="!fermo" :controls="fermo" disablepictureinpicture aria-hidden="true"></video>
    <span v-else class="disegno" :style="ICONE[props.gioco] ? { background: ICONE[props.gioco].fondo } : null">
      <img v-if="ICONE[props.gioco]" :src="ICONE[props.gioco].src" alt="">
      <span v-else class="foglio" aria-hidden="true">📝</span>
    </span>
  </div>
</template>

<style scoped>
/* intero, mai tagliato: i giochi in verticale (Asteroidi, castello, Survivors) hanno le bande ai lati */
.anteprima { position:relative; width:100%; height:clamp(200px, 34vw, 300px); border-radius:var(--raggio-piccolo); overflow:hidden;
             background:#1d2433; display:grid; place-items:center }
/* fuori dalla griglia: in una riga alta «auto» il 100% d'altezza non si risolve e il video verticale la sfonda */
.anteprima video { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; display:block }
.disegno { width:100%; height:100%; display:grid; place-items:center; background:#e9edf3 }
.disegno img { height:70%; aspect-ratio:1; border-radius:18px; object-fit:cover }
.foglio { font-size:64px }
</style>
