<script setup>
// Un testo inglese dove ogni parola si tocca: emette `tocca` con la parola
// e dove sta, e chi lo monta mostra la traduzione. La punteggiatura resta
// testo. Le parole della storia (`storia`, in minuscolo) hanno un segno
// loro. Vedi docs/lingue/mondi.md («Toccare una parola»).
import { computed } from 'vue'

const props = defineProps({
  testo: { type: String, required: true },
  toccabile: { type: Boolean, default: true },
  storia: { type: Array, default: () => [] },
})
const emit = defineEmits(['tocca'])

const pezzi = computed(() => String(props.testo).split(/([A-Za-z]+(?:[’'][A-Za-z]+)?)/)
  .filter(s => s !== '')
  .map(s => ({ s, parola: /^[A-Za-z]/.test(s), storia: props.storia.includes(s.toLowerCase()) })))

function tocca(e) {
  if (!props.toccabile) return
  const el = e.target instanceof Element ? e.target.closest('[data-parola]') : null
  if (el) emit('tocca', el)
}
</script>

<template>
  <span class="ing-testo" @click="tocca"><template v-for="(p, i) in pezzi" :key="i"><span
    v-if="p.parola && toccabile" class="ing-parola" :class="{ 'ing-della-storia': p.storia }" :data-parola="p.s"
    :data-storia="p.storia ? '' : null">{{ p.s }}</span><template v-else>{{ p.s }}</template></template></span>
</template>
