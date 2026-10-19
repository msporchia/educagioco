<script setup>
// Il foglio del livello: «⭐ Livello N», il nome, quanto manca al prossimo, cosa è arrivato con questo livello e (in grigio, col
// lucchetto) cosa arriva col successivo. Solo lettura; la ✕ in alto a destra.
import { computed } from 'vue'

const props = defineProps({
  info: { type: Object, required: true },          // avanzamento(): { livello, nome, manca, quanto }
  ora: { type: Object, required: true },           // roba(livello)
  dopo: { type: Object, required: true },          // roba(livello + 1)
  nomeDopo: { type: String, default: '' },
})
defineEmits(['chiudi'])

const voci = r => [
  ...r.pezzi.map(c => ({ k: 'p' + c.id, emoji: c.emoji, nome: c.nome, cosa: 'da costruire' })),
  ...r.edifici.map(c => ({ k: 'e' + c.id, emoji: c.emoji, nome: c.nome, cosa: 'edificio' })),
  ...r.colture.map(c => ({ k: 'c' + c.id, emoji: c.emoji, nome: c.nome, cosa: 'da seminare' })),
  ...r.ricette.map(c => ({ k: 'r' + c.id, emoji: c.emoji, nome: c.nome, cosa: 'ricetta' })),
]
const arrivate = computed(() => voci(props.ora))
const prossime = computed(() => voci(props.dopo))
</script>

<template>
  <div class="f3-foglio f3-colonna f3-livelli" data-f3="livelli">
    <h2>⭐ Livello {{ info.livello }}</h2>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo">
      <p class="f3-nome">{{ info.nome }}</p>
      <div class="f3-barra-livello" role="progressbar" :aria-valuenow="Math.round(info.quanto * 100)" aria-valuemin="0" aria-valuemax="100"><u :style="{ width: info.quanto * 100 + '%' }"></u></div>
      <p class="f3-nota">Spendi ancora 🪙 {{ info.manca }} qui dentro per il livello {{ info.livello + 1 }}.</p>
      <h3>Arriva con questo livello</h3>
      <div class="f3-roba">
        <div v-for="c in arrivate" :key="c.k"><span class="em">{{ c.emoji }}</span><b>{{ c.nome }}</b><small>{{ c.cosa }}</small></div>
      </div>
      <h3>Dopo, al livello {{ info.livello + 1 }} · {{ nomeDopo }}</h3>
      <div class="f3-roba chiusa">
        <div v-for="c in prossime" :key="c.k"><span class="em">{{ c.emoji }}</span><b>{{ c.nome }}</b><small>🔒 {{ c.cosa }}</small></div>
      </div>
    </div>
  </div>
</template>
