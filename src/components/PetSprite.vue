<script setup>
/* Gli animali sono disegnati, non presi dalle emoji: le tre emoji di gatto
   disponibili sono lo stesso gatto tre volte, e un bobtail non c'è proprio.
   Manto, macchie, occhi e coda arrivano da data/pets.js; `specie` sceglie
   quale delle due sagome disegnare.

   Gli id dei ritagli sono per animale, altrimenti tre bestie nella stessa
   pagina si ruberebbero le macchie a vicenda. */
import { computed } from 'vue'
import { ANCORE } from '../data/pets.js'

const props = defineProps({
  pet:   { type: Object, required: true },
  // contento | normale | chiede | mangia | gioca | lavato
  stato: { type: String, default: 'normale' },
  size:  { type: Number, default: 108 },
  // { testa: '🎩', occhi: '🕶️', collo: '🎀', schiena: '🎒' }, tutti facoltativi
  addosso: { type: Object, default: () => ({}) },
})

const cTesta = () => 'ct-' + props.pet.id
const cCorpo = () => 'cc-' + props.pet.id
const macchie = dove => props.pet.macchie?.filter(m => m.dove === dove) || []
const felice = () => ['contento', 'mangia', 'gioca', 'lavato'].includes(props.stato)

/* Gli accessori sono emoji appoggiate sul disegno, non nuovi tracciati: è
   la stessa scelta fatta per tutte le icone del gioco, e settantadue
   sagome disegnate a mano non le finiremmo mai. Le coordinate stanno in
   data/pets.js, una serie per specie. */
const indossati = computed(() => {
  const ancore = ANCORE[props.pet.specie] || {}
  return Object.entries(props.addosso || {})
    .filter(([posto, e]) => e && ancore[posto])
    .map(([posto, e]) => ({ posto, e, x: ancore[posto][0], y: ancore[posto][1], dim: ancore[posto][2] }))
})
</script>

<template>
  <svg class="bestia" :class="[stato, pet.specie]" :width="size" :height="size * 1.05"
       viewBox="0 0 120 126" role="img" :aria-label="pet.nome">

    <!-- ═══════════════ CANE: il bobtail, tutto pelo e niente coda ═══════════════ -->
    <template v-if="pet.specie === 'cane'">
      <defs>
        <clipPath :id="cTesta()"><circle cx="60" cy="44" r="27" /></clipPath>
      </defs>

      <!-- moncone di coda: nel bobtail è quello che resta -->
      <circle cx="88" cy="104" r="8" :fill="pet.manto" />

      <g class="corpo">
        <path d="M30,118 C24,86 34,58 60,58 C86,58 96,86 90,118 Z" :fill="pet.manto" />
        <!-- ciuffi lungo il bordo: è il pelo arruffato a fare il bobtail -->
        <circle v-for="(c, i) in [[29,98,8],[28,86,7],[33,74,7],[91,98,8],[92,86,7],[87,74,7],
                                  [38,116,9],[52,119,9],[68,119,9],[82,116,9]]" :key="'f'+i"
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
        <!-- orecchie a penzoloni, sotto la testa così restano dietro -->
        <path d="M34,32 C20,34 16,54 25,68 C34,75 41,65 41,50 Z" :fill="pet.manto" />
        <path d="M86,32 C100,34 104,54 95,68 C86,75 79,65 79,50 Z" :fill="pet.manto" />

        <circle cx="60" cy="44" r="27" :fill="pet.pancia" />

        <!-- la frangia: nel bobtail il pelo cade sugli occhi. Li lasciamo
             sbucare appena, perché è con gli occhi che si capisce come sta -->
        <g :clip-path="'url(#' + cTesta() + ')'">
          <path d="M31,14 H89 V44 Q84,54 79,44 Q74,55 69,44 Q64,56 59,44
                   Q54,55 49,44 Q44,54 39,44 Q34,53 31,44 Z" :fill="pet.frangia" />
          <path d="M44,20 V42 M56,18 V44 M68,18 V44 M80,20 V42"
                stroke="#00000012" stroke-width="2" stroke-linecap="round" />
        </g>

        <!-- occhi -->
        <template v-if="felice()">
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

        <!-- muso, tartufo e bocca -->
        <ellipse cx="60" cy="62" rx="14" ry="9.5" :fill="pet.pancia" />
        <ellipse cx="60" cy="58" rx="7.5" ry="5.5" fill="#2b2b33" />
        <path d="M60,63 Q54,71 48,67 M60,63 Q66,71 72,67"
              stroke="#00000066" stroke-width="2.2" stroke-linecap="round" fill="none" />
        <ellipse v-if="felice()" cx="60" cy="72" rx="5" ry="7.5" fill="#f08a9b" />
      </g>
    </template>

    <!-- ═══════════════ GATTO ═══════════════ -->
    <template v-else>
      <defs>
        <clipPath :id="cTesta()"><circle cx="60" cy="46" r="26" /></clipPath>
        <clipPath :id="cCorpo()"><path d="M36,118 C32,88 40,62 60,62 C80,62 88,88 84,118 Z" /></clipPath>
      </defs>

      <g class="coda">
        <path v-if="pet.coda === 'lunga'" d="M84,110 C104,108 112,86 100,70"
              :stroke="pet.manto" stroke-width="10" stroke-linecap="round" fill="none" />
        <path v-else d="M83,108 C93,106 95,99 92,93"
              :stroke="pet.manto" stroke-width="11" stroke-linecap="round" fill="none" />
      </g>

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
    </template>

    <!-- gli accessori vanno per ultimi: stanno sopra tutto il resto -->
    <text v-for="a in indossati" :key="a.posto" class="addosso"
          :x="a.x" :y="a.y" :font-size="a.dim" text-anchor="middle">{{ a.e }}</text>
  </svg>
