<script setup>
/* ═══════════════════════════════════════════════════════════════════
   SCEGLI L'AVVENTURA — la prima cosa che si vede entrando nel Generale.

   Prima di qui c'era una fila di quattordici livelli numerati, e
   «riprendi da dove eri» voleva dire «il numero dopo». Le storie non
   sono una fila: sono cinque, si scelgono, e quella di Bibi deve poter
   essere la prima per chi ha sei anni.

   Le quattordici prove non spariscono — sono il banco di prova, una
   idea per livello — ma stanno sotto, in una voce loro.
   ═══════════════════════════════════════════════════════════════════ */
import { computed } from 'vue'
import { elencoStorie } from '../../store/storie.js'
import { quanteMappe } from '../../data/mappe-storie.js'
import { genProgresso } from '../../store/profile.js'
import { QUANTI } from '../../data/generale.js'

defineEmits(['apri', 'prove'])

const storie = computed(() => elencoStorie().map(s => ({ ...s, mappe: quanteMappe(s.id) })))
const prove = computed(() => {
  const g = genProgresso()
  return { fatte: Math.min(g.tappa || 0, QUANTI),
           stelle: Object.values(g.stelle || {}).reduce((n, s) => n + s, 0) }
})
</script>

<template>
  <div class="scelta-avv">
    <p class="intro">Ogni avventura è una <b>storia a capitoli</b>: quello che fai in uno
      te lo ritrovi in quelli dopo.</p>

    <button v-for="s in storie" :key="s.id" class="avventura"
            :class="{ finita: s.finita, nuova: !s.cominciata }" @click="$emit('apri', s.id)">
      <span class="em">{{ s.emoji }}</span>
      <span class="che">
        <b>{{ s.nome }}</b>
        <i>{{ s.sottotitolo }}</i>
        <span v-if="s.fatti" class="barra"><span :style="{ width: (s.fatti / s.quanti * 100) + '%' }"></span></span>
      </span>
      <span class="dove">
        <b>{{ s.fatti }} <small>di {{ s.quanti }}</small></b>
        <span v-if="s.stelle" class="stelle">⭐ {{ s.stelle }}</span>
        <span v-else-if="!s.mappe" class="presto">in arrivo</span>
        <span v-else class="via">comincia →</span>
      </span>
    </button>

    <div class="riga-titolo">e poi, quando vuoi</div>

    <button class="avventura prove" @click="$emit('prove')">
      <span class="em">🎖️</span>
      <span class="che">
        <b>Le prove</b>
        <i>quattordici livelli sciolti, uno per idea: si aprono in fila</i>
        <span v-if="prove.fatte" class="barra"><span :style="{ width: (prove.fatte / QUANTI * 100) + '%' }"></span></span>
      </span>
      <span class="dove">
        <b>{{ prove.fatte }} <small>di {{ QUANTI }}</small></b>
        <span v-if="prove.stelle" class="stelle">⭐ {{ prove.stelle }}</span>
        <span v-else class="via">allenati →</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.scelta-avv { flex:1; min-height:0; overflow-y:auto;
              padding:10px 12px calc(16px + env(safe-area-inset-bottom)) }
.intro { font-size:13px; line-height:1.45; color:var(--tenue); margin:0 0 12px }

.avventura { display:flex; align-items:center; gap:11px; width:100%; text-align:left;
             margin-bottom:9px; background:var(--carta); border-radius:16px; padding:11px 12px;
             min-height:72px; box-shadow:0 3px 0 #dde3ea }
.avventura:active { transform:translateY(2px); box-shadow:none }
.avventura .em { flex:none; width:42px; height:42px; border-radius:13px; background:#eef2f9;
                 display:grid; place-items:center; font-size:22px }
.avventura.finita .em { background:var(--verde) }
.avventura .che { flex:1; min-width:0; display:grid; gap:3px }
.avventura .che b { font-size:15px; font-weight:900; color:var(--viola-scuro) }
.avventura .che i { font-style:normal; font-size:11.5px; line-height:1.3; color:var(--tenue);
                    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
                    overflow:hidden }
.avventura .barra { display:block; height:5px; border-radius:3px; background:#e7ecf5;
                    overflow:hidden; margin-top:2px }
.avventura .barra span { display:block; height:100%; border-radius:3px;
                         background:linear-gradient(90deg,#6fd39a,#41b878) }
.avventura .dove { flex:none; text-align:right; display:grid; gap:3px; justify-items:end }
.avventura .dove b { font-size:14px; font-weight:900; color:var(--viola-scuro); white-space:nowrap }
.avventura .dove b small { font-size:10.5px; font-weight:800; color:var(--tenue) }
.avventura .dove .stelle { font-size:11px; font-weight:900; color:#b5891f }
.avventura .dove .via { font-size:10.5px; font-weight:900; color:#4a86e8 }
.avventura .dove .presto { font-size:10.5px; font-weight:900; color:var(--tenue) }

.riga-titolo { font-size:10px; font-weight:900; letter-spacing:.7px; text-transform:uppercase;
               color:var(--tenue); margin:16px 2px 7px }
.avventura.prove { background:#f4f7fb }
.avventura.prove .em { background:#e6ecf6 }
</style>
