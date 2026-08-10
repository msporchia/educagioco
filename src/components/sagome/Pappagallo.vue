<script setup>
/* IL PAPPAGALLO.

   Visto di fronte, come gli altri: due occhi, due ali che sbattono e il
   becco ricurvo, che è la cosa che fa dire «pappagallo» a chiunque
   prima ancora dei colori. Il ciuffo e la coda a ventaglio prendono il
   colore che il catalogo dà a `ciuffo` e `ala`. */
defineProps({
  pet:    { type: Object, required: true },
  felice: { type: Boolean, default: false },
  uid:    { type: String, default: 'x' },
})
</script>

<template>
  <!-- la coda a ventaglio, dietro tutto -->
  <g class="coda">
    <path d="M60,104 L44,126 L60,118 L76,126 Z" :fill="pet.ala" />
    <path d="M60,106 L52,126 L60,120 L68,126 Z" :fill="pet.manto" opacity=".8" />
  </g>

  <!-- le zampette, sotto il corpo -->
  <g>
    <path d="M50,110 v10 M70,110 v10" :stroke="pet.becco" stroke-width="4" stroke-linecap="round" />
    <path d="M44,120 h12 M64,120 h12" :stroke="pet.becco" stroke-width="4" stroke-linecap="round" />
  </g>

  <g class="corpo">
    <ellipse cx="60" cy="84" rx="27" ry="31" :fill="pet.manto" />
    <ellipse cx="60" cy="92" rx="18" ry="22" :fill="pet.pancia" />
    <!-- il piumaggio del petto: tre archi appena accennati -->
    <path d="M48,84 q12,7 24,0 M50,96 q10,6 20,0" stroke="#00000015" stroke-width="2"
          stroke-linecap="round" fill="none" />
  </g>

  <!-- le ali: sbattono piano, e sono l'unica cosa che si muove sempre -->
  <path class="ala sx" d="M33,68 C22,80 24,100 36,106 C41,94 41,78 37,68 Z" :fill="pet.ala" />
  <path class="ala dx" d="M87,68 C98,80 96,100 84,106 C79,94 79,78 83,68 Z" :fill="pet.ala" />

  <g class="testa">
    <!-- il ciuffo -->
    <path d="M52,24 C50,10 58,6 60,4 C62,10 62,16 60,24 Z" :fill="pet.ciuffo" />
    <path d="M62,24 C66,12 74,10 76,10 C74,18 70,22 66,26 Z" :fill="pet.ciuffo" />
    <path d="M58,24 C52,13 46,12 44,12 C46,19 50,23 54,26 Z" :fill="pet.ciuffo" />

    <circle cx="60" cy="44" r="24" :fill="pet.manto" />
    <ellipse cx="60" cy="52" rx="16" ry="13" :fill="pet.pancia" opacity=".55" />

    <template v-if="felice">
      <path d="M43,42 Q49,35 55,42" stroke="#1b1622" stroke-width="3"
            stroke-linecap="round" fill="none" />
      <path d="M65,42 Q71,35 77,42" stroke="#1b1622" stroke-width="3"
            stroke-linecap="round" fill="none" />
    </template>
    <template v-else>
      <g v-for="cx in [49, 71]" :key="cx">
        <circle :cx="cx" cy="41" r="7" fill="#fff" />
        <circle :cx="cx" cy="41" r="4.4" :fill="pet.occhi" />
        <circle :cx="cx - 1.5" cy="39" r="1.6" fill="#fff" />
      </g>
    </template>

    <!-- il becco, ricurvo: mandibola sotto, punta che scende -->
    <path d="M60,68 q-9,-2 -9,-8 q0,-6 9,-6 q9,0 9,6 q0,6 -9,8 Z" :fill="pet.becco" />
    <path d="M51,58 q9,5 18,0 q-1,16 -9,18 q-8,-2 -9,-18 Z" :fill="pet.becco" />
    <path d="M53,60 q7,4 14,0" stroke="#00000033" stroke-width="1.6" fill="none" />
  </g>
</template>
