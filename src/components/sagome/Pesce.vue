<script setup>
/* IL PESCIOLINO — che è mezzo disegno di boccia.

   Un pesce sul tappeto non sta in piedi: la boccia non è scenografia, è
   il posto dove vive, e disegnarla insieme a lui è il solo modo perché
   la cameretta resti una cameretta. Il pesce ondeggia dentro (`.pescetto`),
   le bollicine salgono, il vetro sta sopra a tutto con un riflesso. */
defineProps({
  pet:    { type: Object, required: true },
  felice: { type: Boolean, default: false },
  uid:    { type: String, default: 'x' },
})
</script>

<template>
  <defs>
    <clipPath :id="'cb-' + uid"><circle cx="60" cy="72" r="41" /></clipPath>
  </defs>

  <!-- il piedistallo, dietro il vetro -->
  <ellipse cx="60" cy="116" rx="30" ry="9" fill="#cfe0ea" />
  <ellipse cx="60" cy="113" rx="24" ry="7" fill="#e6f1f7" />

  <circle cx="60" cy="72" r="41" fill="#dff2fb" />

  <g :clip-path="'url(#cb-' + uid + ')'">
    <!-- l'acqua non arriva all'orlo: una boccia piena fino al bordo
         sembra un cerchio azzurro e basta -->
    <path d="M19,52 q20,-7 41,0 q21,7 41,0 V113 H19 Z" fill="#bfe6f7" opacity=".85" />
    <!-- il fondo: sassolini e un'alga -->
    <path d="M40,112 q6,-26 3,-34" stroke="#6cc08a" stroke-width="5"
          stroke-linecap="round" fill="none" />
    <path d="M48,112 q10,-18 6,-24" stroke="#8fd6a2" stroke-width="4"
          stroke-linecap="round" fill="none" />
    <ellipse cx="60" cy="110" rx="34" ry="8" fill="#e7d7b4" />
    <circle cx="46" cy="106" r="5" fill="#cbb894" />
    <circle cx="70" cy="108" r="6" fill="#d7c5a2" />
    <circle cx="82" cy="105" r="4" fill="#cbb894" />

    <!-- le bollicine -->
    <circle class="bolla b1" cx="86" cy="90" r="3" fill="#ffffff" opacity=".8" />
    <circle class="bolla b2" cx="92" cy="94" r="2" fill="#ffffff" opacity=".7" />
    <circle class="bolla b3" cx="80" cy="96" r="2.4" fill="#ffffff" opacity=".75" />

    <!-- ═══ il pesce ═══ -->
    <g class="pescetto">
      <!-- coda: a ventaglio, o il velo lungo del combattente -->
      <path v-if="pet.velo" d="M36,72 C16,44 6,60 10,72 C6,86 16,102 36,72 Z"
            :fill="pet.pinna" opacity=".85" />
      <path v-else d="M34,72 L18,60 L20,72 L18,86 Z" :fill="pet.pinna" />
      <!-- pinna dorsale -->
      <path v-if="pet.velo" d="M50,52 C38,36 74,34 74,54 Z" :fill="pet.pinna" opacity=".85" />
      <path v-else d="M56,50 L46,58 L68,58 Z" :fill="pet.pinna" />
      <ellipse cx="62" cy="72" rx="28" ry="19" :fill="pet.manto" />
      <ellipse cx="66" cy="78" rx="20" ry="11" :fill="pet.pancia" opacity=".8" />
      <path v-if="pet.strisce" d="M56,56 q-4,16 0,32 M70,55 q-4,17 0,34"
            :stroke="pet.strisce" stroke-width="5" stroke-linecap="round"
            fill="none" opacity=".9" />
      <!-- le bande larghe del pesce pagliaccio, bordate di scuro -->
      <template v-if="pet.bande">
        <path d="M52,55 q-5,17 0,34 M72,54 q-5,18 0,36" :stroke="pet.bande"
              stroke-width="8" stroke-linecap="round" fill="none" />
        <path d="M52,55 q-5,17 0,34 M72,54 q-5,18 0,36" stroke="#00000033"
              stroke-width="11" stroke-linecap="round" fill="none" opacity=".35" />
        <path d="M52,55 q-5,17 0,34 M72,54 q-5,18 0,36" :stroke="pet.bande"
              stroke-width="7" stroke-linecap="round" fill="none" />
      </template>
      <!-- pinna laterale, che batte -->
      <path class="pinna" d="M62,80 q10,4 12,12 q-12,0 -16,-8 Z" :fill="pet.pinna" />
      <!-- occhio e bocca -->
      <circle cx="80" cy="68" r="6" fill="#fff" />
      <circle cx="81" cy="68" r="3.4" :fill="pet.occhi" />
      <circle cx="79.6" cy="66.6" r="1.3" fill="#fff" />
      <path v-if="felice" d="M86,77 q4,3 7,0" stroke="#00000055" stroke-width="2"
            stroke-linecap="round" fill="none" />
      <circle v-else cx="89" cy="77" r="3" fill="none" stroke="#00000044" stroke-width="2" />
    </g>
  </g>

  <!-- il vetro: bordo e riflesso, sopra a tutto -->
  <circle cx="60" cy="72" r="41" fill="none" stroke="#ffffffcc" stroke-width="5" />
  <circle cx="60" cy="72" r="41" fill="none" stroke="#9fd0e8" stroke-width="1.5" opacity=".7" />
  <path d="M34,46 q-12,12 -10,28" stroke="#ffffff" stroke-width="6"
        stroke-linecap="round" fill="none" opacity=".75" />
  <ellipse cx="60" cy="31" rx="30" ry="7" fill="none" stroke="#ffffffcc" stroke-width="4" />
</template>
