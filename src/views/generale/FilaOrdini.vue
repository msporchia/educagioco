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
       🔁 ripeti → (dentro: vai a […], vai a […])  smetti quando […]
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
import { eCondizione, eRipeti, eBlocco, ramoDi, corpoDi, RAMI, VERBI, BLOCCHI }
       from '../../motore/generale.js'

defineProps({
  voci: { type: Array, default: () => [] },      // [{ o, i }] con l'indice VERO nella fila
  perc: { type: Array, default: () => [] },      // dove sta questa lista nel piano
})
const E = inject('editor')

const via = (perc, i) => [...perc, i]
const viaRamo = (perc, i, r) => [...perc, i, r]
const conIndice = lista => (lista || []).map((o, k) => ({ o, i: k }))
const rami = o => RAMI.map(r => ({ ...r, voci: conIndice(ramoDi(o, r.ramo)) }))

const bloccoDi = o => eCondizione(o) ? BLOCCHI.condizione : eRipeti(o) ? BLOCCHI.ripeti : null
const cl = o => (bloccoDi(o) ? bloccoDi(o).cl : (VERBI[o.verbo] || {}).cl || '')
const nome = o => (bloccoDi(o) ? bloccoDi(o).nome : (VERBI[o.verbo] || {}).nome || o.verbo)
const et = o => (bloccoDi(o) ? bloccoDi(o).et : (VERBI[o.verbo] || {}).et || '•')

/* ── DI COSA È FATTA UNA RIGA ──
   Le caselle di un ordine, in fila come si leggono. Ognuna sa da sola
   come si riempie: `cosa` chiede un bersaglio (elenco o mappa), `punti`
   i punti di un giro, `cond` una domanda. */
const UNA_PAROLA = { posto: 'dove', cella: 'dove', oggetto: 'cosa', porta: 'cosa',
                     unita: 'chi', fazione: 'chi', segnale: 'quale segnale', attimo: 'quanto',
                     routine: 'quale azione' }
const chePosto = verbo => {
  const acc = (VERBI[verbo] || {}).accetta || []
  return UNA_PAROLA[acc[0]] || 'cosa'
}
function caselle (o) {
  if (eCondizione(o)) return [{ campo: 'cond', testo: E.frase(o.cond), vuota: 'la domanda' }]
  /* un ciclo non ha caselle nella sua riga: ha una fila di ordini sotto
     e l'uscita in fondo, che è dove si legge */
  if (eRipeti(o)) return []
  const out = []
  /* chi aspetta una DOMANDA non ha un bersaglio: la sua unica casella è
     la domanda, come per un bivio */
  if ((VERBI[o.verbo] || {}).vuoleCond && !o.complemento)
    return [{ campo: 'cond', testo: E.frase(o.cond), vuota: 'la domanda' }]
  out.push({ cosa: true, testo: o.complemento ? E.comeSiChiama(o.complemento) : '',
             vuota: chePosto(o.verbo) })
  /* L'USCITA SI CHIAMA «SMETTI QUANDO», e non è una parola più carina:
     è l'unica giusta. Il campo si chiama `finche` da sempre e il motore
     esce QUANDO la condizione diventa vera — cioè è un `until`. Scritto
     «pattuglia finché vedi un orco» si legge all'incontrario: sembra
     «continua MENTRE lo vedi», che è esattamente il contrario di quello
     che fa. In italiano ci vorrebbe «finché NON vedi», e il «non» in
     una riga che ha già l'interruttore «non» dentro la condizione è una
     trappola. «Smetti quando» non ha versi in cui leggerlo. */
  /* IL «SMETTI QUANDO» DI UN GIRO NON STA NELLA RIGA: sta in fondo ai
     punti, perché è lì che si legge. «pattuglia — smetti quando vedi
     gli orchi — ① ② ③» è scritto al contrario di come si dice: prima i
     giri che fai, poi quando la pianti. Gli altri verbi non hanno
     punti sotto, e per loro la casella resta dov'è. */
  if ((VERBI[o.verbo] || {}).vuoleFinche || o.finche)
    out.push({ campo: 'finche', prima: 'smetti quando', testo: E.frase(o.finche),
               vuota: 'la domanda' })
  return out
}
</script>

