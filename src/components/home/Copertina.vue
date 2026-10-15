<script setup>
// Il disegno di un gioco in home: la copertina dipinta, se c'è; se no fondo,
// una scena di forme piatte e l'icona grande. Vedi docs/core/home.md («Le copertine»).
import { computed } from 'vue'
import { SCENE } from './scene.js'
import { DIPINTE } from './copertine-dipinte.js'
import { inArrivo } from '../../scarico.js'

const props = defineProps({
  chiave: { type: String, default: '' },     // il gioco: trova la copertina dipinta
  copertina: { type: Object, default: null },
  ico: { type: String, default: '' },
  grande: { type: Number, default: 64 },   // la misura dell'icona, in px
  quadrata: { type: Boolean, default: false },   // un posto quadrato: del dipinto l'icona, non il taglio in mezzo
})

const FONDO = '#8593a8'
const c = computed(() => props.copertina || { fondo: FONDO, disegno: '#6e7788', scena: 'colline' })

const dipinta = computed(() => DIPINTE[props.chiave]?.[props.quadrata ? 'icona' : 'src'] || '')
const disegno = computed(() => (SCENE[c.value.scena] || SCENE.colline)(c.value.disegno))
</script>

<template>
  <span class="copertina" :style="{ background: c.fondo }">
    <img v-if="dipinta" :src="dipinta" alt="" draggable="false" data-dipinta>
    <template v-else>
      <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true" v-html="disegno"></svg>
      <span class="icona" :style="{ fontSize: grande + 'px' }">{{ ico }}</span>
    </template>
    <!-- il gioco non è ancora sul telefono: sta arrivando (src/scarico.js) -->
    <span v-if="chiave && inArrivo(chiave)" class="in-arrivo" title="Sta arrivando sul telefono" data-in-arrivo>↓</span>
  </span>
</template>

<style scoped>
.copertina { position:relative; display:block; overflow:hidden; border-radius:16px }
.copertina svg { position:absolute; inset:0; width:100%; height:100% }
.copertina img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; pointer-events:none }
.in-arrivo { position:absolute; right:6px; top:6px; z-index:2; min-width:22px; height:22px; border-radius:11px; display:grid; place-items:center;
  background:rgba(43,33,64,.85); color:#ffd24a; font-size:.8rem; line-height:1 }
.icona { position:absolute; inset:0; display:grid; place-items:center; line-height:1 }
</style>
