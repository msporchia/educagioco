<script setup>
/* ═══════════════════════════════════════════════════════════════════
   COSA SO A MENTE — l'altra metà di «Cosa so».

   Le tabelline si guardano in una tavola pitagorica: 55 caselle, una per
   fatto. Il calcolo a mente no, perché dietro «somme col riporto» ci
   stanno infiniti calcoli e una casella per ciascuno non esiste. Qui la
   riga è la STRATEGIA — quella che il gioco chiama trucco — e la barra
   dice quanto regge adesso.

   Tre stati, e servono tutti e tre:
     · chiuso   → i prerequisiti non ci sono ancora (e si dice quali)
     · aperto   → ci si sta lavorando, la barra sale
     · in mano  → regge, ma può tornare indietro se non si ripassa

   È una pagina di progressi come `MappaTabelline`: stessa veste, stessi
   colori, e si esce dal tasto della barra in cima.
   ═══════════════════════════════════════════════════════════════════ */
import { ref, computed } from 'vue'
import { state, calcProgresso } from '../store/profile.js'
import { STAZIONI, CONCETTI_PER_ID } from '../data/calcolo.js'
import { forzaDi, saldo, aperto, prereqDeboli, tabellineSalde, SALDO } from '../store/calcolo.js'

/* il momento in cui si è aperta la pagina: la forza efficace dipende da
   "adesso", e va letto una volta sola perché le barre non ballino */
const adesso = ref(Date.now())
const scelto = ref(null)

const items = () => state.profile.items
const tabelline = computed(() => tabellineSalde(items(), adesso.value))

const arrivato = computed(() => calcProgresso().tappa)

const righe = computed(() => STAZIONI.filter(s => s.nuovi.length).map(s => ({
  ...s,
  /* Chiuso vuol dire «il gioco non te l'ha ancora messo davanti», e questo
     lo dice la STAZIONE. I prerequisiti deboli non chiudono niente: la
     stazione a cui si è arrivati si gioca comunque, e il gioco ci mette
     dentro anche il ripasso di quello che manca. */
  chiusa: s.i > arrivato.value,
  concetti: s.nuovi.map(id => {
    const c = CONCETTI_PER_ID[id]
    const f = forzaDi(id, items(), adesso.value)
    const ok = saldo(id, items(), adesso.value)
    /* le tabelline non sono un prerequisito come gli altri: stanno
       nell'altra campagna, e va detto dove andarle a prendere */
    const mancanti = c.tabelline && tabelline.value.length < c.tabelline
      ? c.tabelline - tabelline.value.length : 0
    const chiuso = s.i > arrivato.value || !!mancanti
    return {
      ...c, forza: f, saldo: ok, aperto: aperto(id, items(), adesso.value, tabelline.value),
      quota: Math.min(100, Math.round((f / SALDO) * 100)) + '%',
      stato: chiuso ? 'chiuso' : ok ? 'mano' : f > 0 ? 'lavoro' : 'nuovo',
      stazione: s.i + 1,
      lontano: s.i > arrivato.value,
      manca: prereqDeboli(id, items(), adesso.value)
        .map(p => CONCETTI_PER_ID[p].nome.toLowerCase()),
      tabelline: mancanti,
    }
  }),
})))

const inMano = computed(() =>
  righe.value.flatMap(r => r.concetti).filter(c => c.saldo).length)
const totali = computed(() => righe.value.flatMap(r => r.concetti).length)
const quota = computed(() => Math.round((inMano.value / totali.value) * 100) + '%')

const ETICHETTE = { chiuso: 'non ancora', nuovo: 'da provare',
                    lavoro: 'ci stai lavorando', mano: 'ce l\'hai in mano' }
</script>

