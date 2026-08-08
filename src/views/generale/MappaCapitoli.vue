<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA DEI CAPITOLI di una storia.

   Non è la lista piatta di prima. Tre cose la distinguono:

     · **lo stato non è il numero**: un capitolo è fatto, aperto, chiuso
       o ancora da disegnare, e chi lo decide è `apertoIl()` in
       `store/storie.js` — questa schermata non fa mai i conti da sé;
     · **gli aperti sono al plurale**: oggi ce n'è uno, e il giorno in cui
       un capitolo dichiarerà i suoi prerequisiti ce ne saranno due o
       tre. Qui non c'è una riga che dia per scontato «quello dopo»;
     · **il racconto si legge dove sei**: il capitolo aperto è l'unico
       che si apre per intero, con la sua riga di storia e cosa si porta
       dietro dai capitoli prima.
   ═══════════════════════════════════════════════════════════════════ */
import { computed, ref } from 'vue'
import { STORIA, FORMA } from '../../data/storie-generale.js'
import { apertoIl, fattoIl, stelleDi, avanzamento, azzeraStoria } from '../../store/storie.js'
import { mappaDi } from '../../data/mappe-storie.js'

const props = defineProps({ storiaId: { type: String, required: true } })
const emit = defineEmits(['apri'])

const chiedo = ref(false)      // il cartello della conferma
const giro = ref(0)            // batte quando lo stato cambia: rinfresca i conti

const storia = computed(() => STORIA[props.storiaId])
const stato = computed(() => { giro.value; return avanzamento(props.storiaId) })

const capitoli = computed(() => {
  giro.value
  return (storia.value?.capitoli || []).map((c, n) => {
    const fatto = fattoIl(props.storiaId, n)
    const aperto = !fatto && apertoIl(props.storiaId, n)
    const l = mappaDi(props.storiaId, n)
    const mappa = !!l
    /* ATTENZIONE: nei capitoli arricchiti `storia` è l'id della storia,
       non il racconto — glielo riscrive `conCassetta()`. Il racconto per
       intero lo tiene lo scenario; se lo scenario non c'è ancora, si
       legge la dritta del capitolo, che c'è sempre. */
    return { ...c, n, fatto, aperto, mappa,
             racconto: (l && (l.racconto || l.dritta)) || c.dritta || '',
             /* il par vero è quello dello scenario: quello del capitolo
                è una stima scritta prima che la mappa esistesse */
             par: (l && l.par) || c.par,
             stato: fatto ? 'fatto' : aperto ? (mappa ? 'aperto' : 'presto') : 'chiuso',
             stelle: stelleDi(props.storiaId, c.id) }
  })
})

function azzera () {
  azzeraStoria(props.storiaId)
  chiedo.value = false
  giro.value++
}
</script>

<template>
  <div v-if="storia" class="capitoli">
    <p class="intro">{{ storia.sottotitolo }}</p>

    <div v-for="c in capitoli" :key="c.id" class="capitolo" :class="c.stato">
      <button class="testa" :disabled="c.stato === 'chiuso' || c.stato === 'presto'"
              @click="$emit('apri', c.n)">
        <span class="num">{{ c.stato === 'fatto' ? '✓' : c.stato === 'chiuso' ? '🔒'
                           : c.stato === 'presto' ? '🛠' : c.n + 1 }}</span>
        <span class="che">
          <b>{{ c.emoji }} {{ c.nome }}</b>
          <i>{{ FORMA[c.forma]?.nome || '' }}</i>
        </span>
        <span class="voto">
          <span v-if="c.stelle" class="stelle">{{ '⭐'.repeat(c.stelle) }}</span>
          <small v-else-if="c.stato === 'aperto'">par {{ c.par }}</small>
        </span>
      </button>

      <!-- dove sei: il racconto per intero, e cosa ti porti dietro -->
      <div v-if="c.aperto" class="dentro">
        <p class="racconto" v-html="c.racconto"></p>
        <p class="obiettivo"><b>Serve che</b> {{ c.obiettivo }}</p>
        <ul v-if="c.eredita.length" class="fili">
          <li v-for="e in c.eredita" :key="e.filo">🧵 {{ e.come }}</li>
        </ul>
        <button v-if="c.mappa" class="gioca" @click="$emit('apri', c.n)">▶ Gioca il capitolo</button>
        <p v-else class="muto">Questo capitolo non ha ancora la sua mappa: sta arrivando.</p>
      </div>
    </div>

    <!-- ═══ ricominciare ═══ l'unica cosa distruttiva del gioco ═══ -->
    <button v-if="stato.cominciata" class="ricomincia" @click="chiedo = true">
      ↺ Ricomincia la storia</button>

    <div v-if="chiedo" class="conferma">
      <div class="foglio">
        <span class="urlo">↺</span>
        <h3>Ricominci <b>{{ storia.nome }}</b> da capo.</h3>
        <p>Torni al primo capitolo e quello che hai lasciato dietro si perde.
          <b>Le stelle restano</b>: quelle già prese non te le toglie nessuno.</p>
        <div class="due">
          <button class="grigio" @click="chiedo = false">No, continuo</button>
          <button class="rosso" @click="azzera">Sì, ricomincio</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.capitoli { flex:1; min-height:0; overflow-y:auto; position:relative;
            padding:10px 12px calc(16px + env(safe-area-inset-bottom)) }
