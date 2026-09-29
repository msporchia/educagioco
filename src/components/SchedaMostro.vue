<script setup>
// La scheda di chi sta arrivando: il mostro dell'ondata ingrandito, quanti
// ne restano, la vita, a quali torri è immune scritto a parole (vedi
// docs/castello/mostri.md). Il ritratto è lo stesso pittore del campo, su
// una tela piccola.
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { creaTela } from '../grafica/tela.js'
import { PITTORI } from '../grafica/castello.js'
import { TORRI } from '../data/ops.js'
import { ABILITA } from '../data/mostri.js'

const props = defineProps({
  bestia: { type: Object, required: true },   // { id, nome, vola, immune, abilita, capo, con? }
  vita: { type: Number, default: 0 },         // quanta ne ha uno solo
  quanti: { type: Number, default: 0 },       // quanti ne restano in campo
  pittori: { type: Object, default: null },   // i pittori di una pelle (il castello a sprite)
})

const ritratto = ref(null), ritrattoCon = ref(null)
let tele = [null, null], raf = 0

// il secondo riquadro compare e sparisce con le ondate miste
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
.resiste { font-size:9px; font-weight:800; color:#5b5468;
           background:#eceaf0; border-radius:999px;
           padding:1px 6px; margin-top:2px; white-space:nowrap; overflow:hidden;
           text-overflow:ellipsis }
.scheda[data-scheda-mista] { max-width:66% }
.scheda[data-scheda-mista] .resiste { white-space:normal }
.fa { font-size:9px; font-weight:800; color:var(--viola-scuro); margin-top:1px; white-space:nowrap }
</style>
