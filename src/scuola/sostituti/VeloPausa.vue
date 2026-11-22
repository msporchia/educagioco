<script setup>
// La pausa a scuola: come giochi/VeloPausa.vue ma senza «torno ai giochi» (dal gioco non si esce) e senza sfocare. docs/scuola/architettura.md
import { ref, onMounted, onUnmounted } from 'vue'
import { CIECA } from '../../giochi/pausa.js'

defineProps({ dove: { type: String, default: '' } })
const emit = defineEmits(['riprendi', 'esci'])

const pronto = ref(false)
let cieca = 0
onMounted(() => { cieca = setTimeout(() => { pronto.value = true }, CIECA) })
onUnmounted(() => clearTimeout(cieca))

function riprendi() { if (pronto.value) emit('riprendi') }
</script>

<template>
  <div class="pa-velo" data-pausa :data-pronto="pronto || null" :class="{ pronto }" @click="riprendi">
    <div class="pa-foglio">
      <div class="pa-segno" aria-hidden="true"><i></i><i></i></div>
      <h2>In pausa</h2>
      <div v-if="dove" class="pa-dove">{{ dove }}</div>
      <button type="button" class="bottone" data-azione="riprendi"><span class="em">▶</span> tocca per continuare</button>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.pa-velo { position:fixed; inset:0; z-index:130; display:flex; align-items:center; justify-content:center; padding:18px;
           background:#131a2aee; cursor:pointer }
.pa-foglio { display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; color:#eef2fa }
.pa-segno { display:flex; gap:11px; align-items:center }
.pa-segno i { display:block; width:18px; height:56px; border-radius:5px; background:#eef2fa }
.pa-foglio h2 { color:#eef2fa; font-size:28px }
.pa-dove { font-size:14px; color:#b9c6e6 }
.pa-foglio .bottone { margin-top:6px; opacity:.45 }
.pa-velo.pronto .bottone { opacity:1 }
.pa-foglio .em { font-style:normal }
</style>
