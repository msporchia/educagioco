<script setup>
/* Operazione in colonna. Si scrivono solo le cifre del risultato, da destra:
   i riporti si tengono a mente. Nella moltiplicazione a due cifre invece i
   prodotti parziali sono passaggi veri e vanno scritti tutti e due. */
import { ref, computed, watch } from 'vue'
import { cifre } from '../data/ops.js'
import { suono } from '../audio.js'

const props = defineProps({ op: { type: Object, required: true } })
const emit = defineEmits(['fatto'])

const passo = ref(0)
const scritte = ref({})          // 'ris0' | 'p1 2' | 'quo1' -> cifra
const errori = ref(0)
const sbagliata = ref('')
const rivelata = ref('')
let erroriCasella = 0
let inizio = performance.now()

watch(() => props.op, () => {
  passo.value = 0; scritte.value = {}; errori.value = 0
  sbagliata.value = ''; rivelata.value = ''; erroriCasella = 0
  inizio = performance.now()
}, { immediate: true })

const corrente = computed(() => props.op.passi[passo.value] || null)
const chiaveDi = p => p.k + p.col
const attiva = computed(() => (corrente.value ? chiaveDi(corrente.value) : ''))

/* colonne da disegnare, da sinistra a destra (indice = potenza di dieci) */
/* gli addendi possono essere più di due: `numeri` quando ci sono, altrimenti
   i soliti due. L'ultima riga è quella che porta il segno davanti. */
const righe = computed(() => props.op.numeri || [props.op.a, props.op.b])

/* Le colonne delle cifre. I simboli — l'operazione in alto, l'uguale davanti
   al risultato — stanno in una colonnina a parte sulla destra, quindi qui
   dentro non serve tenere posto per loro. */
const nCol = computed(() => {
  if (props.op.tipo === 'div') return 0
  return Math.max(props.op.colonne, ...righe.value.map(n => String(n).length))
})
const indici = computed(() => Array.from({ length: nCol.value }, (_, i) => nCol.value - 1 - i))

const cifraDi = (n, i) => cifre(n)[i]

function stato(k) {
  return { viva: attiva.value === k, err: sbagliata.value === k, spia: rivelata.value === k }
}
const mostra = (k, atteso) =>
  scritte.value[k] ?? (rivelata.value === k ? atteso : '')

function avanza() {
  passo.value++
  if (passo.value >= props.op.passi.length) {
    suono.ok()
    emit('fatto', { errori: errori.value, ms: performance.now() - inizio })
  }
}

function scrivi(d) {
  const p = corrente.value
  if (!p) return
  const k = chiaveDi(p)
  if (d === p.atteso) {
    scritte.value[k] = d
    sbagliata.value = ''; rivelata.value = ''; erroriCasella = 0
    suono.nota(720, 720, 0.07, 'triangle', 0.09)
    avanza()
  } else {
    errori.value++; erroriCasella++
    sbagliata.value = k
    suono.no()
    setTimeout(() => { if (sbagliata.value === k) sbagliata.value = '' }, 420)
    // dopo due tentativi si mostra la cifra e si va avanti: il gioco non deve incastrarsi
    if (erroriCasella >= 2) {
      rivelata.value = k
      setTimeout(() => {
        if (corrente.value && chiaveDi(corrente.value) === k) {
          scritte.value[k] = p.atteso; rivelata.value = ''; erroriCasella = 0
          avanza()
        }
      }, 900)
    }
  }
}

const suggerimento = computed(() => {
  const p = corrente.value
  if (!p) return ''
  if (p.k === 'p1') return `prima riga: ${props.op.a} × ${props.op.b % 10}`
  if (p.k === 'p2') return `seconda riga: ${props.op.a} × ${Math.floor(props.op.b / 10)}, spostata di uno`
  if (p.k === 'quo') return 'quante volte ci sta?'
  if (p.k === 'res') return 'e adesso il resto'
  if (props.op.doppia) return 'ora somma le due righe'
  return 'cifra del risultato — il riporto tienilo a mente'
})
</script>

