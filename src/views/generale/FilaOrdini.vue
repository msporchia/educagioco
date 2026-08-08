<script setup>
/* ═══════════════════════════════════════════════════════════════════
   UNA FILA DI ORDINI — righe fatte di caselle, e un posto vuoto in fondo

   Si legge dall'alto in basso e si esegue in quell'ordine. Ci stanno
   due cose, e si vedono diverse a colpo d'occhio:

     · un ORDINE — una riga sola: il verbo, e le sue caselle;
     · un BLOCCO CONDIZIONE — la domanda, e sotto i suoi due rami,
       ognuno con la sua fila piatta dentro.

   ── LA RIGA È L'EDITOR ───────────────────────────────────────────
   Ogni pezzo che si può cambiare è una CASELLA dentro la riga, e la
   casella è il tasto per cambiarla:

       🚶 vai a      [🏮 la lanterna]
       🔁 pattuglia  [①→②→③]  finché [👁 vedi qualcuno]
       ❓ se         [🥷 vedi Ras]

   Prima toccare una riga apriva sotto un pannello con titoli, elenchi
   e tre righe di spiegazione, e per cambiare il bersaglio bisognava
   cercarlo là dentro. Non c'è più niente da aprire: si tocca la cosa
   che si vuole cambiare.

   Una casella ancora da riempire si vede che è vuota — tratteggiata,
   con scritto cosa ci va (`＋ dove`) — e in fondo a ogni fila c'è il
   POSTO VUOTO, che è come si aggiunge un ordine: lo tocchi e ti si
   chiede cosa fa qui.

   Il blocco è l'unica cosa che rientra, e rientra di un dito solo:
   dentro un ramo non ci va un altro blocco (lo rifiuta anche il
   motore), quindi questo componente si annida al massimo una volta.
   Chi vuole di più usa i segnali e un secondo script — è la regola del
   gioco, non un limite di questo file.
   ═══════════════════════════════════════════════════════════════════ */
import { inject } from 'vue'
import { eCondizione, ramoDi, RAMI, VERBI, BLOCCHI } from '../../motore/generale.js'
import { puntiDi, stessaVia } from './piano.js'
import { cerchio } from './segni.js'

defineProps({
  voci: { type: Array, default: () => [] },      // [{ o, i }] con l'indice VERO nella fila
  perc: { type: Array, default: () => [] },      // dove sta questa lista nel piano
})
const E = inject('editor')

const via = (perc, i) => [...perc, i]
const viaRamo = (perc, i, r) => [...perc, i, r]
const conIndice = lista => (lista || []).map((o, k) => ({ o, i: k }))
const rami = o => RAMI.map(r => ({ ...r, voci: conIndice(ramoDi(o, r.ramo)) }))

const cl = o => (eCondizione(o) ? 'scelta' : (VERBI[o.verbo] || {}).cl || '')
const nome = o => (eCondizione(o) ? BLOCCHI.condizione.nome : (VERBI[o.verbo] || {}).nome || o.verbo)
const et = o => (eCondizione(o) ? BLOCCHI.condizione.et : (VERBI[o.verbo] || {}).et || '•')

/* ── DI COSA È FATTA UNA RIGA ──
   Le caselle di un ordine, in fila come si leggono. Ognuna sa da sola
   come si riempie: `cosa` chiede un bersaglio (elenco o mappa), `punti`
   i punti di un giro, `cond` una domanda. */
const UNA_PAROLA = { posto: 'dove', cella: 'dove', oggetto: 'cosa', porta: 'cosa',
                     unita: 'chi', fazione: 'chi', segnale: 'quale segnale', attimo: 'quanto' }
