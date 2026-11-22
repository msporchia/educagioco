<script setup>
// Un gioco da scegliere, col suo disegno (comune/icone-giochi.js): le domande hanno un foglio, gli altri l'icona di casa. docs/scuola/editor.md
import { ICONE } from '../comune/icone-giochi.js'

const props = defineProps({
  gioco: { type: Object, required: true },     // una voce di GIOCHI
  scelta: { type: Boolean, default: false },
  grande: { type: Boolean, default: false },   // con la riga che spiega
  piccola: { type: Boolean, default: false },  // in fila con tutti gli altri, nell'editor
  guardata: { type: Boolean, default: false }, // quella che il carosello mostra sotto (non ancora scelta)
})
const icona = ICONE[props.gioco.id] || null
</script>

<template>
  <button class="tessera-gioco" :class="{ scelta: props.scelta, grande: props.grande, piccola: props.piccola, guardata: props.guardata }" :aria-pressed="props.scelta" :data-gioco="props.gioco.id">
    <span class="disegno" :style="icona ? { background: icona.fondo } : null">
      <img v-if="icona" :src="icona.src" alt="" draggable="false">
      <span v-else class="foglio" aria-hidden="true">📝</span>
    </span>
    <span class="testi">
      <span class="nome">{{ props.gioco.nome }}</span>
      <span v-if="props.grande" class="spiega">{{ props.gioco.spiega }}</span>
    </span>
  </button>
</template>

<style scoped>
.tessera-gioco { display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px 6px 10px; width:104px; font:inherit;
                 color:var(--inchiostro); background:var(--tessera); border:2px solid transparent; border-radius:var(--raggio);
                 cursor:pointer; text-align:center }
.tessera-gioco.scelta { border-color:var(--inchiostro); background:var(--superficie); box-shadow:var(--ombra) }
.disegno { width:72px; height:72px; border-radius:16px; overflow:hidden; display:grid; place-items:center; background:#e9edf3; flex:none }
.disegno img { width:100%; height:100%; object-fit:cover; pointer-events:none }
.foglio { font-size:40px }
.testi { display:flex; flex-direction:column; gap:2px }
.nome { font-size:13px; font-weight:600; line-height:1.2 }
.piccola { width:84px; padding:6px 4px 8px; gap:4px }
.piccola .disegno { width:52px; height:52px; border-radius:12px }
.piccola .foglio { font-size:28px }
.piccola .nome { font-size:12px }
.tessera-gioco.scelta { border-color:var(--penna, var(--inchiostro)) }
.tessera-gioco.guardata { background:var(--superficie); box-shadow:0 0 0 3px var(--penna-chiara, var(--tessera)), var(--ombra) }
.tessera-gioco.guardata .nome { color:var(--penna, var(--inchiostro)) }
.grande { width:100%; flex-direction:row; gap:12px; padding:10px; text-align:left }
.grande .nome { font-size:15px }
.spiega { font-size:13px; color:var(--grigio); line-height:1.35 }
</style>
