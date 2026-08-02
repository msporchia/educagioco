<script setup>
/* Un gatto disegnato, non un'emoji: le tre emoji di gatto disponibili sono
   lo stesso gatto tre volte, e questi tre devono riconoscersi al volo.
   Manto, macchie, occhi e coda arrivano da data/pets.js.

   Gli id dei ritagli sono per animale, altrimenti tre gatti nella stessa
   pagina si ruberebbero le macchie a vicenda. */
const props = defineProps({
  pet:   { type: Object, required: true },
  stato: { type: String, default: 'normale' },   // sazio | normale | affamato | mangia
  size:  { type: Number, default: 108 },
})

const cTesta = () => 'ct-' + props.pet.id
const cCorpo = () => 'cc-' + props.pet.id
const macchie = dove => props.pet.macchie?.filter(m => m.dove === dove) || []
const felice = () => props.stato === 'sazio' || props.stato === 'mangia'
</script>

<template>
  <svg class="gatto" :class="stato" :width="size" :height="size * 1.05"
       viewBox="0 0 120 126" role="img" :aria-label="pet.nome">
    <defs>
      <clipPath :id="cTesta()"><circle cx="60" cy="46" r="26" /></clipPath>
      <clipPath :id="cCorpo()"><path d="M36,118 C32,88 40,62 60,62 C80,62 88,88 84,118 Z" /></clipPath>
    </defs>

    <!-- coda -->
    <g class="coda">
      <path v-if="pet.coda === 'lunga'" d="M84,110 C104,108 112,86 100,70"
            :stroke="pet.manto" stroke-width="10" stroke-linecap="round" fill="none" />
      <path v-else d="M83,108 C93,106 95,99 92,93"
            :stroke="pet.manto" stroke-width="11" stroke-linecap="round" fill="none" />
    </g>

    <!-- corpo -->
    <g class="corpo">
      <path d="M36,118 C32,88 40,62 60,62 C80,62 88,88 84,118 Z" :fill="pet.manto" />
      <g :clip-path="'url(#' + cCorpo() + ')'">
        <ellipse v-for="(m, i) in macchie('corpo')" :key="i"
                 :cx="m.cx" :cy="m.cy" :rx="m.rx" :ry="m.ry" :fill="m.c" />
      </g>
      <ellipse cx="60" cy="99" rx="15" ry="18" :fill="pet.pancia" opacity=".95" />
      <ellipse cx="47" cy="114" rx="10" ry="6" :fill="pet.pancia" />
      <ellipse cx="73" cy="114" rx="10" ry="6" :fill="pet.pancia" />
      <path d="M44,112 v5 M50,112 v5 M70,112 v5 M76,112 v5"
            stroke="#00000022" stroke-width="1.4" stroke-linecap="round" />
    </g>

    <!-- testa -->
    <g class="testa">
      <polygon points="40,30 34,6 58,22" :fill="pet.manto" />
      <polygon points="80,30 86,6 62,22" :fill="pet.manto" />
      <polygon points="41,28 37,13 51,23" fill="#f2a3b6" />
      <polygon points="79,28 83,13 69,23" fill="#f2a3b6" />

      <circle cx="60" cy="46" r="26" :fill="pet.manto" />
      <g :clip-path="'url(#' + cTesta() + ')'">
        <template v-for="(m, i) in macchie('testa')" :key="i">
          <ellipse v-if="m.blaze" :cx="m.cx" :cy="m.cy" :rx="m.rx" :ry="m.ry" :fill="m.c" />
          <circle v-else :cx="m.cx" :cy="m.cy" :r="m.r" :fill="m.c" />
        </template>
      </g>

      <ellipse cx="60" cy="58" rx="15" ry="9" :fill="pet.pancia" opacity=".92" />

      <!-- occhi: aperti quando ha fame o è tranquillo, socchiusi quando è contento -->
      <template v-if="felice()">
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
  </svg>
</template>

<style scoped>
.gatto { display:block; overflow:visible }
.gatto .testa, .gatto .coda { transform-box:fill-box }
.gatto .testa { transform-origin:50% 92% }
.gatto .coda  { transform-origin:0% 100% }

/* la coda si muove sempre un po': un gatto fermo del tutto sembra un adesivo */
.gatto .coda { animation:coda 3.1s ease-in-out infinite }
@keyframes coda { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(7deg)} }

.gatto.mangia .testa { animation:mastica .26s ease-in-out infinite alternate }
@keyframes mastica { from{transform:translateY(0) scaleY(1)} to{transform:translateY(2px) scaleY(.96)} }

.gatto.affamato { animation:implora 1.7s ease-in-out infinite }
@keyframes implora { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

.gatto.sazio .corpo { animation:respira 3.4s ease-in-out infinite }
@keyframes respira { 0%,100%{transform:translateY(0)} 50%{transform:translateY(1.5px)} }
</style>
