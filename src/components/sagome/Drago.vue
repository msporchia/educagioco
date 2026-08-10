<script setup>
/* LE BESTIE CHE NON ESISTONO — draghetto e cucciolo di dinosauro.

   Stessa sagoma, due `taglio`: il draghetto ha le ali e le corna e
   sbuffa fumo dal naso, il dinosauro no e in cambio ha una coda grossa e
   la cresta lungo la schiena. Sono cuccioli, non mostri: testa grande,
   occhi grandi, zampe corte. Un drago per bambini deve far venir voglia
   di dargli da mangiare, non paura. */
defineProps({
  pet:    { type: Object, required: true },
  felice: { type: Boolean, default: false },
  uid:    { type: String, default: 'x' },
})
</script>

<template>
  <!-- la coda, dietro -->
  <g class="coda">
    <path v-if="pet.taglio === 'dino'" d="M84,112 C104,110 112,96 106,80"
          :stroke="pet.manto" stroke-width="14" stroke-linecap="round" fill="none" />
    <template v-else>
      <path d="M86,110 C104,106 110,90 102,78" :stroke="pet.manto" stroke-width="9"
            stroke-linecap="round" fill="none" />
      <path d="M104,84 L114,66 L96,72 Z" :fill="pet.cresta" />
    </template>
  </g>

  <!-- le ali del draghetto: membrane appuntite dietro le spalle -->
  <template v-if="pet.taglio !== 'dino'">
    <path class="ala sx" d="M40,70 C18,52 8,58 10,62 C4,64 14,78 22,80 C16,86 30,92 40,86 Z"
          :fill="pet.ala" stroke="#00000018" stroke-width="1.5" />
    <path class="ala dx" d="M80,70 C102,52 112,58 110,62 C116,64 106,78 98,80 C104,86 90,92 80,86 Z"
          :fill="pet.ala" stroke="#00000018" stroke-width="1.5" />
  </template>

  <g class="corpo">
    <path d="M32,118 C28,88 38,58 60,58 C82,58 92,88 88,118 Z" :fill="pet.manto" />
    <!-- la pancia a scaglie: fasce chiare, che è come si disegna un
         drago da quando esistono i draghi -->
    <ellipse cx="60" cy="96" rx="19" ry="22" :fill="pet.pancia" />
    <path d="M43,84 h34 M42,94 h36 M43,104 h34 M46,113 h28"
          stroke="#00000018" stroke-width="1.6" stroke-linecap="round" />
    <!-- zampe con le unghiette -->
    <ellipse cx="45" cy="116" rx="12" ry="7" :fill="pet.pancia" />
    <ellipse cx="75" cy="116" rx="12" ry="7" :fill="pet.pancia" />
    <path d="M38,116 v5 M45,117 v5 M52,116 v5 M68,116 v5 M75,117 v5 M82,116 v5"
          stroke="#00000044" stroke-width="1.6" stroke-linecap="round" />
    <!-- la cresta lungo la schiena -->
    <path d="M60,58 L54,50 L60,52 L66,50 Z" :fill="pet.cresta" />
  </g>

  <g class="testa">
    <!-- corna (drago) o punte della cresta (dino) -->
    <template v-if="pet.taglio === 'dino'">
      <path d="M46,20 L52,8 L58,20 Z" :fill="pet.cresta" />
      <path d="M62,20 L68,8 L74,20 Z" :fill="pet.cresta" />
    </template>
    <template v-else>
      <path d="M40,26 C34,14 36,8 40,6 C44,12 46,18 48,24 Z" :fill="pet.cresta" />
      <path d="M80,26 C86,14 84,8 80,6 C76,12 74,18 72,24 Z" :fill="pet.cresta" />
    </template>

    <circle cx="60" cy="44" r="27" :fill="pet.manto" />
    <!-- il muso sporge, più chiaro -->
    <ellipse cx="60" cy="60" rx="17" ry="12" :fill="pet.pancia" />

    <template v-if="felice">
      <path d="M42,42 Q49,33 56,42" stroke="#1b1622" stroke-width="3"
            stroke-linecap="round" fill="none" />
      <path d="M64,42 Q71,33 78,42" stroke="#1b1622" stroke-width="3"
            stroke-linecap="round" fill="none" />
    </template>
    <template v-else>
      <g v-for="cx in [49, 71]" :key="cx">
        <ellipse :cx="cx" cy="41" rx="7" ry="7.5" fill="#fff" />
        <ellipse :cx="cx" cy="41" rx="4.6" ry="5.4" :fill="pet.occhi" />
        <ellipse :cx="cx" cy="41" rx="1.8" ry="4.6" fill="#1b1622" />
        <circle :cx="cx - 2" cy="38.6" r="1.6" fill="#fff" />
      </g>
    </template>

    <!-- narici e bocca: due puntini e un sorriso storto coi dentini -->
    <circle cx="54" cy="56" r="2" fill="#00000055" />
    <circle cx="66" cy="56" r="2" fill="#00000055" />
    <path d="M50,64 q10,7 20,0" stroke="#00000066" stroke-width="2.2"
          stroke-linecap="round" fill="none" />
    <path d="M53,65 L55,69 L57,65 M63,65 L65,69 L67,65" fill="#fffdf8" />

    <!-- lo sbuffo di fumo: solo il draghetto, e solo quando è contento -->
    <g v-if="felice && pet.taglio !== 'dino'" class="fumo">
      <circle cx="76" cy="54" r="3.5" fill="#ffffff" opacity=".7" />
      <circle cx="83" cy="49" r="2.6" fill="#ffffff" opacity=".55" />
      <circle cx="88" cy="45" r="1.8" fill="#ffffff" opacity=".4" />
    </g>
  </g>
</template>