const chePosto = verbo => {
  const acc = (VERBI[verbo] || {}).accetta || []
  return UNA_PAROLA[acc[0]] || 'cosa'
}
function caselle (o) {
  if (eCondizione(o)) return [{ campo: 'cond', testo: E.frase(o.cond), vuota: 'la domanda' }]
  const out = []
  if (o.verbo === 'pattuglia')
    out.push({ punti: true, testo: puntiDi(o).map((_, k) => cerchio(k)).join('→'),
               vuota: 'i punti del giro' })
  else
    out.push({ cosa: true, testo: o.complemento ? E.comeSiChiama(o.complemento) : '',
               vuota: chePosto(o.verbo) })
  /* il «finché» c'è quando il verbo lo pretende (un giro senza uscita
     non finisce mai) o quando qualcuno ce l'ha messo */
  if ((VERBI[o.verbo] || {}).vuoleFinche || o.finche)
    out.push({ campo: 'finche', prima: 'finché', testo: E.frase(o.finche), vuota: 'finché' })
  return out
}
</script>

<template>
  <div class="fila-ordini">
    <div v-for="{ o, i } in voci" :key="i" class="ordi" :class="{ bivio: eCondizione(o) }"
         :data-i="i">
      <div class="riga" :class="[cl(o), E.statoRiga(via(perc, i))]">
        <span class="presa" aria-label="sposta" @pointerdown="E.presaGiu($event, via(perc, i))"
              @pointermove="E.presaMuovi" @pointerup="E.presaSu"
              @pointercancel="E.presaSu">⣿</span>
        <span class="ico">{{ et(o) }}</span>
        <span class="lab">{{ nome(o) }}</span>
        <!-- le caselle: quello che c'è scritto È il tasto per cambiarlo -->
        <template v-for="(c, k) in caselle(o)" :key="k">
          <i v-if="c.prima" class="giunto">{{ c.prima }}</i>
          <button class="casella" :class="{ manca: !c.testo, mira: E.mirando(via(perc, i), c) }"
                  @click.stop="E.tocca(via(perc, i), c)">
            {{ c.testo || '＋ ' + c.vuota }}</button>
        </template>
        <button class="viaqui" aria-label="togli l'ordine"
                @click.stop="E.togli(via(perc, i))">✕</button>
      </div>
      <div v-if="E.perche(via(perc, i))" class="perche">⚠ {{ E.perche(via(perc, i)) }}</div>

      <!-- ═════ I DUE RAMI ═════
           Non sono due ordini gemelli e non sono due blocchi annidati:
           sono le due strade dello stesso bivio, e ne parte sempre una
           sola. Ognuna è una fila piatta col suo posto vuoto in fondo. -->
      <div v-if="eCondizione(o)" class="rami">
        <div v-for="(r, k) in rami(o)" :key="r.ramo" class="ramo"
             :class="[r.ramo, { preso: E.ramoPreso(via(perc, i)) === r.ramo }]">
          <div class="capo">
            <span class="graffa" aria-hidden="true">{{ k === 1 ? '└' : '├' }}</span>
            <span class="et">{{ r.et }} {{ r.nome }}</span>
            <b v-if="E.ramoPreso(via(perc, i)) === r.ramo" class="ora">è partito questo</b>
          </div>
          <div class="corpo">
            <FilaOrdini :voci="r.voci" :perc="viaRamo(perc, i, r.ramo)" />
          </div>
        </div>
      </div>
    </div>

    <!-- ═════ IL POSTO VUOTO ═════
         Non è un tasto «aggiungi» messo da qualche parte: è la riga che
         ancora non c'è, dove sarà. Lo tocchi e ti si chiede cosa fa.
         La domanda per esteso la fa una volta sola, sul piano vuoto:
         dentro un ramo ci sono già scritte sopra due righe che dicono
         quando ci si passa, e ripeterlo due volte è rumore. -->
    <button class="posto" :class="{ solo: !voci.length && !perc.length }"
            @click.stop="E.chiedi(perc)">
      ＋<span v-if="!voci.length && !perc.length"> e qui cosa fa?</span></button>
  </div>
</template>

