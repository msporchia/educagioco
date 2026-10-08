<script setup>
// Il velo della pausa, uno solo per tutti i giochi: copre anche la barra
// (un ⏸ ancora premibile sotto sarebbe un tasto morto). Contratto in
// giochi/pausa.js; qui solo la finestra cieca (vedi docs/core/interfaccia.md).
import { ref, onMounted, onUnmounted } from 'vue'
import { CIECA } from './pausa.js'

defineProps({
  dove: { type: String, default: '' },   // «tappa 3 · 240 m»: per riconoscere la partita, non per giocare
})
const emit = defineEmits(['riprendi', 'esci'])

const pronto = ref(false)
let cieca = 0
onMounted(() => { cieca = setTimeout(() => { pronto.value = true }, CIECA) })
onUnmounted(() => clearTimeout(cieca))

function riprendi() {
  if (!pronto.value) return
  emit('riprendi')
}

// il velo copre anche il ←: chi è chiamato a tavola esce da qui, senza far
// ripartire il campo (la partita si salva, docs/core/ripresa.md)
function esci() {
  if (!pronto.value) return
  emit('esci')
}
</script>

<template>
  <!-- il tocco si prende sul velo intero, non solo sul tasto: una mano sola lo gestisce -->
  <div class="pa-velo" data-pausa :class="{ pronto }" @click="riprendi">
    <div class="pa-foglio">
      <!-- disegnate e non scritte: l'emoji ⏸ a colori sembrerebbe il tasto di un'altra app -->
      <div class="pa-segno" aria-hidden="true"><i></i><i></i></div>
      <h2>In pausa</h2>
      <div v-if="dove" class="pa-dove">{{ dove }}</div>
      <button type="button" class="bottone" data-azione="riprendi">
        <span class="em">▶</span> tocca per continuare
      </button>
      <button type="button" class="pa-esci" data-azione="esci" @click.stop="esci">
        ← torno ai giochi <small>la partita resta qui</small>
      </button>
      <!-- un gioco può aggiungere altro a chi è già fermo (il sotterraneo: lasciar perdere la discesa) -->
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* z-index 130: sopra i veli dei giochi (5-40) e il foglio del `?` (120,
   la pausa è lo stato più esterno), sotto il 200 di «gira il telefono» */
.pa-velo { position:fixed; inset:0; z-index:130; display:flex;
           align-items:center; justify-content:center; padding:18px;
           background:#131a2ad9; backdrop-filter:blur(3px);
           animation:pa-entra .18s ease-out; cursor:pointer }
@keyframes pa-entra { from { opacity:0 } }
.pa-foglio { display:flex; flex-direction:column; align-items:center; gap:10px;
             text-align:center; color:#eef2fa }
.pa-segno { display:flex; gap:clamp(7px,2.4vw,11px); align-items:center }
.pa-segno i { display:block; width:clamp(13px,4vw,18px); height:clamp(40px,12vw,56px);
              border-radius:5px; background:#eef2fa; box-shadow:0 3px 12px #0006 }
.pa-foglio h2 { color:#eef2fa; font-size:clamp(22px,6vw,28px) }
.pa-dove { font-size:14px; color:#b9c6e6 }
.pa-foglio .bottone { margin-top:6px; opacity:.45; transition:opacity .18s ease }
.pa-velo.pronto .bottone { opacity:1 }
.pa-esci { margin-top:14px; padding:10px 18px; border-radius:999px; border:2px solid #b9c6e680;
           background:transparent; color:#dfe6f6; font-size:15px; font-weight:800; opacity:.45 }
.pa-velo.pronto .pa-esci { opacity:1 }
.pa-esci small { display:block; font-size:11px; font-weight:600; opacity:.75 }
.pa-foglio .em { font-style:normal }
</style>
