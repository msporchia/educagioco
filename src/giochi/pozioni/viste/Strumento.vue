<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UN ATTREZZO, DISEGNATO

   Non un'emoji: una bilancia disegnata si riconosce come bilancia, si
   fa più grande per la taglia più grande e si riempie di quello che ci
   si mette sopra. Riceve fatti già decisi — il gesto, la taglia, quanto
   è pieno — e non sa niente di dosi e di unità.

     gesto    pesa | versa | taglia
     taglia   P | M | G — la P è piccola e la G è grossa, a occhio
     livello  0..1, quanto è pieno rispetto al limite
     pezzi    quanti pezzi ci sono sopra (i pesi sul piatto)
   ═══════════════════════════════════════════════════════════════════ */
const props = defineProps({
  gesto: { type: String, required: true },
  taglia: { type: String, default: 'P' },
  livello: { type: Number, default: 0 },
  pezzi: { type: Number, default: 0 },
  colore: { type: String, default: '#c98adf' },
})
const SCALA = { P: 0.84, M: 0.95, G: 1.06 }
</script>

<template>
  <svg class="pz-figura" :class="'pz-taglia-' + taglia" viewBox="0 0 100 100" aria-hidden="true">
    <g :transform="`translate(50 100) scale(${SCALA[taglia]}) translate(-50 -100)`">
      <!-- ⚖️ la bilancia da cucina: il corpo col quadrante, il piatto
           sopra, e i pesi posati sul piatto -->
      <template v-if="gesto === 'pesa'">
        <rect x="14" y="54" width="72" height="42" rx="11" class="pz-corpo-fig" />
        <circle cx="50" cy="75" r="14" class="pz-quadrante" />
        <line x1="50" y1="75" :x2="50 + 10 * Math.cos(Math.PI * (1.25 - livello * 1.5))"
              :y2="75 - 10 * Math.sin(Math.PI * (1.25 - livello * 1.5))" class="pz-lancetta" />
        <rect x="44" y="42" width="12" height="12" class="pz-metallo" />
        <ellipse cx="50" cy="42" rx="42" ry="8" class="pz-metallo" />
        <ellipse cx="50" cy="40" rx="40" ry="6" class="pz-metallo-chiaro" />
        <g v-for="n in Math.min(pezzi, 6)" :key="n">
          <rect :x="23 + ((n - 1) % 3) * 18" :y="22 - Math.floor((n - 1) / 3) * 14" width="16" height="14"
                rx="2" class="pz-peso-fig" />
          <rect :x="28 + ((n - 1) % 3) * 18" :y="17 - Math.floor((n - 1) / 3) * 14" width="6" height="5"
                rx="1" class="pz-peso-fig" />
        </g>
      </template>

      <!-- 🫗 la caraffa: il vetro, le tacche, e il liquido che sale -->
      <template v-else-if="gesto === 'versa'">
        <path d="M28 14 L28 88 Q28 96 36 96 L72 96 Q80 96 80 88 L80 14 Z" class="pz-vetro" />
        <rect x="30" :y="94 - 78 * livello" width="48" :height="78 * livello" :fill="colore"
              opacity=".85" />
        <line v-for="n in 4" :key="n" x1="72" :x2="80" :y1="20 + n * 15" :y2="20 + n * 15"
              class="pz-tacca" />
        <path d="M80 30 Q94 34 90 52 Q88 60 80 60" class="pz-manico" />
        <path d="M28 14 L22 8 L36 12" class="pz-vetro-bordo" />
      </template>

      <!-- ✂️ il metro: il nastro con le tacche, e il pezzo tagliato -->
      <template v-else>
        <rect x="6" y="42" width="88" height="22" rx="3" class="pz-nastro" />
        <rect x="6" y="42" :width="88 * livello" height="22" rx="3" :fill="colore" opacity=".8" />
        <line v-for="n in 9" :key="n" :x1="6 + n * 8.8" :x2="6 + n * 8.8" y1="42"
              :y2="n % 2 ? 50 : 56" class="pz-tacca" />
        <path d="M20 70 Q40 84 50 70" class="pz-arrotolato" />
      </template>
    </g>
  </svg>
</template>
