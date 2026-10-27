<script setup>
// Il foglio del livello: una scala. Al centro il livello di adesso (la stella, il nome, quanto manca al prossimo e la scatola già
// aperta con ciò che è arrivato), sotto il gradino successivo con la sua scatola ancora chiusa (col lucchetto, in grigio) e poi
// un gradino segreto. Solo lettura; la ✕ in alto a destra.
import { computed } from 'vue'
import Faccia from './Faccia.vue'

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
  ...r.colture.map(c => ({ k: 'c' + c.id, merce: c.id, emoji: c.emoji, nome: c.nome, cosa: 'da seminare' })),
  ...r.ricette.map(c => ({ k: 'r' + c.id, merce: c.id, emoji: c.emoji, nome: c.nome, cosa: 'ricetta' })),
  ...(r.compagni || []).map(c => ({ k: 'a' + c.id, emoji: c.tipo === 'cane' ? '🐕' : '🐈', nome: c.nome, cosa: 'arriva in fattoria' })),
  ...(r.bestie || []).map(b => ({ k: 'b' + b.id, emoji: b.emoji, nome: b.nome, cosa: 'puoi prenderlo (🐾)' })),
  ...(r.abiti || []).map(c => ({ k: 'v' + c.categoria + c.id, emoji: '👕', nome: c.nome, cosa: 'per il guardaroba' })),
]
const arrivate = computed(() => voci(props.ora))
const prossime = computed(() => voci(props.dopo))
</script>

<template>
  <div class="f3-foglio f3-colonna f3-livelli" data-f3="livelli">
    <header class="f3-insegna">
      <span class="f3-insegna-em" aria-hidden="true">⭐</span>
      <h2>Livello {{ info.livello }}</h2>
      <small>{{ info.nome }}</small>
    </header>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo">
      <ol class="f3-scala">
        <li class="gradino ora" style="--i: 0">
          <div class="numero" aria-hidden="true">{{ info.livello }}</div>
          <div class="scheda">
            <p class="f3-nome">{{ info.nome }}</p>
            <div class="f3-barra-livello" role="progressbar" :aria-valuenow="Math.round(info.quanto * 100)" aria-valuemin="0" aria-valuemax="100"><u :style="{ width: info.quanto * 100 + '%' }"></u></div>
            <p class="f3-nota">Spendi ancora 🪙 {{ info.manca }} qui dentro per il livello {{ info.livello + 1 }}.</p>
            <h3>📦 Arrivato con questo livello</h3>
            <p v-if="!arrivate.length" class="f3-nota" data-f3="livello-vuoto">Niente di nuovo qui: ogni livello è un passo verso quelli dopo.</p>
            <div class="f3-roba">
              <div v-for="(c, n) in arrivate" :key="c.k" class="dono" :style="{ '--i': n }"><span class="em"><Faccia v-if="c.merce" :k="c.merce" :emoji="c.emoji" :lato="38" /><template v-else>{{ c.emoji }}</template></span><b>{{ c.nome }}</b><small>{{ c.cosa }}</small></div>
            </div>
          </div>
        </li>
        <li class="gradino dopo" style="--i: 1">
          <div class="numero" aria-hidden="true">{{ info.livello + 1 }}</div>
          <div class="scheda">
            <p class="f3-nome">{{ nomeDopo }}</p>
            <h3><span class="regalo" aria-hidden="true">🎁</span> Dopo, al livello {{ info.livello + 1 }}</h3>
            <p v-if="!prossime.length" class="f3-nota">Niente di nuovo neanche qui: la fattoria cresce con te.</p>
            <div class="f3-roba chiusa">
              <div v-for="(c, n) in prossime" :key="c.k" class="dono" :style="{ '--i': n + 2 }"><span class="em"><Faccia v-if="c.merce" :k="c.merce" :emoji="c.emoji" :lato="38" /><template v-else>{{ c.emoji }}</template></span><b>{{ c.nome }}</b><small>🔒 {{ c.cosa }}</small></div>
            </div>
          </div>
        </li>
        <li class="gradino lontano" style="--i: 2" aria-hidden="true">
          <div class="numero">{{ info.livello + 2 }}</div>
          <div class="scheda"><p class="f3-nome">❔ ancora un segreto</p></div>
        </li>
      </ol>
    </div>
  </div>
</template>
