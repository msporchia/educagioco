<script setup>
/* IL CANE, in sei tagli.

   La sagoma è una sola — un cucciolo seduto, tondo — e il `taglio`
   cambia le tre cose che fanno riconoscere una razza a un bambino: le
   orecchie, il pelo e la coda. Il bobtail ha il pelo arruffato e il
   moncone, il bassotto le orecchie lunghe fino a terra, il barboncino i
   pon-pon, il lupo le orecchie dritte e il musetto scuro, il chihuahua
   due orecchie più grandi della testa. Tutto il resto è colore, e il
   colore sta in data/pets.js.

   `muso` e `sella` sono facoltativi: il primo scurisce il musetto (il
   pastore, la maschera dell'husky), la seconda mette il mantello scuro
   sulla schiena. Chi non li dichiara resta di un colore solo. */
defineProps({
  pet:    { type: Object, required: true },
  felice: { type: Boolean, default: false },
  uid:    { type: String, default: 'x' },
})
</script>

<template>
  <defs>
    <clipPath :id="'ct-' + uid"><circle cx="60" cy="44" r="27" /></clipPath>
    <clipPath :id="'cc-' + uid">
      <path d="M30,118 C24,86 34,58 60,58 C86,58 96,86 90,118 Z" />
    </clipPath>
  </defs>

  <!-- la coda: moncone, dritta, col pon-pon o a pennacchio -->
  <g class="coda">
    <circle v-if="pet.taglio === 'bobtail'" cx="88" cy="104" r="8" :fill="pet.manto" />
    <template v-else-if="pet.taglio === 'riccio'">
      <path d="M86,108 C98,104 100,92 96,84" :stroke="pet.manto" stroke-width="7"
            stroke-linecap="round" fill="none" />
      <circle cx="96" cy="80" r="9" :fill="pet.manto" />
    </template>
    <template v-else-if="pet.taglio === 'lupo'">
      <path d="M86,110 C102,110 110,96 104,82" :stroke="pet.manto" stroke-width="13"
            stroke-linecap="round" fill="none" />
      <path d="M100,86 C106,92 108,100 104,106" :stroke="pet.pancia" stroke-width="6"
            stroke-linecap="round" fill="none" opacity=".8" />
    </template>
    <path v-else d="M86,110 C98,108 104,98 102,88" :stroke="pet.manto" stroke-width="9"
          stroke-linecap="round" fill="none" />
  </g>

  <g class="corpo">
    <path d="M30,118 C24,86 34,58 60,58 C86,58 96,86 90,118 Z" :fill="pet.manto" />
    <!-- il mantello scuro sulla schiena: è quello che fa il pastore -->
    <path v-if="pet.sella" :clip-path="'url(#cc-' + uid + ')'"
          d="M26,54 H94 V96 q-17,-12 -34,-12 q-17,0 -34,12 Z" :fill="pet.sella" />
    <!-- ciuffi lungo il bordo: è il pelo arruffato a fare il bobtail, e i
         riccioli a fare il barboncino. Le razze a pelo liscio restano
         senza. -->
    <circle v-for="(c, i) in (['bobtail', 'riccio'].includes(pet.taglio) ?
                              [[29,98,8],[28,86,7],[33,74,7],[91,98,8],[92,86,7],[87,74,7],
                               [38,116,9],[52,119,9],[68,119,9],[82,116,9]] : [])" :key="'f'+i"
            :cx="c[0]" :cy="c[1]" :r="c[2]" :fill="pet.manto" />
    <ellipse cx="60" cy="96" rx="20" ry="22" :fill="pet.pancia" />
    <circle v-for="(c, i) in [[46,106,9],[60,111,9],[74,106,9]]" :key="'p'+i"
            :cx="c[0]" :cy="c[1]" :r="c[2]" :fill="pet.pancia" />
    <ellipse cx="46" cy="116" rx="11" ry="7" :fill="pet.pancia" />
    <ellipse cx="74" cy="116" rx="11" ry="7" :fill="pet.pancia" />
    <path d="M42,114 v5 M50,114 v5 M70,114 v5 M78,114 v5"
          stroke="#00000022" stroke-width="1.4" stroke-linecap="round" />
  </g>

  <g class="testa">
    <!-- orecchie, sotto la testa così restano dietro -->
    <template v-if="pet.taglio === 'orecchione'">
      <path d="M33,34 C16,40 14,74 26,88 C38,92 42,72 42,50 Z" :fill="pet.orecchie || pet.manto" />
      <path d="M87,34 C104,40 106,74 94,88 C82,92 78,72 78,50 Z" :fill="pet.orecchie || pet.manto" />
    </template>
    <template v-else-if="pet.taglio === 'riccio'">
      <circle cx="30" cy="52" r="14" :fill="pet.manto" />
      <circle cx="90" cy="52" r="14" :fill="pet.manto" />
      <circle cx="34" cy="38" r="11" :fill="pet.manto" />
      <circle cx="86" cy="38" r="11" :fill="pet.manto" />
    </template>
    <!-- dritte a punta: il lupo. Sono la cosa che si guarda per prima -->
    <template v-else-if="pet.taglio === 'lupo'">
      <polygon points="38,34 32,4 60,24" :fill="pet.orecchie || pet.manto" />
      <polygon points="82,34 88,4 60,24" :fill="pet.orecchie || pet.manto" />
      <polygon points="40,32 36,13 53,25" fill="#f2a3b6" />
      <polygon points="80,32 84,13 67,25" fill="#f2a3b6" />
    </template>
    <!-- più grandi della testa: il chihuahua è tutto orecchie -->
    <template v-else-if="pet.taglio === 'chihuahua'">
      <polygon points="34,42 14,6 58,24" :fill="pet.orecchie || pet.manto" />
      <polygon points="86,42 106,6 62,24" :fill="pet.orecchie || pet.manto" />
      <polygon points="36,38 22,15 52,27" fill="#f2a3b6" />
      <polygon points="84,38 98,15 68,27" fill="#f2a3b6" />
    </template>
    <template v-else>
      <path d="M34,32 C20,34 16,54 25,68 C34,75 41,65 41,50 Z" :fill="pet.orecchie || pet.manto" />
      <path d="M86,32 C100,34 104,54 95,68 C86,75 79,65 79,50 Z" :fill="pet.orecchie || pet.manto" />
    </template>

    <circle cx="60" cy="44" r="27" :fill="pet.pancia" />
    <!-- la maschera: nell'husky e nel pastore la faccia è di due colori,
         ed è metà del ritratto -->
    <g v-if="pet.muso" :clip-path="'url(#ct-' + uid + ')'">
      <path d="M33,10 H87 V44 q-9,10 -14,-2 q-6,12 -13,-1 q-7,13 -13,1 q-5,12 -14,2 Z"
            :fill="pet.muso" />
    </g>
    <!-- il ciuffo del barboncino: un cappello di riccioli -->
    <template v-if="pet.taglio === 'riccio'">
      <circle v-for="(c, i) in [[46,24,10],[60,18,11],[74,24,10],[52,16,8],[68,16,8]]" :key="'r'+i"
              :cx="c[0]" :cy="c[1]" :r="c[2]" :fill="pet.manto" />
    </template>

    <!-- la frangia: nel bobtail il pelo cade sugli occhi. Li lasciamo
         sbucare appena, perché è con gli occhi che si capisce come sta -->
    <g v-if="pet.frangia" :clip-path="'url(#ct-' + uid + ')'">
      <path d="M31,14 H89 V44 Q84,54 79,44 Q74,55 69,44 Q64,56 59,44
               Q54,55 49,44 Q44,54 39,44 Q34,53 31,44 Z" :fill="pet.frangia" />
      <path d="M44,20 V42 M56,18 V44 M68,18 V44 M80,20 V42"
            stroke="#00000012" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- occhi -->
    <template v-if="felice">
      <path d="M43,50 Q49,43 55,50" :stroke="pet.occhi" stroke-width="3"
            stroke-linecap="round" fill="none" />
      <path d="M65,50 Q71,43 77,50" :stroke="pet.occhi" stroke-width="3"
            stroke-linecap="round" fill="none" />
    </template>
    <template v-else>
      <g v-for="cx in [49, 71]" :key="cx">
        <circle :cx="cx" cy="49" r="5" :fill="pet.occhi" />
        <circle :cx="cx - 1.6" cy="47" r="1.8" fill="#fff" />
      </g>
    </template>

    <!-- muso, tartufo e bocca: il bassotto e il lupo ce l'hanno lungo,
         gli altri corto -->
    <ellipse cx="60" :cy="['orecchione', 'lupo'].includes(pet.taglio) ? 64 : 62"
             :rx="['orecchione', 'lupo'].includes(pet.taglio) ? 11 : 14"
             :ry="['orecchione', 'lupo'].includes(pet.taglio) ? 12 : 9.5" :fill="pet.pancia" />
    <ellipse cx="60" :cy="['orecchione', 'lupo'].includes(pet.taglio) ? 57 : 58"
             rx="7.5" ry="5.5" fill="#2b2b33" />
    <path d="M60,63 Q54,71 48,67 M60,63 Q66,71 72,67"
          stroke="#00000066" stroke-width="2.2" stroke-linecap="round" fill="none" />
    <ellipse v-if="felice" cx="60" cy="72" rx="5" ry="7.5" fill="#f08a9b" />
  </g>
</template>
