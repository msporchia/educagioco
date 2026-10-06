<script setup>
// «Riprendi da qui»: l'ultimo gioco giocato, in cima alla home. Vedi docs/core/home.md.
import Copertina from './Copertina.vue'

defineProps({
  gioco: { type: Object, required: true },   // una riga di data/giochi.js
  dove: { type: String, default: '' },
})
defineEmits(['apri'])
</script>

<template>
  <button class="riprendi" :data-riprendi="gioco.chiave" @click="$emit('apri', gioco.chiave)">
    <Copertina class="arte" :copertina="gioco.copertina" :ico="gioco.ico" :grande="36" />
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
            padding:8px 12px 8px 8px; border-radius:18px; text-align:left; color:#fff; background:#1f2433 }
.riprendi:active { transform:scale(.99) }
.arte { flex:none; width:64px; height:64px; border-radius:12px }
.parole { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px }
.parole b { font-size:11px; font-weight:400; color:#aab3c9 }
.parole strong { font-size:15px; font-weight:600; line-height:1.2 }
.parole span { font-size:11.5px; line-height:1.3; color:#aab3c9;
               display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
.via { flex:none; width:40px; height:40px; border-radius:50%; display:grid; place-items:center;
       padding-left:3px; font-size:15px; background:#ffd54f; color:#1f2433 }
</style>
