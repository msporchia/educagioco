<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SCHEDA DI CHI STA ARRIVANDO

   Un riquadro in alto a destra sul campo: il mostro dell'ondata
   ingrandito, quanti ne restano da fermare, quanta vita ha ciascuno e
   — se ce l'ha — a quale torre **resiste**.

   Serve a rendere la resistenza una cosa che si *legge*, non che si
   indovina: sul campo il mostro è alto quindici pixel e il segno della
   resistenza è un puntino. Qui è grande, fermo, e c'è posto per
   scriverlo a parole — «resiste a 🏹 Arciere» — che è l'unico punto
   dello schermo dove la frase sta per intero.

   Il ritratto non è un'immagine: è lo stesso pittore che disegna i
   mostri sul campo, chiamato su una tela piccola. Un mostro nuovo si
   disegna una volta sola e compare in tutti e due i posti.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { creaTela } from '../grafica/tela.js'
import { PITTORI } from '../grafica/castello.js'
import { TORRI } from '../data/ops.js'

const props = defineProps({
  bestia: { type: Object, required: true },   // { id, nome, vola, resiste }
  vita: { type: Number, default: 0 },         // quanta ne ha uno solo
  quanti: { type: Number, default: 0 },       // quanti ne restano in campo
})

const ritratto = ref(null)
let tela = null, raf = 0

function gira(ts) {
  // il ritratto respira come sul campo: fermo sembrava un francobollo
  tela?.disegna([{ che: 'mostro', x: 17, y: 23, bestia: props.bestia.id,
                   vola: false, vita: 1, gelo: 0 }], ts / 1000)
  raf = requestAnimationFrame(gira)
}

onMounted(() => {
  // unità piccola: il mostro deve riempire il riquadro, non stare al suo
  // posto in una scena
  tela = creaTela(ritratto.value, PITTORI, { unita: 46, massimo: 3 })
  tela.ridimensiona()
  raf = requestAnimationFrame(gira)
})
onUnmounted(() => cancelAnimationFrame(raf))
watch(() => props.bestia.id, () => tela?.ridimensiona())
</script>

<template>
  <div class="scheda">
    <div class="faccia"><canvas ref="ritratto"></canvas></div>
    <div class="dati">
      <b>{{ bestia.nome }}</b>
      <i v-if="bestia.vola">vola</i>
      <span class="riga">❤️ {{ vita }} · ×{{ quanti }}</span>
      <span v-if="bestia.resiste" class="resiste">
        resiste a {{ TORRI[bestia.resiste].emoji }} ⅓
      </span>
    </div>
  </div>
</template>

<style scoped>
.scheda { position:absolute; top:5px; right:5px; display:flex; gap:4px; align-items:center;
          background:#ffffffcc; border-radius:10px; padding:3px 6px 3px 3px;
          box-shadow:0 2px 8px #2a214022; pointer-events:none; max-width:46% }
.faccia { width:34px; height:34px; flex:none }
.faccia canvas { display:block; width:100%; height:100% }
.dati { display:flex; flex-direction:column; line-height:1.25; min-width:0 }
.dati b { font-size:11px; color:var(--viola-scuro) }
.dati i { font-style:normal; font-size:9px; font-weight:800; color:#4aa3ff }
.riga { font-size:9.5px; font-weight:800; color:var(--tenue) }
/* neutra, non del colore della torre: qui si sta dicendo «non quella»,
   e il colore di una torre su questo schermo vuol dire «quella» */
.resiste { font-size:9px; font-weight:800; color:#5b5468;
           background:#eceaf0; border-radius:999px;
           padding:1px 6px; margin-top:2px; white-space:nowrap; overflow:hidden;
           text-overflow:ellipsis }
</style>
