<script setup>
/* A che punto è lo scarico dei giochi (src/scarico.js): una riga grigia in fondo alla home, sotto la versione. È roba
   da sapere, non da guardare: dentro i giochi non c'è, e non ferma niente. Vedi docs/core/aggiornamento.md. */
import { ref, watch, onUnmounted } from 'vue'
import { scarico } from '../scarico.js'

const finito = ref(false)    // «tutto sul telefono», per qualche secondo
let nascondi = null
const siVede = () => scarico.totale > 0 && !scarico.fine

watch(() => scarico.fine, fine => {
  if (!fine || !scarico.totale || scarico.fase !== 'giochi') return
  finito.value = true
  clearTimeout(nascondi)
  nascondi = setTimeout(() => { finito.value = false }, 2500)
})
onUnmounted(() => clearTimeout(nascondi))

const percento = () => scarico.byteTotale ? Math.min(100, Math.round(100 * scarico.byteFatti / scarico.byteTotale)) : 0
const mega = b => (b / 1048576).toFixed(0)
</script>

<template>
  <p v-if="siVede() || finito" class="scarico" role="status" data-scarico>
    <template v-if="finito && !siVede()">✓ tutti i giochi sono sul telefono: funzionano anche senza internet</template>
    <template v-else>
      <span v-if="scarico.errore">download fermo al {{ percento() }}%: riprende da solo</span>
      <span v-else>{{ scarico.fase === 'base' ? "preparo l'app" : 'scarico i giochi' }} · {{ percento() }}% · {{ mega(scarico.byteFatti) }} di {{ mega(scarico.byteTotale) }} MB</span>
      <i><u :style="{ width: percento() + '%' }"></u></i>
    </template>
  </p>
</template>

<style scoped>
.scarico { width:100%; max-width:var(--colonna); margin:6px auto 0; text-align:center; font-size:11px; color:var(--grigio) }
.scarico i { display:block; height:2px; margin-top:4px; border-radius:1px; background:var(--filo); overflow:hidden }
.scarico u { display:block; height:100%; background:var(--grigio); text-decoration:none; transition:width .3s }
</style>
