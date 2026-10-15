<script setup>
/* La striscia «sto scaricando»: il service worker del sito spezzato mette in cassa prima la base e poi i giochi, e
   racconta a che punto è (src/scarico.js). Sta in App.vue, sopra tutto (z-index 70, fra i veli di casa): non blocca
   niente — finché non è finita i giochi si aprono lo stesso se c'è rete, senza rete no. */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { scarico, ascolta, chiediScarico } from '../scarico.js'

const finito = ref(false)    // «tutto sul telefono», per qualche secondo
let nascondi = null
const siVede = () => scarico.totale > 0 && !scarico.fine

watch(() => scarico.fine, fine => {
  if (!fine || !scarico.totale) return
  finito.value = true
  clearTimeout(nascondi)
  nascondi = setTimeout(() => { finito.value = false }, 2500)
})

const riprova = () => chiediScarico()
onMounted(() => { ascolta(); window.addEventListener('online', riprova) })
onUnmounted(() => { window.removeEventListener('online', riprova); clearTimeout(nascondi) })

const percento = () => scarico.byteTotale ? Math.min(100, Math.round(100 * scarico.byteFatti / scarico.byteTotale)) : 0
const mega = b => (b / 1048576).toFixed(0)
</script>

<template>
  <div v-if="siVede() || finito" class="scarico" role="status" data-scarico>
    <b v-if="finito && !siVede()">✓ Tutti i giochi sono sul telefono: funzionano anche senza internet</b>
    <template v-else>
      <b v-if="scarico.errore">Il download si è fermato: riprende appena torna internet</b>
      <b v-else>{{ scarico.fase === 'base' ? "Sto preparando l'app…" : 'Sto scaricando i giochi…' }} {{ percento() }}%</b>
      <span class="mini">{{ mega(scarico.byteFatti) }} di {{ mega(scarico.byteTotale) }} MB · tieni aperta l'app</span>
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