.intro { font-size:12.5px; line-height:1.45; color:var(--tenue); margin:0 0 12px }

.capitolo { margin-bottom:8px }
.testa { display:flex; align-items:center; gap:11px; width:100%; text-align:left;
         background:var(--carta); border-radius:16px; padding:10px 12px; min-height:60px;
         box-shadow:0 3px 0 #dde3ea }
.capitolo.aperto .testa { box-shadow:0 3px 0 #dde3ea, inset 0 0 0 2px var(--giallo) }
.capitolo.chiuso .testa, .capitolo.presto .testa { opacity:.55; box-shadow:none }
.testa .num { width:36px; height:36px; flex:none; border-radius:12px; background:#eef2f9;
              display:grid; place-items:center; font-size:15px; font-weight:900; color:var(--tenue) }
.capitolo.fatto .num { background:var(--verde); color:#06210f }
.capitolo.aperto .num { background:var(--giallo); color:#3a2c00 }
.testa .che { flex:1; min-width:0 }
.testa .che b { display:block; font-size:14.5px; font-weight:900; color:var(--viola-scuro) }
.testa .che i { font-style:normal; font-size:11px; color:var(--tenue) }
.testa .voto { flex:none; text-align:right; font-size:12px }
.testa .voto small { font-size:10px; color:var(--tenue); font-weight:800 }

.dentro { margin:5px 0 0 16px; padding:8px 10px; border-left:3px solid var(--giallo);
          background:#fffdf3; border-radius:0 12px 12px 0 }
.racconto { margin:0 0 6px; font-size:12.5px; line-height:1.5; color:var(--viola-scuro) }
.obiettivo { margin:0 0 6px; font-size:12px; line-height:1.4; color:var(--tenue) }
.obiettivo b { color:#b5891f }
.fili { margin:0 0 7px; padding:0; list-style:none; display:grid; gap:3px }
.fili li { font-size:11.5px; line-height:1.35; color:var(--tenue) }
.gioca { display:block; width:100%; min-height:46px; border-radius:13px; font-size:14.5px;
         font-weight:900; background:linear-gradient(180deg,#6fd39a,#41b878); color:#06280f;
         box-shadow:0 3px 0 #2b8a53 }
.muto { margin:0; font-size:11.5px; color:var(--tenue) }

.ricomincia { display:block; width:100%; min-height:44px; margin-top:14px; border-radius:13px;
              font-size:12.5px; font-weight:900; color:#a8322c; background:#ffffffcc;
              box-shadow:0 2px 0 #e7d4d1 }

.conferma { position:fixed; inset:0; z-index:30; display:grid; place-items:center; padding:22px;
            background:#0b1020aa }
.conferma .foglio { background:var(--carta); border-radius:18px; padding:18px 16px;
                    max-width:330px; text-align:center; box-shadow:0 10px 30px #0006 }
.conferma .urlo { font-size:34px }
.conferma h3 { margin:6px 0 8px; font-size:15.5px; color:var(--viola-scuro) }
.conferma p { margin:0 0 14px; font-size:12.5px; line-height:1.5; color:var(--tenue) }
.conferma .due { display:flex; gap:9px }
.conferma .due button { flex:1; min-height:46px; border-radius:13px; font-size:13.5px;
                        font-weight:900 }
.conferma .grigio { background:#eef2f9; color:var(--viola-scuro); box-shadow:0 3px 0 #dde3ea }
.conferma .rosso { background:#e0554d; color:#fff; box-shadow:0 3px 0 #a83b34 }
</style>