<style scoped>
.ordi { position:relative; transition:transform .12s ease }
.ordi.vola { z-index:5; transition:none }
.riga { display:flex; align-items:center; gap:6px; min-height:44px; border-radius:12px;
        padding:5px 8px; background:var(--carta); margin:4px 0; border-left:5px solid #c6cfdd;
        box-shadow:0 2px 0 #dde3ea }
.riga .presa { flex:none; width:18px; min-height:38px; display:grid; place-items:center;
               color:#a9b4c6; font-size:14px; touch-action:none; cursor:grab }
.riga .ico { font-size:16px; flex:none }
.riga .lab { flex:none; font-size:12px; color:var(--tenue); font-weight:800 }
.riga .giunto { flex:none; font-style:normal; font-size:11px; font-weight:800; color:var(--tenue) }

/* la casella: quello che l'ordine dice, ed è il posto dove metterci le
   mani. Vuota si vede che è vuota, e dice cosa ci va. */
.casella { flex:1; min-width:0; min-height:34px; padding:5px 9px; border-radius:10px;
           background:#eef2fb; box-shadow:inset 0 0 0 1.5px #d6def0; font-size:12.5px;
           font-weight:900; color:var(--viola-scuro); text-align:left; white-space:nowrap;
           overflow:hidden; text-overflow:ellipsis }
.casella:active { background:#e2e9f8 }
.casella.manca { background:#fff; box-shadow:inset 0 0 0 1.5px #cfd8e8; border:1px dashed #b9c4d8;
                 color:var(--tenue); font-weight:800 }
.casella.mira { box-shadow:inset 0 0 0 2px var(--giallo); background:#fff6d8 }

.riga .viaqui { flex:none; width:30px; height:30px; border:0; border-radius:9px;
                background:transparent; color:#a8b0c2; font-size:15px; font-weight:900 }
.riga .viaqui:active { background:#ffe4e4; color:#d0503f }
.riga.moto { border-left-color:#4a86e8 }
.riga.azione { border-left-color:#e8a33f }
.riga.ciclo { border-left-color:#3fb872 }
.riga.attesa { border-left-color:#b06be0 }
.riga.msg { border-left-color:#e0554d }
/* la decisione ha un colore suo: non è un'azione e non è un evento */
.riga.scelta { border-left-color:#8a63d2; background:#f6f2ff }
.riga.attivo { background:#fff6d8 }
.riga.guasta { background:#ffe6e3; border-color:#e0554d }
.riga.saltata { opacity:.65 }
.perche { margin:-2px 0 4px 28px; font-size:11px; line-height:1.3; color:#a8322c }
.riga.saltata + .perche { color:var(--tenue) }

/* ── il posto vuoto ── */
.posto { display:block; width:100%; min-height:32px; margin:2px 0 4px; border-radius:11px;
         border:1.5px dashed #c6cfdd; background:#ffffff66; color:#9aa6ba;
         font-size:14px; font-weight:900 }
.posto:active { background:var(--giallo); color:#3a2c00; border-style:solid }
.posto.solo { min-height:44px; font-size:12.5px; color:var(--tenue) }

/* ── i due rami ── rientrati di un dito, appesi alla riga di sopra */
.rami { margin:0 0 6px 10px }
.ramo .capo { display:flex; align-items:center; gap:6px; min-height:26px; padding:1px 4px }
.ramo .capo .graffa { flex:none; width:12px; color:#b3a2dd; font-size:14px; font-weight:900 }
.ramo .capo .et { flex:none; font-size:11px; font-weight:900; letter-spacing:.3px;
                  text-transform:uppercase; color:#6b52ab }
.ramo.falso .capo .et { color:#9a7f8c }
.ramo .capo .ora { font-size:10px; font-weight:900; color:#2a6b4a; background:#d8f3ea;
                   border-radius:7px; padding:2px 6px }
.ramo .corpo { margin:0 0 2px 14px; padding:1px 4px 2px; border-left:2px dashed #c9bced }
.ramo.preso > .capo .et { color:#1c6b3f }
</style>
