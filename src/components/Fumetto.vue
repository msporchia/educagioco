<script setup>
/* Il fumetto di una mappa: compare sopra la cosa toccata (sotto, se sopra
   non c'è posto), la punta la indica, e la mappa scorre quanto basta per
   vederlo tutto. Il contenuto è nello slot. Vedi docs/core/interfaccia.md. */
import { ref, computed, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  // il bersaglio, nelle coordinate del contenitore (che è `position: relative`)
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  raggio: { type: Number, default: 0 },          // la punta si ferma a questa distanza dal centro
  limite: { type: Number, required: true },      // la larghezza del contenitore
  largo: { type: Number, default: 236 },
  scorre: { default: null },                     // l'elemento che scorre, se c'è
  margine: { type: Number, default: 8 },
  tenue: { type: Boolean, default: false },      // una cosa chiusa: il fondo è più spento
})

const radice = ref(null)
const alto = ref(0)
const largoVero = computed(() => Math.min(props.largo, props.limite - 2 * props.margine))
const sinistra = computed(() =>
  Math.max(props.margine, Math.min(props.limite - largoVero.value - props.margine, props.x - largoVero.value / 2)))
const sotto = computed(() => alto.value > 0 && props.y - props.raggio - 12 - alto.value < props.margine)
const cima = computed(() => (sotto.value ? props.y + props.raggio + 12 : props.y - props.raggio - 12))

async function mostra() {
  alto.value = 0
  await nextTick()
  if (!radice.value) return
  alto.value = radice.value.offsetHeight
  await nextTick()
  const s = props.scorre
  if (!s || !radice.value) return
  const rf = radice.value.getBoundingClientRect(), rs = s.getBoundingClientRect()
  if (rf.top < rs.top + props.margine) s.scrollTop -= rs.top + props.margine - rf.top
  else if (rf.bottom > rs.bottom - props.margine) s.scrollTop += rf.bottom - rs.bottom + props.margine
}
onMounted(mostra)
watch(() => [props.x, props.y], mostra)
</script>

<template>
  <div ref="radice" class="fumetto" :class="{ sotto, tenue }" data-fumetto
       :style="{ left: sinistra + 'px', top: cima + 'px', width: largoVero + 'px',
                 '--coda': Math.max(16, Math.min(largoVero - 16, x - sinistra)) + 'px', visibility: alto ? 'visible' : 'hidden' }"
       @click.stop>
    <slot />
  </div>
</template>

<style scoped>
.fumetto { position:absolute; z-index:3; transform:translateY(-100%); box-sizing:border-box;
           padding:11px 13px 12px; border-radius:14px; font-size:13px; line-height:1.35; text-align:left;
           background:var(--fumetto-fondo, #f6f2e4); color:var(--fumetto-testo, #1c2420);
           animation:compare .16s ease-out }
.fumetto.sotto { transform:none }
.fumetto.tenue { background:var(--fumetto-tenue, #dfe4da) }
/* la punta: un quadratino girato, sotto (o sopra) il bersaglio */
.fumetto::after { content:''; position:absolute; left:calc(var(--coda) - 7px); bottom:-6px; width:14px; height:14px;
                  background:inherit; transform:rotate(45deg); border-radius:2px }
.fumetto.sotto::after { bottom:auto; top:-6px }
@keyframes compare { from { opacity:0 } }
@media (prefers-reduced-motion: reduce) { .fumetto { animation:none } }
</style>
