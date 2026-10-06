<script setup>
// «Riprendi da qui»: l'ultimo gioco giocato, in cima alla home. Vedi docs/core/home.md.
import { computed } from 'vue'
import Copertina from './Copertina.vue'

const props = defineProps({
  gioco: { type: Object, required: true },   // una riga di data/giochi.js
  dove: { type: String, default: '' },
})
defineEmits(['apri'])

const fondo = computed(() => props.gioco.copertina?.fondo || '#8593a8')
// su un fondo chiaro (la bancarella, lo spagnolo) il bianco non si legge
const scuro = computed(() => {
  const n = parseInt(fondo.value.slice(1), 16)
  const l = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
  return l < 150
})
</script>

<template>
  <button class="riprendi" :class="{ scuro }" :style="{ background: fondo }"
          :data-riprendi="gioco.chiave" @click="$emit('apri', gioco.chiave)">
    <Copertina class="arte" :copertina="gioco.copertina" :ico="gioco.ico" :grande="44" />
    <span class="parole">
      <b>riprendi da qui</b>
      <strong>{{ gioco.nome }}</strong>
      <span v-if="dove">{{ dove }}</span>
    </span>
    <span class="via" aria-hidden="true">▶</span>
  </button>
</template>

<style scoped>
.riprendi { display:flex; align-items:center; gap:12px; width:100%; max-width:400px;
            padding:8px 12px 8px 8px; border-radius:22px; text-align:left; color:#2d2a32;
            box-shadow:0 5px 0 #0000001f, 0 10px 22px #8593a833 }
.riprendi:active { transform:translateY(2px); box-shadow:0 3px 0 #0000001f }
.riprendi.scuro { color:#fff }
.arte { flex:none; width:82px; height:92px; box-shadow:inset 0 0 0 2px #ffffff55 }
.parole { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px }
.parole b { align-self:flex-start; font-size:11px; font-weight:900; padding:3px 9px;
           border-radius:999px; background:#2d2a32; color:#ffcf3f; white-space:nowrap }
.parole strong { font-size:19px; font-weight:900; line-height:1.15; margin-top:3px }
.parole span { font-size:12.5px; line-height:1.3; opacity:.9;
              display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
.via { flex:none; width:52px; height:52px; border-radius:50%; display:grid; place-items:center;
       padding-left:4px; font-size:22px; background:#2d2a32; color:#ffcf3f }
</style>
