<script setup>
// L'anteprima di un livello di Passo passo per la maestra: la sua mappa vera (dati/campagna.js) disegnata a quadretti, coi
// colori dei terreni e l'emoji delle cose. Non è il gioco dipinto, ma è proprio quel livello. docs/passo-passo/scuola.md
import { computed } from 'vue'
import { LEGENDA } from '../../../giochi/passo-passo/dati/mondo.js'

const props = defineProps({
  mappa: { type: Array, required: true },
  protagonista: { type: String, default: 'coniglio' },
  lato: { type: Number, default: 14 },          // i pixel di un quadretto
})
const TERRENI = { prato: '#a9d67a', acqua: '#5aa9e6', ghiaccio: '#d4f0fb', tana: '#9b6b3e', buca: '#4a4a4a', recinto: '#d9b77e' }
const LASTRE = { rosso: '#e0533f', blu: '#3f73e0', giallo: '#f2c230' }
const OSTACOLI = { albero: '🌳', cespuglio: '🌿', sasso: '🪨', tronco: '🪵', muro: '🧱' }
const CHI = { coniglio: '🐇', cane: '🐕', guerriero: '⚔️' }

// per ogni casella: il colore del fondo, un'eventuale lastra o grata, e la cosa sopra
const caselle = computed(() => props.mappa.flatMap((riga, y) => [...riga].map((ch, x) => {
  const d = LEGENDA[ch] || {}
  const cosa = d.partenza ? CHI[props.protagonista] : d.carota ? (props.protagonista === 'cane' ? '🦴' : '🥕')
    : d.ostacolo === 'staccionata' ? '' : d.ostacolo ? OSTACOLI[d.ostacolo] : d.pecora ? '🐑' : d.masso ? '⚪'
    : d.nemico ? '👹' : d.spada ? '🗡️' : d.principessa ? '👸' : d.terreno === 'tana' ? '🏠' : ''
  return { x, y, ch, fondo: TERRENI[d.terreno] || TERRENI.prato, lastra: LASTRE[d.lastra] || null, pulsante: LASTRE[d.pulsante] || null,
           grata: LASTRE[d.grata] || null, staccionata: d.ostacolo === 'staccionata', buca: d.coppia || null, cosa }
})))
const larga = computed(() => Math.max(...props.mappa.map(r => r.length)))
</script>

<template>
  <svg class="mini-mappa" :viewBox="`0 0 ${larga * 10} ${mappa.length * 10}`" :width="larga * lato" :height="mappa.length * lato"
       role="img" aria-label="la mappa del livello">
    <g v-for="c in caselle" :key="`${c.x}-${c.y}`" :transform="`translate(${c.x * 10} ${c.y * 10})`">
      <rect width="10" height="10" :fill="c.fondo" stroke="#00000014" stroke-width=".4" />
      <rect v-if="c.lastra" x="1.5" y="1.5" width="7" height="7" rx="1" :fill="c.lastra" opacity=".85" />
      <circle v-if="c.pulsante" cx="5" cy="5" r="3" :fill="c.pulsante" stroke="#fff" stroke-width=".8" />
      <g v-if="c.grata" :stroke="c.grata" stroke-width="1.2"><path d="M2 0v10M5 0v10M8 0v10" /></g>
      <rect v-if="c.staccionata" x="0" y="4" width="10" height="2.4" fill="#8a5a2b" />
      <text v-if="c.buca" x="5" y="7" text-anchor="middle" font-size="6" fill="#fff" font-weight="700">{{ c.buca }}</text>
      <text v-if="c.cosa" x="5" y="7.6" text-anchor="middle" font-size="7.4">{{ c.cosa }}</text>
    </g>
  </svg>
</template>

<style scoped>
.mini-mappa { display:block; border-radius:6px; flex:none; max-width:100% ; height:auto }
</style>
