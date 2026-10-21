<script setup>
// Il quadro del bambino a colpo d'occhio: un asse per materia, il saputo da 0 a 100, e (tratteggiato) com'era due settimane fa.
// Tocchi l'etichetta di una materia per entrarci. Con meno di tre materie un radar non dice niente: non si disegna (restano le mattonelle).
import { computed } from 'vue'

const props = defineProps({
  assi: { type: Array, default: () => [] }, // { id, emoji, nome, pct, prima }
})
defineEmits(['apri'])

const W = 360, H = 290, CX = 180, CY = 145, R = 78
const n = computed(() => props.assi.length)
const punto = (i, v) => {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / n.value
  return [CX + Math.cos(a) * R * v, CY + Math.sin(a) * R * v]
}
const poligono = v => props.assi.map((a, i) => punto(i, v(a)).map(x => x.toFixed(1)).join(',')).join(' ')
const anello = k => poligono(() => k)
const forma = computed(() => poligono(a => Math.max(0.04, a.pct / 100)))
const prima = computed(() => (props.assi.some(a => a.prima != null) ? poligono(a => Math.max(0.04, (a.prima ?? a.pct) / 100)) : ''))
const etichetta = i => {
  const [x, y] = punto(i, 1.14)
  return { x, y, ancora: x < CX - 8 ? 'end' : x > CX + 8 ? 'start' : 'middle' }
}
const corto = t => (t.length > 13 ? t.slice(0, 12) + '…' : t)
const lettura = computed(() => props.assi.map(a => `${a.nome} ${a.pct}%`).join(', '))
</script>

<template>
  <svg v-if="n >= 3" class="radar" :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="`Quanto è saputo, per materia: ${lettura}`" data-radar>
    <polygon v-for="k in [0.25, 0.5, 0.75, 1]" :key="k" :points="anello(k)" class="anello" />
    <line v-for="(a, i) in assi" :key="'l' + a.id" :x1="CX" :y1="CY" :x2="punto(i, 1)[0]" :y2="punto(i, 1)[1]" class="asse" />
    <polygon v-if="prima" :points="prima" class="prima" data-radar-prima />
    <polygon :points="forma" class="forma" data-radar-forma />
    <circle v-for="(a, i) in assi" :key="'p' + a.id" :cx="punto(i, Math.max(0.04, a.pct / 100))[0]" :cy="punto(i, Math.max(0.04, a.pct / 100))[1]" r="3.4" class="punto" />
    <g v-for="(a, i) in assi" :key="'t' + a.id" class="etichetta" :data-radar-asse="a.id" role="button" tabindex="0"
       @click="$emit('apri', a.id)" @keydown.enter="$emit('apri', a.id)">
      <text :x="etichetta(i).x" :y="etichetta(i).y - 3" :text-anchor="etichetta(i).ancora" class="nome">{{ a.emoji }} {{ corto(a.nome) }}</text>
      <text :x="etichetta(i).x" :y="etichetta(i).y + 11" :text-anchor="etichetta(i).ancora" class="pct">{{ a.pct }}%</text>
    </g>
  </svg>
</template>

<style scoped>
.radar { width:100%; max-width:380px; margin:0 auto; display:block; overflow:visible }
.anello { fill:none; stroke:#ddd6f0; stroke-width:1 }
.asse { stroke:#e6e0f4; stroke-width:1 }
.forma { fill:#7c5cd655; stroke:#6a49c4; stroke-width:2.2; stroke-linejoin:round }
.prima { fill:none; stroke:#9a8fc0; stroke-width:1.6; stroke-dasharray:4 3 }
.punto { fill:#6a49c4 }
.etichetta { cursor:pointer }
.nome { font-size:11.5px; font-weight:700; fill:#2d2745 }
.pct { font-size:11px; font-weight:800; fill:#6a49c4 }
</style>