</template>

<style scoped>
.bestia { display:block; overflow:visible }
.bestia .testa, .bestia .coda { transform-box:fill-box }
.bestia .testa { transform-origin:50% 92% }
.bestia .coda  { transform-origin:0% 100% }

/* la coda si muove sempre un po': un gatto fermo del tutto sembra un adesivo */
.bestia .coda { animation:coda 3.1s ease-in-out infinite }
@keyframes coda { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(7deg)} }

/* il bobtail la coda non ce l'ha: a scodinzolare è tutto il posteriore */
.bestia.cane .corpo { transform-box:fill-box; transform-origin:50% 20%;
                      animation:sedere 2.4s ease-in-out infinite }
@keyframes sedere { 0%,100%{transform:rotate(-1.4deg)} 50%{transform:rotate(1.4deg)} }

.bestia.mangia .testa { animation:mastica .26s ease-in-out infinite alternate }
@keyframes mastica { from{transform:translateY(0) scaleY(1)} to{transform:translateY(2px) scaleY(.96)} }

/* chiede: qualunque cosa gli manchi, il gesto è lo stesso — saltella */
.bestia.chiede { animation:implora 1.7s ease-in-out infinite }
@keyframes implora { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

.bestia.contento .corpo { animation:respira 3.4s ease-in-out infinite }
@keyframes respira { 0%,100%{transform:translateY(0)} 50%{transform:translateY(1.5px)} }
/* contento il cane rallenta lo scodinzolio invece di fermarlo */
.bestia.cane.contento .corpo { animation:sedere 4.2s ease-in-out infinite }

/* giocare è una cosa di tutto il corpo, il bagnetto una scrollata di testa */
.bestia.gioca { animation:salterella .42s ease-in-out infinite alternate }
@keyframes salterella { from{transform:translateY(0) rotate(-3deg)} to{transform:translateY(-7px) rotate(3deg)} }
.bestia.lavato .testa { animation:scrolla .18s ease-in-out infinite alternate }
@keyframes scrolla { from{transform:rotate(-4deg)} to{transform:rotate(4deg)} }

/* gli accessori non intercettano i tocchi: sotto c'è la scheda da scegliere */
.addosso { pointer-events:none; paint-order:stroke;
           filter:drop-shadow(0 1px 1px #00000033) }
</style>
