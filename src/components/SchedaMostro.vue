<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA SCHEDA DI CHI STA ARRIVANDO

   Un riquadro in alto a destra sul campo: il mostro dell'ondata
   ingrandito, quanti ne restano da fermare, quanta vita ha ciascuno, a
   quali torri è **immune** e — se ce l'ha — cosa fa quando cade.

   Serve a rendere l'immunità una cosa che si *legge*, non che si
   indovina: sul campo il mostro è alto quindici pixel e il segno
   «immune» compare solo quando una torre gli rimbalza addosso. Qui è
   grande, fermo, e c'è posto per scriverlo a parole — «immune a 🏹 🔮»
   — che è l'unico punto dello schermo dove la frase sta per intero.

   Il ritratto non è un'immagine: è lo stesso pittore che disegna i
   mostri sul campo, chiamato su una tela piccola. Un mostro nuovo si
   disegna una volta sola e compare in tutti e due i posti.

   In un'ondata **mista** (`con`, vedi `coppiaDellOnda` in
   `data/mostri.js`) le facce sono due e le immunità due righe, una per
   tipo: la cosa da leggere è proprio che non coincidono, quindi non si
   fondono in una riga sola.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { creaTela } from '../grafica/tela.js'
import { PITTORI } from '../grafica/castello.js'
import { TORRI } from '../data/ops.js'
import { ABILITA } from '../data/mostri.js'

const props = defineProps({
  bestia: { type: Object, required: true },   // { id, nome, vola, immune, abilita, capo, con? }
  vita: { type: Number, default: 0 },         // quanta ne ha uno solo
  quanti: { type: Number, default: 0 },       // quanti ne restano in campo
  /* i pittori di una pelle (il castello a sprite): lì il ritratto è la
     figura del campo, fatta stare nel riquadro dal suo pittore
     `ritratto`, invece del mostro a poligoni */
  pittori: { type: Object, default: null },
})

const ritratto = ref(null), ritrattoCon = ref(null)
let tele = [null, null], raf = 0

/* la tela di un riquadro, fatta quando il riquadro c'è: il secondo
   compare e sparisce con le ondate miste */
function telaDi(i, canvas) {
  if (!canvas) { tele[i] = null; return null }
  if (!tele[i] || tele[i].canvas !== canvas) {
    // unità piccola: il mostro deve riempire il riquadro, non stare al
    // suo posto in una scena
    tele[i] = creaTela(canvas, props.pittori || PITTORI, { unita: 46, massimo: 3 })
    tele[i].canvas = canvas
    tele[i].ridimensiona()
  }
  return tele[i]
}
const figura = id => (props.pittori
  ? { che: 'ritratto', x: 17, y: 17, bestia: id }
  : { che: 'mostro', x: 17, y: 23, bestia: id, vola: false, vita: 1, gelo: 0 })

function gira(ts) {
  // il ritratto respira come sul campo: fermo sembrava un francobollo
  telaDi(0, ritratto.value)?.disegna([figura(props.bestia.id)], ts / 1000)
  if (props.bestia.con) telaDi(1, ritrattoCon.value)?.disegna([figura(props.bestia.con.id)], ts / 1000)
  raf = requestAnimationFrame(gira)
}

onMounted(() => { raf = requestAnimationFrame(gira) })
onUnmounted(() => cancelAnimationFrame(raf))
watch(() => [props.bestia.id, props.bestia.con?.id], () => tele.forEach(t => t?.ridimensiona()))
</script>

<template>
  <div class="scheda" :data-scheda-mista="bestia.con ? '' : null">
    <div class="faccia"><canvas ref="ritratto"></canvas></div>
    <div v-if="bestia.con" class="faccia"><canvas ref="ritrattoCon"></canvas></div>
    <div v-if="!bestia.con" class="dati">
      <b>{{ bestia.capo ? '👑 ' + bestia.nome + ' gigante' : bestia.nome }}</b>
      <i v-if="bestia.vola">vola</i>
      <span class="riga">❤️ {{ vita }} · ×{{ quanti }}</span>
      <span v-if="bestia.immune && bestia.immune.length" class="resiste" data-scheda-immune>
        immune a {{ bestia.immune.map(k => TORRI[k].emoji).join(' ') }}
      </span>
      <span v-if="bestia.abilita" class="fa" data-scheda-abilita>
        {{ ABILITA[bestia.abilita].emoji }} {{ ABILITA[bestia.abilita].nome }}
      </span>
    </div>
    <!-- la mista: una riga per tipo, perché quello che conta è che le
         due immunità non coincidono -->
    <div v-else class="dati">
      <b>{{ bestia.nome }} e {{ bestia.con.nome }}</b>
      <span class="riga">❤️ {{ vita }} · ×{{ quanti }}</span>
      <span v-for="x in [bestia, bestia.con]" :key="x.id" class="resiste"
            data-scheda-immune :data-per="x.id">
        {{ x.nome }}: {{ x.immune.length ? 'immune a ' + x.immune.map(k => TORRI[k].emoji).join(' ') : 'nessuna immunità' }}{{ x.abilita ? ' · ' + ABILITA[x.abilita].emoji : '' }}
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
/* la mista ha due facce e due righe di immunità: le righe non si
   devono troncare, perché sono proprio quello che c'è da leggere */
.scheda[data-scheda-mista] { max-width:66% }
.scheda[data-scheda-mista] .resiste { white-space:normal }
/* quello che fa quando cade: non è un divieto, è una cosa da aspettarsi */
.fa { font-size:9px; font-weight:800; color:var(--viola-scuro); margin-top:1px; white-space:nowrap }
</style>
