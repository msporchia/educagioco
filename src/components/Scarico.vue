<script setup>
/* La striscia «sto scaricando i giochi»: il service worker del sito spezzato (vite.config.js, scaricaTutto) mette
   in cassa tutti i file e racconta a che punto è su un canale. Sta in App.vue, sopra tutto (z-index 70, fra i veli
   di casa): finché c'è da scaricare i giochi si aprono lo stesso se c'è rete, ma senza rete no.
   Il file unico e il dev server non hanno service worker: qui non arriva mai niente. */
import { ref, onMounted, onUnmounted } from 'vue'

const stato = ref(null)   // { fatti, totale, byteFatti, byteTotale } mentre scarica
let canale = null, nascondi = null

onMounted(() => {
  if (typeof BroadcastChannel !== 'function') return
  canale = new BroadcastChannel('educagioco-scarico')
  canale.onmessage = e => {
    clearTimeout(nascondi)
    stato.value = e.data.fine ? { ...e.data, fine: true } : e.data
    if (e.data.fine) nascondi = setTimeout(() => { stato.value = null }, 2500)
  }
})
onUnmounted(() => { canale && canale.close(); clearTimeout(nascondi) })

const percento = () => stato.value && stato.value.byteTotale ? Math.min(100, Math.round(100 * stato.value.byteFatti / stato.value.byteTotale)) : 0
const mega = b => (b / 1048576).toFixed(0)
</script>

<template>
  <div v-if="stato" class="scarico" role="status" data-scarico>
    <b v-if="stato.fine">✓ Tutti i giochi sono sul telefono: funzionano anche senza internet</b>
    <template v-else>
      <b>Sto scaricando i giochi… {{ percento() }}%</b>
      <span class="mini">{{ mega(stato.byteFatti) }} di {{ mega(stato.byteTotale) }} MB · tieni aperta l'app</span>
      <i class="barra"><u :style="{ width: percento() + '%' }"></u></i>
    </template>
  </div>
</template>

<style scoped>
.scarico { position:fixed; left:0; right:0; top:0; z-index:70; padding:8px 16px 10px; text-align:center;
  background:#2b2140; color:#fff; font-size:.9rem; display:flex; flex-direction:column; gap:3px;
  box-shadow:0 2px 8px rgba(0,0,0,.35) }
.mini { font-size:.75rem; opacity:.8 }
.barra { display:block; height:5px; border-radius:3px; background:rgba(255,255,255,.2); overflow:hidden }
.barra u { display:block; height:100%; background:#ffd24a; text-decoration:none; transition:width .3s }
</style>