<template>
  <div class="mappa">
    <div class="testata">
      <div class="quanti" :class="{ zero: !inMano }"><b>{{ inMano }}</b><i>su {{ totali }}</i></div>
      <div class="chi">
        <b>Trucchi che hai in mano</b>
        <div class="barretta"><i :style="{ width: quota }"></i></div>
        <p class="mini">Un trucco non è un calcolo: è un modo di farlo, e vale per
          tutti i numeri. Anche questo torna indietro se non lo usi.</p>
      </div>
    </div>

    <div v-for="r in righe" :key="r.i" class="riquadro">
      <div class="tit">{{ r.emoji }} {{ r.nome }}</div>
      <button v-for="c in r.concetti" :key="c.id" class="voce" :class="c.stato"
              :aria-label="c.nome + ': ' + ETICHETTE[c.stato]"
              @click="scelto = scelto && scelto.id === c.id ? null : c">
        <span class="segno">{{ c.segno }}</span>
        <b>{{ c.nome }}</b>
        <span class="barretta piccola"><i :style="{ width: c.quota }"></i></span>
        <em v-if="c.stato === 'mano'">⭐</em>
        <em v-else-if="c.stato === 'chiuso'">🔒</em>
      </button>
      <div v-if="scelto && r.nuovi.includes(scelto.id)" class="spiega">
        <b>💡 {{ scelto.dritta }}</b>
        <i v-if="scelto.lontano">Si apre alla stazione {{ scelto.stazione }}.</i>
        <i v-else-if="scelto.tabelline">Prima servono ancora {{ scelto.tabelline }}
          tabelline: si prendono dai pianeti.</i>
        <i v-else-if="scelto.saldo">Ce l'hai in mano: i numeri cresceranno da soli.</i>
        <i v-else-if="scelto.manca.length">Si gioca, e insieme si ripassa
          {{ scelto.manca.join(', ') }}.</i>
        <i v-else>Più lo usi, più i numeri diventano grandi.</i>
      </div>
    </div>

    <p class="mini nota">Le stazioni si aprono in fila, ma i trucchi si aprono quando
      sono pronti i loro: per moltiplicare a mente servono prima le tabelline.</p>
  </div>
</template>

<style scoped>
.mappa { display:flex; flex-direction:column; align-items:center; gap:11px;
         width:100%; max-width:420px; color:var(--testo) }
.mappa > * { flex:none }

.testata { display:flex; align-items:center; gap:13px; width:100%; padding:12px 15px;
           border-radius:20px; background:linear-gradient(120deg,#e8f0ff,#fffffff0);
           box-shadow:0 5px 0 #dde3ea, 0 10px 22px #8593a822; text-align:left }
.quanti { flex:none; width:66px; height:66px; border-radius:50%; display:grid;
          place-content:center; text-align:center; line-height:1.05;
          background:linear-gradient(180deg,#4fd08a,#2ba45f); box-shadow:0 4px 0 #1d8a4d }
.quanti b { font-size:26px; font-weight:900; color:#fff }
.quanti i { font-style:normal; font-size:10.5px; font-weight:800; color:#ffffffdd }
.quanti.zero { background:linear-gradient(180deg,#c6cddd,#a7b1c6); box-shadow:0 4px 0 #93a0b8 }
.chi { flex:1; min-width:0 }
.chi > b { font-size:15px; font-weight:900; color:var(--viola-scuro) }
.chi .mini { text-align:left; margin-top:5px; line-height:1.35 }
.barretta { height:10px; border-radius:999px; background:#e7dcf7; overflow:hidden; margin-top:6px }
.barretta i { display:block; height:100%; border-radius:999px; transition:width .5s;
              background:linear-gradient(90deg,#38c172,#8de0a8) }

.riquadro { width:100%; background:var(--carta); border-radius:18px; padding:11px 12px;
            box-shadow:0 4px 0 #e9ddf5; display:flex; flex-direction:column; gap:6px }
.tit { font-size:13px; font-weight:900; color:var(--viola-scuro); margin-bottom:1px }

.voce { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:4px 10px;
        padding:7px 10px; border:0; border-radius:12px; background:#f4f6fb; text-align:left }
.voce .segno { grid-area:1/1/3/2; font-size:19px; font-weight:900; color:var(--viola);
               width:22px; text-align:center }
.voce b { grid-area:1/2/2/3; font-size:14px; font-weight:800; color:var(--viola-scuro) }
/* la colonna della medaglia va fissata: lasciata all'automatico finiva in
   mezzo al nome e spingeva il testo a destra */
.voce em { grid-area:1/3/3/4; font-style:normal; font-size:16px }
.voce .barretta.piccola { grid-area:2/2/3/3; height:7px; margin-top:2px; background:#e2e7f2 }
.voce.mano { background:linear-gradient(120deg,#e9f7ea,#fbfffb) }
.voce.chiuso { opacity:.55 }
.voce.chiuso b { color:var(--tenue) }
.voce.chiuso .barretta.piccola i { background:#c6cddd }

.spiega { padding:9px 11px; border-radius:12px; background:#eef3ff; text-align:left;
          display:flex; flex-direction:column; gap:4px }
.spiega b { font-size:13.5px; font-weight:800; color:var(--viola-scuro); line-height:1.4 }
.spiega i { font-style:normal; font-size:12px; font-weight:700; color:var(--tenue) }

.nota { max-width:340px; line-height:1.4 }
</style>
