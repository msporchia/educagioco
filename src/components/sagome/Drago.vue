<script setup>
/* LE BESTIE CHE NON ESISTONO — draghetti e cuccioli di dinosauro.

   Stessa sagoma, quattro `taglio`, e ognuno cambia solo le tre cose che
   un bambino guarda per dire che animale è:

     drago        ali, corna, e uno sbuffo di fumo dal naso
     dino         niente ali, coda grossa, cresta lungo la schiena
     triceratopo  il collare dietro la testa e le tre corna sul muso
     stego        le placche a rombo sulla schiena e la coda a punte

   Sono cuccioli, non mostri: testa grande, occhi grandi, zampe corte.
   Un drago per bambini deve far venir voglia di dargli da mangiare,
   non paura. */
const props = defineProps({
  pet:    { type: Object, required: true },
  felice: { type: Boolean, default: false },
  uid:    { type: String, default: 'x' },
})

const alato = () => props.pet.taglio === 'drago'
const codaGrossa = () => ['dino', 'triceratopo', 'stego'].includes(props.pet.taglio)
</script>

<template>
  <!-- la coda, dietro -->
  <g class="coda">
    <template v-if="codaGrossa()">
      <path d="M84,112 C104,110 112,96 106,80" :stroke="pet.manto" stroke-width="14"
            stroke-linecap="round" fill="none" />
      <!-- lo stegosauro la porta armata: quattro punte in cima -->
      <template v-if="pet.taglio === 'stego'">
        <path d="M104,80 L114,68 M108,86 L119,78" :stroke="pet.cresta" stroke-width="5"
              stroke-linecap="round" />
      </template>
    </template>
    <template v-else>
      <path d="M86,110 C104,106 110,90 102,78" :stroke="pet.manto" stroke-width="9"
            stroke-linecap="round" fill="none" />
      <path d="M104,84 L114,66 L96,72 Z" :fill="pet.cresta" />
    </template>
  </g>

  <!-- le ali del draghetto: membrane appuntite dietro le spalle -->
  <template v-if="alato()">
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
    <!-- la cresta lungo la schiena, o le placche a rombo dello stego -->
    <template v-if="pet.taglio === 'stego'">
      <path d="M60,58 L48,44 L60,48 Z" :fill="pet.cresta" />
      <path d="M60,58 L72,44 L60,48 Z" :fill="pet.cresta" />
      <path d="M84,80 L92,64 L94,82 Z" :fill="pet.cresta" />
      <path d="M36,80 L28,64 L26,82 Z" :fill="pet.cresta" />
    </template>
    <path v-else d="M60,58 L54,50 L60,52 L66,50 Z" :fill="pet.cresta" />
  </g>

  <g class="testa">
    <!-- il collare del triceratopo: sta dietro la testa, ed è la sua
         intera silhouette -->
    <template v-if="pet.taglio === 'triceratopo'">
      <path d="M60,10 C86,10 98,28 96,48 C90,62 76,68 60,68
               C44,68 30,62 24,48 C22,28 34,10 60,10 Z" :fill="pet.cresta" />
      <path d="M60,14 C82,14 92,30 90,46 C86,58 74,64 60,64
               C46,64 34,58 30,46 C28,30 38,14 60,14 Z" :fill="pet.manto" opacity=".35" />
    </template>
    <!-- corna (drago), punte della cresta (dino), niente per gli altri -->
    <template v-if="pet.taglio === 'dino'">
      <path d="M46,20 L52,8 L58,20 Z" :fill="pet.cresta" />
      <path d="M62,20 L68,8 L74,20 Z" :fill="pet.cresta" />
    </template>
    <template v-else-if="alato()">
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

    <!-- le tre corna del triceratopo: due sopra gli occhi e una sul
         naso, che è quello che lo distingue da tutti gli altri -->
    <template v-if="pet.taglio === 'triceratopo'">
      <path d="M44,32 L40,14 L52,30 Z" :fill="pet.corna || '#f6efe0'" />
      <path d="M76,32 L80,14 L68,30 Z" :fill="pet.corna || '#f6efe0'" />
      <path d="M56,54 L60,42 L64,54 Z" :fill="pet.corna || '#f6efe0'" />
      <path d="M46,66 q14,6 28,0 q-2,8 -14,8 q-12,0 -14,-8 Z" :fill="pet.pancia" />
    </template>

    <!-- narici e bocca: due puntini e un sorriso storto coi dentini -->
    <circle cx="54" cy="56" r="2" fill="#00000055" />
    <circle cx="66" cy="56" r="2" fill="#00000055" />
    <path d="M50,64 q10,7 20,0" stroke="#00000066" stroke-width="2.2"
          stroke-linecap="round" fill="none" />
    <path d="M53,65 L55,69 L57,65 M63,65 L65,69 L67,65" fill="#fffdf8" />

    <!-- lo sbuffo di fumo: solo i draghetti, e solo quando sono contenti -->
    <g v-if="felice && alato()" class="fumo">
      <circle cx="76" cy="54" r="3.5" fill="#ffffff" opacity=".7" />
      <circle cx="83" cy="49" r="2.6" fill="#ffffff" opacity=".55" />
      <circle cx="88" cy="45" r="1.8" fill="#ffffff" opacity=".4" />
    </g>
  </g>
</template>