<template>
  <div class="fila-ordini">
    <div v-for="{ o, i } in voci" :key="i" class="ordi" :class="{ bivio: eBlocco(o) }"
         :data-i="i">
      <div class="riga" :class="[cl(o), E.statoRiga(via(perc, i))]">
        <span v-if="!E.sola" class="presa" aria-label="sposta" @pointerdown="E.presaGiu($event, via(perc, i))"
              @pointermove="E.presaMuovi" @pointerup="E.presaSu"
              @pointercancel="E.presaSu">⣿</span>
        <span class="ico">{{ et(o) }}</span>
        <span class="lab">{{ nome(o) }}</span>
        <!-- una riga senza caselle (il ciclo) non ha niente che si
             allarghi: senza questo, le sue tre cose finiscono in mezzo -->
        <i v-if="!caselle(o).length" class="riempi"></i>
        <!-- le caselle: quello che c'è scritto È il tasto per cambiarlo -->
        <template v-for="(c, k) in caselle(o)" :key="k">
          <i v-if="c.prima" class="giunto">{{ c.prima }}</i>
          <button class="casella" :class="{ manca: !c.testo, mira: E.mirando(via(perc, i), c) }"
                  @click.stop="E.tocca(via(perc, i), c, $event)">
            {{ c.testo || '＋ ' + c.vuota }}</button>
        </template>
        <button v-if="!E.sola" class="viaqui" aria-label="togli l'ordine"
                @click.stop="E.togli(via(perc, i))">✕</button>
      </div>
      <!-- ═════ IL CORPO DEL CICLO ═════
           Gli ordini che rifà in tondo, e in fondo l'uscita. È la
           stessa forma dei rami di un bivio — una fila piatta rientrata
           sotto la sua riga — perché è la stessa cosa: un blocco che
           contiene ordini. -->
      <div v-if="eRipeti(o)" class="ciclo">
        <div class="corpo">
          <FilaOrdini :voci="conIndice(corpoDi(o))" :perc="viaRamo(perc, i, 'corpo')" />
        </div>
        <div class="uscita">
          <i class="giunto">smetti quando</i>
          <button class="casella" :class="{ manca: !E.frase(o.finche) }"
                  @click.stop="E.tocca(via(perc, i), { campo: 'finche' }, $event)">
            {{ E.frase(o.finche) || '＋ la domanda' }}</button>
        </div>
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
    <!-- l'evento serve a una cosa sola: la domanda si apre attaccata a
         QUESTO tasto, non in fondo allo schermo -->
    <button v-if="!E.sola" class="posto" :class="{ solo: !voci.length && !perc.length }"
            @click.stop="E.chiedi(perc, $event)">
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
.riga .riempi { flex:1 }

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
/* chiamare un'azione: verde come il riquadro dell'azione, così si vede
   che quella riga e quel pezzo di piano sono la stessa cosa */
.riga.chiama { border-left-color:#3fb872 }
/* la decisione ha un colore suo: non è un'azione e non è un evento */
.riga.scelta { border-left-color:#8a63d2; background:#f6f2ff }
.riga.attivo { background:#fff6d8 }
.riga.guasta { background:#ffe6e3; border-color:#e0554d }
.riga.saltata { opacity:.65 }
.perche { margin:-2px 0 4px 28px; font-size:11px; line-height:1.3; color:#a8322c }
.riga.saltata + .perche { color:var(--tenue) }

/* ── i punti del giro ── una lista che cresce, rientrata sotto la sua
   riga come i rami di un bivio: si vede che appartengono a quell'ordine */
.punti { margin:-2px 0 4px 22px; padding:1px 4px 2px; border-left:2px dashed #a8dcc0 }
.punto { display:flex; align-items:center; gap:6px; margin:3px 0 }
.punto .cerchio { flex:none; width:20px; text-align:center; font-size:13px; font-weight:900;
                  color:#2a8a63 }
.punto .casella { flex:1 }
.punto .viaqui { flex:none; width:28px; height:28px; border:0; border-radius:9px;
                 background:transparent; color:#a8b0c2; font-size:14px; font-weight:900 }
.punto .viaqui:active { background:#ffe4e4; color:#d0503f }
.punto-nuovo { min-height:32px; font-size:12px; border-color:#a8dcc0; color:#2a8a63 }
/* ── il corpo di un ciclo ── rientrato sotto la sua riga come i rami di
   un bivio: si vede a colpo d'occhio che quegli ordini stanno DENTRO il
   giro, e non dopo. È la stessa forma perché è la stessa cosa — un
   blocco che contiene una fila. */
.ciclo { margin:0 0 6px 10px }
.ciclo .corpo { margin:0 0 2px 14px; padding:1px 4px 2px; border-left:2px dashed #a8dcc0 }
.uscita { display:flex; align-items:center; gap:6px; margin:4px 0 2px 24px }
.uscita .giunto { flex:none; font-style:normal; font-size:11px; font-weight:800; color:var(--tenue) }
.uscita .casella { flex:1 }
.posto.mira, .casella.mira { box-shadow:inset 0 0 0 2px var(--giallo); background:#fff6d8 }

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
