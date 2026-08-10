<script setup>
/* IL GATTO.

   Una sagoma sola per tutti: quello che cambia sono le macchie (che il
   catalogo elenca una per una), le strisce del soriano e il colore
   della coda — nel siamese è scura come il musetto, ed è la cosa che lo
   fa riconoscere prima di tutte le altre.

   `pelo: 'lungo'` è il persiano: un collare di ciuffi attorno alla
   testa e la coda a pennacchio. Non è una sagoma nuova, è la stessa con
   il contorno sfrangiato — che è poi come si riconosce un gatto a pelo
   lungo anche dal vero. */
const props = defineProps({
  pet:    { type: Object, required: true },
  felice: { type: Boolean, default: false },
  uid:    { type: String, default: 'x' },
})

const macchie = dove => props.pet.macchie?.filter(m => m.dove === dove) || []
</script>

<template>
  <defs>
    <clipPath :id="'ct-' + uid"><circle cx="60" cy="46" r="26" /></clipPath>
    <clipPath :id="'cc-' + uid"><path d="M36,118 C32,88 40,62 60,62 C80,62 88,88 84,118 Z" /></clipPath>
  </defs>

  <g class="coda">
    <path v-if="pet.coda === 'lunga' || pet.coda === 'scura'"
          d="M84,110 C104,108 112,86 100,70"
          :stroke="pet.codaColore || pet.manto"
          :stroke-width="pet.pelo === 'lungo' ? 16 : 10"
          stroke-linecap="round" fill="none" />
    <path v-else d="M83,108 C93,106 95,99 92,93"
          :stroke="pet.codaColore || pet.manto"
          :stroke-width="pet.pelo === 'lungo' ? 16 : 11"
          stroke-linecap="round" fill="none" />
  </g>

  <g class="corpo">
    <!-- il pelo lungo: ciuffi tutt'intorno alla sagoma, sotto di essa -->
    <circle v-for="(c, i) in (pet.pelo === 'lungo' ?
                              [[34,80,9],[33,94,9],[36,108,9],[86,80,9],[87,94,9],[84,108,9],
                               [44,118,9],[60,120,9],[76,118,9]] : [])" :key="'cf'+i"
            :cx="c[0]" :cy="c[1]" :r="c[2]" :fill="pet.manto" />
    <path d="M36,118 C32,88 40,62 60,62 C80,62 88,88 84,118 Z" :fill="pet.manto" />
    <g :clip-path="'url(#cc-' + uid + ')'">
      <ellipse v-for="(m, i) in macchie('corpo')" :key="i"
               :cx="m.cx" :cy="m.cy" :rx="m.rx" :ry="m.ry" :fill="m.c" />
      <!-- le strisce del soriano: archi larghi, non righe dritte -->
      <path v-if="pet.strisce" d="M34,74 q26,10 52,0 M32,88 q28,11 56,0 M33,102 q27,11 54,0"
            :stroke="pet.strisce" stroke-width="4" stroke-linecap="round" fill="none"
            opacity=".85" />
    </g>
    <ellipse cx="60" cy="99" rx="15" ry="18" :fill="pet.pancia" opacity=".95" />
    <ellipse cx="47" cy="114" rx="10" ry="6" :fill="pet.pancia" />
    <ellipse cx="73" cy="114" rx="10" ry="6" :fill="pet.pancia" />
    <path d="M44,112 v5 M50,112 v5 M70,112 v5 M76,112 v5"
          stroke="#00000022" stroke-width="1.4" stroke-linecap="round" />
  </g>

  <g class="testa">
    <!-- nel siamese le orecchie sono scure come il musetto: è la prima
         cosa che si guarda per riconoscerlo -->
    <polygon points="40,30 34,6 58,22" :fill="pet.orecchie || pet.manto" />
    <polygon points="80,30 86,6 62,22" :fill="pet.orecchie || pet.manto" />
    <polygon points="41,28 37,13 51,23" fill="#f2a3b6" />
    <polygon points="79,28 83,13 69,23" fill="#f2a3b6" />

    <!-- il collare di pelo del persiano: sta sotto la testa, e la fa
         sembrare il doppio -->
    <circle v-for="(c, i) in (pet.pelo === 'lungo' ?
                              [[34,50,11],[38,68,10],[86,50,11],[82,68,10],
                               [46,74,10],[60,78,10],[74,74,10],[42,26,10],[78,26,10]] : [])"
            :key="'ct'+i" :cx="c[0]" :cy="c[1]" :r="c[2]" :fill="pet.manto" />
    <circle cx="60" cy="46" r="26" :fill="pet.manto" />
    <g :clip-path="'url(#ct-' + uid + ')'">
      <template v-for="(m, i) in macchie('testa')" :key="i">
        <ellipse v-if="m.blaze || m.rx" :cx="m.cx" :cy="m.cy" :rx="m.rx" :ry="m.ry" :fill="m.c" />
        <circle v-else :cx="m.cx" :cy="m.cy" :r="m.r" :fill="m.c" />
      </template>
      <path v-if="pet.strisce" d="M46,24 v10 M60,20 v11 M74,24 v10"
            :stroke="pet.strisce" stroke-width="4" stroke-linecap="round" opacity=".85" />
    </g>

    <ellipse cx="60" cy="58" rx="15" ry="9" :fill="pet.pancia" opacity=".92" />

    <template v-if="felice">
      <path d="M44,44 Q50,36 56,44" stroke="#1b1622" stroke-width="3"
            stroke-linecap="round" fill="none" />
      <path d="M64,44 Q70,36 76,44" stroke="#1b1622" stroke-width="3"
            stroke-linecap="round" fill="none" />
    </template>
    <template v-else>
      <g v-for="cx in [50, 70]" :key="cx">
        <ellipse :cx="cx" cy="42" rx="6.5" ry="7.5" fill="#fff" />
        <circle :cx="cx" cy="42" r="4.8" :fill="pet.occhi" />
        <ellipse :cx="cx" cy="42" rx="1.9" ry="4.4" fill="#1b1622" />
        <circle :cx="cx - 2" cy="39.4" r="1.7" fill="#fff" />
      </g>
    </template>

    <polygon points="56,55 64,55 60,61" fill="#ef9aae" />
    <path d="M60,61 Q55,67 51,63 M60,61 Q65,67 69,63"
          stroke="#00000055" stroke-width="2" stroke-linecap="round" fill="none" />
    <path d="M45,58 L24,53 M45,61 L23,62 M45,64 L25,70
             M75,58 L96,53 M75,61 L97,62 M75,64 L95,70"
          stroke="#00000030" stroke-width="1.5" stroke-linecap="round" />
  </g>
</template>
