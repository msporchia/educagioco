<script setup>
/* GLI UCCELLI.

   Visti di fronte, come gli altri: due occhi, due ali che sbattono e il
   becco, che è la cosa che li fa riconoscere prima dei colori. Il
   pappagallo ce l'ha grosso e ricurvo, il canarino piccolo e a punta —
   e il gufo (`taglio: 'gufo'`) ha in più i due ciuffetti e gli occhi
   larghi il doppio, che è tutto quello che serve per non scambiarlo
   con un pappagallo tondo.

   Il `ciuffo` è facoltativo: chi non lo dichiara ha la testa liscia. */
const props = defineProps({
  pet:    { type: Object, required: true },
  felice: { type: Boolean, default: false },
  uid:    { type: String, default: 'x' },
})

const gufo = () => props.pet.taglio === 'gufo'
</script>

<template>
  <!-- la coda a ventaglio, dietro tutto. Il gufo ce l'ha corta. -->
  <g class="coda">
    <template v-if="gufo()">
      <path d="M60,104 L48,124 L60,118 L72,124 Z" :fill="pet.ala" />
    </template>
    <template v-else>
      <path d="M60,104 L44,126 L60,118 L76,126 Z" :fill="pet.ala" />
      <path d="M60,106 L52,126 L60,120 L68,126 Z" :fill="pet.manto" opacity=".8" />
    </template>
  </g>

  <!-- le zampette, sotto il corpo -->
  <g>
    <path d="M50,110 v10 M70,110 v10" :stroke="pet.becco" stroke-width="4" stroke-linecap="round" />
    <path d="M44,120 h12 M64,120 h12" :stroke="pet.becco" stroke-width="4" stroke-linecap="round" />
  </g>

  <g class="corpo">
    <ellipse cx="60" cy="84" :rx="gufo() ? 30 : 27" ry="31" :fill="pet.manto" />
    <ellipse cx="60" cy="92" :rx="gufo() ? 21 : 18" ry="22" :fill="pet.pancia" />
    <!-- il piumaggio del petto: tre archi appena accennati; nel gufo
         sono le barrature, che sono la sua livrea -->
    <path v-if="gufo()" d="M46,80 q14,8 28,0 M44,90 q16,9 32,0 M46,100 q14,8 28,0"
          stroke="#00000022" stroke-width="2.4" stroke-linecap="round" fill="none" />
    <path v-else d="M48,84 q12,7 24,0 M50,96 q10,6 20,0" stroke="#00000015" stroke-width="2"
          stroke-linecap="round" fill="none" />
  </g>

  <!-- le ali: sbattono piano, e sono l'unica cosa che si muove sempre -->
  <path class="ala sx" d="M33,68 C22,80 24,100 36,106 C41,94 41,78 37,68 Z" :fill="pet.ala" />
  <path class="ala dx" d="M87,68 C98,80 96,100 84,106 C79,94 79,78 83,68 Z" :fill="pet.ala" />

  <g class="testa">
    <!-- i ciuffetti del gufo, o il ciuffo del pappagallo -->
    <template v-if="gufo()">
      <polygon points="40,30 34,8 56,24" :fill="pet.manto" />
      <polygon points="80,30 86,8 64,24" :fill="pet.manto" />
    </template>
    <template v-else-if="pet.ciuffo">
      <path d="M52,24 C50,10 58,6 60,4 C62,10 62,16 60,24 Z" :fill="pet.ciuffo" />
      <path d="M62,24 C66,12 74,10 76,10 C74,18 70,22 66,26 Z" :fill="pet.ciuffo" />
      <path d="M58,24 C52,13 46,12 44,12 C46,19 50,23 54,26 Z" :fill="pet.ciuffo" />
    </template>

    <circle cx="60" cy="44" :r="gufo() ? 27 : 24" :fill="pet.manto" />
    <!-- il disco facciale del gufo, o la guancia chiara del pappagallo -->
    <ellipse v-if="gufo()" cx="60" cy="46" rx="24" ry="21" :fill="pet.pancia" opacity=".75" />
    <ellipse v-else cx="60" cy="52" rx="16" ry="13" :fill="pet.pancia" opacity=".55" />

    <template v-if="felice">
      <path d="M43,42 Q49,35 55,42" stroke="#1b1622" stroke-width="3"
            stroke-linecap="round" fill="none" />
      <path d="M65,42 Q71,35 77,42" stroke="#1b1622" stroke-width="3"
            stroke-linecap="round" fill="none" />
    </template>
    <template v-else-if="gufo()">
      <!-- due occhi enormi, che è tutto il gufo -->
      <g v-for="cx in [47, 73]" :key="cx">
        <circle :cx="cx" cy="42" r="11" fill="#fff" />
        <circle :cx="cx" cy="42" r="7.5" :fill="pet.occhiColore || '#f0a63c'" />
        <circle :cx="cx" cy="42" r="4" :fill="pet.occhi" />
        <circle :cx="cx - 2.4" cy="39.4" r="2" fill="#fff" />
      </g>
    </template>
    <template v-else>
      <g v-for="cx in [49, 71]" :key="cx">
        <circle :cx="cx" cy="41" r="7" fill="#fff" />
        <circle :cx="cx" cy="41" r="4.4" :fill="pet.occhi" />
        <circle :cx="cx - 1.5" cy="39" r="1.6" fill="#fff" />
      </g>
    </template>

    <!-- il becco: piccolo e a punta nel gufo e nel canarino, grosso e
         ricurvo nel pappagallo -->
    <template v-if="gufo() || pet.taglio === 'beccuccio'">
      <polygon points="53,52 67,52 60,66" :fill="pet.becco" />
      <path d="M54,55 h12" stroke="#00000022" stroke-width="1.5" />
    </template>
    <template v-else>
      <path d="M60,68 q-9,-2 -9,-8 q0,-6 9,-6 q9,0 9,6 q0,6 -9,8 Z" :fill="pet.becco" />
      <path d="M51,58 q9,5 18,0 q-1,16 -9,18 q-8,-2 -9,-18 Z" :fill="pet.becco" />
      <path d="M53,60 q7,4 14,0" stroke="#00000033" stroke-width="1.6" fill="none" />
    </template>
  </g>
</template>