<template>
  <div class="op">
    <!-- ═════ addizione / sottrazione / moltiplicazione ═════ -->
    <div v-if="op.tipo !== 'div'" class="griglia" :style="{ '--n': nCol }">
      <!-- i numeri da sommare (o sottrarre, o moltiplicare). Il segno
           dell'operazione sta in alto a destra, in una colonna sua: in mezzo
           alle cifre si perdeva, ed è la prima cosa che un bambino cerca. -->
      <template v-for="(n, r) in righe" :key="'n'+r">
        <div v-for="i in indici" :key="'n'+r+'-'+i" class="cella fissa">{{ cifraDi(n, i) ?? '' }}</div>
        <div class="cella simbolo">
          <span v-if="r === 0" class="segno">{{ op.segno }}</span>
        </div>
      </template>

      <!-- prodotti parziali, solo per il moltiplicatore a due cifre -->
      <template v-if="op.doppia">
        <!-- le colonne oltre le cifre del prodotto NON vanno disegnate come
             caselle da riempire, altrimenti sembrano compiti in sospeso -->
        <div v-for="i in indici" :key="'p1'+i" class="cella prima"
             :class="[{ somma: i < op.p1.length }, stato('p1'+i)]">{{ mostra('p1'+i, op.p1[i]) }}</div>
        <div class="cella simbolo prima"></div>
        <!-- la seconda riga è spostata di una colonna: l'ultima casella resta vuota -->
        <div v-for="i in indici" :key="'p2'+i" class="cella"
             :class="[{ somma: i >= 1 && i - 1 < op.p2.length }, i >= 1 ? stato('p2'+(i-1)) : {}]">
          <template v-if="i >= 1">{{ mostra('p2'+(i-1), op.p2[i-1]) }}</template>
          <span v-else class="vuoto">·</span>
        </div>
        <div class="cella simbolo"></div>
      </template>

      <!-- risultato, con l'uguale accanto: la riga in fondo è il risultato -->
      <div v-for="i in indici" :key="'s'+i" class="cella totale"
           :class="[{ somma: i < op.ris.length }, stato('ris'+i)]">{{ mostra('ris'+i, op.ris[i]) }}</div>
      <div class="cella simbolo totale"><span class="uguale">=</span></div>
    </div>

    <!-- ═════ divisione ═════ -->
    <div v-else class="divisione">
      <div class="dividendo">{{ op.a }}</div>
      <div class="divisore">{{ op.b }}</div>
      <div class="quoziente">
        <span v-for="(q, i) in op.quoziente" :key="i" class="cella somma" :class="stato('quo'+i)">
          {{ mostra('quo'+i, q) }}
        </span>
      </div>
      <div class="resto">
        resto
        <span class="cella somma" :class="stato('res0')">{{ mostra('res0', op.resto) }}</span>
      </div>
    </div>

    <div class="dritta">{{ suggerimento }}</div>

    <div class="tastiera">
      <button v-for="d in [1,2,3,4,5,6,7,8,9,0]" :key="d" @click="scrivi(d)">{{ d }}</button>
    </div>
  </div>
</template>

<style scoped>
.op { display:flex; flex-direction:column; align-items:center; gap:6px; width:100% }

.griglia { display:grid; grid-template-columns:repeat(var(--n), 1fr) 38px;
           gap:3px 4px; font-variant-numeric:tabular-nums;
           width:min(100%, calc(var(--n) * 46px + 38px)) }
/* la colonnina dei simboli: niente bordo, niente riga sotto — non è una cifra */
.cella.simbolo { border-top:none !important; background:none !important;
                 box-shadow:none !important }
.cella { display:flex; align-items:center; justify-content:center; height:34px;
         font-size:26px; font-weight:900; border-radius:8px }
.cella.fissa { color:var(--testo) }
.cella.somma { background:#ffffffcc; box-shadow:inset 0 0 0 2px #dde3ea; color:var(--viola-scuro) }
.cella.somma.viva { box-shadow:inset 0 0 0 3px var(--viola); background:#e7ecf9;
                    animation:battito 1.1s infinite }
.cella.err { animation:scuoti .4s; box-shadow:inset 0 0 0 3px var(--rosso) !important }
.cella.spia { color:var(--rosso); opacity:.85 }
/* il segno diceva l'operazione ma si perdeva fra le cifre: adesso sta in alto
   a destra, da solo, ed è il pezzo più colorato della griglia */
.segno { color:#fff; background:var(--viola); border-radius:9px;
         width:32px; height:32px; display:flex; align-items:center;
         justify-content:center; font-size:24px; font-weight:900;
         box-shadow:0 2px 0 #5b3fa8 }
.uguale { color:var(--viola); font-size:24px; font-weight:900 }
.vuoto { color:#c9bede; font-size:18px }
/* la riga sotto cui si scrive: bordo alto sulla prima riga di caselle */
.cella.prima, .cella.totale { border-top:3px solid var(--viola-scuro); border-radius:0 0 8px 8px }
.griglia:not(:has(.prima)) .cella.totale { border-top:3px solid var(--viola-scuro) }
@keyframes battito { 0%,100%{ background:#e7ecf9 } 50%{ background:#ddd2ff } }
@keyframes scuoti { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)}
                    50%{transform:translateX(5px)} 75%{transform:translateX(-3px)} }

.divisione { display:grid; grid-template-columns:auto auto; gap:2px 10px;
             align-items:center; font-size:26px; font-weight:900; font-variant-numeric:tabular-nums }
.dividendo { text-align:right }
.divisore { border-left:4px solid var(--viola); padding-left:12px; color:var(--viola);
             font-weight:900 }
.quoziente { grid-column:2; display:flex; gap:3px; border-top:3px solid var(--viola-scuro); padding-top:3px }
.quoziente .cella { width:34px }
.resto { grid-column:1/3; display:flex; align-items:center; gap:8px; justify-content:center;
         font-size:15px; color:var(--tenue); font-weight:800 }
.resto .cella { width:34px }

.dritta { font-size:12.5px; color:var(--tenue); min-height:16px; text-align:center }
.tastiera { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; width:100%; max-width:330px }
.tastiera button { padding:10px 0; border-radius:12px; background:#ffffffdd; font-size:20px;
                   font-weight:900; color:var(--viola-scuro); box-shadow:0 3px 0 #d4dce6 }
.tastiera button:active { transform:translateY(2px); box-shadow:0 1px 0 #d4dce6 }
</style>
